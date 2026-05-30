---
description: Complete development guide for migrating PMST US-Nepal from WordPress to AWS serverless architecture
---

# PMST US-Nepal Development Workflow

Complete development guide for migrating from WordPress to AWS serverless architecture.

> 📊 **Visual Dashboard:** See `src/doc/pmst-master-plan.html` for interactive master plan with component status board, architecture diagrams, and migration timeline.

**Technology Stack:**
- **Frontend:** Angular 17+ LTS (stable until Nov 2026)
- **Backend:** Java 21 Lambda functions with SnapStart
- **Authentication:** AWS Cognito + JWT tokens (hybrid approach)
- **Database:** PostgreSQL 16 (RDS) + RDS Proxy
- **Media:** S3 (two buckets: frontend + media) + CloudFront CDN
- **Image Pipeline:** S3 → SQS → Python Lambda (ECR container) + SSM config
- **Secrets:** AWS Secrets Manager (DB creds) + SSM Parameter Store (config)
- **State:** S3 (Terraform state) + DynamoDB (state lock)
- **Observability:** CloudWatch Logs (Lambda + RDS)
- **Infrastructure:** AWS (Lambda, API Gateway, Cognito, S3, CloudFront, SQS, ECR, RDS, VPC)
- **IaC:** Terraform (modular, multi-environment)
- **CI/CD:** GitHub Actions + OIDC (no static AWS keys)

---

## Quick Reference

| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | Angular 17+ LTS | ✅ In Progress |
| Backend Language | Java 21 | ✅ Decided |
| Authentication | Cognito User Pool + JWT | ✅ Decided |
| Lambda Cold Start | SnapStart + Provisioned Concurrency | ✅ Strategy |
| Database | PostgreSQL (RDS) | ✅ Decided |
| Comments System | Replaces Messaging | ✅ Scope Updated |
| Events System | From mage-eventpress | ✅ Identified |
| Follow System | Custom DB table (pmst_follows) | ✅ Identified |
| Infrastructure | Terraform IaC | ✅ Implemented |
| CI/CD | GitHub Actions + OIDC | ✅ Implemented |
| Image Pipeline | SQS + Python Lambda (ECR) + SSM | ✅ Implemented |
| Media CDN | S3 + CloudFront (2 distributions) | ✅ Implemented |
| Secrets | Secrets Manager (DB) + SSM (config) | ✅ Implemented |
| State Backend | S3 + DynamoDB lock table | ✅ Implemented |
| Observability | CloudWatch Logs (30d retention prod) | ✅ Implemented |

---

## GitHub Repositories (pmstnepal org)

| Repo | Purpose | Status |
|------|---------|--------|
| **pmst-angular-ui** | Angular frontend (this project) | 🟢 Active |
| **pmst-terraform-infra** | AWS infrastructure as code (Terraform) | 🟢 Active |
| **pmst-data-migration** | WordPress → PostgreSQL migration scripts | 🟢 Active — `feature/migration-scripts` |
| **pmst-api-service** | Java 21 Lambda — Articles, Galleries, Users, Follows, Comments (consolidated) | 🟢 Active — `feature/initial-setup` |
| **pmst-ticketing-service** | Java 21 Lambda — Event ticketing (separate service) | 🔵 Planned |
| **pmst-auth-gateway** | Future Spring Boot API Gateway — multi-service routing (not active; cognito-local used for local auth) | 🔵 Future |
| **pmstusnepal-plugins** | WordPress plugins (38 plugins) | 🟢 Reference |
| **nepalicommunityhub-plugins** | Secondary site plugins | 🟢 Reference |
| **jwt-token-api** | Spring Boot JWT (retire) | ⚠️ Archive |
| **pmstnepalphp** | PHP codebase | Archive |

---

## Branch-Driven CI/CD

Solo-developer deployment model: develop on feature branches, merge into an environment branch to deploy automatically.

| Branch | Environment | Config | Trigger |
|--------|-------------|--------|---------|
| `feature/*` | — | — | none (local dev + PR) |
| `test` | TEST | `deploy/test.tfvars` (`deployment_mode=test`) | merge/push → apply |
| `main` | PROD | `deploy/prod.tfvars` (`deployment_mode=production`) | merge/push → apply |

**Flow:** `feature/* → PR into test (validate) → PR test → main (production)`. Pull requests run **plan-only**; pushes run **apply**.

### Single `deploy/` folder per repo (one source of truth)
- **pmst-terraform-infra:** `deploy/{test,prod}.tfvars` + `deploy/backend-{test,prod}.hcl`. Single root module at repo root; `terraform init -backend-config=deploy/backend-<env>.hcl` selects state, `-var-file=deploy/<env>.tfvars` selects config.
- **pmst-api-service & pmst-angular-ui:** `deploy/environments.yaml` holds the `test` and `prod` blocks; the workflow reads the block matching the branch (`yq`).

### Add a variable once, both envs use it
1. Declare it in `variables.tf` (infra) or read it from `environments.yaml` (api/frontend).
2. Set the value in **both** `deploy/test.tfvars` and `deploy/prod.tfvars` (or both YAML blocks).
3. Merge to `test` to validate, then to `main` for prod. No module edits, no per-env folders.

### Workflows
| Repo | Workflow | Action |
|------|----------|--------|
| infra | `.github/workflows/deploy.yml` | terraform init+plan(+apply) per branch/env |
| api | `.github/workflows/deploy-api-service.yml` | build JAR → S3 → update `pmst-<env>-pmst-api-service` |
| frontend | `.github/workflows/deploy.yml` | `ng build --configuration <env>` → sync `pmst-<env>-frontend` → CF invalidate |

> Visual version: see the **CICD Strategy** tab in `src/doc/pmst-master-plan.html`.

---

## Part 1: Architecture Overview

### Executive Summary

PMST US-Nepal will migrate from Hostinger WordPress to AWS serverless architecture:
- **Cost reduction:** 60% decrease in operational expenses
- **Performance:** 3x faster load times, 95+ Google PageSpeed score
- **Timeline:** 4-6 months across 3 phases

### Current State
- **Platform:** WordPress on Hostinger shared hosting
- **Domain:** pmstusnepal.com
- **Theme:** Blocksy
- **Plugins:** 38+ plugins (see plugin analysis below)

### Production Environment Details (Hostinger)

> **Last Verified:** May 17, 2026 via Hostinger MCP API

| Property | Value |
|----------|-------|
| **Domain** | pmstusnepal.com |
| **Status** | ✅ Active |
| **Registration Date** | Feb 8, 2025 |
| **Expiration Date** | Feb 8, 2027 |
| **Privacy Protection** | ✅ Enabled |
| **Domain Lock** | ✅ Enabled (prevents unauthorized transfer) |
| **Name Servers** | ns1.dns-parking.com, ns2.dns-parking.com |
| **Hosting Plan** | Business Plan |
| **Hosting Status** | ✅ Active |
| **Server IP (A Record)** | 46.202.182.16 |
| **IPv6 (AAAA Record)** | 2a02:4780:2b:1870:0:1137:670d:d |
| **Email Hosting** | ✅ Hostinger Mail (DKIM, SPF, DMARC configured) |
| **Current Website** | WordPress on Hostinger |

### DNS Configuration Summary

| Record Type | Value | Purpose |
|-------------|-------|---------|
| A | 46.202.182.16 | Points domain to Hostinger server |
| AAAA | 2a02:4780:2b:1870:0:1137:670d:d | IPv6 address |
| MX | mx1.hostinger.com (prio 5), mx2.hostinger.com (prio 10) | Email routing |
| TXT (SPF) | v=spf1 include:_spf.mail.hostinger.com ~all | Email authentication |
| TXT (DMARC) | v=DMARC1; p=none; rua=mailto:info@pmstusnepal.com | Email reporting |
| CNAME (www) | pmstusnepal.com | www redirect |
| CNAME (DKIM) | 4 DKIM records | Email signing |

### Pre-Migration Checklist

Before DNS cutover to AWS:
- [ ] Lower TTL on all DNS records to 300 seconds (5 minutes)
- [ ] Provision AWS infrastructure via Terraform
- [ ] Deploy Angular frontend to S3 + CloudFront
- [ ] Verify SSL certificate on CloudFront
- [ ] Test all 12 routes on CloudFront domain
- [ ] Migrate all 3,337 images to S3
- [ ] Validate PostgreSQL data migration (articles, users, comments)
- [ ] Configure Cognito user pool with custom domain
- [ ] Set up RDS Proxy for database connections
- [ ] Configure Lambda functions with proper environment variables

### DNS Cutover Plan

| Step | Action | TTL | Rollback Time |
|------|--------|-----|---------------|
| 1 | Lower DNS TTL to 300s | 24h before | - |
| 2 | Update A record to CloudFront | Cutover day | 5 min |
| 3 | Update AAAA record to CloudFront | Cutover day | 5 min |
| 4 | Monitor for 24 hours | Post-cutover | 5 min |
| 5 | Decommission Hostinger | After 1 week stability | N/A |

**Rollback:** Switch A/AAAA records back to 46.202.182.16 within 5 minutes if issues arise.

### Live Site Structure
**Navigation:** HOME → SPOTLIGHT (dropdown: ENTERTAINMENTS, NEWS) → SHOWCASE → LOGIN

**Homepage Sections:**
1. Hero banner - "YOUR GATEWAY TO CREATIVITY & ENTERTAINMENT!"
2. YouTube Videos - "CREATION AND CREATIVITY" (Nepali trailers)
3. Latest News - Entertainment articles + "SUBMIT YOUR ARTICLE/NEWS" CTA
4. Model & Gallery - model_gallery CPT entries + "SUBMIT YOUR GALLERY" CTA
5. Join CTA - Submission invitation

**Key URLs:**
- `/spotlight/` → Entertainment articles (category filter)
- `/news/` → News articles
- `/all-models/` → Gallery showcase (model_gallery CPT)
- `/login/` → Login page
- `/submit-your-content` → Article submission (WPUF form)
- `/submit-your-photo-collection` → Gallery submission (WPUF form)

**Footer:** Contact Us | Terms & Conditions | Privacy Policy

### Migration Goals
1. Cost reduction: 60% decrease
2. Performance improvement: 3x faster
3. Scalability: Auto-scaling for traffic spikes
4. Modern tech stack: Angular 17+, Java 21 Lambda

---

## Part 2: Technology Stack Decisions

### Angular Version: 17+ LTS (Not 21)

**Decision:** Use Angular 17+ LTS with upgrade path to v21

| Factor | Angular 17+ | Angular 21 | Verdict |
|--------|-------------|------------|---------|
| LTS Status | ✅ Nov 2026 | ⚠️ Too new | 17+ wins |
| Stability | ✅ Battle-tested | ⚠️ Cutting edge | 17+ wins |
| AI Support | ✅ Better examples | ⚠️ Limited data | 17+ wins |

**Key Features Available:**
- Standalone Components (no NgModule)
- Signals for state management
- SSR/Hydration
- New control flow syntax (`@if`, `@for`)

### Lambda Language: Java 21

**Decision:** Use Java 21 for AWS Lambda functions

**Why Java:**
1. You can read and verify AI-generated code
2. No learning curve for code review
3. Strong typing for complex business logic
4. Enterprise patterns for maintainability

**Cold Start Mitigation:**
1. **SnapStart** (free, 90% improvement)
2. **Provisioned Concurrency** for critical paths (auth, payments)
3. **Tiered Compilation** JVM optimization

### Authentication Architecture: Cognito + JWT (Hybrid Approach)

**Decision:** Use AWS Cognito as the primary user pool with Cognito-issued JWT tokens for API authorization.

**Why This Approach:**
- **Cognito handles:** User registration, login, password reset, MFA, social login (Google/Facebook), email verification
- **Your code focuses on:** Business logic only — no auth boilerplate
- **Standards:** OAuth 2.0 + OIDC (industry standard)
- **Cost:** ~$2.50/month per 10,000 MAU (very affordable)
- **Security:** AWS-managed, SOC 2 compliant, automatic updates

**Architecture Flow:**
```
User → Cognito Hosted UI / Amplify → Cognito User Pool → JWT Tokens
                                                      ↓
                                             API Gateway Authorizer
                                                      ↓
                                              Lambda (user context)
```

**Token Flow:**
1. User authenticates via Cognito (or social provider)
2. Cognito returns `id_token` + `access_token` (JWT)
3. Angular stores token, sends in `Authorization: Bearer <token>` header
4. API Gateway Lambda Authorizer validates JWT signature against Cognito public keys
5. Lambda receives `cognito:username`, `cognito:groups` in context

**User Migration Strategy:**
- **Recommended:** Password reset approach
  1. Export WordPress users (email, username)
  2. Import to Cognito with `FORCE_CHANGE_PASSWORD` status
  3. Users receive "set your password" email on first login
  4. No password hash migration needed (simpler, more secure)
- **Alternative:** Seamless migration with Lambda trigger (validates old WP hash on first login)

**User Profile Architecture:**
- **Two-table approach** (matches WordPress pattern):
  - `users` table: Auth data (id, cognito_id, email, username, role, status)
  - `user_profiles` table: Profile data (user_id FK, display_name, bio, avatar_url, cover_photo_url)
- **Why separate tables:**
  - Clean separation of concerns (Cognito handles auth, PostgreSQL handles profile)
  - Flexible schema (add profile fields without touching users table)
  - Matches WordPress `wp_users` + `wp_usermeta` pattern
  - Easier to cache profile data separately
- **Backend merges them:** JPA `@OneToOne` relationship loads profile with user, `UserDto` returns merged data to frontend
- **Frontend sees single object:** Angular receives complete user with displayName, avatarUrl, etc.
- **Migration mapping:**
  - `wp_users` → `users` (basic auth fields)
  - `wp_usermeta` + `wp_pmst_author_profiles` → `user_profiles` (display_name, bio, avatar_url, cover_photo_url)
  - Script `11_link_user_profiles_to_cognito.py` links migrated users to Cognito via email matching (JIT migration)

**What Happens to jwt-token-api:**
- **Retire it** — Archive the repo, migrate to Cognito
- Cognito replaces all functionality with better security and features

**Implementation Phases:**
- Week 1: Cognito User Pool setup, App Client configuration
- Week 2: Angular Cognito integration (AWS Amplify SDK)
- Week 2: API Gateway Lambda Authorizer (Java)
- Week 3: User migration script (password reset approach)

---

## Part 3: Plugin Analysis & Migration

### Custom PMST Plugins (Rebuild in Angular + Java Lambda)

