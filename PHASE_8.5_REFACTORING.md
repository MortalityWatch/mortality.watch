# Phase 8.5: Component Refactoring & Modularization - Detailed Technical Specs

This document provides detailed technical specifications for **Phase 8.5** of the IMPLEMENTATION_PLAN.md. Phase 8.5 breaks up large monolithic components into smaller, maintainable modules.

**See IMPLEMENTATION_PLAN.md (Phase 8.5) for:** Project context, timeline, and high-level overview

**This document contains:** Detailed technical analysis, code examples, and implementation specifics for Phases 8.5.2 and 8.5.3

## Status of Non-Integrated Composables

During Phase 8.5.1, two composables were created but could not be integrated:

### 1. `useExplorerDataUpdate.ts` - TypeScript Limitation ❌

**Status**: Cannot integrate due to TypeScript compiler limitation

**Location**: `app/composables/useExplorerDataUpdate.ts` (223 lines)

**Issue**: Takes 30+ individual parameters which causes TypeScript's "Type instantiation is excessively deep and possibly infinite" error. This is a known limitation of the TypeScript compiler's type inference algorithm.

**Solution**: Refactor to use config object pattern (see Phase 8.5.2 below)

**Decision**: Keep file as-is for now, integrate after Phase 8.5.2 refactoring

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

## Phase 8.5.2: Config Object Pattern for useExplorerDataUpdate - ✅ COMPLETED

**Status**: Complete and merged via PR #11

**Completion Date**: 2025-10-27

### Problem (Solved)

The `useExplorerDataUpdate` composable could not be integrated due to TypeScript's "Type instantiation is excessively deep and possibly infinite" error. This occurred because the function took 30+ individual parameters, overwhelming TypeScript's type inference system.

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
  countries: Ref<string[]>;
  chartType: Ref<string>;
  ageGroups: Ref<string[]>;
  type: Ref<string>;
  showBaseline: Ref<boolean>;
  standardPopulation: Ref<string>;
  baselineMethod: Ref<string>;
  baselineDateFrom: Ref<string>;
  baselineDateTo: Ref<string>;
  dateFrom: Ref<string>;
  dateTo: Ref<string>;
  sliderStart: Ref<string>;
  isExcess: Ref<boolean>;
  cumulative: Ref<boolean>;
  showPredictionInterval: Ref<boolean>;
  showTotal: Ref<boolean>;
  showPercentage: Ref<boolean>;
  maximize: Ref<boolean>;
  showLabels: Ref<boolean>;
  isLogarithmic: Ref<boolean>;
}

interface ExplorerDataRefs {
  allChartLabels: Ref<string[]>;
  allYearlyChartLabels: Ref<string[]>;
  allYearlyChartLabelsUnique: Ref<string[]>;
  allChartData: AllChartData;
  chartData: Ref<MortalityChartData | undefined>;
}

interface ExplorerHelpers {
  isAsmrType: () => boolean;
  isBarChartStyle: () => boolean;
  isErrorBarType: () => boolean;
  isMatrixChartStyle: () => boolean;
  isPopulationType: () => boolean;
  isDeathsType: () => boolean;
  showCumPi: () => boolean;
  getBaseKeysForType: () => (keyof NumberEntryFields)[];
}

interface ExplorerDataset {
  get: () => DatasetRaw;
  set: (dataset: DatasetRaw) => void;
}

interface ExplorerConfig {
  displayColors: Ref<string[]>;
  allCountries: Ref<Record<string, Country>>;
}

