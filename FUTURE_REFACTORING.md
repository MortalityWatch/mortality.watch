# Future Refactoring Opportunities

This document outlines refactoring opportunities identified during the module integration project. These are separated into distinct phases for manageable implementation.

## Status of Non-Integrated Composables

During Phase 1, two composables were created but could not be integrated:

### 1. `useExplorerDataUpdate.ts` - TypeScript Limitation ❌

**Status**: Cannot integrate due to TypeScript compiler limitation

**Location**: `app/composables/useExplorerDataUpdate.ts` (223 lines)

**Issue**: Takes 30+ individual parameters which causes TypeScript's "Type instantiation is excessively deep and possibly infinite" error. This is a known limitation of the TypeScript compiler's type inference algorithm.

**Solution**: Refactor to use config object pattern (see Phase 2 below)

**Decision**: Keep file as-is for now, integrate after Phase 2 refactoring

### 2. `useExplorerState.ts` - Architectural Mismatch ❌

**Status**: Cannot integrate due to architectural incompatibility

**Location**: `app/composables/useExplorerState.ts` (255 lines)

**Issue**: This composable creates a centralized state management pattern using individual `ref` objects via `useUrlState` for each property. However, `explorer.vue` currently uses `useUrlState` composables directly inline for each property. These patterns are fundamentally incompatible.

**Why it can't integrate**:
- Would require complete rewrite of `explorer.vue`'s state management
- Would change URL synchronization approach throughout the file
- High risk of introducing bugs
- Current inline pattern is actually clean and working well

**Example of the pattern mismatch**:

```typescript
// useExplorerState.ts approach (centralized)
export function useExplorerState() {
  const countries = useUrlState('c', Defaults.countries)
  const chartType = useUrlState('ct', Defaults.chartType)
  // ... 20+ more state properties
  return { countries, chartType, ... }
}

// explorer.vue current approach (inline)
const countries = useUrlState('c', Defaults.countries)
const chartType = useUrlState('ct', Defaults.chartType)
// ... used directly in the same file
```

Both approaches work fine, but switching between them requires major refactoring with unclear benefits.

**Decision**: Keep file as reference implementation. The current inline pattern in `explorer.vue` is maintainable and doesn't justify the integration risk.

---

## Phase 2: Config Object Pattern for useExplorerDataUpdate

### Problem

The `useExplorerDataUpdate` composable cannot be integrated due to TypeScript's "Type instantiation is excessively deep and possibly infinite" error. This occurs because the function takes 30+ individual parameters, overwhelming TypeScript's type inference system.

### Current Signature (Problematic)

```typescript
export function useExplorerDataUpdate(
  // State refs (20 parameters)
  countries: Ref<string[]>,
  chartType: Ref<string>,
  ageGroups: Ref<string[]>,
  type: Ref<string>,
  showBaseline: Ref<boolean>,
  standardPopulation: Ref<string>,
  baselineMethod: Ref<string>,
  baselineDateFrom: Ref<string>,
  baselineDateTo: Ref<string>,
  dateFrom: Ref<string>,
  dateTo: Ref<string>,
  sliderStart: Ref<string>,
  isExcess: Ref<boolean>,
  cumulative: Ref<boolean>,
  showPredictionInterval: Ref<boolean>,
  showTotal: Ref<boolean>,
  showPercentage: Ref<boolean>,
  maximize: Ref<boolean>,
  showLabels: Ref<boolean>,
  isLogarithmic: Ref<boolean>,
  // Data refs (5 parameters)
  allChartLabels: Ref<string[]>,
  allYearlyChartLabels: Ref<string[]>,
  allYearlyChartLabelsUnique: Ref<string[]>,
  allChartData: AllChartData,
  chartData: Ref<MortalityChartData | undefined>,
  // Helper functions (8 parameters)
  isAsmrType: () => boolean,
  isBarChartStyle: () => boolean,
  isErrorBarType: () => boolean,
  isMatrixChartStyle: () => boolean,
  isPopulationType: () => boolean,
  isDeathsType: () => boolean,
  showCumPi: () => boolean,
  getBaseKeysForType: () => (keyof NumberEntryFields)[],
  // Data getter/setter (2 parameters)
  getDataset: () => DatasetRaw,
  setDataset: (dataset: DatasetRaw) => void,
  // Other refs (2 parameters)
  displayColors: Ref<string[]>,
  allCountries: Ref<Record<string, Country>>
) { ... }
```

