# Known Issues & Bugs

**Total:** 24 issues across 4 areas

**Priority Legend:**

- 🔴 **Critical** - Breaks core functionality
- 🟡 **High** - Significant usability issue
- 🟢 **Medium** - Quality of life improvement
- 🔵 **Low** - Nice to have

---

## Bug Fix Plan: Hybrid 3-Phase Approach with Parallel Worktrees

**Estimated Timeline:** 3-5 days total
**Execution Strategy:** Parallel worktrees with independent PRs per phase

### Parallel Worktree Process

**Setup:**

1. Read this plan to understand phases and dependencies
2. Identify parallelizable work (marked with 🔄 below)
3. Create worktrees: `git worktree add ../bug-fix-phase-X -b fix/phase-X-description master`
4. Launch agents in parallel using Task tool (one agent per worktree)

**Agent Requirements:**

- Complete full implementation in assigned worktree
- Run: `npm install && npm run check && npm run test:e2e`
- Commit: `fix: Phase X - [description]` or `feat: Phase X - [description]`
- Push and create PR with CI passing
- Report: line changes, test results, PR URL

**Key Principles:**

- Each PR is small, focused, independently mergeable
- All tests must pass before pushing
- Monitor CI - fix failures immediately
- After merge: fetch/pull, identify next phases, repeat

---

### Phase 1: Quick Wins + Investigation (~2-4 hours)

**🔄 Parallel Execution (3 worktrees):**

**Worktree 1 - Quick Fixes** `fix/phase-1a-quick-wins`

- Working Dir: `../bug-fix-phase-1a`
- Branch: `fix/phase-1a-quick-wins`
- [ ] GAL-5: Capitalize "explorer" label (5 min)
- [ ] RNK-2: Standardize "Percentage" terminology (15 min)
- [ ] EX-8: Gate caption feature for Pro users (20 min)
- **Validation:** All linting/tests pass
- **Commit:** `fix: Quick wins - capitalization, terminology, feature gating`
- **PR Title:** `fix: Quick wins - UI consistency and feature gating`

**Worktree 2 - Investigation** `docs/phase-1b-investigation`

- Working Dir: `../bug-fix-phase-1b`
- Branch: `docs/phase-1b-investigation`
- [ ] EX-4: Audit state updates (document findings in docs/investigations/)
- [ ] GAL-4: Investigate no charts (database/query analysis)
- [ ] EX-11: Test cumulative + percentage with excess (document results)
- **Validation:** Documentation complete with reproduction steps
- **Commit:** `docs: Investigation reports for EX-4, GAL-4, EX-11`
- **PR Title:** `docs: Bug investigation reports - state updates, gallery data, excess mode`

**Worktree 3 - Issue Verification** `docs/phase-1c-verification`

- Working Dir: `../bug-fix-phase-1c`
- Branch: `docs/phase-1c-verification`
- [ ] RNK-1: Reproduce ASMR error (document steps)
- [ ] EX-1: Verify back/forward behavior (document expected vs actual)
- [ ] Create reproduction test cases if possible
- **Validation:** Clear reproduction steps documented
- **Commit:** `docs: Issue verification for RNK-1 and EX-1`
- **PR Title:** `docs: Reproduction steps for ASMR and navigation bugs`

**Phase 1 Complete When:** All 3 PRs merged, investigation reports ready for Phase 2

---

### Phase 2: Critical Fixes (~1-2 days)

**Group A - Explorer Critical (Sequential within worktree):**

**Worktree 4 - Explorer Criticals** `fix/phase-2a-explorer-critical`

- Working Dir: `../bug-fix-phase-2a`
- Branch: `fix/phase-2a-explorer-critical`
- Sequential Tasks (complete in order):
  1. [ ] EX-4: Fix state updates (based on Phase 1 investigation)
  2. [ ] EX-1: Fix back/forward navigation
  3. [ ] EX-11: Fix cumulative + percentage (if broken)
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `fix: Explorer critical bugs - navigation and state management`
- **PR Title:** `fix: Critical Explorer bugs - back/forward navigation and state updates`

**🔄 Parallel with Group A:**

**Worktree 5 - Gallery Criticals** `fix/phase-2b-gallery-critical`

