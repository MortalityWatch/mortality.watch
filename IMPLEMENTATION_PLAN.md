# Implementation Plan: Mortality Watch Enhancement

## Overview

This document outlines the implementation plan for addressing critical issues, refactoring, and adding new features including user management, feature flags, and subscription functionality.

---

## ✅ Resolved Critical Decisions

**Tier Structure:**

The application uses a **3-tier access model**:

- **Tier 0 (Public/Free):** Anonymous users with basic features
- **Tier 1 (Registered/Power User):** Free registration unlocks extended features (save charts, custom colors, export data)
- **Tier 2 (Pro/Paid):** $9.99/month subscription for advanced features (no watermarks, advanced calculations, z-scores)

**These decisions have been finalized:**

1. **Auth library:** @sidebase/nuxt-auth (Lucia is being deprecated by March 2025)
2. **Database migrations:** Drizzle ORM
3. **Stripe pricing:** $9.99/month and $99/year (saves ~$20, approx 2 months free)
4. **Email provider:** Resend free tier (100 emails/day, 3,000/month)
5. **Refund policy:** 30-day refund window
6. **Cache strategy:** Start with no cache, add filesystem cache when implementing server-side rendering
7. **Testing framework:** Continue with Vitest (already working with 376 tests passing)
8. **Admin panel:** Build custom admin panel using Nuxt UI components
9. **E2E tests:** Set up GitHub Actions for both npm run check and Playwright UI tests
10. **CI/CD:** GitHub Actions for automated testing and quality checks
11. **Test writing strategy:** Write tests after each feature works (not TDD, not end-of-phase batching)
12. **Email verification:** Not required for MVP, may be needed for payment processing

---

## Data Storage Architecture

**Mortality Data:**

