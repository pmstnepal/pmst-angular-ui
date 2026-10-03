# PMST US-Nepal — Production Deploy Progress Log

> Resume file for the straight-to-prod AWS migration. Companion to
> `.windsurf/workflows/pmst-production-deployment.md` (runbook) and
> `.windsurf/workflows/pmst-development-workflow.md`.
> Last updated: **2026-09-08 — post-launch audit.** The site is LIVE on AWS.
> See `## Post-Launch Open Items (TODO)` at the bottom for the current work queue —
> **login is broken in production (T1)**, read that before starting anything else.

## Environment facts
- AWS account: `602301275673`, region `us-east-1`, CLI identity: IAM user `pmst-deploy`
- Target domain: `pmstusnepal.com` — **CUT OVER TO AWS.** Apex and `www` both serve the
  Angular app from S3 via CloudFront `ECN0HO6STY22O` (verified 2026-09-08: `Server: AmazonS3`,
  `Via: ... cloudfront.net`). Hostinger no longer serves the site.
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

## PENDING COMMITS — ⚠️ STALE, re-verify before trusting
> This list was written before Phase 4. Much of it **has since been committed** — e.g.
> `environment.prod.ts` landed in `7c44077`. Confirm per repo with
> `git log --oneline -1 -- <path>` rather than assuming anything below is still outstanding.
> The infra repo (`pmstmigrateinfra`) is the one most likely to still hold uncommitted work,
> since the Phase 3 apply fixes were made in-place.

Original list:
- `pmstmigrateinfra`: backend.tf, modules/rds/main.tf, modules/s3/main.tf, modules/image-processor/main.tf (NOT secrets.auto.tfvars — gitignored)
- `pmst-api-service`: pom.xml, src/main/java/com/pmst/api/LambdaHandler.java
- `pmst-ticketing-service`: pom.xml, deploy/environments.yaml, .github/workflows/deploy-ticketing-service.yml, src/main/java/com/pmst/ticketing/LambdaHandler.java
- `pmstmigrate` (frontend): src/environments/environment.prod.ts
- `pmst-migration`: scripts/config.py

### Phase 4 / 8 / 9 — app deploy + DNS cutover (DONE)
Confirmed live 2026-09-08 by direct probe, not by log entry:
- **Frontend deployed.** `pmst-prod-frontend` serves through CloudFront `ECN0HO6STY22O`;
  deployed bundle `Last-Modified: 2026-08-17`.
- **DNS cut over.** Apex + `www` resolve to CloudFront. Hostinger is out of the serving path.
- **Both Lambdas live.** `GET /prod/api/articles` → 200 (~0.19 s warm), `/prod/api/settings`
  → `{"eventsEnabled":true}`, `/prod/api/galleries` → 200. Flyway ran (`V1`–`V7` applied).
- **Images working.** `https://pmstusnepal.com/media/<key>/card.webp` → `200 image/webp`.

**Phase 5 (data migration) is PARTIALLY complete, not blocked.** Content is in prod:
131 published articles, 13 galleries. But the documented source is ~1,446 `wp_posts` —
see **T7**. Galleries reconcile 13/13; articles do not.

**Phase 9 residual:** confirm `db_publicly_accessible` was set back to `false` after the
migration window. Unverified as of this audit.

### Phase 4 manual command outline (historical — this is how it was deployed)
1. API: `mvn -f d:\pmst-services\pmst-api-service package -DskipTests` → `aws s3 cp target\*-lambda.jar s3://pmst-terraform-state/deployments/prod/pmst-api-service-latest.jar` → `aws lambda update-function-code --function-name pmst-prod-pmst-api-service --s3-bucket pmst-terraform-state --s3-key deployments/prod/pmst-api-service-latest.jar` → `aws lambda wait function-updated ...` → `aws lambda publish-version ...`
2. Ticketing: same with `pmst-ticketing-service` / `pmst-prod-ticketing-service`.
3. Frontend: `npm --prefix d:\pmstmigrate run build:prod` (verify script name) → `aws s3 sync dist/<app>/browser s3://pmst-prod-frontend --delete` → `aws cloudfront create-invalidation --distribution-id ECN0HO6STY22O --paths "/*"`.
4. Smoke test API GW: `curl https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod/api/articles` (expect 200 JSON once Flyway has created tables). Check CloudWatch for `pmst-prod-pmst-api-service` Flyway logs.