| Plugin | Functionality | Angular Component | Backend Service |
|--------|--------------|-------------------|-----------------|
| pmst-banner-section | Homepage hero banner | HeroSectionComponent | BannerManagementService |
| pmst-all-news-post-gallery | News display with assets | NewsSectionComponent | NewsAggregationService |
| pmst-model-gallery-cpt | Custom Post Type + Model Categories | GalleryGridComponent, ModelCardComponent | GalleryService |
| pmst-model-gallery-enhanced | Enhanced gallery features | GalleryDetailComponent | GalleryService |
| pmst-model-gallery-single-page | Single gallery display | GalleryDetailComponent | GalleryService |
| pmst-model-gallery-dashboard-clean | Gallery management | GalleryDashboardComponent | GalleryService |
| pmst-all-post-gallery | All posts gallery view | PostGalleryComponent | ContentService |
| pmst-post-carousel | Post carousel display | PostCarouselComponent | ContentService |
| pmst-follow-plugin-v1.0 | Follow/unfollow (custom table) | FollowButtonComponent, FollowerStatsComponent | FollowService |
| pmst-user-profile-header | Profile cover + header | ProfileHeaderComponent, CoverPhotoComponent | ProfileCustomizationService |
| pmst-author-profile-card | Author card display | AuthorProfileCardComponent | UserService |
| pmst-lightweight-youtube-playlists | YouTube video embedding | VideoSectionComponent, YoutubePlaylistComponent | VideoContentService |
| pmst-social-embed-allow | Social media embeds | Built into NewsDetailComponent | N/A (frontend only) |
| pmst-custom-single-post-template | Custom post templates | NewsDetailComponent (WP replica) | ArticleController |
| pmst-messaging-updated | ~~Messaging~~ → Comments | CommentSectionComponent | CommentService |
| contributor-dashboard-enhanced-v3 | Post management dashboard | DashboardComponent | ContentService |
| pmst-rankmath-keyword-injector | SEO keywords | SeoService | SeoService |
| pmst-rankmath-keywords-to-tags | SEO to tags sync | SeoService | SeoService |
| pmst-rankmath-seo-sync-v1.1 | SEO sync | SeoService | SeoService |
| pmst-password-policy-enhanced-1 | Password rules | Auth validation | Cognito policies |
| mage-eventpress | Events & ticketing | EventsListComponent, EventDetailComponent | EventService |

### Contributor Dashboard Categories
The contributor dashboard limits posts to these categories:
- `nepalnews`
- `nepal-entertainment`
- `sports`
- `housing-rental`

### Follow System Database Schema (from pmst-follow-plugin)
```sql
CREATE TABLE pmst_follows (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    allow_status TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_relation (follower_id, author_id)
);
```

### Standard Plugins (Replace with AWS services)

| Plugin | Migration Strategy | New Implementation |
|--------|-------------------|-------------------|
| blocksy-companion | ❌ Remove | Angular + Tailwind |
| ultimate-member | ❌ Remove | AWS Cognito + custom profiles |
| contact-form-7 + drag-drop-upload | ❌ Remove | Custom Angular forms |
| seo-by-rank-math | ❌ Remove | Custom SEO service + SSR |
| litespeed-cache | ❌ Remove | CloudFront CDN + SSR caching |
| wordfence | ❌ Remove | AWS WAF + Shield |
| akismet | ❌ Remove | Custom spam filter Lambda |
| wp-mail-smtp | ❌ Remove | AWS SES |
| google-site-kit | ❌ Remove | GTM + custom analytics |
| image-optimization | ❌ Remove | Lambda image processing + CloudFront |
| media-sync | ❌ Remove | S3 media management |
| fast-indexing-api | ❌ Remove | Sitemap generation service |
| um-recaptcha | ❌ Remove | Google reCAPTCHA v3 integration |
| code-snippets | ❌ Remove | Native Angular/Java code |
| wpuf-media-library-selector | ❌ Remove | Custom S3 media picker |
| mage-eventpress | 🔄 Rebuild | EventService Lambda |

---

## Part 4: UI Design System

### Color Palette (styles.scss CSS Variables)

| Token | Value | Usage |
|-------|-------|-------|
| `--pmst-brand-color` | `#fe5252` | Accent, CTA buttons, icon highlights, tab text |
| `--pmst-brand-hover` | `#ff6b6b` | Hover state for brand-color elements, card glow |
| `--pmst-bg-light` | `#e5e7eb` | Section backgrounds, button backgrounds, card borders |
| `--pmst-bg-darker` | `#d1d5db` | Active tab background, hero section background |
| Primary text | `#4a4a6a` | All body text, titles, links — replaced `#1a1a2e` globally |

> **Deprecated:** `#1a1a2e` — fully replaced with `#4a4a6a` throughout `styles.scss` and all component inline styles.

### Hero Sections (.pmst-hero-lite)

- **Background:** `#d1d5db` (--pmst-bg-darker), sticky `top: 3.5rem` (56px = scrolled header height), `z-index: 100`
- **Overlap:** `margin-bottom: -3rem` by default — overlaps content section below
- **`.pmst-hero-no-overlap`** modifier: sets `margin-bottom: 0`
- **Title:** `2rem`, weight 800, uppercase, color `#4a4a6a`
- **Subtitle:** `1.25rem`, weight 700, italic, color `#fe5252` (hover: `#ff6b6b`)
- **Transparent variant:** `.pmst-hero-transparent` — background transparent, title & sub both `#4a4a6a`
- **CTA hero:** bold `#6b7280` text, links are text hyperlinks (no underline), color `#ff6b6b`, hover `#fe5252`
- **Scroll hysteresis:** Header compacts at `scrollY > 80px`, expands back at `scrollY < 60px` (20px dead zone prevents oscillation)
- **Header normal height:** `6.5rem`, logo `5rem`; Sign In button: no background, text `#f3f4f6`, hover `#ff6b6b`
- **Header scrolled height:** `3.5rem`, logo `2rem`; nav links/buttons shrink via `-scrolled` modifier classes
- **`.pmst-hero-static`** modifier: overrides sticky to `position: relative` — used on home page heroes to prevent scroll-reflow flicker
- **CSS bindings:** Header uses additive `[class.name]` bindings (not `[class]` replacement) to preserve base Tailwind classes
- **`will-change: transform` + `transform: translateZ(0)`** on `.pmst-hero-lite` for GPU compositing on other pages

### Component Patterns

**Buttons (`.pmst-btn-primary`):**
- Background `#e5e7eb`, label `#ff6b6b`, border `1px solid #d1d5db`
- Exception: "Join Now" CTA retains brand styling
- On card hover: button color changes to `#fe5252`

**Cards (`.pmst-card`, `.pmst-grid-item`):**
- Text color `#4a4a6a`; hover: glow box-shadow `#ff6b6b`
- Entire card is clickable (anchor wraps card)

**Tabs (`.pmst-tab-btn`, `.pmst-tab`):**
- Background `#e5e7eb`, text `#ff6b6b`, border `#d1d5db`
- Active: background `#d1d5db`, text `#ff6b6b`
- Used by: YouTube playlist, spotlight category tabs, search buttons

**Search (`.pmst-gallery-search-form`):**
- Input text `#4a4a6a`, border `#e5e7eb`
- Button: background `#e5e7eb`, color `#ff6b6b`
- Focus glow: `#ff6b6b` box-shadow
- Backend gallery search supports: title, slug, description, author

**Carousels (`.pmst-carousel-post`):** text `#4a4a6a`, scroll snap, hidden scrollbar, arrow nav matching tab style

**Pagination (`.pmst-pagination`):** color `#4a4a6a`, background `var(--pmst-bg-light)`

### Section Backgrounds

| Section | Background |
|---------|-----------|
| Hero (all pages) | `#d1d5db` |
| YouTube playlist | `#e5e7eb` |
| Latest news | `#e5e7eb` |
| Model & Gallery | `#e5e7eb` |
| Showcase detail | `#e5e7eb` (5-column grid) |
| Single post gallery | `#e5e7eb` (replaces blur) |
| Featured image area | `#e5e7eb` (solid, replaces blur) |

### CSS Architecture Rules

- All shared styles in `src/styles.scss` — no duplicate classes in components
- Component `styles: [...]` arrays only for component-specific layout, never for shared tokens
- **Do NOT** use `@import` inside component styles arrays — causes Sass deprecation errors
- Global classes from `styles.scss` are available in all components without import

---

## Part 4.5: UI Component Architecture

### Project Structure

```
frontend/src/app/
├── core/
│   ├── components/          # Header, Footer, Navigation
│   ├── services/            # Auth, API, SEO, Error Handler
│   └── guards/              # Auth Guard, Admin Guard
├── features/
│   ├── home/                # Hero, News, Gallery Spotlight, Video, Carousel
│   ├── news/                # Article List, Article Detail
│   ├── showcase/            # Gallery Grid, Gallery Detail
│   ├── auth/                # Login, Register, Social Login
│   ├── user/                # Profile, Dashboard, Settings, Submit
│   ├── events/              # Event List, Event Detail
│   ├── spotlight/           # Entertainment content
│   └── admin/               # User Management, Moderation
└── shared/
    ├── components/          # Comments, Follow Button, Author Card,
    │                        # Post Carousel, YouTube Player, Social Embed,
    │                        # Pagination, Breadcrumbs, SEO Meta
    └── directives/          # GTM Tracker, Lazy Load
```

### Key Components Mapping

| WordPress Plugin | Angular Component | Status |
|-----------------|-------------------|--------|
| pmst-banner-section | HeroSectionComponent | ✅ Created |
| pmst-all-news-post-gallery | NewsSectionComponent | ✅ Created |
| pmst-model-gallery-cpt | GallerySpotlightComponent | ✅ Created |
| pmst-lightweight-youtube-playlists | VideoSectionComponent / YoutubePlaylistComponent | ✅ Created |
| pmst-user-profile-header | ProfileHeaderComponent | ✅ Created |
| pmst-follow-plugin | FollowButtonComponent | ✅ Created |
| pmst-author-profile-card | ProfileComponent, ProfileEditComponent | ✅ Completed |
| pmst-post-carousel | PostCarouselComponent | ✅ Created |
| pmst-social-embed-allow | Built into NewsDetailComponent | ✅ Built |
| pmst-custom-single-post-template | NewsDetailComponent (WP replica) | ✅ Built |
| mage-eventpress | EventsListComponent | ✅ Created |
| wpDiscuz | CommentSectionComponent | ✅ Created |
| contributor-dashboard-v3 | DashboardComponent | ✅ Built — approve/delete/pagination |
| N/A | SubmitContentComponent | ✅ Created |
| N/A | SubmitGalleryComponent | ✅ Created |
| N/A | AdminDashboardComponent | ✅ Created |
| N/A | SpotlightComponent | ✅ Created |

### Dashboard Features (DashboardComponent — May 2026)

**Role-based actions:**
- **Admin only:** Orange "Approve" button on `pending` items → calls `PATCH /articles/{id}/status` or `PATCH /galleries/{id}/status` with `published`
- **All users:** Delete icon on all items → calls `DELETE /articles/{id}` or `DELETE /galleries/{id}`
- Status dropdown removed — status changes via edit page or approve button only

**Client-side pagination:**
- Signals: `currentPage`, `pageSize` (10/20/50 per page selector)
- Computed: `filteredItems`, `pagedItems`, `totalPages`, `pageNumbers` (ellipsis logic)
- `effect()` resets `currentPage` to 0 when filters/sort/pageSize change (uses `untracked` to avoid infinite loop)

**Backend delete endpoints:**
- `DELETE /articles/{id}` — admin or own content (Spring Security)
- `DELETE /galleries/{id}` — admin or own content (Spring Security)
- Frontend: `ArticleService.deleteArticle(id)`, `GalleryService.deleteGallery(id)`

**SEO fields added (May 2026):**
- `V4__add_seo_fields_to_articles.sql` — adds `seo_focus_keyword`, `seo_description` to articles
- `V5__add_gallery_seo_fields_and_indexes.sql` — adds same fields + indexes to galleries
- `ArticleResponse` and `GalleryResponse` DTOs updated to include SEO fields
- `ArticleDetail` Angular model updated with `seoFocusKeyword`, `seoDescription`

---

## Part 5: Backend Microservices (Java 21)

### Local Development Setup

| Service | Repo | Local Path | Port | Branch |
|---|---|---|---|---|
| pmst-api-service | `pmst-api-service` | `D:\pmst-services\pmst-api-service\` | 8080 | `feature/initial-setup` |
| pmst-ticketing-service | `pmst-ticketing-service` | `D:\pmst-services\pmst-ticketing-service\` | 8081 | `feature/initial-setup` |

**Run locally (no AWS needed):**
```bash
# 1. Start local PostgreSQL + cognito-local (auth emulator)
docker compose up -d

# 2. Seed cognito-local with User Pool + 3 test users (one-time, idempotent)
./scripts/seed-cognito-local.ps1

# 3. Run Spring Boot
mvn spring-boot:run

# 4. Run tests
mvn test

# 5. Build Lambda JAR (for AWS deploy later)
mvn package -DskipTests
```

**Local PostgreSQL:**
- pmst-api-service → `localhost:5432`
- pmst-ticketing-service → `localhost:5433`

### Part 5.2: Local Authentication (Cognito Emulator)

> **No AWS account needed.** Daily auth dev runs against `jagregory/cognito-local` Docker container that mimics Cognito API. Same Spring code works against real Cognito later — just config changes via env vars.

**How it works:**
```
Angular login form 
   ↓ POST /auth/login {email, password}
Spring Boot AuthController
   ↓ Cognito SDK (endpoint override: localhost:9229)
cognito-local container
   ↓ validates password, returns JWT tokens
Back to Angular (stores in localStorage)
   ↓ All API calls: Authorization: Bearer {accessToken}
Spring Security validates JWT against cognito-local JWKS
```

**Test users (created by `seed-cognito-local.ps1`):**

| Email | Password | Role |
|-------|----------|------|
| `admin@pmst.local` | `Test1234!` | admin |
| `user@pmst.local` | `Test1234!` | user |
| `moderator@pmst.local` | `Test1234!` | moderator |

**Verify auth works (curl):**
```powershell
# Login
$body = '{"email":"admin@pmst.local","password":"Test1234!"}'
$resp = Invoke-RestMethod -Uri http://localhost:8080/auth/login -Method POST -ContentType "application/json" -Body $body
$resp.accessToken

