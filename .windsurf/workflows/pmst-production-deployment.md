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
| **Ticketing CI/CD** | ✅ Created in Phase 1 — `.github/workflows/deploy-ticketing-service.yml` + `deploy/environments.yaml` |
| Migration scripts (content/users/follows/comments) | Ready (`pmst-migration/scripts/01..13`) |
| Image processing → S3 | Ready (`scripts/14_process_and_upload_images.py`) |
| Cognito user-link script | **Placeholder** (`scripts/11_link_user_profiles_to_cognito.py`) |
| Hard-coded secrets in migration repo | ✅ `scripts/config.py` now reads from `.env`. ⚠️ The plaintext `pmst-deploy_accessKeys*.csv` files still sit in `src/doc/` (gitignored + untracked) — delete locally and rotate the keys. |

## Gaps to Resolve (G1–G15)

> Status reviewed **2026-10-03** (login cutover). G11–G14 were found on the **live** site
> after cutover — full detail, root causes and file references live in
> `src/doc/pmst-deploy-progress.md` → `Post-Launch Open Items (TODO)`.

| # | Gap | Status | Fix |
|---|---|---|---|
| G1 | No API Gateway custom domain configured. | ✅ Resolved | **Use API Gateway invoke URL** — no custom domain. |
| G2 | API path/stage mismatch (frontend expects `/v1/api` and a separate `tickets.` host). | ✅ Resolved | Updated `environment.prod.ts` + `deploy/environments.yaml` to `/prod/api` and `/prod/tickets`. |
| G3 | No bulk Cognito user-import script. | ⏳ Open | Phase 7: add `create_cognito_users.py` and implement `11_link_user_profiles_to_cognito.py`. |
| G4 | `cfDomain` placeholder in `environment.prod.ts`. | ✅ Resolved | Set to `https://d2f5kzshaq1nf6.cloudfront.net`. |
| G5 | SES sandbox limits bulk email. | ⏳ Open | Phase 2b: request production access early (~24 h). Blocks password-reset mail — see G11. |
| G6 | Hard-coded secrets in `scripts/config.py`. | ✅ Resolved | Reads from `.env`; raises if missing. |
| G7 | Image source assumed at `D:\pmstmigrate\src\assets\images`. | ✅ Resolved | Confirmed 3,764 images; `SOURCE_IMAGES_DIR` env override added. |
| G8 | RDS is private in prod. | ⏳ Open | Still `db_publicly_accessible=false`. Needed for the G14/T7 row-count reconciliation. |
| G9 | WAF/Shield referenced in docs but not in Terraform. | ⏳ Open | Optional post-launch. |
| G10 | `contributor` role mismatch with frontend `User.role` type. | ⏳ Open | Optional: align type + role checks later. |
| **G11** | **Login is impossible in prod.** `POST /api/auth/login` is rejected by the Cognito authorizer before Lambda; plus 3 more blockers behind it (auth-flow mismatch, unwired `COGNITO_CLIENT_ID`, no `cognito-idp:*` IAM). | ✅ **RESOLVED 2026-10-03** | Applied (16 add / 7 change / 1 destroy). Login verified end-to-end, `role: admin` preserved. See **T1**. |
| **G12** | **Public Events API returns 401.** `/tickets/{proxy+}` has no public-GET method; the Angular page swallows the error and renders an empty state that looks static. | ✅ **RESOLVED 2026-10-03** | `GET /prod/tickets/events` returns 200. Empty until an event is PUBLISHED. See **T2**. |
| **G13** | **Site assets never reach the build.** `.gitignore:64-65` excludes `src/assets/images/`, so CI's clean checkout has no logo; `deploy.yml` `--delete` also wipes manual S3 uploads. | ✅ **RESOLVED 2026-10-03** | Logo committed to the repo (`ee7ac51`); the ignore rule now excludes directory *contents* so the negation works. CI will build it. See **T4**. |
| **G14** | **Article body images are stripped at render**, and the migration wrote body image URLs in a shape that 404s on CloudFront. | 🟡 Narrowed, deferred | Standalone galleries, featured images and the lightbox are fixed. Only in-body galleries remain. See **T3**. |
| **G15** | **The live Cognito pool has ZERO users**, and every migrated user has `cognitoId: null`. Fixing G11 alone still leaves nobody able to log in. WordPress passwords cannot be imported. | 🟡 **Partially resolved** | One admin (`pmstnepal@gmail.com`) created and logging in. Every other migrated user still has no Cognito identity — bulk migration remains **G3**. See **T11**. |

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
4. **Verify API Gateway CORS preflight:**
   ```powershell
   curl.exe -X OPTIONS -s -D - -o NUL `
     -H "Origin: https://pmstusnepal.com" `
     -H "Access-Control-Request-Method: POST" `
     -H "Access-Control-Request-Headers: content-type,authorization" `
     https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/api/articles
   ```
   Expected: `HTTP/1.1 200 OK` with `Access-Control-Allow-Origin: https://pmstusnepal.com` and `Access-Control-Allow-Credentials: true`.

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

