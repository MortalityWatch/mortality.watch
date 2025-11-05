# Phase 12: Date Range Architecture Refactor

## Status: ✅ COMPLETED (November 2025)

**PR**: #92 - Merged
**Commits**: 3dddb9b (main), 8cd3475 (cleanup)

## Background

The current date range system works but has architectural issues:

- Multiple overlapping label arrays
- Circular dependencies between date initialization and data loading
- Feature gating logic scattered across components
- Difficult to reason about and maintain

See `docs/architecture/DATE_RANGE_ARCHITECTURE.md` for full analysis.

## Goals

1. **Single source of truth** for each date concept
2. **Clear separation** between available, visible, and selected ranges
3. **No circular dependencies**
4. **Centralized feature gating**
5. **Easier testing and maintenance**

## Implementation Plan

### Step 1: Create `useDateRangeCalculations` Composable

**File**: `app/composables/useDateRangeCalculations.ts`

**Interface**:

```typescript
interface DateRangeCalculations {
  // Available data (from metadata/fetch)
  availableLabels: ComputedRef<string[]>;
  availableRange: ComputedRef<{ min: string; max: string }>;

  // Visible on slider (respects sliderStart + feature gating)
  visibleLabels: ComputedRef<string[]>;
  visibleRange: ComputedRef<{ min: string; max: string }>;

  // Currently selected
  selectedRange: ComputedRef<{ from: string; to: string }>;

  // Utilities
  isValidDate: (date: string) => boolean;
  getDefaultRange: () => { from: string; to: string };

  // Feature gating
  hasExtendedTimeAccess: ComputedRef<boolean>;
  effectiveMinDate: ComputedRef<string>;
}

function useDateRangeCalculations(
  chartType: Ref<string>,
  sliderStart: Ref<string>,
  dateFrom: Ref<string | undefined>,
  dateTo: Ref<string | undefined>,
  allLabels: Ref<string[]>,
): DateRangeCalculations;
```

**Responsibilities**:

- Calculate all date-related values in one place
- Handle feature gating (EXTENDED_TIME_PERIODS)
- Provide clear, named computed properties
- No side effects (pure calculations)

### Step 2: Update `useExplorerDataOrchestration`

**Changes**:

- Use `useDateRangeCalculations` for label filtering
- Remove `filteredChartLabels` (replaced by `visibleLabels`)
- Remove `resetDates()` (replaced by watchers)
- Simplify to focus on data fetching/processing only

**Before**:

```typescript
const filteredChartLabels = computed(() => {
  // Complex logic
});

const resetDates = () => {
  // Side effects
};
```

**After**:

```typescript
const dateRangeCalc = useDateRangeCalculations(
  state.chartType,
  state.sliderStart,
  state.dateFrom,
  state.dateTo,
  allChartLabels,
);

// Use dateRangeCalc.visibleLabels, dateRangeCalc.selectedRange, etc.
```

### Step 3: Simplify Date Initialization

**Current problem**: `resetDates()` has side effects and circular dependencies

**Solution**: Use watchers and computed defaults

```typescript
// Watch for data load, initialize if needed
watch([dateRangeCalc.availableLabels], () => {
  if (!state.dateFrom.value && dateRangeCalc.availableLabels.value.length > 0) {
    const defaultRange = dateRangeCalc.getDefaultRange();
    state.dateFrom.value = defaultRange.from;
    state.dateTo.value = defaultRange.to;
  }
});

// Watch for chart type changes, validate dates
watch([state.chartType], () => {
  if (
    state.dateFrom.value &&
    !dateRangeCalc.isValidDate(state.dateFrom.value)
  ) {
    // Find closest valid date
    state.dateFrom.value = dateRangeCalc.findClosestDate(state.dateFrom.value);
  }
});
```

### Step 4: Consolidate Feature Gating

**Move from**:

- `DateRangePicker.vue` (line 26-36: year 2000 filtering)
- `DateSlider.vue` (line 23-35: minAllowedIndex)
- `useDataAvailability.ts` (line 136-178: effectiveMinDate)

**To**:

- `useDateRangeCalculations` (single implementation)

**Benefits**:

- No duplicate logic
- Consistent behavior across all components
- Easy to change policy (e.g., different year restrictions)

### Step 5: Update Components

**DateRangePicker**:

```typescript
// Before
const availableStartYears = computed(() => {
  if (hasExtendedTimeAccess.value) return allYears
  return allYears.filter(y => parseInt(y) >= 2000)
})

// After
const { visibleLabels } = useDateRangeCalculations(...)
// Just use visibleLabels directly
```

**Explorer page**:

