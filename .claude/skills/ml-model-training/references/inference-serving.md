# Inference Serving Reference

> Export, quantization, batching, and serving for PyTorch 2 / TensorFlow 2 models in production.

## Export Paths

| Path | When | Command / API |
|---|---|---|
| ONNX (PyTorch) | CUDA/CPU, onnxruntime or Triton | `torch.onnx.export(model, example, "model.onnx", input_names=["x"], output_names=["y"], dynamic_axes={"x": {0: "batch"}}, opset_version=17)` |
| ONNX (TensorFlow) | Convert SavedModel once | `python -m tf2onnx.convert --saved-model ./saved --output model.onnx --opset 17` |
| TFLite | Mobile / edge / embedded CPU | `tf.lite.TFLiteConverter.from_saved_model(...)` — see Quantization |
| TorchScript | Legacy; only for libtorch C++ runtime | `torch.jit.trace(...)` / `torch.jit.script(...)` |

On torch 2.5+, prefer `torch.export.export(model, example)` then export from the `ExportedProgram` — the graph is fully traced and the exporter rejects unsupported ops up front instead of silently. Verify any export before moving on: load with `onnxruntime.InferenceSession`, run the example input, assert output matches the eager model within `1e-3`. Opset 17 covers what torch 2.x emits; bump only when the exporter asks.

## Quantization

| Method | Weights/Activations | Data needed | Best for |
|---|---|---|---|
| Post-training dynamic | int8 weights, float activations | None | CPU, Linear/Embedding-heavy; smallest accuracy loss |
| Post-training static | int8 both | ~100-500 calibration batches | Full int8 kernels on CPU/GPU |
| QAT | int8 both (fake-quant in training) | Training set + 1-2 fine-tune epochs | Accuracy-critical models that fail PTQ |

```python
# dynamic (PyTorch): Linear/Embedding only, no calibration data
quantized = torch.ao.quantization.quantize_dynamic(model, {torch.nn.Linear, torch.nn.Embedding}, dtype=torch.qint8)

# full int8 (TensorFlow Lite): representative dataset pins activation ranges
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = lambda: (calib[i:i+1] for i in range(200))
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
```

**Accuracy gate (mandatory):** after any quantization, rerun the same evaluation script on the same frozen eval set (see training-ops.md) and compare against fp32. Ship only within a stated threshold — classification ±0.5 accuracy point, regression within eval noise. On failure, go dynamic-only first, then per-layer sensitivity analysis (quantize one layer at a time) instead of QAT on everything.

## Batching

- **Dynamic batching:** queue requests and run N at once. N (`max_batch_size`) 4-32 typical — GPU throughput rises until the fill point, then p99 grows faster than throughput. Triton enables this with `dynamic_batching {}` in the model config; under FastAPI you implement it yourself (semaphore + timed flush, e.g. collect up to 200ms or 16 requests).
- **Padding (NLP):** pad to length buckets `[64, 128, 256]` with a length-aware queue — never pad-to-max. Buckets cut wasted compute roughly 2-4x; truncate past the top bucket.

## Latency Budgets & Profiling

Set the budget per route on p99, not p50, before serving. Typical split for a small transformer on one GPU: model forward 8-30ms, tokenization 1-3ms, serialization <1ms.

```python
from torch.profiler import profile, ProfilerActivity
with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    logits = model(x)
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=15))
```

Check for: cold start on first call (CUDA init 1-2s → warmup at boot), CPU-GPU sync stalls, and Python-side overhead dominating small models. Validate with a load test under concurrency, never a single scripted call.

## Serving Options

| Option | When | Notes |
|---|---|---|
| FastAPI + onnxruntime | One model, Python stack, custom pre/post-processing | ~100-500 req/s in-process; you own batching, retries, metrics |
| TorchServe | PyTorch-native; need model versioning/management/scale | `.mar` archives, default handlers, built-in metrics, gRPC |
| Triton | Multi-model, heterogeneous (ONNX+TF+PyTorch), max GPU throughput | Dynamic batching, instance groups, ensembles, CUDA graphs; steepest setup |

onnxruntime provider order is preference order: `["CUDAExecutionProvider", "CPUExecutionProvider"]`. For GPU throughput, give Triton `instance_group [{ count: 2 }]` so two workers overlap on one GPU.

## GPU Inference Setup

- **Half precision:** `with torch.autocast(device_type="cuda", dtype=torch.float16): logits = model(x)` halves memory bandwidth and compute cost. Use bf16 when fp16 loses accuracy (wide dynamic ranges, large vocab). fp16 is GPU-only — on CPU it is a no-op.
- **CUDA graphs** remove per-launch overhead (tens of us -> ~2us), decisive for small models where launch dominates. Capture after a warmup run with fixed shapes and no allocations inside capture; replay with `g.replay()`. Triton exposes this as a `cuda_graphs` parameter in the model config; `torch.compile(model, mode="reduce-overhead")` wraps the same mechanism.
- Boot the service with warmup inference + graph capture before accepting traffic.

## Drift Monitoring at Inference

Keep a sliding window of per-feature histograms (fixed 10-20 bins per feature, ~50k samples) and compare to the training-time reference: PSI > 0.2 or KS-test p < 0.05 per feature triggers an alert. Two cheap additions: monitor the prediction-score distribution (the model betting differently on the same inputs) and run a shadow copy of the eval metric on ~1% of live traffic. Wire alerts to the same channel as training monitoring (see training-ops.md) — a silent input shift is the most common way a served model degrades without a code change.

## Anti-Patterns

| Anti-pattern | Consequence | Fix |
|---|---|---|
| Serving the training checkpoint directly | Python overhead, no int8, mutable weights | Export ONNX/TFLite, freeze |
| Quantizing without the accuracy gate | Silent metric regression shipped | Re-run training-ops.md on frozen eval set |
| Pad-to-max for every request | 2-4x wasted compute | Length buckets + attention mask |
| `max_batch_size` pushed "for throughput" | p99 explodes, timeout cascades | Measure p99 at each N, stop at the knee |
| fp16 on CPU / graphs off-GPU | No-op masquerading as optimization | Verify provider and device in profiling |
| Benchmarks without warmup | Budget set on cold kernels | Warmup + graph capture first |
| No input/output monitoring | Degrades silently under data shift | PSI/KS windows + shadow eval |
| fp32 everywhere "to be safe" | 2x memory, slower | fp16/bf16 + accuracy gate |

## Related

- data-pipelines.md — feature ranges recorded at train time feed the drift checks above
- pytorch-patterns.md — QAT hook placement and `torch.amp` usage during training
- training-ops.md — the model registry should point at the export artifact, not the checkpoint
- training-ops.md — the frozen eval set and thresholds that gate every export and quantization