### Phase status (reviewed 2026-09-08)
- **Phase 2b — SES: STILL OPEN.** Needed before bulk WP-user password-reset email. Note this
  is now double-blocking: password reset is not implemented in the API either (see T1), so
  migrated WordPress users have no route in at all.
- **Phase 5 — Data migration: PARTIALLY DONE.** No longer "blocked" — content is live
  (131 articles, 13 galleries). But the article count does not reconcile with the ~1,446
  documented source rows → **T7**. Prod RDS is still private
  (`db_publicly_accessible=false`), so the reconciling row count needs a tunnel or a
  short-lived public toggle. Migration `.env`:
  `DB_HOST=pmst-prod-postgres.c2rwsbwwhr5u.us-east-1.rds.amazonaws.com`, `DB_PASSWORD=...`,
  `CF_DOMAIN=https://d2f5kzshaq1nf6.cloudfront.net`.
- **Phase 6 — Image migration: DONE.** `pmst-prod-media` serves tiered images; verified
  `200 image/webp` through the apex domain. Caveat: article *body* images were written in a
  different URL shape and 404 → **T3**.
- **Phase 7 — Users: STATUS UNKNOWN.** Super-admin `pmstusnepal@gmail.com` in Cognito pool
  `us-east-1_1dEqFgYNR` + DB row with `role='admin'` (no separate super-admin role in code —
  `admin` governs privileges). **Cannot be verified while T1 stands**, since nobody can log
  in to check.
- **Phase 8 — DNS cutover: DONE.** Apex + `www` alias to CloudFront; registrar nameservers
  moved to the 4 Route 53 NS above.
- **Phase 9 — Verify & decommission: IN PROGRESS.** Do **not** decommission Hostinger yet —
  T1/T2 are unresolved and the rollback path (revert registrar NS to `ns1/ns2.dns-parking.com`)
  should stay available. Also still unconfirmed: whether `db_publicly_accessible` was
  returned to `false` after migration.

## 2026-08-09 Hotfix — CloudFront tiered images + YouTube API key
- Re-applied `imageKey` → CloudFront tier URLs (`card`/`thumb` for lists/thumbnails, `hero` for detail/meta, `master` for lightbox).
- Updated `home`, `spotlight`, `news-detail`, `showcase-detail`, `showcase-list`, `post-carousel`, and `gallery-carousel` to pass `imageKey` and the correct tier.
- Lower-cased category query for `entertainment` and `nepal news` in `home` and `spotlight`.
- Built prod bundle, synced `dist/pmst-angular-ui/browser` to `s3://pmst-prod-frontend`, and invalidated CloudFront `ECN0HO6STY22O`.
- Added `youtube_api_key` to `secrets.auto.tfvars` and ran `terraform apply -target="module.lambda"` to inject `PMST_YT_API_KEY` into `pmst-prod-pmst-api-service` and `pmst-prod-ticketing-service`.
- Smoke tests: CloudFront `card.webp`/`hero.webp` 200 image/webp; API `/articles` returns `imageKey`; API `/youtube/playlists` returns 3 videos.

---

# Post-Launch Open Items (TODO)

> Compiled 2026-09-08 from a live audit of the running site against this plan.
> Ordered by severity. Every item carries its root cause and file references so it can be
> picked up without re-investigating. **T1 and T2 are live production faults.**

## Audit evidence (re-runnable)

Probes against `https://q9zxosk8f9.execute-api.us-east-1.amazonaws.com/prod`.
On Windows, `curl` needs `--ssl-no-revoke` or it fails with `CRYPT_E_REVOCATION_OFFLINE`.

