# Implementation Plan: Mortality Watch Enhancement

## Overview

This document outlines the implementation plan for addressing critical issues, refactoring, and adding new features including user management, feature flags, and subscription functionality.

---

## ⚠️ Critical Decisions Required Before Starting

**Answer these questions BEFORE beginning Phase 4:**

1. **Auth library:** Lucia vs @nuxt/auth vs custom implementation?
2. **Database migrations:** Kysely, Drizzle, or manual SQL scripts?
3. **Stripe pricing:** Confirm monthly amount and annual discount
4. **Email provider:** Resend free tier (100/day) or Nodemailer + Gmail?
5. **Refund policy:** 30-day refund window?

**See full list of open questions at the end of this document.**

---

## Git Workflow & Pull Request Process

### Branching Strategy

- **Main branch:** `master` (production-ready code)
- **Feature branches:** Create from `master` using descriptive names
  - Format: `phase-X/feature-name` or `fix/issue-description`
  - Examples: `phase-0/ui-fixes`, `phase-1/server-side-rendering`, `fix/baseline-selector-bug`

### Commit Guidelines

**Commit message format:**

```
type(scope): description

Optional longer description if needed

Fixes #issue-number (if applicable)
```

**Commit types:**

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `docs:` Documentation changes
- `chore:` Maintenance tasks (dependencies, config)
- `style:` Code style changes (formatting, no logic change)
- `perf:` Performance improvements

**Examples:**

```
fix(ui): correct jurisdiction dropdown icons for data availability

Replace generic icons with specific indicators:
- Age-stratified data: i-lucide-layers
- All-ages data: i-lucide-circle

Fixes UI-1
```

```
feat(auth): implement user registration with email verification

- Add registration API route
- Create registration page component
- Integrate email verification flow
- Add unit tests for registration logic
```

### Creating Pull Requests

**Before creating a PR:**

1. Ensure all commits are logically separated
2. Run type checking: `npm run typecheck`
3. Run linting: `npm run lint`
4. Run tests: `npm test` (when tests are implemented)
5. Test the feature manually in dev environment

**Push to GitHub:**

```bash
git push -u origin <branch-name>
```

**Open PR via GitHub CLI or web interface:**

```bash
gh pr create --title "Phase X: Feature Description" --body "<PR description>"
```

**PR description template:**

```markdown
## Summary

Brief description of what this PR does

## Changes

- Bullet list of changes
- One bullet per major change
- Link to related issues or UI items

## Phase

Phase X: [Phase Name]

## Testing

- [ ] Manual testing completed
- [ ] Type checking passed
- [ ] Linting passed
- [ ] Unit tests added/updated (when applicable)
- [ ] E2E tests added/updated (when applicable)

## Screenshots (if UI changes)

[Add screenshots or GIFs showing before/after]

## Related Issues

Closes #issue-number
Fixes UI-X, UI-Y
```

### Pull Request Workflow

1. **Create feature branch** from `master`
2. **Make logical, atomic commits** - each commit should be a complete, working change
3. **Push to GitHub** regularly to back up work
4. **Open PR** when feature is ready for review
5. **Request review** (self-review first, then peer review if team)
6. **Address feedback** with additional commits or amend if needed
7. **Squash and merge** (or merge commit) into `master` after approval
8. **Delete feature branch** after merge

### Commit Organization Best Practices

**Separate commits for:**

- Each distinct bug fix
- Each new feature component
- Database schema changes
- Configuration changes
- Dependency updates
- Documentation updates
- Test additions

**Example commit sequence for Phase 0:**

```
fix(ui): correct jurisdiction dropdown icons (UI-1)
fix(ui): show standard population selector for ASMR only (UI-2)
fix(ui): resolve baseline method selector bugs (UI-3)
fix(ui): fix chart card clipping and drag icon alignment (UI-4)
fix(ui): match color picker count to jurisdictions (UI-5)
fix(ui): correct page title format (UI-6)
fix(ui): resolve chart plugin flickering (UI-7)
fix(ui): add dark mode reactivity to chart plugins (UI-8)
fix(ui): optimize chart colors for dark mode (UI-9)
feat(ui): add number precision control dropdown (UI-10)
fix(ui): show only last year in subtitle (UI-11)
test: add tests for Phase 0 UI fixes
docs: update CHANGELOG for Phase 0 completion
```

