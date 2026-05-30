# TEST Deployment — Quick Test & Destroy

**Goal:** Deploy PMST to AWS in the **test** environment, verify it works, then destroy completely so there are zero charges.

**Scope:** Infra + DB migration + apps, on a throwaway test stack. **No production, no domain, no ACM cert.**
**Cost:** ~$0 if destroyed the same day.

---

## How Deployment Works Now

- **One `deploy/` folder** in `pmst-terraform-infra` holds all environment config. The **branch** you merge into selects the environment:
  - `test` branch → **test** env (this guide)
  - `main` branch → prod env
- This guide runs the **test** env **manually from your laptop** (useful before wiring CI). The CI path is: push to `test` → `Deploy Infrastructure` workflow runs the same commands.

### Fixed test resource names
| Resource | Name |
|----------|------|
| RDS instance | `pmst-test-postgres` |
| RDS DB / user | `pmstdb` / `pmstadmin` |
| Lambda (API) | `pmst-test-pmst-api-service` |
| Frontend bucket | `pmst-test-frontend` |
| Media bucket | `pmst-test-media` |
| State key | `environments/test/terraform.tfstate` |

---

## Prerequisites
- AWS CLI configured; Terraform v1.6+; Node 20; Java 21 + Maven; Python 3.
- Terraform backend bootstrapped once (`pmst-terraform-state` bucket + `pmst-terraform-locks` table). If not done, see the **Deploy** tab in `pmst-master-plan.html` (Phase 0).
- A strong DB password ready (exported as `TF_VAR_db_password`).

---

## Phase 1: Provision Test Infrastructure

```powershell
cd d:\pmstmigrateinfra

# Test password for this run
$env:TF_VAR_db_password = "YOUR_TEST_DB_PASSWORD"

# Init against the TEST state key
terraform init -backend-config=deploy/backend-test.hcl

# Plan + apply with the TEST variables (deployment_mode=test → default cert, destroyable RDS)
terraform plan  -var-file=deploy/test.tfvars -out=tfplan
terraform apply tfplan
```

### Get resource info (outputs work now)
```powershell
terraform output                                  # everything
terraform output -raw cloudfront_domain_name      # your test URL
terraform output -raw api_gateway_endpoint        # API base URL
terraform output -raw rds_endpoint                # RDS host
terraform output -raw frontend_bucket_name        # pmst-test-frontend
```

> **Tip — laptop DB access:** RDS is private by default. For a one-off local migration, set `db_publicly_accessible = true` in `deploy/test.tfvars` and re-apply (revert + destroy same day). Otherwise use an SSM port-forward through a VPC instance.

---

## Phase 2: Deploy Apps (order matters)

> Deploy API → invoke once (Flyway creates schema) → THEN migrate data → then frontend.

### 2.1 API service
```powershell
cd d:\pmst-services\pmst-api-service
mvn clean package -DskipTests

aws s3 cp (Get-ChildItem target\*-lambda.jar | Select -First 1).FullName `
  s3://pmst-terraform-state/deployments/test/pmst-api-service-latest.jar

aws lambda update-function-code --function-name pmst-test-pmst-api-service `
  --s3-bucket pmst-terraform-state --s3-key deployments/test/pmst-api-service-latest.jar
aws lambda wait function-updated --function-name pmst-test-pmst-api-service
aws lambda publish-version --function-name pmst-test-pmst-api-service
```

### 2.2 Trigger Flyway schema creation
```powershell
aws lambda invoke --function-name pmst-test-pmst-api-service --payload '{}' response.json
cat response.json
```