| Probe | Result 2026-09-08 |
|---|---|
| `POST /api/auth/login` | **401** `{"message":"Unauthorized"}` — API GW, before Lambda |
| `OPTIONS /api/auth/login` | 200, correct `Access-Control-Allow-Origin` — **CORS is not the fault** |
| `GET /tickets/events` | **401** `{"message":"Unauthorized"}` |
| `GET /api/articles` | 200 · `totalElements: 131`, all `published` |
| `GET /api/galleries` | 200 · `totalElements: 13` |
| `GET /api/articles?category=nepal news` | `0` |
| `GET /api/articles?category=nepal-news` | `8` |
| `GET /api/youtube/playlists?ids=…&titles=…&max=30` | 200 · 3 playlists, 22 videos ✅ |
| `GET /media/<key>/card.webp` (apex) | `200 image/webp` ✅ |

> Note: `/api/youtube/playlists` returns **400 with an empty body** when called without its
> required `ids`/`titles` params. That is a bad probe, not an outage — YouTube works.

---

## T1 — P0 · Login is impossible for every user · ⏳ FIX WRITTEN, NOT APPLIED

> **Status 2026-10-03:** all four blockers fixed in `pmstmigrateinfra` commit `fae267f`
> on branch `feature/infra-rds-update`. `terraform validate` passes; plan against prod
> state is **16 to add, 7 to change, 1 to destroy**. The destroy is
> `aws_api_gateway_deployment.main` replaced via `create_before_destroy` to publish the
> new method set — the REST API id (`q9zxosk8f9`) and invoke URL do not change.
> The Cognito client updates **in place**, so client id `7vs3hhs2v743l34d1j8jhqbnqk`
> is preserved and the frontend is unaffected.
>
> **Not yet applied.** Run the apply + user-creation steps in
> `.windsurf/workflows/pmst-production-deployment.md` → *Phase 10 — Login Cutover*.
> **T1 alone does not restore login — see [T11], the pool has zero users.**

`POST /api/auth/login` never reaches the Lambda. **Four independent blockers sit in series;
fixing any one alone leaves login broken.**

1. **API Gateway auth rule.** `modules/api-gateway/main.tf` declares `GET`/`NONE` (93-98) and
   `OPTIONS`/`NONE` (130-139) explicitly; everything else falls through to the `ANY` method
   with `COGNITO_USER_POOLS` (111-117). In REST API Gateway an explicit method beats `ANY`,
   so every POST/PUT/PATCH/DELETE on `/api/*` hits the Cognito authorizer. The
   token-issuing endpoint therefore requires a token. Repo-wide, `authorization = "NONE"`
   appears only at lines 97, 134, 232 — **there is no public POST path anywhere.**
   Affected: `POST /api/auth/login`, `/register`, `/refresh`. (`GET /api/auth/me` passes the
   gateway and is then correctly rejected by Spring.)
2. **No `aws_api_gateway_gateway_response` resources exist** (zero matches repo-wide), so the
   authorizer's 401 carries no CORS headers. The browser surfaces this as a CORS error /
   status 0 — **which is why this has been mistaken for a CORS bug rather than an auth-config
   bug.** `login.component.ts:150` then shows a misleading generic message.
3. **Cognito auth flow mismatch.** `AuthService.java:52` uses `ADMIN_USER_PASSWORD_AUTH`, but
   `modules/cognito/main.tf:94-98` grants only `ALLOW_USER_SRP_AUTH`,
   `ALLOW_REFRESH_TOKEN_AUTH`, `ALLOW_USER_PASSWORD_AUTH` → Cognito would reject with
   `InvalidParameterException: Auth flow not enabled for this client`.