- Stored as CSV files from S3 (https://s3.mortality.watch/data/mortality/)
- Cached locally in `.data/cache/mortality/`
- Parsed with PapaParse and validated with Zod
- Covers 320+ countries with weekly, monthly, quarterly, and yearly data

**User Data:**

- SQLite database at `.data/mortality.db`
- Used for users, saved_charts, subscriptions tables
- Managed with Drizzle ORM
- **Current status:** Database file exists but is empty (0 bytes) - will be populated in Phase 6

**Existing Features to Preserve:**

- Incognito mode (privacy feature via `useIncognitoMode`)
- URL state persistence and sharing
- Chart OG image generation
- Dark mode support
- Data download scripts (`npm run download-data` and `npm run download-data:all`)

---

## Feature Tier Clarification

**Tier 0 (Public/Free):**

- Custom date ranges: ✅ Yes
- Baseline methods: Conservative only (3-year mean)
- Ranking page: View only (no saving)
- Chart watermark/logo: Visible
- QR code: Visible

**Baseline Methods (for implementation):**

```typescript
export const baselineMethods: ListType[] = [
  { name: "Last Value", value: "naive" },
  { name: "Average", value: "mean" },
  { name: "Median", value: "median" }, // NEW - to be added
  { name: "Linear Regression", value: "lin_reg" },
  { name: "Exponential Smoothing (ETS)", value: "exp" },
];
```

Note: Add 'Median' method during Phase 2 UI fixes.

**Tier 1 (Registered/Power User - FREE):**

- All Tier 0 features
- Multiple baseline methods: ✅ Yes (all methods)
- Save charts to "My Charts"
- Custom color schemes
- Export data (CSV, JSON, Excel if possible)
- Save rankings

**Tier 2 (Pro/Paid - $9.99/month or $99/year):**

- All Tier 1 features
- Hide logo/watermark
- Hide QR code
- Single age group LE calculations
- Age Standardized Deaths (Levitt method)
- Z-score calculations
- Priority support

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

**Example commit sequence for Phase 2:**

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
test: add tests for Phase 2 UI fixes
docs: update CHANGELOG for Phase 2 completion
```

### GitHub Integration

**Setting up remote:**

```bash
git remote add origin git@github.com:MortalityWatch/mortality.watch.git
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

## Phase 2: UI Fixes & Cleanup

### Overview

These UI issues should be addressed after CI/CD is set up. They affect user experience and core functionality.

### 2.1 Code Cleanup

- [ ] **Remove unused secondary control components:**
  - **Step 1:** Search for imports across codebase:
    ```bash
    grep -r "MortalityChartControlsSecondary" app/ --include="*.vue" --include="*.ts"
    ```
  - **Step 2:** Verify no dynamic component references (check for string-based imports)
  - **Step 3:** Delete files:
    - Delete `MortalityChartControlsSecondary.vue` (387 lines, unused)
    - Delete `MortalityChartControlsSecondarySimple.vue` (411 lines, unused)
    - Delete `MortalityChartControlsSecondaryNew.vue` (405 lines, unused)
  - **Step 4:** Keep only `MortalityChartControlsSecondaryCustom.vue` (currently in use)
  - **Step 5:** Run tests to verify nothing broke: `npm run check`

- [ ] **Remove test pages:**
  - **Step 1:** Check if any links point to test pages: `grep -r "test-ranking\|test-data\|test-fetch" app/`
  - **Step 2:**
    - Delete `/pages/test-ranking.vue`
    - Delete `/pages/test-data.vue`
    - Delete `/pages/test-fetch.vue`
  - **Step 3:** Verify build succeeds: `npm run build`

- [ ] **Document data scripts:**
  - Add README section for `npm run download-data`
  - Document `.data` directory structure
  - Add data refresh/update strategy docs

### 2.2 UI Issues Checklist

- [ ] **UI-1: Jurisdiction Dropdown Icons** - Fix data availability icons (`MortalityChartControlsPrimary.vue`)
  - Age-stratified: `i-lucide-layers`, All-ages: `i-lucide-circle`

- [ ] **UI-2: Standard Population Selector** - Only show for ASMR metrics (`MortalityChartControlsSecondaryCustom.vue`)

- [ ] **UI-3: Baseline Method Selector** - Fix bugs and add median (`MortalityChartControlsSecondaryCustom.vue`, `app/model.ts`)
  - Fix: Linear regression selecting ETS (exp) instead
  - Fix: ETS not working properly
  - Add new baseline method: Median
  - Verify all 5 methods work: naive, mean, median, lin_reg, exp
  - Update baseline method dropdown to match correct list

- [ ] **UI-4: Chart Card Clipping** - Fix content clipping and drag icon alignment (`explorer.vue`)

- [ ] **UI-5: Color Picker Count** - Match number of colors to selected jurisdictions (`MultiColorPicker.vue`)

- [ ] **UI-6: Page Title Format** - Fix incorrect format like "le - USA, SWE, DEU (midyear)" (`explorer.vue`)

- [ ] **UI-7: Chart Plugin Flickering** - Fix logo/QR code re-render flickering (`logoPlugin.ts`, `qrCodePlugin.ts`)

- [ ] **UI-8: Dark Mode Reactivity** - Chart plugins should update immediately on theme change

- [ ] **UI-9: Dark Mode Colors** - Optimize chart color palette for dark mode (`colors.ts`)

- [ ] **UI-10: Number Precision Control** - Add dropdown for digit precision with "Auto" option (`chartConfig.ts`)

- [ ] **UI-11: Last Value Subtitle** - Show only last year instead of date range (`components/charts/*`)

---

## Phase 3: Critical Fixes & Infrastructure

### 3.1 Server-Side Chart Rendering (50% Complete)

**File:** `server/routes/chart.png.ts`

**Current Status:** Route structure and placeholder rendering exist. Chart renderer infrastructure is complete (`server/utils/chartRenderer.ts`).

**What works:**

- ✅ Route accepts query parameters and decodes chart state
- ✅ Placeholder chart rendering with title
- ✅ Chart.js server-side setup with Canvas
- ✅ Logo plugin framework
- ✅ QR code generation library integrated
- ✅ Proper HTTP headers and caching

**What's needed:**

- [ ] Uncomment and complete data fetching pipeline (lines 36-59)
  - Load country metadata with `loadCountryMetadata()`
  - Load raw dataset with `updateDataset()`
  - Fetch chart data with `getAllChartData()`
  - Generate config with `makeChartConfig()`
- [ ] Test with real mortality data
- [ ] Add QR code URL generation for chart links
- [ ] Verify logo plugin rendering in SSR context
- [ ] Test OG image generation and social media sharing
- [ ] Add error handling for data pipeline failures

### 3.1.5 Chart Rendering Infrastructure & Performance

**Server-side data caching:**

- [ ] Implement filesystem cache for CSV data in server context
- [ ] Add cache invalidation strategy (TTL: 24 hours for mortality data)
- [ ] Cache parsed country metadata (rarely changes)
- [ ] Add cache warming script for common country combinations
- [ ] Monitor cache hit rate

**Request management:**

- [ ] Add request queue for chart generation (max 5 concurrent renders)
- [ ] Implement timeout for chart generation (10 seconds max)
- [ ] Add request deduplication (if same chart requested multiple times)
- [ ] Log slow chart renders (>3 seconds)

**Memory management:**

- [ ] Monitor memory usage during chart rendering
- [ ] Implement cleanup after each render (Canvas context disposal)
- [ ] Add memory limit check (fail if >500MB in use)
- [ ] Profile memory leaks in long-running server

**Error handling & fallbacks:**

- [ ] Create fallback to pre-rendered static images on failure
- [ ] Handle external baseline API unavailability gracefully
- [ ] Add retry logic for transient failures (1 retry with exponential backoff)
- [ ] Return appropriate HTTP status codes (500 for server error, 504 for timeout)
- [ ] Add error reporting to monitoring system

**Health checks:**

- [ ] Add health check endpoint: `GET /api/health/chart-renderer`
- [ ] Test render a simple chart on health check
- [ ] Monitor response time and success rate
- [ ] Alert if health check fails 3 times in 5 minutes

### 3.2 Fix Last Value Subtitle Display

**Status:** Moved to Phase 2 (UI-11)
**File:** `app/components/charts/*`

This task has been moved to Phase 2: UI Fixes (UI-11) to be addressed with other UI issues first.

### 3.3 External API Resilience

**File:** `app/data.ts:304-361`

- [ ] Implement circuit breaker pattern for baseline service calls
- [ ] Add timeout configurations
- [ ] Implement user-visible notifications when fallback occurs
- [ ] Add retry logic with exponential backoff
- [ ] Log API failures for monitoring

### 3.4 Error Tracking & Rate Limiting

**Error tracking (self-hosted Bugsink instead of Sentry free tier):**

- [x] ✅ Install @sentry/node (completed Oct 26, 2025)
- [x] ✅ Configure Sentry DSN (self-hosted: https://sentry.mortality.watch)
- [x] ✅ Integrate with errorTracking.ts (production-only mode)
- [x] ✅ Test error reporting (2 test events successfully captured)
- [x] ✅ Deploy Bugsink to sentry.mortality.watch (Dokku)
- [x] ✅ Configure Resend SMTP for email notifications
- [x] ✅ Set up Cloudflare HTTPS proxy (no Let's Encrypt needed)
- [x] ✅ Automated deployment with pre/post-deploy hooks

**Rate limiting:**

- [ ] Install nuxt-rate-limit or similar
- [ ] Configure: 100 req/min anonymous, 1000 req/min authenticated
- [ ] Test with API routes

---

## Phase 4: Testing & Code Quality

### 4.1 Test Coverage - Core Data Layer

**File:** `app/data.ts` (580 lines)

- [ ] Unit tests for data fetching functions
- [ ] Unit tests for data transformation functions
- [ ] Unit tests for aggregation logic
- [ ] Mock SQLite database for tests
- [ ] Aim for >80% coverage

### 4.2 Test Coverage - Chart Logic

**File:** `app/chart.ts` (671 lines)

- [ ] Unit tests for chart configuration builders
- [ ] Unit tests for chart plugins (logo, QR, background)
- [ ] Integration tests for chart rendering
- [ ] Test color palette generation
- [ ] Aim for >80% coverage

### 4.2.5 Component Testing

**Current Status:** 1 component test file exists but is disabled (`MortalityChartOptions.spec.ts.disabled`)

**Why Component Tests Matter:**
Component tests catch UI bugs that unit tests miss (prop handling, event emission, conditional rendering, user interactions).

**Priority Components to Test:**

- [ ] **Enable and fix:** `MortalityChartOptions.spec.ts`
  - Test all props are handled correctly
  - Test event emissions (close, update)
  - Test conditional rendering based on chart type
  - Test dark mode rendering

- [ ] **Create:** `MortalityChartControlsPrimary.spec.ts`
  - Test country selection updates state
  - Test metric type switching
  - Test chart type selection
  - Test data availability indicators (icons)

- [ ] **Create:** `MortalityChartControlsSecondaryCustom.spec.ts`
  - Test baseline method selection
  - Test standard population selector (ASMR only)
  - Test date range controls
  - Test excess mortality toggle

- [ ] **Create:** `DateSlider.spec.ts`
  - Test date range selection
  - Test slider updates emit events
  - Test min/max constraints
  - Test keyboard navigation

- [ ] **Create:** `MultiColorPicker.spec.ts`
  - Test color picker count matches jurisdictions (UI-5)
  - Test color selection updates
  - Test reset to default colors
  - Test dark mode color palette

- [ ] **Create:** `MortalityChart.spec.ts`
  - Test chart renders with valid data
  - Test chart updates on prop changes
  - Test chart re-renders vs updates (performance)
  - Test error handling with invalid data

**Testing Strategy:**

- Use Vue Test Utils `mount()` for isolated component tests
- Mock Chart.js to avoid canvas rendering in tests
- Use `flushPromises()` for async updates
- Test both light and dark mode rendering
- Aim for >70% coverage of interactive components

### 4.3 End-to-End Tests (Detailed Coverage)

**Use Playwright (works well with Nuxt):**

**Setup:**

- [ ] Install @playwright/test
- [ ] Configure playwright.config.ts (base URL, browsers, reporters)
- [ ] Create test directory: `tests/e2e/`

**Critical User Flows (Phase 2-3):**

- [ ] Homepage → Explorer → Create chart → Share URL
- [ ] Explorer → Select countries → Change date range → Update chart
- [ ] Explorer → Change metric type → Verify data updates
- [ ] Dark mode toggle → Verify chart updates immediately
- [ ] URL with state → Load page → Verify chart restores correctly
- [ ] Baseline configuration → Change method → Verify calculation updates
- [ ] Color picker → Change colors → Verify chart updates
- [ ] Ranking page → Sort columns → Filter data

**Future Auth Flows (Phase 6+):**

- [ ] Registration → Email verification → Login
- [ ] Login → Save chart → Logout → Login → Load saved chart
- [ ] Free user → Click Pro feature → See upgrade prompt
- [ ] Free user → Access "My Charts" → See saved charts list
- [ ] Edit saved chart → Update → Verify changes persist

**Payment Flows (Phase 8+):**

- [ ] Subscribe → Stripe checkout (test mode) → Webhook → Tier upgrade
- [ ] Pro user → Access Pro feature → Verify works (no watermark, etc.)
- [ ] Pro user → Access customer portal → Update payment method
- [ ] Cancel subscription → Tier downgrade → Pro features locked
- [ ] Pro user → Export data → Verify CSV/JSON download

**Target:** >80% coverage of critical user-facing flows before Phase 6

### 4.4 Type Safety Improvements

**Files:** Various (utils.ts:93-108, others)

- [ ] Remove `as unknown as` casts - replace with proper type guards
- [ ] Add strict type definitions for array handling
- [ ] Enable stricter TypeScript compiler options
- [ ] Add Zod schemas where validation is needed
- [ ] Run full typecheck and fix all errors

---

## Phase 5: Refactoring & Performance

### 5.1 Split Monolithic Files

**Files:** `data.ts` (580L), `model.ts` (864L), `chart.ts` (671L)

**Migration Strategy:** Incremental refactoring with barrel exports (backward compatibility)

This approach allows us to refactor without breaking existing code, then gradually update imports.

#### 5.1.1 Data.ts Refactoring Strategy

**Timeline: 5 weeks (incremental)**

**Week 1: Create new structure with re-exports**

- [ ] Create `app/lib/data/` directory structure:
  - `queries.ts` - Database queries
  - `transformations.ts` - Data transformations
  - `aggregations.ts` - Aggregation logic
  - `baselines.ts` - Baseline calculations
  - `index.ts` - Public API (re-exports everything)
- [ ] Move functions to new files
- [ ] Update original `data.ts` to re-export from new structure:
  ```typescript
  // app/data.ts (temporary backward compatibility)
  export * from "./lib/data";
  ```
- [ ] Run tests: `npm run check` (should pass with no changes)

**Week 2: Update imports in composables**

- [ ] Update all composables to import from `~/lib/data`
- [ ] Run tests after each file update
- [ ] Commit incrementally

**Week 3: Update imports in components**

- [ ] Update all components to import from `~/lib/data`
- [ ] Test each component manually in browser
- [ ] Run tests after all updates

**Week 4: Update imports in pages**

- [ ] Update all pages to import from `~/lib/data`
- [ ] Test each page manually
- [ ] Run full E2E test suite

**Week 5: Remove old file**

- [ ] Search for any remaining imports of `~/data`: `grep -r "from.*['\"]~/data['\"]" app/`
- [ ] Delete `app/data.ts` file
- [ ] Run full test suite
- [ ] Deploy to staging and test

#### 5.1.2 Model.ts Refactoring Strategy

**Timeline: 3 weeks (incremental)**

**Week 1: Create new structure**

- [ ] Split into `app/model/` directory:
  - `types.ts` - Core type definitions
  - `baseline.ts` - Baseline-related types (already exists, verify)
  - `chart.ts` - Chart configuration types
  - `country.ts` - Country-related types
  - `index.ts` - Re-exports all types
- [ ] Keep `app/model.ts` as re-export wrapper
- [ ] Verify types work: `npm run typecheck`

**Week 2: Update type imports**

- [ ] Update imports in all files to use `~/model` (not specific files)
- [ ] This should require minimal changes since re-exports maintain compatibility
- [ ] Run typecheck frequently

**Week 3: Cleanup**

- [ ] Remove old `app/model.ts` file
- [ ] Update tsconfig paths if needed
- [ ] Verify no broken imports

#### 5.1.3 Chart.ts Refactoring Strategy

**Timeline: 2 weeks (already partially done)**

**Week 1: Complete split**

- [ ] Already partially done with plugins in `app/lib/chart/`, continue:
  - `config.ts` - Chart configurations
  - `datasets.ts` - Dataset builders
  - `options.ts` - Chart options
  - `utils.ts` - Chart utilities (already exists)
- [ ] Add barrel export at `app/lib/chart/index.ts`
- [ ] Keep `app/chart.ts` as re-export temporarily

**Week 2: Update and cleanup**

- [ ] Update imports to use `~/lib/chart`
- [ ] Remove `app/chart.ts`
- [ ] Run tests and manual verification

#### 5.1.4 Refactoring Best Practices

**For each refactoring:**

1. Create new structure first
2. Add backward-compatible re-exports
3. Verify tests pass with zero changes
4. Update imports incrementally
5. Test after each batch of updates
6. Remove old files last
7. Document in commit messages

**Testing checklist after each phase:**

- [ ] `npm run check` passes
- [ ] `npm run build` succeeds
- [ ] Manual testing in browser (smoke test)
- [ ] No TypeScript errors
- [ ] No console errors in dev mode

### 5.2 Performance Optimizations

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

### 5.3 Bundle Optimization & Code Splitting

**Analysis:**

- [ ] Run `nuxt analyze` to identify large chunks
- [ ] Analyze current bundle size and dependencies
- [ ] Identify opportunities for lazy loading

**Optimization tasks:**

- [ ] Code-split Chart.js plugins (load on demand)
- [ ] Lazy-load PrimeVue components not used on first load
- [ ] Extract common chunks for better caching
- [ ] Lazy-load data download utilities
- [ ] Review and minimize PapaParse usage (if possible)

**Testing:**

- [ ] Test bundle on slow 3G connections
- [ ] Verify lazy loading doesn't break functionality
- [ ] Check Lighthouse performance score
- [ ] Monitor FCP, LCP, and TTI metrics

**Target:** <500KB initial bundle (currently need to measure)

---

## Phase 6: Database Schema & User Management

### 6.1 Database Schema Design

**Database:** SQLite at `.data/mortality.db` (currently 0 bytes, will be populated)

**Migration tool:** Drizzle ORM

#### 6.1.1 Detailed Schema Specification

**Users Table:**

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  tier INTEGER DEFAULT 1 CHECK(tier IN (0, 1, 2)),
  -- Tier 0: Anonymous (not stored in DB)
  -- Tier 1: Registered (FREE) - Default for new users
  -- Tier 2: Pro (PAID)
  email_verified BOOLEAN DEFAULT 0,
  verification_token TEXT,
  verification_token_expires DATETIME,
  password_reset_token TEXT,
  password_reset_token_expires DATETIME,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_password_reset_token ON users(password_reset_token);
```

**Saved Charts Table:**

```sql
CREATE TABLE saved_charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  chart_state TEXT NOT NULL, -- JSON-encoded chart state
  chart_type TEXT NOT NULL CHECK(chart_type IN ('explorer', 'ranking')),
  thumbnail_url TEXT, -- URL to pre-rendered preview image
  is_featured BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0, -- Allow sharing publicly
  slug TEXT UNIQUE, -- URL-friendly identifier for public charts
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_charts_user ON saved_charts(user_id);
CREATE INDEX idx_saved_charts_featured ON saved_charts(is_featured);
CREATE INDEX idx_saved_charts_public ON saved_charts(is_public);
CREATE INDEX idx_saved_charts_slug ON saved_charts(slug);
CREATE INDEX idx_saved_charts_created ON saved_charts(created_at DESC);
```

**Subscriptions Table:**

```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL, -- One subscription per user
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'inactive' CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing', 'inactive')),
  plan TEXT CHECK(plan IN ('monthly', 'yearly')),
  plan_price_id TEXT, -- Stripe price ID
  current_period_start DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end BOOLEAN DEFAULT 0,
  canceled_at DATETIME,
  trial_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

**Webhook Events Table (for debugging):**

```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- Full JSON payload
  processed BOOLEAN DEFAULT 0,
  processing_error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
```

**Sessions Table (if not using JWT):**

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY, -- Random session ID
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### 6.1.2 Migration Implementation Tasks

- [ ] Install Drizzle ORM: `npm install drizzle-orm drizzle-kit`
- [ ] Create `db/schema.ts` with Drizzle schema definitions
- [ ] Create `drizzle.config.ts` configuration file
- [ ] Create initial migration: `npm run db:generate`
- [ ] Apply migration: `npm run db:migrate`
- [ ] Add migration scripts to package.json:
  ```json
  {
    "db:generate": "drizzle-kit generate:sqlite",
    "db:migrate": "drizzle-kit push:sqlite",
    "db:studio": "drizzle-kit studio"
  }
  ```
- [ ] Create `db/index.ts` for database connection and queries
- [ ] Test database operations with seed data
- [ ] Document database setup in README

### 6.2 Authentication System

**Setup:**

- [ ] Install @sidebase/nuxt-auth module
- [ ] Configure @sidebase/nuxt-auth (choose provider: authjs or local)
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

### 6.3 Email Service

**Setup (using Resend):**

- [x] ✅ Sign up for Resend account and get API key (completed Oct 26, 2025)
- [x] ✅ Configure Resend SMTP for Bugsink (sentry.mortality.watch)
- [x] ✅ Verify domain: mortality.watch
- [x] ✅ Test email sending (working for Bugsink password resets)
- [ ] Install Resend SDK for main app: `npm install resend`
- [ ] Configure Resend API key in www.mortality.watch environment variables
- [ ] Create basic email templates (plain text is fine initially, can upgrade to React Email later)

**Note:** Same Resend account will be used for both Bugsink and www.mortality.watch

**Required emails only:**

- [x] ✅ Password reset email (working for Bugsink)
- [ ] Password reset email (for www.mortality.watch users)
- [ ] Email verification (optional for MVP)
- [ ] Payment receipt (Stripe can handle this initially)

---

## Phase 6.5: Legal Documents

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

## Phase 7: Feature Flags & Access Control

### 7.1 Feature Flag System

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

#### 7.1.5 Feature Flag Implementation Details

**File: `app/lib/featureFlags.ts`**

```typescript
/**
 * Feature definitions with tier requirements
 * Tier 0: Anonymous/Public (not logged in)
 * Tier 1: Registered/Power User (FREE with account)
 * Tier 2: Pro/Premium (PAID subscription)
 */
export const FEATURES = {
  // Tier 0 (Public/Free) - Basic functionality
  VIEW_CHARTS: {
    tier: 0,
    name: "View Charts",
    description: "View mortality charts",
  },
  BASIC_CONTROLS: {
    tier: 0,
    name: "Basic Controls",
    description: "Basic chart controls",
  },
  SHARE_URL: {
    tier: 0,
    name: "Share URL",
    description: "Share charts via URL",
  },
  VIEW_RANKING: {
    tier: 0,
    name: "View Rankings",
    description: "View ranking page",
  },
  CONSERVATIVE_BASELINE: {
    tier: 0,
    name: "Conservative Baseline",
    description: "3-year mean baseline only",
  },

  // Tier 1 (Registered - FREE) - Extended features
  SAVE_CHARTS: {
    tier: 1,
    name: "Save Charts",
    description: 'Save charts to "My Charts"',
  },
  CUSTOM_COLORS: {
    tier: 1,
    name: "Custom Colors",
    description: "Custom color schemes",
  },
  EXPORT_DATA: {
    tier: 1,
    name: "Export Data",
    description: "Export data (CSV, JSON)",
  },
  ALL_BASELINES: {
    tier: 1,
    name: "All Baseline Methods",
    description: "Access all baseline methods",
  },
  SAVE_RANKINGS: {
    tier: 1,
    name: "Save Rankings",
    description: "Save ranking configurations",
  },
  EXTENDED_TIME_PERIODS: {
    tier: 1,
    name: "Extended Time Periods",
    description: "Full historical data access",
  },

  // Tier 2 (Pro - PAID) - Advanced features
  HIDE_WATERMARK: {
    tier: 2,
    name: "Hide Watermark",
    description: "Remove watermark from charts",
  },
  HIDE_QR: {
    tier: 2,
    name: "Hide QR Code",
    description: "Remove QR code from charts",
  },
  ADVANCED_LE: {
    tier: 2,
    name: "Advanced LE",
    description: "Single age group LE calculations",
  },
  Z_SCORES: {
    tier: 2,
    name: "Z-Scores",
    description: "Z-score calculations and visualization",
  },
  AGE_STANDARDIZED: {
    tier: 2,
    name: "Age Standardized Deaths",
    description: "Levitt method age standardization",
  },
  PRIORITY_SUPPORT: {
    tier: 2,
    name: "Priority Support",
    description: "Priority customer support",
  },
  API_ACCESS: {
    tier: 2,
    name: "API Access",
    description: "REST API access (future)",
  },
} as const;

export type FeatureKey = keyof typeof FEATURES;
export type UserTier = 0 | 1 | 2;

/**
 * Check if a user has access to a feature
 */
export function hasFeatureAccess(
  userTier: UserTier,
  feature: FeatureKey,
): boolean {
  return userTier >= FEATURES[feature].tier;
}

/**
 * Get all features for a specific tier
 */
export function getFeaturesForTier(tier: UserTier): FeatureKey[] {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.tier === tier)
    .map(([key]) => key as FeatureKey);
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(
  userTier: UserTier,
  feature: FeatureKey,
): string {
  const requiredTier = FEATURES[feature].tier;

  if (requiredTier === 1) {
    return "Sign up for a free account to unlock this feature";
  }

  if (requiredTier === 2) {
    if (userTier === 0) {
      return "Sign up for free and upgrade to Pro to unlock this feature";
    }
    return "Upgrade to Pro to unlock this feature";
  }

  return "";
}
```

**File: `app/composables/useFeatureAccess.ts`**

```typescript
import { computed } from "vue";
import type { FeatureKey, UserTier } from "~/lib/featureFlags";
import {
  FEATURES,
  hasFeatureAccess,
  getUpgradeMessage,
} from "~/lib/featureFlags";

/**
 * Composable for checking feature access and tier status
 */
export function useFeatureAccess() {
  // Get user from auth composable (to be implemented in Phase 6)
  // For now, return tier 0 (anonymous)
  const { data: session } = useAuth(); // Will be implemented with @sidebase/nuxt-auth

  const tier = computed<UserTier>(() => {
    if (!session.value?.user) return 0;
    return (session.value.user.tier ?? 1) as UserTier;
  });

  const isAnonymous = computed(() => tier.value === 0);
  const isRegistered = computed(() => tier.value >= 1);
  const isPro = computed(() => tier.value >= 2);

  /**
   * Check if user can access a feature
   */
  const can = (feature: FeatureKey): boolean => {
    return hasFeatureAccess(tier.value, feature);
  };

  /**
   * Check if feature requires upgrade
   */
  const requiresUpgrade = (feature: FeatureKey): boolean => {
    return !can(feature);
  };

  /**
   * Get appropriate upgrade URL based on current tier
   */
  const upgradeUrl = computed(() => {
    if (tier.value === 0) return "/auth/register";
    return "/pro";
  });

  /**
   * Get upgrade CTA text based on current tier
   */
  const upgradeCTA = computed(() => {
    if (tier.value === 0) return "Sign Up Free";
    return "Upgrade to Pro";
  });

  /**
   * Get upgrade message for a specific feature
   */
  const getFeatureUpgradeMessage = (feature: FeatureKey): string => {
    return getUpgradeMessage(tier.value, feature);
  };

  return {
    tier,
    isAnonymous,
    isRegistered,
    isPro,
    can,
    requiresUpgrade,
    upgradeUrl,
    upgradeCTA,
    getFeatureUpgradeMessage,
    FEATURES, // Export for use in templates
  };
}
```

**File: `app/components/FeatureGate.vue`**

```vue
<template>
  <div>
    <!-- Show feature if user has access -->
    <slot v-if="can(feature)" />

    <!-- Show upgrade prompt if locked -->
    <div v-else-if="showUpgradePrompt" class="feature-locked">
      <UIcon name="i-lucide-lock" class="text-gray-400" />
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ getFeatureUpgradeMessage(feature) }}
      </p>
      <UButton :to="upgradeUrl" :label="upgradeCTA" color="primary" size="sm" />
    </div>

    <!-- Hide entirely if silent mode -->
    <div v-else-if="silent" />

    <!-- Show disabled state -->
    <div v-else class="feature-disabled">
      <slot name="disabled" :message="getFeatureUpgradeMessage(feature)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeatureKey } from "~/lib/featureFlags";

const props = defineProps<{
  feature: FeatureKey;
  showUpgradePrompt?: boolean; // Show upgrade CTA
  silent?: boolean; // Hide completely if no access
}>();

const { can, upgradeUrl, upgradeCTA, getFeatureUpgradeMessage } =
  useFeatureAccess();
</script>

<style scoped>
.feature-locked {
  @apply flex flex-col items-center gap-2 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg;
}

.feature-disabled {
  @apply opacity-50 pointer-events-none;
}
</style>
```

**Usage Example in Components:**

```vue
<template>
  <div>
    <!-- Simple check in template -->
    <UButton v-if="can('SAVE_CHARTS')" @click="saveChart" label="Save Chart" />

    <!-- With upgrade prompt -->
    <FeatureGate feature="HIDE_WATERMARK" show-upgrade-prompt>
      <UCheckbox v-model="hideWatermark" label="Hide watermark" />
    </FeatureGate>

    <!-- Silent (hide if no access) -->
    <FeatureGate feature="Z_SCORES" silent>
      <USelectMenu v-model="showZScores" label="Show Z-Scores" />
    </FeatureGate>

    <!-- Custom disabled state -->
    <FeatureGate feature="EXPORT_DATA">
      <UButton @click="exportData" label="Export Data" />
      <template #disabled="{ message }">
        <UTooltip :text="message">
          <UButton disabled label="Export Data (Pro)" />
        </UTooltip>
      </template>
    </FeatureGate>
  </div>
</template>

<script setup lang="ts">
const { can } = useFeatureAccess();
</script>
```

**Files to update with feature gates:**

- [ ] `app/components/charts/MortalityChartOptions.vue` - Gate premium chart options
- [ ] `app/components/ranking/RankingSettings.vue` - Gate premium ranking features
- [ ] `app/lib/chart/logoPlugin.ts` - Conditional rendering based on tier
- [ ] `app/lib/chart/qrCodePlugin.ts` - Conditional rendering based on tier
- [ ] `app/components/charts/MortalityChartControlsSecondaryCustom.vue` - Gate baseline methods
- [ ] `app/pages/explorer.vue` - Add save chart button with feature gate
- [ ] `app/pages/ranking.vue` - Add save ranking button with feature gate

---

## Phase 8: Stripe Integration

### 8.1 Stripe Setup

**Configuration:**

- [ ] Create Stripe account
- [ ] Install `@stripe/stripe-js` and `stripe` packages
- [ ] Set up Stripe API keys (test and production)
- [ ] Configure webhook endpoint URL
- [ ] Set up Stripe products and pricing

**Confirmed pricing:**

- Monthly subscription: $9.99/month
- Annual subscription: $99/year (saves ~$20, approx 2 months free)

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

### 8.1.5 Webhook Security & Reliability

**Critical:** Webhook security is essential for payment integrity. Stripe sends webhooks for all subscription events, and they must be verified and processed reliably.

**Security Implementation:**

- [ ] **Verify webhook signatures** using Stripe signing secret
- [ ] **Reject unsigned requests** immediately (return 400)
- [ ] **Use raw body** for signature verification (not parsed JSON)
- [ ] **Store webhook secret** in environment variable: `STRIPE_WEBHOOK_SECRET`
- [ ] **Separate secrets** for test mode and production mode

**Idempotency & Duplicate Protection:**

- [ ] **Check webhook_events table** before processing
- [ ] **Store Stripe event ID** to prevent duplicate processing
- [ ] **Use database transactions** for atomic subscription updates
- [ ] **Handle Stripe retry logic** (webhooks retry for up to 3 days)
- [ ] **Return 200 immediately** after verification, then process async if needed

**Logging & Monitoring:**

- [ ] **Log all webhook events** to `webhook_events` table
- [ ] **Log payload** for debugging (sanitize sensitive data)
- [ ] **Track processing errors** in database
- [ ] **Set up alerts** for webhook failures (>5 failures in 1 hour)
- [ ] **Monitor processing time** (should be <1 second)

**Testing:**

- [ ] **Test with Stripe CLI** for local development:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  stripe trigger checkout.session.completed
  ```
- [ ] **Test signature verification** with invalid signatures
- [ ] **Test idempotency** by sending same webhook twice
- [ ] **Test error scenarios** (database unavailable, invalid data)
- [ ] **Test in staging** before production deployment

**Rate Limiting:**

- [ ] **Apply rate limit** to webhook endpoint (1000 requests/hour)
- [ ] **Whitelist Stripe IPs** if using IP-based filtering
- [ ] **Monitor for unusual patterns** (many failed webhooks)

**Implementation Example:**

```typescript
// server/api/stripe/webhook.ts
import Stripe from "stripe";
import { db } from "~/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default defineEventHandler(async (event) => {
  const sig = event.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    throw createError({ statusCode: 400, message: "Missing signature" });
  }

  let stripeEvent: Stripe.Event;

  try {
    // Get raw body for signature verification
    const rawBody = await readRawBody(event);

    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(rawBody!, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    throw createError({
      statusCode: 400,
      message: "Invalid signature",
    });
  }

  try {
    // Check for duplicate processing (idempotency)
    const existing = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.stripeEventId, stripeEvent.id))
      .get();

    if (existing) {
      console.log("Webhook already processed:", stripeEvent.id);
      return { received: true, duplicate: true };
    }

    // Log webhook event
    await db.insert(webhookEvents).values({
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      payload: JSON.stringify(stripeEvent.data.object),
      processed: false,
    });

    // Process webhook in transaction
    await db.transaction(async (tx) => {
      switch (stripeEvent.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(tx, stripeEvent.data.object);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(tx, stripeEvent.data.object);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(tx, stripeEvent.data.object);
          break;
        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(tx, stripeEvent.data.object);
          break;
        case "invoice.payment_failed":
          await handlePaymentFailed(tx, stripeEvent.data.object);
          break;
        default:
          console.log("Unhandled webhook type:", stripeEvent.type);
      }

      // Mark as processed
      await tx
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.stripeEventId, stripeEvent.id));
    });

    return { received: true };
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Log error to database
    await db
      .update(webhookEvents)
      .set({
        processingError: error.message,
      })
      .where(eq(webhookEvents.stripeEventId, stripeEvent.id));

    throw createError({
      statusCode: 500,
      message: "Webhook processing failed",
    });
  }
});
```

**Environment Variables:**

```env
# .env
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxx  # from Stripe dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # for frontend
```

**Documentation Tasks:**

- [ ] Document webhook endpoint URL for Stripe dashboard configuration
- [ ] Document testing process with Stripe CLI
- [ ] Document how to handle failed webhooks manually
- [ ] Create runbook for webhook debugging
- [ ] Add webhook monitoring to ops dashboard

### 8.2 Subscription Pages

- [ ] `/pricing` - Pricing page with 3-tier comparison
  - Show all three tiers: Public (Free), Registered (Free), Pro (Paid)
  - Emphasize that Registered tier is FREE (just sign up!)
  - Clear feature breakdown for each tier
- [ ] `/pro` - Dedicated Pro tier showcase and benefits page
  - Detailed 3-tier feature comparison (Public vs Registered vs Pro)
  - Visual examples of Pro features (before/after with watermarks)
  - Highlight what you get FREE with registration (Tier 1)
  - Highlight what requires paid Pro subscription (Tier 2)
  - Use cases and testimonials
  - FAQ section (billing, refunds, cancellation)
  - Dual CTAs: "Sign Up Free" (for unregistered) and "Upgrade to Pro" (for registered)
- [ ] `/subscribe` - Subscription checkout flow (Pro tier only)
- [ ] `/subscription/success` - Post-purchase confirmation
- [ ] `/subscription/manage` - Subscription management (uses Stripe portal)
- [ ] Update `/profile` to show subscription status and tier

**UI Components:**

- [ ] `PricingCard.vue` - Tier comparison cards (supports 3 tiers)
- [ ] `FeatureComparisonTable.vue` - 3-column comparison: Public | Registered | Pro
- [ ] `SubscriptionStatus.vue` - Show current tier (Public/Registered/Pro)
- [ ] `UpgradePrompt.vue` - Context-aware upgrade CTA (shows "Sign Up" for public, "Upgrade to Pro" for registered)
- [ ] `UpgradeCard.vue` - Marketing card for homepage (dual messaging)

---

## Phase 9: Saved Charts & My Charts Page

### 9.1 Save Chart Functionality

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

### 9.2 My Charts Page

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

## Phase 10: Homepage Showcase Improvements

### 10.1 Homepage Chart Strategy (Revised)

**Current:** Homepage loads static images from `public/showcase/`

**Problem with direct server rendering:**

- Cold start latency (5-10 seconds for first render)
- Blocks homepage load time
- Increased server load
- Poor Core Web Vitals

**Recommended Approach: Build-time pre-rendering with on-demand refresh**

This provides instant page loads while maintaining flexibility for admin updates.

#### 10.1.1 Build-Time Pre-Rendering

- [ ] Create build script: `scripts/generate-featured-charts.ts`
- [ ] Run during `nuxt generate` to create featured chart images
- [ ] Store generated images in `public/showcase/featured/`
- [ ] Default configuration for featured charts (if no database config exists)
- [ ] Generate multiple sizes (1200x630 for OG, 800x400 for thumbnail)

#### 10.1.2 Runtime On-Demand Regeneration

- [ ] Admin trigger: "Regenerate Featured Charts" button
- [ ] API endpoint: `POST /api/admin/regenerate-featured`
- [ ] Queue-based generation (don't block admin UI)
- [ ] Progress indicator for admin
- [ ] Update homepage cache after generation complete

#### 10.1.3 Homepage Implementation

- [ ] Update homepage to use pre-rendered images from `public/showcase/featured/`
- [ ] Fetch featured chart list from database (or use defaults)
- [ ] Fallback to server rendering if pre-rendered image missing
- [ ] Add "last updated" timestamp to homepage
- [ ] Cache-Control headers for images (1 week)

#### 10.1.4 Benefits of This Approach

- ✅ Instant homepage load (no server rendering delay)
- ✅ Reduced server load (images served statically)
- ✅ Better SEO and Core Web Vitals (LCP <1s)
- ✅ Offline availability (PWA-ready)
- ✅ Admin can update featured charts without deploy
- ✅ Fallback to runtime rendering if needed

**Admin configuration:**

- [ ] Admin page to select featured charts from "My Charts"
- [ ] Drag-and-drop ordering of featured charts
- [ ] Preview before publishing
- [ ] "Regenerate Previews" button with progress
- [ ] Set max number of featured charts (e.g., 3-6)
- [ ] Auto-regenerate on schedule (optional: daily cron)

### 10.2 Homepage Marketing & Upgrade Prompts

**Add marketing elements to homepage:**

- [ ] Create `UpgradeCard.vue` component for homepage with dual messaging
- [ ] For **Public (Tier 0)** users - emphasize FREE registration benefits:
  - "Sign up FREE to unlock:"
  - Save charts to "My Charts"
  - Extended time period options
  - Multiple baseline methods
  - Custom color schemes
  - Export chart data (CSV)
  - CTA: "Sign Up Free" → links to registration
- [ ] For **Registered (Tier 1)** users - emphasize Pro upgrade:
  - "Upgrade to Pro for advanced features:"
  - Remove watermarks and QR codes
  - Single age group LE calculations
  - Age Standardized Deaths (Levitt method)
  - Z-score calculations
  - Priority support
  - Display pricing: "$9.99/month or $99/year"
  - CTA: "Upgrade to Pro" → links to `/pro` or `/subscribe`
- [ ] Position card strategically on homepage (above or below featured charts)
- [ ] Link to `/pricing` for full tier comparison
- [ ] Add testimonial section (optional, for future)
- [ ] A/B test different messaging (optional, for future)

**Tier indicators throughout the app:**

- [ ] Add tier badges on features:
  - "FREE with sign up" badge for Registered features
  - "PRO" badge for Pro features
- [ ] Show sample watermarked charts with note: "Remove watermark with Pro"
- [ ] Add hover tooltips explaining which tier unlocks each feature
- [ ] Context-aware CTAs based on current user tier

---

## Phase 11: Advanced Features

### 11.1 Improved Life Expectancy Calculations

**Tier:** Paid/Premium only

**Current:** Period LE calculation (5-year age groups)
**New:** Single-year age group LE calculation

- [ ] Research precise LE calculation methodology (Chiang method, etc.)
- [ ] Implement single-age LE calculation in `app/lib/calculations/lifeExpectancy.ts`
- [ ] Add UI option to select age group granularity
- [ ] Gate behind premium feature flag
- [ ] Add documentation/tooltip explaining difference
- [ ] Test against known LE values for validation

### 11.2 Age Standardized Deaths (Levitt Method)

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

### 11.3 Z-Score Calculations

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

## Phase 11.5: Deployment

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

## Phase 12: Testing & Polish

### 12.1 Integration Testing

- [ ] Test complete user flows: registration → subscribe → save charts
- [ ] Test feature flag enforcement
- [ ] Test Stripe webhook processing
- [ ] Test admin functionality
- [ ] Test server-side rendering in production environment

### 12.2 Security Audit

- [ ] Audit authentication implementation
- [ ] Check for SQL injection vulnerabilities
- [ ] Validate input sanitization
- [ ] Test rate limiting on API routes
- [ ] Verify proper session management
- [ ] Test authorization checks (no privilege escalation)

### 12.3 Performance Testing

- [ ] Load testing for concurrent users
- [ ] Chart rendering performance with many saved charts
- [ ] Database query optimization
- [ ] API response time benchmarking
- [ ] Stripe webhook reliability testing

### 12.4 Documentation

- [ ] Update README with new features
- [ ] Document feature flag system
- [ ] Document subscription tiers
- [ ] Create admin user guide
- [ ] Create user guide for premium features
- [ ] Document Stripe setup for deployment
- [ ] API documentation for future expansion

### 12.5 Pre-Launch Checklist

- [ ] Test password reset email works
- [ ] Verify Stripe webhooks work in production
- [ ] Test subscription flow end-to-end in staging
- [ ] Confirm database backups running
- [ ] Test mobile responsiveness
- [ ] Verify all legal pages linked in footer
- [ ] Check Sentry is receiving errors
- [ ] Lighthouse score >85

---

## Phase 13: Data Management & Updates

### Overview

**Current Status:** Data is fetched from S3 and cached locally, but there's no systematic approach to data updates, versioning, or quality monitoring.

This phase establishes processes for maintaining data quality and keeping mortality data up-to-date.

### 13.1 Data Update Strategy

- [ ] **Document data source update frequency**
  - Identify update cadence for each data source
  - Document expected data freshness (weekly, monthly, etc.)
  - Create update schedule documentation

- [ ] **Create automated data update system**
  - Extend `npm run download-data` script with scheduling
  - Add data comparison (detect new data vs existing)
  - Implement incremental updates (only fetch changed files)
  - Add logging for data update operations

- [ ] **Data versioning and changelog**
  - Track data file versions in database or metadata file
  - Generate changelog when data updates
  - Store historical snapshots (at least last 3 versions)
  - Add API endpoint to view data update history

- [ ] **Data validation on updates**
  - Run Zod validation on all new data
  - Check for outliers and anomalies
  - Verify data completeness (no unexpected gaps)
  - Compare with previous version (flag major changes)

- [ ] **Admin UI for data management**
  - Page: `/admin/data-management`
  - Show last update timestamp per country/dataset
  - "Trigger Manual Update" button
  - View data update logs
  - Preview data before publishing updates

- [ ] **Monitoring for data staleness**
  - Alert if data hasn't updated in expected timeframe
  - Dashboard showing data freshness per country
  - Email notifications for stale data

### 13.2 Data Quality & Corrections

- [ ] **Data quality checks**
  - Automated outlier detection (z-score > 3)
  - Missing value detection and reporting
  - Temporal consistency checks (no impossible jumps)
  - Cross-validation with external sources when possible

- [ ] **Data quality dashboard**
  - Admin page: `/admin/data-quality`
  - Show data quality metrics per country
  - Flag suspicious data points
  - Track quality score over time

- [ ] **Manual data correction process**
  - Document procedure for fixing bad data
  - Create correction override system in database
  - Log all manual corrections with reason
  - Admin UI for applying corrections

- [ ] **User reporting for data issues**
  - "Report Data Issue" button on charts
  - Form to describe the issue
  - Store reports in database for review
  - Admin interface to review and act on reports

### 13.3 Data Source Documentation

- [ ] **Expand sources page** (`/sources`)
  - Detailed methodology for each data source
  - Data processing steps
  - Known limitations and caveats
  - Update frequency per source
  - Data quality indicators

- [ ] **API documentation for data access**
  - Document CSV data structure
  - Explain age group codes
  - Document temporal granularities
  - Provide example queries

---

## Phase 14: User Experience & Onboarding

### Overview

Improve first-time user experience, feature discovery, and user retention through better onboarding and help systems.

### 14.1 First-Time User Experience

- [ ] **Interactive tutorial/walkthrough**
  - Create optional guided tour on first visit
  - Use library like `driver.js` or `intro.js`
  - Highlight key features (country selection, chart controls, sharing)
  - "Skip" and "Next" navigation
  - Store completion in localStorage

- [ ] **Contextual tooltips**
  - Add help icons next to complex controls
  - Explain baseline methods in simple terms
  - Tooltip for ASMR, CMR, LE metrics
  - Explain excess mortality calculation
  - Dark mode compatible tooltips

- [ ] **Empty states**
  - "My Charts" page when user has no saved charts
  - Suggest creating first chart
  - Show example/template charts
  - Clear CTAs to get started

- [ ] **Sample/template charts**
  - Pre-configured chart templates
  - "COVID-19 Impact", "Long-term Trends", "Country Comparison"
  - One-click load template
  - Store templates in database

- [ ] **Getting started guide**
  - Page: `/guide` or `/getting-started`
  - Step-by-step instructions with screenshots
  - Video tutorials (optional)
  - Common use cases and examples

### 14.2 Feature Discovery

- [ ] **"What's New" changelog**
  - Page: `/changelog`
  - Show recent feature additions
  - Categorize by release date
  - Highlight Pro features with badge

- [ ] **Feature highlights for returning users**
  - Show "New" badge on recently added features
  - Dismissible notification for major updates
  - Store seen status in localStorage or database

- [ ] **Contextual help buttons**
  - Add "?" icon next to complex features
  - Link to relevant docs or guide sections
  - Open in modal or sidebar

- [ ] **FAQ page**
  - Page: `/faq`
  - Common questions about data, features, subscriptions
  - Searchable FAQ
  - Link from various pages

- [ ] **In-app notifications**
  - Toast for important announcements
  - Inbox for user-specific messages
  - Dismissible and non-intrusive

### 14.3 Tier Transition UX

- [ ] **Upgrade prompts (non-intrusive)**
  - Contextual prompts when accessing locked features
  - Soft-sell approach (helpful, not pushy)
  - Dismissible with "Maybe later" option
  - Track prompt dismissals (don't spam)

- [ ] **Preview of Pro features**
  - Screenshots/videos showing Pro features
  - Before/after comparison (with/without watermark)
  - Demo charts using Pro features
  - Value proposition clear

- [ ] **Comparison calculator**
  - Show savings of annual vs monthly
  - "How many charts do you create per month?" calculator
  - ROI demonstration for power users

- [ ] **Testimonials and case studies**
  - User testimonials on `/pro` page
  - Case studies from researchers/journalists
  - Social proof (number of Pro users)

- [ ] **Downgrade experience**
  - Handle Pro → Free tier transition gracefully
  - Preserve saved charts (mark as Pro-only)
  - Explain what features are lost
  - Offer to reactivate subscription
  - No hostile dark patterns

---

## Phase 15: Monitoring & Observability

### Overview

Implement comprehensive monitoring, error tracking, and business metrics to maintain system health and inform product decisions.

### 15.1 Error Tracking (Sentry)

**Note:** Sentry installation is mentioned in Phase 3 but needs full implementation.

- [ ] **Install and configure Sentry**
  - Install `@sentry/nuxt`
  - Configure DSN in environment variables
  - Add to `nuxt.config.ts`
  - Set up source maps upload
  - Configure sampling rate (100% for errors, 10% for performance)

- [ ] **Error contextualization**
  - Add user context (tier, ID, but respect privacy)
  - Add route/page context
  - Tag errors by category (data, payment, auth, chart)
  - Add breadcrumbs for user actions
  - Capture chart configuration on errors

- [ ] **Alerting rules**
  - Alert for high error rate (>10 errors/minute)
  - Alert for specific critical errors (payment failures)
  - Daily digest of errors
  - Integrate with email or Slack

- [ ] **Release tracking**
  - Tag releases in Sentry
  - Track error rate per release
  - Automatically rollback if error spike detected

### 15.2 Performance Monitoring

- [ ] **Core Web Vitals tracking**
  - Track LCP (Largest Contentful Paint) - target <2.5s
  - Track FID/INP (First Input Delay / Interaction to Next Paint) - target <100ms
  - Track CLS (Cumulative Layout Shift) - target <0.1
  - Use Google Analytics 4 or Web Vitals library
  - Dashboard to monitor trends

- [ ] **API response time monitoring**
  - Log response times for all API routes
  - Track P50, P95, P99 percentiles
  - Alert if P95 > 1 second
  - Identify slow endpoints

- [ ] **Chart rendering performance**
  - Measure time to render chart client-side
  - Measure time to generate chart server-side
  - Track re-render frequency
  - Optimize based on data

- [ ] **Database query performance**
  - Log slow queries (>100ms)
  - Identify N+1 query issues
  - Monitor query count per request
  - Use Drizzle Studio for analysis

- [ ] **Server resource monitoring**
  - CPU usage tracking
  - Memory usage tracking (watch for leaks)
  - Disk usage (cache, logs, database)
  - Set alerts for resource exhaustion (>80% usage)

### 15.3 Business Metrics & Analytics

- [ ] **User registration metrics**
  - Track registration funnel conversion rate
  - Time from landing to registration
  - Registration source (homepage, upgrade prompt, etc.)
  - Drop-off points in registration flow

- [ ] **Subscription conversion metrics**
  - Free → Pro conversion rate
  - Time to conversion (days from registration)
  - Checkout abandonment rate
  - Monthly Recurring Revenue (MRR)
  - Annual Recurring Revenue (ARR)

- [ ] **Feature usage tracking**
  - Track usage by tier
  - Most used chart types
  - Most selected countries
  - Baseline method popularity
  - Export functionality usage
  - Dark mode adoption

- [ ] **Churn monitoring**
  - Track subscription cancellations
  - Cancellation reasons (exit survey)
  - Churn rate (monthly, annually)
  - Cohort analysis

- [ ] **Chart engagement metrics**
  - Charts created per user
  - Charts saved vs temporary
  - Chart shares (URL copies)
  - View count for saved charts
  - Most popular featured charts

### 15.4 Uptime & Alerting

- [ ] **Uptime monitoring**
  - External uptime service (UptimeRobot, Pingdom)
  - Monitor homepage, API endpoints
  - 5-minute check intervals
  - Email/SMS alerts on downtime

- [ ] **Application health checks**
  - Endpoint: `GET /api/health`
  - Check database connectivity
  - Check external API availability (baseline service)
  - Check disk space
  - Return 200 if healthy, 503 if degraded

- [ ] **Alert escalation policy**
  - Level 1: Email notification
  - Level 2: SMS for critical issues
  - Level 3: Page on-call engineer (if team grows)
  - Document on-call procedures

- [ ] **Status page**
  - Public status page showing system health
  - Incident history
  - Planned maintenance announcements
  - Subscribe to status updates
  - Use service like Statuspage.io or self-host

### 15.5 Logging Infrastructure

- [ ] **Structured logging**
  - Use consistent log format (JSON)
  - Log levels: debug, info, warn, error, fatal
  - Include timestamps, request IDs, user IDs
  - Redact sensitive information (passwords, tokens)

- [ ] **Log aggregation**
  - Centralize logs (file, Loki, CloudWatch, etc.)
  - Searchable log interface
  - Log retention policy (30 days minimum)

- [ ] **Audit logging**
  - Log admin actions (user edits, feature toggles)
  - Log subscription changes
  - Log data corrections
  - Immutable audit trail

---

## Phase 16: Accessibility & Compliance

### Overview

Ensure the application is accessible to all users and complies with legal requirements (GDPR, CCPA, WCAG).

### 16.1 Accessibility Audit & Fixes

**Note:** You already have `eslint-plugin-vuejs-accessibility` and `axe-core` installed.

- [ ] **Run automated accessibility tests**
  - Run `axe-core` on all pages
  - Use Pa11y or Lighthouse for automated scans
  - Document issues found
  - Prioritize critical issues (blocking, high impact)

- [ ] **ARIA labels and roles**
  - Add ARIA labels to all interactive elements
  - Use semantic HTML elements
  - Ensure proper heading hierarchy (h1 → h2 → h3)
  - Add role attributes where needed

- [ ] **Keyboard navigation**
  - Test all features with keyboard only (no mouse)
  - Ensure logical tab order
  - Add visible focus indicators
  - Support common shortcuts (Esc to close modals)
  - Test with screen reader (NVDA, JAWS, or VoiceOver)

- [ ] **Screen reader compatibility**
  - Test with NVDA (Windows) or VoiceOver (Mac)
  - Add screen reader-only text for context
  - Ensure charts are described (alt text or ARIA description)
  - Test form labels and error messages

- [ ] **Color contrast**
  - Ensure all text meets WCAG AA contrast ratio (4.5:1)
  - Test both light and dark modes
  - Use contrast checker tool
  - Fix low-contrast issues in charts

- [ ] **Responsive and zoom-friendly**
  - Test at 200% browser zoom
  - Ensure no horizontal scrolling
  - Text reflows properly
  - Buttons and controls remain usable

- [ ] **Skip navigation links**
  - Add "Skip to main content" link
  - Add "Skip to chart" link on explorer page
  - Hidden until focused

- [ ] **Accessibility statement page**
  - Create `/accessibility` page
  - Document accessibility features
  - Provide contact for accessibility issues
  - List known issues and timelines for fixes

### 16.2 GDPR Compliance

- [ ] **Data export functionality**
  - API route: `GET /api/user/export-data`
  - Export user data as JSON
  - Include: profile, saved charts, subscription history
  - Available from profile page
  - Email download link (for security)

- [ ] **Account deletion**
  - API route: `DELETE /api/user/account`
  - Cascade delete: saved charts, subscription records
  - Keep anonymized payment records (legal requirement)
  - Confirmation dialog (irreversible action)
  - Available from profile page

- [ ] **Privacy policy page**
  - Page: `/legal/privacy`
  - Clear explanation of data collection
  - List third parties (Stripe, Sentry, analytics)
  - Explain data retention policies
  - Link from footer

- [ ] **Cookie consent**
  - Cookie banner for EU users
  - Explain cookies used (session, analytics, preferences)
  - Allow opt-out of non-essential cookies
  - Store consent in localStorage
  - Respect Do Not Track setting

- [ ] **Data retention policies**
  - Document data retention for each data type
  - Users: Indefinite (until deletion requested)
  - Sessions: 30 days
  - Webhook events: 90 days
  - Logs: 30 days
  - Anonymize after retention period

### 16.3 CCPA Compliance (California)

- [ ] **"Do Not Sell" opt-out**
  - Add link in footer: "Do Not Sell My Personal Information"
  - (Note: Likely not applicable if no data selling occurs)
  - Document compliance approach

- [ ] **California users data rights**
  - Support data export for CCPA (covered by GDPR export)
  - Support data deletion for CCPA (covered by GDPR deletion)
  - Respond to requests within 45 days

### 16.4 Legal Pages

- [ ] **Terms of Service page**
  - Page: `/legal/terms`
  - Use template from Termly or TermsFeed
  - Customize for this application
  - Cover: user conduct, account terms, subscription terms, liability
  - Link from footer and registration page

- [ ] **Refund policy page**
  - Page: `/legal/refund`
  - 30-day refund window (as decided)
  - Clear instructions for requesting refund
  - Link from pricing and subscription pages

- [ ] **Acceptable use policy**
  - Page: `/legal/acceptable-use`
  - Define prohibited uses
  - Data scraping policy
  - Link from terms of service

- [ ] **TOS acceptance**
  - Add checkbox to registration form
  - "I agree to the Terms of Service and Privacy Policy"
  - Required to register
  - Log acceptance in database

### 16.5 Compliance Documentation

- [ ] **Create compliance checklist**
  - Document GDPR compliance measures
  - Document CCPA compliance measures
  - Document WCAG 2.1 AA compliance efforts
  - Store in repository: `COMPLIANCE.md`

- [ ] **Third-party data processing agreements**
  - Review Stripe's DPA (Data Processing Agreement)
  - Review Resend's DPA
  - Review Sentry's DPA
  - Document in compliance doc

- [ ] **Security practices documentation**
  - Password hashing method (bcrypt/argon2)
  - Session management approach
  - Data encryption at rest/transit
  - Backup and recovery procedures
