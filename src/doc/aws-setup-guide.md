# AWS Setup Guide — PMST US-Nepal

One-time setup steps to configure AWS CLI, IAM, Terraform backend, and validate infrastructure locally.

---

## Prerequisites

- AWS root account access
- Terraform installed (`terraform -version` should print `v1.6+`)
- AWS CLI installed (`aws --version`)

---

## Step 1 — Create IAM User for CLI/Programmatic Access

Never use the root account for CLI access.

1. Go to [AWS Console](https://console.aws.amazon.com) → **IAM** → **Users** → **Create user**
2. Username: e.g. `pmst-deploy`
3. **Do not** enable console access (leave checkbox unchecked)
4. Click **Next**
5. Choose **Attach policies directly** → search and select `AdministratorAccess`
6. Skip tags → **Create user**

### Generate Access Keys

1. Click the newly created user → **Security credentials** tab
2. Scroll to **Access keys** → **Create access key**
3. Select **Command Line Interface (CLI)** → check confirmation → **Next**
4. Skip description tag → **Create access key**
5. **Copy both values immediately** (shown only once):
   - `Access key ID` → `AWS_ACCESS_KEY_ID`
   - `Secret access key` → `AWS_SECRET_ACCESS_KEY`

---

## Step 2 — Configure AWS CLI

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID:     <your access key ID>
AWS Secret Access Key: <your secret access key>
Default region name:   us-east-1
Default output format: json
```

### Verify

```bash
aws sts get-caller-identity --query Account --output text
```

Should print your 12-digit AWS Account ID. Save this — it is your `AWS_ACCOUNT_ID` GitHub secret.

---

## Step 3 — Bootstrap Terraform Backend (Run Once)

Creates the S3 state bucket and DynamoDB lock table. Run from `D:\pmstmigrateinfra`.

```bash
# Create S3 state bucket
aws s3 mb s3://pmst-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket pmst-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket pmst-terraform-state \
  --server-side-encryption-configuration "{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"

# Block public access
aws s3api put-public-access-block \
  --bucket pmst-terraform-state \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name pmst-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Step 4 — Terraform Init, Validate & Plan

Run from `D:\pmstmigrateinfra`.

```bash
# Initialize Terraform for test environment
terraform init -backend-config=deploy/backend-test.hcl

# Validate configuration
terraform validate

# Preview what will be created (prompts for db_password)
terraform plan -var-file=deploy/test.tfvars
```

To avoid the password prompt, set the env var first:
```bash
export TF_VAR_db_password="YourStrongPassword123!"
terraform plan -var-file=deploy/test.tfvars
```

> `db_password` is the RDS master password you choose. Store it in a password manager — you will need it as `TF_VAR_DB_PASSWORD` GitHub secret.

---

## Step 5 — Apply (Deploy Test Infrastructure)

```bash
terraform apply -var-file=deploy/test.tfvars
```

Type `yes` when prompted. Takes ~10-15 minutes. CloudFront distribution takes the longest.

### Expected outputs after apply

| Output | Description |
|---|---|
| `cloudfront_domain_name` | Frontend URL (update `deploy/environments.yaml` in Angular repo) |
| `api_gateway_endpoint` | API base URL (update `deploy/environments.yaml` in API repo) |
| `cognito_user_pool_id` | For app config |
| `cognito_web_client_id` | For app config |
| `frontend_bucket_name` | S3 bucket for Angular build |

---

## Step 6 — Add GitHub Secrets

In each repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value | Repos |
|---|---|---|
| `AWS_ACCOUNT_ID` | 12-digit account ID from Step 2 | All 3 repos |
| `TF_VAR_DB_PASSWORD` | RDS password from Step 4 | `pmst-terraform-infra` |

> For production only — add after first prod deploy:
> - `TF_VAR_ACM_CERT_ARN` — ACM certificate ARN for custom domain

---

## Step 7 — Destroy Test Environment (When Done)

**Always destroy test resources when not in use to avoid charges.**

```bash
cd D:\pmstmigrateinfra
terraform destroy -var-file=deploy/test.tfvars
```

Type `yes` when prompted. Takes ~5-10 minutes.

### What gets destroyed

Everything in the plan: VPC, NAT Gateways, RDS, Lambda, S3 buckets, CloudFront, Cognito, SQS, IAM roles, Security Groups.

> ⚠️ S3 buckets must be **empty** before destroy. If destroy fails on S3, empty the buckets first:
> ```bash
> aws s3 rm s3://pmst-test-frontend --recursive
> aws s3 rm s3://pmst-test-media --recursive
> terraform destroy -var-file=deploy/test.tfvars
> ```

### Post-Destroy Checklist

- [ ] Verify in AWS Console → **EC2** → no NAT Gateways in `running` state
- [ ] Verify **RDS** → no instances running
- [ ] Verify **CloudFront** → distribution deleted or disabled
- [ ] Verify **S3** → `pmst-test-frontend` and `pmst-test-media` buckets gone
- [ ] Terraform state S3 bucket (`pmst-terraform-state`) — **keep this**, it stores state for future deploys

### Re-deploying Later

When you want to spin up test again:
```bash
terraform init -backend-config=deploy/backend-test.hcl
terraform apply -var-file=deploy/test.tfvars
```

---

## Cost Awareness

| Resource | Approx. Cost |
|---|---|
| NAT Gateway × 2 | ~$32/month each |
| RDS `db.t4g.micro` | ~$13/month |
| CloudFront, S3, Lambda | Minimal / free tier |

> Destroy test stack between sessions to keep costs near zero.

---

## Bugs Fixed During Setup

These pre-existing module bugs were fixed during initial validate:

| File | Issue | Fix |
|---|---|---|
| `modules/api-gateway/main.tf` | `aws_api_gateway_integration.api_proxy` undeclared | Replaced with `api_proxy_get` and `api_proxy_write` |
| `modules/s3/main.tf` | Lifecycle rule missing `filter` block | Added `filter {}` |
| `modules/api-gateway/main.tf` | `access_log_settings` missing required `format` | Added format string |