- Working Dir: `../bug-fix-phase-2b`
- Branch: `fix/phase-2b-gallery-critical`
- [ ] GAL-4: Fix "All Charts" data issue (root cause from investigation)
- [ ] GAL-1: Fix View Chart page rendering
- [ ] GAL-2 & GAL-3: Fix filter dropdowns
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `fix: Gallery critical bugs - chart display and filters`
- **PR Title:** `fix: Critical Gallery bugs - data loading and view pages`

**Worktree 6 - Ranking Critical** `fix/phase-2c-ranking-critical`

- Working Dir: `../bug-fix-phase-2c`
- Branch: `fix/phase-2c-ranking-critical`
- [ ] RNK-1: Fix ASMR error on load (based on Phase 1 verification)
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `fix: Ranking ASMR error on page load`
- **PR Title:** `fix: Ranking page ASMR error with CMR selected`

**Phase 2 Complete When:** All critical (🔴) bugs resolved, PRs merged, app stable

---

### Phase 3: Features & Enhancements (~2-3 days)

**🔄 Parallel Execution (4 worktrees):**

**Worktree 7 - Pro Features** `feat/phase-3a-pro-features`

- Working Dir: `../bug-fix-phase-3a`
- Branch: `feat/phase-3a-pro-features`
- [ ] EX-12: Complete Z-Score feature
  - [ ] Add Pro feature gating (Tier 2)
  - [ ] Fix chart display rendering
  - [ ] Add ±2σ and ±3σ reference lines (Chart.js annotations)
- [ ] EX-3: Show grayed-out dates for non-premium users
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `feat: Pro features - z-score completion and premium date UX`
- **PR Title:** `feat: Complete Z-Score feature and enhance premium UX`

**Worktree 8 - UX Improvements** `feat/phase-3b-ux-improvements`

- Working Dir: `../bug-fix-phase-3b`
- Branch: `feat/phase-3b-ux-improvements`
- [ ] EX-7: Improve save button UX (disable after save, confirmation)
- [ ] EX-9: Fix toggle interaction with Excess mode
- [ ] EX-10: Add smart defaults for Excess mode
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `feat: UX improvements - save button, toggle logic, excess defaults`
- **PR Title:** `feat: Explorer UX improvements - save flow and excess mode`

**Worktree 9 - Chart Enhancements** `feat/phase-3c-chart-enhancements`

- Working Dir: `../bug-fix-phase-3c`
- Branch: `feat/phase-3c-chart-enhancements`
- [ ] EX-5: Fix logo/QR code theme support
- [ ] EX-6: Auto-hide labels for busy charts
- [ ] RNK-5: Add server-side rendering for ranking charts
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `feat: Chart enhancements - theme support, auto-hide labels, SSR`
- **PR Title:** `feat: Chart rendering improvements - theming and label management`

**Worktree 10 - Gallery & Dashboard** `feat/phase-3d-gallery-dashboard`

- Working Dir: `../bug-fix-phase-3d`
- Branch: `feat/phase-3d-gallery-dashboard`
- [ ] MC-1: Extract shared filter components
- [ ] MC-2: Add public/private toggle for saved charts
- [ ] RNK-3: Extend ranking date range to 2010+
- [ ] RNK-4: Auto-suggest chart titles
- **Validation:** `npm run check && npm run test:e2e`
- **Commit:** `feat: Gallery and dashboard improvements - filters, visibility, titles`
- **PR Title:** `feat: Gallery and My Charts enhancements - filters and UX`

**Phase 3 Complete When:** All features complete, all PRs merged, all bugs resolved

---

### Deferred Items (Discussion Required)

- [ ] EX-2: Theme switcher behavior simplification (design decision)

---

**Progress Tracking:**

- Phase 1: ⬜ Not Started
- Phase 2: ⬜ Not Started
- Phase 3: ⬜ Not Started

---

## Explorer

### Navigation & State Management

**🔴 EX-1: Browser back/forward doesn't refresh state**

- **Issue:** Using browser back/forward buttons doesn't update the explorer view
- **Expected:** URL changes should trigger state refresh and chart re-render
- **Impact:** Users can't navigate through history properly

**🟡 EX-4: Excessive state updates during initialization**

- **Issue:** `getDefaultRange()` called multiple times on load (see logs below)
- **Impact:** Performance degradation, unnecessary re-renders
- **Example:**
  ```
  [MetadataService] Date range: fluseason, countries: ["USA"]
  [getDefaultRange] totalLabels: 26, startIndex: 16 (called 3x)
  ```
- **Next Steps:** Audit useExplorerDataOrchestration and useDateRangeCalculations for redundant calls

