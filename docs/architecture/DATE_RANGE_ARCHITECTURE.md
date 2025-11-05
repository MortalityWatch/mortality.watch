# Date Range Architecture

## Current State (After Phase 12 Refactor - November 2025)

### Overview

The date range system has been refactored to use a **single source of truth** composable that manages three distinct concepts:

1. **Available Data Range** - What exists in the database
2. **Visible Slider Range** - What the user can select from (respects sliderStart + feature gating)
3. **Selected Range** - What's actually displayed on charts

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ useDateRangeCalculations (Single Source of Truth)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input:                                                     │
│  - chartType: Ref<string>                                   │
│  - sliderStart: Ref<string | null>                          │
│  - dateFrom: Ref<string | null | undefined>                 │
│  - dateTo: Ref<string | null | undefined>                   │
│  - allLabels: Ref<string[]>                                 │
│                                                             │
│  Output:                                                    │
│  ┌───────────────────────────────────────────────────┐    │
│  │ availableLabels → visibleLabels → selectedRange   │    │
│  │      (all data)      (slider)        (chart)      │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Feature Gating:                                           │
│  - hasExtendedTimeAccess (EXTENDED_TIME_PERIODS feature)   │
│  - effectiveMinDate (year 2000 restriction for non-premium)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. useDateRangeCalculations Composable

**Location**: `app/composables/useDateRangeCalculations.ts`

**Purpose**: Centralized date range calculations with no side effects

**Interface**:
```typescript
interface DateRangeCalculations {
  // Available data (from metadata/fetch)
  availableLabels: ComputedRef<string[]>
  availableRange: ComputedRef<{ min: string, max: string } | null>

  // Visible on slider (respects sliderStart + feature gating)
  visibleLabels: ComputedRef<string[]>
  visibleRange: ComputedRef<{ min: string, max: string } | null>

  // Currently selected
  selectedRange: ComputedRef<{ from: string | null, to: string | null }>

  // Utilities
  isValidDate: (date: string) => boolean
  getDefaultRange: () => { from: string, to: string }
  findClosestYearLabel: (targetYear: string, preferLast?: boolean) => string | null
  matchDateToLabel: (currentDate: string | null | undefined, preferLast: boolean) => string | null

  // Feature gating
  hasExtendedTimeAccess: ComputedRef<boolean>
  effectiveMinDate: ComputedRef<string | null>
}
```

**Key Features**:
- Pure computed properties (no side effects)
- Automatic feature gating (year 2000 restriction)
- Smart label matching for chart type changes
- Fallback handling for edge cases

#### 2. Feature Gating Logic

**Year 2000 Restriction** (for non-premium users):

```typescript
const effectiveMinDate = computed(() => {
  if (hasExtendedTimeAccess.value) {
    return dataMinDate  // Premium users see all data
  }

  // Non-premium users restricted to year 2000+
  const year2000Start = getYear2000Start(chartType.value)
  return max(dataMinDate, year2000Start)
})
```

**Chart Type Specific Start Dates**:
- `yearly`: `'2000'`
- `fluseason/midyear`: `'1999/00'` (earliest period containing year 2000 data)
- `quarterly`: `'2000 Q1'`
- `monthly`: `'2000 Jan'`
- `weekly`: `'2000-W01'`

#### 3. Data Flow

```
1. Data Fetch
   └─> allChartLabels updated
       └─> useDateRangeCalculations recalculates
           ├─> availableLabels (all data)
           ├─> effectiveMinDate (with feature gating)
           ├─> visibleLabels (filtered by sliderStart + year 2000)
           └─> DateSlider receives pre-filtered labels

2. User Changes Chart Type
   └─> chartType updated
       └─> useDateRangeCalculations recalculates
           ├─> effectiveMinDate updates (new format)
           ├─> visibleLabels updates
           └─> resetDates() validates existing selection
               ├─> matchDateToLabel() tries to preserve year
               └─> Falls back to default range if needed

3. User Changes Slider
   └─> sliderStart updated
       └─> useDateRangeCalculations recalculates
           └─> visibleLabels updates (new start index)
```

### Component Integration

#### Explorer Page

```typescript
const dataOrchestration = useExplorerDataOrchestration(...)

// visibleLabels is used for slider range
const labels = computed(() => dataOrchestration.filteredChartLabels.value)

// Passed to DateSlider (already filtered)
<DateSlider :labels="labels" ... />
```

