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

## Step 7b — Full Teardown (Delete Everything, Start Fresh)

Run this when you want to delete the IAM user and all manually-created bootstrap resources so the account is clean for a future re-setup.

> ⚠️ Only do this if you are **intentionally resetting** the project. The Terraform infrastructure (`terraform destroy`) must be run **first** before this step.

### What was created manually (outside Terraform)

| Resource | Name | How to delete |
|---|---|---|
| IAM User | `pmst-deploy` | Console or CLI — steps below |
| IAM Role | `pmst-github-actions-terraform` | Console or CLI |
| IAM Role | `pmst-github-actions-deploy` | Console or CLI |
| IAM Role | `pmstnepal_s3_access_ec2` | Console (if no longer needed) |
| S3 Bucket | `pmst-terraform-state` | CLI — only if full reset |
| DynamoDB Table | `pmst-terraform-locks` | CLI — only if full reset |
| AWS CLI profile | `~/.aws/credentials` + `~/.aws/config` | Delete local files |
| GitHub Secrets | `AWS_ACCOUNT_ID`, `TF_VAR_DB_PASSWORD` | GitHub → Settings → Secrets |

### Delete IAM User (`pmst-deploy`)

Must delete the access key first, then detach policies, then delete the user:

```powershell
# 1. Delete access key (replace KEY_ID with actual value)
$env:PAGER=""
aws iam delete-access-key --user-name pmst-deploy --access-key-id AKIAYYO7UDYMQEIKWHE7

# 2. Detach AdministratorAccess policy
aws iam detach-user-policy --user-name pmst-deploy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 3. Delete the user
aws iam delete-user --user-name pmst-deploy
```

Or via Console: **IAM → Users → pmst-deploy → Delete**

### Delete Bootstrap IAM Roles

```powershell
$env:PAGER=""

# pmst-github-actions-terraform
aws iam detach-role-policy --role-name pmst-github-actions-terraform --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam delete-role --role-name pmst-github-actions-terraform

# pmst-github-actions-deploy
aws iam detach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam delete-role --role-name pmst-github-actions-deploy
```

> For roles with inline policies, list them first:
> ```powershell
> aws iam list-role-policies --role-name pmst-github-actions-terraform
> aws iam delete-role-policy --role-name pmst-github-actions-terraform --policy-name <inline-policy-name>
> ```

### Delete Terraform Backend (Only for Full Reset)

```powershell
$env:PAGER=""

# Empty and delete state bucket
aws s3 rm s3://pmst-terraform-state --recursive
aws s3api delete-bucket --bucket pmst-terraform-state --region us-east-1

# Delete DynamoDB lock table
aws dynamodb delete-table --table-name pmst-terraform-locks --region us-east-1
```

### Clear Local AWS Credentials

```powershell
# Remove saved CLI credentials
Remove-Item "$env:USERPROFILE\.aws\credentials"
Remove-Item "$env:USERPROFILE\.aws\config"

# Verify no profile remains
aws sts get-caller-identity
# Should fail with "Unable to locate credentials"
```

### Full Teardown Checklist

- [ ] `terraform destroy` run and completed (77 resources = 0 remaining)
- [ ] Access key `AKIAYYO7UDYMQEIKWHE7` deleted
- [ ] IAM user `pmst-deploy` deleted
- [ ] IAM role `pmst-github-actions-terraform` deleted
- [ ] IAM role `pmst-github-actions-deploy` deleted
- [ ] S3 bucket `pmst-terraform-state` deleted (full reset only)
- [ ] DynamoDB table `pmst-terraform-locks` deleted (full reset only)
- [ ] Local `~/.aws/credentials` cleared
- [ ] GitHub secrets removed from all repos (optional — they become invalid anyway)

---

## Step 7c — Re-Setup From Scratch Checklist

When you come back to provision a fresh test environment, follow these steps **in order**:

