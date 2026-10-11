# Training Ops — Experiment Tracking, HP Search, Eval, Reproducibility

Every run must be self-describing: params + data hash + git commit + per-epoch curves, or a "0.83 AUC" claim is unverifiable. Rules below apply to PyTorch 2 and Keras/TF 2 alike.

## Experiment Tracking (MLflow 2.x / W&B)

```python
import mlflow
mlflow.set_tracking_uri("http://mlflow:5000")  # or ./mlruns for local
mlflow.set_experiment("churn-v2")
with mlflow.start_run():
    mlflow.log_param("batch_size", 64)
    mlflow.log_metrics({"val_auc": 0.83, "val_f1": 0.71}, step=40)  # per epoch
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.pytorch.autolog()   # model + optimizer + metrics; same run
```
- W&B equivalent: `wandb.init(project="churn", config=cfg)`, `wandb.log({"train/loss": loss, "lr": lr})` (auto step), `run.log_artifact("data/train.parquet", type="dataset")`, `run.finish()`.
- Log every epoch/step, not only the final value — a run is a time series; loss curves diagnose divergence, final numbers do not.
- One metric name per concept repo-wide (`val_auc`, never `auc_val` in one run and `val_auc` in the next); autolog keeps names stable.

## Hyperparameter Search (Optuna)

```python
def objective(trial):
    cfg = {
        "lr": trial.suggest_float("lr", 1e-5, 1e-2, log=True),
        "hidden": trial.suggest_int("hidden", 32, 512, log=True),
        "dropout": trial.suggest_float("dropout", 0.0, 0.5),
    }
    set_seed(trial.number)          # fixed seed per trial; see below
    val_loss = train(cfg)           # train split only — never test
    trial.report(val_loss, step=EPOCHS)
    if trial.should_prune():
        raise optuna.TrialPruned()
    return val_loss

study = optuna.create_study(
    direction="minimize",                             # default; keep explicit
    sampler=optuna.samplers.TPESampler(seed=42),      # search itself deterministic
    pruner=optuna.pruners.MedianPruner(n_startup_trials=5, n_warmup_steps=10),
)
study.optimize(objective, n_trials=50)
```
- TPESampler is the default and right choice for mixed continuous/categorical spaces; pruning pairs with framework callbacks (`TFKerasPruningCallback(trial, "val_loss")`, `PyTorchLightningPruningCallback(trial, "val_loss")`). After search: retrain the best config once with a fixed seed, evaluate on test once, register; record `study.best_params` + best run id in the model card.

## Evaluation Metrics by Task

| Task | Metrics | Caveats |
|---|---|---|
| Classification | accuracy, precision, recall, F1, ROC-AUC, PR-AUC | Accuracy lies at 99:1 — use PR-AUC + macro-F1, `stratify` splits; report `pos_label` explicitly |
| Regression | MAE, RMSE, R2 | RMSE punishes outliers, MAE is robust to them, R2 is scale-dependent — log all three |
| Detection | mAP@0.5:0.95, mAP@0.5 (COCO) | `torchmetrics.detection.mean_ap`; never report a single IoU |
| Ranking | NDCG@k | `sklearn.metrics.ndcg_score(y_true, y_score, k=10)` takes 2D scores; torchmetrics `RetrievalNormalizedDCG(top_k=k)` for batches |

- F1/accuracy need labels, ROC-AUC needs scores: pick the decision threshold on validation from the PR curve, then freeze it — test set never sees a threshold sweep.
- `sklearn.metrics.classification_report` for the full breakdown; the confusion matrix shows which classes bleed into which.

## Reproducibility

```python
def set_seed(seed):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
```
- Launch with `PYTHONHASHSEED=42` (set before the interpreter starts); `torch.use_deterministic_algorithms(True)` for strict mode (slower, raises on non-deterministic ops). TF: `tf.random.set_seed(s)` + `os.environ["TF_DETERMINISTIC_OPS"] = "1"`.
- GPU runs are not bit-reproducible across machines/setups — pin `torch==2.x.x`, CUDA/cuDNN versions, `pip freeze` (or `uv.lock`) inside the image tag; same image, same env.
- Log the data fingerprint and code version each run: `mlflow.log_param("data_sha256", ...)` (hash of the dataframe bytes) and the training git commit — without these, two runs are not comparable.

## Holdout Discipline

- Split ONCE up front: `train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`; time series → `TimeSeriesSplit` (never random shuffle). The test set is touched exactly once — final evaluation after the model is frozen; search, early stopping, threshold picking, and checkpoint selection all happen on validation.
- Leakage rules: fit scalers/encoders/feature selectors on train folds only; when doing CV, refit inside the fold loop. <5k rows → nested CV (inner loop searches, outer loop estimates).

## Model Registry & Versioning

```python
mlflow.register_model(f"runs:/{run_id}/model", "churn_xgb")   # version 1, 2, ...
mlflow.pyfunc.load_model("models:/churn_xgb/champion")        # promote by alias
```
- Registry versions are immutable; promote/rollback by moving the `champion`/`candidate` alias, never by deleting versions. A version is only usable with its producing run — attach run_id, params, data hash, git commit, and eval metrics. Ship a model card (metrics on the same holdout, data provenance, known failure slices) with each promotion.

## CI for Models

- Every PR: smoke training on a fixed subset (1-2 epochs, ~1k rows), fixed seeds, assert a loose floor (`assert val_auc > 0.60`). Catches broken pipelines, NaN loss, shape drift, import rot — under 5 min on CPU.
- Full training runs nightly on a GPU runner; promotion is gated on the smoke run + matching data checksum, never on the PR alone. Same seed + same data must reproduce the baseline metric within tolerance — that delta detects nondeterminism. A smoke-pass means "pipeline runs and learns something", not "model is good".

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Evaluating on the train split | Hold out a test split, touch it once at the end |
| Tuning hyperparameters on test | Fixed split; validation only; test evaluated once |
| No baseline | Beat `DummyClassifier`/mean regressor before claiming wins |
| Saving the last epoch, not the best | Checkpoint on best val metric; restore before reporting |
| Logging only final metrics | Per-epoch curves; a run is a time series |
| Comparing runs on different splits | Freeze the split (or CV folds) for the whole experiment |
| No seed / unseeded data order | `set_seed(trial.number)`, `DataLoader(shuffle=True)` fixed-seeded |
| Reporting accuracy on a 99:1 set | PR-AUC + macro-F1, stratified splits |
| Fitting scalers on all data | Fit on train folds only (inside CV loop when applicable) |
| Unregistered best model | Register + alias before the run counts as done |