4. **`COGNITO_CLIENT_ID` is never injected.** `modules/lambda/main.tf:73-84` sets only
   `COGNITO_USER_POOL_ID` and `COGNITO_ISSUER_URI`. `application.properties:43` resolves to
   `""` → `AuthService.java:54` calls `.clientId("")`. The `cognito_web_client_id` output
   (`outputs.tf:66`) exists but is unwired. Separately the Lambda role
   (`modules/lambda/main.tf:29-47`) grants only `secretsmanager:GetSecretValue` + three
   `s3:*Object` actions — **no `cognito-idp:*` anywhere in the infra repo** — so
   `AdminInitiateAuth` / `AdminCreateUser` / `AdminSetUserPassword` would hit
   `AccessDeniedException`.

**Implementation note.** Switching `AuthService.login` to non-admin `InitiateAuth` +
`USER_PASSWORD_AUTH` resolves (3) and removes the IAM requirement in (4) — likely the smaller
change. Spring itself is already correct: `SecurityConfig.java:50-51` permits the auth paths.
Any gateway change must be added to the deployment `triggers`/`depends_on`
(`main.tf:297-317`) or the stage will not redeploy.

**Also missing while here:** `/auth/confirm`, `/auth/forgot-password`, `/auth/reset-password`
are permitted in Spring but unimplemented (404), and `login.component.ts:70` has a dead
`<a href="#">Forgot your password?</a>` — no service method, no route. Password reset does
not exist, which matters because migrated WP users were expected to sign in via reset.

**Verify fixed:** `curl --ssl-no-revoke -X POST .../prod/api/auth/login -d '{"username":"x","password":"y"}'`
returns a Spring-generated 400/401 with a JSON body — **not** `{"message":"Unauthorized"}`.

**Route to:** `pmst-infra` (opus — Terraform, high blast radius). Bundle T10 with it.

---

## T2 — P0 · Public Events API blocked; the page only *looks* static · ⏳ FIX WRITTEN, NOT APPLIED

> **Status 2026-10-03:** fixed in the same commit as T1 (`fae267f`) — `tickets_proxy_get`
> adds a public `GET` mirroring `api_proxy_get`, and it is registered in the deployment
> triggers. Ships with the T1 apply. Note the catalog stays empty until at least one event
> is **PUBLISHED** via `/admin/events`, since `listPublished()` returns only `PUBLISHED`.

**Correction to an earlier read of this:** the Events page is **not** a static mock. It is
fully wired to the API — `events-list.component.ts:136,153` injects `TicketingService` and
calls `listPublished()`; `event-detail.component.ts:150,161,197` calls `getEventBySlug`,
`listCategories`, `createReservation`. There is no mock data anywhere in the feature.

Root cause is the same class as T1: `modules/api-gateway/main.tf:209-214` gives
`/tickets/{proxy+}` **only** `ANY` + `COGNITO_USER_POOLS`, with no public-GET twin — while
the backend intends it public (`pmst-ticketing-service` `SecurityConfig.java:67`, `permitAll`
on `GET /events/**`). Anonymous visitors get a gateway 401 before the Lambda runs.

The 401 is then swallowed by `events-list.component.ts:158-161`
(`error: () => { this.events.set([]); this.loading.set(false); }`), which renders the
"No events found" empty state at :119-127 — visually indistinguishable from a static
placeholder. `event-detail.component.ts:156` does the same, showing "Event not found."

**Secondary:** the CORS allow-list at `main.tf:271-277` is hardcoded to `pmstusnepal.com` and
`www.pmstusnepal.com`. Viewing via the CloudFront domain fails preflight regardless of auth.

**Prerequisite:** `listPublished()` returns only `PUBLISHED` events, so at least one event
must be published via `/admin/events` before the list is non-empty even after the fix.

**Fix shape:** mirror `api_proxy_get` (main.tf:90-105) onto `tickets_proxy` with
`authorization = "NONE"`, and add it to the deployment `triggers`/`depends_on` (main.tf:302-316).

**Route to:** `pmst-infra`. Ship together with T1 — same file, same redeploy.

---

## T3 — P1 · Article body galleries · 🟡 NARROWED — deferred by decision 2026-10-03

