---
name: cloud-infrastructure
description: Provision AWS infrastructure (EC2, S3, Lambda, RDS, ECS, IAM, CloudFront, Route53) and IaC with Terraform covering providers, remote state, modules, workspaces, import, drift detection. Use when designing AWS architectures, choosing compute/storage, writing Terraform/HCL, managing state/workspaces, setting up multi-environment deployments, blue-green/canary releases, IAM roles/policies, optimizing AWS cost, or integrating with CI/CD.
license: MIT
version: 1.0.0
---

# Cloud Infrastructure — AWS + Terraform

Provision, deploy, and operate AWS infrastructure with Terraform. Covers service selection, IaC workflows, and deployment patterns.

## When to Use

- Choosing AWS services (compute, storage, database, networking) for an architecture
- Writing or reviewing Terraform HCL, plans, modules, or workspace configs
- Managing remote state, imports, or drift on existing AWS resources
- Designing multi-environment, blue-green, canary, or autoscaling deployments
- Setting up IAM, secrets, CloudWatch monitoring, or disaster recovery
- Estimating or reducing AWS cost (Reserved, Spot, Savings Plans)

## Platform Selection Guide

| Scenario | Choose |
|----------|--------|
| Predictable traffic, fast iteration | **Docker + Compose** on one EC2 |
| Stateless APIs, event-driven, bursty | **Lambda + API Gateway** |
| Long-running containers, no K8s overhead | **ECS Fargate** |
| Kubernetes required by team/ecosystem | **EKS** (dedicated ops effort) |
| Managed relational data | **RDS** (Postgres/MySQL) |
| Mongo-compatible documents | **DocumentDB** |
| Files, backups, media, static assets | **S3** (+ CloudFront CDN) |
| Block storage for 1 instance / DBs | **EBS** |
| Shared files across instances | **EFS** |

## Quick Start

```bash
# Terraform (recommended beyond single EC2) — remote state required for teams
terraform init && terraform plan -out=tfplan   # review output BEFORE apply
terraform apply tfplan && terraform destroy    # destroy for ephemeral envs

# One-off EC2
aws ec2 run-instances --image-id ami-0abcdef1234567890 \
  --instance-type t3.micro --key-name my-key --security-group-ids sg-0123456789abcdef0

# ECS Fargate (containerized API)
aws ecs create-cluster --cluster-name my-cluster
aws ecs register-task-definition --cli-input-json file://task-def.json
aws ecs create-service --cluster my-cluster --service-name api \
  --task-definition api:1 --desired-count 2 --launch-type FARGATE

# Lambda
aws lambda create-function --function-name my-fn --runtime python3.12 \
  --role arn:aws:iam::123456789012:role/lambda-exec \
  --handler lambda_function.handler --zip-file fileb://fn.zip
```

## Reference Navigation

- `references/aws-services.md` — EC2 vs Lambda, S3 vs EBS vs EFS, RDS/DocumentDB, ECS vs EKS, IAM, cost optimization
- `references/terraform-patterns.md` — init/plan/apply/destroy, providers, remote state, modules, workspaces, import, lifecycle, drift
- `references/infra-patterns.md` — blue-green, canary, autoscaling, secrets, CI/CD, multi-env, DR, CloudWatch
- `references/aws-cli-reference.md` — per-service CLI commands, credentials, SSO, debugging

## Best Practices

### Security
- **IAM least privilege:** one role per workload, no `Action: "*"` on prod; service roles (instance profile, Lambda execution role) over long-lived keys.
- **Secrets in SSM/Secrets Manager**, referenced via `data "aws_ssm_parameter"` — never in code, git, or plaintext task defs.
- **S3 private by default**; only CloudFront (OAC) exposes objects. Encrypt everything (S3 SSE-KMS; RDS at creation — cannot be added later).
- **VPC hygiene:** public subnets only for ALB/NAT; DBs private; SGs reference SGs, never 0.0.0.0/0 on SSH/RDS.

### Cost
- Right-size from CloudWatch utilization; Spot/Fargate spot for interruption-tolerant work (~60-90% cheaper).
- Reserved/Savings Plans only after 3+ months stable usage — cover baseline, surge on-demand.
- Delete orphans (unattached EBS, unused EIPs, old snapshots); budget alert at 80% forecast.

### IaC
- Plan in CI, human approval for prod apply; pin provider versions; never `latest`.
- Remote state mandatory for teams; state never in git.
- Modules at the third repetition (defer factoring); promote envs by promoting code, never hot-editing state.

## Decision Matrix

| Need | Choose |
|------|--------|
| Predictable web app compute | EC2 or ECS Fargate |
| Bursty/event-driven code | Lambda |
| Object storage + static hosting | S3 + CloudFront |
| Managed MySQL/Postgres | RDS (Multi-AZ prod) |
| Mongo-compatible documents | DocumentDB |
| Global DNS + failover | Route53 |
| Containers at scale, K8s ecosystem | EKS |
| Any of the above as code | Terraform |

## Resources

- AWS docs: https://docs.aws.amazon.com
- Terraform AWS provider: https://registry.terraform.io/providers/hashicorp/aws
- AWS CLI reference: https://awscli.amazonaws.com/v2/documentation/api/latest/reference/