### GitHub Integration

**Setting up remote:**

```bash
git remote add origin git@github.com:yourusername/mortality.watch.git
```

**Keeping branch updated:**

```bash
git fetch origin
git rebase origin/master  # or merge if preferred
```

**After PR is merged:**

```bash
git checkout master
git pull origin master
git branch -d <feature-branch>
```

---

## Phase 0: UI Fixes (Fix First)

### Overview

These UI issues should be addressed before starting Phase 1. They affect user experience and core functionality.

### UI Issues Checklist

- [ ] **UI-1: Jurisdiction Dropdown Icons** - Fix data availability icons (`MortalityChartControlsPrimary.vue`)
  - Age-stratified: `i-lucide-layers`, All-ages: `i-lucide-circle`

- [ ] **UI-2: Standard Population Selector** - Only show for ASMR metrics (`MortalityChartControlsSecondaryCustom.vue`)

- [ ] **UI-3: Baseline Method Selector** - Fix linear regression/ETS bugs (`MortalityChartControlsSecondaryCustom.vue`)
  - Linear regression selecting ETS instead
  - ETS not working properly

- [ ] **UI-4: Chart Card Clipping** - Fix content clipping and drag icon alignment (`explorer.vue`)

- [ ] **UI-5: Color Picker Count** - Match number of colors to selected jurisdictions (`MultiColorPicker.vue`)

- [ ] **UI-6: Page Title Format** - Fix incorrect format like "le - USA, SWE, DEU (midyear)" (`explorer.vue`)

- [ ] **UI-7: Chart Plugin Flickering** - Fix logo/QR code re-render flickering (`logoPlugin.ts`, `qrCodePlugin.ts`)

- [ ] **UI-8: Dark Mode Reactivity** - Chart plugins should update immediately on theme change

- [ ] **UI-9: Dark Mode Colors** - Optimize chart color palette for dark mode (`colors.ts`)

- [ ] **UI-10: Number Precision Control** - Add dropdown for digit precision with "Auto" option (`chartConfig.ts`)

- [ ] **UI-11: Last Value Subtitle** - Show only last year instead of date range (`components/charts/*`)

---

## Phase 1: Critical Fixes & Infrastructure (Week 1-2)

### 1.1 Server-Side Chart Rendering

**File:** `server/routes/chart.png.ts:25-56`

- [ ] Remove TODO stubs and implement complete PNG chart rendering
- [ ] Ensure proper Chart.js server-side rendering with canvas
- [ ] Verify logo and QR code plugins work in SSR context
- [ ] Test link sharing and OG image generation
- [ ] Add error handling and fallback mechanisms

### 1.2 Fix Last Value Subtitle Display

**Status:** Moved to Phase 0 (UI-11)
**File:** `app/components/charts/*`

This task has been moved to Phase 0: UI Fixes (UI-11) to be addressed with other UI issues first.

### 1.3 External API Resilience

**File:** `app/data.ts:304-361`

- [ ] Implement circuit breaker pattern for baseline service calls
- [ ] Add timeout configurations
- [ ] Implement user-visible notifications when fallback occurs
- [ ] Add retry logic with exponential backoff
- [ ] Log API failures for monitoring

### 1.4 Error Tracking & Rate Limiting

**Error tracking (use Sentry free tier):**

- [ ] Install @sentry/nuxt
- [ ] Configure Sentry DSN
- [ ] Add to nuxt.config.ts
- [ ] Test error reporting

**Rate limiting:**

- [ ] Install nuxt-rate-limit or similar
- [ ] Configure: 100 req/min anonymous, 1000 req/min authenticated
- [ ] Test with API routes

---

## Phase 2: Testing & Code Quality (Week 2-3)

### 2.1 Test Coverage - Core Data Layer

**File:** `app/data.ts` (580 lines)

- [ ] Unit tests for data fetching functions
- [ ] Unit tests for data transformation functions
- [ ] Unit tests for aggregation logic
- [ ] Mock SQLite database for tests
- [ ] Aim for >80% coverage

