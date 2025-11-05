# Phase 12+ Parallelization Plan

**Created**: 2025-11-04
**Goal**: Execute Phase 12-15 improvements using parallel worktrees

---

## Dependency Analysis

### Phase 12: Critical Issues

**Sub-phases**:

1. **12a**: Stripe webhook tests (8h) - `server/api/stripe/webhook.post.ts`
2. **12b**: Chart renderer tests (6h) - `server/utils/chartRenderer.ts`
3. **12c**: Auth utility tests (6h) - `server/utils/auth.ts`
4. **12d**: Chart config caching (4h) - `app/lib/chart/chartConfig.ts`
5. **12e**: Memoization (2h) - `useExplorerDataOrchestration.ts`, `data-quality.vue`, `ranking.vue`
6. **12f**: Baseline caching (2h) - `baselines.ts`
7. **12g**: Admin page refactoring (4h) - `app/pages/admin/data-quality.vue`

**Dependencies**:

- 12a, 12b, 12c are **independent** (different test files)
- 12d, 12f are **independent** (different modules)
- 12e **depends on** 12g (both touch data-quality.vue)
- 12g **depends on** 12e (both touch data-quality.vue)

**Parallel Groups**:

- **Group A** (can run in parallel): 12a, 12b, 12c, 12d, 12f
- **Group B** (must run sequentially): 12g → 12e (or merge into one phase)

---

### Phase 13: Code Quality

**Sub-phases**:

1. **13a**: Split data-quality.vue (4h) - `app/pages/admin/data-quality.vue`
2. **13b**: Split chart.png.ts (4h) - `server/routes/chart.png.ts`
3. **13c**: Simplify resetDates() (2h) - `useExplorerDataOrchestration.ts`
4. **13d**: Extract webhook processors (2h) - `server/api/stripe/webhook.post.ts`
5. **13e**: Type safety - chartRenderer (3h) - `server/utils/chartRenderer.ts`
6. **13f**: Type safety - event handlers (2h) - Various Vue components
7. **13g**: Type safety - API responses (4h) - Server API files
8. **13h**: Structured logging (3h) - Add pino/winston

**Dependencies**:

- 13a **conflicts with** 12g (same file)
- 13d **conflicts with** 12a (same file)
- 13e **conflicts with** 12b (same file)
- 13c **conflicts with** 12e (same file)
- 13b, 13f, 13g, 13h are **independent**

**Resolution**: Phase 13 should run **after** Phase 12 completes

---

### Phase 14: Documentation & Testing

**Sub-phases**:

1. **14a**: Admin page tests (6h) - Test files only
2. **14b**: Data validation tests (4h) - Test files only
3. **14c**: Chart config tests (4h) - Test files only
4. **14d**: JSDoc - chartConfig.ts (3h)
5. **14e**: JSDoc - useExplorerHelpers.ts (3h)
6. **14f**: JSDoc - validation.ts (3h)
7. **14g**: JSDoc - auth.ts (3h)
8. **14h**: Composables README (2h)

**Dependencies**:

- All sub-phases are **independent** (test files + documentation)
- Can run in parallel

**Parallel Groups**:

- **All** can run in parallel (8 workers)

---

### Phase 15: Architecture Improvements

**Sub-phases**:

1. **15a**: DataLoaderService (6h) - `server/services/dataLoader.ts`
2. **15b**: useErrorRecovery composable (4h) - `app/composables/useErrorRecovery.ts`
3. **15c**: Form validation standardization (3h) - Various forms
4. **15d**: Dependency documentation (1h) - README

**Dependencies**:

- 15a, 15b, 15c are **independent**
- 15d can run anytime (documentation)

**Parallel Groups**:

- **All** can run in parallel (4 workers)

---

## Recommended Execution Strategy

### Wave 1: Phase 12 Critical Issues (5 parallel workers)

**Worker 1: Phase 12a - Stripe Webhook Tests** (8h)

