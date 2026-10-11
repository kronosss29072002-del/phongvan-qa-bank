# PyTorch 2.x Training Patterns — Module, DataLoader, Loop, AMP, Checkpoints, DDP
> Canonical patterns for torch 2.x (>= 2.4 API: torch.amp, torch.compile). Cross-refs: data-pipelines.md, tensorflow-patterns.md.

## Model + Canonical Loop

```python
class TwoLayerNet(nn.Module):
    def __init__(self, in_dim, hidden_dim=256, num_classes=10):
        super().__init__()
        self.fc1, self.fc2 = nn.Linear(in_dim, hidden_dim), nn.Linear(hidden_dim, num_classes)
    def forward(self, x):
        return self.fc2(torch.relu(self.fc1(x)))
```

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TwoLayerNet(784).to(device)          # move once, after construction
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-2)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
for epoch in range(epochs):
    for x, y in train_loader:
        x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        nn.CrossEntropyLoss()(model(x), y).backward()
        optimizer.step()
    scheduler.step()                        # once per epoch
```

- Submodule must be an attribute — a plain Python list breaks `.to(device)` (use `nn.ModuleList`). Write only `forward()`; no `.to()`/`.item()` inside it.
- **Smoke test first:** overfit one batch, loss must reach ~0; fix forward/loss/label mapping before touching LR. Seeds: `torch.manual_seed(42)` seeds CPU + all GPUs; `cudnn.deterministic=True` + `benchmark=False` = bit-reproducible, ~10% slower.
- Validation: `model.eval()` + `torch.no_grad()` — BatchNorm/Dropout diverge otherwise. Cosine + 5% warmup beats step-decay; log by accumulating `loss.detach()` ~50 steps — `.item()` per batch adds sync.

## Dataset + DataLoader

```python
class ImgDataset(Dataset):
    def __init__(self, paths, labels, transform=None):
        self.paths, self.labels, self.transform = paths, labels, transform
    def __len__(self): return len(self.paths)
    def __getitem__(self, idx): return self.transform(Image.open(self.paths[idx])), self.labels[idx]

loader = DataLoader(ds, batch_size=64, shuffle=True, num_workers=8,
                    pin_memory=True, persistent_workers=True, prefetch_factor=2,
                    generator=torch.Generator().manual_seed(0))
```

GPU training: `num_workers=4-8` (0 = no prefetch), `pin_memory=True`, `persistent_workers=True` skips ~1-2s/epoch worker respawn. `__getitem__` runs in worker processes — keep it pickle-safe; variable-length batches need a custom `collate_fn`.

## Mixed Precision + Gradient Accumulation

```python
scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")   # fp16 only
for i, (x, y) in enumerate(train_loader):
    with torch.amp.autocast("cuda", dtype=torch.float16, enabled=scaler.is_enabled()):
        loss = loss_fn(model(x), y) / accum_steps
    scaler.scale(loss).backward()
    if (i + 1) % accum_steps == 0:
        scaler.step(optimizer); scaler.update(); optimizer.zero_grad(set_to_none=True)
```

bf16 (`dtype=torch.bfloat16`, Ampere+ GPUs) needs no GradScaler; fp16 without it NaNs from step 1. Accumulation: divide loss by `accum_steps`, step once per window; effective batch = batch_size x accum_steps — scale LR by the same factor.

## Checkpointing

```python
best_acc = float("-inf")
for epoch in range(epochs):      # train + validate inside; val_acc from the val pass
    if val_acc > best_acc:
        best_acc = val_acc
        torch.save({"epoch": epoch, "model": model.state_dict(), "optimizer": optimizer.state_dict(), "scheduler": scheduler.state_dict(), "scaler": scaler.state_dict()}, f"{run_dir}/best.pt")
ckpt = torch.load(f"{run_dir}/best.pt", weights_only=False)  # full dict resume; default True since 2.6
model.load_state_dict(ckpt["model"])
```

`state_dict()` alone resumes weights; the full dict also restores LR position, Adam moments, scaler state (crash recovery). Keep `last.pt` (resume) + `best.pt` (final eval/deploy). Never `torch.save(model, ...)` — pickled class paths break on refactor; never `torch.load` untrusted files without `weights_only=True`.

## DDP + torch.compile

```python
torch.distributed.init_process_group("nccl")   # launch: torchrun --nproc_per_node=4 --rdzv_backend=c10d --rdzv_endpoint=localhost:0 train.py
model = nn.parallel.DistributedDataParallel(model, device_ids=[int(os.environ["LOCAL_RANK"])])
loader = DataLoader(ds, sampler=DistributedSampler(ds), batch_size=64)  # no shuffle=True; sampler.set_epoch(epoch) each epoch
```

- Only rank 0 logs/checkpoints/runs eval: `if dist.get_rank() == 0`. DDP allreduces grads each backward — wrap skipped accumulation iterations in `model.no_sync()`. `torch.compile(model, mode="reduce-overhead")` once, outside the loop: 10-40% speedup, near-zero on tiny models; first forward triggers JIT warmup.

## Debugging & Anti-Patterns

| Symptom | First checks |
|---|---|
| NaN from step 1 | LR too high (3e-4 -> 1e-4); fp16 without GradScaler; NaN already in inputs |
| NaN mid-training | exploding grads: `nn.utils.clip_grad_norm_(model.parameters(), 1.0)` |
| Val loss plateaus | LR too low; `scheduler.step()` missing or called per-batch; train/val misalignment |
| Train >> val (overfit) | raise dropout/weight_decay, augment, shrink capacity — not LR |

| Anti-pattern | Replace with |
|---|---|
| `.item()` / `.cpu().numpy()` inside the batch loop | accumulate and log every ~50 steps |
| `DataLoader(num_workers=0)` on GPU | 4-8 workers + `pin_memory=True` |
| `torch.cuda.amp` (deprecated since 2.4) | `torch.amp.autocast("cuda", ...)` / `GradScaler("cuda")` |
| Validation without `eval()` / `no_grad()` | both, or BN/Dropout skew val metrics |