> **Scope reduced.** Standalone gallery pages, article featured images, card/thumb tiers and
> the lightbox are all **confirmed working on live** after the imageKey/CloudFront fixes.
> What remains is specifically **galleries embedded inside article body HTML**.
>
> **Explicitly deferred** — owner is focusing on login (T1/T11) first. Do not start this
> without re-confirming priority. Everything below remains accurate for whoever picks it up.

`news-detail.component.ts:578`:

```ts
const stripped = raw.replace(/<img[^>]+>/gi, '');   // deletes EVERY <img> in the body
```

Every image inside an article body is removed before `[innerHTML]` binding (:72). The
Gutenberg wrappers survive — `<figure class="wp-block-gallery">`, `<ul class="blocks-gallery-grid">`,
`<figcaption>` — so the reader sees empty boxes, stray captions and broken layout exactly
where the gallery should be. This is a **stale local-dev workaround** from commit `e298e7d`
(added when no images existed locally), never removed when the CloudFront/imageKey pipeline
landed in `f211c9a` / `1cbd1d1`.

**Removing the regex alone will not fix it** — there is a second defect underneath.
`04_migrate_articles.py:29-33` → `config.py:48-52` applied a blind whole-string replace of
`pmstusnepal.com/wp-content/uploads/` → `{CF_DOMAIN}/media/` across the entire HTML blob,
producing flat URLs like `{cf}/media/2023/05/photo-1024x768.jpg`. But
`14_process_and_upload_images.py:109-120` only ever uploaded
`media/{year}/{month}/{basename}/{tier}.webp`. **Every body image URL is therefore a
CloudFront 404**, and WP `-1024x768` / `-300x200` size variants have no S3 counterpart at all.

`ImageUrlMapperService.mapUrl` cannot rescue these: `isWordPressUrl()` (:216) is false (the
domain is already CloudFront) and they don't start with `media/`, so they fall through
:194 unchanged.

**Fix shape:** a new SSR-safe HTML rewriter (regex or `DOMParser` — **not**
`document.createElement`; the app uses `isPlatformBrowser` guards) handling three input
shapes — legacy WP URLs, flat CF URLs, and Quill-authored `data:` URIs — delegating per-`src`
to the existing `ImageUrlMapperService.getTierUrl()`
(`src/app/services/image-url-mapper.service.ts:52-58,122`). Note that service lives in
`src/app/services/`, **not** `core/` or `shared/`. `showcase-detail.component.ts:60` has
identical exposure via `[innerHTML]="gallery()!.description"`, so build it as a shared
injectable. Any surviving `[gallery ids="..."]` shortcodes render as literal text and must be
expanded or hidden.

**Confirm the data shape first**, once DB access exists — this decides how much work it is:
```sql
SELECT content FROM articles WHERE content LIKE '%<img%' LIMIT 3;
```
If `CF_DOMAIN` was unset when `04_migrate_articles.py` ran, the URLs are bare `/media/...`
instead (`config.py:12` defaults it to `""`), which changes the rewriter's matching.

**Unaffected and already correct:** the separate out-of-body gallery from
`articles.gallery_images` (`news-detail.component.ts:592-636`, capped at 6 images), the hero
image (:55), the lightbox, and JSON-LD (:700) — all already route through `imageKey` tiers.

**Route to:** `pmst-frontend` (sonnet) for the rewriter; `pmst-datamigration` (opus) only if
the stored URLs are to be corrected at source instead.

---

## T4 — P1 · Logo missing on live · 🟡 FIXED ON LIVE, BUT NOT DURABLE