interface UseExplorerDataUpdateConfig {
  state: ExplorerStateRefs;
  data: ExplorerDataRefs;
  helpers: ExplorerHelpers;
  dataset: ExplorerDataset;
  config: ExplorerConfig;
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

### What Was Accomplished

Successfully refactored god functions with 30+ parameters to use clean config objects:

**Files Refactored**:

1. ✅ `useExplorerDataUpdate.ts` - Now accepts single config object instead of 30+ params
2. ✅ `lib/chart/filtering.ts` - `getFilteredChartData()` uses config object
3. ✅ `pages/explorer.vue` - Updated to pass config objects

**Interfaces Created**:

- `ExplorerStateRefs` - 20 state properties
- `ExplorerDataRefs` - 5 data properties
- `ExplorerHelpers` - 8 helper functions
- `ExplorerDataset` - 2 dataset operations
- `ExplorerConfig` - 2 config properties
- `UseExplorerDataUpdateConfig` - Main config interface

### Key Benefits Achieved

1. **Fixed TypeScript limitation** - Config object doesn't trigger deep type instantiation
2. **Improved readability** - Clear grouping of related concerns
3. **Better maintainability** - Easy to add/remove parameters within groups
4. **Easier testing** - Can mock entire groups at once
5. **Self-documenting** - Interface names explain purpose of parameter groups

### Metrics

- Files changed: 3
- Lines added: ~50 (interfaces)
- Lines removed: ~30 (parameter lists)
- TypeScript errors: 0 (fixed the "excessively deep" error!)

---

## Phase 8.5.3: Date/Period Type Model

### Problem

The codebase uses **string arrays with `indexOf`** extensively to manage dates and time periods. This is symptomatic of a missing domain model. The approach is brittle and error-prone:

```typescript
// DateSlider.vue:23
const toIdx = props.labels.indexOf(props.sliderValue[1] ?? "");

// ranking.vue:399
const startIndex = allChartData.value?.labels.indexOf(dateFrom || "") || 0;
const endIndex = (allChartData.value?.labels.indexOf(dateTo || "") || 0) + 1;

// state.ts:260
const startIdx = this.allChartData.labels.indexOf(this.sliderStartPeriod());
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
    private readonly chartType: "yearly" | "monthly" | "weekly",
  ) {}

  /**
   * Find index of a date label (with smart fallback)
   */
  indexOf(date: string): number {
    const idx = this.labels.indexOf(date);
    if (idx !== -1) return idx;

    // Smart fallback: find closest match by year
    return this.findClosestDate(date);
  }

  /**
   * Get label at index (safe)
   */
  labelAt(index: number): string | undefined {
    return this.labels[index];
  }

  /**
   * Find closest date to given date string
   */
  findClosestDate(date: string): number {
    const year = date.substring(0, 4);
    const yearMatches = this.labels.filter((l) => l.startsWith(year));

    if (yearMatches.length > 0) {
      return this.labels.indexOf(yearMatches[0]);
    }

    // Find nearest year
    const targetYear = parseInt(year);
    const availableYears = Array.from(
      new Set(this.labels.map((l) => parseInt(l.substring(0, 4)))),
    );
    const closestYear = availableYears.reduce((prev, curr) =>
      Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev,
    );

    const closestLabel = this.labels.find((l) =>
      l.startsWith(closestYear.toString()),
    );
    return closestLabel ? this.labels.indexOf(closestLabel) : 0;
  }

  /**
   * Create a date range within this period
   */
  createRange(from: string, to: string): DateRange {
    return new DateRange(this, from, to);
  }

  /**
   * Validate if a date range is valid
   */
  isValidRange(from: string, to: string): boolean {
    const fromIdx = this.indexOf(from);
    const toIdx = this.indexOf(to);
    return fromIdx >= 0 && toIdx >= 0 && fromIdx <= toIdx;
  }

  /**
   * Get all labels
   */
  get allLabels(): readonly string[] {
    return this.labels;
  }

  /**
   * Get first/last labels
   */
  get firstLabel(): string {
    return this.labels[0] ?? "";
  }

  get lastLabel(): string {
    return this.labels[this.labels.length - 1] ?? "";
  }

  /**
   * Get number of labels
   */
  get length(): number {
    return this.labels.length;
  }
}

/**
 * Represents a date range within a chart period
 */
class DateRange {
  constructor(
    private readonly period: ChartPeriod,
    public readonly from: string,
    public readonly to: string,
  ) {}

  /**
   * Get start index
   */
  get fromIndex(): number {
    return this.period.indexOf(this.from);
  }

  /**
   * Get end index
   */
  get toIndex(): number {
    return this.period.indexOf(this.to);
  }

  /**
   * Get all labels in range
   */
  get labels(): string[] {
    const start = this.fromIndex;
    const end = this.toIndex;
    return this.period.allLabels.slice(start, end + 1) as string[];
  }

  /**
   * Check if a date is within this range
   */
  contains(date: string): boolean {
    const idx = this.period.indexOf(date);
    return idx >= this.fromIndex && idx <= this.toIndex;
  }

  /**
   * Get range length
   */
  get length(): number {
    return this.toIndex - this.fromIndex + 1;
  }
}
```

### Usage Examples

**Before** (brittle):

```typescript
const toIdx = props.labels.indexOf(props.sliderValue[1] ?? "");
if (toIdx === -1) {
  // handle error...
}
```

**After** (robust):

```typescript
const period = new ChartPeriod(props.labels, chartType);
const toIdx = period.indexOf(props.sliderValue[1] ?? "");
// Always gets a valid index (with smart fallback)
```

**Before** (scattered logic):

```typescript
const startIndex = allChartData.value?.labels.indexOf(dateFrom || "") || 0;
const endIndex = (allChartData.value?.labels.indexOf(dateTo || "") || 0) + 1;
const dataLabels = [
  ...(allChartData.value?.labels.slice(startIndex, endIndex) || []),
];
```

**After** (clean):

```typescript
const period = new ChartPeriod(allChartData.value.labels, chartType);
const range = period.createRange(dateFrom, dateTo);
const dataLabels = range.labels;
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
  minDate: string;
  maxDate: string;
  sources: string[];
  ageGroups: Set<string>;
}

class ChartPeriod {
  constructor(
    private readonly labels: readonly string[],
    private readonly chartType: "yearly" | "monthly" | "weekly",
    private readonly metadata?: PeriodMetadata,
  ) {}

  /**
   * Check if date is within metadata bounds
   */
  isDateAvailable(date: string): boolean {
    if (!this.metadata) return true;
    return date >= this.metadata.minDate && date <= this.metadata.maxDate;
  }
}
```

This would enable validation BEFORE loading data, improving UX.

---

## Summary

### Phase 8.5.2: Config Object Pattern

- **Goal**: Enable integration of `useExplorerDataUpdate` composable
- **Complexity**: Low-Medium
- **Impact**: 2-3 files
- **Benefits**: Fixes TypeScript limitation, improves code organization

### Phase 8.5.3: Date/Period Model

- **Goal**: Eliminate brittle string array + indexOf pattern
- **Complexity**: Medium-High
- **Impact**: 8-10 files
- **Benefits**: Centralized logic, better type safety, cleaner API

### Recommended Order

1. **Phase 8.5.2 first** - Smaller, focused change that unblocks useExplorerDataUpdate integration
2. **Phase 8.5.3 after** - Larger architectural change that improves date handling throughout the app

Both phases are valuable and should be implemented, but as separate PRs for easier review and rollback if needed.

---

## Related Documentation

- **IMPLEMENTATION_PLAN.md** - Main project roadmap (see Phase 8.5 for this refactoring work)
- **REFACTORING_SUMMARY.md** - Phase 1 completion summary (in git history at commit 1e6ebce)
- **PR #10** - Phase 1 implementation (`refactor/split-large-files` branch)

## Current Status

- ✅ **Phase 8.5.1 (Phase 1)** - Complete and merged (PR #10)
- ✅ **Phase 8.5.2** - **COMPLETE** (PR #11 - Config Object Pattern)
- ✅ **Phase 8.5.3** - **COMPLETE** (PR #12 - ChartPeriod/DateRange refactoring)
- 📋 **Phase 8.5.4** - Planned (Code Quality & Pattern Improvements)

---

## Phase 8.5.3: Date/Period Type Model - ✅ COMPLETED

**Status**: Complete and merged via PR #12

**Completion Date**: 2025-10-27

### What Was Accomplished

Successfully migrated from brittle `string[] + indexOf` pattern to robust ChartPeriod/DateRange domain model across 12 files:

**Core Refactoring**:

1. ✅ `app/model/period.ts` - Created ChartPeriod and DateRange classes with comprehensive tests (27/27 passing)
2. ✅ `app/composables/useDateRangeValidation.ts` - Now accepts ChartPeriod instead of string[]
3. ✅ `app/lib/chart/filtering.ts` - Uses ChartPeriod for date index lookup
4. ✅ `app/lib/data/aggregations.ts` - Baseline date indices via ChartPeriod
5. ✅ `app/lib/data/labels.ts` - Simplified getStartIndex with ChartPeriod
6. ✅ `app/model/state.ts` - Added getChartPeriod() helper, eliminated all indexOf calls
7. ✅ `app/pages/ranking.vue` - All date index lookups use ChartPeriod
8. ✅ `app/components/charts/DateSlider.vue` - **Removed 70+ lines of complex fallback logic!**

**Component Updates**: 9. ✅ `app/components/charts/MortalityChartControlsSecondary.vue` - Added chartType prop 10. ✅ `app/components/explorer/ExplorerDataSelection.vue` - Added chartType prop 11. ✅ `app/components/ranking/RankingSettings.vue` - Added chartType prop 12. ✅ `app/pages/explorer.vue` - Full ChartPeriod integration

**Type System Enhancement**:

- Extended `ChartType` to include all variants: `yearly`, `midyear`, `fluseason`, `monthly`, `quarterly`, `weekly`, `weekly_13w_sma`, `weekly_26w_sma`, `weekly_52w_sma`, `weekly_104w_sma`

### Key Benefits Achieved

1. **Eliminated -1 handling** - Smart fallback logic centralized in ChartPeriod.indexOf()
2. **Dramatically simplified DateSlider** - Complex year-matching logic replaced with simple API calls
3. **Type-safe period operations** - TypeScript knows what's a period vs a range
4. **Better testability** - Period/range logic tested in isolation (27 tests)
5. **Improved maintainability** - Single source of truth for date index lookups

### Metrics

- **Lines removed**: ~100+ (complex fallback logic)
- **Lines added**: ~190 (ChartPeriod/DateRange + tests)
- **Net change**: More robust code with less complexity
- **Files changed**: 12
- **Tests**: 27/27 passing
- **Type safety**: 100% (no any types added)

---

## Phase 8.5.4: Code Quality & Pattern Improvements (NEW)

**Status**: Planned - Comprehensive codebase analysis complete

**Goal**: Address code smells, brittle patterns, and technical debt identified during Phase 8.5.3

This phase consolidates multiple refactoring opportunities discovered through codebase analysis into a structured improvement plan.

---

### **Phase 8.5.4.1: Quick Wins** (Week 1)

Low effort, high impact improvements to establish momentum.

#### 4.1.1: Extract Magic Number Constants ⭐️ **PRIORITY**

**Files**: 9+ files with viewport breakpoints
**Issue**: Hardcoded `640`, `768`, `1024` scattered throughout codebase
**Solution**:

```typescript
// lib/constants.ts
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  XL: 1280,
} as const;

export const isDesktop = () =>
  typeof window !== "undefined" && window.innerWidth >= BREAKPOINTS.DESKTOP;
export const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < BREAKPOINTS.MOBILE;
```

**Impact**:

- Files changed: 9-12
- Lines changed: ~30-40
- Effort: 2-3 hours
- Benefit: Single source of truth for responsive design

#### 4.1.2: Remove Debug Console.log Statements

**Files**: 8+ files
**Issue**: 27 console.log statements in `useExplorerDataUpdate.ts` alone
**Solution**: Remove or guard with `if (import.meta.dev)` checks
**Impact**:

- Files changed: 8-10
- Lines removed: ~50
- Effort: 1-2 hours
- Benefit: Cleaner production console, better debugging experience

#### 4.1.3: Deduplicate round() Function

**Files**: `utils.ts`, `lib/chart/chartUtils.ts`
**Issue**: Identical implementation in two files
**Solution**: Keep single implementation in `utils.ts`, update imports
**Impact**:

- Files changed: 2-3
- Lines removed: 5-10
- Effort: 15 minutes
- Benefit: DRY principle

#### 4.1.4: Replace Switch with Object Literal Lookups

**Files**: `utils.ts`, `colors.ts`, `model/utils.ts`
**Issue**: 19 switch statements for simple value mappings
**Example**:

```typescript
// Before
switch (type) {
  case "1":
    return "yearly";
  case "2":
    return "monthly";
  case "3":
    return "weekly";
}

// After
const DATA_TYPE_MAP = { "1": "yearly", "2": "monthly", "3": "weekly" } as const;
return DATA_TYPE_MAP[type];
```

**Impact**:

- Files changed: 3-5
- Lines reduced: ~50-80
- Effort: 2 hours
- Benefit: More concise, easier to maintain

**Total Week 1**: 5-8 hours, 4 improvements

---

### **Phase 8.5.4.2: High-Impact Refactorings** (Weeks 2-3)

Address major architectural issues blocking code quality.

#### 4.2.1: Config Object Pattern (Phase 8.5.2) ✅ **COMPLETE**

**Files**: `lib/chart/filtering.ts`, `composables/useExplorerDataUpdate.ts`
**Status**: ✅ Complete (PR #11)
**Impact**: TypeScript "excessively deep" error resolved, dramatically improved maintainability

See Phase 8.5.2 section above for full details.

#### 4.2.2: Split MortalityChartControlsSecondary Component

**File**: `app/components/charts/MortalityChartControlsSecondary.vue` (745 lines, 79 props)
**Issue**: Single component managing 4 tabs with complex validation and feature gating
**Solution**: Split into separate components per tab

```
components/charts/controls/
  ├── DataTab.vue (already exists!)
  ├── DisplayTab.vue (new)
  ├── BaselineTab.vue (new)
  ├── StyleTab.vue (new)
  └── ControlsContainer.vue (new - manages tabs)
```

**Impact**:

- Files changed: 5-7 (1 split into 5, 2 updated)
- Lines per file: 150-200 (down from 745)
- Effort: 8-12 hours
- Benefit: Much better testability, reusability, maintainability

#### 4.2.3: Refactor Repetitive Type Definitions

**File**: `app/model/types.ts` (lines 31-135)
**Issue**: 84 lines of `metric_variant_modifier` pattern repetition
**Solution**: Use TypeScript template literals

```typescript
type Metric =
  | "deaths"
  | "cmr"
  | "asmr_who"
  | "asmr_esp"
  | "asmr_usa"
  | "asmr_country"
  | "le";
type Variant = "" | "_baseline" | "_excess";
type Modifier = "" | "_lower" | "_upper";
type NumberField = `${Metric}${Variant}${Modifier}`;

// Auto-generates all 84 field combinations!
export type NumberEntryFields = {
  [K in NumberField]: NumberArray;
} & {
  population: NumberArray; // Special case
};
```

**Impact**:

- Files changed: 1-2
- Lines reduced: ~70
- Effort: 6-8 hours (complex, needs careful testing)
- Benefit: Easier to add new metrics, type-safe field access

**Total Weeks 2-3**: 18-26 hours, 3 major improvements

---

### **Phase 8.5.4.3: Long-term Code Health** (Weeks 4-6)

Foundational improvements for maintainability.

#### 4.3.1: Reorganize utils.ts into Domain Modules

**File**: `app/utils.ts` (322 lines)
**Issue**: Mix of array, formatting, date, DOM, string utilities
**Solution**: Split into focused modules

```
lib/utils/
  ├── array.ts      # Array operations (15 functions)
  ├── formatting.ts # Number/percent formatting (6 functions)
  ├── dates.ts      # Date parsing/transformation (4 functions)
  ├── dom.ts        # Browser/window utilities (4 functions)
  ├── strings.ts    # String manipulation (5 functions)
  └── guards.ts     # Type guards (3 functions)
```

**Impact**:

- Files changed: 30-40 (utils.ts split + all imports updated)
- Effort: 4-6 hours
- Benefit: Better organization, discoverability, tree-shaking

#### 4.3.2: Eliminate Switch Statement Duplication in getKeyForType()

**File**: `app/model/utils.ts` (lines 16-113)
**Issue**: Nearly identical switch cases for 5 metric types
**Solution**: Configuration-driven approach

```typescript
interface MetricConfig {
  base: string
  hasStandardPopulation: boolean
  getFieldName: (opts: FieldOptions) => string
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  deaths: { base: 'deaths', hasStandardPopulation: false, ... },
  cmr: { base: 'cmr', hasStandardPopulation: false, ... },
  asmr: { base: 'asmr', hasStandardPopulation: true, ... },
  le: { base: 'le', hasStandardPopulation: false, ... }
}
```

**Impact**:

- Files changed: 1-2
- Lines reduced: ~60
- Effort: 4-5 hours
- Benefit: DRY, easier to add new metrics

#### 4.3.3: Refactor Chart Label Building

**File**: `app/lib/chart/labels.ts`
**Issue**: Parallel switch statements with 80% duplicate structure
**Solution**: Extract common label building logic
**Impact**:

- Files changed: 1
- Lines reduced: ~30
- Effort: 2-3 hours
- Benefit: Reduced duplication

#### 4.3.4: Fix Array Prototype Pollution

**File**: `app/utils.ts` (lines 10-15, 237-239)
**Issue**: Extends `Array.prototype` with `last()` method
**Solution**: Use standalone utility

```typescript
export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];
```

**Impact**:

- Files changed: 5-8 (utils.ts + all usages)
- Effort: 1 hour
- Benefit: Avoid prototype pollution, better practices

#### 4.3.5: Improve globalThis Access Pattern

**File**: `app/utils.ts`
**Issue**: Repeated `(globalThis as any).window` (20+ occurrences)
**Solution**: Create typed helpers

```typescript
export const isBrowser = (): boolean => typeof window !== "undefined";
export const getWindow = (): Window | undefined =>
  isBrowser() ? window : undefined;
```

**Impact**:

- Files changed: 2-3
- Lines reduced: ~20
- Effort: 1 hour
- Benefit: Type safety, cleaner code

**Total Weeks 4-6**: 12-15 hours, 5 improvements

---

## Phase 8.5.4 Summary

### Effort Breakdown by Priority

| Priority        | Phases        | Effort          | Impact   | ROI             |
| --------------- | ------------- | --------------- | -------- | --------------- |
| **Quick Wins**  | 4.1.1 - 4.1.4 | 5-8 hours       | High     | ⭐️⭐️⭐️⭐️⭐️ |
| **High Impact** | 4.2.1 - 4.2.3 | 18-26 hours     | Critical | ⭐️⭐️⭐️⭐️⭐️ |
| **Long-term**   | 4.3.1 - 4.3.5 | 12-15 hours     | Medium   | ⭐️⭐️⭐️       |
| **TOTAL**       | 12 items      | **35-49 hours** | -        | -               |

### Files Most Impacted

1. `utils.ts` - Split into 6 modules
2. `MortalityChartControlsSecondary.vue` - Split into 5 components
3. `model/types.ts` - Refactored with template literals
4. `lib/chart/filtering.ts` - Config object pattern
5. `composables/useExplorerDataUpdate.ts` - Config object pattern

### Recommended Execution Order

**Week 1: Build Momentum** 🚀

- Quick wins (4.1.1 - 4.1.4)
- Visible improvements, team morale boost

**Weeks 2-3: Critical Fixes** 🔧

- Config object pattern (4.2.1) - Unblocks TypeScript
- Type definitions (4.2.3) - Reduces boilerplate
- Split large component (4.2.2) - Improves testability

**Weeks 4-6: Foundation** 🏗️

- Reorganize utils (4.3.1)
- Eliminate duplication (4.3.2, 4.3.3)
- Clean up patterns (4.3.4, 4.3.5)

### Success Metrics

- **Code Complexity**: Reduce average function length by 20%
- **Type Safety**: Eliminate all `any` types outside of test files
- **Maintainability**: Largest component <500 lines
- **Test Coverage**: All new utilities have unit tests
- **Developer Experience**: TypeScript compile time <5 seconds

---

## Overall Phase 8.5 Status

| Phase   | Status      | PR  | Effort   | Impact   |
| ------- | ----------- | --- | -------- | -------- |
| 8.5.1   | ✅ Complete | #10 | -        | High     |
| 8.5.2   | ✅ Complete | #11 | 6h       | Critical |
| 8.5.3   | ✅ Complete | #12 | 12h      | High     |
| 8.5.4.1 | 📋 Planned  | -   | 5-8h     | High     |
| 8.5.4.2 | 📋 Planned  | -   | 14-20h\* | High\*\* |
| 8.5.4.3 | 📋 Planned  | -   | 12-15h   | Medium   |

\*Reduced from 18-26h since 8.5.2 (config pattern) is now complete
\*\*Reduced from Critical since main blocker (8.5.2) is now resolved

**Total Completed**: 18 hours (Phases 8.5.1, 8.5.2, 8.5.3)
**Total Remaining**: 31-43 hours (4-5 weeks)

**Next Action**: Begin Phase 8.5.4.1 (Quick Wins) for immediate code quality improvements