### Feature Gating & Premium Features

**🟢 EX-3: Show pre-2000 dates as disabled for non-premium users**

- **Issue:** Pre-2000 dates are completely hidden from non-premium users
- **Expected:** Show all dates in dropdowns/slider, but gray out pre-2000 options with upgrade CTA
- **Benefit:** Better discoverability of premium feature value
- **Implementation:** Modify DateRangePicker and DateSlider to show disabled options

**🔵 EX-8: Make "Show Caption" a premium feature**

- **Issue:** Caption feature should be gated for premium users only
- **Files:** ExplorerSettings.vue, feature flags

### Chart Rendering & Display

**🟡 EX-5: Chart logo and QR code not respecting theme**

- **Issue:** Logo/QR code in exported charts don't adapt to dark mode
- **Impact:** Visual inconsistency in saved/exported charts
- **Files:** chartRenderer.ts, chart export logic

**🟢 EX-6: Auto-hide labels for charts with many data points**

- **Issue:** Charts become cluttered when showing labels for 50+ points
- **Suggestion:** Auto-disable labels based on data points / chart width ratio
- **Example:** If `dataPoints > (chartWidth / 20)`, default to labels off
- **Files:** ExplorerSettings.vue, chart configuration logic

### User Experience Issues

**🟡 EX-7: Unclear UX for already-saved charts**

- **Issue:** Save button remains enabled after saving, users don't know chart is saved
- **Suggestions:**
  - Disable save button after successful save
  - Change to "Update Chart" if modifications made
  - Show "Saved!" confirmation with link to chart
- **Files:** useSaveChart.ts, ExplorerSettings.vue

**🟡 EX-9: Toggle interaction issue with Excess mode**

- **Issue:** When baseline + 95% PI enabled, enabling Excess requires 3 clicks
- **Reason:** First two clicks disable incompatible options before Excess activates
- **Expected:** Single click should handle all toggle dependencies automatically
- **Files:** ExplorerSettings.vue, state effect handlers

**🟢 EX-10: Excess mode should have smart defaults**

- **Issue:** Excess mode doesn't auto-adjust chart style and display mode
- **Expected:** When enabling Excess, automatically switch to:
  - Bar chart style (from line)
  - Percentage display mode
- **Note:** Only apply defaults if user hasn't manually overridden these settings
- **Files:** StateEffects.ts, explorer state management

### Functionality Bugs

**🔴 EX-11: Cumulative + Percentage mode broken with Excess**

- **Issue:** Enabling both Cumulative and Percentage with Excess enabled produces incorrect/no data
- **URL:** http://localhost:3000/explorer?pi=0&sb=0&e=1&lg=0&sl=1&cap=0&m=1&p=1&ce=1
- **Status:** Needs testing (may be affected by recent refactoring)
- **Impact:** Users can't use cumulative percentage view in excess mode

### Design Decisions

**🔵 EX-2: Simplify theme switcher behavior?**

- **Current:** Theme preference stored in localStorage with manual override
- **Proposal:** Always default to system theme, allow session-only override (no storage)
- **Question:** Should we keep current behavior or simplify?
- **Discussion needed:** Weigh user convenience vs. privacy/simplicity

### Incomplete Features

**🟡 EX-12: Z-Score feature needs completion**

- **PR:** https://github.com/MortalityWatch/mortality.watch/pull/57 (Draft, reopened)
- **Status:** Core implementation done but needs refinement
- **Issues:**
  1. **Feature Gating:** Z-score toggle must be behind Pro (Tier 2) feature gate
  2. **Chart Display:** Z-score visualization not rendering properly
  3. **Standard Deviation Lines:** Need to add reference lines for ±2σ and ±3σ thresholds
- **Implementation Options:**
  - Use Chart.js annotation plugin for reference lines
  - Manually add horizontal lines at z = -3, -2, 0, +2, +3
- **Background:**
  - Backend R API calculates z-scores as standardized residuals
  - Frontend receives pre-calculated `_zscore` fields
  - Y-axis relabels to "Z-Score (Standard Deviations)" when active
- **Files:** DisplayTab.vue, chart transformation pipeline, baseline calculation
- **Tests:** 49 tests passing, but chart rendering needs visual verification

---

## Ranking Page

**🔴 RNK-1: ASMR error on load despite CMR being selected**

