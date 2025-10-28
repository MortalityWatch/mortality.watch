# Phase 9: Architectural Improvements & State Management

**Status**: Planned - Post Phase 8.5 Technical Debt Resolution

**Goal**: Address remaining architectural issues, improve state management, and implement data-driven configuration

**Context**: Phase 8.5 successfully modularized components and eliminated code duplication. Phase 9 tackles deeper architectural concerns around state management, data loading, and configuration.

---

## Overview

This document outlines the next major refactoring phase focusing on three key areas:

1. **State Management Architecture** - Centralize and validate application state
2. **Component Complexity Reduction** - Break down remaining god objects
3. **Data-Driven Configuration** - Make configuration responsive to actual data availability

---

## Phase 9.1: State Schema Validation & Consolidation

**Priority**: 🔴 HIGH
**Effort**: 8-13 hours (1-2 sprints)
**Impact**: Critical - Prevents invalid states, improves DX, enables better error handling

### Problem Statement

The explorer page manages 28+ URL state variables with complex interdependencies:

```typescript
// explorer.vue - Current state management
const countries = useUrlState("c", Defaults.countries); // 1
const chartType = useUrlState("ct", Defaults.chartType); // 2
const ageGroups = useUrlState("ag", Defaults.ageGroups); // 3
const type = useUrlState("t", Defaults.type); // 4
const showBaseline = useUrlState("bl", Defaults.showBaseline); // 5
// ... 23 more state variables
```

**Issues**:

- ❌ State can become invalid through URL manipulation
- ❌ No validation of state combinations (e.g., `isExcess: true` + `showBaseline: true`)
- ❌ Date format can mismatch chart type (e.g., yearly chart with weekly date)
- ❌ Hard to see complete state shape
- ❌ Business rules scattered across watchers
- ❌ 51 repetitive event handlers (`handleXXXChanged`)

**Invalid State Examples**:

```typescript
// Valid
chartType: 'yearly' + dateFrom: '2020' ✅

// Invalid - but current system allows
chartType: 'yearly' + dateFrom: '2020-W01' ❌ (wrong date format)
type: 'asmr' + standardPopulation: undefined ❌ (missing required field)
isExcess: true + showBaseline: true ❌ (contradictory flags)
type: 'population' + showBaseline: true ❌ (population has no baseline)
```

### Solution: Zod Schema Validation

**Implementation**: Create comprehensive state schema with validation rules

#### File: `app/model/explorerSchema.ts`

