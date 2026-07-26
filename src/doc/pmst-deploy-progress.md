# PMST US-Nepal — Production Deploy Progress Log

> Resume file for the straight-to-prod AWS migration. Companion to
> `.windsurf/workflows/pmst-production-deployment.md` (runbook) and
> `.windsurf/workflows/pmst-development-workflow.md`.
> Last updated: paused before Phase 4 (app deploy).

## Environment facts
- AWS account: `602301275673`, region `us-east-1`, CLI identity: IAM user `pmst-deploy`
- Target domain: `pmstusnepal.com` (still live on Hostinger — NOT cut over yet)
- Terraform: run from `d:\pmstmigrateinfra`, backend init: `terraform init -reconfigure -backend-config="deploy/backend-prod.hcl"`
- Local gitignored secrets: `d:\pmstmigrateinfra\secrets.auto.tfvars` (acm_certificate_arn + db_password)
- Note: `gh` CLI NOT installed. AWS CLI needs `--no-cli-pager` (IDE injects PAGER=cat).
- PowerShell quirk: quote paths in terraform flags, e.g. `-var-file="deploy/prod.tfvars"`.

## COMPLETED

### Phase 0 — code fixes (DONE, uncommitted)
- `d:\pmstmigrateinfra\backend.tf`: DynamoDB lock → `use_lockfile = true`
- `d:\pmst-migration\scripts\config.py`: removed hard-coded RDS host + DB password; now reads `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` from env (`.env`), raises if missing. `CF_DOMAIN` default now empty.
- Access-key CSVs in `d:\pmstmigrate\src\doc\` are untracked + gitignored (recommend deleting locally + rotating).

### Phase 1 — ticketing CI/CD (DONE, uncommitted)
- Created `d:\pmst-services\pmst-ticketing-service\deploy\environments.yaml`
- Created `d:\pmst-services\pmst-ticketing-service\.github\workflows\deploy-ticketing-service.yml`
- Added `<classifier>lambda</classifier>` to both service poms so `mvn package` emits `target/*-lambda.jar` (the CI upload glob). Applied to BOTH `pmst-ticketing-service/pom.xml` and `pmst-api-service/pom.xml`.

### Phase 0b — AWS bootstrap (already existed, verified)
- S3 state bucket `pmst-terraform-state`, GitHub OIDC provider, IAM roles `pmst-github-actions-terraform` + `pmst-github-actions-deploy` all present. No prod state before this run; no pmst RDS/Lambdas.

### Phase 2 — DNS zone + TLS (DONE)
- Route 53 public hosted zone `pmstusnepal.com` created. **Zone ID = `Z06233322BAF2YNSNR6FJ`**.
- Delegation NS records (for Phase 8 Hostinger registrar NS change, replacing `ns1/ns2.dns-parking.com`):
  - `ns-735.awsdns-27.net`
  - `ns-1743.awsdns-25.co.uk`
  - `ns-1444.awsdns-52.org`
  - `ns-119.awsdns-14.com`
- ACM cert **ISSUED**: `arn:aws:acm:us-east-1:602301275673:certificate/a1920ef4-ecea-44d9-b45d-ffd6929f3488` (`pmstusnepal.com` + `www`).
- Validation CNAMEs added to BOTH Route 53 (auto-renewal after delegation) and Hostinger (current validation).

### Phase 3 — terraform apply prod (DONE, 83 resources)
Infra code fixes made during apply (uncommitted, in `d:\pmstmigrateinfra`):
- `modules/rds/main.tf`: `engine_version "16.4"` → `"16"` (16.4 retired; major-pin avoids future breakage).
- `modules/s3/main.tf`: media lifecycle now holds BOTH `delete-raw-uploads` (prefix `uploads/raw/`, 1 day) and prod-only `transition-to-ia` (dynamic block).
- `modules/image-processor/main.tf`: removed duplicate `raw_uploads` lifecycle (S3 allows only ONE lifecycle config per bucket — this was the apply-timeout root cause).

**Terraform OUTPUTS (source of truth):**
| Output | Value |
|---|---|
| api_gateway_endpoint | `https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod` |
| API base / tickets base | `.../prod/api`  and  `.../prod/tickets` |
| cloudfront_domain_name | `d2f5kzshaq1nf6.cloudfront.net` |
| cloudfront_distribution_id | `ECN0HO6STY22O` |
| cognito_user_pool_id | `us-east-1_1dEqFgYNR` |
| cognito_web_client_id | `7vs3hhs2v743l34d1j8jhqbnqk` |
| cognito_auth_domain | `pmst-prod-auth.auth.us-east-1.amazoncognito.com` |
| rds_endpoint | `pmst-prod-postgres.c2rwsbwwhr5u.us-east-1.rds.amazonaws.com` |
| rds_proxy_endpoint | `pmst-prod-rds-proxy.proxy-c2rwsbwwhr5u.us-east-1.rds.amazonaws.com` |
| frontend_bucket | `pmst-prod-frontend` |
| media_bucket | `pmst-prod-media` |
| lambdas | `pmst-prod-pmst-api-service`, `pmst-prod-ticketing-service` |

### Phase 3b — app wiring (DONE, uncommitted)
- `d:\pmstmigrate\src\environments\environment.prod.ts`: apiUrl = `.../prod/api`, ticketingUrl = `.../prod/tickets`, cfDomain = `https://d2f5kzshaq1nf6.cloudfront.net`. (Frontend does NOT need Cognito IDs — auth goes through backend `/auth/*`.)
- `pmst-api-service` `LambdaHandler.java`: `handler.stripBasePath("/api")`
- `pmst-ticketing-service` `LambdaHandler.java`: `handler.stripBasePath("/tickets")`
  - Reason: controllers are root-mapped (`/articles`, `/events`, ...), API GW serves under `/api/{proxy+}` and `/tickets/{proxy+}`; stripBasePath maps them correctly. Local dev (embedded Tomcat) unaffected.
- Backend DB creds: `DatabaseConfig.java` pulls from Secrets Manager when `DB_SECRET_ARN` is set (independent of Spring profile) — prod DB works without profile changes. No `@Profile` usage anywhere.

## PENDING COMMITS (nothing committed yet this session)
Commit these before/at deploy so nothing is lost:
- `pmstmigrateinfra`: backend.tf, modules/rds/main.tf, modules/s3/main.tf, modules/image-processor/main.tf (NOT secrets.auto.tfvars — gitignored)
- `pmst-api-service`: pom.xml, src/main/java/com/pmst/api/LambdaHandler.java
- `pmst-ticketing-service`: pom.xml, deploy/environments.yaml, .github/workflows/deploy-ticketing-service.yml, src/main/java/com/pmst/ticketing/LambdaHandler.java
- `pmstmigrate` (frontend): src/environments/environment.prod.ts
- `pmst-migration`: scripts/config.py

## NEXT — start here tomorrow

### DECISION PENDING: Phase 4 deploy method
- Option A — Manual (recommended for first cutover): build JARs → S3 → `update-function-code` → publish version; build Angular prod → sync to `pmst-prod-frontend` → CloudFront invalidation. Flyway auto-runs on first Lambda hit.
- Option B — CI/CD: set GitHub repo secrets (`AWS_ACCOUNT_ID`, `TF_VAR_DB_PASSWORD`) via web UI, push to `main` per repo.

### Phase 4 manual command outline (to run from each repo)
1. API: `mvn -f d:\pmst-services\pmst-api-service package -DskipTests` → `aws s3 cp target\*-lambda.jar s3://pmst-terraform-state/deployments/prod/pmst-api-service-latest.jar` → `aws lambda update-function-code --function-name pmst-prod-pmst-api-service --s3-bucket pmst-terraform-state --s3-key deployments/prod/pmst-api-service-latest.jar` → `aws lambda wait function-updated ...` → `aws lambda publish-version ...`
2. Ticketing: same with `pmst-ticketing-service` / `pmst-prod-ticketing-service`.
3. Frontend: `npm --prefix d:\pmstmigrate run build:prod` (verify script name) → `aws s3 sync dist/<app>/browser s3://pmst-prod-frontend --delete` → `aws cloudfront create-invalidation --distribution-id ECN0HO6STY22O --paths "/*"`.
4. Smoke test API GW: `curl https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/api/articles` (expect 200 JSON once Flyway has created tables). Check CloudWatch for `pmst-prod-pmst-api-service` Flyway logs.

### Later phases (unchanged)
- Phase 2b: SES for `pmstusnepal.com` (before bulk WP-user password-reset emails).
- Phase 5: Data migration. **Blocker:** prod RDS is private (`db_publicly_accessible=false`). Need temporary access: either flip `db_publicly_accessible=true` in prod.tfvars + apply (short-lived, security group must allow your IP), or SSM/bastion tunnel. Set migration `.env`: `DB_HOST=pmst-prod-postgres.c2rwsbwwhr5u.us-east-1.rds.amazonaws.com`, `DB_PASSWORD=...`, `CF_DOMAIN=https://d2f5kzshaq1nf6.cloudfront.net`.
- Phase 6: Image migration (`scripts/14_process_and_upload_images.py`) to `pmst-prod-media`.
- Phase 7: Users. Create NEW super-admin `pmstusnepal@gmail.com` fresh in Cognito pool `us-east-1_1dEqFgYNR` + DB row with `role='admin'` (there is no separate super-admin role in code — `admin` governs privileges). Migrated WP users login via Cognito password-reset on first sign-in.
- Phase 8: DNS cutover — change Hostinger registrar nameservers to the 4 Route 53 NS above; add apex + www A/AAAA alias → CloudFront in Route 53. Copy all live Hostinger records (MX, SPF, DKIM, DMARC, www, WP A) into the zone BEFORE switching.
- Phase 9: Verify on `https://pmstusnepal.com`, monitor 24h, then decommission Hostinger after ~1 week stable.