```bash
Directory: /Users/ben/dev/co/phase-12a
Branch: test/phase-12a-stripe-webhook-tests
Files: server/api/stripe/webhook.post.test.ts (new)
Lines: ~600 new test lines
```

**Worker 2: Phase 12b - Chart Renderer Tests** (6h)

```bash
Directory: /Users/ben/dev/co/phase-12b
Branch: test/phase-12b-chart-renderer-tests
Files: server/utils/chartRenderer.test.ts (new)
Lines: ~450 new test lines
```

**Worker 3: Phase 12c - Auth Utility Tests** (6h)

```bash
Directory: /Users/ben/dev/co/phase-12c
Branch: test/phase-12c-auth-tests
Files: server/utils/auth.test.ts (new)
Lines: ~400 new test lines
```

**Worker 4: Phase 12d - Chart Config Caching** (4h)

```bash
Directory: /Users/ben/dev/co/phase-12d
Branch: perf/phase-12d-chart-config-cache
Files:
  - app/lib/chart/chartConfig.ts (modified)
  - app/lib/cache/chartConfigCache.ts (new)
Lines: ~120 new lines, modify 15 lines
```

**Worker 5: Phase 12f - Baseline Caching** (2h)

```bash
Directory: /Users/ben/dev/co/phase-12f
Branch: perf/phase-12f-baseline-cache
Files:
  - app/model/baseline.ts (modified)
  - app/lib/cache/baselineCache.ts (new)
Lines: ~80 new lines, modify 10 lines
```

**Sequential (after 12a-12f merge): Phase 12g+12e - Admin + Memoization** (6h)

```bash
Directory: /Users/ben/dev/co/phase-12g
Branch: refactor/phase-12g-admin-memoization
Files:
  - app/pages/admin/data-quality.vue (modified)
  - app/composables/useDataQualityFilters.ts (new)
  - app/composables/useDataQualityOverrides.ts (new)
  - app/composables/useDataQualityTable.ts (new)
  - app/composables/useExplorerDataOrchestration.ts (modified)
  - app/pages/ranking.vue (modified)
Lines: ~400 new lines, modify 100 lines
```

---

### Wave 2: Phase 14 Documentation & Testing (5 parallel workers)

**Why skip Phase 13?** Phase 13 has conflicts with Phase 12 files. Run Phase 14 first (independent test/docs), then Phase 13 after rebasing on merged Phase 12.

**Worker 1: Phase 14a - Admin Page Tests** (6h)

```bash
Directory: /Users/ben/dev/co/phase-14a
Branch: test/phase-14a-admin-tests
Files: app/pages/admin/data-quality.test.ts (new)
Lines: ~500 new test lines
```

**Worker 2: Phase 14b - Data Validation Tests** (4h)

```bash
Directory: /Users/ben/dev/co/phase-14b
Branch: test/phase-14b-validation-tests
Files: app/lib/data/validation.test.ts (enhanced)
Lines: ~300 new test lines
```

**Worker 3: Phase 14c - Chart Config Tests** (4h)

```bash
Directory: /Users/ben/dev/co/phase-14c
Branch: test/phase-14c-chartconfig-tests
Files: app/lib/chart/chartConfig.test.ts (new)
Lines: ~350 new test lines
```

**Worker 4: Phase 14d+14e - JSDoc (chartConfig + useExplorerHelpers)** (6h)

```bash
Directory: /Users/ben/dev/co/phase-14d
Branch: docs/phase-14d-jsdoc-chart-explorer
Files:
  - app/lib/chart/chartConfig.ts (modified)
  - app/composables/useExplorerHelpers.ts (modified)
Lines: Modify ~50 functions with JSDoc
```

**Worker 5: Phase 14f+14g+14h - JSDoc + README** (8h)

