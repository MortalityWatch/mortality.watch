# Implementation Plan Archive

This document contains all completed phases and sections from the Implementation Plan. These tasks have been finished and are kept here for historical reference.

**Last Updated:** 2025-10-30

---

## Table of Contents

- [Resolved Critical Decisions](#resolved-critical-decisions)
- [Phase 1: CI/CD Setup](#phase-1-cicd-setup)
- [Phase 2: UI Fixes & Cleanup](#phase-2-ui-fixes--cleanup)
- [Phase 3: Critical Fixes & Infrastructure](#phase-3-critical-fixes--infrastructure)
- [Phase 4: Testing & Code Quality](#phase-4-testing--code-quality)
- [Phase 5: Refactoring & Performance](#phase-5-refactoring--performance)
- [Phase 6: Database Schema & User Management (Partial)](#phase-6-database-schema--user-management-partial)
- [Phase 7: Feature Flags & Access Control](#phase-7-feature-flags--access-control)
- [Phase 8: Stripe Integration](#phase-8-stripe-integration)
- [Phase 8.5.1: Component Refactoring (Phase 1)](#phase-851-module-integration)
- [Phase 9: Saved Charts & My Charts Page](#phase-9-saved-charts--my-charts-page)
- [Phase 10: Homepage Showcase Improvements](#phase-10-homepage-showcase-improvements)

---

## Resolved Critical Decisions

**Status:** ✅ Complete

**Tier Structure:**

The application uses a **3-tier access model**:

- **Tier 0 (Public/Free):** Anonymous users with basic features
- **Tier 1 (Registered/Power User):** Free registration unlocks extended features (save charts, custom colors, export data)
- **Tier 2 (Pro/Paid):** $9.99/month subscription for advanced features (no watermarks, advanced calculations, z-scores)

**Finalized Decisions:**

1. **Auth library:** Custom JWT authentication with jsonwebtoken and bcryptjs (✅ implemented)
2. **Database migrations:** Drizzle ORM
3. **Stripe pricing:** $9.99/month and $99/year (saves ~$20, approx 2 months free)
4. **Email provider:** Resend free tier (100 emails/day, 3,000/month)
5. **Refund policy:** 30-day refund window
6. **Cache strategy:** Filesystem + HTTP headers + CDN caching (7-day TTL for chart PNGs)
7. **Testing framework:** Continue with Vitest (466 tests passing)
8. **Admin panel:** Build custom admin panel using Nuxt UI components
9. **E2E tests:** Comprehensive Playwright coverage (~20+ critical flows)
10. **CI/CD:** GitHub Actions for automated testing and quality checks
11. **Test writing strategy:** Write tests after each feature works (not TDD, not end-of-phase batching)
12. **Email verification:** Required (users must verify email before login) (✅ implemented)
13. **Password hashing:** bcryptjs with 12 rounds (✅ implemented)
14. **Session management:** Cookie-based with "Remember me" option - 7 days default, 90 days with remember (✅ implemented)
15. **Admin user:** Created via `npm run db:seed` script (✅ implemented)
16. **Analytics platform:** Self-hosted Umami on Dokku (privacy-friendly, cookieless)
17. **Error tracking:** Reuse existing Bugsink instance at sentry.mortality.watch
18. **Uptime monitoring:** UptimeRobot free tier (50 monitors, 5-min checks)
19. **Database backups:** Dokku persistent storage with host-level backups
20. **Deployment migrations:** Run in pre-deploy.sh hook (before code deployment)
21. **Homepage charts:** Dynamic rendering via /chart.png?state=... (not build-time)
22. **Featured charts config:** Stored in database (admin can update without deploy)
23. **Data validation failures:** Use cached data if available, else show error + alert admin
24. **Stripe testing:** Basic smoke test (1-2 transactions) before production
25. **Webhook signature failures:** Return 400 + trigger alert immediately
26. **Feature gate UI:** Lock icon that forwards to signup/upgrade page
27. **Anonymous users:** Treated as Tier 0 (no database records)
28. **Launch criteria:** Through Phase 10 (homepage + featured charts + payment flow working)

---

## Phase 1: CI/CD Setup

**Status:** ✅ Complete

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Completed:**

- ✅ Full CI pipeline with lint, typecheck, tests, and build verification
- ✅ Separate E2E test job with Playwright
- ✅ Node.js caching for faster builds
- ✅ ESLint caching for incremental checks
- ✅ Nuxt build caching
- ✅ Playwright browser caching
- ✅ Database migration setup for E2E tests
- ✅ Artifact upload for Playwright reports (30-day retention)

**Jobs:**

1. **CI Job:**
   - Checkout code
   - Install Node.js 22
   - Cache node_modules, ESLint, and Nuxt build
   - Run all checks (lint + typecheck + test)
   - Build verification

2. **E2E Job:**
   - Runs after CI job completes
   - Install Playwright browsers (with caching)
   - Setup database for E2E tests
   - Build application
   - Run E2E tests with Chromium
   - Upload Playwright report on failure

**Configuration:**

- Matrix strategy: Ubuntu latest, Node.js 22
- Timeouts: 10 minutes for checks, 5 minutes for build, 15 minutes for E2E
- Artifact retention: 30 days for Playwright reports

---

## Phase 2: UI Fixes & Cleanup

**Status:** ✅ Complete

### 2.1 Code Cleanup

- ✅ **Remove unused secondary control components:**
  - Deleted `MortalityChartControlsSecondary.vue` (387 lines)
  - Deleted `MortalityChartControlsSecondarySimple.vue` (411 lines)
  - Deleted `MortalityChartControlsSecondaryNew.vue` (405 lines)
  - Kept only `MortalityChartControlsSecondaryCustom.vue` (currently in use)
  - Tests verified: `npm run check` passed

- ✅ **Remove test pages:**
  - Deleted `/pages/test-ranking.vue`
  - Deleted `/pages/test-data.vue`
  - Deleted `/pages/test-fetch.vue`
  - Build verified: `npm run build` succeeded

- ✅ **Document data scripts:**
  - Added README section for `npm run download-data`
  - Documented `.data` directory structure
  - Added data refresh/update strategy docs

### 2.2 UI Issues Checklist (11/11 Complete)

- ✅ **UI-1: Jurisdiction Dropdown Icons** - Fixed data availability icons (`MortalityChartControlsPrimary.vue`)
  - Age-stratified: `i-lucide-layers`, All-ages: `i-lucide-circle`

- ✅ **UI-2: Standard Population Selector** - Only shows for ASMR metrics (`MortalityChartControlsSecondaryCustom.vue`)

- ✅ **UI-3: Baseline Method Selector** - Fixed bugs and added median (`MortalityChartControlsSecondaryCustom.vue`, `app/model.ts`)
  - Fixed: Linear regression selecting ETS (exp) instead
  - Fixed: ETS not working properly
  - Added new baseline method: Median
  - Verified all 5 methods work: naive, mean, median, lin_reg, exp

- ✅ **UI-4: Chart Card Clipping** - Fixed content clipping and drag icon alignment (`explorer.vue`)

- ✅ **UI-5: Color Picker Count** - Matched number of colors to selected jurisdictions (`MultiColorPicker.vue`)

- ✅ **UI-6: Page Title Format** - Fixed incorrect format (`explorer.vue`)

- ✅ **UI-7: Chart Plugin Flickering** - Fixed logo/QR code re-render flickering (`logoPlugin.ts`, `qrCodePlugin.ts`)

- ✅ **UI-8: Dark Mode Reactivity** - Chart plugins update immediately on theme change

- ✅ **UI-9: Dark Mode Colors** - Optimized chart color palette for dark mode (`colors.ts`)

- ✅ **UI-10: Number Precision Control** - Added dropdown for digit precision with "Auto" option (`chartConfig.ts`)

- ✅ **UI-11: Last Value Subtitle** - Shows only last year instead of date range (`components/charts/*`)

---

## Phase 3: Critical Fixes & Infrastructure

**Status:** ✅ Complete

### 3.1 Server-Side Chart Rendering

**File:** `server/routes/chart.png.ts`

**Status:** Fully implemented with complete data pipeline.

**Completed:**

- ✅ Route accepts query parameters and decodes chart state
- ✅ Full data fetching pipeline implemented
  - Load country metadata with `loadCountryMetadata()`
  - Load raw dataset with `updateDataset()`
  - Fetch chart data with `getAllChartData()`
  - Generate config with `makeChartConfig()`
- ✅ Chart.js server-side setup with Canvas
- ✅ Logo plugin framework
- ✅ QR code generation library integrated
- ✅ Proper HTTP headers and caching
- ✅ Test with real mortality data
- ✅ QR code URL generation for chart links
- ✅ Logo plugin rendering in SSR context
- ✅ OG image generation working
- ✅ Error handling for data pipeline failures

### 3.1.5 Chart Rendering Infrastructure & Performance

**Server-side data caching:**

- ✅ Implement filesystem cache for CSV data in server context
- ✅ Add cache invalidation strategy (TTL: 24 hours for mortality data)
- ✅ Cache parsed country metadata (rarely changes)
- ✅ Add cache warming script for common country combinations
- ✅ Monitor cache hit rate

**Request management:**

- ✅ Add request queue for chart generation (max 5 concurrent renders)
- ✅ Implement timeout for chart generation (10 seconds max)
- ✅ Add request deduplication (if same chart requested multiple times)
- ✅ Log slow chart renders (>3 seconds)

**Memory management:**

- ✅ Monitor memory usage during chart rendering
- ✅ Implement cleanup after each render (Canvas context disposal)
- ✅ Add memory limit check (fail if >500MB in use)
- ✅ Profile memory leaks in long-running server

**Error handling & fallbacks:**

- ✅ Create fallback to pre-rendered static images on failure
- ✅ Handle external baseline API unavailability gracefully
- ✅ Add retry logic for transient failures (1 retry with exponential backoff)
- ✅ Return appropriate HTTP status codes (500 for server error, 504 for timeout)
- ✅ Add error reporting to monitoring system

**Health checks:**

- ✅ Add health check endpoint: `GET /api/health/chart-renderer`
- ✅ Test render a simple chart on health check
- ✅ Monitor response time and success rate
- ✅ Alert if health check fails 3 times in 5 minutes

### 3.2 Fix Last Value Subtitle Display

**Status:** Moved to Phase 2 (UI-11) and completed there

**File:** `app/components/charts/*`

This task was originally in Phase 3 but moved to Phase 2: UI Fixes (UI-11) to be addressed with other UI issues. It has been completed as part of Phase 2.

### 3.3 External API Resilience

**File:** `app/lib/data/baselines.ts`

- ✅ Implement circuit breaker pattern for baseline service calls
- ✅ Add timeout configurations
- ✅ Implement user-visible notifications when fallback occurs
- ✅ Add retry logic with exponential backoff
- ✅ Log API failures for monitoring

### 3.4 Error Tracking & Rate Limiting

**Error tracking (self-hosted Bugsink):**

- ✅ Install @sentry/node (completed Oct 26, 2025)
- ✅ Configure Sentry DSN (self-hosted: https://sentry.mortality.watch)
- ✅ Integrate with errorTracking.ts (production-only mode)
- ✅ Test error reporting (2 test events successfully captured)
- ✅ Deploy Bugsink to sentry.mortality.watch (Dokku)
- ✅ Configure Resend SMTP for email notifications
- ✅ Set up Cloudflare HTTPS proxy (no Let's Encrypt needed)
- ✅ Automated deployment with pre/post-deploy hooks

**Rate limiting:**

- ✅ Install nuxt-rate-limit or similar
- ✅ Configure: 100 req/min anonymous, 1000 req/min authenticated
- ✅ Test with API routes

---

## Phase 4: Testing & Code Quality

**Status:** ✅ Complete

### 4.1 Test Coverage - Core Data Layer

**Files:** `app/lib/data/*.test.ts` (466 total tests passing)

- ✅ Unit tests for data fetching functions
- ✅ Unit tests for data transformation functions
- ✅ Unit tests for aggregation logic
- ✅ Mock SQLite database for tests
- ✅ Achieved >80% coverage

### 4.2 Test Coverage - Chart Logic

**Files:** `app/lib/chart/*.test.ts`, `app/model/*.test.ts`

- ✅ Unit tests for chart configuration builders
- ✅ Unit tests for chart plugins (logo, QR, background)
- ✅ Integration tests for chart rendering
- ✅ Test color palette generation
- ✅ Achieved >80% coverage

### 4.2.5 Component Testing

**Status:** Component tests implemented (included in 466 passing tests)

**Completed Component Tests:**

- ✅ **Enable and fix:** `MortalityChartOptions.spec.ts`
  - Test all props are handled correctly
  - Test event emissions (close, update)
  - Test conditional rendering based on chart type
  - Test dark mode rendering

- ✅ **Create:** `MortalityChartControlsPrimary.spec.ts`
  - Test country selection updates state
  - Test metric type switching
  - Test chart type selection
  - Test data availability indicators (icons)

- ✅ **Create:** `MortalityChartControlsSecondaryCustom.spec.ts`
  - Test baseline method selection
  - Test standard population selector (ASMR only)
  - Test date range controls
  - Test excess mortality toggle

- ✅ **Create:** `DateSlider.spec.ts`
  - Test date range selection
  - Test slider updates emit events
  - Test min/max constraints
  - Test keyboard navigation

- ✅ **Create:** `MultiColorPicker.spec.ts`
  - Test color picker count matches jurisdictions (UI-5)
  - Test color selection updates
  - Test reset to default colors
  - Test dark mode color palette

- ✅ **Create:** `MortalityChart.spec.ts`
  - Test chart renders with valid data
  - Test chart updates on prop changes
  - Test chart re-renders vs updates (performance)
  - Test error handling with invalid data

**Testing Strategy:**

- ✅ Using Vue Test Utils `mount()` for isolated component tests
- ✅ Mocking Chart.js to avoid canvas rendering in tests
- ✅ Using `flushPromises()` for async updates
- ✅ Testing both light and dark mode rendering
- ✅ Achieved >70% coverage of interactive components

### 4.3 End-to-End Tests (Detailed Coverage)

**Using Playwright with Nuxt:**

**Setup:**

- ✅ Install @playwright/test
- ✅ Configure playwright.config.ts (base URL, browsers, reporters)
- ✅ Create test directory: `tests/e2e/`

**Critical User Flows (Phase 2-3):**

- ✅ Homepage → Explorer → Create chart → Share URL
- ✅ Explorer → Select countries → Change date range → Update chart
- ✅ Explorer → Change metric type → Verify data updates
- ✅ Dark mode toggle → Verify chart updates immediately
- ✅ URL with state → Load page → Verify chart restores correctly
- ✅ Baseline configuration → Change method → Verify calculation updates
- ✅ Color picker → Change colors → Verify chart updates
- ✅ Ranking page → Sort columns → Filter data

**Target:** ✅ Achieved >80% coverage of critical user-facing flows

### 4.4 Type Safety Improvements

**Files:** Various (refactored during Phase 5)

- ✅ Remove `as unknown as` casts - replace with proper type guards
- ✅ Add strict type definitions for array handling
- ✅ Enable stricter TypeScript compiler options
- ✅ Add Zod schemas where validation is needed
- ✅ Run full typecheck and fix all errors

---

## Phase 5: Refactoring & Performance

**Status:** ✅ Complete

### 5.1 Split Monolithic Files

**Files:** `data.ts` (580L), `model.ts` (864L), `chart.ts` (671L)

**Migration Strategy:** Incremental refactoring with barrel exports (backward compatibility)

#### 5.1.1 Data.ts Refactoring Strategy

**Timeline: Completed**

**Week 1: Create new structure with re-exports**

- ✅ Create `app/lib/data/` directory structure:
  - `queries.ts` - Database queries
  - `transformations.ts` - Data transformations
  - `aggregations.ts` - Aggregation logic
  - `baselines.ts` - Baseline calculations
  - `index.ts` - Public API (re-exports everything)
- ✅ Move functions to new files
- ✅ Update original `data.ts` to re-export from new structure
- ✅ Run tests: `npm run check` (passed with no changes)

**Week 2: Update imports in composables**

- ✅ Update all composables to import from `~/lib/data`
- ✅ Run tests after each file update
- ✅ Commit incrementally

**Week 3: Update imports in components**

- ✅ Update all components to import from `~/lib/data`
- ✅ Test each component manually in browser
- ✅ Run tests after all updates

**Week 4: Update imports in pages**

- ✅ Update all pages to import from `~/lib/data`
- ✅ Test each page manually
- ✅ Run full E2E test suite

**Week 5: Remove old file**

- ✅ Search for any remaining imports of `~/data`
- ✅ Delete `app/data.ts` file
- ✅ Run full test suite
- ✅ Deploy to staging and test

#### 5.1.2 Model.ts Refactoring Strategy

**Timeline: Completed**

**Week 1: Create new structure**

- ✅ Split into `app/model/` directory:
  - `types.ts` - Core type definitions
  - `baseline.ts` - Baseline-related types
  - `chart.ts` - Chart configuration types
  - `country.ts` - Country-related types
  - `index.ts` - Re-exports all types
- ✅ Keep `app/model.ts` as re-export wrapper
- ✅ Verify types work: `npm run typecheck`

**Week 2: Update type imports**

- ✅ Update imports in all files to use `~/model` (not specific files)
- ✅ Run typecheck frequently

**Week 3: Cleanup**

- ✅ Remove old `app/model.ts` file
- ✅ Update tsconfig paths if needed
- ✅ Verify no broken imports

#### 5.1.3 Chart.ts Refactoring Strategy

**Timeline: Completed**

**Week 1: Complete split**

- ✅ Split chart files into `app/lib/chart/`:
  - `config.ts` - Chart configurations
  - `datasets.ts` - Dataset builders
  - `options.ts` - Chart options
  - `utils.ts` - Chart utilities
- ✅ Add barrel export at `app/lib/chart/index.ts`
- ✅ Keep `app/chart.ts` as re-export temporarily

**Week 2: Update and cleanup**

- ✅ Update imports to use `~/lib/chart`
- ✅ Remove `app/chart.ts`
- ✅ Run tests and manual verification

#### 5.1.4 Refactoring Best Practices

**For each refactoring:**

1. ✅ Create new structure first
2. ✅ Add backward-compatible re-exports
3. ✅ Verify tests pass with zero changes
4. ✅ Update imports incrementally
5. ✅ Test after each batch of updates
6. ✅ Remove old files last
7. ✅ Document in commit messages

**Testing checklist after each phase:**

- ✅ `npm run check` passes
- ✅ `npm run build` succeeds
- ✅ Manual testing in browser (smoke test)
- ✅ No TypeScript errors
- ✅ No console errors in dev mode

### 5.2 Performance Optimizations

**Unbounded parallel requests:**

- ✅ Add request batching/throttling to data layer
- ✅ Implement p-limit or similar for controlled concurrency
- ✅ Add configurable batch size (e.g., 5 concurrent max)

**Chart re-rendering:**

- ✅ Add proper Vue reactivity controls
- ✅ Implement chart update vs rebuild logic
- ✅ Use Chart.js update() method for data changes
- ✅ Add debouncing for rapid state changes

**Pagination:**

- ✅ Identify large dataset queries
- ✅ Implement cursor-based pagination for rankings
- ✅ Add virtual scrolling for long lists
- ✅ Lazy load data on demand

### 5.3 Bundle Optimization & Code Splitting

**Analysis:**

- ✅ Run `nuxt analyze` to identify large chunks
- ✅ Analyze current bundle size and dependencies
- ✅ Identify opportunities for lazy loading

**Optimization tasks:**

- ✅ Code-split Chart.js plugins (load on demand)
- ✅ Lazy-load PrimeVue components not used on first load
- ✅ Extract common chunks for better caching
- ✅ Lazy-load data download utilities
- ✅ Review and minimize PapaParse usage

**Testing:**

- ✅ Test bundle on slow 3G connections
- ✅ Verify lazy loading doesn't break functionality
- ✅ Check Lighthouse performance score
- ✅ Monitor FCP, LCP, and TTI metrics

**Target:** ✅ Achieved <500KB initial bundle

---

## Phase 6: Database Schema & User Management (Partial)

**Status:** ⚠️ Partially Complete (Database setup and auth complete, email service partial)

### 6.1 Database Schema Design

**Database:** SQLite at `.data/mortality.db`
**Migration tool:** Drizzle ORM

All tables have been implemented and deployed:

- ✅ `users` - User accounts with tier, role, email verification
- ✅ `saved_charts` - Chart configurations with public/private sharing
- ✅ `subscriptions` - Stripe subscription management
- ✅ `webhook_events` - Stripe webhook event logging
- ✅ `featured_charts` - Homepage featured chart configurations
- ✅ `sessions` - Session management (optional, using JWT instead)

Complete schema with indexes available in `db/schema.ts`.

### 6.1.2 Migration Implementation Tasks

- ✅ Install Drizzle ORM: `npm install drizzle-orm drizzle-kit`
- ✅ Create `db/schema.ts` with Drizzle schema definitions
- ✅ Create `drizzle.config.ts` configuration file
- ✅ Create initial migration: `npm run db:generate`
- ✅ Apply migration: `npm run db:migrate`
- ✅ Add migration scripts to package.json
- ✅ Create `db/index.ts` for database connection and queries
- ✅ Test database operations with seed data (admin user created)

### 6.2 Authentication System

**Setup:**

- ✅ Configure custom JWT authentication with httpOnly cookies
- ✅ Set up session management (JWT tokens with 7-day expiration)
- ✅ Configure secure password hashing (bcryptjs with 12 rounds)

**Pages created:**

- ✅ `/signup` - Registration page (using UAuthForm)
- ✅ `/login` - Sign in page (using UAuthForm)
- ✅ `/forgot-password` - Password reset request
- ✅ `/reset-password/[token]` - Password reset form
- ✅ `/profile` - User profile page
- ✅ `/admin` - Admin dashboard (basic)

**Backend:**

- ✅ API route: `POST /api/auth/register`
- ✅ API route: `POST /api/auth/signin`
- ✅ API route: `POST /api/auth/signout`
- ✅ API route: `POST /api/auth/forgot-password`
- ✅ API route: `POST /api/auth/reset-password`
- ✅ API route: `GET /api/auth/session`
- ✅ API route: `PATCH /api/user/profile`

**Middleware:**

- ✅ Auth middleware for protected routes
- ✅ Admin-only middleware
- ✅ Paid user middleware (helper function `requireTier()` available)

**Setup admin user:**

- ✅ Create admin user seeding script
- ✅ Environment variable for admin credentials (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
- ✅ Script to create/reset admin password (`npm run db:seed`)

### 6.3 Email Service (Partial)

**Setup (using Resend):**

- ✅ Sign up for Resend account and get API key (completed Oct 26, 2025)
- ✅ Configure Resend SMTP for Bugsink (sentry.mortality.watch)
- ✅ Verify domain: mortality.watch
- ✅ Test email sending (working for Bugsink password resets)

**Required emails:**

- ✅ Password reset email (working for Bugsink)

---

## Phase 8.5.1: Module Integration

**Status:** ✅ Phase 1 Complete (83% integration)

**Branch:** `refactor/split-large-files`
**PR:** #10

### Successfully Integrated (10/12 modules - 83%)

**Explorer Components (4/4):**

- ✅ `ExplorerDataSelection.vue` - Data selection UI
- ✅ `ExplorerChartContainer.vue` - Chart display with loading states
- ✅ `ExplorerSettings.vue` - Settings panel wrapper
- ✅ `ExplorerChartActions.vue` - Chart action buttons
- **Impact:** Reduced explorer.vue by 158 lines (-10%)

**State Modules (3/3):**

- ✅ `StateCore.ts` - Core state properties and getters/setters
- ✅ `StateHelpers.ts` - Helper utilities and type predicates
- ✅ `StateSerialization.ts` - URL state serialization/deserialization
- **Impact:** Clean inheritance and delegation pattern

**Chart Control Component (1/1):**

- ✅ `DataTab.vue` - Data settings tab
- **Impact:** Replaced 77 lines of inline template

**Composables (2/4):**

- ✅ `useChartResize.ts` - Chart resizing functionality
- ✅ `useExplorerHelpers.ts` - Helper functions and type predicates
- **Impact:** Eliminated 108 lines from explorer.vue

**Total Impact:**

- explorer.vue: -276 lines total (~18% reduction)
- All 466 tests passing ✅
- TypeScript compilation successful ✅

### Non-Integrated Composables (2/12)

**1. `useExplorerDataUpdate.ts` (223 lines)**

- ❌ Cannot integrate due to TypeScript limitation
- Takes 30+ parameters → "Type instantiation excessively deep" error
- Solution: Phase 2 config object refactor
- File kept for Phase 2 integration

**2. `useExplorerState.ts` (255 lines)**

- ❌ Cannot integrate due to architectural mismatch
- Centralized state pattern incompatible with current inline pattern
- Decision: Keep as reference implementation
- No integration planned

---

## Phase 7: Feature Flags & Access Control

**Status:** ✅ Complete

### 7.1 Feature Flag System

**Files:**

- `app/config/features.config.ts` - Feature definitions with tier requirements
- `app/lib/featureFlags.ts` - Feature access control logic

**Completed:**

- ✅ Three-tier feature access model implemented:
  - **Tier 0 (Public/Free):** Basic chart visualization, standard time periods, conservative baseline
  - **Tier 1 (Free/Power User):** Save charts, custom colors, all baseline methods, export data
  - **Tier 2 (Pro/Paid):** Hide watermarks/QR, advanced calculations, z-scores, priority support

- ✅ Feature flag configuration:
  - 16+ features categorized by tier
  - Clear feature names and descriptions
  - Type-safe feature key definitions

- ✅ Access control functions:
  - `hasFeatureAccess(userTier, feature)` - Check user access
  - `getFeaturesForTier(tier)` - Get all features for tier
  - `getUpgradeMessage(userTier, feature)` - Context-aware upgrade messaging

**Implementation Details:**

- Tier-based feature gating ready for integration
- Feature access checks independent of authentication state
- Designed for easy addition of new features
- Type-safe with TypeScript enums and const assertions

---

## Phase 8: Stripe Integration

**Status:** ✅ Complete

### 8.1 Stripe Setup

**Files:** 8 API endpoints in `server/api/stripe/`

**Completed API Endpoints:**

- ✅ `create-checkout-session.post.ts` - Initialize Stripe checkout
- ✅ `create-portal-session.post.ts` - Customer portal access
- ✅ `subscription-status.get.ts` - Check user subscription status
- ✅ `sync-subscription.post.ts` - Manual subscription sync
- ✅ `failed-webhooks.get.ts` - View failed webhook events
- ✅ `retry-failed-webhooks.post.ts` - Retry failed webhooks
- ✅ `webhook.post.ts` - Handle Stripe webhook events
- ✅ `webhook.post.test.ts` - Webhook handler tests

**Webhook Handlers:**

- ✅ `checkout.session.completed` - Create/activate subscription
- ✅ `customer.subscription.updated` - Update subscription status
- ✅ `customer.subscription.deleted` - Cancel subscription
- ✅ `invoice.payment_succeeded` - Confirm payment
- ✅ `invoice.payment_failed` - Handle failed payments

**Database Integration:**

- ✅ `subscriptions` table with Stripe customer/subscription IDs
- ✅ `webhook_events` table for event tracking and idempotency
- ✅ Atomic transaction processing for webhook events
- ✅ Signature verification for security
- ✅ Duplicate event prevention

**Features:**

- ✅ Monthly subscription: $9.99/month
- ✅ Annual subscription: $99/year (saves ~$20)
- ✅ Automatic tier upgrades on successful payment
- ✅ Graceful handling of payment failures
- ✅ Customer portal for subscription management
- ✅ Failed webhook retry mechanism

---

## Phase 9: Saved Charts & My Charts Page

**Status:** ✅ Complete

### 9.1 Save Chart Functionality

**Backend API Routes:** 4 endpoints in `server/api/charts/`

**Completed:**

- ✅ `index.post.ts` - Save new chart configuration
- ✅ `index.get.ts` - List user's saved charts
- ✅ `[slug].get.ts` - Get specific chart by slug
- ✅ `[id].delete.ts` - Delete saved chart

**Database Integration:**

- ✅ `saved_charts` table with user_id foreign key
- ✅ Chart state serialization (JSON-encoded)
- ✅ Support for both explorer and ranking chart types
- ✅ Public sharing with slug-based URLs
- ✅ Featured chart flagging (admin feature)
- ✅ View count tracking

**Features:**

- ✅ Save chart with name and description
- ✅ Public/private chart sharing
- ✅ URL-friendly slugs for public charts
- ✅ Featured chart support for homepage
- ✅ Chart metadata (created_at, updated_at)

### 9.2 My Charts Page

**File:** `app/pages/my-charts.vue`

**Completed:**

- ✅ Full "My Charts" page with grid/list view
- ✅ Chart preview thumbnails
- ✅ Actions: View, Edit, Delete, Share
- ✅ Filter and search saved charts
- ✅ Sort by date, name, type
- ✅ Pagination for many charts
- ✅ Empty state handling

---

## Phase 10: Homepage Showcase Improvements

**Status:** ✅ Complete

### 10.1 Homepage Chart Strategy

**Files:**

- `app/pages/index.vue` - Homepage with featured charts
- `app/pages/admin/featured-charts.vue` - Admin management page

**Completed:**

- ✅ Dynamic rendering with multi-layer caching
- ✅ Featured chart configurations in database (`featured_charts` table)
- ✅ Homepage loads charts via existing `/chart.png` route
- ✅ Server-side rendering with Chart.js
- ✅ 7-day TTL caching strategy:
  - Filesystem cache: `.data/cache/charts/`
  - HTTP headers: `Cache-Control: public, max-age=604800`
  - CDN/Cloudflare edge caching

**Admin Configuration:**

- ✅ Admin page: `/admin/featured-charts`
- ✅ CRUD interface for featured charts
- ✅ Chart state JSON storage in database
- ✅ Drag-and-drop ordering
- ✅ Preview charts before publishing
- ✅ Cache management tools
- ✅ Max featured charts configuration

**Database:**

- ✅ `featured_charts` table with:
  - `chart_state` (JSON-encoded)
  - `display_order` (integer for ordering)
  - `title` and `description`
  - `is_active` (enable/disable without deletion)

**Benefits:**

- ✅ Admin can update without deployment
- ✅ Multi-layer caching ensures fast loads
- ✅ Automatic cache invalidation after 7 days
- ✅ Manual cache clear for immediate updates
- ✅ Reuses existing `/chart.png` infrastructure

---

## Phase 8.5.1: Module Integration

**Status:** ✅ Phase 1 Complete (83% integration)

**Branch:** `refactor/split-large-files`
**PR:** #10

### Successfully Integrated (10/12 modules - 83%)

**Explorer Components (4/4):**

- ✅ `ExplorerDataSelection.vue` - Data selection UI
- ✅ `ExplorerChartContainer.vue` - Chart display with loading states
- ✅ `ExplorerSettings.vue` - Settings panel wrapper
- ✅ `ExplorerChartActions.vue` - Chart action buttons
- **Impact:** Reduced explorer.vue by 158 lines (-10%)

**State Modules (3/3):**

- ✅ `StateCore.ts` - Core state properties and getters/setters
- ✅ `StateHelpers.ts` - Helper utilities and type predicates
- ✅ `StateSerialization.ts` - URL state serialization/deserialization
- **Impact:** Clean inheritance and delegation pattern

**Chart Control Component (1/1):**

- ✅ `DataTab.vue` - Data settings tab
- **Impact:** Replaced 77 lines of inline template

**Composables (2/4):**

- ✅ `useChartResize.ts` - Chart resizing functionality
- ✅ `useExplorerHelpers.ts` - Helper functions and type predicates
- **Impact:** Eliminated 108 lines from explorer.vue

**Total Impact:**

- explorer.vue: -276 lines total (~18% reduction)
- All 466 tests passing ✅
- TypeScript compilation successful ✅

### Non-Integrated Composables (2/12)

**1. `useExplorerDataUpdate.ts` (223 lines)**

- ❌ Cannot integrate due to TypeScript limitation
- Takes 30+ parameters → "Type instantiation excessively deep" error
- Solution: Phase 2 config object refactor
- File kept for Phase 2 integration

**2. `useExplorerState.ts` (255 lines)**

- ❌ Cannot integrate due to architectural mismatch
- Centralized state pattern incompatible with current inline pattern
- Decision: Keep as reference implementation
- No integration planned

---

## Summary Statistics

### Completed Phases

- ✅ **Phase 1:** CI/CD Setup (Complete)
- ✅ **Phase 2:** UI Fixes & Cleanup (11/11 items)
- ✅ **Phase 3:** Critical Fixes & Infrastructure (All sections)
- ✅ **Phase 4:** Testing & Code Quality (All sections)
- ✅ **Phase 5:** Refactoring & Performance (All sections)
- ⚠️ **Phase 6:** Database & Auth (Partial - core complete)
- ✅ **Phase 7:** Feature Flags & Access Control (Complete)
- ✅ **Phase 8:** Stripe Integration (Complete)
- ✅ **Phase 8.5.1:** Module Integration (83% complete)
- ✅ **Phase 9:** Saved Charts & My Charts Page (Complete)
- ✅ **Phase 10:** Homepage Showcase Improvements (Complete)

### Key Metrics

- **Test Coverage:** 466 tests passing, >80% coverage
- **Bundle Size:** <500KB initial bundle achieved
- **Code Reduction:**
  - Removed 1,200+ lines of unused code
  - Reduced explorer.vue by 276 lines (-18%)
- **Refactoring:** Split 3 monolithic files into modular structure
- **Type Safety:** Zero `as unknown as` casts remaining

### Technologies Implemented

- ✅ GitHub Actions CI/CD pipeline
- ✅ Drizzle ORM for database migrations
- ✅ Custom JWT authentication with httpOnly cookies
- ✅ Resend email service (partial integration)
- ✅ Self-hosted Bugsink error tracking
- ✅ Rate limiting middleware
- ✅ Playwright E2E testing (160+ tests)
- ✅ Vitest unit/component testing (466+ tests)
- ✅ Feature flag system with 3-tier access control
- ✅ Stripe payment integration (8 API endpoints)
- ✅ Saved charts system with public/private sharing
- ✅ Featured charts with admin management
- ✅ Multi-layer caching (filesystem + HTTP + CDN)

---

## Remaining Phases Analysis

### Phases 6.5-6.6: Legal & Support (Not Started)

- **Phase 6.5:** Legal documents (terms, privacy, refund pages) - Standard compliance pages
- **Phase 6.6:** Customer support (contact page, support email) - Basic support infrastructure

**Status:** Not critical for MVP launch, but needed before public marketing push

### Phases 10.5-12: Polish & Testing (Makes Sense)

- **Phase 10.5:** SEO & Discoverability - Important for organic growth
- **Phase 11:** Advanced Features - Nice-to-have analytics features (z-scores, advanced LE)
- **Phase 11.5:** Deployment - Dokku setup mostly done, needs documentation
- **Phase 12:** Testing & Polish - Always relevant, continuous improvement

**Status:** All make sense and are appropriately scoped

### Phase 13: Data Management & Updates (Makes Sense)

Focuses on data quality monitoring and update processes. Since `cron.mortality.watch` handles data updates to S3, this phase is about:

- Runtime validation and fallback when S3 data is bad
- Admin UI for monitoring data freshness
- Data quality checks and user reporting

**Status:** Makes sense as data quality is critical for credibility

### Phase 14: User Experience & Onboarding (Makes Sense)

Standard UX improvements for SaaS products:

- Interactive tutorials and tooltips
- Empty states and sample charts
- Upgrade prompts and tier transitions
- FAQ and help content

**Status:** All standard best practices, appropriately scoped

### Phase 15: Monitoring & Observability (Makes Sense, Mostly Done)

- **Section 15.1:** Error tracking with Bugsink - ✅ Already complete (Phase 3.4)
- **Section 15.2:** Performance monitoring - Standard metrics worth tracking
- **Section 15.3:** Business metrics - Critical for SaaS business
- **Sections 15.4-15.5:** Uptime monitoring and logging - Infrastructure basics

**Status:** About 20% done (error tracking), rest makes sense

### Phase 16: Accessibility & Compliance (Makes Sense)

Required for legal compliance and inclusive product:

- WCAG 2.1 AA accessibility standards
- GDPR compliance (data export, account deletion)
- CCPA compliance (California users)
- Legal pages (terms, privacy, refund, acceptable use)

**Status:** Critical before public launch, well-scoped

### Phase 17: Documentation Consolidation (Makes Sense)

Comprehensive documentation across all areas:

- Developer docs (architecture, API, database)
- Deployment and operations runbooks
- User-facing help and guides
- Code documentation and changelog

**Status:** Always needed, appropriate as final phase

---

**Overall Assessment:** All remaining phases (13-17) make sense and are well-scoped. They represent standard SaaS product needs for data quality, UX, compliance, monitoring, and documentation. No significant changes recommended.

**Note:** This archive represents approximately 80-85% of the total implementation plan. Remaining phases (6.5, 6.6, 10.5-17) focus on legal compliance, customer support, SEO, user experience, data quality monitoring, observability, accessibility, and documentation.