### 2.3 Frontend
```powershell
cd d:\pmstmigrate

# Set test URLs from Phase 1 outputs in src/environments/environment.test.ts
#   apiUrl:  '<api_gateway_endpoint>'
#   cfDomain:'https://<cloudfront_domain_name>'

npx ng build --configuration test

$bucket = "pmst-test-frontend"
aws s3 sync dist/pmst-angular-ui/browser/ "s3://$bucket" --delete --cache-control "public, max-age=31536000, immutable" --exclude "*.html"
aws s3 sync dist/pmst-angular-ui/browser/ "s3://$bucket" --cache-control "no-cache" --include "*.html"

$cfId = aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, 'pmst-test-frontend')].Id | [0]" --output text
aws cloudfront create-invalidation --distribution-id $cfId --paths "/*"
```

---

## Phase 3: Database Migration

```powershell
cd d:\pmst-migration
pip install -r requirements.txt
```

Edit `scripts/config.py` (names match the module defaults):
```python
def get_conn():
    return psycopg2.connect(
        host="localhost",   # SSM port-forward, else the rds_endpoint
        port=5432,
        dbname="pmstdb",
        user="pmstadmin",
        password="YOUR_TEST_DB_PASSWORD",
    )
```

```powershell
python run_all_migrations.py

# Verify
$endpoint = terraform -chdir=d:\pmstmigrateinfra output -raw rds_endpoint
psql -h $endpoint -U pmstadmin -d pmstdb -c "SELECT COUNT(*) FROM articles;"
psql -h $endpoint -U pmstadmin -d pmstdb -c "SELECT COUNT(*) FROM users;"
```
Expected: articles > 100, users = 18, galleries > 20.

---

## Phase 4: Smoke Test

```powershell
$cf  = terraform -chdir=d:\pmstmigrateinfra output -raw cloudfront_domain_name
$api = terraform -chdir=d:\pmstmigrateinfra output -raw api_gateway_endpoint

curl -s "https://$cf" | head -50      # homepage
curl "$api/articles" | jq '. | length'
aws rds describe-db-instances --db-instance-identifier pmst-test-postgres --query 'DBInstances[0].DBInstanceStatus'
```

Browser checks:
- [ ] Homepage loads
- [ ] Navigation (Spotlight, News, Showcase)
- [ ] Articles + gallery lists display
- [ ] Login page loads

---

## Phase 5: Destroy Everything

> In test mode RDS has **no deletion protection** and **skips the final snapshot**, so destroy is clean. Buckets are **un-versioned**, so a simple recursive delete empties them.

```powershell
cd d:\pmstmigrateinfra

# 1. Empty S3 buckets (required before destroy)
aws s3 rm "s3://pmst-test-frontend" --recursive
aws s3 rm "s3://pmst-test-media" --recursive

# 2. Delete ECR images (required before destroy)
aws ecr batch-delete-image --repository-name pmst-test-image-processor --image-ids imageTag=latest 2>$null

# 3. Destroy the test stack
$env:TF_VAR_db_password = "YOUR_TEST_DB_PASSWORD"
terraform init -backend-config=deploy/backend-test.hcl
terraform destroy -var-file=deploy/test.tfvars -auto-approve
```

### Verify nothing remains
```powershell
aws rds describe-db-instances --db-instance-identifier pmst-test-postgres   # → DBInstanceNotFound
aws s3 ls | findstr pmst-test
aws lambda list-functions --query "Functions[?contains(FunctionName, 'pmst-test')].FunctionName"
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=pmst" --query 'Vpcs[*].VpcId'
```
Then check the AWS Billing dashboard — current-month charges should stay ~$0.

---

## Quick Reference
```powershell
cd d:\pmstmigrateinfra
$env:TF_VAR_db_password = "YOUR_TEST_DB_PASSWORD"
terraform init -backend-config=deploy/backend-test.hcl
terraform apply  -var-file=deploy/test.tfvars -auto-approve   # up
terraform output -raw cloudfront_domain_name                  # test URL
terraform destroy -var-file=deploy/test.tfvars -auto-approve  # down
```

**Last Updated:** May 30, 2026  
**Status:** TEST environment guide (test branch / deploy/test.tfvars)
