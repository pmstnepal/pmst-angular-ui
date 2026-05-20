---
description: PMST US-Nepal development standards for Angular frontend and Java Lambda backend
---

# PMST Development Rules

Strict development standards optimized for solo developer workflow with branch protection, code optimization, and triple documentation sync.

---

## 1. Branch & Workflow Rules

### Branch Protection (Solo Developer)
- **NEVER push directly to `main`/`master`** — always use the repo's single active feature branch
- **One feature branch per repo policy** (solo dev mode):
  - Each repo has exactly **ONE active feature branch** that all work goes into
  - **Do NOT create new feature branches per feature/fix** — reuse the existing one
  - Only create a new branch if the existing feature branch is being merged to `main` or if explicitly requested
  - Multiple commits with different scopes (`feat:`, `fix:`, `style:`) on the same branch is expected and OK
- **Active feature branches by repo**:
  | Repo | Active Branch |
  |------|---------------|
  | `pmst-angular-ui` | `feature/angular-ui-setup` |
  | `pmst-api-service` | `feature/initial-setup` |
  | `pmst-data-migration` | `feature/migration-scripts` |
  | `pmst-terraform-infra` | TBD on first work |
- **Workflow per commit**:
  1. Confirm current branch matches the repo's active feature branch (`git branch --show-current`)
  2. If not, `git checkout <active-branch>`
  3. Commit with conventional commit message
  4. `git push` (no branch arg — pushes to tracked upstream)
- **If accidentally on `main`/`master`**: 
  - `git stash` → `git checkout <active-feature-branch>` → `git stash pop` → commit & push
- **Branch naming reference** (for future repos / large refactors only):
  - `feature/{description}` — new features
  - `fix/{description}` — bug fixes
  - `hotfix/{description}` — urgent production fixes
  - `refactor/{description}` — code restructuring
- **Merge to main**: Only via PR with review (or self-merge after manual verification)

### CI/CD Triggers
Pipeline runs on:
- **Pull requests** targeting `main` — runs tests, lint, build
- **Push to `main`** — runs full deploy after merge

