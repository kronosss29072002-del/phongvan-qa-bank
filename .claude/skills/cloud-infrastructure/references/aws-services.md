# AWS Services — Core Reference

## Compute: EC2 vs Lambda vs ECS

| Dimension | EC2 | Lambda | ECS Fargate |
|-----------|-----|--------|-------------|
| Unit | Instance (vCPU/RAM committed) | Invocation (ms billed) | Task (container, seconds billed) |
| Scaling | ASG, minutes to add capacity | Instant, per-request | Service desired-count, fast |
| State | Full, persistent (EBS) | Stateless by design | Stateless per task; EFS for shared |
| Max run | Unlimited | 15 min (standard), 15 min max | Unlimited |
| Ops | Patch AMIs, SSH, manage | None | Registry + task def only |
| Cost shape | Hourly, idle paid | Per ms, zero when idle | Per vCPU/RAM-seconds |

**Selection rule:** Lambda when requests are short and bursty (cron jobs, webhooks, APIs under 15 min, image/event processing). ECS Fargate when requests are long, stateful-ish, or the stack is already containerized. EC2 when you need GPUs, custom networking, legacy OS, or fixed cost.

## Storage: S3 vs EBS vs EFS

- **S3** — object store, unlimited size, 11 nines durability, HTTP access, lifecycle tiers (Standard → Intelligent-Tiering/IA → Glacier). Use: media, backups, static site, data lake. Never a filesystem.
- **EBS** — block device attached to ONE instance in one AZ, snapshot-able. Use: root volumes, databases (with io1/io2/gp3 sizing), anything needing a filesystem locally.
- **EFS** — NFS share mounted by many instances/tasks across AZs. Use: shared content, web farm uploads, ECS shared scratch. Costs more than EBS at scale; sets a throughput mode (bursting default).

**Rule:** objects → S3; one-instance disk → EBS; multi-instance shared FS → EFS; archive → S3 Glacier Deep Archive.

## Databases

- **RDS** — managed Postgres/MySQL/MariaDB/Oracle/SQL Server. Multi-AZ = synchronous standby + automatic failover (same region). Read replicas for read scaling. Automated backups + point-in-time restore. Enable storage encryption at creation — unencryptable later.
- **Aurora** — RDS-compatible (Postgres/MySQL) with 6-way replication, faster failover, Serverless v2 auto-scaling. Choose when you need MySQL/Postgres compatibility at scale.
- **DocumentDB** — Mongo API compatible, for document workloads. Not a drop-in for every Mongo feature; verify feature parity.
- **RDS Proxy** — connection pooling in front of RDS/Aurora. Use when Lambda or many instances hammer connections (prevents "too many connections" under load).

## IAM Best Practices

- Users for humans only (SSO preferred, see CLI reference); workloads get **roles** (`aws_iam_role` + policy attachments), not keys.
- Scope policies to resource ARNs: `arn:aws:s3:::my-bucket/*` not `*`. Avoid `Action: "*"` + `Resource: "*"` combos.
- Use **conditions** for the sharp edges: `aws:SourceArn` on cross-account roles, `aws:PrincipalOrgID` on resource policies, MFA for console/priveleged actions.
- Prefer **service roles**: EC2 instance profile, Lambda execution role (`AWSLambdaBasicExecutionRole` + least for the service), ECS task role.
- Rotate user access keys ≤ 90 days; enable Access Analyzer to detect unused access.
- Test policies with `aws iam simulate-principal-policy`.

## Networking + Edge

- **VPC** — your private network: subnets (public/private), route tables, NAT gateway (private→internet), security groups (stateful, allow-only), NACLs (stateless, layer 4 — rarely needed if SGs are right).
- **CloudFront** — CDN in front of S3, ALB, or Lambda@Edge. Always for global static delivery: TLS at edge, cache behaviors, signed URLs for private content, origin access control (OAC) so S3 is never public.
- **Route53** — DNS + routing policies incl. latency-based, weighted, failover with health checks. Alias records to AWS resources are free and auto-update on IP changes.

## ECS vs EKS

| | ECS | EKS |
|--|-----|-----|
| Learning curve | Low (console/API native) | High (kubectl, Helm, operators) |
| Ops burden | Minimal, AWS manages most | You manage nodes, upgrades, addons |
| Ecosystem | AWS-native integrations | Industry-standard, any Helm chart |
| Fit | Single team, microservices on AWS | Multi-team platform, existing K8s skill, portability |

Rule: reach for ECS first. Choose EKS only when the org already runs Kubernetes or needs its ecosystem — then expect dedicated platform work.

## Cost Optimization

1. **Right-size first** — CloudWatch CPU/RAM utilization for 2 weeks; downsize idle (t3/t4g burstables < 5% avg).
2. **Spot** — ECS/Fargate spot, batch, non-critical workers: 60-90% cheaper, interruptible with 2-min notice.
3. **Reserved / Savings Plans** — after stable usage 3+ months; cover the steady baseline only, keep surge on-demand; EC2 Savings Plans > Convertible RIs for flexibility.
4. **Eliminate waste** — unattached EBS, unused EIPs, old snapshots/AMIs, unregistered ECS task defs, idle ALBs; set billing alerts (80% forecast) + Cost Explorer anomaly detection.
5. **Data transfer** — biggest hidden cost. Keep traffic in-region/AZ where possible, CloudFront for egress-heavy S3, RDS cross-region replicas instead of app-level copying.

## CLI Quick Reference

```bash
# Security groups
aws ec2 describe-security-groups
aws ec2 authorize-security-group-ingress --group-id sg-xxx \
  --protocol tcp --port 22 --source-group sg-web

# S3
aws s3 ls s3://bucket --recursive
aws s3 sync ./dist s3://bucket --delete

# IAM
aws iam list-attached-role-policies --role-name my-role
aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::...:role/r \
  --action-names s3:GetObject

# Systems Manager (no SSH)
aws ssm start-session --target i-0abcd1234
```

Full per-service listing: `references/aws-cli-reference.md`