> **Status 2026-10-03.** The logo now renders. `src/assets/images/logo/pmst-logo.png`
> (51,356 bytes, 3300×1510, indexed PNG **with a `tRNS` chunk** — real transparency, which
> matters because the header is dark navy) was uploaded manually to
> `s3://pmst-prod-frontend/assets/images/logo/pmst-logo.png` with `Content-Type: image/png`
> and `Cache-Control: public, max-age=86400`, then CloudFront was invalidated.
> Verified: live bytes are sha256-identical to the local file, and Chromium confirms the
> `<img>` loads (naturalWidth 3300, rendered 175×80).
>
> **Cache note:** deliberately *not* the pipeline's `max-age=31536000, immutable` — this
> filename is not content-hashed, so a year-long immutable cache would make any future logo
> correction nearly impossible to push.
>
> ### ✅ Now durable — committed 2026-10-03 (`ee7ac51`)
> The logo is in the repo, so CI builds it and the `--delete` sync can no longer remove it.
> The ignore rule had to change shape: git never descends into an excluded directory, so a
> `!` negation under a plain `src/assets/images/` rule can never fire. The rule now excludes
> the directory *contents* (`src/assets/images/*`) and re-includes only
> `src/assets/images/logo/*.png`. Verified `git add -An src/assets/images/` stages exactly
> one file, with `images/2025`, `images/media` and non-png files under `logo/` still ignored.
>
> **Correction to the original finding below:** it claimed the file did not exist locally.
> It does. Glob hides it (the path is gitignored) and the first filesystem probe used the
> wrong drive-letter case. The stated root cause — assets excluded from the CI build — was
> correct.
>
> **Related, found while sourcing a replacement:** every logo in the media bucket has lost
> its transparency. The JPG tiers flattened alpha (one onto slate grey, `newpmstlogo` into a
> mangled red block) and the WebP tiers are lossy `VP8 ` with no `ALPH` chunk. So the
> migrated media bucket holds **no usable transparent logo** — a sharper instance of the
> [T3] pipeline problem that will affect any transparent PNG in the archive.

<details><summary>Original finding</summary>

### T4 — Logo missing on live

`header.component.ts:19` and `news-detail.component.ts:40` (plus JSON-LD `logo.url` at :705)
reference `/assets/images/logo/pmst-logo.png`.

**Root cause:** `.gitignore:64-65` excludes the whole `src/assets/images/` tree
(`git ls-files src/assets` returns exactly one file, `image-manifest.json`). CI does a clean
`actions/checkout@v4` (`deploy.yml:27-28`), so the logo is simply absent when `ng build`
runs → no `assets/images/` in `dist/` → 404 in production. `angular.json:36-39` is correct
and **not** the problem.

**It is self-healing in the wrong direction:** `deploy.yml:80-83` syncs with `--delete`, so
manually uploading the logo to S3 works until the next deploy silently removes it.

**Options:** (a) un-ignore just the logo — add `!src/assets/images/logo/` and
`!src/assets/images/logo/*.png` after `.gitignore:65` and commit the single PNG, keeping the
3,700+ bulk images out of git; or (b) add a post-sync deploy step and point the references at
a CloudFront URL. (a) is smaller and survives CI.

Note the footer has no logo at all — plain `<h3>PMST</h3>` (`footer.component.ts:15`).

**Route to:** `pmst-frontend`.

</details>

---

## T5 — P2 · `/contact`, `/privacy`, `/terms` do not exist

Confirmed absent from `app.routes.ts`. The `**` wildcard (:93-96) redirects them to the
homepage, so there is no 404 — the links just appear to do nothing.

Linked from `footer.component.ts:62` ("Contact Us"), `:64` ("Terms & Conditions"), `:66`
("Privacy Policy"), plus dead `href="#"` anchors at `register.component.ts:94,96` that should
point at `/terms` and `/privacy` once the pages exist. The header links none of them.

Privacy Policy and Terms are the two that matter for a published site — the register form
asks users to agree to documents that cannot be read.

**Pattern to follow:** `footer.component.ts` (77 lines, zero service injection) is the
simplest standalone component in the repo; `showcase-list.component.ts` for feature-folder
house style. `angular.json:9-13` mandates `scss` / `standalone` / `OnPush`. New routes go
**before** the `**` wildcard, using the existing `loadComponent` lazy pattern.