### Proposed Solution

Group related parameters into logical configuration objects:

```typescript
interface ExplorerStateRefs {
  countries: Ref<string[]>
  chartType: Ref<string>
  ageGroups: Ref<string[]>
  type: Ref<string>
  showBaseline: Ref<boolean>
  standardPopulation: Ref<string>
  baselineMethod: Ref<string>
  baselineDateFrom: Ref<string>
  baselineDateTo: Ref<string>
  dateFrom: Ref<string>
  dateTo: Ref<string>
  sliderStart: Ref<string>
  isExcess: Ref<boolean>
  cumulative: Ref<boolean>
  showPredictionInterval: Ref<boolean>
  showTotal: Ref<boolean>
  showPercentage: Ref<boolean>
  maximize: Ref<boolean>
  showLabels: Ref<boolean>
  isLogarithmic: Ref<boolean>
}

interface ExplorerDataRefs {
  allChartLabels: Ref<string[]>
  allYearlyChartLabels: Ref<string[]>
  allYearlyChartLabelsUnique: Ref<string[]>
  allChartData: AllChartData
  chartData: Ref<MortalityChartData | undefined>
}

interface ExplorerHelpers {
  isAsmrType: () => boolean
  isBarChartStyle: () => boolean
  isErrorBarType: () => boolean
  isMatrixChartStyle: () => boolean
  isPopulationType: () => boolean
  isDeathsType: () => boolean
  showCumPi: () => boolean
  getBaseKeysForType: () => (keyof NumberEntryFields)[]
}

interface ExplorerDataset {
  get: () => DatasetRaw
  set: (dataset: DatasetRaw) => void
}

interface ExplorerConfig {
  displayColors: Ref<string[]>
  allCountries: Ref<Record<string, Country>>
}

interface UseExplorerDataUpdateConfig {
  state: ExplorerStateRefs
  data: ExplorerDataRefs
  helpers: ExplorerHelpers
  dataset: ExplorerDataset
  config: ExplorerConfig
}

export function useExplorerDataUpdate(config: UseExplorerDataUpdateConfig) {
  // Implementation using config.state.countries, config.data.chartData, etc.
}
```

### Benefits

1. **Fixes TypeScript limitation** - Config object doesn't trigger deep type instantiation
2. **Improved readability** - Clear grouping of related concerns
3. **Better maintainability** - Easier to add/remove parameters within groups
4. **Easier testing** - Can mock entire groups at once
5. **Self-documenting** - Interface names explain purpose of parameter groups

### Implementation Steps

1. Define the configuration interfaces in a new file (e.g., `app/composables/useExplorerDataUpdate.types.ts`)
2. Update `useExplorerDataUpdate.ts` to accept config object
3. Update `explorer.vue` to pass config object instead of individual parameters
4. Test thoroughly
5. Update documentation

### Estimated Impact

- Files changed: 2-3
- Risk level: Low-Medium
- Testing required: Yes (full integration test of explorer page)

---

## Phase 3: Date/Period Type Model

### Problem

The codebase uses **string arrays with `indexOf`** extensively to manage dates and time periods. This is symptomatic of a missing domain model. The approach is brittle and error-prone:

```typescript
// DateSlider.vue:23
const toIdx = props.labels.indexOf(props.sliderValue[1] ?? '')

// ranking.vue:399
const startIndex = allChartData.value?.labels.indexOf(dateFrom || '') || 0
const endIndex = (allChartData.value?.labels.indexOf(dateTo || '') || 0) + 1

// state.ts:260
const startIdx = this.allChartData.labels.indexOf(this.sliderStartPeriod())
```

### Root Cause