> Source images verified: `3,764` files under `D:\pmstmigrate\src\assets\images` (year folders `2019/2023/2024/2025`, plus `gallery/`, `logo/`, `ultimatemember/` and loose root files).

### .env settings required for image migration
```
DB_HOST=<rds-endpoint>
DB_PASSWORD=<github-secret>
CF_DOMAIN=https://<cloudfront-domain>
MEDIA_BUCKET=pmst-prod-media
SOURCE_IMAGES_DIR=D:/pmstmigrate/src/assets/images
```

### Image pipeline order (critical)
`04_migrate_articles.py` stores the raw `_thumbnail_id` (an integer) in `articles.featured_image`. The S3 upload script backfills `image_key` by matching the **filename** (`LIKE '%filename%'`), which won't match a bare ID. Therefore:

1. **Resolve featured-image attachment IDs → real URLs**:
   ```powershell
   cd d:\pmst-migration\scripts
   python fix_featured_images_v3.py
   ```
2. **Resolve any remaining `attachment:XXXX` gallery references** to local paths:
   ```powershell
   python download_missing_gallery_images.py   # or python fix_gallery_rest_api.py
   ```
3. **Dry-run the S3 upload + image_key backfill**:
   ```powershell
   python 14_process_and_upload_images.py            # safe preview
   ```
4. **Apply the upload** (8 derivative objects per source image: thumb/card/hero/master × WebP+JPEG):
   ```powershell
   python 14_process_and_upload_images.py --apply --workers 4
   ```

### Alternative: one-shot data + images
If data migration completed successfully, you can run the entire data + image pipeline in one command:
```powershell
python run_all_migrations.py --with-images
```
This automatically runs `fix_featured_images_v3.py`, then `14_process_and_upload_images.py --apply --workers 4`.

### Verification
- S3 object count should approach `source_images × 8`:
  ```powershell
  aws s3 ls s3://pmst-prod-media --recursive | measure
  ```
- Run `check_image_status.py` to confirm no remote `pmstusnepal.com` URLs remain.
- Run `verify_image_files.py` to validate generated S3 URLs.
- Spot-check a few images via `https://<cloudfront-domain>/media/{yyyy}/{mm}/{basename}/hero.webp`.

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

## Pre-Prod Gate (before DNS cutover)

Do not cut over DNS until:

- [ ] `OPTIONS` preflight returns `200` with allow-listed `Access-Control-Allow-Origin` for both `/api` and `/tickets` paths.
- [ ] Login and at least one authenticated write operation (e.g., comment, follow, article submission) succeed without CORS errors in the browser.
- [ ] Home, `/spotlight`, `/showcase`, `/events`, article detail (`/news/:slug`), gallery detail (`/showcase/:id`) load correctly from the CloudFront URL.
      **Corrected 2026-09-08:** this list previously named `/news`, `/all-models` and `/tickets`.
      None of those routes exist in `src/app/app.routes.ts` — there is no `/news` list route
      (only `/news/:slug`), no `/all-models` at all, and events live at `/events`. Because
      `app.routes.ts` ends in a `**` → `''` wildcard, all three silently redirected to the
      homepage, so this gate "passed" on three routes that were never checked.