**Route to:** `pmst-frontend`. Needs real legal copy from the site owner — not Claude-authored.

---

## T6 — P1 · Spotlight "Nepal News" tab returns nothing · NEEDS LIVE CONFIRMATION

`spotlight.component.ts:25` sends the literal label `'nepal news'`; `setCategory()` stores it
and `loadArticles()` passes it straight to `getArticles()` with **no label→slug conversion**.
The data uses `nepal-news`.

API confirms: `category=nepal news` → 0 results; `category=nepal-news` → 8. Introduced by
`f211c9a` ("lower-case categories"), which used a space where the data uses a hyphen.

**Flagged as needing a click-through**, because this was reported as working on live during
the 2026-09-08 review. Either the deployed bundle differs from the working tree, or only the
Entertainment tab was exercised. Check the Nepal News tab specifically before changing code.

**Two candidate fixes:** patch the component's label→slug mapping (smaller), or normalize
category matching in the API to tolerate spaces/hyphens/case (fixes the whole class).

---

## T7 — P1 · Content shortfall: 131 live vs ~1,446 documented

`/api/articles` reports `totalElements: 131`, all `published`. `pmst-migration/README.md`
documents the source as **~1,446 `wp_posts`** (publish+private+pending), and
`04_migrate_articles.py:44-52` migrates all three states. Galleries reconcile exactly (13/13).

Cannot be confirmed from outside — prod RDS is private (`db_publicly_accessible=false`).
**Reconcile with a real row count before the migration is called done.** This is the single
largest publish gap. Run against prod once tunnelled:
```sql
SELECT status, count(*) FROM articles GROUP BY status;
```

Category spread live: `entertainment` 120, `nepal-news` 8, `housing-rental` 2, `sports` 1.
`housing-rental` and `sports` have no UI surface — **accepted as out of scope** per the
2026-09-08 decision that Spotlight carries Entertainment and Nepal News only.

**Also unverified** (endpoints require auth): `comments` (379 documented) and `follows`.

---

## T8 — ✅ CLOSED — NOT drift. This item was wrong.

> **Corrected 2026-10-03.** `youtube_api_key` **is** declared in `secrets.auto.tfvars` and
> properly plumbed: `variables.tf` → `modules/lambda/variables.tf` → `PMST_YT_API_KEY` in the
> lambda env block. A `terraform apply` will **not** wipe it. Verified both sides — the
> variable is declared, and the live function has `PMST_YT_API_KEY` set.
>
> The wiring was uncommitted at the time of the audit, which is what made it look like drift.
> It is now committed in `pmstmigrateinfra` `f7058bb`. No action required.

<details><summary>Original (incorrect) finding</summary>

### ~~T8 — P2 · YouTube API key is Terraform drift~~

The homepage YouTube section **works** — verified 3 playlists / 22 videos. The key was applied
directly via CLI, so the deployed Lambda environment no longer matches Terraform state. A
future `terraform apply` can revert it and silently break the homepage with no code change to
blame. Reconcile the value into `secrets.auto.tfvars` / the lambda module.

</details>

---

## T9 — P2 · Cold-start 504

The first `/api/articles` request of the audit returned **504**; the next three returned 200
in ~0.19 s. The first visitor after an idle period gets an error page. Needs provisioned
concurrency, a scheduled warmer, or an accepted-risk note.

---

## T11 — P0 · The live Cognito pool is EMPTY — nobody exists to log in as

Discovered 2026-10-03 while verifying T1. **Fixing T1 alone will not restore login.**

```
pmst-prod-user-pool (us-east-1_1dEqFgYNR)
EstimatedNumberOfUsers: 0
UsernameAttributes: ["email"]     ← sign-in is by EMAIL, not username
```

The migrated WordPress users **are** in Postgres and reachable through the public profile
endpoint (`GET /prod/api/users/username/<name>`):

| username | email | role | cognitoId |
|---|---|---|---|
| `pmstnepal` | `pmstnepal@gmail.com` | **admin** | **null** |
| `nepaliupdate` | `funkeymedia17@gmail.com` | user | **null** |

