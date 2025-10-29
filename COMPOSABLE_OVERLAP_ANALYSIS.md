# Composable Overlap Analysis

## Overview

After completing Phase 10.1, there is **significant overlap** between explorer and ranking composables. This document analyzes the duplication and proposes consolidation strategies.

## Current State

### Explorer Composables (Phase 9.2)

- `useExplorerState` (468 lines) - State management with Zod validation
- `useExplorerDataOrchestration` (368 lines) - Data fetching and processing
- `useExplorerHelpers` (157 lines) - Helper functions
- `useExplorerDataUpdate` (228 lines) - Additional data update logic

### Ranking Composables (Phase 10.1)

- `useRankingState` (311 lines) - State management with Zod validation
- `useRankingData` (399 lines) - Data fetching and processing
- `useRankingTableSort` (97 lines) - Table sorting logic

### Other Data Composables

- `useChartDataLoader` (199 lines) - Generic chart data loading

## Identified Overlaps

### 1. Data Fetching Pattern ⚠️ HIGH OVERLAP

Both `useExplorerDataOrchestration` and `useRankingData` share:

```typescript
// Common imports
import { getAllChartData, getAllChartLabels, updateDataset } from '@/lib/data'
import { getKeyForType } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'

// Common state
const allLabels = ref<string[]>([])
const allChartData = ref<AllChartData>()
const isUpdating = ref<boolean>(false)

// Common operations
1. Call updateDataset() with filters
2. Call getAllChartLabels() to get labels
3. Call getAllChartData() to fetch processed data
4. Handle loading state
5. Process baseline dates
```

**Lines of duplicated logic**: ~150-200 lines

### 2. Baseline Date Management ⚠️ MEDIUM OVERLAP

Both composables handle:

- Default baseline date calculation
- Baseline date validation
- Baseline date reset logic

```typescript
// Both use
import {
  defaultBaselineFromDate,
  defaultBaselineToDate,
  getSeasonString,
} from "@/model/baseline";

// Both implement similar baseline reset patterns
```

**Lines of duplicated logic**: ~50-80 lines

### 3. Country/Jurisdiction Filtering ⚠️ MEDIUM OVERLAP

Explorer:

```typescript
// Filters by selected countries
const countryFilter = state.countries.value;
```

Ranking:

```typescript
// Filters by jurisdiction type
const countryFilter = Object.keys(metaData.value).filter((iso3c) => {
  if (!shouldShowCountry(iso3c, state.jurisdictionType.value)) {
    return false;
  }
  if (state.showASMR.value) {
    return metaData.value[iso3c]?.has_asmr() ?? false;
  }
  return true;
});
```

**Different logic but same purpose**: Could be unified

### 4. ChartPeriod Usage ⚠️ LOW OVERLAP

Both use `ChartPeriod` for date label management:

```typescript
const period = new ChartPeriod(allLabels.value, chartType);
const startIndex = period.indexOf(dateFrom);
const endIndex = period.indexOf(dateTo);
```

**Lines of duplicated logic**: ~20-30 lines

### 5. Loading State Management ⚠️ LOW OVERLAP

Both implement:

- `isUpdating` flag
- Loading timeout logic (explorer only)
- Progress tracking (ranking only)

**Lines of duplicated logic**: ~30-40 lines

## Duplication Summary

| Pattern           | Explorer | Ranking | Overlap          |
| ----------------- | -------- | ------- | ---------------- |
| Data fetching     | ✅       | ✅      | **High** (80%)   |
| Baseline dates    | ✅       | ✅      | **Medium** (60%) |
| Country filtering | ✅       | ✅      | **Medium** (40%) |
| ChartPeriod usage | ✅       | ✅      | **Low** (50%)    |
| Loading state     | ✅       | ✅      | **Low** (30%)    |

**Total estimated duplication**: 250-350 lines across both composables

## Root Cause Analysis

### Why This Happened

1. **Temporal separation**: Explorer was refactored in Phase 9.2, Ranking in Phase 10.1
2. **Different focuses**: Explorer focuses on chart visualization, Ranking on table generation
3. **Copy-paste evolution**: Ranking composable was created by studying explorer pattern
4. **No shared abstraction**: No common data fetching composable existed