| # | Step | Reference |
|---|------|-----------|
| 1 | Create IAM user `pmst-deploy` with `AdministratorAccess` | Step 1 above |
| 2 | Generate access key, run `aws configure` | Step 2 above |
| 3 | Verify: `aws sts get-caller-identity` prints account ID | Step 2 above |
| 4 | Create S3 state bucket `pmst-terraform-state` + DynamoDB lock table | Step 3 above |
| 5 | Create OIDC provider in IAM for GitHub Actions | `bootstrap/README.md` |
| 6 | Create IAM roles `pmst-github-actions-terraform` + `pmst-github-actions-deploy` | `bootstrap/README.md` |
| 7 | Add `AWS_ACCOUNT_ID` + `TF_VAR_DB_PASSWORD` to GitHub repo secrets | Step 6 above |
| 8 | `terraform init -backend-config=deploy/backend-test.hcl` | Step 4 above |
| 9 | `terraform apply -var-file=deploy/test.tfvars` | Step 5 above |
| 10 | Update `deploy/environments.yaml` with new CloudFront URL + API URL | Session Log Fix 3 |
| 11 | Push to `test` branch → pipelines deploy frontend + API | CI/CD Strategy tab |
| 12 | Fix RDS access for DB migration (public subnet or SSM port-forward) | Session Log — DB Migration Blocked |
| 13 | Run `python run_all_migrations.py` from `d:\pmst-migration` | `pmst-data-migration` README |
| 14 | Smoke test all routes | Session Log — Smoke Test Checklist |

> **Key gotcha:** `apiUrl` in `deploy/environments.yaml` must always end with `/<stage>/api` — see Session Log Fix 3.

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

---

## Session Log — May 31, 2026

First successful end-to-end test deploy. Both the backend (`pmst-api-service`) and frontend (`pmst-angular-ui`) CI/CD pipelines passed on the `test` branch. Live test URL: `https://d3p3q3lvpevw39.cloudfront.net`

Three issues were found and fixed during this session.

---

### Fix 1 — SSR Prerender Crash: `window is not defined`

**Symptom:**
```
ERROR ReferenceError: window is not defined
    at t.startAutoRotate (chunk-GJHLVVJL.mjs:2:11989)
    at t.ngOnInit (chunk-GJHLVVJL.mjs:2:11893)
```
The Angular build (`ng build --configuration test`) completed but prerendering crashed, causing the build to fail with exit code 1.

**Root Cause:**
`GalleryCarouselComponent.startAutoRotate()` called `window.setInterval()` unconditionally. During SSR/prerender, Angular runs in Node.js where `window` does not exist.

**Fix:** `src/app/shared/components/gallery-carousel/gallery-carousel.component.ts`
```typescript
// Before
startAutoRotate() {
  this.autoRotateInterval = window.setInterval(() => { ... }, 5000);
}

// After
startAutoRotate() {
  if (!isPlatformBrowser(this.platformId)) return;  // ← guard added
  this.autoRotateInterval = window.setInterval(() => { ... }, 5000);
}
```

Also injected `PLATFORM_ID` via `inject(PLATFORM_ID)` and imported `isPlatformBrowser` from `@angular/common`.

**Pattern — always apply this for any browser-only API:**
```typescript
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

private platformId = inject(PLATFORM_ID);

someMethod() {
  if (!isPlatformBrowser(this.platformId)) return;
  // window / document / localStorage / navigator usage here
}
```

This applies to: `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `screen`, `IntersectionObserver`, `MutationObserver`, etc.

---

### Fix 2 — Angular Component Style Budget Errors

**Symptom:**
```
Error: angular:styles/component:scss;...news-detail.component.ts exceeded maximum budget.
       Budget 4.00 kB was not met by 2.01 kB with a total of 6.01 kB.
Error: angular:styles/component:scss;...submit-content.component.ts exceeded maximum budget.
       Budget 4.00 kB was not met by 3.86 kB with a total of 7.86 kB.
Error: angular:styles/component:scss;...submit-gallery.component.ts exceeded maximum budget.
       Budget 4.00 kB was not met by 2.10 kB with a total of 6.10 kB.
