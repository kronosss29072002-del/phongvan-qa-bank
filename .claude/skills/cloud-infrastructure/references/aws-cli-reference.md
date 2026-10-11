# AWS CLI — Quick Reference

## Credentials & SSO

```bash
aws configure                 # interactive: access key + secret + region
aws configure sso             # SSO profiles, recommended for teams
aws sso login --profile dev   # refresh SSO session (no keys stored)
aws sts get-caller-identity   # WHO am I? — run first when any command fails
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/cicd \
  --role-session-name deploy  # cross-account/CI tokens
```

Profiles in `~/.aws/config` + `~/.aws/credentials`; use `AWS_PROFILE`/`AWS_REGION` env vars in scripts. Automation credentials come from CI env vars, never committed.

## EC2

```bash
aws ec2 describe-instances --query 'Reservations[].Instances[].{id:InstanceId,state:State.Name}' --output table
aws ec2 stop-instances --instance-ids i-0abcd1234   # keep EBS, stop billing
aws ec2 authorize-security-group-ingress --group-id sg-0abc \
  --protocol tcp --port 5432 --source-group sg-0web  # SG-to-SG, not IP
aws ssm start-session --target i-0abcd1234          # shell without SSH key
```

## S3

```bash
aws s3 ls s3://bucket/ --recursive | head -20
aws s3 cp file.txt s3://bucket/path/ --sse aws:kms
aws s3 sync ./dist s3://bucket/static --delete      # deploy static site
aws s3 presign s3://bucket/report.pdf --expires-in 3600
aws s3api put-bucket-encryption --bucket my-bucket --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'
# aws s3 rm s3://bucket/ --recursive               # hard delete — confirm first
```

## Lambda

```bash
aws lambda update-function-code --function-name my-fn --zip-file fileb://fn.zip
aws lambda invoke --function-name my-fn out.json --cli-binary-format raw-in-base64-out \
  --payload '{"key":"value"}'                       # then cat out.json
aws lambda get-function-configuration --function-name my-fn --query 'Runtime'
```

## ECS / ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS \
  --password-stdin ACCT.dkr.ecr.us-east-1.amazonaws.com
docker push ACCT.dkr.ecr.us-east-1.amazonaws.com/my-app:abc1234
aws ecs update-service --cluster my-cluster --service api \
  --task-definition api:12 --force-new-deployment    # rolling deploy
aws ecs describe-services --cluster my-cluster --services api --query 'services[0].events[0:5]'
```

## RDS

```bash
aws rds describe-db-instances --query 'DBInstances[].{id:DBInstanceIdentifier,status:DBInstanceStatus}'
aws rds create-db-snapshot --db-instance-identifier my-db --db-snapshot-identifier pre-migrate-20260917
aws rds restore-db-instance-from-db-snapshot --db-instance-identifier my-db-restored \
  --db-snapshot-identifier pre-migrate-20260917
```

## IAM

```bash
aws iam list-attached-role-policies --role-name my-role
aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::ACCT:role/my-role \
  --action-names s3:GetObject s3:PutObject   # dry-run: does this policy allow it?
aws iam get-policy-version --policy-arn arn:aws:iam::ACCT:policy/MyPolicy \
  --version-id $(aws iam list-policy-versions --policy-arn arn:aws:iam::ACCT:policy/MyPolicy --query 'Versions[0].VersionId' --output text)
```

## CloudWatch / Logs / Route53

```bash
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=my-cluster --period 300 --statistics Average --output table
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].AlarmName'
aws logs tail /aws/ecs/my-cluster --since 10m
aws route53 list-resource-record-sets --hosted-zone-id Z1234567890 --query 'ResourceRecordSets[].Name'
```

## Debugging Playbook

1. `aws sts get-caller-identity` first — most "permission denied" is auth config, not policy.
2. ARN in the error → verify it exists (`aws s3api head-bucket`, `aws iam list-role-policies`).
3. ECS health check failing → `aws ecs describe-services` events field explains (task crash, deregistration, capacity).
4. `--no-cli-pager` for script output; `--query` + `--output table/json` keeps output small.
5. CI `AccessDenied` — missing `~/.aws/credentials`, or `AWS_EC2_METADATA_DISABLED`.
6. `ThrottlingException` — retry with backoff; never parallel-blast `describe-*`.