- **Issue:** Page throws ASMR-related error even when CMR is active
- **URL:** http://localhost:3000/ranking?pp=10&pg=3&sp=usa&j=usa&a=0
- **Error:** [Include specific error message]
- **Impact:** Page may not load properly for certain URL combinations
- **Files:** ranking.vue, useRankingData.ts

**🟡 RNK-2: Inconsistent terminology - "Relative" vs "Percentage"**

- **Issue:** Ranking page uses "Relative", Explorer uses "Percentage" for same concept
- **Decision needed:** Which term should be standard across app?
- **Recommendation:** Use "Percentage" (more intuitive for users)
- **Files:** RankingDataSelection.vue, ExplorerSettings.vue, state schemas

**🟢 RNK-3: Date range limited to 2020+ (should allow 2010+)**

- **Issue:** "From" date dropdown only shows 2020 onward
- **Expected:** Should allow 2010+ like Explorer (with feature gating for pre-2000)
- **Reason:** More consistent with Explorer behavior
- **Files:** RankingDataSelection.vue, useRankingData.ts

**🟢 RNK-4: Auto-suggest chart titles when saving**

- **Issue:** Title field empty when saving ranking charts
- **Suggestion:** Generate default title from selected options
- **Example:** "USA vs GBR - All Ages - 2020-2023"
- **Format:** `{countries} - {ageGroup} - {dateRange}`
- **Files:** useSaveChart.ts, ranking.vue

**🟡 RNK-5: Missing server-side rendering for ranking charts**

- **Issue:** No ranking.png generation for chart gallery previews
- **Expected:** Server should generate preview images for ranking charts like explorer
- **Impact:** Ranking charts can't be properly previewed in chart gallery
- **Files:** server/api/charts/[id]/ranking.png.ts (needs creation)

---

## Chart Gallery

**🔴 GAL-1: "View Chart" page not loading**

- **Issue:** Clicking "View Chart" doesn't render chart detail page
- **URL:** http://localhost:3000/charts/sweden-vs-usa-1762269272917
- **Expected:** Should show full-size chart with options to fork/download
- **Files:** pages/charts/[id].vue or equivalent

**🟡 GAL-2: Filter dropdown shows only "featured"**

- **Issue:** First dropdown only displays "featured" option, missing other filters
- **Expected:** Should include: Featured, Recent, Popular, Most Viewed
- **Files:** Chart gallery filter component

**🟡 GAL-3: Chart type dropdown has no data**

- **Issue:** Chart type filter is empty
- **Expected:** Should show: Explorer, Ranking (future: other chart types)
- **Files:** Chart gallery filter component

**🟡 GAL-4: "All Charts" view has no data**

- **Issue:** Main gallery view shows no charts
- **Possible causes:**
  - No public charts in database
  - Query filtering too restrictive
  - Pagination issue
- **Files:** pages/charts/index.vue, chart gallery API

**🔵 GAL-5: Inconsistent label capitalization**

- **Issue:** "explorer" label should be "Explorer" (capitalized)
- **Impact:** Minor visual inconsistency
- **Files:** Chart gallery UI components

---

## My Charts (User Dashboard)

**🟢 MC-1: Duplicate filter functionality with Chart Gallery**

- **Issue:** My Charts page should reuse Chart Gallery filter components
- **Benefit:** Code reuse, consistency, easier maintenance
- **Suggestion:** Extract shared filter components to /components/charts/filters/
- **Files:** pages/my-charts.vue, chart gallery components

**🟡 MC-2: Missing public/private toggle for saved charts**

- **Issue:** Users can't change private charts to public after creation
- **Expected:** Show toggle switch to change visibility
- **Implementation:** Add toggle in chart card, call update API
- **Files:** My Charts UI components, chart update API

---

## Development Notes

### Testing Priority

1. Test EX-11 (Cumulative + Percentage + Excess) after recent refactoring
2. Complete EX-12 (Z-Score feature) - feature gating and chart display
3. Verify RNK-1 (ASMR error) can be reproduced
4. Investigate GAL-1 (View Chart not loading)

### Quick Wins (Easy Fixes)

- GAL-5: Capitalize "explorer" label
- RNK-2: Standardize "Percentage" terminology
- MC-2: Add public/private toggle

### Needs Discussion

- EX-2: Theme switcher behavior
- EX-3: Show grayed out dates (approved)
- RNK-2: "Relative" vs "Percentage" terminology

### Requires Investigation

- EX-4: State update audit
- GAL-4: Why no charts showing