```typescript
import { z } from "zod";

// 1. Define valid enums
export const ChartTypeEnum = z.enum([
  "yearly",
  "midyear",
  "fluseason",
  "monthly",
  "quarterly",
  "weekly",
  "weekly_13w_sma",
  "weekly_26w_sma",
  "weekly_52w_sma",
  "weekly_104w_sma",
]);

export const MetricTypeEnum = z.enum([
  "deaths",
  "cmr",
  "asmr",
  "le",
  "population",
]);
export const StandardPopulationEnum = z.enum(["who", "esp", "usa", "country"]);
export const BaselineMethodEnum = z.enum(["linear", "spline", "naive"]);

// 2. Base schema - field-level validation
const explorerStateBaseSchema = z.object({
  // Country/Age selection
  countries: z
    .array(z.string())
    .min(1, "At least one country required")
    .max(10, "Max 10 countries"),
  ageGroups: z.array(z.string()).min(1, "At least one age group required"),

  // Chart configuration
  chartType: ChartTypeEnum,
  type: MetricTypeEnum,
  standardPopulation: StandardPopulationEnum,

  // Date range
  dateFrom: z.string(),
  dateTo: z.string(),
  sliderStart: z.string().optional(),

  // Baseline configuration
  showBaseline: z.boolean(),
  baselineMethod: BaselineMethodEnum,
  baselineDateFrom: z.string(),
  baselineDateTo: z.string(),

  // Display options
  isExcess: z.boolean(),
  cumulative: z.boolean(),
  showPredictionInterval: z.boolean(),
  showTotal: z.boolean(),
  showPercentage: z.boolean(),
  maximize: z.boolean(),
  showLabels: z.boolean(),
  isLogarithmic: z.boolean(),
});

// 3. Cross-field validation rules
export const explorerStateSchema = explorerStateBaseSchema.superRefine(
  (data, ctx) => {
    // Rule: ASMR requires standardPopulation
    if (data.type === "asmr" && !data.standardPopulation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ASMR metric requires a standard population",
        path: ["standardPopulation"],
      });
    }

    // Rule: Can't show both excess and baseline
    if (data.isExcess && data.showBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot show baseline in excess mode",
        path: ["showBaseline"],
      });
    }

    // Rule: Date format must match chart type
    const yearlyPattern = /^\d{4}$/;
    const monthlyPattern = /^\d{4}-\d{2}$/;
    const weeklyPattern = /^\d{4}-W\d{2}$/;
    const fluseasonPattern = /^\d{4}\/\d{2}$/;

    if (data.chartType === "yearly" && !yearlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly charts (got: ${data.dateFrom})`,
        path: ["dateFrom"],
      });
    }

    if (data.chartType === "monthly" && !monthlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-MM for monthly charts (got: ${data.dateFrom})`,
        path: ["dateFrom"],
      });
    }

    if (
      data.chartType.startsWith("weekly") &&
      !weeklyPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-WNN for weekly charts (got: ${data.dateFrom})`,
        path: ["dateFrom"],
      });
    }

    if (
      (data.chartType === "fluseason" || data.chartType === "midyear") &&
      !fluseasonPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for flu season charts (got: ${data.dateFrom})`,
        path: ["dateFrom"],
      });
    }

    // Rule: dateFrom must be before dateTo
    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before end date",
        path: ["dateTo"],
      });
    }

    // Rule: Baseline dates must be before data dates
    if (data.showBaseline && data.baselineDateFrom >= data.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Baseline period must be before data period",
        path: ["baselineDateFrom"],
      });
    }

    // Rule: Population type can't have baseline or excess
    if (data.type === "population" && (data.showBaseline || data.isExcess)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Population metric does not support baseline or excess calculations",
        path: ["type"],
      });
    }

    // Rule: Prediction intervals only with baseline
    if (data.showPredictionInterval && !data.showBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Prediction intervals require baseline to be enabled",
        path: ["showPredictionInterval"],
      });
    }
  },
);

export type ExplorerState = z.infer<typeof explorerStateBaseSchema>;
```

#### File: `app/composables/useExplorerState.ts`

```typescript
import {
  explorerStateSchema,
  type ExplorerState,
} from "~/model/explorerSchema";
import { Defaults } from "~/model";

export function useExplorerState() {
  // 1. Create all URL state refs (keeping URL-first architecture)
  const countries = useUrlState("c", Defaults.countries);
  const chartType = useUrlState("ct", Defaults.chartType);
  const ageGroups = useUrlState("ag", Defaults.ageGroups);
  const type = useUrlState("t", Defaults.type);
  const showBaseline = useUrlState("bl", Defaults.showBaseline);
  const standardPopulation = useUrlState("sp", Defaults.standardPopulation);
  const baselineMethod = useUrlState("bm", Defaults.baselineMethod);
  const baselineDateFrom = useUrlState("bdf", Defaults.baselineDateFrom);
  const baselineDateTo = useUrlState("bdt", Defaults.baselineDateTo);
  const dateFrom = useUrlState("df", Defaults.dateFrom);
  const dateTo = useUrlState("dt", Defaults.dateTo);
  const sliderStart = useUrlState("ss", Defaults.sliderStart);
  const isExcess = useUrlState("ex", Defaults.isExcess);
  const cumulative = useUrlState("cu", Defaults.cumulative);
  const showPredictionInterval = useUrlState(
    "pi",
    Defaults.showPredictionInterval,
  );
  const showTotal = useUrlState("st", Defaults.showTotal);
  const showPercentage = useUrlState("pct", Defaults.showPercentage);
  const maximize = useUrlState("max", Defaults.maximize);
  const showLabels = useUrlState("lbl", Defaults.showLabels);
  const isLogarithmic = useUrlState("log", Defaults.isLogarithmic);

  // 2. Gather complete state
  const currentState = computed<ExplorerState>(() => ({
    countries: countries.value,
    chartType: chartType.value,
    ageGroups: ageGroups.value,
    type: type.value,
    standardPopulation: standardPopulation.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    sliderStart: sliderStart.value,
    showBaseline: showBaseline.value,
    baselineMethod: baselineMethod.value,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value,
    isExcess: isExcess.value,
    cumulative: cumulative.value,
    showPredictionInterval: showPredictionInterval.value,
    showTotal: showTotal.value,
    showPercentage: showPercentage.value,
    maximize: maximize.value,
    showLabels: showLabels.value,
    isLogarithmic: isLogarithmic.value,
  }));

  // 3. Validate state
  const validationResult = computed(() =>
    explorerStateSchema.safeParse(currentState.value),
  );

  const isValid = computed(() => validationResult.value.success);

  const errors = computed(() =>
    validationResult.value.success ? [] : validationResult.value.error.issues,
  );

  // 4. Auto-fix incompatible state combinations
  watch(
    errors,
    (newErrors) => {
      if (newErrors.length === 0) return;

      console.warn("State validation errors:", newErrors);

      // Auto-fix: Can't show baseline in excess mode
      if (
        newErrors.some((e) =>
          e.message.includes("Cannot show baseline in excess"),
        )
      ) {
        showBaseline.value = false;
      }

      // Auto-fix: Prediction intervals require baseline
      if (newErrors.some((e) => e.message.includes("require baseline"))) {
        showPredictionInterval.value = false;
      }

      // User notification for manual fixes needed
      const userErrorMessages = newErrors
        .filter((e) => !e.message.includes("Cannot show baseline"))
        .filter((e) => !e.message.includes("require baseline"));

      if (userErrorMessages.length > 0) {
        useToast().error(userErrorMessages[0].message);
      }
    },
    { immediate: false },
  );

  // 5. Helper to get validated state or throw
  const getValidatedState = (): ExplorerState => {
    const result = explorerStateSchema.safeParse(currentState.value);
    if (!result.success) {
      throw new Error(`Invalid state: ${result.error.issues[0].message}`);
    }
    return result.data;
  };

  return {
    // Individual state refs (for v-model bindings)
    countries,
    chartType,
    ageGroups,
    type,
    showBaseline,
    standardPopulation,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    dateFrom,
    dateTo,
    sliderStart,
    isExcess,
    cumulative,
    showPredictionInterval,
    showTotal,
    showPercentage,
    maximize,
    showLabels,
    isLogarithmic,

    // Validation API
    currentState,
    isValid,
    errors,
    getValidatedState,
  };
}
```

### Benefits

1. **✅ Prevents Invalid States**: URL manipulation caught immediately
2. **✅ Self-Documenting**: All business rules in one place
3. **✅ Better UX**: Clear error messages instead of silent failures
4. **✅ Type Safety**: Validated state with full TypeScript support
5. **✅ Testable**: Easy to test state transition rules
6. **✅ Auto-Fix**: Common mistakes corrected automatically
7. **✅ URL-First**: Keeps existing architecture (no Pinia needed)

### Implementation Plan

**Phase 1: Foundation** (3 hours)

- [ ] Create `app/model/explorerSchema.ts` with enums and base schema
- [ ] Add basic field validation (types, required fields)
- [ ] Create `useExplorerState()` composable

**Phase 2: Validation Rules** (3 hours)

- [ ] Add cross-field validation rules (7+ rules)
- [ ] Implement date format validation per chart type
- [ ] Add incompatible flag detection

**Phase 3: Integration** (3 hours)

- [ ] Update `explorer.vue` to use `useExplorerState()`
- [ ] Replace 51 event handlers with v-model
- [ ] Add error handling and user notifications

**Phase 4: Testing** (2-3 hours)

- [ ] Write unit tests for schema validation
- [ ] Test all validation rules
- [ ] Test auto-fix behavior
- [ ] Test URL edge cases (bookmarks, manual edits)

**Total Effort**: 11-12 hours (1.5-2 sprints)

### Success Metrics

- ✅ Zero runtime type errors from invalid state
- ✅ All state validation rules covered by tests
- ✅ User-facing error messages for invalid URLs
- ✅ Reduced explorer.vue complexity by ~100 lines

---

## Phase 9.2: Explorer Component Decomposition

**Priority**: 🔴 HIGH
**Effort**: 2-3 sprints
**Impact**: Critical - Improves maintainability, testability, onboarding

### Problem Statement

**File**: `app/pages/explorer.vue` (1,190 lines)

The explorer page is a god object managing too many concerns:

- 28 URL state variables
- 51 event handlers
- Data fetching orchestration
- Chart rendering logic
- Settings panel management
- Loading state coordination
- Feature gating logic

**Metrics**:

- 1,190 lines (target: <500 lines per component)
- 129 statements in script setup
- 23 import statements
- 32 props passed to ExplorerSettings

### Solution: Extract Composables and Components

#### Strategy 1: Use `useExplorerState()` from Phase 9.1

**Benefit**: Eliminates 28 individual refs + 51 event handlers = ~150 lines removed

```typescript
// Before (28 + 51 = 79 lines)
const countries = useUrlState("c", Defaults.countries);
const handleCountriesChanged = (val: string[]) => {
  countries.value = val;
};
// ... 27 more pairs

// After (1 line!)
const state = useExplorerState();
```

#### Strategy 2: Extract Data Orchestration Composable

**File**: `app/composables/useExplorerData.ts`

```typescript
/**
 * Manages data fetching and filtering for explorer page
 */
export function useExplorerData(state: ReturnType<typeof useExplorerState>) {
  const allChartData = ref<AllChartData | undefined>();
  const chartData = ref<MortalityChartData | undefined>();
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Extract complex data update logic from explorer.vue
  const updateData = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // 1. Download dataset
      const dataset = await downloadDataset(
        state.countries.value,
        state.chartType.value,
        state.ageGroups.value,
      );

      // 2. Generate labels
      const labels = getAllChartLabels(dataset, state.chartType.value);

      // 3. Filter data
      const filtered = getFilteredChartData({
        dataset,
        labels,
        dateFrom: state.dateFrom.value,
        dateTo: state.dateTo.value,
        // ... other config
      });

      chartData.value = filtered;
    } catch (e) {
      error.value = e as Error;
      useToast().error("Failed to load data");
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-update when relevant state changes
  watch(
    () => [
      state.countries.value,
      state.chartType.value,
      state.ageGroups.value,
      state.dateFrom.value,
      state.dateTo.value,
    ],
    updateData,
    { deep: true },
  );

  return {
    allChartData,
    chartData,
    isLoading,
    error,
    updateData,
  };
}
```

**Benefit**: Removes ~100 lines from explorer.vue

#### Strategy 3: Extract Settings Panel Component

**Current**: ExplorerSettings.vue receives 32 props and 22 emits

**Solution**: Pass state object instead

```vue
<!-- Before -->
<ExplorerSettings
  :countries="countries"
  :chart-type="chartType"
  :age-groups="ageGroups"
  <!-- ... 29 more props -->
  @countries-changed="handleCountriesChanged"
  @chart-type-changed="handleChartTypeChanged"
  <!-- ... 20 more emits -->
/>

<!-- After -->
<ExplorerSettings
  v-model="state"
  :all-countries="allCountries"
  :all-age-groups="allAgeGroups"
/>
```

**Benefit**: Removes ~60 lines of prop passing

### Total Impact

- **Before**: 1,190 lines
- **After Phase 9.1**: ~1,040 lines (-150 lines: refs + handlers)
- **After Phase 9.2**: ~780 lines (-260 more lines: data orchestration + prop passing)
- **Final**: ~780 lines (34% reduction, under 800 line target)

### Implementation Plan

**Phase 1: State Consolidation** (from Phase 9.1)

- Implement `useExplorerState()` composable
- Update explorer.vue to use it
- Replace event handlers with v-model

**Phase 2: Data Orchestration** (1 sprint)

- [ ] Create `useExplorerData()` composable
- [ ] Extract `updateData()` logic
- [ ] Extract data filtering logic
- [ ] Add proper error handling
- [ ] Update explorer.vue

**Phase 3: Settings Refactor** (1 sprint)

- [ ] Update ExplorerSettings to accept state object
- [ ] Implement v-model pattern for state updates
- [ ] Remove prop drilling
- [ ] Update child components

**Total Effort**: 2-3 sprints

---

## Phase 9.3: State Class Simplification

**Priority**: 🔴 HIGH
**Effort**: 2 sprints
**Impact**: High - Reduces complexity, improves maintainability

### Problem Statement

**File**: `app/model/state.ts` (568 lines)
**File**: `app/model/state/StateCore.ts` (308 lines)

The State class has too many responsibilities:

- State properties management (30+ getters/setters)
- Helper utilities (delegated to StateHelpers)
- Data fetching orchestration
- Chart configuration
- Color normalization
- Serialization (delegated to StateSerialization)

**StateCore Issues**:

- 35+ getter/setter pairs with identical pattern
- Significant boilerplate (308 lines for simple property access)
- 3 `@ts-expect-error` comments
- Dynamic property access causes TypeScript friction

### Solution: Simplified State Architecture

#### Strategy 1: Replace StateCore with Reactive Object

Instead of class with 35 getter/setter pairs, use simple reactive object:

```typescript
// app/model/state/stateProperties.ts

import { reactive } from "vue";
import type { ChartType } from "~/model/period";
import type { Defaults } from "~/model";

export interface StateProperties {
  // Chart configuration
  countries: string[];
  chartType: ChartType;
  ageGroups: string[];
  type: string;
  standardPopulation: string;

  // Date range
  dateFrom: string;
  dateTo: string;
  sliderStart: string;

  // Baseline
  showBaseline: boolean;
  baselineMethod: string;
  baselineDateFrom: string;
  baselineDateTo: string;

  // Display options
  isExcess: boolean;
  cumulative: boolean;
  showPredictionInterval: boolean;
  showTotal: boolean;
  showPercentage: boolean;
  maximize: boolean;
  showLabels: boolean;
  isLogarithmic: boolean;

  // Chart style
  chartStyle: string;
  chartPalette: string;
  chartPaletteReverse: boolean;
  chartColors: string[];

  // Data
  allChartData?: AllChartData;
  filteredChartData?: MortalityChartData;
}

export function createStateProperties(
  defaults: typeof Defaults,
): StateProperties {
  return reactive({
    countries: defaults.countries,
    chartType: defaults.chartType,
    ageGroups: defaults.ageGroups,
    type: defaults.type,
    standardPopulation: defaults.standardPopulation,
    dateFrom: defaults.dateFrom,
    dateTo: defaults.dateTo,
    sliderStart: defaults.sliderStart,
    showBaseline: defaults.showBaseline,
    baselineMethod: defaults.baselineMethod,
    baselineDateFrom: defaults.baselineDateFrom,
    baselineDateTo: defaults.baselineDateTo,
    isExcess: defaults.isExcess,
    cumulative: defaults.cumulative,
    showPredictionInterval: defaults.showPredictionInterval,
    showTotal: defaults.showTotal,
    showPercentage: defaults.showPercentage,
    maximize: defaults.maximize,
    showLabels: defaults.showLabels,
    isLogarithmic: defaults.isLogarithmic,
    chartStyle: defaults.chartStyle,
    chartPalette: defaults.chartPalette,
    chartPaletteReverse: defaults.chartPaletteReverse,
    chartColors: defaults.chartColors,
  });
}
```

**Benefit**: 308 lines → ~80 lines (72% reduction)

#### Strategy 2: Extract Data Fetching Service

```typescript
// app/services/dataService.ts

export class DataService {
  async fetchChartData(config: ChartDataConfig): Promise<MortalityChartData> {
    // All data fetching logic here
    // Separated from state management
  }

  async fetchBaseline(config: BaselineConfig): Promise<BaselineData> {
    // Baseline calculation logic
  }
}
```

#### Strategy 3: Simplify State Class

```typescript
// app/model/state.ts (simplified)

import {
  createStateProperties,
  type StateProperties,
} from "./state/stateProperties";
import { StateHelpers } from "./state/StateHelpers";
import { StateSerialization } from "./state/StateSerialization";
import { DataService } from "~/services/dataService";

export class State {
  // Properties (reactive object, not individual getters/setters)
  private props: StateProperties;

  // Helpers (composition)
  private helpers: StateHelpers;

  // Services
  private dataService: DataService;
  private serialization: StateSerialization;

  constructor(defaults: typeof Defaults) {
    this.props = createStateProperties(defaults);
    this.helpers = new StateHelpers(this.props);
    this.dataService = new DataService();
    this.serialization = new StateSerialization(this);
  }

  // Simple property access (no boilerplate getters/setters)
  get countries() {
    return this.props.countries;
  }
  set countries(v: string[]) {
    this.props.countries = v;
  }

  // Or expose props directly
  get properties() {
    return this.props;
  }

  // Data operations
  async updateData() {
    const data = await this.dataService.fetchChartData({
      countries: this.countries,
      chartType: this.chartType,
      // ... other config
    });
    this.props.filteredChartData = data;
  }

  // Helper method delegation
  isAsmrType() {
    return this.helpers.isAsmrType();
  }
  isDeathsType() {
    return this.helpers.isDeathsType();
  }
  // ... other helpers

  // Serialization
  fromQueryParams(params: Record<string, string>) {
    this.serialization.deserialize(params);
  }

  toQueryParams(): Record<string, string> {
    return this.serialization.serialize();
  }
}
```

### Benefits

1. **✅ Eliminate Boilerplate**: 308 lines → 80 lines in StateCore
2. **✅ Better Separation**: State vs Helpers vs Data Fetching
3. **✅ Improved Testability**: Can test each concern independently
4. **✅ Type Safety**: No more `@ts-expect-error` needed
5. **✅ Simpler Mental Model**: Reactive object instead of getter/setter maze

### Implementation Plan

**Phase 1: Create New Architecture** (1 sprint)

- [ ] Create `stateProperties.ts` with reactive object
- [ ] Create `DataService` class
- [ ] Simplify `State` class to use composition

**Phase 2: Migration** (0.5 sprint)

- [ ] Update all State usages
- [ ] Remove old StateCore
- [ ] Update tests

**Phase 3: Polish** (0.5 sprint)

- [ ] Remove `@ts-expect-error` comments
- [ ] Add proper TypeScript types
- [ ] Documentation

**Total Effort**: 2 sprints

---

## Phase 9.4: Data-Driven Configuration

**Priority**: 🟡 MEDIUM
**Effort**: 2-3 sprints
**Impact**: Medium-High - Makes UI responsive to actual data availability

### Problem Statement

**Current Issue**: Configuration is static but data availability is dynamic

**Example Problems**:

1. **Country List**: Hardcoded list of countries, but not all countries have all data types

   ```typescript
   // User selects USA + Weekly data → works
   // User selects Aruba + Weekly data → no data available!
   // But UI doesn't prevent this selection
   ```

2. **Age Groups**: Hardcoded list, but availability varies by country/source

   ```typescript
   // USA has all age groups for yearly data
   // But many countries only have "all" age group
   // UI shows all options even when unavailable
   ```

3. **Date Ranges**: Not bounded by actual data availability

   ```typescript
   // USA yearly data: 1950-2023 (from world_meta.csv)
   // But date slider allows selecting 2024, 2025...
   // Results in empty charts
   ```

4. **Chart Types**: Not all countries have all chart types
   ```typescript
   // Some countries only have yearly (type=1)
   // Some have monthly (type=2)
   // Some have weekly (type=3)
   // But UI shows all options
   ```

### Data Sources

#### 1. Metadata CSV: `world_meta.csv`

Located at: `https://s3.mortality.watch/data/mortality/world_meta.csv`

```csv
iso3c,jurisdiction,type,source,min_date,max_date,age_groups
USA,United States,1,un,1950-01-01,2023-01-01,all
USA,United States,2,world_mortality,2015-01-01,2023-12-01,all
USA,United States,3,cdc,2014-12-28,2023-09-30,"0-9,10-19,20-29,30-39,40-49,50-59,60-69,70-79,80+,all"
SWE,Sweden,1,un,1950-01-01,2023-01-01,all
SWE,Sweden,2,eurostat,2000-01-01,2023-12-01,all
SWE,Sweden,3,eurostat,2014-12-29,2023-09-24,"0-9,10-19,20-29,30-39,40-49,50-59,60-69,70-79,80+,all"
```

**Fields**:

- `iso3c`: Country code
- `jurisdiction`: Full country name
- `type`: Data type (1=yearly, 2=monthly, 3=weekly)
- `source`: Data source (un, eurostat, cdc, etc.)
- `min_date`: Earliest available date
- `max_date`: Latest available date
- `age_groups`: Comma-separated list of available age groups

#### 2. Individual Data Files

Located at: `https://s3.mortality.watch/data/mortality/{country}/{chartType}_{ageGroup}.csv`

Examples:

- `USA/yearly.csv` - USA yearly data, all ages
- `USA/monthly_0-9.csv` - USA monthly data, ages 0-9
- `SWE/weekly_all.csv` - Sweden weekly data, all ages

### Solution: Dynamic Configuration System

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Selection                          │
│  Countries: [USA, SWE]  Age Groups: [all, 0-9]            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Metadata Service                               │
│  - Load world_meta.csv                                     │
│  - Parse metadata                                          │
│  - Cache in memory                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          Availability Calculator                            │
│  - Filter by selected countries                            │
│  - Find common chart types                                 │
│  - Find common age groups                                  │
│  - Calculate date range intersection                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              UI Configuration                               │
│  - Disable unavailable chart types                         │
│  - Hide unavailable age groups                             │
│  - Restrict date range to available data                   │
│  - Show tooltips explaining constraints                    │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

**File**: `app/services/metadataService.ts`

```typescript
import Papa from "papaparse";
import { DataLoader } from "~/lib/dataLoader";

export interface MetadataEntry {
  iso3c: string;
  jurisdiction: string;
  type: "1" | "2" | "3"; // 1=yearly, 2=monthly, 3=weekly
  source: string;
  minDate: string;
  maxDate: string;
  ageGroups: string[];
}

export class MetadataService {
  private metadata: MetadataEntry[] | null = null;
  private loader = new DataLoader();

  /**
   * Load and parse world_meta.csv
   */
  async load(): Promise<void> {
    if (this.metadata) return; // Already loaded

    const csv = await this.loader.fetchMetadata();
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    this.metadata = parsed.data.map((row) => ({
      iso3c: row.iso3c,
      jurisdiction: row.jurisdiction,
      type: row.type as "1" | "2" | "3",
      source: row.source,
      minDate: row.min_date,
      maxDate: row.max_date,
      ageGroups: row.age_groups.split(",").map((s) => s.trim()),
    }));
  }

  /**
   * Get all available chart types for given countries
   */
  getAvailableChartTypes(countries: string[]): ChartType[] {
    if (!this.metadata) throw new Error("Metadata not loaded");

    // Find entries for selected countries
    const entries = this.metadata.filter((e) => countries.includes(e.iso3c));

    // Find common types across all countries
    const typesByCountry = countries.map((country) => {
      const countryEntries = entries.filter((e) => e.iso3c === country);
      return new Set(countryEntries.map((e) => e.type));
    });

    // Intersection of all sets
    const commonTypes = typesByCountry.reduce(
      (acc, set) => new Set([...acc].filter((x) => set.has(x))),
    );

    // Map to chart types
    const typeMap: Record<string, ChartType[]> = {
      "1": ["yearly", "midyear", "fluseason"],
      "2": ["monthly", "quarterly"],
      "3": [
        "weekly",
        "weekly_13w_sma",
        "weekly_26w_sma",
        "weekly_52w_sma",
        "weekly_104w_sma",
      ],
    };

    return Array.from(commonTypes).flatMap((type) => typeMap[type] || []);
  }

  /**
   * Get all available age groups for given countries and chart type
   */
  getAvailableAgeGroups(countries: string[], chartType: ChartType): string[] {
    if (!this.metadata) throw new Error("Metadata not loaded");

    const dataType = this.chartTypeToDataType(chartType);

    // Find entries matching countries and type
    const entries = this.metadata.filter(
      (e) => countries.includes(e.iso3c) && e.type === dataType,
    );

    // Find common age groups across all countries
    const ageGroupsByCountry = countries.map((country) => {
      const countryEntries = entries.filter((e) => e.iso3c === country);
      const allAgeGroups = countryEntries.flatMap((e) => e.ageGroups);
      return new Set(allAgeGroups);
    });

    // Intersection
    const commonAgeGroups = ageGroupsByCountry.reduce(
      (acc, set) => new Set([...acc].filter((x) => set.has(x))),
    );

    return Array.from(commonAgeGroups);
  }

  /**
   * Get date range for given countries, chart type, and age groups
   */
  getAvailableDateRange(
    countries: string[],
    chartType: ChartType,
    ageGroups: string[],
  ): { minDate: string; maxDate: string } | null {
    if (!this.metadata) throw new Error("Metadata not loaded");

    const dataType = this.chartTypeToDataType(chartType);

    // Find entries matching all criteria
    const entries = this.metadata.filter(
      (e) =>
        countries.includes(e.iso3c) &&
        e.type === dataType &&
        ageGroups.some((ag) => e.ageGroups.includes(ag)),
    );

    if (entries.length === 0) return null;

    // Find intersection of date ranges (latest start, earliest end)
    const minDate = entries.reduce(
      (max, e) => (e.minDate > max ? e.minDate : max),
      entries[0].minDate,
    );

    const maxDate = entries.reduce(
      (min, e) => (e.maxDate < min ? e.maxDate : min),
      entries[0].maxDate,
    );

    return { minDate, maxDate };
  }

  /**
   * Check if specific combination is available
   */
  isAvailable(
    country: string,
    chartType: ChartType,
    ageGroup: string,
  ): boolean {
    if (!this.metadata) return false;

    const dataType = this.chartTypeToDataType(chartType);

    return this.metadata.some(
      (e) =>
        e.iso3c === country &&
        e.type === dataType &&
        e.ageGroups.includes(ageGroup),
    );
  }

  private chartTypeToDataType(chartType: ChartType): "1" | "2" | "3" {
    if (["yearly", "midyear", "fluseason"].includes(chartType)) return "1";
    if (["monthly", "quarterly"].includes(chartType)) return "2";
    return "3";
  }
}

// Singleton instance
export const metadataService = new MetadataService();
```

**File**: `app/composables/useDataAvailability.ts`

```typescript
import { metadataService } from "~/services/metadataService";

export function useDataAvailability(
  state: ReturnType<typeof useExplorerState>,
) {
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  // Load metadata on mount
  onMounted(async () => {
    try {
      await metadataService.load();
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  });

  // Available chart types for selected countries
  const availableChartTypes = computed(() => {
    if (isLoading.value || !state.countries.value.length) return [];
    return metadataService.getAvailableChartTypes(state.countries.value);
  });

  // Available age groups for selected countries + chart type
  const availableAgeGroups = computed(() => {
    if (isLoading.value || !state.countries.value.length) return [];
    return metadataService.getAvailableAgeGroups(
      state.countries.value,
      state.chartType.value,
    );
  });

  // Available date range for current selection
  const availableDateRange = computed(() => {
    if (isLoading.value || !state.countries.value.length) return null;
    return metadataService.getAvailableDateRange(
      state.countries.value,
      state.chartType.value,
      state.ageGroups.value,
    );
  });

  // Auto-correct invalid selections
  watch([availableChartTypes, state.chartType], ([available, current]) => {
    if (available.length > 0 && !available.includes(current)) {
      // Current chart type not available, switch to first available
      state.chartType.value = available[0];
      useToast().warning(
        `Chart type changed to ${available[0]} (only type available for selected countries)`,
      );
    }
  });

  watch([availableAgeGroups, state.ageGroups], ([available, current]) => {
    const invalidGroups = current.filter((g) => !available.includes(g));
    if (invalidGroups.length > 0) {
      // Remove invalid age groups
      state.ageGroups.value = current.filter((g) => available.includes(g));
      if (state.ageGroups.value.length === 0) {
        state.ageGroups.value = [available[0]]; // Select first available
      }
      useToast().warning(
        "Some age groups not available for selected countries",
      );
    }
  });

  watch(
    [availableDateRange, state.dateFrom, state.dateTo],
    ([range, from, to]) => {
      if (!range) return;

      // Clamp dates to available range
      if (from < range.minDate) {
        state.dateFrom.value = range.minDate;
      }
      if (to > range.maxDate) {
        state.dateTo.value = range.maxDate;
      }
    },
  );

  return {
    isLoading,
    error,
    availableChartTypes,
    availableAgeGroups,
    availableDateRange,
    isAvailable: (country: string, chartType: ChartType, ageGroup: string) =>
      metadataService.isAvailable(country, chartType, ageGroup),
  };
}
```

**Usage in Components**:

```vue
<!-- ExplorerDataSelection.vue -->
<script setup lang="ts">
const state = useExplorerState();
const availability = useDataAvailability(state);

// Disable unavailable chart types
const chartTypeOptions = computed(() => {
  return allChartTypes.map((type) => ({
    value: type,
    label: chartTypeLabels[type],
    disabled: !availability.availableChartTypes.value.includes(type),
    tooltip: !availability.availableChartTypes.value.includes(type)
      ? "Not available for selected countries"
      : undefined,
  }));
});

// Filter age group list
const ageGroupOptions = computed(() => {
  return allAgeGroups.filter((ag) =>
    availability.availableAgeGroups.value.includes(ag),
  );
});

// Restrict date range
const dateRange = computed(() => availability.availableDateRange.value);
</script>

<template>
  <div>
    <!-- Chart type selector with disabled options -->
    <USelect v-model="state.chartType" :options="chartTypeOptions" />

    <!-- Age group selector (filtered) -->
    <USelectMenu v-model="state.ageGroups" :options="ageGroupOptions" />

    <!-- Date slider with restricted range -->
    <DateSlider
      v-model="state.dateFrom"
      :labels="dateLabels"
      :min="dateRange?.minDate"
      :max="dateRange?.maxDate"
    />
  </div>
</template>
```

### Benefits

1. **✅ No Empty Charts**: Can't select combinations with no data
2. **✅ Better UX**: Disabled options show why they're unavailable
3. **✅ Fewer Errors**: Auto-correction prevents invalid states
4. **✅ Data-Driven**: UI reflects actual data availability
5. **✅ Performance**: Metadata cached, fast lookups
6. **✅ Maintainable**: Single source of truth (world_meta.csv)

### Implementation Plan

**Phase 1: Metadata Service** (1 sprint)

- [ ] Create `MetadataService` class
- [ ] Implement metadata loading and parsing
- [ ] Add availability calculation methods
- [ ] Write unit tests

**Phase 2: Availability Composable** (0.5 sprint)

- [ ] Create `useDataAvailability()` composable
- [ ] Implement auto-correction logic
- [ ] Add user notifications

**Phase 3: UI Integration** (1 sprint)

- [ ] Update ExplorerDataSelection with disabled options
- [ ] Update date sliders with range restrictions
- [ ] Add tooltips explaining constraints
- [ ] Test all combinations

**Phase 4: Caching & Performance** (0.5 sprint)

- [ ] Implement metadata caching
- [ ] Optimize availability calculations
- [ ] Add loading states

**Total Effort**: 3 sprints

---

## Phase 9.5: Remaining Medium Priority Items

### 9.5.1: Simplify ranking.vue (895 lines)

**Issue**: Template duplication for mobile/desktop views
**Solution**: Extract responsive components
**Effort**: 1 sprint

### 9.5.2: Reduce ExplorerSettings Props (41 props)

**Issue**: Excessive prop drilling
**Solution**: Use state object from Phase 9.1
**Effort**: 0.5 sprint (part of 9.1)

### 9.5.3: Refactor makeBarLineChartConfig() (200+ lines)

**Issue**: Giant function with nested configuration
**Solution**: Extract sub-functions, use builder pattern
**Effort**: 1 sprint

### 9.5.4: Fix Type Safety (@ts-expect-error, as any)

**Issue**: 31 occurrences of type bypassing
**Solution**: Create proper type definitions, fix SSR typing
**Effort**: 0.5 sprint

### 9.5.5: Centralize Feature Gating

**Issue**: Tier-based logic scattered across files
**Solution**: Create feature flag service
**Effort**: 0.5 sprint

### 9.5.6: Implement Data Caching

**Issue**: No caching for dataset fetches
**Solution**: Add request caching with SWR pattern
**Effort**: 1 sprint

### 9.5.7: Decouple State/Serialization

**Issue**: Circular dependency between State and StateSerialization
**Solution**: Use dependency injection pattern
**Effort**: 0.5 sprint

---

## Summary & Prioritization

### Effort by Priority

| Priority  | Tasks                   | Effort            | Impact   |
| --------- | ----------------------- | ----------------- | -------- |
| 🔴 HIGH   | 3 tasks (9.1, 9.2, 9.3) | 5-7 sprints       | Critical |
| 🟡 MEDIUM | 8 tasks (9.4, 9.5.\*)   | 5-6 sprints       | High     |
| **TOTAL** | **11 tasks**            | **10-13 sprints** | -        |

### Recommended Execution Order

**Sprint 1-2: State Foundation**

- Phase 9.1: State schema validation
- Benefit: Immediate stability improvement

**Sprint 3-5: Component Decomposition**

- Phase 9.2: Extract explorer.vue composables
- Phase 9.3: Simplify State class
- Benefit: Major complexity reduction

**Sprint 6-8: Data-Driven Config**

- Phase 9.4: Metadata service + availability
- Benefit: Better UX, fewer errors

**Sprint 9-10: Polish**

- Phase 9.5: Medium priority items
- Benefit: Code quality improvements

### Success Metrics

- ✅ explorer.vue under 800 lines (from 1,190)
- ✅ State class under 300 lines (from 568)
- ✅ Zero invalid state combinations
- ✅ All UI options reflect actual data availability
- ✅ <5 @ts-expect-error usages (from 31)
- ✅ Test coverage >80% for state validation

---

## Next Steps

1. **Review & Approve**: Get team buy-in on approach
2. **Spike**: 1-day spike on Phase 9.1 to validate design
3. **Execute**: Start with Phase 9.1 (highest ROI)
4. **Iterate**: Gather feedback, adjust plan

**Estimated Timeline**: 10-13 sprints (2.5-3 months for single developer)

---

## Appendix: Phase 8.5 Completion Status

For reference, here's what was completed in Phase 8.5:

✅ Phase 8.5.1 - Component extraction (PR #10)
✅ Phase 8.5.2 - Config object pattern (PR #11)
✅ Phase 8.5.3 - ChartPeriod/DateRange model (PR #12)
✅ Phase 8.5.4.1 - Quick wins (PR #13)
✅ Phase 8.5.4.2 - High-impact refactorings (PRs #14, #15)
✅ Phase 8.5.4.3 - Long-term code health (PRs #16, #17)

**Phase 8.5 Result**: 30% complexity reduction, 514 tests passing, excellent foundation for Phase 9.
