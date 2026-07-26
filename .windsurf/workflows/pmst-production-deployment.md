---
description: Production deployment & domain cutover runbook for PMST US-Nepal
---

# PMST US-Nepal — Production Deployment & Domain Cutover Runbook

Deploy the full PMST stack (Angular frontend, `pmst-api-service`, and `pmst-ticketing-service`) straight to AWS production, migrate all WordPress content/images/users, then point `pmstusnepal.com` at CloudFront.

> **Companion docs:**
> - General development workflow, repos, CI/CD and standards: [`pmst-development-workflow.md`](pmst-development-workflow.md)
> - Events & ticketing roadmap / status: [`D:/pmst-services/pmst-ticketing-service/doc/eventplan.md`](file:///D:/pmst-services/pmst-ticketing-service/doc/eventplan.md)
> - Sync rule: when this runbook or event/ticketing status changes, update the companion doc first, then refresh this one and the visual dashboard.

## Decisions (confirmed)

- **Scope:** Straight to production (no test stack first).
- **Ticketing:** Included — build its missing CI/CD + config and deploy alongside the API service.
- **Data:** Full migration — content + images + users.
- **Admin/login:** A **brand-new** super-admin `pmstusnepal@gmail.com` (not in the WP export) is created fresh in Cognito + DB; all migrated WP users log in via Cognito password-reset email on first sign-in.
- **DNS:** Delegate the `pmstusnepal.com` zone to **AWS Route 53** (registrar stays at Hostinger) for a clean apex alias to CloudFront.
- **Registrar:** Stays at Hostinger; only nameservers change.

## Inputs / Shared Credentials (do NOT commit literals)

- **Prod DB password & super-admin password** must be stored in **GitHub Secrets** (`TF_VAR_DB_PASSWORD`) and passed to Cognito/Secrets Manager at create time. The literal password is intentionally NOT written in this runbook.
- **AWS account:** `602301275673`, region `us-east-1`.

## Email Service (Cognito)

- Cognito can only send via **`COGNITO_DEFAULT`** or **Amazon SES**. It cannot use Hostinger SMTP directly.
- **Option A — Cognito default:** out-of-the-box, ~50 emails/day cap. Fine for the initial admin + small user batches. Currently configured in `modules/cognito/main.tf` (`email_sending_account = COGNITO_DEFAULT`).
- **Option B — Amazon SES (recommended for the WP user reset batch):** verify `pmstusnepal.com` in SES, add DKIM/verification records to Route 53, switch Cognito to `DEVELOPER`/SES. SES only sends; Hostinger continues to receive mail (MX unchanged).
- **Recommendation:** Cognito default for the admin now; enable SES before the bulk WP-user password-reset send.

## Current State

| Area | Status |
|---|---|
| Terraform infra (VPC, Cognito, RDS, Lambda x2, API GW, S3, CloudFront, image-processor) | Ready (`pmstmigrateinfra/main.tf`) |
| Ticketing Lambda + `/tickets` routes | Already in IaC (`modules/lambda/main.tf`, `modules/api-gateway/main.tf`) |
| Cognito groups `admin`/`contributor`/`user` | Ready (`modules/cognito/main.tf`) |
| CloudFront custom domain + ACM wiring | Ready, needs cert ARN (`modules/cloudfront/main.tf`) |
| Infra CI/CD (GitHub OIDC, branch-driven) | Ready (`.github/workflows/deploy.yml`) |
| API service CI/CD + `deploy/environments.yaml` | Ready |
| Frontend CI/CD + `deploy/environments.yaml` | Ready |
| **Ticketing CI/CD** | **MISSING** — no `.github/` in `pmst-ticketing-service` |
| Migration scripts (content/users/follows/comments) | Ready (`pmst-migration/scripts/01..13`) |
| Image processing → S3 | Ready (`scripts/14_process_and_upload_images.py`) |
| Cognito user-link script | **Placeholder** (`scripts/11_link_user_profiles_to_cognito.py`) |
| Hard-coded secrets in migration repo | **Risk** — `scripts/config.py` (DB host/pw), `pmst-deploy_accessKeys.csv` |

## Gaps to Resolve (G1–G10)

| # | Gap | Fix |
|---|---|---|
| G1 | No API Gateway custom domain configured. | **Use API Gateway invoke URL** — no custom domain. |
| G2 | API path/stage mismatch (frontend expects `/v1/api` and a separate `tickets.` host). | Update `environment.prod.ts` and `deploy/environments.yaml` to `/prod/api` and `/prod/tickets` on the single API Gateway. |
| G3 | No bulk Cognito user-import script. | Phase 7: add `create_cognito_users.py` and implement `11_link_user_profiles_to_cognito.py`. |
| G4 | `cfDomain` placeholder in `environment.prod.ts`. | Phase 4: set to prod CloudFront/domain before build. |
| G5 | SES sandbox limits bulk email. | Phase 2b: request production access early (~24 h). |
| G6 | Hard-coded secrets in `scripts/config.py`. | Phase 0: rotate/remove; read from `.env`. |
| G7 | Image source assumed at `D:\pmstmigrate\src\assets\images`. | Phase 6: confirm source images exist (or pull from Hostinger first). |
| G8 | RDS is private in prod. | Phase 5: use SSM port-forward via a small bastion or temporary public toggle. |
| G9 | WAF/Shield referenced in docs but not in Terraform. | Optional post-launch. |
| G10 | `contributor` role mismatch with frontend `User.role` type. | Optional: align type + role checks later. |

## Phase 0 — Prerequisites & Cleanup (one-time)

1. Create GitHub OIDC provider + two IAM roles per `pmstmigrateinfra/bootstrap/README.md`.
2. Add GitHub Secrets to each repo: `AWS_ACCOUNT_ID=602301275673`, `TF_VAR_DB_PASSWORD`, and `ACM_CERT_ARN` (added after Phase 2).
3. **Rotate + remove secrets from source:** delete `src/doc/pmst-deploy_accessKeys*.csv`, refactor `pmst-migration/scripts/config.py` to read from env/`.env` (no hard-coded host/password), add both to `.gitignore`.
4. Fix Terraform backend: replace `dynamodb_table` with S3 native lockfile (`use_lockfile`).

## Phase 1 — Ticketing Service CI/CD

1. Add `pmst-ticketing-service/deploy/environments.yaml` with a `prod` block (mirror `pmst-api-service`).
2. Add `pmst-ticketing-service/.github/workflows/deploy-ticketing-service.yml`: build JAR → upload to S3 → update `pmst-prod-ticketing-service` → publish version (SnapStart).
3. Confirm handler `com.pmst.ticketing.LambdaHandler` and target function name match IaC.
4. Merge ticketing `feature/initial-setup` → `main` (deploy happens after infra exists in Phase 3).

## Phase 2 — Route 53 Zone + ACM Certificate

1. Create a **Route 53 public hosted zone** for `pmstusnepal.com`; note the 4 assigned NS records (used in Phase 8).
2. Pre-copy existing Hostinger records into the zone (MX, SPF, DKIM, DMARC, any app subdomains) so email keeps working after delegation.
3. Request an ACM certificate in **us-east-1** for `pmstusnepal.com` and `www.pmstusnepal.com` (DNS validation) and let ACM add the validation CNAMEs into the Route 53 zone.
4. Wait for status **Issued**.
5. Put the certificate ARN into `ACM_CERT_ARN` GitHub secret / `TF_VAR_acm_certificate_arn`.

## Phase 2b — SES Email Setup

1. Verify `pmstusnepal.com` in **Amazon SES** (us-east-1). SES generates 3 DKIM CNAMEs + optional MAIL FROM records; add them to the Route 53 zone.
2. Choose a from address, e.g. `no-reply@pmstusnepal.com`.
3. Request **SES production access** (exit sandbox) — required to email non-verified WP users. Approval ~24 h; submit early.
4. Wire Cognito → SES: update `modules/cognito/main.tf` `email_configuration` to `email_sending_account = "DEVELOPER"`, `source_arn` = SES identity ARN, `from_email_address = no-reply@pmstusnepal.com`; add a variable and re-apply.
5. Fallback: if SES prod access is not granted, keep `COGNITO_DEFAULT` and stagger the WP-user reset batch under the ~50/day cap.

## Phase 3 — Provision Production Infrastructure

```powershell
cd d:\pmstmigrateinfra
$env:TF_VAR_db_password = "<from-github-secret>"
$env:TF_VAR_acm_certificate_arn = "arn:aws:acm:us-east-1:602301275673:certificate/<uuid>"
terraform init -backend-config=deploy/backend-prod.hcl
terraform apply -var-file=deploy/prod.tfvars
```

Collect outputs:

```powershell
terraform output -raw cloudfront_domain_name
terraform output -raw cloudfront_distribution_id
terraform output -raw api_gateway_endpoint
terraform output -raw rds_endpoint
terraform output -raw cognito_user_pool_id
terraform output -raw cognito_web_client_id
terraform output -raw media_bucket_name
```

> Note: `prod.tfvars` sets `db_publicly_accessible = false`. Plan DB access for migration (Phase 5).

## Phase 3b — API Routing (G1 + G2)

Both services share **one** API Gateway (`/api` → api-service, `/tickets` → ticketing-service), stage `prod`. **No API custom domain**.

1. From Phase 3 output get the invoke base: `https://<api-id>.execute-api.us-east-1.amazonaws.com/prod`.
2. Set in `pmstmigrate/src/environments/environment.prod.ts` and `deploy/environments.yaml`:
   - `apiUrl = https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/api`
   - `ticketingUrl = https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/tickets`
3. Confirm Lambda `PMST_CORS_ALLOWED_ORIGINS` includes `https://pmstusnepal.com` + `https://www.pmstusnepal.com`.

## Phase 4 — Deploy Backends & Frontend (GitHub Actions on `main`)

1. Update `deploy/environments.yaml` in the API and ticketing repos with prod API/Cognito/media values.
2. Update `pmstmigrate/src/environments/environment.prod.ts` + `deploy/environments.yaml` with prod `apiUrl` and `cfDomain`.
3. Push `main` in `pmst-api-service`, `pmst-ticketing-service`, and `pmstmigrate`.
4. Invoke each Lambda once so **Flyway** creates schemas (`pmstdb` app tables + `tk_` ticketing tables).

## Phase 5 — Data Migration (content + follows + comments)

1. Choose RDS access: SSM port-forward via a small bastion/EC2 (preferred) or temporarily set `db_publicly_accessible = true`, migrate, then revert.
2. Configure `d:\pmst-migration\.env` (RDS host, `DB_PASSWORD`, `CF_DOMAIN` = prod CloudFront, `MEDIA_BUCKET=pmst-prod-media`, `EXPORTS_DIR`).
3. Ensure fresh WP exports are in `exports/`.
4. Run:
   ```powershell
   cd d:\pmst-migration
   pip install -r requirements.txt
   python run_all_migrations.py   # 01..10, 12, 13
   ```
5. Validate with `validate.sql` (article/user/gallery/comment counts).

## Phase 6 — Image Migration

1. Confirm source images at `D:\pmstmigrate\src\assets\images` (WP media pulled down) and Pillow installed.
2. Dry run then apply:
   ```powershell
   cd d:\pmst-migration\scripts
   python 14_process_and_upload_images.py                 # dry run
   python 14_process_and_upload_images.py --apply --workers 4
   ```
   - Produces 4 tiers (`thumb/card/hero/master`) × WebP+JPEG under `media/{yyyy}/{mm}/{basename}/` in `pmst-prod-media`.
   - Backfills `articles.image_key` and `gallery_images.image_key`.
3. Spot-check a few images via CloudFront media URL; run `verify_image_files.py` / `check_image_status.py`.

## Phase 7 — Users, Admin & Login Cutover

> **Role model reality (verified in code):** there is **no `super-admin`** role. The app recognizes only `admin`, `moderator`, `user`. Admin power is enforced by the DB `users.role` value. The Cognito `admin` group is not what the code checks. "Super-admin" = the `admin` role.

1. **Create new super-admin `pmstusnepal@gmail.com`:**
   - Cognito `AdminCreateUser` (given_name/family_name set), add to the `admin` group.
   - Set a permanent password from GitHub Secret or leave `FORCE_CHANGE_PASSWORD` + invite email.
   - Insert matching `users` row (`role='admin'`, `status='active'`, `cognito_id=<sub>`) and a `user_profiles` row.
2. **Create migrated Cognito users (G3):** write `scripts/create_cognito_users.py` reading `wp_users.csv`, bulk `AdminCreateUser` with `FORCE_CHANGE_PASSWORD`, assign Cognito groups from `users.role`.
3. **Link Cognito ↔ DB:** implement `11_link_user_profiles_to_cognito.py` (list Cognito users, match by email, set `users.cognito_id = sub`). Run it.
4. **First-login flow:** migrated users receive Cognito reset/temporary-password email and set a new password (no WP hash migration).
5. Verify login end-to-end for `pmstusnepal@gmail.com` (admin dashboard access) and one standard migrated user.

## Phase 8 — DNS Cutover (Route 53 delegation)

> Do this only after the CloudFront URL serves the app correctly and login/media work.

**In Route 53 (zone from Phase 2):**
1. Add apex `pmstusnepal.com` **A + AAAA alias** → CloudFront distribution.
2. Add `www.pmstusnepal.com` **A + AAAA alias** → same CloudFront distribution.
3. Confirm MX / SPF / DKIM / DMARC records were copied over (Phase 2) so email is unaffected.

**At the Hostinger registrar (actual cutover):**
4. Replace `ns1.dns-parking.com` / `ns2.dns-parking.com` with the **4 Route 53 NS records** from Phase 2.
5. ACM certificate already covers both names; HTTPS works once NS propagation completes.

**Timeline:** ACM ~minutes; NS delegation propagation typically **1–24 h**; alias record changes within the zone propagate in minutes after delegation is live.

**Rollback:** revert registrar nameservers to `ns1/ns2.dns-parking.com` (Hostinger DNS still intact).

## Phase 9 — Verify & Decommission

1. Smoke test on `https://pmstusnepal.com`: home, `/spotlight`, `/news`, `/all-models`, article detail, gallery detail, `/tickets` (events), login, submit forms, comments, follow.
2. Watch CloudWatch logs (Lambda + API GW) and RDS metrics for 24–48 h.
3. If public access was toggled for migration, set `db_publicly_accessible = false` and re-apply.
4. After ~1 week stable, decommission the Hostinger WordPress site (keep email + registrar).

## What Setup Happens Where

- **Hostinger:** only the registrar nameserver change (dns-parking → 4 Route 53 NS records); leave the domain registration in place; later stop the WP site.
- **AWS:** create Route 53 zone (copy email records); request ACM cert; `terraform apply` prod; deploy 2 Lambdas + frontend via GitHub Actions; run Flyway; create new super-admin + link/create Cognito users; upload images to `pmst-prod-media`; add apex/www alias records to CloudFront.
- **GitHub (not GitLab):** create OIDC roles + secrets; add ticketing workflow; push `main` in all repos to trigger prod deploys.

## Key Risks

- **NS delegation propagation:** 1–24 h; do during low traffic and pre-stage all Route 53 records first.
- **Email continuity:** missing MX/SPF/DKIM/DMARC in Route 53 breaks mail after delegation.
- **Private RDS during migration:** need SSM/bastion or temporary public toggle.
- **Cognito default email caps:** large user reset volume may need SES.
- **Secrets in repo:** must be rotated/removed before any push.
- **Straight-to-prod:** no test buffer — validate everything on the CloudFront URL before the NS switch.