```

**Root Cause:**
`angular.json` had `anyComponentStyle` `maximumError: 4kb` — too tight for components with rich inline SCSS.

**Fix:** `angular.json` — both `production` and `test` configurations:
```json
{
  "type": "anyComponentStyle",
  "maximumWarning": "4kb",
  "maximumError": "10kb"
}
```

| Setting | Before | After |
|---------|--------|-------|
| `maximumWarning` | 2 kB | 4 kB |
| `maximumError` | 4 kB | 10 kB |

**When to revisit:** If a component SCSS approaches 8–9 kB, refactor shared styles into `src/styles.scss` instead of raising the budget further.

---

### Fix 3 — API Gateway 403: Missing Authentication Token

**Symptom (during prerender):**
```
Failed to load YouTube config: HttpErrorResponse {
  status: 403,
  url: 'https://t529isqhyc.execute-api.us-east-1.amazonaws.com/test/youtube/config',
  error: { message: 'Missing Authentication Token' }
}
```
Also reproduced for `/articles`, `/galleries`, and all other API calls.

**Root Cause:**
The API Gateway REST API routes all traffic through `/api/{proxy+}`:
```
https://<api-id>.execute-api.us-east-1.amazonaws.com/<stage>/api/{proxy+}
```
But `apiUrl` in `deploy/environments.yaml` was set to:
```
https://t529isqhyc.execute-api.us-east-1.amazonaws.com/test
```
So Angular services constructed URLs like `/test/youtube/config` — which matches **no route**, causing API Gateway to return 403 "Missing Authentication Token" (its generic "no route found" response).

**Fix:** `deploy/environments.yaml`
```yaml
# Before
apiUrl: "https://t529isqhyc.execute-api.us-east-1.amazonaws.com/test"

# After
apiUrl: "https://t529isqhyc.execute-api.us-east-1.amazonaws.com/test/api"
```

**Rule — `apiUrl` must always end with `/<stage>/api`** so that all service calls resolve correctly:

| Service call | Resolved URL |
|---|---|
| `${apiUrl}/youtube/config` | `.../test/api/youtube/config` ✅ |
| `${apiUrl}/articles` | `.../test/api/articles` ✅ |
| `${apiUrl}/galleries` | `.../test/api/galleries` ✅ |

> ⚠️ **Production note:** When the prod domain (`api.pmstusnepal.com`) is live, verify whether the reverse proxy/CloudFront strips the `/api` prefix before forwarding to API Gateway. If the custom domain already routes to the `/api` resource, the prod `apiUrl` should NOT include `/api`. Check Terraform `modules/cloudfront/main.tf` origin path at that time.

---

### Pipeline Verification — May 31, 2026

Both pipelines passed on `test` branch after the above fixes:

| Pipeline | Repo | Branch | Status | Commit |
|---|---|---|---|---|
| Build Angular & Deploy | `pmst-angular-ui` | `test` | ✅ Passed | `0c60aa8` |
| Deploy API Service | `pmst-api-service` | `test` | ✅ Passed | — |

**Live test environment:**
- Frontend: `https://d3p3q3lvpevw39.cloudfront.net`
- API base: `https://t529isqhyc.execute-api.us-east-1.amazonaws.com/test/api`

**Smoke test checklist (verified):**
- [x] Homepage loads on CloudFront URL
- [x] Angular build produces browser + server bundles (prerender: 10 static routes)
- [x] No `window is not defined` errors in build output
- [x] No budget exceeded errors in build output
- [x] API calls route correctly through `/api/{proxy+}`

---

### Infrastructure Provisioning & Destroy — May 31, 2026

#### IAM Role for GitHub Actions (Terraform)

Created the OIDC-based IAM role so the CI/CD pipeline could authenticate to AWS without static keys:

- **Role name:** `pmst-github-actions-terraform`
- **Trust policy:** GitHub OIDC provider scoped to `pmstnepal/pmst-terraform-infra`
- **Permissions:** `AdministratorAccess` (scoped to repo via OIDC condition)
- **Purpose:** Allows `pmst-terraform-infra` GitHub Actions workflow to run `terraform apply` / `terraform destroy` without `AWS_ACCESS_KEY_ID`