# Use the token
Invoke-RestMethod -Uri http://localhost:8080/auth/me -Headers @{Authorization="Bearer $($resp.accessToken)"}
```

**Configuration files:**

| File | Purpose |
|------|---------|
| `docker-compose.yml` | `cognito-local` service on port 9229 |
| `application.properties` | Env-var placeholders (`${COGNITO_*}`) |
| `application-local.properties` | Local values (gitignored) — pool=`local_pool`, client=`local_client`, endpoint=`http://localhost:9229`; `pmst.media.bucket=local-dev-stub` |
| `config/CognitoConfig.java` | SDK client bean — supports both local emulator (endpoint override) and real Cognito |
| `config/SecurityConfig.java` | Spring Security: public read endpoints, JWT-protected write endpoints |
| `service/AuthService.java` | Login/register/refresh logic (Cognito SDK wrapper) |
| `service/UserSyncService.java` | Keeps local `users` table in sync with Cognito |
| `controller/AuthController.java` | REST endpoints: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/me` |

**Production swap (when AWS ready):**
Only env vars change — code is identical:
```
COGNITO_ENDPOINT=                              # empty = real AWS
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX       # from Terraform output
COGNITO_CLIENT_ID=abc123xyz                    # from Terraform output  
COGNITO_ISSUER_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
```
All injected via SSM Parameter Store → Lambda env vars (see Part 6.5).

**WP user migration (deferred — pre-launch):**
Existing WordPress users will be migrated transparently via a Cognito `UserMigration_Authentication` Lambda trigger that validates legacy phpass hashes on first login. No user action required. Not built yet — Phase 5 task before go-live.

**Lambda handler classes:**
- `com.pmst.api.LambdaHandler`
- `com.pmst.ticketing.LambdaHandler`

### Service Architecture

```
API Gateway
    ├── Lambda Authorizer (Cognito JWT validation)
    ├── pmst-api-service (Java Lambda)      → Articles, Galleries, Users, Follows, Comments
    │     GET/POST /articles
    │     GET/POST /galleries
    │     GET/PUT  /users/{id}/profile
    │     POST/DELETE /users/{id}/follow
    │     GET/POST/DELETE /comments
    └── pmst-ticketing-service (Java Lambda) → Event creation, ticketing, RSVP
          GET/POST /events
          POST /events/{id}/tickets
          GET  /events/{id}/attendees
```

> **Why consolidated?** Articles, galleries, users, follows, and comments all share the same PostgreSQL schema, have low-to-medium traffic, and benefit from shared connection pooling via RDS Proxy. A single JAR simplifies deployment, reduces cold starts, and lowers cost. Ticketing is separate because it has distinct scaling needs and may integrate with third-party payment/ticketing providers.

### Authentication Flow

**1. Cognito User Pool Configuration:**
```yaml
UserPool:
  - Email/Username sign-in
  - Required attributes: email, given_name, family_name
  - Password policy: Minimum 8 chars, uppercase, lowercase, number, symbol
  - MFA: Optional (TOTP preferred)
  - Account recovery: Email only
  - Email verification: Required
  
AppClient:
  - Allowed OAuth flows: authorization_code_grant, implicit_grant
  - Allowed OAuth scopes: openid, email, profile
  - Callback URLs: https://pmstusnepal.com/auth/callback
  - Sign-out URLs: https://pmstusnepal.com/
```

**2. API Gateway Lambda Authorizer:**
```java
// Validates JWT from Cognito
public class CognitoAuthorizer implements RequestHandler<TokenAuthorizerEvent, AuthResponse> {
    
    private final String userPoolId = System.getenv("COGNITO_USER_POOL_ID");
    private final String region = System.getenv("AWS_REGION");
    
    @Override
    public AuthResponse handleRequest(TokenAuthorizerEvent event, Context context) {
        String token = event.getAuthorizationToken().replace("Bearer ", "");
        
        try {
            // Verify JWT against Cognito JWKS
            DecodedJWT jwt = JWT.decode(token);
            String keyId = jwt.getKeyId();
            RSAPublicKey publicKey = getCognitoPublicKey(keyId);
            
            Algorithm algorithm = Algorithm.RSA256(publicKey, null);
            JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer("https://cognito-idp." + region + ".amazonaws.com/" + userPoolId)
                .build();
            verifier.verify(token);
            
            // Extract claims
            String userId = jwt.getSubject(); // Cognito 'sub'
            String email = jwt.getClaim("email").asString();
            String username = jwt.getClaim("cognito:username").asString();
            
            // Return policy allowing access
            return new AuthResponse("user", 
                new PolicyDocument("Allow", event.getMethodArn()),
                Map.of("userId", userId, "email", email, "username", username)
            );
            
        } catch (JWTVerificationException e) {
            return new AuthResponse("user", 
                new PolicyDocument("Deny", event.getMethodArn()),
                null
            );
        }
    }
}
```

**3. Angular Integration (AWS Amplify):**
```typescript
// app.config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_xxxxx',
    userPoolWebClientId: 'xxxxxxxxxxxxx',
    oauth: {
      domain: 'auth.pmstusnepal.com',
      scope: ['openid', 'email', 'profile'],
      redirectSignIn: 'https://pmstusnepal.com/auth/callback',
      redirectSignOut: 'https://pmstusnepal.com/',
      responseType: 'token'
    }
  }
});

// auth.service.ts
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  async login(email: string, password: string) {
    return await signIn({ username: email, password });
  }
  
  async register(email: string, password: string, attributes: any) {
    return await signUp({
      username: email,
      password,
      options: { userAttributes: { email, ...attributes } }
    });
  }
  
  async logout() {
    return await signOut();
  }
  
  async getCurrentUser() {
    return await getCurrentUser();
  }
}

// HTTP Interceptor
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return from(fetchAuthSession()).pipe(
      switchMap(session => {
        const token = session.tokens?.accessToken;
        if (token) {
          req = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
          });
        }
        return next.handle(req);
      })
    );
  }
}
```

### Database Schema (PostgreSQL)

**Users & Profiles:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    cover_photo_url TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Content:**
```sql
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    youtube_link TEXT,
    embed_code TEXT,
    gallery_images JSONB DEFAULT '[]',
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE article_tags (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);
```

**Gallery (from model_gallery CPT):**
```sql
CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES gallery_categories(id),
    featured_image TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gallery_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES gallery_categories(id)
);

CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT DEFAULT 0
);
```

**Follow System (from pmst-follow-plugin):**
```sql
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Comments (replaces wpDiscuz + messaging):**
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    author_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),
    body TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_comments_content ON comments(content_type, content_id);

CREATE TABLE comment_likes (
    user_id UUID REFERENCES users(id),
    comment_id UUID REFERENCES comments(id),
    PRIMARY KEY (user_id, comment_id)
);
```

**Events (from mage-eventpress):**
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    location TEXT,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    featured_image TEXT,
    ticket_price DECIMAL(10,2),
    max_attendees INT,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);
```

---

## Part 6: Infrastructure (Terraform)

### Terraform Project Structure

```
infrastructure/
├── modules/
│   ├── vpc/                    # VPC, subnets, NAT, security groups
│   ├── rds/                    # PostgreSQL + RDS Proxy
│   ├── cognito/                # User pools
│   ├── s3/                     # Media storage + frontend hosting
│   ├── cloudfront/             # CDN distribution
│   ├── lambda/                 # Java function deployments
│   ├── api-gateway/            # REST API configuration
│   └── image-processor/        # SQS + Python Lambda + ECR + SSM params (image pipeline)
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
├── bootstrap/
│   └── README.md               # One-time: S3 state backend + OIDC roles setup
├── backend.tf                  # S3 + DynamoDB state
└── variables.tf
```

### Key Resources

| Resource | Dev Config | Prod Config |
|----------|-----------|-------------|
| RDS PostgreSQL | db.t3.micro, 20GB | db.t4g.small, Multi-AZ |
| RDS Proxy | Optional | Required |
| Lambda | 256MB, no provisioned | 512MB, SnapStart |
| S3 | Single bucket | Versioned + lifecycle |
| CloudFront | Basic | Full caching + WAF |
| VPC | 2 AZ, NAT Gateway | 2 AZ, NAT Gateway |

### Frontend Hosting: Static S3 + CloudFront (Current)

> **Current Architecture:** Static site hosting via S3 + CloudFront SPA fallback
> 
> **SSR Status:** Configured in `angular.json` but **NOT deployed** — requires additional Lambda@Edge infrastructure

#### Build Output
```bash
npm run build:prod
# Generates:
# - dist/pmst-angular-ui/browser/    → Deployed to S3 (current)
# - dist/pmst-angular-ui/server/   → NOT deployed (SSR - requires Lambda@Edge)
```

#### Current Deployment (GitHub Actions)
```yaml
# .github/workflows/deploy-frontend-prod.yml
- run: aws s3 sync dist/pmst-angular-ui/browser/ s3://${{ vars.FRONTEND_BUCKET }} --delete
- run: aws cloudfront create-invalidation --distribution-id ${{ vars.CF_DISTRIBUTION_ID }} --paths "/*"
```

#### CloudFront Configuration
- **Origin:** S3 static website
- **SPA Fallback:** 403/404 → index.html (client-side routing)
- **Caching:** 1 hour default TTL
- **SSL:** ACM certificate

### Future: SSR with Lambda@Edge (Not Implemented)

For full SEO + social sharing, add Lambda@Edge. **Decision needed post-launch based on metrics.**

#### Implementation Details
```hcl
# Terraform addition needed: modules/cloudfront-ssr/
resource "aws_lambda_function" "ssr" {
  function_name = "${var.project_name}-${var.environment}-ssr"
  runtime       = "nodejs20.x"
  handler       = "main.server.handler"  # Angular Universal server
  
  # Deploy server bundle from dist/pmst-angular-ui/server/
  filename = "${path.module}/ssr-server.zip"
  
  # Lambda@Edge requires us-east-1
  provider = aws.us-east-1
}

# CloudFront origin request trigger
resource "aws_cloudfront_distribution" "frontend" {
  # ... existing config ...
  
  lambda_function_association {
    event_type   = "origin-request"
    lambda_arn   = aws_lambda_function.ssr.qualified_arn
    include_body = false
  }
}
```

#### Cost Analysis: SSR vs Static

| Cost Component | Static S3 (Current) | Lambda@Edge SSR | Difference |
|----------------|---------------------|-------------------|------------|
| **CloudFront** | $8.50/100GB | $8.50/100GB | Same |
| **S3 Storage** | $2.30/100GB | $2.30/100GB | Same |
| **Lambda@Edge** | $0 | ~$15-40/mo | **+$15-40** |
| **Request Charges** | $0 | $0.60/million | Negligible |
| **Data Transfer** | $0 | Included in CF | Same |
| **Total** | **~$11/mo** | **~$26-51/mo** | **+$15-40/mo** |

**Lambda@Edge Pricing Breakdown:**
- $0.60 per 1 million requests (first 1B requests/month)
- $0.00005001 per GB-second of memory (128MB default)
- Typical Angular SSR: ~100ms execution, 128MB = $0.000000625 per request
- 100K page views/month = ~$0.06/month compute

#### Decision Framework

**Implement SSR IF:**
| Metric | Threshold | Check With |
|--------|-----------|------------|
| Google PageSpeed SEO score | < 90 | lighthouse CI |
| Organic traffic drop | > 20% vs WordPress | Google Analytics |
| Social share previews broken | Facebook/Twitter cards don't render | Sharing Debugger |
| Google indexing issues | Articles not in search results | Search Console |
| Time to First Contentful Paint | > 1.5s on 3G | WebPageTest |

**Do NOT implement IF:**
- SEO scores > 90 with current static setup
- Social previews work with prerender.io or similar
- Organic traffic stable or growing
- Budget constrained (save $15-40/mo)

#### Alternative: Prerender.io (Middle Ground)
If SSR is overkill, use Prerender.io service:
- **Cost**: $15-80/mo based on cache size
- **Setup**: 1-line middleware, no Lambda
- **Benefit**: SEO bot sees rendered HTML, users get fast SPA
- **Trade-off**: Third-party dependency, not truly serverless

#### Implementation Effort
| Task | Hours | Complexity |
|------|-------|------------|
| Create Lambda@Edge module | 4-6 hrs | Medium |
| Update CloudFront distribution | 2 hrs | Low |
| CI/CD pipeline for server bundle | 2-3 hrs | Medium |
| Test SSR hydration | 4-6 hrs | High |
| Monitor & optimize | 2-4 hrs | Medium |
| **Total** | **14-21 hrs** | **High** |

#### Recommendation
**Start with Static S3**, monitor metrics for 2-3 months post-launch. Implement SSR only if:
1. SEO metrics justify the $15-40/mo cost
2. Development time (14-21 hrs) is available
3. Complexity trade-off is acceptable

> **Current Status**: SSR is configured in angular.json but NOT deployed. Safe to launch without it.

### Cost Estimates

| Component | Dev/Month | Prod/Month |
|-----------|-----------|------------|
| VPC (NAT Gateway) | $32 | $32 |
| RDS PostgreSQL | $15 | $75 |
| Lambda (1M req) | $0.20 | $2 |
| S3 (100GB) | $2.30 | $2.30 |
| CloudFront (100GB) | $8.50 | $8.50 |
| **Total** | **~$58** | **~$120** |

---

## Part 6.5: Secrets Management

> **Pattern:** Spring `${ENV_VAR:}` placeholders + local override file + Terraform-managed AWS SSM in prod.

### Standard Pattern for All Secrets

**Backend `application.properties` (committed):**
```properties
# Use env var with empty default
pmst.youtube.api-key=${PMST_YT_API_KEY:}
some.other.secret=${SOME_OTHER_SECRET:}
```

**Local `application-local.properties` (gitignored, in `src/main/resources/`):**
```properties
PMST_YT_API_KEY=AIzaSy...your-actual-key
SOME_OTHER_SECRET=value
```

**`.gitignore` must contain:**
```
application-local.properties
src/main/resources/application-local.properties
```

**Run locally:**
```powershell
# Option 1: Use local profile (auto-picks up application-local.properties)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Option 2: Set env var in shell
$env:PMST_YT_API_KEY="AIzaSy..."
mvn spring-boot:run
```

### Production: Terraform → AWS SSM → Lambda

**Why SSM Parameter Store (not Secrets Manager):**
- **Free:** 10,000 parameters free (Secrets Manager: $0.40/secret/month)
- **Same encryption:** KMS-encrypted SecureString
- **Native Lambda integration**

**Terraform Pattern (`pmst-terraform-infra`):**

```hcl
# variables.tf
variable "youtube_api_key" {
  description = "YouTube Data API v3 key (set via terraform.tfvars or TF_VAR_youtube_api_key)"
  type        = string
  sensitive   = true
}

# modules/api-service/secrets.tf
resource "aws_ssm_parameter" "youtube_api_key" {
  name        = "/pmst/${var.environment}/youtube-api-key"
  type        = "SecureString"
  value       = var.youtube_api_key
  tags        = { Service = "pmst-api-service" }
}

# Lambda IAM role permission
data "aws_iam_policy_document" "lambda_ssm_read" {
  statement {
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [aws_ssm_parameter.youtube_api_key.arn]
  }
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:aws:kms:*:*:alias/aws/ssm"]
  }
}

# Inject as Lambda env var
resource "aws_lambda_function" "api" {
  environment {
    variables = {
      SPRING_PROFILES_ACTIVE = var.environment
      PMST_YT_API_KEY        = aws_ssm_parameter.youtube_api_key.value
    }
  }
}
```

