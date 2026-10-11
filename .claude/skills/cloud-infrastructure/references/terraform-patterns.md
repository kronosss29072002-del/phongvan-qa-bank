## Core Workflow

```bash
terraform init          # download providers; -upgrade to refresh
terraform plan -out=tfplan   # diff vs state; ALWAYS review output
terraform apply tfplan  # only the planned changes
terraform destroy       # teardown; verify state empty for ephemeral envs
```
Rules: never `apply` blind (use `-out` plan + human review for prod); one logical change per apply. Run `terraform fmt` before every commit; `terraform validate` after edits.

## Provider Configuration

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }  # pin — never "latest"
  }
  backend "s3" { ... }      # remote state, see below
}

provider "aws" {
  region = "us-east-1"
  default_tags { tags = { Environment = var.environment, Team = "platform" } }
}
```

Per-region duplicates: `provider "aws" { alias = "west" }` + `providers = { aws = aws.west }` on modules. Credentials from env/SSO — never literals in `.tf`.

## Remote State (S3 + DynamoDB) — required for shared environments

```hcl
terraform {
  backend "s3" {
    bucket         = "my-org-tf-state"      # created ONCE outside Terraform
    key            = "app/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-state-lock"        # prevents concurrent applies
    encrypt        = true
  }
}
```

Bootstrap bucket/table manually or via a tiny `state-bootstrap/` config — this exception may live outside Terraform. Enable versioning on the bucket. Never commit `terraform.tfstate*` or `.terraform/`.

## Modules

- Layout `modules/<name>/` with `main.tf`, `variables.tf`, `outputs.tf`; root wires modules + provider. Every variable has `description` + `type`; no `any`; outputs minimal.
- Version modules in a registry (or git tags) once 2+ teams share them; keep one-offs local. Extract at the third repetition, not the first.

```hcl
module "web" {
  source      = "./modules/ecs-service"
  environment = var.environment
  image       = var.image
}
```

## Multi-Environment: Workspaces vs Directories

- **Workspaces** — same code, separate state; fine for quick isolation, but one dir for all envs.
- **Directory-per-env** (`terraform/aws/prod/`, `.../staging/`) — full code + state + version isolation; standard for serious multi-env.
**Promotion:** envs share one module tree; differences via `var.environment`. Promote = merge code up (`dev` → `staging` → `main`) then `plan` in the target env's directory. Never hot-edit state or resources outside Terraform — `import` instead, so code owns reality. Tag releases; record which version each env runs.

## Import Existing Resources

```bash
terraform import aws_s3_bucket.my_bucket my-bucket-name
terraform import module.web.aws_ecs_service.api my-cluster/my-service
```
Write config matching reality — `terraform plan` and reconcile diffs field by field (code must describe what exists, not what you wish existed). Use `import` blocks in config for repeatable, reviewable imports. Confirm with `terraform state list`.

## Lifecycle Rules

```hcl
resource "aws_db_instance" "db" {
  lifecycle {
    prevent_destroy = true          # never destroy prod DBs on apply
    ignore_changes  = [password]    # secret rotation outside Terraform
  }
}
```

- `prevent_destroy` on stateful resources (DB, data-holding buckets); `ignore_changes` only for out-of-band attributes you don't own (rotating secrets, autoscaling tags).
- `create_before_destroy` for no-gap replacements (ALB target groups, EIPs) — conflicts with `prevent_destroy` are expected; resolve deliberately.

## Drift Detection

- `terraform plan` IS the detector: AWS reality vs state/config surfaces as plan changes.
- CI: plan on every PR; alert when prod plan ≠ empty outside deploy time.
- `plan -refresh-only` re-syncs state — prefer fixing drift by re-applying config.
- Console-edited resources: revert to code or `import` — never a second source of truth.

## Common Pitfalls

- EIP + instance instability: use `aws_eip_association`.
- `count` vs `for_each`: prefer `for_each` with stable keys; keys must not contain changing computed values.
- Hardcoded AMI/ID varying per region: use `data` sources filtered by tag.
- One giant `main.tf`: split by resource type; `-target` only for emergencies.
- Secrets in `.tf`/plan output: use `data "aws_ssm_parameter"` / `aws_secretsmanager_secret_version`.