#### DateSlider Component

**Before Refactor** (removed):
```typescript
// ❌ Duplicate feature gating logic
const { can } = useFeatureAccess()
const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))
const minAllowedIndex = computed(() => {
  // Filter for year 2000...
})
```

**After Refactor**:
```typescript
// ✅ Receives pre-filtered labels
props.labels // Already respects sliderStart and feature gating
```

#### useExplorerDataOrchestration

**Integration**:
```typescript
const dateRangeCalc = useDateRangeCalculations(
  state.chartType,
  state.sliderStart,
  state.dateFrom,
  state.dateTo,
  allChartLabels
)

// Export visibleLabels for slider
const filteredChartLabels = dateRangeCalc.visibleLabels

// Use utilities for validation
const resetDates = () => {
  if (dateRangeCalc.isValidDate(state.dateFrom.value ?? '')) {
    return // Current selection is valid
  }

  const { from, to } = dateRangeCalc.getDefaultRange()
  const matchedFrom = dateRangeCalc.matchDateToLabel(state.dateFrom.value, false) ?? from
  // ...
}
```

### Eliminated Issues

#### Before Refactor:

1. **Duplicate Feature Gating** - Year 2000 logic in 3 places:
   - ❌ DateRangePicker.vue (lines 26-36)
   - ❌ DateSlider.vue (lines 23-35)
   - ❌ useDataAvailability.ts (lines 136-178)

2. **Circular Dependencies**:
   - ❌ `allChartData.labels` depends on `dateFrom/dateTo`
   - ❌ `resetDates()` uses `allChartData.labels`

3. **Complex Initialization**:
   - ❌ Side effects in `resetDates()`
   - ❌ Multiple label arrays to track

#### After Refactor:

1. **Single Feature Gating**:
   - ✅ All logic in `useDateRangeCalculations.effectiveMinDate`
   - ✅ Components receive pre-filtered data

2. **Clear Data Flow**:
   - ✅ `availableLabels` → `visibleLabels` → `selectedRange`
   - ✅ No circular dependencies

3. **Simpler Components**:
   - ✅ DateSlider: Removed 38 lines of duplicate code
   - ✅ useExplorerDataOrchestration: Uses composable utilities

### Testing

**Unit Tests**:
- `useDateRangeCalculations` is mocked in `useExplorerDataOrchestration.test.ts`
- Mock provides functional implementation for test scenarios
- All 1473 tests passing

**Integration**:
- Explorer page initialization
- Chart type changes
- Country selection changes
- Slider start changes
- Feature gating (premium vs non-premium)

### Future Improvements

#### Potential Optimizations:

1. **Watcher-Based Date Initialization** (Optional):
   - Replace `resetDates()` function with reactive watchers
   - Eliminate need for explicit validation calls
   - Fully reactive date synchronization

2. **Dedicated Unit Tests**:
   - Add comprehensive tests for `useDateRangeCalculations` itself
   - Currently only tested via mock in orchestration tests

3. **Performance Profiling**:
   - Measure computation cost of date calculations
   - Verify no unnecessary re-renders from computed updates

4. **Extended to Ranking Page**:
   - Ranking page can use same composable
   - Consolidate date logic across all pages

### Performance Characteristics

**Computational Complexity**:
- `visibleLabels`: O(n) slice operations on label arrays
- `effectiveMinDate`: O(1) comparisons
- `isValidDate`: O(n) indexOf lookup
- `matchDateToLabel`: O(n) filter operations

**Memory**:
- All computed properties are memoized by Vue
- No unnecessary array copies
- Efficient reactivity updates

**Reactivity**:
- Updates only when input refs change
- No watchers (pure computed approach)
- Minimal re-render cascade

## Related Files

- **Implementation**: `app/composables/useDateRangeCalculations.ts` (330 lines)
- **Usage**: `app/composables/useExplorerDataOrchestration.ts`
- **Components**: `app/components/charts/DateSlider.vue`, `app/components/shared/DateRangePicker.vue`
- **Tests**: `app/composables/useExplorerDataOrchestration.test.ts`
- **Planning**: `docs/todo/PHASE_12_DATE_RANGE_REFACTOR.md`

## Change History

- **November 2025**: Phase 12 Refactor - Created `useDateRangeCalculations` composable
- **Phase 11+**: Previous architecture with scattered logic