- [ ] YouTube playlists load on the home page and videos play without API errors.

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

1. Smoke test on `https://pmstusnepal.com` — **real routes only** (see `src/app/app.routes.ts`;
   the `**` wildcard means a wrong path redirects to home and looks like a pass):
   `/`, `/spotlight` (**both tabs** — Entertainment *and* Nepal News, see T6), `/showcase`,
   `/showcase/:id`, `/news/:slug`, `/events`, `/events/:slug`, `/login`, `/register`,
   `/dashboard`, `/submit/article`, `/submit/gallery`, `/admin`, plus comments and follow.
   Verify the header logo actually renders (T4) and that article bodies show their inline
   images (T3).
   > As of 2026-09-08 this smoke test **fails** at `/login` (T1) and `/events` (T2).
2. Watch CloudWatch logs (Lambda + API GW) and RDS metrics for 24–48 h.
3. If public access was toggled for migration, set `db_publicly_accessible = false` and re-apply.
   > **⚠️ UNVERIFIED as of 2026-09-08.** Data migration ran (content is live), so public access
   > may have been toggled on and never reverted. Confirm before anything else:
   > `aws rds describe-db-instances --db-instance-identifier pmst-prod-postgres --no-cli-pager --query 'DBInstances[0].PubliclyAccessible'`
   > must return `false`.
4. After ~1 week stable, decommission the Hostinger WordPress site (keep email + registrar).

## Phase 10 — Login Cutover (T1 + T11) — ✅ COMPLETED 2026-10-03

> **Executed 2026-10-03. Login works in production.** Apply was 16 added / 7 changed /
> 1 destroyed, exactly as planned. Admin `pmstnepal@gmail.com` logs in and reaches `/admin`
> with `role: "admin"` preserved on the existing migrated row.
>
> Kept as the reference procedure — re-run Steps 3-4 to add further admins.
> **Two gotchas worth knowing before you repeat this:**
> 1. **Propagation lag.** Right after the apply both endpoints still returned the gateway
>    401 even though the method config and stage were already correct. It cleared in about
>    a minute. Verify config, then retry — do not assume the apply failed.
> 2. **Cold start.** The first call to each Lambda after a redeploy can 504 (26.7 s measured
>    against a 29 s timeout). Retry before investigating.
>
> Full root causes: `src/doc/pmst-deploy-progress.md` → T1, T11.

### Step 1 — Pre-flight

```bash
cd /d/pmstmigrateinfra
git branch --show-current          # expect feature/infra-rds-update
git status --porcelain             # expect clean
```

- [x] **T10 reviewed and fixed** (`pmst-api-service` `3308462`). It was a genuine
      anonymous-to-admin escalation once `/auth/register` goes public — see Step 1b, which
      **must run before Step 2**.
- [ ] Confirm `db_publicly_accessible` is `false`:
      `aws rds describe-db-instances --db-instance-identifier pmst-prod-postgres --no-cli-pager --query 'DBInstances[0].PubliclyAccessible'`
- [ ] `youtube_api_key` is in `secrets.auto.tfvars` — already verified, apply will not wipe
      `PMST_YT_API_KEY` (see T8, closed).

### Step 1b — 🔴 Deploy the API service FIRST (ordering is not optional)

`POST /users` let any authenticated caller overwrite an arbitrary user row — including
`role="admin"` — because it bound the raw entity and `save()` merges on a supplied id.
Fixed in `pmst-api-service` `3308462` (branch `fix/remove-unsafe-user-create`), but the fix
only counts once the **running Lambda** carries it.

Applying step 2 before this is deployed opens an anonymous-to-admin chain, because step 2
makes `/auth/register` publicly reachable for the first time:

1. `POST /api/auth/register` → anonymous JWT
2. `GET /users/username/pmstnepal` → the admin row's UUID (public endpoint)
3. `POST /api/users` with `{"id":"<admin-uuid>","role":"admin"}` → takeover