`cognitoId` is null on every row. The migration copied profiles and roles but never created
or linked the Cognito identities — that is gap **G3**, and
`11_link_user_profiles_to_cognito.py` is still the placeholder it always was.

**WordPress passwords can never work.** WP stores phpass hashes; Cognito cannot import or
verify them. The documented fallback ("migrated users sign in via password reset") also has
no code behind it — `/auth/forgot-password` and `/auth/reset-password` are listed in
`SecurityConfig.java:50-51` as permitted but are **not implemented** (404), and SES is still
sandboxed (**G5**), so reset mail would not send anyway.

### Why creating one admin by email is enough to get in

`AuthService.login()` calls `UserSyncService.syncFromCognito(email, …)`, which does
`userRepository.findByEmail(email)` — it links by **email**, not by `cognitoId`. So creating
a Cognito user with `pmstnepal@gmail.com` attaches to the existing row and **preserves
`role: "admin"`**; `role: "user"` is only assigned to genuinely new emails.

**Do NOT use `/auth/register` for an email that already has a row.** `register()` calls
`createLocalUser()`, which unconditionally inserts — you would get a duplicate row or a
unique-constraint failure. Create the Cognito user directly (see the runbook).

**Known wart:** `syncFromCognito` finds by email but never writes `cognitoId` back, so the
column stays null even after a successful login. Harmless today since lookup is by email,
but anything keyed on `cognitoId` will not work.

Steps: `.windsurf/workflows/pmst-production-deployment.md` → *Phase 10 — Login Cutover*.

**Still open after that:** bulk user migration (G3). Phase 10 creates exactly **one** user.
Every other migrated user remains unable to log in until G3 and password reset are built.

---

## T10 — Security · ✅ FIXED IN CODE — must be DEPLOYED before the T1 apply

> **Reviewed and fixed 2026-10-03.** `pmst-api-service` commit `3308462`, branch
> `fix/remove-unsafe-user-create`. `mvn compile` → BUILD SUCCESS.
>
> **The risk was real, and worse than first described.** `POST /users` bound the raw `User`
> entity and called `userRepository.save(user)`. Spring Data `save()` **merges** when an id is
> present, so a caller could supply *any existing user's id* and overwrite that row —
> including `role="admin"`. Target ids are not secret: `GET /users/username/{username}` is
> `permitAll` and returns the production admin's UUID in one unauthenticated request.
>
> **Correction to the original finding:** I wrote that the gateway rule T1 removes was the
> only thing protecting this. That was wrong — T1 opens `/api/auth/*`, not `/api/users`, which
> stays behind `ANY` + Cognito. The actual exposure is a three-step chain that T1 *creates*:
>
> 1. `POST /api/auth/register` — public after T1 (it was unreachable before) → anonymous JWT
> 2. `GET /users/username/pmstnepal` — public → the admin row's UUID
> 3. `POST /api/users` with that JWT and `{"id":"<admin-uuid>","role":"admin"}` → takeover
>
> So the conclusion holds for a different reason: **do not apply T1 until this fix is
> deployed.** Not merely merged — the running Lambda must carry it.
>
> The endpoint was dead code; nothing in the frontend called it. User creation goes through
> `AuthService.register` → `UserSyncService.createLocalUser`, which sets role explicitly.
> The three legitimate endpoints are untouched.

<details><summary>Original finding</summary>

### T10 — Security · review BEFORE T1 ships

`UserController.java:72-76` is an unauthenticated-shaped `@PostMapping` on `/users` that
persists a raw `User` entity straight from the request body — a mass-assignment hazard
(a caller could set `role`). It is currently reachable only because
`anyRequest().authenticated()` plus **the very gateway rule T1 removes** stand in front of it.

**Fixing login opens this endpoint.** It must be reviewed in the same unit of work, not after.

**Route to:** `pmst-review-risk` (opus).

</details>