Date handling varies by chart type (yearly/monthly/weekly), but this logic is scattered:

- Different label formats (e.g., "2020" vs "2020-Jan" vs "2020-W01")
- Different sorting rules
- Different indexing semantics
- Metadata contains `min_date`/`max_date` but it's underutilized

Current flow:
1. Load metadata (has min_date/max_date per country/source/type)
2. Load full dataset
3. Extract labels from dataset using `getAllChartLabels`
4. Use string arrays + `indexOf` everywhere
5. Lots of edge case handling for -1 (not found)

### Metadata Structure (Currently Underutilized)

```csv
iso3c,jurisdiction,type,source,min_date,max_date,age_groups
ABW,Aruba,1,un,1950-01-01,2023-01-01,all
ABW,Aruba,2,world_mortality,2015-01-01,2021-12-01,all
ALB,Albania,3,eurostat,2014-12-29,2021-09-13,"0-9, 10-19, ..., all"
```

Where `type`: 1=yearly, 2=monthly, 3=weekly

### Proposed Solution

Create a proper domain model for chart periods and date ranges:

```typescript
/**
 * Represents a time period for a specific chart type
 * Encapsulates label generation, indexing, and validation
 */
class ChartPeriod {
  constructor(
    private readonly labels: readonly string[],
    private readonly chartType: 'yearly' | 'monthly' | 'weekly'
  ) {}

  /**
   * Find index of a date label (with smart fallback)
   */
  indexOf(date: string): number {
    const idx = this.labels.indexOf(date)
    if (idx !== -1) return idx

    // Smart fallback: find closest match by year
    return this.findClosestDate(date)
  }

  /**
   * Get label at index (safe)
   */
  labelAt(index: number): string | undefined {
    return this.labels[index]
  }

  /**
   * Find closest date to given date string
   */
  findClosestDate(date: string): number {
    const year = date.substring(0, 4)
    const yearMatches = this.labels.filter(l => l.startsWith(year))

    if (yearMatches.length > 0) {
      return this.labels.indexOf(yearMatches[0])
    }

    // Find nearest year
    const targetYear = parseInt(year)
    const availableYears = Array.from(
      new Set(this.labels.map(l => parseInt(l.substring(0, 4))))
    )
    const closestYear = availableYears.reduce((prev, curr) =>
      Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
    )

    const closestLabel = this.labels.find(l => l.startsWith(closestYear.toString()))
    return closestLabel ? this.labels.indexOf(closestLabel) : 0
  }

  /**
   * Create a date range within this period
   */
  createRange(from: string, to: string): DateRange {
    return new DateRange(this, from, to)
  }

  /**
   * Validate if a date range is valid
   */
  isValidRange(from: string, to: string): boolean {
    const fromIdx = this.indexOf(from)
    const toIdx = this.indexOf(to)
    return fromIdx >= 0 && toIdx >= 0 && fromIdx <= toIdx
  }

  /**
   * Get all labels
   */
  get allLabels(): readonly string[] {
    return this.labels
  }

  /**
   * Get first/last labels
   */
  get firstLabel(): string {
    return this.labels[0] ?? ''
  }

  get lastLabel(): string {
    return this.labels[this.labels.length - 1] ?? ''
  }

  /**
   * Get number of labels
   */
  get length(): number {
    return this.labels.length
  }
}

/**
 * Represents a date range within a chart period
 */
class DateRange {
  constructor(
    private readonly period: ChartPeriod,
    public readonly from: string,
    public readonly to: string
  ) {}

  /**
   * Get start index
   */
  get fromIndex(): number {
    return this.period.indexOf(this.from)
  }

  /**
   * Get end index
   */
  get toIndex(): number {
    return this.period.indexOf(this.to)
  }

  /**
   * Get all labels in range
   */
  get labels(): string[] {
    const start = this.fromIndex
    const end = this.toIndex
    return this.period.allLabels.slice(start, end + 1) as string[]
  }

  /**
   * Check if a date is within this range
   */
  contains(date: string): boolean {
    const idx = this.period.indexOf(date)
    return idx >= this.fromIndex && idx <= this.toIndex
  }

  /**
   * Get range length
   */
  get length(): number {
    return this.toIndex - this.fromIndex + 1
  }
}
```