```bash
Directory: /Users/ben/dev/co/phase-14f
Branch: docs/phase-14f-jsdoc-validation-auth-readme
Files:
  - app/lib/data/validation.ts (modified)
  - server/utils/auth.ts (modified)
  - app/composables/README.md (new)
Lines: Modify ~30 functions, ~150 lines README
```

---

### Wave 3: Phase 13 Code Quality (4 parallel workers)

**After Phase 12 merges**, rebase Phase 13 branches:

**Worker 1: Phase 13b - Split chart.png.ts** (4h)

```bash
Directory: /Users/ben/dev/co/phase-13b
Branch: refactor/phase-13b-split-chart-png
Files:
  - server/routes/chart.png.ts (modified)
  - server/utils/chartPngHelpers.ts (new)
Lines: Split 226 lines into 2 files
```

**Worker 2: Phase 13f - Type Safety Event Handlers** (2h)

```bash
Directory: /Users/ben/dev/co/phase-13f
Branch: refactor/phase-13f-event-handler-types
Files: Various Vue components (modified)
Lines: Modify ~20 event handlers
```

**Worker 3: Phase 13g - API Response Types** (4h)

```bash
Directory: /Users/ben/dev/co/phase-13g
Branch: refactor/phase-13g-api-types
Files: Server API files (modified)
Lines: Add ~200 lines of Zod schemas/types
```

**Worker 4: Phase 13h - Structured Logging** (3h)

```bash
Directory: /Users/ben/dev/co/phase-13h
Branch: refactor/phase-13h-structured-logging
Files:
  - server/utils/logger.ts (new)
  - Various server files (modified)
Lines: ~100 new lines, modify ~30 console.* calls
```

**Sequential (after Phase 12g merges): Phase 13a+13c+13d+13e** (12h)

```bash
Directory: /Users/ben/dev/co/phase-13a
Branch: refactor/phase-13a-file-splits-types
Files:
  - app/pages/admin/data-quality.vue (already split in 12g)
  - useExplorerDataOrchestration.ts (modified - resetDates simplification)
  - server/api/stripe/webhook.post.ts (modified - extract processors)
  - server/utils/chartRenderer.ts (modified - type safety)
Lines: Refactor ~400 lines across 3 files
```

---

### Wave 4: Phase 15 Architecture (4 parallel workers)

**Worker 1: Phase 15a - DataLoaderService** (6h)

```bash
Directory: /Users/ben/dev/co/phase-15a
Branch: refactor/phase-15a-dataloader-service
Files:
  - server/services/dataLoader.ts (new)
  - server/routes/chart.png.ts (modified)
  - server/api/data/[...path].ts (modified)
Lines: ~200 new lines, refactor 2 files
```

**Worker 2: Phase 15b - useErrorRecovery** (4h)

```bash
Directory: /Users/ben/dev/co/phase-15b
Branch: refactor/phase-15b-error-recovery
Files:
  - app/composables/useErrorRecovery.ts (new)
  - Various components (modified)
Lines: ~120 new lines, modify ~10 components
```

**Worker 3: Phase 15c - Form Validation** (3h)

```bash
Directory: /Users/ben/dev/co/phase-15c
Branch: refactor/phase-15c-form-validation
Files:
  - app/composables/useFormValidation.ts (new)
  - Auth forms (modified)
  - Admin forms (modified)
Lines: ~100 new lines, refactor 5 forms
```

**Worker 4: Phase 15d - Documentation** (1h)

```bash
Directory: /Users/ben/dev/co/phase-15d
Branch: docs/phase-15d-dependency-graph
Files: app/composables/README.md (enhanced)
Lines: Add ~50 lines to README
```

---

## Execution Command Template

### Wave 1: Phase 12 (5 workers)