**Source the key value:**
- **Local TF runs:** `terraform.tfvars` (gitignored by default)
- **CI/CD:** GitHub Actions secret → `TF_VAR_youtube_api_key`

### Key Rotation Procedure
1. Generate new key in Google Cloud Console (or other provider)
2. Restrict the new key (HTTP referrer, API allowlist)
3. Update local `application-local.properties` with new key
4. Update `terraform.tfvars` with new key
5. Run `terraform apply` — Lambda picks up new key on next cold start
6. Revoke old key in provider console

### Current Secrets Inventory

| Secret | Pattern | Local | Prod (planned) |
|--------|---------|-------|----------------|
| `PMST_YT_API_KEY` | YouTube Data API v3 | `application-local.properties` | SSM `/pmst/prod/youtube-api-key` |
| `MEDIA_BUCKET` | S3 image upload bucket | `application-local.properties` → `local-dev-stub` | Lambda env var → `pmst-prod-media` |
| Cognito Client Secret | Auth | TBD | SSM `/pmst/prod/cognito-client-secret` |
| RDS Password | DB | docker-compose env | SSM `/pmst/prod/rds-password` |

---

## Part 7: CI/CD Pipeline (GitHub Actions)

> ⚠️ **Note:** The YAML snippets in this section show the **old static-key pattern** (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`). The actual implemented workflows use **OIDC (no static keys)** — see **Part 11** for the current authoritative CI/CD documentation. This section is retained for context only.

> **Solo Developer Mode (current):** `pmstusnepal.com` still points to Hostinger/WordPress — no risk working directly on prod AWS infra. Push to `main` → auto-deploys to production. Dev/staging environments exist in Terraform but are **not provisioned** (no cost). Reactivate when team grows.

### Pipeline Structure

```
pmst-terraform-infra/.github/workflows/
├── terraform-plan.yml          # Terraform plan on every PR
├── deploy-prod-on-push.yml     # AUTO: apply prod on push to main  ← PRIMARY
├── deploy-prod.yml             # Manual dispatch (fallback / emergency)
├── deploy-dev.yml              # DORMANT — future scope
└── deploy-staging.yml          # DORMANT — future scope

pmst-angular-ui/.github/workflows/
└── deploy-frontend-prod.yml    # AUTO: build + S3 sync + CF invalidate on push to main
```

### Branching Strategy (Solo Phase — Updated)

**⚠️ RULE**: Never push directly to `main`. Always use feature branches + PR merge (even as solo developer).

| Branch | Purpose |
|--------|---------|
| `main` | Protected — deploys to prod on merge ONLY |
| `feature/{description}` | New features — PR required to merge |
| `fix/{description}` | Bug fixes — PR required to merge |
| `hotfix/{description}` | Urgent fixes — PR required to merge |
| `develop` / `staging` | Not used — reactivate when team grows |

### CI/CD Trigger Requirements

**Updated**: Pipelines now run on **both** PR to `main` AND push to `main`:

```yaml
on:
  pull_request:
    branches: [main]    # Run tests/lint on PR
  push:
    branches: [main]    # Deploy after merge
```

**PR Checks** (required before merge):
- Lint passes (`npm run lint`, Checkstyle)
- Unit tests pass (70%+ coverage)
- Build succeeds
- Terraform plan (for infra changes)

**Deploy** (after merge to `main`):
- Full test suite
- Production build
- AWS deployment
- Smoke tests

### Active Workflows

> **See Part 11 for the current authoritative YAML** (OIDC-based). The four active workflows are:

| Repo | Workflow file | Trigger | Action |
|------|--------------|---------|--------|
| pmst-terraform-infra | `deploy-prod-on-push.yml` | Push to `main` | `terraform apply` (prod) |
| pmst-angular-ui | `deploy-angular.yml` | Push to `main` | S3 sync + CF invalidation |
| pmst-api-service | `deploy-api-service.yml` | Push to `main` | JAR → S3 → Lambda update |
| pmst-image-processor | `deploy-image-processor.yml` | Push to `main` | Docker → ECR → Lambda update |

### Dormant Workflows (Future Scope)

| File | Status | Reactivate when... |
|------|--------|--------------------|
| `deploy-dev.yml` | Dormant | Team grows / need isolated dev environment |
| `deploy-staging.yml` | Dormant | Pre-production testing needed before go-live |

### Required GitHub Secrets (OIDC — No Static Keys)

> No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed. See **Part 11** for full bootstrap + YAML details.

| Secret | Repos | Description |
|--------|-------|-------------|
| `AWS_ACCOUNT_ID` | All | 12-digit AWS account ID |
| `TF_VAR_DB_PASSWORD` | terraform-infra only | RDS password |
| `ACM_CERT_ARN` | terraform-infra only | ACM cert ARN (after first apply) |
| `CLOUDFRONT_DISTRIBUTION_ID` | angular-ui only | From Terraform output |

### Documentation Sync Requirements

**Triple Sync Rule**: When implementing new logic or patterns, update all three documentation layers:

| Documentation | Purpose | Location | Update When |
|--------------|---------|----------|-------------|
| **AI Rules** | Coding standards for Windsurf | `.windsurf/rules.md` | New standards, optimization rules |
| **Developer Guide** | Step-by-step reference | `.windsurf/workflows/pmst-development-workflow.md` | Architecture patterns, CI/CD changes |
| **Visual Dashboard** | Status tracking | `src/doc/pmst-master-plan.html` | Component status, compliance |

**Mandatory**: If implementing logic NOT in this workflow document:
1. Update this workflow file with new section
2. Add corresponding rule to `.windsurf/rules.md`
3. Update status board in HTML dashboard
4. Reference section in PR description

---

## Part 8: Data Migration Strategy

> **Status:** CSV exports complete — all files saved to `D:\pmst-migration\exports\`
>
> **Repo:** `pmstnepal/pmst-data-migration` — branch: `feature/migration-scripts`
> **Local:** `D:\pmst-migration\` — scripts in `scripts/`, exports in `exports/` (gitignored)

### Source → Target Table Mapping

| WP Table | Rows | Target Table(s) | Notes |
|---|---|---|---|
| `wp_users` | 18 | `users` + `user_profiles` | int ID → UUID5 |
| `wp_usermeta` | — | `user_profiles` (merged) | pivot EAV rows into columns |
| `wp_posts` (post) | ~6,739* | `articles` | clean Gutenberg HTML, rewrite media URLs |
| `wp_posts` (model_gallery) | subset | `galleries` | — |
| `wp_posts` (attachment) | subset | `gallery_images` | S3 URL rewrite |
| `wp_terms` | — | `tags` + `gallery_categories` | — |
| `wp_term_taxonomy` | — | (join table) | — |
| `wp_term_relationships` | — | `article_tags` | resolve UUIDs both sides |
| `wp_comments` | 379 | `comments` | set `content_type='article'` |
| `wp_pmst_author_profiles` | 2 | `user_profiles` (merge) | custom author fields |
| `wp_social_users` | 4 | `users` | social login → `cognito_id` NULL until first login |
| `wp_e_events` | — | ❌ Skip | rebuilding events fresh |
| `wp_postmeta` | ~42 MB | `articles` (3 cols) | Filter keys: `youtube_link`, `image_upload`, `embed_code`; PHP serialize → JSON |
| `wp_pmst_messages` | — | ❌ Skip | rebuilding messaging fresh |
| `wp_pmst_reactions` | — | ❌ Skip | rebuilding reactions fresh |
| `wp_community_hub_posts` | — | ❌ Skip | community feature removed |

*6,739 includes all post_types — filter to `post_type IN ('post','model_gallery','attachment')` only.

### UUID Strategy

Use deterministic `uuid.uuid5()` so scripts are re-runnable:
```python
import uuid
NS = uuid.UUID("12345678-1234-5678-1234-567812345678")  # fixed project namespace

def wp_uuid(wp_id):
    return str(uuid.uuid5(NS, str(wp_id)))
```

### Migration Scripts (run in order)

All scripts read from `D:\pmst-migration\exports\` and write to RDS.

```
1. migrate_users.py              # wp_users → users
2. migrate_user_profiles.py      # wp_usermeta + wp_pmst_author_profiles → user_profiles
3. migrate_tags.py               # wp_terms + wp_term_taxonomy → tags + gallery_categories
4. migrate_articles.py           # wp_posts (post) → articles
5. migrate_article_tags.py       # wp_term_relationships → article_tags
6. migrate_galleries.py          # wp_posts (model_gallery) → galleries
7. migrate_gallery_images.py     # wp_postmeta (image_upload) → gallery_images ✅ FIXED — 306 images migrated
8. migrate_comments.py           # wp_comments → comments
9. migrate_follows.py            # wp_pmst_follows → follows (if table exists)
10. migrate_article_meta.py      # wp_postmeta (youtube_link, image_upload, embed_code) → articles
11. link_user_profiles_to_cognito.py  # Link migrated users to Cognito via email matching (JIT migration)
12. seed_user_profiles.py        # Seed test user profiles for local development
```

### Utility Scripts (optional)

- `download_missing_gallery_images.py` - Download gallery images from WordPress attachment IDs
- `check_users.py` - Verify users in database
- `check_profiles.py` - Verify user profiles in database

### Key Transform Rules

- **Gutenberg blocks:** strip `<!-- wp:* -->` comments with regex
- **Media URLs:** rewrite `pmstusnepal.com/wp-content/uploads/` → `YOUR_CF_DOMAIN/media/`
- **WP roles:** parse serialized PHP `wp_capabilities` from `wp_usermeta` → map to `role` ('admin','contributor','user')
- **`cognito_id`:** leave NULL — populated when user first logs in via Cognito (password-reset flow)
- **RDS access:** RDS is in private subnet — run scripts via SSM port-forward or EC2 bastion

### Contributor Categories Mapping

```
WordPress Category     → PostgreSQL category value
nepalnews             → nepal-news
nepal-entertainment   → entertainment
sports                → sports
housing-rental        → housing-rental
```

### Validation Queries (run after each script)

```sql
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'galleries', COUNT(*) FROM galleries
UNION ALL SELECT 'comments', COUNT(*) FROM comments
UNION ALL SELECT 'follows', COUNT(*) FROM follows;

-- Orphan check
SELECT COUNT(*) FROM articles WHERE author_id NOT IN (SELECT id FROM users);
```

### Gallery Images Migration Fix (May 16, 2026) ✅ COMPLETE

**Issue:** Original script looked for `post_parent` in attachments, but galleries store images differently.

**WordPress Storage Method:**
- `model_gallery` posts use `image_upload` meta key (serialized PHP array of attachment IDs)
- `mep_events` use `mep_gallery_images` meta key (different format)
- Example: `a:11:{i:0;s:5:"22785";i:1;s:5:"22786";...}`

**Implementation:**

1. **Migration Script Fixed** (`07_migrate_gallery_images.py`)
   - Reads `image_upload` from `wp_postmeta`
   - Parses PHP serialized array with regex: `i:\d+;(?:i:(\d+);|s:\d+:"(\d+)";?)`
   - Extracts attachment IDs and looks up `_wp_attached_file` meta for paths
   - Result: **306 gallery images migrated for 8 published galleries**

2. **Image Files Copied** (`copy_gallery_images.py`)
   - Copies images from `uploads-extracted/` to Angular assets
   - Updates database with local paths: `/assets/images/filename.jpg`
   - Updates `image-manifest.json`
   - Result: **418 images copied**

3. **Remaining Images Fixed** (`fix_remaining_gallery_images.py`)
   - Fixes slug-based URLs (e.g., `https://pmstusnepal.com/img_8643/`)
   - Maps URL slugs to file paths using `wp_posts.post_name`
   - Result: **194 additional images fixed**

4. **Backend Fix**
   - Added `@JsonIgnore` to `GalleryImage.gallery` to prevent circular JSON serialization
   - Gallery API now returns `images` array correctly

5. **Featured Images Fix** (`fix_gallery_featured_images.py`)
   - **Issue:** `06_migrate_galleries.py` didn't populate `featured_image` from `_thumbnail_id`
   - **Discovery:** WordPress stores featured images in `wp_postmeta._thumbnail_id` (not `_thumbnail_id` column in wp_posts)
   - **Solution:** Look up `_thumbnail_id` meta → get attachment file from `_wp_attached_file` → copy to assets → update database
   - **Result:** **13 galleries now have featured images** (was 0)

**Final Status:**
- **Total gallery images:** 612
- **All with local paths:** `/assets/images/{filename}`
- **Files in Angular assets:** 306 unique images
- **Image manifest:** 3,644 entries
- **Galleries with featured images:** 13/13 (100%)

**Galleries with Images:**
| Gallery | Images |
|---------|--------|
| Bhim Bahadur Tamang Photography | 22 |
| Kathmandu PABSON Inter School Dance Competition | 12 |
| Biskaa Jatraa 2025 Part 1 | 80 |
| Biskaa Jatraa 2025 Part 2 | 80 |
| Punam Bhandari | 11 |
| Najir Hussain and Keki Adhikari | 4 |
| And others... | |

**Test URLs:**
- List: `http://localhost:4201/showcase`
- Detail: `http://localhost:4201/showcase/bhim-bahadur-tamang-photography`

### Media Migration (S3)

```bash
# Download all uploads from Hostinger via FTP/SFTP
wget -r -np -nH --cut-dirs=3 \
  ftp://USER:PASS@ftp.hostinger.com/public_html/wp-content/uploads/ \
  -P D:/pmst-migration/uploads/

# Upload to S3 prod media bucket
aws s3 sync D:/pmst-migration/uploads/ s3://pmst-prod-media/media/ \
  --cache-control "max-age=31536000"
```

### Migration Steps

1. ✅ Export WordPress CSVs from phpMyAdmin → `D:\pmst-migration\exports\`
2. Run schema SQL on RDS (Terraform provisions the instance)
3. Download media from Hostinger FTP → upload to S3
4. Run Python scripts 1–10 in order above
5. Validate row counts and spot-check known slugs
6. Keep WordPress live (read-only) until DNS cutover

---

## Part 9: Go-Live Strategy

### Pre-Launch Checklist
- [ ] All data migrated and validated
- [ ] Lambda functions tested
- [ ] API Gateway endpoints verified
- [ ] Frontend deployed to S3 + CloudFront
- [ ] SSL certificates valid
- [ ] DNS ready to switch
- [ ] Monitoring dashboards (CloudWatch)

### DNS Cutover
1. Lower TTL on pmstusnepal.com to 300s
2. Deploy CloudFront distribution
3. Update A/ALIAS record
4. Monitor 24h
5. Decommission Hostinger after 1 week stability

### Rollback Plan
- Switch DNS back to Hostinger (within 5 min)
- WordPress remains read-only during transition period

---

## Part 9.5: Local Run → Design → Test → Deploy Gate

> **Rule:** Nothing goes to AWS until the full experience works perfectly on localhost. Run locally, experience it as a real user, fix issues, then deploy.

### Step 1 — Start Local Stack

#### Prerequisites Checklist

Before starting, verify you have:
- [ ] **Docker Desktop** running (system tray icon green)
- [ ] **Java 21** installed (`java -version` shows 21.x)
- [ ] **Node.js 18+** installed (`node -v` shows v18.x)
- [ ] **Maven 3.9+** installed (`mvn -v` shows 3.9.x)
- [ ] **All repositories** cloned and on correct branches:
  - `pmst-angular-ui` → `feature/angular-ui-setup` at `D:\pmstmigrate`
  - `pmst-api-service` → `feature/initial-setup` at `D:\pmst-services\pmst-api-service`

#### Quick Start (Windows PowerShell)

**Option A: Run the batch script**
```powershell
cd D:\pmstmigrate
.\start-dev.bat
```

**Option B: Manual startup**
```powershell
# Terminal 1 - Backend
cd D:\pmst-services\pmst-api-service
docker compose up -d
mvn spring-boot:run

# Terminal 2 - Frontend
cd D:\pmstmigrate
npm start
```

#### Detailed Step-by-Step Instructions

**Step 1A: Start Database (PostgreSQL)**
```powershell
cd D:\pmst-services\pmst-api-service
docker compose up -d
```
- **Verify:** `docker ps` should show `pmst-api-db` with status "healthy"
- **Port:** `:5432` (PostgreSQL default)
- **Data:** 131 articles and 3,337 images already migrated

**Step 1B: Start Backend API (Spring Boot)**
```powershell
cd D:\pmst-services\pmst-api-service
mvn spring-boot:run
```
- **Wait for:** "Started Application in X seconds"
- **Port:** `http://localhost:8080`
- **Verify:** Open browser → `http://localhost:8080/articles` should return JSON

**Step 1C: Start Frontend (Angular)**
```powershell
cd D:\pmstmigrate
npm start
```
- **Wait for:** "Compiled successfully" or browser opens automatically
- **Port:** `http://localhost:4201`
- **Verify:** Homepage loads with news articles and images

#### Service Reference

| Service | Port | Local URL | Repository Path | Purpose |
|---------|------|-----------|-------------------|---------|
| **PostgreSQL** | 5432 | `localhost:5432` | — | Database |
| **Backend API** | 8080 | `http://localhost:8080` | `D:\pmst-services\pmst-api-service` | REST API (Java) |
| **Frontend** | 4201 | `http://localhost:4201` | `D:\pmstmigrate` | Angular dev server |

#### Health Check Commands

**Verify all services are running:**
```powershell
# Check Docker container
docker ps --filter "name=pmst-api-db" --format "table {{.Names}}\t{{.Status}}"

# Check backend API (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8080/articles" | Select-Object -First 3

# Check frontend (should open in browser)
Start-Process "http://localhost:4201"
```

#### Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| **Port 5432 in use** | `docker stop pmst-api-db` or restart Docker Desktop |
| **Port 8080 in use** | `taskkill /F /IM java.exe` then restart backend |
| **Port 4201 in use** | `taskkill /F /IM node.exe` then restart frontend |
| **CORS errors in browser** | Verify backend is running on `:8080` |
| **Images not loading** | Verify `src/assets/images/` folder has 3,337 images |
| **Database connection failed** | Run `docker compose up -d` in api-service folder |
| **npm start fails** | Run `npm install` first to install dependencies |
| **mvn command not found** | Add Maven to PATH or use IntelliJ's Maven panel |

#### Shutdown Procedure

When done developing:
```powershell
# Terminal 1 (Backend) - Press Ctrl+C, then:
docker compose down

# Terminal 2 (Frontend) - Press Ctrl+C
```

#### Daily Startup Checklist

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is healthy (`docker ps`)
- [ ] Backend API responds (`http://localhost:8080/articles`)
- [ ] Frontend loads (`http://localhost:4201`)
- [ ] No red errors in browser DevTools Console
- [ ] Featured images display on homepage

---

#### Testing Setup (One-time Installation)

**ESLint Setup:**
```bash
cd d:\pmstmigrate
npm install -D @angular-eslint/schematics
ng add @angular-eslint/schematics
```

**Playwright Setup:**
```bash
cd d:\pmstmigrate
npm install -D @playwright/test
npx playwright install
```

**Run Tests:**
```bash
# Angular Unit Tests (Karma + Jasmine)
npm test

# Playwright E2E Tests
npx playwright test

# Java Unit Tests (JUnit 5 + Mockito)
cd d:\pmst-services\pmst-api-service
mvn test
```

---

### Step 2 — Page-by-Page Design Check

Open `http://localhost:4200` and walk every route. Compare to pmstusnepal.com:

| Route | Page | What to Check |
|---|---|---|
| `/` | Home | Hero banner, YouTube section, latest news cards, gallery grid, CTA |
| `/news` | News list | Articles grid, category filter tabs, pagination controls |
| `/news/:slug` | Article detail | Hero (YouTube iframe OR blurred img + logo overlay), title, author/date, HTML content, social embed block, gallery grid (Fancybox), related posts (3 by category), comments, JSON-LD in `<head>` |
| `/showcase` | Gallery list | Gallery cards, pagination |
| `/showcase/:id` | Gallery detail | Images, title, description |
| `/spotlight` | Spotlight | Entertainment articles, category filters |
| `/events` | Events | Events layout renders without errors |
| `/login` | Login | Form, buttons, links render |
| `/register` | Register | Form renders |
| `/dashboard` | User dashboard | Redirects to login if not authenticated |
| `/submit/article` | Submit article | Form fields visible |
| `/submit/gallery` | Submit gallery | Form fields visible |

---

### Step 3 — Real User Flow Testing

Run these flows end-to-end as a real visitor would:

1. **Article flow** — Home → click news card → detail page loads with real data, no blank fields
2. **Gallery flow** — Home → click gallery card → detail page loads
3. **News filter** — `/news` → click category tab → list updates, URL reflects filter
4. **Pagination** — News page 2 loads, Gallery page 2 loads
5. **Navigation** — All header links navigate correctly on desktop
6. **Mobile layout** — Chrome DevTools → 375px width → header, cards, nav all look correct
7. **404 handling** — Go to `/random-page` → redirects to home
8. **Console check** — DevTools Console has zero red errors on every page

---

### Step 4 — Deployment Gate Checklist

**All items must be green before any AWS deployment:**

- [ ] `GET /articles` returns real article data (not empty, no 500)
- [ ] `GET /galleries` returns real gallery data
- [ ] All 12 routes load without red console errors
- [ ] Home page visually matches pmstusnepal.com layout
- [ ] Category filter on `/news` works
- [ ] Pagination works on `/news` and `/showcase`
- [ ] Mobile layout (375px) renders correctly — no overflow or broken nav
- [ ] No CORS errors in browser DevTools Network tab
- [ ] `mvn package -DskipTests` completes successfully → produces `target/pmst-api-service-lambda.jar`
- [ ] `/news/:slug` detail page renders YouTube embed when `youtubeLink` is set
- [ ] `/news/:slug` gallery grid shows up to 6 images with Fancybox lightbox
- [ ] Related posts section shows ≤3 articles linked by same category

---

### Step 5 — Deploy (only after all Step 4 items checked)

```bash
# 1. Build Lambda JAR
cd D:\pmst-services\pmst-api-service
mvn package -DskipTests
# → target/pmst-api-service-lambda.jar

# 2. Terraform — dev environment
cd D:\pmstmigrateinfra
terraform -chdir=environments/dev init
terraform -chdir=environments/dev plan
terraform -chdir=environments/dev apply

# 3. Angular production build
cd D:\pmstmigrate
ng build --configuration=production
# → dist/ folder ready for S3 upload

# 4. Upload to S3 (after Terraform creates bucket)
aws s3 sync dist/pmst-angular-ui/browser/ s3://pmst-dev-frontend/ --delete

# 5. CloudFront invalidation
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

**After deploy — repeat Step 2 & Step 3 checklist on `https://dev.pmstusnepal.com`**

---

## Part 5: Prod Readiness Checklist

> All 4 critical gaps below have been fixed in code. This section documents **what was done, why, and how to verify** before any production `terraform apply`.

---

### Critical Fixes Applied (Must Be Green Before Prod Deploy)

#### ✅ Fix 1 — JWT Validation Re-enabled (`SecurityConfig.java`)

**What was broken:** `if (false && issuerUri != null ...)` hardcoded JWT validation OFF permanently — even in prod.

**Fix:** Removed `false &&`. JWT validation now activates automatically when `COGNITO_ISSUER_URI` is set:
- **Local dev** (no `COGNITO_ISSUER_URI` in `application-local.properties`) → JWT disabled, dev works as before
- **Prod Lambda** (`COGNITO_ISSUER_URI` set via env) → JWT validated against Cognito JWKS ✅

Also added `GET /users/username/**` and `GET /users/*/profile` to `.permitAll()` so the profile page loads without a token.

**Verify locally:**
```
# Start backend — should log: "JWT validation DISABLED — COGNITO_ISSUER_URI not set"
mvn spring-boot:run
```
**Verify prod intent:** `application-local.properties` sets `pmst.cognito.issuer-uri=http://localhost:9229/...` → backend logs "JWT validation enabled"

---

#### ✅ Fix 2 — CORS Origins Env-Driven (`CorsConfig.java` + `application.properties`)

**What was broken:** `CorsConfig.java` hardcoded only `localhost:4200` and `localhost:4201`. In prod, `pmstusnepal.com` was blocked — Angular could not call the API.

**Fix:** `pmst.cors.allowed-origins` property (comma-separated list). Defaults to localhost for local dev. Lambda env var `PMST_CORS_ALLOWED_ORIGINS` injects prod origins.

| Environment | Value |
|---|---|
| Local (default) | `http://localhost:4200,http://localhost:4201` |
| Prod (Lambda env) | `https://pmstusnepal.com,https://www.pmstusnepal.com` |

Terraform (`modules/lambda/main.tf`) sets `PMST_CORS_ALLOWED_ORIGINS = "https://${var.domain_name},https://www.${var.domain_name}"` automatically.

**Verify:** In browser DevTools → Network tab → any API call from `pmstusnepal.com` should show `Access-Control-Allow-Origin: https://pmstusnepal.com` in response headers (no CORS error).

---

#### ✅ Fix 3 — DB Secrets Manager Reader (`DatabaseConfig.java` — new file)

**What was broken:** Lambda env had `DB_SECRET_ARN` (from Terraform) but `application.properties` hardcoded `localhost:5432`. Nothing read the secret → DB connection failed on Lambda cold start.

**Fix:** New `DatabaseConfig.java` checks `DB_SECRET_ARN` (bound to `pmst.db.secret-arn`) at startup:
- **Local** (env absent) → no-op, uses `localhost:5432` from `application.properties`
- **Lambda prod** (env present) → calls AWS Secrets Manager, reads `{host, port, dbname, username, password}`, overrides `spring.datasource.*`

AWS Secrets Manager SDK (`software.amazon.awssdk:secretsmanager:2.25.30`) added to `pom.xml`.

**Verify locally:** Backend starts without `DB_SECRET_ARN` → logs "DB_SECRET_ARN not set — using local datasource configuration."
**Verify prod intent:** Lambda cold start logs "Database credentials resolved from Secrets Manager: host=..., db=..."

---

#### ✅ Fix 4 — API Gateway: Native Cognito Authorizer (Terraform)

**What was broken:** Terraform provisioned an `authorizer` Lambda with handler `com.pmst.auth.CognitoAuthorizer::handleRequest` — a class that **does not exist** anywhere in the codebase. Cold start → `ClassNotFoundException` → every API call returned 500.

**Fix:** Replaced with native `COGNITO_USER_POOLS` API Gateway authorizer (zero code, built into AWS):

```hcl
resource "aws_api_gateway_authorizer" "cognito" {
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}
```

**Auth architecture (defense in depth):**
```
Request
  → API Gateway: validates Cognito JWT (COGNITO_USER_POOLS authorizer)
      → Public GET routes: authorization = "NONE" (articles, galleries, youtube, profiles)
      → Protected routes:  authorization = "COGNITO_USER_POOLS" (writes, /auth/me, /users/*)
          → Lambda: Spring Security second layer (permitAll / authenticated rules)
```

**Terraform files changed:**
- `modules/api-gateway/main.tf` — authorizer type changed, split GET (NONE) vs write (COGNITO_USER_POOLS) methods
- `modules/api-gateway/variables.tf` — `authorizer_invoke_arn` → `cognito_user_pool_arn`
- `modules/lambda/main.tf` — removed `authorizer` Lambda entry, added `PMST_CORS_ALLOWED_ORIGINS` env
- `modules/lambda/variables.tf` — added `domain_name` variable
- `modules/lambda/outputs.tf` — removed `authorizer_invoke_arn` output
- `environments/prod/main.tf` — updated module args

**Verify:** `terraform plan` on prod environment should show 0 errors and the authorizer resource recreating (expected — type change).

---

### Pre-Prod Deployment Gate

Run this checklist before every `terraform apply -chdir=environments/prod`:

- [ ] `mvn package -DskipTests` completes → `target/pmst-api-service-lambda.jar` produced
- [ ] Backend logs "JWT validation enabled" when `COGNITO_ISSUER_URI` is set locally
- [ ] `GET http://localhost:8080/users/username/testuser` returns 200 without `Authorization` header
- [ ] CORS: Angular dev server (`localhost:4201`) can call backend without CORS errors in DevTools
- [ ] `terraform validate -chdir=environments/prod` passes
- [ ] `terraform plan -chdir=environments/prod` — review and confirm no unintended destroys
- [ ] `DB_SECRET_ARN` is set in Lambda env (Terraform sets this automatically from RDS module output)
- [ ] `PMST_CORS_ALLOWED_ORIGINS` is set in Lambda env (Terraform sets automatically from `domain_name`)
- [ ] `COGNITO_ISSUER_URI` is set in Lambda env (Terraform sets automatically: `https://cognito-idp.{region}.amazonaws.com/{user_pool_id}`)

---

### Remaining Items (Important, Not Critical)

These will not break prod immediately but should be resolved before public launch:

| # | Item | Status |
|---|---|---|
| 5 | `environment.prod.ts` missing `ticketingUrl` | ⬜ Pending |
| 6 | No CI/CD pipeline for `pmst-api-service` backend Lambda | ⬜ Pending |
| 7 | `user_profiles` schema drift — new columns not in `init.sql` | ⬜ Pending |
| 8 | `init.sql` never runs on prod RDS — no migration mechanism | ⬜ Pending |

---

## Part 11: Article Submission Form

### Overview

The article submission form at `/submit/article` mirrors the WordPress field structure used on the original `pmstusnepal.com` site. It stores data to the `articles` table via `POST /articles`.

**Frontend component:** `D:\pmstmigrate\src\app\features\user\submit-content.component.ts`  
**Backend controller:** `D:\pmst-services\pmst-api-service\src\main\java\com\pmst\api\controller\ArticleController.java`  
**API endpoint:** `POST /articles` (authenticated, status: `pending` on submit, `draft` on Save Draft)

---

### WP Field → DB Column Mapping

| Form Label | WP Source | WP Meta Key | DB Column | Java Field | Notes |
|---|---|---|---|---|---|
| Post Title | `wp_posts` | `post_title` | `articles.title` | `title` | Required |
| Post Excerpt | `wp_posts` | `post_excerpt` | `articles.excerpt` | `excerpt` | Max 150 chars |
| Post Content | `wp_posts` | `post_content` | `articles.content` | `content` | Gutenberg stripped on migrate |
| Category | `wp_term_taxonomy` | category taxonomy | `articles.category` | `category` | See values below |
| YouTube Link | `wp_postmeta` | `youtube_link` | `articles.youtube_link` | `youtubeLink` | Optional URL |
| Embed Code | `wp_postmeta` | `embed_code` | `articles.embed_code` | `embedCode` | FB/IG/X/TikTok raw HTML |
| Featured Image | `wp_postmeta` | `_thumbnail_id` | `articles.featured_image` | `featuredImage` | URL (S3 rewrite on migrate) |
| Image Upload | `wp_postmeta` | `image_upload` | `articles.gallery_images` | `galleryImages` | JSONB array, up to 6 URLs |
| Focus Keyword | `wp_postmeta` | `rank_math_focus_keyword` | `articles.seo_focus_keyword` | `seoFocusKeyword` | SEO — Future Scope |
| Meta Description | `wp_postmeta` | `rank_math_description` | `articles.seo_description` | `seoDescription` | SEO — Future Scope |
| SEO Title | `wp_postmeta` | `rank_math_title` | `articles.seo_title` | `seoTitle` | SEO — Future Scope, not on form |

---

### Category Values (Scoped)

| Display Label | DB Value | WP Slug |
|---|---|---|
| Nepali News | `nepali-news` | `nepalnews` |
| Entertainment | `entertainment` | `nepal-entertainment` |
| Sports | `sports` | `sports` |

Other WP categories (`housing-rental`) and future categories (`spotlight`, `fashion`, `events`, `interviews`) are deferred.

---

### Database Migration

New SEO columns added via Flyway:  
`D:\pmst-services\pmst-api-service\src\main\resources\db\migration\V4__add_seo_fields_to_articles.sql`

```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_focus_keyword VARCHAR(255);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title VARCHAR(500);
```

---

### Migration Script Update

`D:\pmst-migration\scripts\10_migrate_article_meta.py` updated to extract:
- `rank_math_focus_keyword` → `seo_focus_keyword`
- `rank_math_description` → `seo_description`
- `rank_math_title` → `seo_title`

---

### SEO Live Preview (Angular)

The SEO section is collapsible (labeled "Future Scope"). Preview box HTML reference:

```html
<!-- Google Preview — dark card, inline styles for portability -->
<div style="background:#1e1e1e; padding:20px; border-radius:12px;">
  <h4 style="color:#00e676; font-size:14px; margin-bottom:12px;">Google Preview</h4>
  <!-- Title: {post_title} - {CATEGORY} | PMST US-Nepal -->
  <div style="color:#1a73e8; font-size:16px; margin-bottom:4px;">
    {{ title }} - {{ category | uppercase }} | PMST US-Nepal
  </div>
  <!-- URL: pmstusnepal.com/{slug} -->
  <div style="color:#006621; font-size:14px; margin-bottom:4px;">
    pmstusnepal.com/{{ slug }}
  </div>
  <!-- Description: rank_math_description or fallback -->
  <div style="color:#9e9e9e; font-size:12px;">
    {{ seoDescription || 'Example description here...' }}
  </div>
</div>
```

Preview title format: `{post_title} - {CATEGORY LABEL UPPERCASE} | PMST US-Nepal`  
Slug: auto-generated from title (lowercase, hyphens, alphanumeric only).

---

### Future Scope

| Item | Notes |
|---|---|
| S3 image upload | Replace base64 previews with direct upload to S3 presigned URL |
| SEO score indicator | Rank Math-style keyword density check against content |
| Admin review workflow | Admin dashboard view for `status = 'pending'` articles |

---

## Part 12: Inline Editable Article Submission Form

**Component:** `src/app/features/user/submit-content.component.ts`  
**Status:** ✅ Implemented (May 2026)

WYSIWYG article editor that visually mirrors the published `news-detail` page.

### Layout

```
[ Sticky Top Bar — back link | label | badge ]
[ Banner: success / error ]

┌─ pmst-post-container ─────────────────────────────────────────┐
│                                                               │
│  ┌──────────────────────┬──────────────────────┐             │
│  │ Featured Image *     │ YouTube Link          │             │
│  │ (upload zone /       │ (URL input + iframe   │             │
│  │  live preview)       │  preview + hint text) │             │
│  └──────────────────────┴──────────────────────┘             │
│                                                               │
│  [Reactions placeholder]                                      │
│  [H1 contenteditable — title]                                 │
│  [/news/slug badge]                                           │
│  [By PMST US-Nepal | date]                                    │
│  [Quill rich-text editor — .pmst-content styled]              │
│  [📱 Social Embed — collapsible]                              │
│  [Gallery grid — + tiles to upload, up to 6]                  │
└───────────────────────────────────────────────────────────────┘

[ Sticky Bottom Bar ]
  Category | Excerpt | 🔍 SEO ▼ | Save Draft | Submit/Publish
  └─ SEO panel expands above: Focus Keyword | Meta Desc | Google preview
```

### Hero — Featured Image vs YouTube (side-by-side)

| Panel | Behavior |
|---|---|
| **Left — Featured Image (required)** | Dashed upload zone; live blurred-bg preview after upload; ✏️ swap + ✕ clear buttons; red border + shake + `⚠ Required` badge on failed submit |
| **Right — YouTube (optional)** | URL input with YouTube icon; live iframe preview on valid URL; hint text always visible; green confirmation message when valid URL set |

Featured image is **always required** — submit/publish blocked without it. YouTube link is independent and optional.

### Role-based submission

| Role | Button | API status |
|---|---|---|
| Regular user | Submit for Review (indigo) | `pending` |
| Admin | ✓ Publish (green) | `published` |
| Both | Save Draft (outline) | `draft` |

### Key signals / state

| Signal | Purpose |
|---|---|
| `featuredImagePreview` | Base64 data URL after upload |
| `submitAttempted` | Triggers red-border validation state |
| `safeYoutubeUrl` | `SafeResourceUrl` for iframe, computed from `youtubeLink` |
| `generatedSlug` | Auto-generated from title (lowercase, hyphens) |
| `embedOpen` / `seoOpen` | Collapsible panel toggles |

### Payload (no backend changes needed)

Uses existing `ArticleService.createArticle()` with `CreateArticlePayload` (status: `'draft' | 'pending' | 'published'`).

---

## Part 10: Image Pipeline

### Overview

All images follow a two-path strategy:
- **New uploads (post-launch):** Angular calls `POST /media/upload` → API returns presigned S3 URL → browser PUTs directly to S3 → Lambda auto-processes
- **Existing images (pre-launch batch):** `14_process_and_upload_images.py` script processes all migrated images and uploads to S3

### Image Tier Sizes

| Tier | Longest Edge | Use Case |
|------|-------------|----------|
| `thumb` | 150px | Gallery grids, avatars |
| `card` | 480px | Article cards, listing pages |
| `hero` | 1200px | Detail page featured images |
| `master` | 2400px | Full-size / download |

Both WebP (primary) and JPEG (fallback) are generated for each tier.

### S3 Storage Layout

```
pmst-prod-media/
├── uploads/raw/           ← Browser direct uploads (deleted after processing)
└── media/{year}/{month}/{uuid}/
    ├── thumb.webp / thumb.jpg
    ├── card.webp  / card.jpg
    ├── hero.webp  / hero.jpg
    └── master.webp / master.jpg
```

### Data Flow

```
Angular form
  │ POST /api/media/upload {filename, contentType}
  ▼
MediaController (Java Lambda)
  │ returns { presignedUrl, objectKey }
  ▼
Browser PUT → S3 uploads/raw/{uuid}.jpg
  │ S3 event notification
  ▼
SQS queue (pmst-prod-image-processing)
  │ Lambda trigger (batch_size=5)
  ▼
image-processor Lambda (Python 3.12 + Pillow)
  │ 1. Download raw from S3
  │ 2. Resize to 4 tiers × 2 formats = 8 files
  │ 3. Upload to media/{year}/{month}/{uuid}/
  │ 4. Update articles/gallery_images.image_key in RDS
  │ 5. Delete raw file
  ▼
Done — image_key available in API responses
```

### Database Changes (V6 Migration)

`V6__add_image_key_columns.sql` adds:
- `articles.image_key VARCHAR(500)` — base S3 path for article featured image
- `gallery_images.image_key VARCHAR(500)` — base S3 path per gallery image

### Angular Usage

```typescript
// In component:
imageUrl = imageUrlMapper.getCardUrl(article.imageKey, article.featuredImage);
heroUrl  = imageUrlMapper.getHeroUrl(article.imageKey, article.featuredImage);
thumbUrl = imageUrlMapper.getThumbUrl(article.imageKey, article.featuredImage);

// imageKey present → CloudFront WebP URL
// imageKey null    → falls back to legacy featuredImage mapping
```

### Configuration (SSM Parameter Store)

All tuneable — change without redeployment:

| SSM Path | Default | Description |
|---|---|---|
| `/pmst/prod/image/master_longest_edge` | `2400` | Max longest edge in px |
| `/pmst/prod/image/webp_quality` | `85` | WebP encode quality |
| `/pmst/prod/image/jpeg_quality` | `90` | JPEG encode quality |
| `/pmst/prod/image/tiers` | `thumb:150,card:480,hero:1200,master:2400` | Tier definitions |

### Batch Migration (Run Before Go-Live)

```bash
# Dry run first (no uploads)
cd D:\pmst-migration\scripts
python 14_process_and_upload_images.py

# Full apply (needs AWS creds + MEDIA_BUCKET env var)
set MEDIA_BUCKET=pmst-prod-media
python 14_process_and_upload_images.py --apply --workers 4

# Test with first 50 images
python 14_process_and_upload_images.py --apply --limit 50
```

### Pre-Go-Live Checklist (Images)

- [ ] Run `14_process_and_upload_images.py --apply` on all existing images (~3,337)
- [ ] Verify sample `image_key` values in DB match S3 object paths
- [ ] Update `environment.prod.ts` → `cfDomain` with actual CloudFront domain
- [ ] Test `getTierUrl()` returns correct WebP URLs in Angular
- [ ] Verify S3 lifecycle rule deletes `uploads/raw/` after 1 day
- [ ] Check CloudWatch logs for image-processor Lambda errors after first upload

---

## Part 11: CI/CD Pipeline (GitHub Actions + OIDC) ← Current

### Authentication (No Static Keys)

All GitHub Actions authenticate to AWS via **OIDC** — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in GitHub Secrets.

### GitHub Actions Workflows

| Repo | Workflow File | Trigger | Action |
|------|--------------|---------|--------|
| pmst-terraform-infra | `.github/workflows/terraform-apply.yml` | Push to `main` | `terraform apply` |
| pmst-angular-ui | `.github/workflows/deploy-angular.yml` | Push to `main` | S3 sync + CF invalidation |
| pmst-api-service | `.github/workflows/deploy-api-service.yml` | Push to `main` | JAR → S3 → Lambda update |
| pmst-image-processor | `.github/workflows/deploy-image-processor.yml` | Push to `main` | Docker → ECR → Lambda update |

### Required GitHub Secrets (per repo)

| Secret | Description |
|--------|-------------|
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |
| `TF_VAR_DB_PASSWORD` | (terraform-infra only) RDS password |
| `ACM_CERT_ARN` | (terraform-infra only) ACM cert ARN after first apply |
| `CLOUDFRONT_DISTRIBUTION_ID` | (angular-ui only) From Terraform output |

### Bootstrap Order (First Deploy)

1. Run `bootstrap/README.md` commands to create S3 state bucket + OIDC IAM roles
2. Manual `terraform init && terraform apply` (first time only — no CI yet)
3. Get outputs: CloudFront distribution ID, ECR repo URLs
4. Add secrets to GitHub repos
5. Push to `main` — all subsequent deploys are fully automated

### IAM Roles Created by Bootstrap

| Role | Used By | Permissions |
|------|---------|-------------|
| `pmst-github-actions-terraform` | terraform-infra repo | AdministratorAccess (scoped to repo) |
| `pmst-github-actions-deploy` | angular-ui, api-service, image-processor | S3 + Lambda + CloudFront + ECR |

---

## Part 11b: Deployment Readiness Checklist (Test → Prod)

> **Goal:** Deploy to a test CloudFront URL first, verify everything works, then cutover to pmstusnepal.com

### Phase 0: Prerequisites (Must Have Before Starting)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 0.1 | AWS Account ID (12-digit) | ⬜ | Run: `aws sts get-caller-identity --query Account --output text` |
| 0.2 | AWS CLI installed and configured | ⬜ | `aws configure` with admin credentials |
| 0.3 | GitHub access to all 3 repos | ⬜ | `pmst-terraform-infra`, `pmst-api-service`, `pmst-angular-ui` |
| 0.4 | Strong DB password ready | ⬜ | 16+ chars, upper+lower+number+symbol |
| 0.5 | Local builds working | ⬜ | `npm run build:prod` and `mvn package -DskipTests` |

### Phase 1: Bootstrap Terraform Backend + OIDC (Run Once)

| # | Task | Command | Status |
|---|------|---------|--------|
| 1.1 | Create S3 state bucket | `aws s3 mb s3://pmst-terraform-state --region us-east-1` | ⬜ |
| 1.2 | Enable S3 versioning | `aws s3api put-bucket-versioning --bucket pmst-terraform-state --versioning-configuration Status=Enabled` | ⬜ |
| 1.3 | Enable S3 encryption | `aws s3api put-bucket-encryption --bucket pmst-terraform-state --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'` | ⬜ |
| 1.4 | Block S3 public access | `aws s3api put-public-access-block --bucket pmst-terraform-state --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"` | ⬜ |
| 1.5 | Create DynamoDB lock table | `aws dynamodb create-table --table-name pmst-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-1` | ⬜ |
| 1.6 | Create OIDC provider | `aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1` | ⬜ |

### Phase 2: Create IAM Roles for GitHub Actions

**Role 1: Terraform Role** (`pmst-github-actions-terraform`)
```bash
aws iam create-role --role-name pmst-github-actions-terraform --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringLike": {"token.actions.githubusercontent.com:sub": "repo:pmstnepal/pmst-terraform-infra:*"},
      "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"}
    }
  }]
}'

aws iam attach-role-policy --role-name pmst-github-actions-terraform --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**Role 2: Deploy Role** (`pmst-github-actions-deploy`)
```bash
aws iam create-role --role-name pmst-github-actions-deploy --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringLike": {"token.actions.githubusercontent.com:sub": "repo:pmstnepal/*:*"},
      "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"}
    }
  }]
}'

aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
```

| Role | Status |
|------|--------|
| `pmst-github-actions-terraform` | ⬜ |
| `pmst-github-actions-deploy` | ⬜ |

### Phase 3: Configure GitHub Secrets

**Repository: `pmst-terraform-infra`**
| Secret | Value | Status |
|--------|-------|--------|
| `AWS_ACCOUNT_ID` | Your 12-digit AWS Account ID | ⬜ |
| `TF_VAR_DB_PASSWORD` | Strong RDS password | ⬜ |
| `TF_VAR_ACM_CERT_ARN` | Use `PLACEHOLDER` for initial test deploy | ⬜ |

**Repository: `pmst-api-service`**
| Secret | Value | Status |
|--------|-------|--------|
| `AWS_ACCOUNT_ID` | Your 12-digit AWS Account ID | ⬜ |

**Repository: `pmst-angular-ui`**
| Secret | Value | Status |
|--------|-------|--------|
| (None needed - OIDC only) | | |

### Phase 4: First Terraform Apply (Test Deployment)

```bash
cd environments/prod

# Initialize
terraform init

# Plan (with placeholder cert - CloudFront will use default domain)
terraform plan \
  -var="db_password=YOUR_STRONG_PASSWORD" \
  -var="acm_certificate_arn=arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/PLACEHOLDER" \
  -out=tfplan

# Apply (20-30 minutes)
terraform apply tfplan
```

**Save These Outputs:**
| Output | Value | Used In |
|--------|-------|---------|
| `cloudfront_domain_name` | `xxxx.cloudfront.net` | Testing |
| `api_gateway_endpoint` | `https://xxxx.execute-api.us-east-1.amazonaws.com` | Angular env |
| `cognito_user_pool_id` | `us-east-1_xxxxx` | Angular env |
| `frontend_bucket_name` | `pmst-prod-frontend-xxxxx` | S3 sync |
| `media_bucket_name` | `pmst-prod-media-xxxxx` | - |
| `cloudfront_distribution_id` | `EXXXXXXXXXXX` | GitHub Variables |

### Phase 5: Deploy Applications

**5.1: Build and Deploy API Service**
```bash
cd pmst-api-service
mvn clean package -DskipTests
aws s3 cp target/pmst-api-service-1.0.0-lambda.jar s3://pmst-terraform-state/deployments/pmst-api-service-latest.jar
aws lambda update-function-code --function-name pmst-prod-pmst-api-service --s3-bucket pmst-terraform-state --s3-key deployments/pmst-api-service-latest.jar
aws lambda wait function-updated --function-name pmst-prod-pmst-api-service
aws lambda publish-version --function-name pmst-prod-pmst-api-service
```

**5.2: Build and Deploy Angular**
```bash
cd pmst-angular-ui

# Update environment.prod.ts with actual values from Terraform
# Then build and deploy
npm ci
npm run build:prod

aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET \
  --delete --cache-control "public, max-age=31536000, immutable" --exclude "*.html"
  
aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET \
  --delete --cache-control "no-cache" --include "*.html"

aws cloudfront create-invalidation --distribution-id YOUR_CF_DISTRIBUTION_ID --paths "/*"
```

### Phase 6: Verify Test Deployment

| Test | URL/Command | Expected |
|------|-------------|----------|
| CloudFront loads | `https://xxxx.cloudfront.net` | Angular app renders |
| API responds | `curl https://xxxx.execute-api.us-east-1.amazonaws.com/prod/articles` | JSON array |
| Cognito works | Sign up via UI | User appears in Cognito console |

### Phase 7: Production Domain Cutover

**Step 7.1: Request ACM Certificate**
```bash
aws acm request-certificate \
  --domain-name pmstusnepal.com \
  --subject-alternative-names "www.pmstusnepal.com" \
  --validation-method DNS \
  --region us-east-1
```

**Step 7.2: Add DNS Validation Records to Hostinger**
Get CNAME records from:
```bash
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/ID --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```

Add to Hostinger DNS → Wait for validation (status: `ISSUED`)

**Step 7.3: Re-run Terraform with Real Certificate**
```bash
terraform apply \
  -var="db_password=YOUR_PASSWORD" \
  -var="acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT:certificate/REAL_ARN"
```

**Step 7.4: Lower DNS TTL (24 hours before cutover)**
In Hostinger DNS: Set TTL to 300 seconds on all A/AAAA/CNAME records.

**Step 7.5: DNS Cutover**
| Record | Old Value | New Value |
|--------|-----------|-----------|
| A (pmstusnepal.com) | 46.202.182.16 | CloudFront domain |
| AAAA (pmstusnepal.com) | 2a02:4780:2b:1870:0:1137:670d:d | CloudFront IPv6 |
| CNAME (www) | pmstusnepal.com | CloudFront domain |

**Rollback:** Switch back to Hostinger IP within 5 minutes if issues arise.

---

## Part 11c: Step-by-Step Deployment Execution Guide

> **Goal:** Execute each deployment step with exact commands. Run each command, verify output, then proceed.

### Pre-Flight Check (Do This First)

```bash
# Step 0.1: Get AWS Account ID
aws sts get-caller-identity --query Account --output text
# Record: ________________________ (12 digits)

# Step 0.2: Verify AWS CLI works
aws sts get-caller-identity
# Expected: Account ID, User ARN

# Step 0.3: Test local builds
cd D:\pmstmigrate && npm run build:prod
cd D:\pmst-services\pmst-api-service && mvn clean package -DskipTests
```

---

### Step 1: Bootstrap Terraform Backend (10 min)

```bash
# 1.1: Create S3 bucket
aws s3 mb s3://pmst-terraform-state --region us-east-1
# Verify: make_bucket: pmst-terraform-state

# 1.2: Enable versioning
aws s3api put-bucket-versioning --bucket pmst-terraform-state --versioning-configuration Status=Enabled

# 1.3: Block public access
aws s3api put-public-access-block --bucket pmst-terraform-state --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 1.4: Create DynamoDB lock table
aws dynamodb create-table --table-name pmst-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-1

# 1.5: Verify
aws s3 ls s3://pmst-terraform-state
aws dynamodb describe-table --table-name pmst-terraform-locks --query 'Table.TableStatus'
# Checkpoint: Both succeed
```

---

### Step 2: Create OIDC Provider (5 min)

```bash
# 2.1: Create OIDC provider for GitHub Actions
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
# Save the ARN: arn:aws:iam::YOUR_ACCOUNT:oidc-provider/token.actions.githubusercontent.com
```

---

### Step 3: Create IAM Roles (15 min)

```bash
# Set variable
export AWS_ACCOUNT_ID="YOUR_12_DIGIT_ACCOUNT_ID"

# 3.1: Create Terraform role
aws iam create-role --role-name pmst-github-actions-terraform --assume-role-policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": {\"Federated\": \"arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com\"},
    \"Action\": \"sts:AssumeRoleWithWebIdentity\",
    \"Condition\": {
      \"StringLike\": {\"token.actions.githubusercontent.com:sub\": \"repo:pmstnepal/pmst-terraform-infra:*\"},
      \"StringEquals\": {\"token.actions.githubusercontent.com:aud\": \"sts.amazonaws.com\"}
    }
  }]
}"

# 3.2: Attach admin policy
aws iam attach-role-policy --role-name pmst-github-actions-terraform --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 3.3: Create Deploy role
aws iam create-role --role-name pmst-github-actions-deploy --assume-role-policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": {\"Federated\": \"arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com\"},
    \"Action\": \"sts:AssumeRoleWithWebIdentity\",
    \"Condition\": {
      \"StringLike\": {\"token.actions.githubusercontent.com:sub\": \"repo:pmstnepal/*:*\"},
      \"StringEquals\": {\"token.actions.githubusercontent.com:aud\": \"sts.amazonaws.com\"}
    }
  }]
}"

# 3.4: Attach deploy policies
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess
aws iam attach-role-policy --role-name pmst-github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

# 3.5: Verify
aws iam list-attached-role-policies --role-name pmst-github-actions-terraform
aws iam list-attached-role-policies --role-name pmst-github-actions-deploy
# Checkpoint: Terraform=AdministratorAccess, Deploy=4 policies
```

---

### Step 4: Configure GitHub Secrets (10 min)

**Repository 1: pmst-terraform-infra**
| Secret | Value |
|--------|-------|
| `AWS_ACCOUNT_ID` | Your 12-digit Account ID |
| `TF_VAR_DB_PASSWORD` | Strong password (16+ chars) |
| `TF_VAR_ACM_CERT_ARN` | `arn:aws:acm:us-east-1:ACCOUNT:certificate/PLACEHOLDER` |

**Repository 2: pmst-api-service**
| Secret | Value |
|--------|-------|
| `AWS_ACCOUNT_ID` | Your 12-digit Account ID |

**Checkpoint:** All secrets added to both repositories

---

### Step 5: Terraform Apply (30-45 min)

```bash
# 5.1: Navigate to prod environment
cd D:\pmstmigrateinfra\environments\prod

# 5.2: Initialize
terraform init
# Expected: Terraform has been successfully initialized!

# 5.3: Plan (with placeholder cert for test deployment)
terraform plan \
  -var="db_password=YOUR_PASSWORD" \
  -var="acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/PLACEHOLDER" \
  -out=tfplan
# Review: Should show resources to create, no destroys

# 5.4: Apply (takes 20-30 min)
terraform apply tfplan
# Wait for: Apply complete! Resources: XX added

# 5.5: Save outputs
cd D:\pmstmigrateinfra\environments\prod
terraform output
# Record:
# - cloudfront_domain_name (test URL)
# - api_gateway_endpoint
# - cognito_user_pool_id
# - frontend_bucket_name
# - cloudfront_distribution_id
```

---

### Step 6: Deploy API Service (5 min)

```bash
# 6.1: Build
cd D:\pmst-services\pmst-api-service
mvn clean package -DskipTests

# 6.2: Upload to S3
aws s3 cp target/pmst-api-service-1.0.0-lambda.jar \
  s3://pmst-terraform-state/deployments/pmst-api-service-latest.jar

# 6.3: Update Lambda
aws lambda update-function-code \
  --function-name pmst-prod-pmst-api-service \
  --s3-bucket pmst-terraform-state \
  --s3-key deployments/pmst-api-service-latest.jar

# 6.4: Wait
aws lambda wait function-updated --function-name pmst-prod-pmst-api-service

# 6.5: Publish version (SnapStart)
aws lambda publish-version --function-name pmst-prod-pmst-api-service
```

---

### Step 7: Deploy Angular Frontend (10 min)

```bash
# 7.1: Update environment.prod.ts with Terraform outputs
cd D:\pmstmigrate

# 7.2: Build
npm run build:prod

# 7.3: Sync to S3 (cached assets)
aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET \
  --delete --cache-control "public, max-age=31536000, immutable" --exclude "*.html"

# 7.4: Sync HTML files (no cache)
aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET \
  --delete --cache-control "no-cache" --include "*.html"

# 7.5: Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_CF_DISTRIBUTION_ID --paths "/*"
```

---

### Step 8: Verify Test Deployment

| Test | Command/URL | Expected |
|------|-------------|----------|
| CloudFront loads | `https://xxxx.cloudfront.net` | Angular app renders |
| API responds | `curl https://xxxx.execute-api.us-east-1.amazonaws.com/prod/articles` | JSON array |
| Cognito works | Sign up via UI | User appears in Cognito console |

---

### Step 9: Production Domain Cutover (Do Later)

```bash
# 9.1: Request ACM certificate
aws acm request-certificate \
  --domain-name pmstusnepal.com \
  --subject-alternative-names "www.pmstusnepal.com" \
  --validation-method DNS \
  --region us-east-1

# 9.2: Get DNS validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/ID \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'

# 9.3: Add CNAME records to Hostinger DNS
# 9.4: Wait for certificate status: ISSUED

# 9.5: Re-run Terraform with real certificate
cd D:\pmstmigrateinfra\environments\prod
terraform apply \
  -var="db_password=PASSWORD" \
  -var="acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT:certificate/REAL_ARN"

# 9.6: Lower DNS TTL to 300s (24h before cutover)
# 9.7: DNS cutover: Update A/AAAA records to CloudFront domain
```

---

## Part 11d: Complete Deployment Lifecycle (Create / Destroy / Recreate)

> **Goal:** Single-command deployment, destruction, and recreation of entire AWS infrastructure with local CSV/image migration.

### Data Source (Local - No Live WordPress Connection)

| Data | Location | Migration Method |
|------|----------|------------------|
| Users, Articles, Comments | `d:\pmst-migration\exports\*.csv` | `run_all_migrations.py` |
| Images | `d:\pmst-migration\uploads-extracted\` | `14_process_and_upload_images.py` |
| **Total Size** | ~5.5GB images + 100MB CSV | Local processing only |

**Key Point:** No connection to live WordPress needed. All data exported to local CSV files.

---

### DEPLOY (Create Infrastructure + Migrate Data)

#### Phase 1: Bootstrap AWS (One-Time)
```powershell
# 1.1: Create S3 bucket for Terraform state
aws s3 mb s3://pmst-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket pmst-terraform-state --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket pmst-terraform-state --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 1.2: Create DynamoDB lock table
aws dynamodb create-table --table-name pmst-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-1

# 1.3: Create OIDC provider
aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 1.4: Create IAM roles (replace YOUR_ACCOUNT_ID)
# See Part 11b for exact commands
```

#### Phase 2: Terraform Apply (Create Infrastructure)
```powershell
# 2.1: Navigate to prod environment
cd d:\pmstmigrateinfra\environments\prod

# 2.2: Initialize and apply
terraform init
terraform plan -var="db_password=YOUR_PASSWORD" -var="acm_certificate_arn=arn:aws:acm:us-east-1:ACCOUNT:PLACEHOLDER" -out=tfplan
terraform apply tfplan

# 2.3: Save outputs
terraform output > deployment_outputs.txt
```

**Outputs to save:**
- `cloudfront_domain_name` → Test URL: `https://xxxx.cloudfront.net`
- `api_gateway_endpoint` → API URL
- `frontend_bucket_name` → For S3 sync
- `cloudfront_distribution_id` → For cache invalidation
- `media_bucket_name` → For image uploads

#### Phase 3: Data Migration (Local → RDS)
```powershell
# 3.1: Navigate to migration directory
cd d:\pmst-migration

# 3.2: Install dependencies (if not done)
pip install -r requirements.txt

# 3.3: Run master migration script (migrates all CSV data to RDS)
python run_all_migrations.py

# This runs in order:
# - 01_migrate_users.py (18 users)
# - 02_migrate_user_profiles.py
# - 03_migrate_tags.py
# - 04_migrate_articles.py (all articles)
# - 05_migrate_article_tags.py
# - 06_migrate_galleries.py
# - 07_migrate_gallery_images.py
# - 08_migrate_comments.py
# - 09_migrate_follows.py
# - 10_migrate_article_meta.py
# - 11_link_user_profiles_to_cognito.py
# - 13_migrate_gallery_seo.py
```

**Expected output:**
```
🚀 PMST DATA MIGRATION
   WordPress → AWS RDS
============================================================
🔍 Checking prerequisites...
✅ All prerequisites met

📋 Will run 12 migration scripts:
    1. 01_migrate_users.py                  Users
    2. 02_migrate_user_profiles.py        User Profiles
    ...

📊 MIGRATION SUMMARY
============================================================
   Total scripts: 12
   ✅ Successful: 12
   ❌ Failed: 0
   ⏱️  Total time: 45.2s

🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!
```

#### Phase 4: Image Migration (Local → S3)
```powershell
# 4.1: Process and upload images (creates WebP/JPEG tiers)
cd d:\pmst-migration
python scripts/14_process_and_upload_images.py --apply

# This processes ~3,337 images from uploads-extracted/
# Creates 4 tiers per image: thumb, card, hero, master
# Uploads to S3: s3://pmst-prod-media/media/YYYY/MM/
```

**Note:** First run takes 2-4 hours. Use `--workers 4` for parallel processing.

#### Phase 5: Deploy Applications
```powershell
# 5.1: Deploy API Service
cd d:\pmst-services\pmst-api-service
mvn clean package -DskipTests
aws s3 cp target/pmst-api-service-1.0.0-lambda.jar s3://pmst-terraform-state/deployments/pmst-api-service-latest.jar
aws lambda update-function-code --function-name pmst-prod-pmst-api-service --s3-bucket pmst-terraform-state --s3-key deployments/pmst-api-service-latest.jar
aws lambda wait function-updated --function-name pmst-prod-pmst-api-service
aws lambda publish-version --function-name pmst-prod-pmst-api-service

# 5.2: Deploy Frontend
cd d:\pmstmigrate
npm run build:prod
aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET --delete --cache-control "public, max-age=31536000, immutable" --exclude "*.html"
aws s3 sync dist/pmst-angular-ui/browser/ s3://YOUR_FRONTEND_BUCKET --delete --cache-control "no-cache" --include "*.html"
aws cloudfront create-invalidation --distribution-id YOUR_CF_DISTRIBUTION_ID --paths "/*"
```

#### Phase 6: Verify Deployment
```powershell
# 6.1: Verify data in RDS
aws rds describe-db-instances --query 'DBInstances[0].Endpoint.Address' --output text
# Then connect with psql and check: SELECT COUNT(*) FROM articles;

# 6.2: Verify images in S3
aws s3 ls s3://pmst-prod-media --recursive | wc -l

# 6.3: Test CloudFront URL
curl -s https://xxxx.cloudfront.net | head

# 6.4: Test API
curl https://xxxx.execute-api.us-east-1.amazonaws.com/prod/articles | jq '. | length'
```

---

### DESTROY (Delete Everything)

> ⚠️ **WARNING:** This permanently deletes all AWS resources and data. Create snapshots first if you need backups.

#### Pre-Destroy Checklist
- [ ] Create RDS snapshot (optional but recommended)
- [ ] Notify team about downtime
- [ ] Export any new data you want to keep

#### Destroy Steps
```powershell
# Step 1: Create RDS snapshot (optional backup)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
aws rds create-db-snapshot --db-instance-identifier pmst-prod-db --db-snapshot-identifier "pmst-pre-destroy-$timestamp"

# Step 2: Empty S3 buckets (Terraform can't delete non-empty buckets)
cd d:\pmstmigrateinfra\environments\prod
$frontendBucket = terraform output -raw frontend_bucket_name
$mediaBucket = terraform output -raw media_bucket_name

aws s3 rm "s3://$frontendBucket" --recursive
aws s3 rm "s3://$mediaBucket" --recursive

# Step 3: Delete ECR images (Terraform can't delete repo with images)
aws ecr batch-delete-image --repository-name pmst-image-processor --image-ids "imageTag=latest"

# Step 4: Disable CloudFront distributions (speeds up destroy)
# Note: Terraform will handle this, but manual disable is faster

# Step 5: Terraform destroy
terraform destroy -auto-approve

# Step 6: Verify destruction
aws ec2 describe-instances --filters "Name=tag:Project,Values=pmst" --query 'Reservations[*].Instances[*].InstanceId'
aws rds describe-db-instances --db-instance-identifier pmst-prod-db
aws s3 ls
# All should return empty/no results
```

**Estimated destroy time:** 15-30 minutes

---

### RECREATE (Destroy + Deploy)

Use this when you want to start fresh with the same configuration.

#### Quick Recreate Script
```powershell
# save as recreate.ps1
param(
    [switch]$SkipBackup,
    [string]$DbPassword = $env:TF_VAR_DB_PASSWORD
)

Write-Host "🔄 RECREATE: Destroy + Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Step 1: Destroy (with optional backup)
if (-not $SkipBackup) {
    Write-Host "📸 Creating RDS snapshot..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    aws rds create-db-snapshot --db-instance-identifier pmst-prod-db --db-snapshot-identifier "pmst-pre-recreate-$timestamp"
}

Write-Host "🗑️  Destroying infrastructure..." -ForegroundColor Yellow
cd d:\pmstmigrateinfra\environments\prod
terraform destroy -auto-approve

# Step 2: Deploy
Write-Host "🏗️  Creating infrastructure..." -ForegroundColor Yellow
terraform init
terraform apply -auto-approve -var="db_password=$DbPassword" -var="acm_certificate_arn=arn:aws:acm:us-east-1:$env:AWS_ACCOUNT_ID:certificate/PLACEHOLDER"

# Step 3: Migrate data
Write-Host "📊 Migrating data..." -ForegroundColor Yellow
cd d:\pmst-migration
python run_all_migrations.py

# Step 4: Migrate images
Write-Host "🖼️  Migrating images..." -ForegroundColor Yellow
python scripts/14_process_and_upload_images.py --apply

Write-Host "✅ Recreate complete!" -ForegroundColor Green
```

**Usage:**
```powershell
# Full recreate with backup
.\recreate.ps1

# Quick recreate without backup
.\recreate.ps1 -SkipBackup
```

---

### CI/CD Automation (After First Deploy)

Once initial deploy is complete, future updates are automatic:

| Repository | Trigger | Action |
|------------|---------|--------|
| `pmst-terraform-infra` | Push to `main` | Terraform apply (infrastructure changes) |
| `pmst-api-service` | Push to `main` | Build JAR → S3 → Lambda update |
| `pmst-angular-ui` | Push to `main` | Build → S3 sync → CloudFront invalidation |

**No manual steps needed for code deployments after initial setup!**

---

### Cost Considerations

| Phase | AWS Cost | Duration |
|-------|----------|----------|
| Deploy | ~$50-100 first month | 2-3 hours setup |
| Running | ~$200-300/month | Ongoing |
| Destroy | $0 | 15-30 min |
| Recreate | Same as deploy | 2-3 hours |

**Cost-saving tip:** Destroy when not actively developing/testing.

---

## Part 12: Production Deployment — Before / During / After

> This section covers the **full Flyway concern** introduced by adding `flyway-core` to `pom.xml`, and the general deployment safety checklist for every prod push.

---

### BEFORE Deployment

#### Flyway — First-Time Prod RDS Bootstrap

Prod RDS is a **clean database** — no migrations have ever run outside Flyway there. On the first Lambda cold start, Flyway will:
1. Create `flyway_schema_history` table automatically
2. Apply V2 → V6 in order from scratch
3. Record real checksums — no manual seeding needed

**No action required** — Flyway handles it. But verify these before `terraform apply`:

- [ ] `mvn package -DskipTests` produces `target/pmst-api-service-lambda.jar` without errors
- [ ] All `db/migration/V*.sql` files are present in the JAR (`jar tf target/*.jar | grep migration`)
- [ ] `spring.flyway.validate-on-migrate=false` is set in `application.properties` (handles local history mismatch — safe on clean prod RDS)
- [ ] Confirm `spring.jpa.hibernate.ddl-auto=validate` — Hibernate must NOT auto-create/alter schema; Flyway owns all DDL

#### Pre-Deploy Checklist (Every Prod Push)

| Check | Command / Action | Pass Condition |
|-------|-----------------|----------------|
| Tests pass | `mvn test` | BUILD SUCCESS |
| Lambda JAR builds | `mvn package -DskipTests` | `target/*-lambda.jar` exists |
| Terraform plan clean | `terraform plan -chdir=environments/prod` | No unintended destroys |
| Angular build clean | `npm run build:prod` (in `D:\pmstmigrate`) | No errors, `dist/` produced |
| Local smoke test | `mvn spring-boot:run -DskipTests` → GET `/articles` | 200 + JSON articles |
| Branch is `main` | `git branch --show-current` | `main` |
| No uncommitted changes | `git status` | Clean working tree |

#### Flyway Re-enable Validation (Post First Prod Deploy)

After the first successful prod deploy, flip the flag to catch accidental migration edits:

```properties
# application.properties — update after first prod deploy
spring.flyway.validate-on-migrate=true   # re-enable after prod RDS is bootstrapped
```

---

### DURING Deployment

#### Deployment Order (Always Follow This Sequence)

```
1. Terraform apply        → provisions/updates AWS infra (RDS, Lambda, API GW, Cognito, S3, CF)
2. Flyway runs            → auto on Lambda cold start (creates/migrates schema)
3. Lambda JAR upload      → CI/CD: JAR → S3 → Lambda update-function-code
4. Angular build + upload → CI/CD: npm build:prod → S3 sync → CF invalidation
```

**Never deploy frontend before backend** — Angular may reference new API fields that don't exist yet.

#### What Triggers Each Deployment

| Repo | Trigger | What Deploys |
|------|---------|-------------|
| `pmst-terraform-infra` | Push to `main` | Full infra (`terraform apply`) |
| `pmst-api-service` | Push to `main` | Lambda JAR → S3 → `update-function-code` |
| `pmst-angular-ui` | Push to `main` | `dist/` → S3 sync → CloudFront invalidation |
| `pmst-image-processor` | Push to `main` | Docker → ECR → Lambda update |

#### Lambda Cold Start After Deploy

On the first request after a Lambda update:
- Spring Boot initialises (~3–5s with SnapStart)
- Flyway checks `flyway_schema_history` — applies any pending migrations
- JPA validates schema against entities — **will crash if columns missing**
- App starts serving requests

**Watch CloudWatch Logs** for any `SchemaManagementException` or `FlywayMigrateException` immediately after deploy.

#### Monitoring During Deploy

```bash
# Watch Lambda logs in real time (run in separate terminal after deploy)
aws logs tail /aws/lambda/pmst-api-prod --follow --region us-east-1

# Check Lambda function last-modified timestamp
aws lambda get-function --function-name pmst-api-prod --query 'Configuration.LastModified'

# Verify CloudFront invalidation completed
aws cloudfront list-invalidations --distribution-id <CF_DIST_ID> --query 'InvalidationList.Items[0].Status'
```

---

### AFTER Deployment

#### Post-Deploy Smoke Tests (Run Immediately)

| Test | Command / URL | Expected |
|------|--------------|----------|
| API health | `curl https://api.pmstusnepal.com/articles` | 200 + JSON |
| Public gallery | `curl https://api.pmstusnepal.com/galleries` | 200 + JSON |
| Frontend loads | Open `https://pmstusnepal.com` in browser | Homepage renders |
| CloudFront cache | Check `X-Cache: Hit from cloudfront` header | On 2nd request |
| Flyway applied | Check CloudWatch for `Successfully applied N migrations` | No errors |
| Image pipeline | Upload a test image via `/api/media/upload` | Returns `presignedUrl` + `objectKey` |

#### Rollback Plan

| Scenario | Rollback Action | Time |
|----------|----------------|------|
| Lambda crash (5xx) | `aws lambda update-function-code --function-name pmst-api-prod --s3-key <previous-jar>` | 2 min |
| Angular blank page | Re-upload previous `dist/` to S3 + CF invalidation | 3 min |
| Terraform destroy detected | `git revert` commit + re-run CI | 5 min |
| DNS issue | Switch A/AAAA back to `46.202.182.16` (Hostinger) | 5 min |
| Flyway migration failed | Fix migration SQL, redeploy Lambda (Flyway retries on next cold start) | 10 min |

> **Flyway rollback note:** Flyway Community Edition does not support automatic rollback. If a migration fails, fix the SQL and redeploy — Flyway will retry the failed version. Never manually delete rows from `flyway_schema_history` in prod.

#### Post-Deploy Monitoring (First 24h)

- [ ] CloudWatch Lambda error rate → should be 0%
- [ ] CloudWatch Lambda duration → p99 < 3000ms (cold start with SnapStart)
- [ ] RDS CPU < 30% under normal load
- [ ] No `SchemaManagementException` in Lambda logs
- [ ] S3 `uploads/raw/` objects being deleted (image pipeline working)
- [ ] CloudFront cache hit ratio > 80% after warm-up

#### After First Prod Deploy — Housekeeping

- [ ] Re-enable `spring.flyway.validate-on-migrate=true` in `application.properties`
- [ ] Confirm `flyway_schema_history` in prod RDS has all 6 rows (V2–V6 + baseline)
- [ ] Tag the release: `git tag v1.0.0 && git push --tags`
- [ ] Archive old local Docker `flyway_schema_history` note in this doc
