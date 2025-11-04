# Date Range Architecture

## Current State (As of Phase 11+)

### Overview

The date range system manages three distinct concepts:

1. **Available Data Range** - What exists in the database
2. **Visible Slider Range** - What the user can select from
3. **Selected Range** - What's actually displayed on charts

**Note**: This architecture applies to both the main date range selection and baseline date selection. Both use the same filtering logic via `filteredChartLabels` and benefit from the same fixes.

### Key Components

#### Data Sources

**`allChartLabels` (ref)**

- Location: `useExplorerDataOrchestration.ts`
- Contains: ALL available date labels for selected countries/chart type
- Example: `['1950/51', '1951/52', ..., '2024/25']` for fluseason
- Updated: When data is fetched from server

**`allYearlyChartLabels` (ref)**

- Location: `useExplorerDataOrchestration.ts`
- Contains: Yearly representation of all labels
- For yearly charts: Same as `allChartLabels`
- For other types: Extracted year portion (`['2010', '2011', ...]`)
- Purpose: Used for calculating start indices

**`filteredChartLabels` (computed)**

- Location: `useExplorerDataOrchestration.ts`
- Contains: Labels from `sliderStart` onwards
- Calculation: `allChartLabels.slice(getStartIndex(allYearlyChartLabels, sliderStart))`
- Example: If sliderStart='2010', returns `['2010/11', ..., '2024/25']`
- Purpose: Defines the slider's full range

**`allChartData.labels` (reactive)**

- Location: `useExplorerDataOrchestration.ts`
- Contains: Labels within the selected display range (`dateFrom` to `dateTo`)
- Example: If dateFrom='2015/16', dateTo='2024/25', returns `['2015/16', ..., '2024/25']`
- Purpose: Chart rendering labels
- **Warning**: Circular dependency - created FROM dateFrom/dateTo but used BY resetDates()

#### State Properties

**`sliderStart` (URL state)**

- Default: '2010'
- Purpose: User's choice of earliest date to consider
- Scope: Affects slider range, NOT data fetching
- Feature gating: Can be restricted by EXTENDED_TIME_PERIODS

**`dateFrom` / `dateTo` (URL state)**

- Purpose: Currently selected/displayed date range
- Updated by: User interaction with slider, or `resetDates()`
- Used by: Chart rendering, data filtering

#### Key Functions

**`getStartIndex(allYearlyChartLabels, sliderStart)`**

- Location: `lib/data/labels.ts`
- Purpose: Find array index for sliderStart year
- Uses: ChartPeriod class for smart matching with fallback

**`resetDates()`**

- Location: `useExplorerDataOrchestration.ts`
- Called: After data fetch completes
- Purpose: Initialize or validate dateFrom/dateTo
- **Current Issue**: Uses `filteredChartLabels` which depends on sliderStart
- Logic:
  1. Check if current dateFrom/dateTo are valid
  2. If not, set to sliderStart (if available) or first available date
  3. Preserve user selections when possible (by year matching)

**`resetBaselineDates()`**

- Location: `useExplorerDataOrchestration.ts`
- Called: After data fetch completes
- Purpose: Initialize or validate baselineFrom/baselineTo
- Uses: Same `filteredChartLabels` as `resetDates()`
- Logic: Similar to `resetDates()`, but for baseline date range

**`filteredChartLabels` (computed)**

- Calculates: Slice of `allChartLabels` from sliderStart onwards
- Used by:
  - Explorer page for main slider labels
  - Explorer page for baseline slider labels
  - `resetDates()` for main date range initialization
  - `resetBaselineDates()` for baseline date range initialization

### Data Flow

```
1. User selects countries → fetchChartData()
2. Server returns data → allChartLabels populated
3. Process labels → allYearlyChartLabels calculated
4. Compute filtered → filteredChartLabels = allChartLabels.slice(startIndex)
5. Initialize dates → resetDates() sets dateFrom/dateTo
6. Filter chart data → allChartData.labels = subset of filteredChartLabels
7. Render → Chart uses allChartData, Slider uses filteredChartLabels
```

### Current Problems

#### 1. Multiple Label Arrays

Too many similar but different arrays:

- `allChartLabels` - everything
- `filteredChartLabels` - from sliderStart
- `allChartData.labels` - selected range

**Confusing**: Which one to use where?

#### 2. Circular Dependencies

- `resetDates()` needs labels to set dateFrom/dateTo
- `allChartData.labels` is created USING dateFrom/dateTo
- Workaround: Use `filteredChartLabels` in `resetDates()`

#### 3. Initialization Order

- filteredChartLabels depends on allYearlyChartLabels
- allYearlyChartLabels updated on data fetch
- Must ensure computed runs after data loads

#### 4. Feature Gating Scattered

- DateRangePicker filters dropdown options
- DateSlider enforces minAllowedIndex
- useDataAvailability has effectiveMinDate
- No single source of truth

## Proposed Refactor

### Goals

1. **Single source of truth** for each concept
2. **Clear separation** between available, visible, and selected ranges
3. **No circular dependencies**
4. **Centralized feature gating**

### New Architecture

#### 1. Composable: `useDateRangeCalculations`

**Responsibilities:**

- Calculate all date-related values in one place
- Handle feature gating
- Provide clear, named computed properties

**Exports:**

```typescript
{
  // Available data (from metadata/fetch)
  availableLabels: ComputedRef<string[]>,
  availableRange: ComputedRef<{ min: string, max: string }>,

  // Visible on slider (respects sliderStart + feature gating)
  visibleLabels: ComputedRef<string[]>,
  visibleRange: ComputedRef<{ min: string, max: string }>,

  // Currently selected
  selectedRange: ComputedRef<{ from: string, to: string }>,

  // Utilities
  isValidDate: (date: string) => boolean,
  getDefaultRange: () => { from: string, to: string }
}
```

#### 2. Simplified Flow

```
1. Data fetched → availableLabels
2. Apply sliderStart → visibleLabels
3. Apply feature gating → visibleLabels (filtered)
4. Initialize selection → selectedRange (from/to)
5. Render → Slider uses visibleLabels, Chart uses selectedRange
```

#### 3. No More `resetDates()`

Instead:

- Initialize dateFrom/dateTo on mount if undefined
- Use computed `defaultDateRange` that calculates what SHOULD be selected
- Let URL state handle persistence

#### 4. Centralize Feature Gating

Move all EXTENDED_TIME_PERIODS logic to `useDateRangeCalculations`:

- Calculate restricted start date once
- All components use the same computed values
- No duplicate logic

### Migration Plan

**Phase 1: Add new composable alongside existing code**

- Create `useDateRangeCalculations`
- Don't break existing functionality
- Add comprehensive tests

**Phase 2: Migrate Explorer page**

- Update to use new composable
- Remove old label calculations
- Verify behavior matches

**Phase 3: Migrate Ranking page**

- Similar updates
- Verify consistency

**Phase 4: Cleanup**

- Remove deprecated code
- Update documentation
- Performance audit

### Benefits

1. **Clarity**: Each computed property has a clear name and purpose
2. **Maintainability**: All date logic in one place
3. **Testability**: Isolated composable is easy to unit test
4. **Performance**: Computed values properly cached
5. **Type Safety**: Clear interfaces for each concept

## References

- `app/composables/useExplorerDataOrchestration.ts` - Current implementation
- `app/composables/useDataAvailability.ts` - Metadata-based availability
- `app/components/shared/DateRangePicker.vue` - UI component
- `app/lib/data/labels.ts` - Label utilities