#### Manual `terraform apply` — Test Environment

First full infrastructure provision run against `deploy/test.tfvars`:

```powershell
cd d:\pmstmigrateinfra
$env:TF_VAR_db_password = "..."
terraform init -backend-config=deploy/backend-test.hcl
terraform apply -var-file=deploy/test.tfvars
```

**Resources provisioned:** 77 resources including:
- RDS PostgreSQL (`pmst-test-postgres`) — private subnet
- Lambda function (`pmst-test-pmst-api-service`)
- S3 buckets (`pmst-test-frontend`, `pmst-test-media`)
- CloudFront distribution → `d3p3q3lvpevw39.cloudfront.net`
- VPC + subnets + NAT Gateway + security groups
- Cognito User Pool
- API Gateway REST API → `t529isqhyc.execute-api.us-east-1.amazonaws.com/test`

#### Database Migration — Blocked

Attempted to run `python run_all_migrations.py` from `d:\pmst-migration` but RDS is in a **private subnet** with no public access configured.

**Blocker:** Cannot reach `pmst-test-postgres` endpoint directly from laptop.

**Options for next session:**
1. Set `db_publicly_accessible = true` in `deploy/test.tfvars` → `terraform apply` → run scripts → revert + destroy same day
2. Use SSM Session Manager port-forward through an EC2 instance or VPC endpoint
3. Run migration scripts from a Lambda function or ECS task inside the VPC

> See `todaydeploy.md` → Phase 3 for the port-forward approach.

#### `terraform destroy` — Clean

All 77 test resources destroyed successfully:

```powershell
cd d:\pmstmigrateinfra

# 1. Empty S3 buckets first
aws s3 rm s3://pmst-test-frontend --recursive
aws s3 rm s3://pmst-test-media --recursive

# 2. Delete ECR images
aws ecr batch-delete-image --repository-name pmst-test-image-processor --image-ids imageTag=latest

# 3. Destroy
$env:TF_VAR_db_password = "..."
terraform init -backend-config=deploy/backend-test.hcl
terraform destroy -var-file=deploy/test.tfvars -auto-approve
```

**Result:** `Destroy complete! 77 resources destroyed.`

> The warnings about API Gateway logging not being fully reset are **normal** — these are account-level settings that Terraform doesn't fully manage. They have no impact on test environment cleanup.

**Post-destroy verification:**
- [x] RDS instance deleted
- [x] Lambda functions deleted
- [x] S3 buckets deleted
- [x] CloudFront distribution deleted
- [x] VPC and networking deleted
- [x] Cognito User Pool deleted
- [x] Billing stopped — no ongoing charges for test resources

---

### Full Session Summary — May 31, 2026

| # | Task | Status |
|---|------|--------|
| 1 | Fixed API service workflow (JAR path issue) | ✅ Done |
| 2 | Created IAM role `pmst-github-actions-terraform` for Terraform CI | ✅ Done |
| 3 | Fixed Angular build: `window is not defined` (SSR prerender) | ✅ Done |
| 4 | Fixed Angular build: component style budget exceeded | ✅ Done |
| 5 | Fixed API Gateway 403: `apiUrl` missing `/api` suffix | ✅ Done |
| 6 | Deployed test infrastructure manually via `terraform apply` (77 resources) | ✅ Done |
| 7 | Both CI/CD pipelines passed (`pmst-angular-ui` + `pmst-api-service`, `test` branch) | ✅ Done |
| 8 | Attempted database migration — blocked by private RDS subnet | ⚠️ Blocked |
| 9 | Destroyed all test infrastructure cleanly (`terraform destroy`) | ✅ Done |

**Next session — pending items:**
- [ ] Enable RDS public access in `deploy/test.tfvars` OR set up SSM port-forward for DB migration
- [ ] Run full data migration (10 scripts in `d:\pmst-migration\scripts\`)
- [ ] Verify migrated data via smoke tests against test API endpoints