```bash
# Setup worktrees
cd /Users/ben/dev/co/staging.mortality.watch
git worktree add ../phase-12a -b test/phase-12a-stripe-webhook-tests master
git worktree add ../phase-12b -b test/phase-12b-chart-renderer-tests master
git worktree add ../phase-12c -b test/phase-12c-auth-tests master
git worktree add ../phase-12d -b perf/phase-12d-chart-config-cache master
git worktree add ../phase-12f -b perf/phase-12f-baseline-cache master

# Launch 5 parallel agents (use Task tool)
# Agent 1: Phase 12a - Stripe webhook tests
# Agent 2: Phase 12b - Chart renderer tests
# Agent 3: Phase 12c - Auth utility tests
# Agent 4: Phase 12d - Chart config caching
# Agent 5: Phase 12f - Baseline caching

# After Wave 1 merges, setup Phase 12g
git worktree add ../phase-12g -b refactor/phase-12g-admin-memoization master
# Launch 1 agent: Phase 12g
```

### Wave 2: Phase 14 (5 workers)

```bash
# After Phase 12a-12f merge
git worktree add ../phase-14a -b test/phase-14a-admin-tests master
git worktree add ../phase-14b -b test/phase-14b-validation-tests master
git worktree add ../phase-14c -b test/phase-14c-chartconfig-tests master
git worktree add ../phase-14d -b docs/phase-14d-jsdoc-chart-explorer master
git worktree add ../phase-14f -b docs/phase-14f-jsdoc-validation-auth-readme master

# Launch 5 parallel agents
```

### Wave 3: Phase 13 (4 workers)

```bash
# After Phase 12g merges, rebase on latest master
git worktree add ../phase-13b -b refactor/phase-13b-split-chart-png master
git worktree add ../phase-13f -b refactor/phase-13f-event-handler-types master
git worktree add ../phase-13g -b refactor/phase-13g-api-types master
git worktree add ../phase-13h -b refactor/phase-13h-structured-logging master

# Launch 4 parallel agents

# After above merge
git worktree add ../phase-13a -b refactor/phase-13a-file-splits-types master
# Launch 1 agent: Phase 13a
```

### Wave 4: Phase 15 (4 workers)

```bash
# After Phase 13 completes
git worktree add ../phase-15a -b refactor/phase-15a-dataloader-service master
git worktree add ../phase-15b -b refactor/phase-15b-error-recovery master
git worktree add ../phase-15c -b refactor/phase-15c-form-validation master
git worktree add ../phase-15d -b docs/phase-15d-dependency-graph master

# Launch 4 parallel agents
```

---

## Summary

| Wave      | Phase     | Workers       | Parallel Time | Sequential Time | Total Effort |
| --------- | --------- | ------------- | ------------- | --------------- | ------------ |
| 1         | 12        | 5 + 1         | 8h + 6h       | 14h             | 32h          |
| 2         | 14        | 5             | 8h            | 8h              | 28h          |
| 3         | 13        | 4 + 1         | 4h + 12h      | 16h             | 24h          |
| 4         | 15        | 4             | 6h            | 6h              | 14h          |
| **Total** | **12-15** | **19 agents** | **42h**       | **44h**         | **98h**      |

**Efficiency Gain**: 98h effort → 44h elapsed (2.2x speedup with parallelization)

---

## Validation Checklist (Per Worker)

Each agent must verify:

- [ ] `npm install` - Dependencies installed
- [ ] `npm run lint` - No linting errors
- [ ] `npm run typecheck` - No type errors
- [ ] `npm run test` - All unit tests pass
- [ ] `npm run test:e2e` - All E2E tests pass (if applicable)
- [ ] `npm run build` - Production build succeeds
- [ ] Commit message follows convention
- [ ] PR created with detailed description
- [ ] CI passes (GitHub Actions)

---

## Risk Mitigation

1. **File Conflicts**: Wave structure ensures no concurrent edits to same files
2. **Test Failures**: Each agent runs full test suite before pushing
3. **Integration Issues**: E2E tests catch cross-phase integration problems
4. **Merge Conflicts**: Sequential waves wait for previous wave PRs to merge
5. **CI Failures**: Agents must fix failures before next wave starts

---

**End of Parallelization Plan**
