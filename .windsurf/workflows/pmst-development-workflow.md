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
- **Database:** PostgreSQL + Redis
- **Infrastructure:** AWS (Lambda, API Gateway, Cognito, S3, CloudFront)
- **IaC:** Terraform (modular, multi-environment)
- **CI/CD:** GitHub Actions

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
| Infrastructure | Terraform IaC | ✅ Decided |
| CI/CD | GitHub Actions → AWS | ✅ Decided |

---

## GitHub Repositories (pmstnepal org)

| Repo | Purpose | Status |
|------|---------|--------|
| **pmst-angular-ui** | Angular frontend (this project) | 🟢 Active |
| **pmst-terraform-infra** | AWS infrastructure as code (Terraform) | 🟢 Active |
| **pmst-data-migration** | WordPress → PostgreSQL migration scripts | 🟢 Active — `feature/migration-scripts` |
| **pmst-api-service** | Java 21 Lambda — Articles, Galleries, Users, Follows, Comments (consolidated) | 🟢 Active — `feature/initial-setup` |
| **pmst-ticketing-service** | Java 21 Lambda — Event ticketing (separate service) | 🔵 Planned |
| **pmstusnepal-plugins** | WordPress plugins (38 plugins) | 🟢 Reference |
| **nepalicommunityhub-plugins** | Secondary site plugins | 🟢 Reference |
| **jwt-token-api** | Spring Boot JWT (retire) | ⚠️ Archive |
| **pmstnepalphp** | PHP codebase | Archive |

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

## Part 4: UI Component Architecture

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
| pmst-author-profile-card | AuthorProfileCardComponent | ⏳ In Progress |
| pmst-post-carousel | PostCarouselComponent | ✅ Created |
| pmst-social-embed-allow | Built into NewsDetailComponent | ✅ Built |
| pmst-custom-single-post-template | NewsDetailComponent (WP replica) | ✅ Built |
| mage-eventpress | EventsListComponent | ✅ Created |
| wpDiscuz | CommentSectionComponent | ✅ Created |
| contributor-dashboard-v3 | DashboardComponent | ✅ Created |
| N/A | SubmitContentComponent | ✅ Created |
| N/A | SubmitGalleryComponent | ✅ Created |
| N/A | AdminDashboardComponent | ✅ Created |
| N/A | SpotlightComponent | ✅ Created |

---

## Part 5: Backend Microservices (Java 21)

### Local Development Setup

| Service | Repo | Local Path | Port | Branch |
|---|---|---|---|---|
| pmst-api-service | `pmst-api-service` | `D:\pmst-services\pmst-api-service\` | 8080 | `feature/initial-setup` |
| pmst-ticketing-service | `pmst-ticketing-service` | `D:\pmst-services\pmst-ticketing-service\` | 8081 | `feature/initial-setup` |

**Run locally (no AWS needed):**
```bash
# 1. Start local PostgreSQL
docker compose up -d

# 2. Run Spring Boot
mvn spring-boot:run

# 3. Run tests
mvn test

# 4. Build Lambda JAR (for AWS deploy later)
mvn package -DskipTests
```

**Local PostgreSQL:**
- pmst-api-service → `localhost:5432`
- pmst-ticketing-service → `localhost:5433`

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
│   ├── cognito/                # User pools (or extend jwt-token-api)
│   ├── s3/                     # Media storage + frontend hosting
│   ├── cloudfront/             # CDN distribution
│   ├── lambda/                 # Java function deployments
│   └── api-gateway/            # REST API configuration
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
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

## Part 7: CI/CD Pipeline (GitHub Actions)

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

### Branching Strategy (Solo Phase)

| Branch | Purpose |
|--------|--------|
| `main` | Active — push here → auto-deploys to prod |
| feature branches | Optional short-lived branches merged to `main` |
| `develop` / `staging` | Not used — reactivate when team grows |

### Active Workflows

**`deploy-prod-on-push.yml`** (pmst-terraform-infra) — triggers on push to `main`:
```yaml
name: Deploy Production (Auto)
on:
  push:
    branches: [main]
jobs:
  terraform-prod:
    environment: prod
    defaults:
      run:
        working-directory: environments/prod
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "1.6.x" }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: terraform init
      - run: terraform plan -var="db_password=${{ secrets.DB_PASSWORD }}" -var="acm_certificate_arn=${{ secrets.ACM_CERTIFICATE_ARN }}" -out=tfplan
      - run: terraform apply -auto-approve tfplan
```

**`deploy-frontend-prod.yml`** (pmst-angular-ui) — triggers on push to `main`:
```yaml
name: Deploy Frontend (prod)
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    environment: prod
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18, cache: npm }
      - run: npm ci
      - run: npm run build:prod
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 sync dist/pmst-angular-ui/browser/ s3://${{ vars.FRONTEND_BUCKET }} --delete
      - run: aws cloudfront create-invalidation --distribution-id ${{ vars.CF_DISTRIBUTION_ID }} --paths "/*"
```

### Dormant Workflows (Future Scope)

| File | Status | Reactivate when... |
|------|--------|--------------------|
| `deploy-dev.yml` | Dormant | Team grows / need isolated dev environment |
| `deploy-staging.yml` | Dormant | Pre-production testing needed before go-live |

### Secrets Required (GitHub → Settings → Secrets)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_PASSWORD`
- `ACM_CERTIFICATE_ARN` (SSL cert in us-east-1 for CloudFront)

### Variables Required (GitHub → Settings → Variables)
- `FRONTEND_BUCKET` — prod S3 bucket name (e.g. `pmst-prod-frontend`)
- `CF_DISTRIBUTION_ID` — CloudFront distribution ID

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
```

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

## Part 10: Local Run → Design → Test → Deploy Gate

> **Rule:** Nothing goes to AWS until the full experience works perfectly on localhost. Run locally, experience it as a real user, fix issues, then deploy.

### Step 1 — Start Local Stack

**Backend (`pmst-api-service`):**
```bash
cd D:\pmst-services\pmst-api-service

# Start PostgreSQL
docker compose up -d

# Verify DB is healthy
docker ps   # should show pmst-api-db as healthy

# Run Spring Boot
mvn spring-boot:run   # → http://localhost:8080
```

**Frontend (`pmst-angular-ui`):**
```bash
cd D:\pmstmigrate
npm start             # → http://localhost:4200
```

**API health check (open in browser or curl):**
```
GET http://localhost:8080/articles
GET http://localhost:8080/galleries
GET http://localhost:8080/articles?category=spotlight
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