### 2.2 Test Coverage - Chart Logic

**File:** `app/chart.ts` (671 lines)

- [ ] Unit tests for chart configuration builders
- [ ] Unit tests for chart plugins (logo, QR, background)
- [ ] Integration tests for chart rendering
- [ ] Test color palette generation
- [ ] Aim for >80% coverage

### 2.3 End-to-End Data Pipeline Tests

**Use Playwright (works well with Nuxt):**

- [ ] Install @playwright/test
- [ ] Configure playwright.config.ts
- [ ] E2E test: SQLite → data.ts → chart.ts → rendering
- [ ] E2E test: User registration and auth flow
- [ ] E2E test: Subscription checkout (Stripe test mode)
- [ ] E2E test: User input → state updates → chart updates
- [ ] E2E test: URL state → chart restoration
- [ ] Test error scenarios and edge cases

### 2.4 Type Safety Improvements

**Files:** Various (utils.ts:93-108, others)

- [ ] Remove `as unknown as` casts - replace with proper type guards
- [ ] Add strict type definitions for array handling
- [ ] Enable stricter TypeScript compiler options
- [ ] Add Zod schemas where validation is needed
- [ ] Run full typecheck and fix all errors

---

## Phase 3: Refactoring & Performance (Week 3-4)

### 3.1 Split Monolithic Files

**Files:** `data.ts` (580L), `model.ts` (864L), `chart.ts` (671L)

**data.ts refactoring:**

- [ ] Split into `app/lib/data/` directory structure:
  - `queries.ts` - Database queries
  - `transformations.ts` - Data transformations
  - `aggregations.ts` - Aggregation logic
  - `baselines.ts` - Baseline calculations
  - `index.ts` - Public API

**model.ts refactoring:**

- [ ] Split into `app/model/` directory:
  - `types.ts` - Core type definitions
  - `baseline.ts` - Baseline-related types
  - `chart.ts` - Chart configuration types
  - `country.ts` - Country-related types
  - `index.ts` - Re-exports

**chart.ts refactoring:**

- [ ] Already partially done with plugins, continue:
  - `app/lib/chart/config.ts` - Chart configurations
  - `app/lib/chart/datasets.ts` - Dataset builders
  - `app/lib/chart/options.ts` - Chart options
  - `app/lib/chart/utils.ts` - Chart utilities

### 3.2 Performance Optimizations

**Unbounded parallel requests:**

- [ ] Add request batching/throttling to `app/data.ts:121`
- [ ] Implement p-limit or similar for controlled concurrency
- [ ] Add configurable batch size (e.g., 5 concurrent max)

**Chart re-rendering:**

- [ ] Add proper Vue reactivity controls
- [ ] Implement chart update vs rebuild logic
- [ ] Use Chart.js update() method for data changes
- [ ] Add debouncing for rapid state changes

**Pagination:**

- [ ] Identify large dataset queries
- [ ] Implement cursor-based pagination for rankings
- [ ] Add virtual scrolling for long lists
- [ ] Lazy load data on demand

---

## Phase 4: Database Schema & User Management (Week 4-5)

### 4.1 Database Schema Design

- [ ] Design schema for users table (id, email, password_hash, role, created_at, etc.)
- [ ] Design schema for saved_charts table (user_id, chart_config, name, created_at, is_featured)
- [ ] Design schema for subscriptions table (user_id, stripe_customer_id, status, plan, etc.)
- [ ] Design schema for feature_flags table (optional, or hardcode initially)
- [ ] Add migration system (consider using Kysely or Drizzle)
- [ ] Write migration scripts

### 4.2 Authentication System

**Setup:**

- [ ] Choose auth library (recommend: lucia-auth or @nuxt/auth)
- [ ] Install and configure auth module
- [ ] Set up session management (cookies vs JWT)
- [ ] Configure secure password hashing (bcrypt/argon2)

**Pages to create:**

- [ ] `/auth/register` - Registration page
- [ ] `/auth/signin` - Sign in page
- [ ] `/auth/forgot-password` - Password reset request
- [ ] `/auth/reset-password/[token]` - Password reset form
- [ ] `/profile` - User profile page
- [ ] `/admin` - Admin dashboard (basic)

