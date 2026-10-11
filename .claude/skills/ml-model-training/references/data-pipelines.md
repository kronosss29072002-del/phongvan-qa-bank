# Data Pipelines — Imbalance, Augmentation, Splits, Caching

A pipeline is correct only when splits are leak-free, augmentation touches train only, and the GPU is the bottleneck rather than disk reads. Applies to PyTorch 2 and Keras 3 alike. Split discipline and holdout rules live in training-ops.md; this file covers the data engineering around them.

## Class Imbalance

Pick by symptom:

| Condition | Tool | Cost |
|---|---|---|
| Ratio < 5:1, keep it simple | `class_weight` / loss `weight` | one line, no data change |
| Deep model, minority underfits | oversampling sampler | reweighted batches |
| Tabular, need synthetic points | SMOTE (`imblearn`) | fit on train only |
| Hard examples matter (detection, rare events) | focal loss | `sigmoid_focal_loss` |

```python
# PyTorch: inverse-frequency weights
weights = 1.0 / torch.bincount(y_train).float()
loss_fn = nn.CrossEntropyLoss(weight=weights / weights.mean())
# binary: nn.BCEWithLogitsLoss(pos_weight=counts[0] / counts[1])
```

```python
from torch.utils.data import WeightedRandomSampler
sampler = WeightedRandomSampler(weights[y_train], len(y_train), replacement=True)
loader = DataLoader(ds, batch_size=64, sampler=sampler)  # no shuffle=True; sampler does it
```

Keras: `model.fit(..., class_weight={0: 1.0, 1: 5.0})`. sklearn: `class_weight="balanced"` on estimators. Focal loss: `torchvision.ops.sigmoid_focal_loss(inputs, targets, alpha=0.25, gamma=2)`. On an imbalanced set report per-class precision/recall and macro-F1, never accuracy alone.

## Augmentation

Train only; val/test get resize + normalize, zero randomness:

```python
# torchvision.transforms.v2 (torchvision >= 0.16)
train_tf = v2.Compose([
    v2.ToImage(), v2.ToDtype(torch.float32, scale=True),
    v2.RandomResizedCrop(224, scale=(0.7, 1.0)),
    v2.RandomHorizontalFlip(p=0.5),
    v2.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    v2.Normalize(MEAN, STD),
])
val_tf = v2.Compose([v2.ToImage(), v2.ToDtype(torch.float32, scale=True),
                     v2.Resize(256), v2.CenterCrop(224), v2.Normalize(MEAN, STD)])
```

- v2 transforms are batch-aware and compose with `torch.compile`; v1 `transforms.ToTensor()` still works but is frozen. For boxes/masks/keypoints use `albumentations`: `A.Compose([...], bbox_params=A.BboxParams(format="pascal_voc"))`, apply via `tfm(**sample)`.
- Keras: `RandomFlip`, `RandomRotation(0.1)`, `RandomZoom(0.1)`, `Rescaling(1./255)` as first model layers; training-only at inference. `tf.image.random_flip_left_right` etc. inside a `map` when you need exact control.
- Augment at train time, never save an augmented offline copy: disk stays 1x and every epoch sees new variants.
- With ImageNet pretrained weights keep the pretrained recipe (RandomResizedCrop + flip + jitter + same normalization) or fine-tuning fights the input distribution.

## Normalization Constants

- ImageNet weights: mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]`. Valid only for ImageNet-pretrained models; scratch runs compute mean/std on the train split and reuse the exact values at inference.
- `tf.keras.applications.*` models ship `preprocess_input`; use it instead of hand-rolled constants.
- Tabular: `StandardScaler` fit on train only, transform val/test with the same object.

## Split Integrity & Leakage

- Random split only for i.i.d. rows: `train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)`.
- Rows from one user/patient/session contradict i.i.d.: `GroupShuffleSplit(n_splits=1, test_size=0.2)` or `StratifiedGroupKFold`; `torch.utils.data.random_split` is NOT group-aware.
- Time series: temporal cutoff (`train = df[df.date < cutoff]`, never shuffle), CV via `TimeSeriesSplit(n_splits=5)`. Do not oversample across the cutoff.
- Near-duplicate leak: dedup train and test together with `imagehash.phash` (images) or content hashes (tabular rows); a duplicate in both splits inflates every metric.
- Audit list: scaler/encoder fit on full data; target-derived features (row mean of `y` as a feature); future data in features; row overlap across splits.
- CI assertion: `set(train_ids).isdisjoint(set(test_ids))` must hold; for image data compare phashes.

## I/O vs GPU Bottleneck

Measure first: `nvidia-smi dmon -c 60` shows per-second GPU util. Below 60% while the CPU is busy = I/O or transform bound; ~100% = compute bound.

- I/O bound: `num_workers=4-8`, `prefetch_factor=2`, `pin_memory=True`, `persistent_workers=True`. Compute bound: adding workers changes nothing; go to pytorch-patterns.md for AMP and `torch.compile`.
- `torch.profiler.profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA])`: the trace must separate DataLoader time from forward/backward before you optimize.
- `tf.data` baseline: `ds.batch(64).prefetch(tf.data.AUTOTUNE)`; parallelize the expensive `map` with `num_parallel_calls=AUTOTUNE`.

## Caching

- `tf.data`: `ds.cache("cache.tfdata")` after decode, before augmentation; then `.map(augment, ...)` so each epoch still gets fresh variants. Put the cache on local SSD.
- PyTorch: RAM-fitting sets: preprocess once, `torch.save` tensors, load into `TensorDataset` each run. Bigger sets: `np.memmap` (or h5py chunked) holding float16/uint8 arrays, decode once in a prepare step, never every epoch.
- Sharded: WebDataset (`webdataset.WebDataset("data-{00000..00099}.tar")`) or TFRecord shards, ~1k-10k samples per shard, streamed from object storage.
- Rule: cache anything decoded more than twice; re-decoding every epoch is the classic idle-GPU cause.

## Data Versioning

- DVC: `dvc add data/raw` records a content hash in `data/raw.dvc`; `dvc push` to remote; `dvc repro` reruns only stages whose inputs changed. Version splits with the raw data: a frozen `splits_v3.parquet` (row ids per split) keeps runs comparable across models.
- No-DVC alternative: `sha256sum data/train.parquet`, log the hash (`mlflow.log_param("data_sha256", ...)`) with every run; same hash, comparable runs.
- Never let a script write nondeterministically into `data/` at runtime; every prepared artifact must be reproducible from its raw version.

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Augmenting val/test | transforms dict; val = resize + normalize only |
| Scaler fit on all data | fit on train only |
| Random split of same-user rows | `GroupShuffleSplit` on user id |
| Shuffled time series / sampling across cutoff | time-based cut; sampler restricted to train window |
| Oversampling before splitting | split first, balance inside train |
| `num_workers=0` with idle GPU | 4-8 workers + prefetch; profile one epoch |
| Offline augmented copy | augment at train time |
| Unversioned data regeneration | DVC or per-run content hash |
| Train/test near-duplicates | phash/content-hash dedup across both splits |