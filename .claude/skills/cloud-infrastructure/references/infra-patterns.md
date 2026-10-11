# Infrastructure Patterns

## Blue-Green Deployment

Two full environments (blue = live, green = new), switch traffic, roll back by switching back.

- **ALB-based (recommended):** deploy new version to a second target group; register it on the ALB; when health checks pass, shift 100% of traffic; keep the old target group for instant rollback.
- **Route53 weighted:** two record sets (weights 100/0); flip weights to cut over; roll back by flipping back.
- **RDS considerations:** schema changes must be backward-compatible (expand-contract: add nullable column → deploy → backfill → make NOT NULL during a later release). Never destructive migration in the same deploy as app swap.
- **When:** zero-downtime required, trading double capacity cost for rollback safety.

## Canary Release

Progressive traffic shift: 5% → 25% → 50% → 100%, gated by metrics.

- ALB listener rules: fixed weight split by target group (origin-based: `PathPattern` plus `Header` matching is brittle — prefer weight-based canaries); or Lambda weights for serverless.
- Define the canary gate before shipping: error rate < 0.1%, p95 latency within N% of baseline, no 5xx growth. Fail → route back to 100% stable.
- Automate with CodeDeploy (works with ALB + ECS) or a pipeline stage that holds approval between weights.

## Autoscaling

- **ASG (EC2):** `aws_autoscaling_group` + launch template; scale on CPU utilization or custom CloudWatch metric with cooldown; min = what keeps you alive, max = budget ceiling.
- **ECS:** service `desired_count` 2-6 with `aws_appautoscaling_target` on CPU/memory or request count (Application Auto Scaling). Fargate scales in seconds.
- **Lambda:** no config — concurrency reserved per function to prevent runaway cost, provisioned concurrency only for cold-start-critical paths (extra cost).
- **Draining:** ALB deregistration delay + ECS task draining (default 30s+) so in-flight requests finish before a container dies.

## Secrets Management

- **SSM Parameter Store** — cheap (free tier), fine for most config; use `SecureString` with KMS.
- **Secrets Manager** — automatic rotation + versioning; use for DB credentials, API keys, anything rotated frequently. Costs for rotation runs — don't enable rotation on static secrets.
- **Principle:** secrets live in AWS, referenced from code/CI as `data` lookups; never in git, env files, or task definitions in plaintext.
- Lambda: pass secret ARNs in env, fetch at runtime; ECS: `secrets` block in task definition mounting from Secrets Manager.
- Rotation: Secrets Manager can rotate RDS creds natively; prefer that over self-managed rotation jobs.

## CI/CD Integration

```yaml
# Typical flow (GitHub Actions):
# 1. terraform init (with backend config from secrets)
# 2. terraform plan -out=tfplan   -> artifact
# 3. human approval on prod (environment protection rule)
# 4. terraform apply tfplan
# 5. Docker build+push -> ECR
# 6. ECS deploy (new task definition -> service update) or CodeDeploy
# 7. health check + smoke test on the new version, then canary shift
```

- Registry: ECR per app; tag images with commit SHA (`my-app:abc1234`) — never `latest` in production task defs.
- Rollback = redeploy previous SHA; keep old task definitions reachable.
- Plan/apply split with approval is the non-negotiable gate between CI and prod.

## Multi-Environment Setup

| Env | Terraform dir/workspace | Data | Notes |
|-----|------------------------|------|-------|
| dev | `envs/dev/` | ephemeral, seeded | destroy nightly OK, cheapest sizes |
| staging | `envs/staging/` | prod-shaped, seeded | mirrors prod architecture (min sizes), pre-prod tests |
| prod | `envs/prod/` | real | `prevent_destroy`, immutable DB, manual apply |

- Same module tree for all envs; differences via variables (`var.environment` drives names, sizes, tags).
- Never let staging drift from prod in shape — the point is to catch prod-only failures there.
- Secrets and IAM rules replicate per env; one Terraform backend bucket, one `key` per env.

## Disaster Recovery

- **RPO/RTO first:** define targets (e.g. RPO 15 min, RTO 1 h) then pick strategy — don't start from tools.
- **Backups:** RDS automated backups + manual snapshots before risky changes; S3 versioning + replication (even cross-region `CRR` for critical buckets); EBS snapshots with lifecycle policy.
- **Multi-AZ vs multi-Region:** Multi-AZ covers instance/availability failures (minutes RTO); multi-Region covers region disasters — requires replica databases (`aws_rds_cluster` global cluster / cross-region read replicas) + Route53 failover record + AMI/replicas of compute in the second region.
- **Recovery:** restore RDS from snapshot, point ECS at restored DB via task def (DNS/parameter change), verify read+write path, re-point DNS. **Run a DR drill at least yearly** — untested runbooks are fiction.

## Monitoring (CloudWatch basics)

- **Metrics:** ALB (5xx, latency, request count), RDS (CPU, connections, free storage), ECS (CPU, memory, service events), Lambda (errors, duration, throttles).
- **Alarms → actions:** `aws_cloudwatch_metric_alarm` on error rate and latency (not CPU alone) → SNS → Slack/on-call; dashboard per service showing the 5 metrics that say "is it working?".
- **Logs:** CloudWatch Log Groups per service with retention (90 days default unless compliance says longer); structured JSON logs (fields: level, request_id, service) — grep-able and metric-filtrable.
- **Health endpoints:** every service exposes `/healthz` (liveness) and `/readyz` (dependency check); ALB target group health checks hit them. CloudWatch Synthetics (Canaries) for end-user-path checks.
- **Tracing:** X-Ray for request-level traces across Lambda/ECS/API Gateway when debugging latency — enable selectively (cost scales with traffic).