```bash
cd /d/pmst-services/pmst-api-service
mvn package -DskipTests
aws s3 cp target/*-lambda.jar \
  s3://pmst-terraform-state/deployments/prod/pmst-api-service-latest.jar --no-cli-pager
aws lambda update-function-code --function-name pmst-prod-pmst-api-service \
  --s3-bucket pmst-terraform-state \
  --s3-key deployments/prod/pmst-api-service-latest.jar --no-cli-pager
aws lambda wait function-updated --function-name pmst-prod-pmst-api-service
```

- [ ] Confirm the endpoint is gone **before** step 2. While `/api/users` still sits behind
      the Cognito authorizer you cannot test it anonymously; verify from the deployed
      artifact instead — the CloudWatch startup log should no longer map `POST /users`.

### Step 2 — Apply the Terraform

```bash
cd /d/pmstmigrateinfra
terraform plan -var-file="deploy/prod.tfvars"
terraform apply -var-file="deploy/prod.tfvars"
```

Expected plan: **16 to add, 7 to change, 1 to destroy.** The single destroy is
`aws_api_gateway_deployment.main` being replaced through `create_before_destroy` to publish
the new method set — the REST API id (`q9zxosk8f9`) and invoke URL are unchanged, and the
Cognito client updates **in place** so client id `7vs3hhs2v743l34d1j8jhqbnqk` is preserved.
**If you see the Cognito client being replaced, stop** — that would issue a new client id and
break the frontend.

### Step 3 — Create the admin user

The pool has **zero** users. Create one whose email matches the existing admin row so
`syncFromCognito` attaches to it and keeps `role: "admin"`.

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_1dEqFgYNR \
  --username pmstnepal@gmail.com \
  --user-attributes Name=email,Value=pmstnepal@gmail.com \
                    Name=email_verified,Value=true \
                    Name=preferred_username,Value=pmstnepal \
  --message-action SUPPRESS --no-cli-pager

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_1dEqFgYNR \
  --username pmstnepal@gmail.com \
  --password '<strong-password>' \
  --permanent --no-cli-pager
```

- Password policy: min 8 chars with upper, lower, number, symbol.
- `--message-action SUPPRESS` matters — SES is still sandboxed (G5), so skip the invite mail.
- **Do not use `/auth/register` for this email.** It already has a DB row; `register()` calls
  `createLocalUser()` which unconditionally inserts → duplicate row or constraint failure.

### Step 4 — Verify, in order

```bash
# 4a — API first. Note the field is `email`, not `username`.
curl --ssl-no-revoke -X POST \
  https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pmstnepal@gmail.com","password":"<password>"}'
```

Expect JSON with `idToken` / `accessToken` and a user object showing **`"role":"admin"`**.

| Symptom | Meaning |
|---|---|
| `{"message":"Unauthorized"}` | Gateway still rejecting — the stage did not redeploy. Check the deployment was replaced. |
| `InvalidParameterException: Auth flow not enabled` | Step 2's Cognito change did not apply. |
| `AccessDeniedException` | Lambda IAM missing `cognito-idp:*`. |
| 500 referencing an empty client id | `COGNITO_CLIENT_ID` not injected — check the function's env. |

- [ ] 4b — log in at `https://pmstusnepal.com/login`, confirm `/admin` loads.
- [ ] 4c — `https://pmstusnepal.com/events` returns data (T2). Still empty until an event is
      **PUBLISHED** via `/admin/events` — `listPublished()` returns only `PUBLISHED`.
- [ ] 4d — confirm a 401 from a protected route now carries `Access-Control-Allow-Origin`
      (the new gateway responses), so failures read as 401s and not CORS errors.

### What Phase 10 does NOT fix

- **Only one user can log in.** Bulk Cognito migration is still **G3**; every other migrated
  user has `cognitoId: null` and no Cognito identity.
- **Password reset does not exist** — `/auth/forgot-password` and `/auth/reset-password` are
  permitted in `SecurityConfig` but unimplemented (404). Blocked on SES too (G5).
- **WordPress passwords will never work** — phpass hashes cannot be imported into Cognito.

---

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