### Why It's a Problem

1. **Maintenance burden**: Bug fixes need to be applied in 2+ places
2. **Inconsistency risk**: Logic can diverge over time
3. **Larger bundle size**: ~300 lines of duplicate code in production bundle
4. **Harder to understand**: Same patterns expressed differently

## Proposed Solution: Phase 10.3

### Option A: Extract Shared Data Fetching Composable ⭐ RECOMMENDED

Create `useChartDataFetcher` composable that both can use:

```typescript
// app/composables/useChartDataFetcher.ts
export function useChartDataFetcher() {
  const allLabels = ref<string[]>([])
  const allChartData = ref<AllChartData>()
  const isUpdating = ref(false)
  const progress = ref(0)

  /**
   * Fetch chart data with filters
   */
  async function fetchData(config: {
    chartType: ChartType
    countries: string[]
    ageGroups: string[]
    dataKey: keyof CountryData
    baselineFrom: string
    baselineTo: string
    baselineMethod: string
    cumulative?: boolean
  }) {
    isUpdating.value = true

    const dataset = await updateDataset(
      config.chartType,
      config.countries,
      config.ageGroups
    )

    allLabels.value = getAllChartLabels(dataset, /* ... */)

    const data = await getAllChartData(
      config.dataKey,
      config.chartType,
      dataset,
      allLabels.value,
      /* ... */,
      (prog, total) => progress.value = Math.round((prog / total) * 100)
    )

    isUpdating.value = false
    return data
  }

  return {
    allLabels,
    allChartData,
    isUpdating,
    progress,
    fetchData
  }
}
```

Then:

- `useExplorerDataOrchestration` uses `useChartDataFetcher`
- `useRankingData` uses `useChartDataFetcher`
- Both add their specific logic on top

**Benefits**:

- ✅ Single source of truth for data fetching
- ✅ Reduces code by ~200 lines total
- ✅ Easier to test (test once, works everywhere)
- ✅ Bug fixes in one place

**Effort**: 2-3 hours

### Option B: Extract Baseline Date Utilities

Create `useBaselineDates` composable:

```typescript
export function useBaselineDates(
  chartType: Ref<string>,
  allLabels: Ref<string[]>,
) {
  function getDefaultBaselineFrom(method: string) {
    return defaultBaselineFromDate(chartType.value, allLabels.value, method);
  }

  function getDefaultBaselineTo() {
    return defaultBaselineToDate(chartType.value);
  }

  function validateAndResetBaseline(
    from: Ref<string>,
    to: Ref<string>,
    method: string,
  ) {
    if (!allLabels.value.includes(from.value)) {
      from.value = getDefaultBaselineFrom(method);
    }
    if (!allLabels.value.includes(to.value)) {
      to.value = getDefaultBaselineTo();
    }
  }

  return {
    getDefaultBaselineFrom,
    getDefaultBaselineTo,
    validateAndResetBaseline,
  };
}
```

**Benefits**:

- ✅ Consistent baseline logic
- ✅ Reduces code by ~100 lines

**Effort**: 1-2 hours

### Option C: Do Nothing (Keep Current State)

**Pros**:

- ✅ No refactoring risk
- ✅ Code already works

**Cons**:

- ❌ Maintenance burden grows
- ❌ Inconsistencies will creep in
- ❌ Larger bundle size

## Recommendation

**Implement Option A (`useChartDataFetcher`) in Phase 10.3**

This provides the best ROI:

- Eliminates ~200 lines of duplication
- Creates reusable abstraction for future features
- Reduces maintenance burden significantly
- Low risk (existing tests validate behavior)

**Estimated effort**: 3-4 hours
**Estimated LOC reduction**: 200-250 lines

## Next Steps

1. ✅ Complete Phase 10.1 (Ranking decomposition) - **DONE**
2. ⏸️ Decide: Phase 10.2 (State Proxy) OR Phase 10.3 (Deduplication)?
3. Document decision and create implementation plan

---

**Note**: This analysis was created as part of Phase 10.1 completion. The duplication exists but is not critical - both systems work correctly. However, addressing it would improve long-term maintainability.