**Backend:**

- [ ] API route: `POST /api/auth/register`
- [ ] API route: `POST /api/auth/signin`
- [ ] API route: `POST /api/auth/signout`
- [ ] API route: `POST /api/auth/forgot-password`
- [ ] API route: `POST /api/auth/reset-password`
- [ ] API route: `GET /api/auth/session`
- [ ] API route: `PATCH /api/user/profile`

**Middleware:**

- [ ] Auth middleware for protected routes
- [ ] Admin-only middleware
- [ ] Paid user middleware (for premium features)

**Setup admin user:**

- [ ] Create admin user seeding script
- [ ] Environment variable for admin credentials
- [ ] Script to create/reset admin password

### 4.3 Email Service (Keep it Simple)

**Setup (use Nodemailer + Gmail for now, can upgrade later):**

- [ ] Install nodemailer
- [ ] Configure Gmail app password or use Resend free tier (100 emails/day)
- [ ] Create basic email templates (plain text is fine initially)

**Required emails only:**

- [ ] Password reset email
- [ ] Email verification (optional for MVP)
- [ ] Payment receipt (Stripe can handle this initially)

---

## Phase 4.5: Legal Documents (Week 5)

### Legal pages (can use templates)

- [ ] Create `/legal/terms` - Terms of Service (use template from Termly/TermsFeed)
- [ ] Create `/legal/privacy` - Privacy Policy (use template)
- [ ] Create `/legal/refund` - Refund Policy (suggest 30-day)
- [ ] Add TOS checkbox to registration form
- [ ] Add links to footer

### GDPR basics

- [ ] API route: `GET /api/user/export-data` - Export user data as JSON
- [ ] API route: `DELETE /api/user/account` - Delete account + saved charts
- [ ] Add "Delete Account" button to profile page

---

## Phase 5: Feature Flags & Access Control (Week 5-6)

### 5.1 Feature Flag System

**Define three tiers:**

**Free/Standard (Tier 0):**

- Core chart visualization
- Basic country selection
- Standard time periods
- Conservative baseline methods (5-year mean)
- Watermark/logo visible
- QR code visible

**Registered/Power User (Tier 1):**

- All Free features
- Save charts to "My Charts"
- Extended time period options
- Multiple baseline methods
- Custom color schemes
- Ranking page access with save functionality
- Export chart data (CSV)

**Paid/Premium (Tier 2):**

- All Registered features
- Hide logo/watermark
- Hide QR code
- Single age group LE calculations
- Age Standardized Deaths (Levitt method)
- Z-score calculations
- Priority support
- API access (future)

**Implementation:**

- [ ] Create `app/lib/featureFlags.ts` with tier definitions
- [ ] Create composable `useFeatureAccess()` to check access
- [ ] Create component `FeatureGate.vue` to wrap premium features
- [ ] Add UI indicators for premium features (lock icon, upgrade prompts)
- [ ] Update all relevant components with feature gates
- [ ] Add "Upgrade" CTAs in appropriate places

**Files to update:**

- [ ] `app/components/charts/MortalityChartOptions.vue` - Gate premium chart options
- [ ] `app/components/ranking/RankingSettings.vue` - Gate premium ranking features
- [ ] `app/lib/chart/logoPlugin.ts` - Conditional rendering based on tier
- [ ] `app/lib/chart/qrCodePlugin.ts` - Conditional rendering based on tier

### 5.2 Improve Suggestions

- [ ] Clarify what "suggestions" means (chart recommendations? baseline method suggestions?)
- [ ] Implement based on clarification

---

## Phase 6: Stripe Integration (Week 6-7)

### 6.1 Stripe Setup

**Configuration:**

- [ ] Create Stripe account
- [ ] Install `@stripe/stripe-js` and `stripe` packages
- [ ] Set up Stripe API keys (test and production)
- [ ] Configure webhook endpoint URL
- [ ] Set up Stripe products and pricing

**Recommended pricing:**

- Monthly subscription: $9.99/month
- Annual subscription: $99/year (2 months free)
- Optional: One-time payment for lifetime access

**Backend API routes:**