**GitHub Actions config**:
```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

---

## 2. Code Optimization Rules

### DRY Principle (Don't Repeat Yourself)
- **Extract duplicates immediately** — if you write the same logic twice, create a shared utility
- **Shared locations**:
  - Angular: `src/app/core/services/` or `src/app/shared/utils/`
  - Java: `com.pmst.api.util` package
- **Generic functions preferred** — one function with parameters vs. multiple similar functions

### Function Creation Criteria
Create a new function/method ONLY when:
1. **Required functionality doesn't exist** — verified by searching existing code
2. **Future scope aligns with project goals** — defined in `@/pmst-development-workflow`
3. **No existing method can be extended** — refactoring existing code is preferred
4. **Function will be reused** — single-use logic stays inline unless complex

### API Call Optimization
- **Deduplicate requests**: Use RxJS `shareReplay(1)` for Angular services
- **Cache appropriately**: Cache GET requests with TTL; never cache mutations
- **Batch when possible**: Combine multiple related API calls into single endpoint
- **Debounce rapid calls**: Use `debounceTime(300)` on search inputs
- **Cancel stale requests**: Use RxJS `takeUntil` or signals for cancellation

### Dead Code Elimination
- Remove unused imports before commit
- Delete commented-out code (use git history if needed)
- Remove unused variables, functions, and components
- Use `npm run lint` / `mvn compile` to detect dead code

---

## 3. Code Quality Standards

### Angular Frontend
- **Standalone components only** — no NgModules except `AppModule`
- **Change detection**: Use `ChangeDetectionStrategy.OnPush` for presentational components
- **State management**: Prefer Angular Signals over RxJS; use RxJS only for HTTP streams
- **Component size**: Max 300 lines, max 50 lines per method
- **File naming**: `feature-type.descriptor.ts` (e.g., `showcase-detail.component.ts`)
- **Class naming**: `PascalCase` + suffix (e.g., `ShowcaseDetailComponent`)

### Java Backend
- **Package structure**: `com.pmst.api.{controller,service,repository,model,config}`
- **Constructor injection** — required for Lambda cold start optimization
- **DTO pattern** — separate request/response DTOs from entities
- **Null safety**: Use `Optional<T>` instead of null checks
- **Method naming**: `camelCase` descriptive verbs (e.g., `getArticleById()`)

### Cross-Repository Naming
| Item | Format | Example |
|------|--------|---------|
| Database tables | `snake_case` plural | `articles`, `user_profiles` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `COGNITO_USER_POOL_ID` |
| Git branches | `type/description` | `feature/user-auth` |
| Commits | Conventional commits | `feat: add user login` |

----

## 4. Performance & User Experience Standards

### Fast Loading — Non-Negotiable
- **Initial page load must be < 5 seconds** in development, < 3 seconds production
- **No blocking operations on app startup** — use lazy loading for heavy resources
- **Loading states required** — show skeleton/placeholder while data fetches
- **Never leave user staring at blank screen** — always provide visual feedback

### Smooth UX — Always Consider
- **Perceived performance > actual performance** — show progress immediately
- **HTTP requests must have timeouts** — default 30s max, show error if exceeded
- **Images must lazy load** — use `loading="lazy"` or Angular defer blocks
- **Route transitions should be instant** — prefetch data when possible
- **No full-page reloads for navigation** — use Angular Router
- **Error states must be graceful** — never crash, always show friendly message

### Anti-Patterns (Strictly Forbidden)
| Pattern | Problem | Solution |
|---------|---------|----------|
| `APP_INITIALIZER` with blocking HTTP calls | Delays app render by seconds | Load lazily on first use |
| SSR without hydration guards | Double render, flash of unstyled content | Disable SSR for dev, test hydration |
| No loading indicators | User thinks app is broken | Add skeleton screens |
| Synchronous file reads in constructor | Blocks entire app | Async loading with fallback |
| API calls without timeout | Can hang indefinitely | Always set timeout + error handling |

----

## 5. Testing Requirements

> **Development Phase Rule**: Tests are **NOT required during active development**. Write and iterate freely. Tests are written and must pass **before commit/push** only.

### Angular Testing
- **Unit tests**: Karma + Jasmine (min 70% coverage)
  - Test components, services, and utilities
  - Mock HTTP calls with `HttpTestingController`
- **E2E tests**: Playwright for critical user paths
  - Login flow, content submission, navigation
  - Run before major releases

### Java Testing
- **Unit tests**: JUnit 5 + Mockito (min 70% coverage)
  - Mock repositories and external services
  - Test business logic in service layer
- **Integration tests**: TestContainers with PostgreSQL
  - Test repository queries
  - Test API endpoints with full Spring context

### When Tests Are Required
| Phase | Test Required? |
|-------|----------------|
| Active development / iteration | ❌ Not required — focus on building |
| Before `git commit` | ✅ Write tests and verify they pass |
| Before `git push` | ✅ All tests must pass |
| PR to `main` | ✅ CI enforces 70%+ coverage |

### Coverage Gates
- PRs cannot merge if coverage drops below 70%
- New code must have corresponding tests committed alongside it
- CI runs `npm run test:ci` / `mvn test` before allowing merge

---

## 5. Documentation Synchronization (Triple Sync)

**Purpose**: Maintain consistency across three documentation layers:
1. `.windsurf/rules.md` — AI coding context (this file)
2. `@/pmst-development-workflow` — Developer reference guide
3. `src/doc/pmst-master-plan.html` — Visual status dashboard

### Sync Requirements

| When You Add/Change | Update These Files |
|--------------------|-------------------|
| New coding standard | `rules.md` + `pmst-development-workflow.md` |
| New architecture pattern | **All 3**: rules + workflow + HTML dashboard |
| Component/feature status change | `pmst-master-plan.html` status board |
| New repo/branch rule | `rules.md` + workflow "Part 7: CI/CD" |
| Testing requirement | `rules.md` + workflow "Testing" section |
| API endpoint changes | Workflow "Part 5: Backend" + API docs |

### Documentation Responsibilities

**For Windsurf AI (rules.md)**:
- Include code examples for rules
- Specify file paths and naming conventions
- Define optimization criteria with thresholds

**For Developer Reference (workflow.md)**:
- Include step-by-step instructions
- Add troubleshooting sections
- Reference external resources (AWS docs, Angular guides)

**For Visual Dashboard (pmst-master-plan.html)**:
- Update component status board (🟢/🟡/🔴)
- Add rules compliance tracking section
- Include CI/CD status indicators

### Mandatory Updates
When implementing **new logic not in existing workflow**:
1. Add to `@/pmst-development-workflow` immediately
2. Update status in `pmst-master-plan.html` if component-related
3. Reference the workflow section in your PR description

---

## 6. CI/CD Rules

### Pipeline Requirements
- **Run on**: PR to `main` AND push to `main`
- **Required checks**:
  - Lint passes (`npm run lint`, Checkstyle for Java)
  - Unit tests pass (70%+ coverage)
  - Build succeeds (`npm run build:prod`, `mvn package`)
  - Terraform plan (for infra repos)

### Deployment Flow
1. Feature branch → PR to `main`
2. CI runs checks on PR
3. Merge PR (solo developer merges own PRs)
4. CI runs deploy on `main` push
5. Post-deploy smoke test on `/health` endpoint

### Terraform Specific
- `terraform plan` output must be reviewed on PR
- `terraform apply` only runs on `main` branch
- State locking via DynamoDB (configured in `backend.tf`)

---

## 7. Security Rules

### Secrets Management
- **No secrets in code** — use environment variables / AWS SSM Parameter Store
- **Standard pattern**: Spring `${ENV_VAR:}` placeholder in committed properties file
- **Local development**: 
  - Backend: `application-local.properties` (gitignored, in `src/main/resources/`)
  - Activated via `mvn spring-boot:run -Dspring-boot.run.profiles=local`
- **Production**: AWS SSM Parameter Store (SecureString) → Lambda env var, managed by Terraform
- **NEVER commit**: API keys, passwords, tokens, even temporarily — they live in git history forever
- **Key rotation**: Update `terraform.tfvars` → `terraform apply` → revoke old key
- **See**: `pmst-development-workflow` Part 6.5 for full pattern

### API Security
- **JWT validation** — Lambda authorizer validates Cognito tokens before business logic
- **SQL injection prevention** — Use JPA/Hibernate parameter binding only
- **XSS prevention** — Angular sanitizes by default; never use `innerHTML` with user content
- **CORS** — Whitelist-specific origins only, never `*`

---

## 8. Performance Rules

### Lambda Optimization
- **Cold start**: Use SnapStart; keep handler classes lightweight
- **Memory**: Start with 256MB, monitor and adjust
- **Dependencies**: Minimize JAR size, exclude unused libraries

### Frontend Optimization
- **Images**: WebP format, lazy loading, CloudFront caching
- **Bundle**: Monitor via `ng build --stats-json`, lazy load heavy modules
- **Change detection**: `OnPush` for presentational components

### Database
- **N+1 prevention**: Use JOINs or `@BatchSize` for collections
- **Indexing**: Add indexes for frequently queried columns
- **Connection pooling**: RDS Proxy for Lambda connections

---

## Quick Reference: Rule Violations

| Violation | Action Required |
|-----------|-----------------|
| Direct push to `main` | Revert, create feature branch, merge via PR |
| Duplicate code detected | Extract to shared utility before PR merge |
| Same API call >2x without caching | Add `shareReplay()` or implement cache |
| New function without justification | Document in PR why existing methods don't work |
| Missing documentation update | Update workflow + HTML before merge |
| Coverage <70% | Add tests before commit/push — not during development |
| Secrets in code | Immediate rotation + use env vars |

---

*Last updated: Rules apply to pmst-angular-ui and pmst-api-service repositories*