### Usage Examples

**Before** (brittle):
```typescript
const toIdx = props.labels.indexOf(props.sliderValue[1] ?? '')
if (toIdx === -1) {
  // handle error...
}
```

**After** (robust):
```typescript
const period = new ChartPeriod(props.labels, chartType)
const toIdx = period.indexOf(props.sliderValue[1] ?? '')
// Always gets a valid index (with smart fallback)
```

**Before** (scattered logic):
```typescript
const startIndex = allChartData.value?.labels.indexOf(dateFrom || '') || 0
const endIndex = (allChartData.value?.labels.indexOf(dateTo || '') || 0) + 1
const dataLabels = [...(allChartData.value?.labels.slice(startIndex, endIndex) || [])]
```

**After** (clean):
```typescript
const period = new ChartPeriod(allChartData.value.labels, chartType)
const range = period.createRange(dateFrom, dateTo)
const dataLabels = range.labels
```

### Benefits

1. **Eliminates scattered `indexOf` calls** - Centralized in one place
2. **Handles chart type differences** - Logic encapsulated per chart type
3. **Smart fallback logic** - No more -1 handling everywhere
4. **Type-safe** - TypeScript knows what's a period vs a range
5. **Testable** - Easy to unit test period/range logic in isolation
6. **Uses metadata better** - Could leverage min_date/max_date from metadata

### Files Affected

Based on grep results, these files use `labels.indexOf`:
- `app/components/charts/DateSlider.vue`
- `app/pages/ranking.vue`
- `app/model/state.ts`
- `app/lib/data/labels.ts`
- `app/lib/data/aggregations.ts`
- `app/lib/chart/filtering.ts`
- `app/lib/chart/datasets.ts`
- `app/composables/useDateRangeValidation.ts`

### Implementation Steps

1. Create `app/model/period.ts` with `ChartPeriod` and `DateRange` classes
2. Update `getAllChartLabels` to return a `ChartPeriod` instead of `string[]`
3. Update components/composables to use `ChartPeriod` API
4. Replace all `labels.indexOf` calls with `period.indexOf`
5. Update tests
6. Validate all date range handling still works

### Estimated Impact

- Files changed: 8-10
- Risk level: Medium-High (touches many date-handling areas)
- Testing required: Yes (comprehensive testing of date ranges, sliders, filtering)

### Additional Considerations

**Metadata Integration**: Could enhance `ChartPeriod` to use metadata:

```typescript
interface PeriodMetadata {
  minDate: string
  maxDate: string
  sources: string[]
  ageGroups: Set<string>
}

class ChartPeriod {
  constructor(
    private readonly labels: readonly string[],
    private readonly chartType: 'yearly' | 'monthly' | 'weekly',
    private readonly metadata?: PeriodMetadata
  ) {}

  /**
   * Check if date is within metadata bounds
   */
  isDateAvailable(date: string): boolean {
    if (!this.metadata) return true
    return date >= this.metadata.minDate && date <= this.metadata.maxDate
  }
}
```

This would enable validation BEFORE loading data, improving UX.

---

## Summary

### Phase 2: Config Object Pattern
- **Goal**: Enable integration of `useExplorerDataUpdate` composable
- **Complexity**: Low-Medium
- **Impact**: 2-3 files
- **Benefits**: Fixes TypeScript limitation, improves code organization

### Phase 3: Date/Period Model
- **Goal**: Eliminate brittle string array + indexOf pattern
- **Complexity**: Medium-High
- **Impact**: 8-10 files
- **Benefits**: Centralized logic, better type safety, cleaner API

### Recommended Order

1. **Phase 2 first** - Smaller, focused change that unblocks useExplorerDataUpdate integration
2. **Phase 3 after** - Larger architectural change that improves date handling throughout the app

Both phases are valuable and should be implemented, but as separate PRs for easier review and rollback if needed.