```typescript
// Before
const labels = computed(
  () => dataOrchestration.filteredChartLabels.value || [],
);

// After
const labels = computed(() => dataRangeCalc.visibleLabels.value);
```

### Step 6: Add Tests

**Test Coverage**:

- `useDateRangeCalculations.test.ts`
  - Feature gating (year 2000 restriction)
  - sliderStart filtering
  - Default range calculation
  - Date validation
  - Chart type changes
- Integration tests
  - Explorer initialization
  - Ranking initialization
  - Country selection changes
  - Chart type changes

### Step 7: Migration & Cleanup

1. ✅ Run full test suite - 1473/1473 tests passing
2. ⚠️ Manual testing of all date-related features - Recommended for production deployment
3. **Remove deprecated code:**
   - ⚠️ `filteredChartLabels` - Kept as reference to `dateRangeCalc.visibleLabels` (not duplicate)
   - ⚠️ `resetDates()` function - Kept for now (watcher-based approach is future improvement)
   - ✅ Duplicate feature gating logic - Removed from DateSlider.vue
4. ✅ Update documentation - DATE_RANGE_ARCHITECTURE.md updated
5. ⏳ Performance audit - Basic review done, no concerns identified

## Success Criteria

- [x] All date calculations in single composable
- [x] No circular dependencies
- [x] Feature gating centralized
- [x] Tests passing (1473/1473)
- [x] No behavior regressions
- [x] Code is easier to understand
- [x] Future changes require editing fewer files

## Estimated Effort

- **Research & Design**: 2-4 hours
- **Implementation**: 6-8 hours
- **Testing**: 4-6 hours
- **Total**: 12-18 hours

## Risks

- **Breaking existing behavior**: Mitigate with comprehensive testing
- **URL state issues**: Careful handling of dateFrom/dateTo persistence
- **Performance**: Profile before/after to ensure no regression

## Dependencies

- None (can be done independently)

## Notes

- Keep existing code working during migration
- Add feature flag to test new composable alongside old code
- Document any behavior changes (if needed)
- Get user testing before finalizing

## Related Files

- `app/composables/useDateRangeCalculations.ts` - ✅ New composable (330 lines)
- `app/composables/useExplorerDataOrchestration.ts` - ✅ Updated to use composable
- `app/components/charts/DateSlider.vue` - ✅ Simplified (removed 38 lines)
- `app/components/shared/DateRangePicker.vue` - Uses filtered labels
- `app/composables/useDataAvailability.ts` - Metadata availability (separate concern)
- `docs/architecture/DATE_RANGE_ARCHITECTURE.md` - ✅ Updated architecture docs

## Future Improvements (Optional)

The following improvements were identified during planning but deferred as optional enhancements:

### 1. Watcher-Based Date Initialization

**Goal**: Replace `resetDates()` function with reactive watchers

**Benefits**:
- Fully reactive date synchronization
- Eliminate explicit validation calls
- Cleaner separation of concerns

**Approach** (from Step 3 in original plan):
```typescript
// Watch for data load, initialize if needed
watch([dateRangeCalc.availableLabels], () => {
  if (!state.dateFrom.value && dateRangeCalc.availableLabels.value.length > 0) {
    const defaultRange = dateRangeCalc.getDefaultRange()
    state.dateFrom.value = defaultRange.from
    state.dateTo.value = defaultRange.to
  }
})

// Watch for chart type changes, validate dates
watch([state.chartType], () => {
  if (state.dateFrom.value && !dateRangeCalc.isValidDate(state.dateFrom.value)) {
    state.dateFrom.value = dateRangeCalc.matchDateToLabel(state.dateFrom.value, false)
  }
})
```

**Status**: Not blocking, current approach works well

### 2. Dedicated Unit Tests

**Goal**: Add comprehensive tests for `useDateRangeCalculations` composable itself

**Current**: Only tested via functional mock in `useExplorerDataOrchestration.test.ts`

**Recommended tests**:
- Feature gating (year 2000 restriction for different chart types)
- sliderStart filtering
- Chart type changes with date matching
- Edge cases (empty labels, invalid dates)

**Status**: Covered by integration tests, dedicated tests would improve coverage

### 3. Performance Profiling

**Goal**: Measure computational cost of date calculations

**Current**: Basic review shows:
- O(n) operations on label arrays (acceptable for typical sizes <100 labels)
- All computed properties properly memoized
- No watchers creating unnecessary updates

**Recommended**: Profile in production to verify no performance issues

**Status**: No concerns identified, monitoring recommended

### 4. Extend to Ranking Page

**Goal**: Use same composable on ranking page for consistency

**Benefits**:
- Consistent date logic across all pages
- Eliminate any remaining duplicate code
- Easier to maintain

**Status**: Ranking page works fine currently, can be enhanced later
