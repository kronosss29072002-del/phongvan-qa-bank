---
name: ml-model-training
description: "Train classical and deep ML models with PyTorch 2 or TensorFlow/Keras: data pipelines, training loops, experiment tracking, hyperparameter search, evaluation, inference serving. Use when training/fine-tuning (CNN/ResNet, transformer, tabular, image, text), writing Dataset/DataLoader or tf.data pipelines, or debugging underfitting, overfitting, leakage, slow training. NOT for LLM API apps (use llm-app-dev) or multimodal media (use ai-multimodal)."
license: MIT
version: 1.0.0
---

# ML Model Training

## When to Use
- Training deep models from scratch or fine-tuning: CNN/ResNet, encoder transformers, tabular MLPs.
- Classical baselines: sklearn/XGBoost/LightGBM when the dataset is under ~100k rows.
- Data pipelines: `Dataset`/`DataLoader`, `tf.data`, preprocessing, augmentation, class imbalance.
- Hyperparameter search, experiment tracking, checkpointing, export/serve decisions.

## Architecture Overview
`raw data -> pipeline -> training -> evaluation -> serving`

1. **Data**: versioned `train`/`val`/`test` splits; fit scalers/encoders on train only; group-split correlated rows (same user/session) to prevent leakage.
2. **Pipeline**: PyTorch `Dataset` + `DataLoader`, or `tf.data.Dataset`; parallel workers + prefetch so the GPU never idles.
3. **Training**: optimizer + `loss.backward()` + `optimizer.step()` loop, or `model.fit()`; keep best-val-loss checkpoint and a training curve.
4. **Evaluation**: metrics on the held-out test set once per model decision; per-class metrics when classes are imbalanced.
5. **Serving**: export ONNX/TFLite/SavedModel; verify exported outputs match PyTorch/TF within 1e-4 before deploying.

## Quick Start
Minimal runnable MNIST MLP (CUDA) — dataset, loader, model, training loop, eval:

```python
import torch, torch.nn as nn
from torchvision.datasets import MNIST

train_ds = MNIST("./data", train=True,  download=True)  # .data (N,1,28,28) uint8, .targets (N,)
test_ds  = MNIST("./data", train=False, download=True)
train_x, train_y = train_ds.data.float()/255, train_ds.targets
test_x,  test_y  = test_ds.data.float()/255,  test_ds.targets

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(nn.Flatten(), nn.Linear(28*28, 128), nn.ReLU(), nn.Linear(128, 10))
    def forward(self, x): return self.fc(x)

loader = torch.utils.data.DataLoader(
    torch.utils.data.TensorDataset(train_x, train_y),
    batch_size=64, shuffle=True, num_workers=4, pin_memory=True)
model, fn = Net().cuda(), nn.CrossEntropyLoss()
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
for _ in range(5):
    model.train()
    for x, y in loader:
        opt.zero_grad()
        fn(model(x.cuda()), y.cuda()).backward()
        opt.step()
model.eval()
with torch.no_grad():
    acc = (model(test_x.cuda()).argmax(1) == test_y.cuda()).float().mean().item()
```

Expect ~97-98% test accuracy after 5 epochs. Never evaluate inside `torch.no_grad` with train mode on batch norm/dropout layers.

## Best Practices
- **PyTorch 2 speed**: `model = torch.compile(model)` after one warmup batch; AMP with `torch.autocast("cuda", dtype=torch.bfloat16)` (fp16 needs `torch.amp.GradScaler`); `torch.set_float32_matmul_precision("high")`. Sustained loops typically gain 1.2-2x.
- **DataLoader defaults**: `num_workers=4-8`, `pin_memory=True`, `prefetch_factor=2`; batch size 32-256. Profile one epoch before adding complexity.
- **Splits**: split by time/group when rows correlate; never random-split rows from the same patient/session. Fit transforms on train only, reuse on val/test.
- **Imbalance**: `WeightedRandomSampler` or class weights in the loss; report per-class precision/recall and macro-F1, never accuracy alone.
- **Checkpoints**: save `("model", "opt", "epoch", "rng")` dicts via `torch.save`; keep best-val-loss + latest; resume from both model and optimizer state.
- **Tracking**: start MLflow (`mlflow.set_experiment`) or W&B before the second run; log loss, metrics, hyperparams, and artifact path per run.
- **Search**: Optuna `TPESampler`, `n_trials >= 50`; hold out a fixed test set never scored during search.
- **Reproducibility**: fix `torch.manual_seed` + `cudnn.deterministic=True`; record data version, code commit, and env in run metadata; report mean +- std over 3 seeds.
- **Keras 3**: `ds.cache().batch(64).prefetch(tf.data.AUTOTUNE)`; `model.fit(..., validation_data=val_ds, callbacks=[EarlyStopping(patience=5), ReduceLROnPlateau()])`.
- **Eval discipline**: val metrics guide hyperparameters; the test set answers one question per model decision, re-run from scratch before claiming an improvement.

## Reference Navigation
- [PyTorch 2 patterns](references/pytorch-patterns.md) — training loop, DDP, mixed precision, checkpoints.
- [TensorFlow patterns](references/tensorflow-patterns.md) — Keras 3, tf.data, callbacks, distribution strategies, SavedModel.
- [Data pipelines](references/data-pipelines.md) — dataset design, splits, imbalance, augmentation, leakage.
- [Training ops](references/training-ops.md) — MLflow/W&B tracking, Optuna search, reproducibility, eval discipline.
- [Inference & serving](references/inference-serving.md) — ONNX/TFLite export, quantization, serving options, latency budgets.

## Decision Matrix
| Need | Choose |
|---|---|
| Deep models (image/seq) on GPU | PyTorch 2 + `torch.compile` + AMP |
| Fast iteration, TF ecosystem, edge/mobile | Keras 3 + `tf.data` + TFLite |
| Tabular data, under 100k rows | XGBoost/LightGBM — usually beats deep MLPs |
| 2+ GPUs on one node | DDP (`torchrun --nproc_per_node=N`) or `MirroredStrategy` |
| Track experiments | MLflow (self-hosted) or W&B (managed) |
| Hyperparameters | Optuna `TPESampler`, 50-100 trials |
| Export for serving | ONNX (cross-framework) or TFLite (edge); diff <= 1e-4 vs framework |
| Latency-critical serving | Quantize fp32 to int8; measure p99 before and after |