- [ ] `POST /api/stripe/create-checkout-session` - Initialize checkout
- [ ] `POST /api/stripe/create-portal-session` - Customer portal access
- [ ] `POST /api/stripe/webhook` - Handle Stripe webhooks
- [ ] `GET /api/stripe/subscription-status` - Check user subscription

**Webhook handlers:**

- [ ] `checkout.session.completed` - Create/activate subscription
- [ ] `customer.subscription.updated` - Update subscription status
- [ ] `customer.subscription.deleted` - Cancel subscription
- [ ] `invoice.payment_succeeded` - Confirm payment
- [ ] `invoice.payment_failed` - Handle failed payments

### 6.2 Subscription Pages

- [ ] `/pricing` - Pricing page with tier comparison
- [ ] `/subscribe` - Subscription checkout flow
- [ ] `/subscription/success` - Post-purchase confirmation
- [ ] `/subscription/manage` - Subscription management (uses Stripe portal)
- [ ] Update `/profile` to show subscription status

**UI Components:**

- [ ] `PricingCard.vue` - Tier comparison cards
- [ ] `SubscriptionStatus.vue` - Show current plan
- [ ] `UpgradePrompt.vue` - Reusable upgrade CTA

---

## Phase 7: Saved Charts & My Charts Page (Week 7-8)

### 7.1 Save Chart Functionality

**Backend:**

- [ ] API route: `POST /api/charts/save` - Save chart configuration
- [ ] API route: `GET /api/charts` - List user's saved charts
- [ ] API route: `GET /api/charts/:id` - Get specific chart
- [ ] API route: `PATCH /api/charts/:id` - Update chart
- [ ] API route: `DELETE /api/charts/:id` - Delete chart
- [ ] API route: `PATCH /api/charts/:id/feature` - Admin: mark as featured

**Chart state serialization:**

- [ ] Ensure all chart state is serializable (already done in `stateSerializer.ts`)
- [ ] Add metadata: chart name, description, tags
- [ ] Store both explorer and ranking configurations

**Components:**

- [ ] Add "Save Chart" button to explorer page
- [ ] Add "Save Ranking" button to ranking page
- [ ] Modal for naming and saving charts
- [ ] Confirmation toast on save

### 7.2 My Charts Page

- [ ] Create `/my-charts` page
- [ ] Grid/list view of saved charts
- [ ] Thumbnail preview of each chart (using server render)
- [ ] Actions: View, Edit, Delete, Share
- [ ] Filter/search saved charts
- [ ] Sort by date, name, type
- [ ] Pagination for many saved charts

**Admin features:**

- [ ] Checkbox to mark charts as "featured"
- [ ] Featured charts appear on homepage
- [ ] Admin-only "Featured Charts" management page

---

## Phase 8: Homepage Showcase Improvements (Week 8)

### 8.1 Direct Server Rendering

**Current:** Homepage loads static images
**New:** Homepage calls server render endpoint directly

- [ ] Update `/` page to use server-rendered charts
- [ ] Fetch featured charts from database (or use defaults if none)
- [ ] Call `chart.png` endpoint with chart configurations
- [ ] Cache rendered images (consider Redis or filesystem cache)
- [ ] Fallback to static images if render fails

**Admin configuration:**

- [ ] Admin page to select featured charts from "My Charts"
- [ ] Drag-and-drop ordering of featured charts
- [ ] Preview before publishing
- [ ] Set max number of featured charts (e.g., 3-6)

---

## Phase 9: Advanced Features (Week 9-11)

### 9.1 Improved Life Expectancy Calculations

**Tier:** Paid/Premium only

**Current:** Period LE calculation (5-year age groups)
**New:** Single-year age group LE calculation

- [ ] Research precise LE calculation methodology (Chiang method, etc.)
- [ ] Implement single-age LE calculation in `app/lib/calculations/lifeExpectancy.ts`
- [ ] Add UI option to select age group granularity
- [ ] Gate behind premium feature flag
- [ ] Add documentation/tooltip explaining difference
- [ ] Test against known LE values for validation

### 9.2 Age Standardized Deaths (Levitt Method)

**Tier:** Paid/Premium only

**Current:** Basic mortality metrics
**New:** Age-standardized death rates using Levitt method

