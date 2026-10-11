# TensorFlow 2.x + Keras 3 Patterns

Keras 3 runs on TF, JAX, and PyTorch backends (`pip install keras` or `tensorflow` ≥2.16 bundles it). APIs below are backend-agnostic except `tf.distribute` and `SavedModel`. Rules: Functional by default; Subclassing only when the forward pass cannot be expressed as a graph — and never put data loading, `tf.io`, or preprocessing inside `call()`.

## Model APIs — pick by need

| API | When | Pattern |
|---|---|---|
| `Sequential` | Single input → single output, linear stack | `keras.Sequential([keras.layers.Dense(64, activation='relu'), keras.layers.Dense(10)])` |
| `Functional` | Branching, multiple inputs/outputs, shared layers, ResNet-style skip connections | `x = keras.layers.Dense(64)(inputs); outputs = keras.layers.Dense(10)(x); model = keras.Model(inputs, outputs)` |
| `Subclassing` | Custom forward pass (RNN cell, metric logic) — loses `model.summary()` shape inference and serialization | override `call(self, x, training=False)` — gate `Dropout`/`BatchNormalization` on `training` |

## tf.data Pipeline — order matters

```python
ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))   # small data in RAM
ds = (ds.shuffle(10_000, seed=42)                             # 1x dataset size is a floor
      .map(decode_fn, num_parallel_calls=tf.data.AUTOTUNE)    # heavy per-sample work
      .batch(256, drop_remainder=True)                        # keeps last batch same shape
      .prefetch(tf.data.AUTOTUNE))                            # ALWAYS last
```

- Order that matters: `shuffle` → `map` → `batch` → `prefetch`. `cache()` after `map` (or `cache(filename=...)` on disk) when epochs re-run identical decoding.
- `from_generator` for data that cannot be sliced (images on disk, sequences), not for numpy.
- Avoid `dataset.filter()` after `shuffle` — skip-ratio collapses to 1/N, starving later epochs.

## Model.fit vs custom loop

```python
# model.fit — 80% of cases; callbacks + validation handled
model.fit(ds, epochs=20, validation_data=val_ds,
          callbacks=[early_stop, checkpoint, reduce_lr, tb], verbose=2)

# custom train_step — return a dict of metrics, not None
def train_step(self, data):                                  # override inside a SubclassedModel
    x, y = data
    with tf.GradientTape() as tape:
        loss = self.compute_loss(x, y, training=True)
    grads = tape.gradient(loss, self.trainable_weights)
    self.optimizer.apply_gradients(zip(grads, self.trainable_weights))
    return {"loss": loss, "acc": self.compute_metrics(x, y, training=True)}
```

Custom loops are for: metric ordering control, multi-optimizer training, gradient clipping, or research code. Don't write one to "go faster" — `model.fit` with `xla=True` (`jit_compile=True`) is the fast path.

## Callbacks

```python
early_stop = keras.callbacks.EarlyStopping(
    monitor='val_loss', patience=5, restore_best_weights=True)  # never fit on val-oscillation
checkpoint = keras.callbacks.ModelCheckpoint(
    'models/run-{epoch:02d}.weights.h5', save_best_only=True,
    monitor='val_loss', save_weights_only=True)                 # weights only: portable across backends
reduce_lr  = keras.callbacks.ReduceLROnPlateau(
    monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)    # halve LR after 3 stale epochs
tb         = keras.callbacks.TensorBoard(log_dir='logs/fit', histogram_freq=1)
```

`ModelCheckpoint` without `save_best_only` writes every epoch to disk — 10 epochs = 10 writes on top of training.

## Mixed Precision (mixed_float16)

```python
keras.mixed_precision.set_global_policy('mixed_float16')   # fp16 compute, fp32 master weights
# loss scaling is automatic (Keras wraps it — nothing to write); the final layer still needs
model.add(keras.layers.Activation('linear', dtype='float32'))  # a float32 cast for stable softmax
```

Do NOT set `'float16'` (loses master weights), and never accompany with manual `tf.keras.mixed_precision.LossScaleOptimizer` — Keras 3 handles scaling silently. On CPU or when an op has no fp16 kernel, grow the fp32 subset instead of disabling the policy.

## Distribution & Serving

```python
strategy = tf.distribute.MirroredStrategy()          # 1 host, N GPUs — data parallel
with strategy.scope():
    model = build_model()                            # weights replicated, batch split
# optimizer construction goes inside scope() too; dataset prep and model.fit(ds) stay outside
```

- MirroredStrategy for single-host multi-GPU; `MultiWorkerMirroredStrategy` for multi-host; Keras 3 JAX backend prefers `jax.sharding`. Never wrap `tf.data` construction inside `strategy.scope()`.

```python
model.save('export/densenet')                        # SavedModel dir with signature = call()
serving = tf.serving.ModelServer or tf.lite.Interpreter / tfjs converter
# pin exact input signature / drop training-only ops:
model.export('export/densenet-serving')              # Keras 3: strips optimizer, embeds signature
```

## Debugging & Anti-Patterns

| Symptom | Cause → Fix |
|---|---|
| val_loss << train_loss, never improving | Dropout left on at inference — `training=True` leaked into `call()`; gate on `training` |
| Instant `NaN` | LR too high → drop to 1e-3/3e-4; or raw logits through `softmax` twice |
| Loss plateaus at log-uniform value | Final layer `float16` without cast-back — softmax saturates → add `dtype='float32'` |
| Train slower than CPU | Dataset not prefetched, `num_parallel_calls` unset, or GPU feed from `from_tensor_slices` on huge data → `cache` + `map`+`prefetch` |
| `batch` size mismatch on last epoch | `drop_remainder=False` default — val metrics computed on partial batch; set `True` |
| Weights not saved across crash | `save_best_only` off, or `restore_best_weights` missing → both cost a rerun |
| OOM mid-epoch | Batch 256 → 128; `shuffle(1e7)` buffers RAM; move `map` preprocessing to `tf.data` not numpy |

Cross-references: [pytorch-patterns.md](pytorch-patterns.md) (same decisions in PyTorch), [data-pipelines.md](data-pipelines.md) (dataset design), [training-ops.md](training-ops.md) (scheduling, early stop), [inference-serving.md](inference-serving.md) (export/SavedModel→TFServing).