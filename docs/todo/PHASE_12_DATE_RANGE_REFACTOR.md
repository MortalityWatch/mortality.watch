# Phase 12: Date Range Architecture Refactor

## Status: Planned

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

1. Run full test suite
2. Manual testing of all date-related features
3. Remove deprecated code:
   - `filteredChartLabels` from useExplorerDataOrchestration
   - `resetDates()` function
   - Duplicate feature gating logic
4. Update documentation
5. Performance audit (check for unnecessary re-renders)

## Success Criteria

- [ ] All date calculations in single composable
- [ ] No circular dependencies
- [ ] Feature gating centralized
- [ ] Tests passing
- [ ] No behavior regressions
- [ ] Code is easier to understand
- [ ] Future changes require editing fewer files

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

- `app/composables/useExplorerDataOrchestration.ts` - Current implementation
- `app/composables/useDataAvailability.ts` - Metadata availability
- `app/components/shared/DateRangePicker.vue` - UI component
- `app/components/charts/DateSlider.vue` - Slider component
- `docs/architecture/DATE_RANGE_ARCHITECTURE.md` - Architecture docs