- [ ] Research Levitt method for age standardization
- [ ] Implement calculation in `app/lib/calculations/ageStandardized.ts`
- [ ] Source/define standard population (WHO, European, etc.)
- [ ] Add UI toggle for age-standardized view
- [ ] Gate behind premium feature flag
- [ ] Add documentation explaining standardization
- [ ] Test with known datasets

### 9.3 Z-Score Calculations

**Tier:** Paid/Premium only

**Current:** Absolute and percentage excess metrics
**New:** Z-score for statistical significance

- [ ] Implement z-score calculation in `app/lib/calculations/zScore.ts`
- [ ] Calculate mean and standard deviation from baseline
- [ ] Add z-score as metric option
- [ ] Add visualization (highlight statistically significant periods)
- [ ] Gate behind premium feature flag
- [ ] Add documentation explaining z-scores
- [ ] Add confidence interval options (95%, 99%)

---

## Phase 9.5: Deployment (Week 11)

### Dokku Setup

**Staging environment:**

- [ ] Create staging.mortality.watch Dokku app
- [ ] Configure environment variables for staging
- [ ] Set up Stripe test mode keys for staging
- [ ] Test deployment to staging

**Production environment:**

- [ ] Verify production Dokku configuration
- [ ] Configure production environment variables
- [ ] Set up Stripe production keys
- [ ] Document deployment process

### Database Backups

- [ ] Configure automated SQLite backups (daily cron or Dokku plugin)
- [ ] Store backups off-server (S3, Dropbox, etc.)
- [ ] Test restore procedure once
- [ ] Document backup/restore in README

---

## Phase 10: Testing & Polish (Week 11-12)

### 10.1 Integration Testing

- [ ] Test complete user flows: registration → subscribe → save charts
- [ ] Test feature flag enforcement
- [ ] Test Stripe webhook processing
- [ ] Test admin functionality
- [ ] Test server-side rendering in production environment

### 10.2 Security Audit

- [ ] Audit authentication implementation
- [ ] Check for SQL injection vulnerabilities
- [ ] Validate input sanitization
- [ ] Test rate limiting on API routes
- [ ] Verify proper session management
- [ ] Test authorization checks (no privilege escalation)

### 10.3 Performance Testing

- [ ] Load testing for concurrent users
- [ ] Chart rendering performance with many saved charts
- [ ] Database query optimization
- [ ] API response time benchmarking
- [ ] Stripe webhook reliability testing

### 10.4 Documentation

- [ ] Update README with new features
- [ ] Document feature flag system
- [ ] Document subscription tiers
- [ ] Create admin user guide
- [ ] Create user guide for premium features
- [ ] Document Stripe setup for deployment
- [ ] API documentation for future expansion

### 10.5 Pre-Launch Checklist

- [ ] Test password reset email works
- [ ] Verify Stripe webhooks work in production
- [ ] Test subscription flow end-to-end in staging
- [ ] Confirm database backups running
- [ ] Test mobile responsiveness
- [ ] Verify all legal pages linked in footer
- [ ] Check Sentry is receiving errors
- [ ] Lighthouse score >85

---

## Open Questions / Decisions Needed

1. **Auth library:** Lucia vs @nuxt/auth vs custom implementation?
2. **Database migrations:** Kysely, Drizzle, or manual SQL scripts?
3. **Stripe pricing:** Confirm monthly amount and annual discount
4. **Feature suggestions:** What does "improve suggestions" mean specifically?
5. **Cache strategy:** Redis for server-rendered charts, or filesystem cache?
6. **Testing framework preference:** Current setup uses Vitest - continue with it?
7. **Admin panel:** Build custom or use existing admin framework?
8. **Email:** Use Resend free tier (100/day) or Nodemailer + Gmail?
9. **Refund policy:** 30-day refund window?
10. **E2E tests:** Run in CI or just locally?

---

## Next Steps

1. Review and approve this plan
2. Clarify open questions
3. Set up project tracking (GitHub Projects, Linear, etc.)
4. **Begin Phase 0: UI Fixes (Priority - complete all 11 UI issues first)**
5. Begin Phase 1: Critical Fixes & Infrastructure
