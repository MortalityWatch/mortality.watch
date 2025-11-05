# Composables Architecture

This directory contains Vue 3 composables that provide reusable logic for the Mortality Watch application. Composables follow a modular, single-responsibility design pattern and are organized by functional domain.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Composable Categories](#composable-categories)
4. [Dependency Graph](#dependency-graph)
5. [Patterns and Best Practices](#patterns-and-best-practices)
6. [Usage Examples](#usage-examples)
7. [Testing Strategies](#testing-strategies)

## Overview

Composables are the primary mechanism for sharing stateful logic across components in this application. They provide:

- **State management**: Reactive state with Vue's composition API
- **Business logic**: Domain-specific operations and calculations
- **Side effects**: Data fetching, URL synchronization, and external integrations
- **Code reuse**: Shared logic without component inheritance

### When to Create New Composables

Create a new composable when you have:

1. **Reusable logic** used by 2+ components
2. **Complex state management** that would clutter a component
3. **Side effects** (API calls, subscriptions) that need cleanup
4. **Business logic** that should be tested independently
5. **Cross-cutting concerns** (auth, data fetching, filtering)

**Don't create composables for:**

- Single-use component logic (keep it in the component)
- Pure utility functions (use `/lib/utils` instead)
- Simple computed values (inline them)

## Architecture Philosophy

### 1. Single Responsibility Principle

Each composable has a clear, focused purpose:

- `useAuth` → Authentication state and operations
- `useDataQualityFilters` → Filter logic only
- `useChartDataFetcher` → Data fetching only

### 2. Composition Over Inheritance

Composables can be composed to build complex functionality:

```typescript
// useExplorerDataOrchestration composes multiple composables
const dataFetcher = useChartDataFetcher()
const { getValidatedRange } = useDateRangeValidation()
```

### 3. Dependency Injection

Composables accept dependencies as parameters rather than importing them directly:

```typescript
// Good - testable and flexible
export function useRankingData(
  state: ReturnType<typeof useRankingState>,
  metaData: ComputedRef<Record<string, Country>>
) { ... }

// Avoid - hard to test and tightly coupled
export function useRankingData() {
  const state = useRankingState() // hard-coded dependency
}
```

### 4. URL-First State Management

Many composables use `useUrlState` for state synchronization:

- State changes update URL
- URL changes update state
- Enables shareable links and browser navigation
- Maintains single source of truth

## Composable Categories

### Data Management

Composables that handle data fetching, processing, and orchestration.

#### `useChartDataFetcher.ts`

**Purpose**: Centralized data fetching for charts (shared by explorer and ranking pages)

**Key Functions**:
- `fetchChartData()` - Complete data fetch with baseline validation
- `fetchDatasetOnly()` - Raw data fetch without processing
- `validateBaselineDates()` - Ensure baseline dates are valid

**Returns**: Dataset, labels, chart data, loading state

**Dependencies**: None (leaf composable)

**Phase**: 10.3

---

#### `useExplorerDataOrchestration.ts`

**Purpose**: Orchestrates data fetching, filtering, and date management for explorer page

**Key Functions**:
- `updateData()` - Main data update with loading overlay
- `updateFilteredData()` - Apply filters to raw data
- `resetDates()` - Validate and reset date ranges
- `configureOptions()` - Update chart option visibility

**Returns**: Chart data, labels, loading state, chart options

**Dependencies**:
- `useChartDataFetcher` (data fetching)
- `useDateRangeValidation` (date validation)
- `useExplorerState` (injected)
- `useExplorerHelpers` (injected)

**Phase**: 9.2, 10.3, 12e

---

#### `useRankingData.ts`

**Purpose**: Manages data fetching and processing for ranking tables

**Key Functions**:
- `updateRankingData()` - Fetch and process ranking data
- `maybeResetBaselineSlider()` - Update baseline range on changes
- `getVisibleCountries()` - Apply jurisdiction filters

**Returns**: Table rows, labels, loading state

**Dependencies**:
- `useChartDataFetcher` (data fetching)
- `usePeriodFormat` (date formatting)
- `useJurisdictionFilter` (filtering)
- `useRankingState` (injected)

**Phase**: 10.1.2, 10.3

---

### Chart Actions

Composables that handle chart interactions and exports.

#### `useExplorerChartActions.ts`

**Purpose**: Provides chart action functions (copy, save, export, screenshot)

**Key Functions**:
- `copyChartLink()` - Copy current URL to clipboard
- `screenshotChart()` - Export chart as PNG
- `saveToDB()` - Save chart configuration to database
- `exportCSV()` - Export chart data as CSV
- `exportJSON()` - Export chart data as JSON

**Returns**: Action functions, save modal state

**Dependencies**:
- `useSaveChart` (save functionality)

**Phase**: 5a

---

#### `useSaveChart.ts`

**Purpose**: Generic chart/ranking save functionality with modal management

**Key Functions**:
- `openSaveModal()` - Show save dialog
- `saveToDB()` - Save to database via API
- `closeSaveModal()` - Hide save dialog

**Returns**: Modal state, save functions

**Dependencies**: None (leaf composable)

**Phase**: 0 (early extraction)

---

#### `useExplorerColors.ts`

**Purpose**: Manages chart color customization

**Key Functions**:
- Color palette management
- User-selected color persistence

**Returns**: Color state and functions

**Dependencies**: None

---

### Data Quality

Composables for the admin data quality management page.

#### `useDataQualityFilters.ts`

**Purpose**: Manages filtering state for data quality page

**Key Functions**:
- Search query filtering
- Status filtering (fresh/stale)
- Source filtering
- Override visibility (show/hide muted countries)

**Returns**: Filter state, filtered countries, options

**Dependencies**: None (leaf composable)

**Phase**: 12g

---

#### `useDataQualityOverrides.ts`

**Purpose**: Manages country-level override settings (mute/hide)

**Key Functions**:
- Update override status
- Persist overrides to database

**Returns**: Override functions, loading state

**Dependencies**: None

---

#### `useDataQualityTable.ts`

**Purpose**: Table state management (sorting, pagination)

**Key Functions**:
- Column sorting
- Pagination state

**Returns**: Table state and controls

**Dependencies**: None

---

### State Management

Composables that manage application state.

#### `useExplorerState.ts`

**Purpose**: Centralized state management for explorer page with validation

**Key Functions**:
- All URL state refs (countries, dates, chart options)
- Real-time Zod validation
- Auto-fix for incompatible state combinations
- User notifications for invalid states

**Returns**: 30+ state refs, validation API

**Dependencies**:
- `useUrlState` (URL synchronization)

**Phase**: 9.1

---

#### `useRankingState.ts`

**Purpose**: State management for ranking page

**Returns**: Ranking-specific state refs

**Dependencies**:
- `useUrlState`

---

#### `useUrlState.ts`

**Purpose**: Bidirectional URL-state synchronization

**Key Functions**:
- Sync ref with URL query parameter
- Custom encode/decode functions
- Browser history management

**Returns**: Reactive ref synchronized with URL

**Dependencies**: None (leaf composable)

**Used by**: Almost all state composables

---

### Utilities

Helper composables for common operations.

#### `useExplorerHelpers.ts`

**Purpose**: Helper functions for explorer page logic

**Key Functions**:
- Type checking (`isAsmrType`, `isPopulationType`)
- Chart style detection (`isLineChartStyle`, `isBarChartStyle`)
- Conditional logic helpers

**Returns**: Helper function object

**Dependencies**: None (injected refs)

---

#### `useDataAvailability.ts`

**Purpose**: Check data availability for country/chart combinations

**Returns**: Data availability checks

**Dependencies**: None

---

#### `useDateRangeValidation.ts`

**Purpose**: Validates and corrects date ranges for different chart types

**Key Functions**:
- `getValidatedRange()` - Ensure dates are valid and in correct order

**Returns**: Validation functions

**Dependencies**: None (uses ChartPeriod class)

---

#### `usePeriodFormat.ts`

**Purpose**: Format dates/periods for different chart types

**Returns**: Date formatting functions

**Dependencies**: None

---

#### `useJurisdictionFilter.ts`

**Purpose**: Filter countries by region/jurisdiction

**Returns**: Filter functions

**Dependencies**: None

---

### UI State

Composables for UI-specific state management.

#### `useAuth.ts`

**Purpose**: Authentication state and operations

**Returns**: User state, login/logout functions

**Dependencies**: None

---

#### `useTheme.ts`

**Purpose**: Dark/light theme management

**Returns**: Theme state, toggle function

**Dependencies**: None

---

#### `useLoading.ts`

**Purpose**: Global loading state management

**Returns**: Loading state, show/hide functions

**Dependencies**: None

---

#### `usePagination.ts`

**Purpose**: Generic pagination state

**Returns**: Page number, page size, navigation functions

**Dependencies**: None

---

## Dependency Graph

This diagram shows the dependency relationships between major composables:

```
┌─────────────────────────────────────────────────────────────┐
│                        Pages/Components                      │
│                     (explorer.vue, etc.)                     │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ useExplorerDataOrchestration│   │    useRankingData        │
│  - Orchestrates data flow  │   │  - Ranking data mgmt     │
└───────────────────────────┘   └───────────────────────────┘
                │                               │
    ┌───────────┼───────────┬───────────────────┤
    │           │           │                   │
    ▼           ▼           ▼                   ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│useChart │ │useDate   │ │useExplorer   │ │usePeriod     │
│Data     │ │Range     │ │Helpers       │ │Format        │
│Fetcher  │ │Validation│ │              │ │              │
└─────────┘ └──────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      State Layer                             │
├─────────────────────────────────────────────────────────────┤
│  useExplorerState ──┐                                        │
│  useRankingState  ──┼──> useUrlState                        │
│  useAuth          ──┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Dependency Principles

1. **No circular dependencies**: Composables never import each other circularly
2. **Leaf composables**: `useUrlState`, `useChartDataFetcher` have no dependencies
3. **Orchestrator composables**: `useExplorerDataOrchestration` composes multiple others
4. **Injected dependencies**: Higher-level composables inject state rather than importing

### Detailed Dependency Graph

Below is a comprehensive view of composable relationships, showing the full dependency tree:

```
Pages/Components
│
├─> useExplorerDataOrchestration (Orchestrator - Phase 9.2, 10.3, 12e)
│   ├─> useChartDataFetcher (Data fetching - Phase 10.3)
│   ├─> useDateRangeValidation (Date validation)
│   ├─> useExplorerState (Injected - Phase 9.1)
│   │   └─> useUrlState (URL sync - leaf)
│   └─> useExplorerHelpers (Injected)
│
├─> useRankingData (Data management - Phase 10.1.2, 10.3)
│   ├─> useChartDataFetcher (Shared data fetching)
│   ├─> usePeriodFormat (Date formatting)
│   ├─> useJurisdictionFilter (Filtering)
│   └─> useRankingState (Injected)
│       └─> useUrlState (URL sync - leaf)
│
├─> useExplorerChartActions (UI actions - Phase 5a)
│   └─> useSaveChart (Save functionality - Phase 0)
│
├─> Data Quality Composables (Phase 12g - Admin page)
│   ├─> useDataQualityFilters (Filter logic - leaf)
│   ├─> useDataQualityOverrides (Override management - leaf)
│   └─> useDataQualityTable (Table state - leaf)
│
└─> Independent Composables (No dependencies)
    ├─> useAuth (Authentication)
    ├─> useTheme (Theme management)
    ├─> useLoading (Loading state)
    ├─> usePagination (Pagination)
    ├─> useExplorerColors (Color management)
    ├─> useDataAvailability (Data checks)
    ├─> useCountryFilter (Country filtering)
    ├─> useFeatureAccess (Feature gating)
    └─> useIncognitoMode (Privacy mode)
```

### Composable Dependency Matrix

This table provides a quick reference for understanding composable relationships:

| Composable | Depends On | Used By | Category | Phase |
|------------|------------|---------|----------|-------|
| **useUrlState** | None | useExplorerState, useRankingState | State (leaf) | Early |
| **useChartDataFetcher** | None | useExplorerDataOrchestration, useRankingData | Data (leaf) | 10.3 |
| **useExplorerState** | useUrlState | useExplorerDataOrchestration, explorer.vue | State | 9.1 |
| **useRankingState** | useUrlState | useRankingData, ranking.vue | State | 10.1 |
| **useExplorerHelpers** | None (injected refs) | useExplorerDataOrchestration | Utilities | 9.2 |
| **useDateRangeValidation** | None | useExplorerDataOrchestration | Utilities | - |
| **usePeriodFormat** | None | useRankingData | Utilities | - |
| **useJurisdictionFilter** | None | useRankingData | Utilities | - |
| **useExplorerDataOrchestration** | useChartDataFetcher, useDateRangeValidation, useExplorerState (inj), useExplorerHelpers (inj) | explorer.vue | Data (orchestrator) | 9.2, 10.3 |
| **useRankingData** | useChartDataFetcher, usePeriodFormat, useJurisdictionFilter, useRankingState (inj) | ranking.vue | Data (orchestrator) | 10.1.2 |
| **useSaveChart** | None | useExplorerChartActions | Actions (leaf) | 0 |
| **useExplorerChartActions** | useSaveChart | explorer.vue | Actions | 5a |
| **useExplorerColors** | None | explorer.vue | UI State | - |
| **useDataQualityFilters** | None | data-quality.vue | Data Quality | 12g |
| **useDataQualityOverrides** | None | data-quality.vue | Data Quality | 12g |
| **useDataQualityTable** | None | data-quality.vue | Data Quality | 12g |
| **useAuth** | None | Multiple pages | Auth | Early |
| **useTheme** | None | App layout | UI State | - |
| **useLoading** | None | Multiple components | UI State | - |
| **usePagination** | None | Table components | UI State | - |

**Legend**:
- **(inj)** = Dependency injected via parameters (not imported)
- **leaf** = No dependencies on other composables
- **orchestrator** = Composes multiple other composables

### Composition Patterns

#### Pattern 1: Data Orchestration with Dependency Injection

Large orchestrator composables use dependency injection to compose smaller utilities:

```typescript
// Orchestrator accepts state and helpers as parameters (injected)
export function useExplorerDataOrchestration(
  state: ReturnType<typeof useExplorerState>,
  helpers: ReturnType<typeof useExplorerHelpers>,
  allCountries: Ref<Record<string, Country>>,
  displayColors: ComputedRef<string[]>
) {
  // Compose utility composables internally
  const dataFetcher = useChartDataFetcher()
  const { getValidatedRange } = useDateRangeValidation()

  // Business logic that coordinates everything
  // ...
}
```

**Benefits**:
- Testable: Can inject mock dependencies
- Flexible: Can reuse helpers across different contexts
- Clear: Dependencies are explicit in function signature
- No circular imports

#### Pattern 2: Shared Data Fetching

Multiple orchestrators share common data fetching logic via `useChartDataFetcher`:

```typescript
// Both explorer and ranking use the same data fetching
const dataFetcher = useChartDataFetcher()

// Eliminates 250-350 lines of duplicated code
// Ensures consistent error handling and loading states
```

**Benefits**:
- DRY: Single source of truth for data fetching
- Consistency: Same behavior across pages
- Maintainability: Fix bugs in one place

#### Pattern 3: URL-First State Management

State composables use `useUrlState` as their foundation:

```typescript
export function useExplorerState() {
  // All state backed by URL
  const countries = useUrlState('c', ['USA'])
  const chartType = useUrlState('t', 'yearly')

  // URL is source of truth
  // Enables shareable links and browser navigation
}
```

**Benefits**:
- Shareable: Copy URL to share exact state
- Navigable: Back/forward buttons work
- Bookmarkable: Save URLs for later
- Single source of truth

#### Pattern 4: Thin UI Action Wrappers

Action composables delegate to specialized composables:

```typescript
export function useExplorerChartActions(state, chartData) {
  // Delegate to specialized save composable
  const saveChart = useSaveChart({ chartType: 'explorer' })

  // Thin wrappers for UI actions
  const copyChartLink = async () => { /* simple logic */ }
  const screenshotChart = () => { /* simple logic */ }

  return { copyChartLink, screenshotChart, ...saveChart }
}
```

**Benefits**:
- Separation: UI logic separate from business logic
- Reusability: Save logic shared across pages
- Simplicity: Each function does one thing

#### Pattern 5: Isolated Domain Composables

Data quality composables are independent and focused:

```typescript
// Each handles a specific concern
useDataQualityFilters  // Search, status, source filtering
useDataQualityOverrides // Mute/hide country overrides
useDataQualityTable    // Sorting, pagination

// No cross-dependencies - truly modular
```

**Benefits**:
- Modularity: Each can be tested in isolation
- Clarity: Single responsibility per composable
- Maintainability: Changes don't ripple across codebase

### Anti-patterns to Avoid

#### 1. Circular Dependencies
```typescript
// BAD: Circular import
// useA.ts
import { useB } from './useB'
export function useA() {
  const b = useB() // useB imports useA - circular!
}
```

**Solution**: Use dependency injection or shared state composables.

#### 2. Direct DOM Access
```typescript
// BAD: Accessing DOM directly
export function useBadExample() {
  const element = document.querySelector('#my-element')
  // Tightly coupled to DOM structure
}

// GOOD: Accept ref as parameter
export function useGoodExample(elementRef: Ref<HTMLElement>) {
  // Work with Vue ref instead
}
```

#### 3. Business Logic in UI Actions
```typescript
// BAD: Complex logic in action composable
export function useChartActions() {
  const saveChart = async () => {
    // 100 lines of validation, transformation, API calls
    // Should be in a separate composable!
  }
}

// GOOD: Delegate to specialized composable
export function useChartActions() {
  const { saveToDB } = useSaveChart()
  const saveChart = () => saveToDB(state)
}
```

#### 4. Importing State Instead of Injecting
```typescript
// BAD: Hard-coded dependency
export function useDataProcessor() {
  const state = useExplorerState() // Can't test with different state
}

// GOOD: Accept state as parameter
export function useDataProcessor(
  state: ReturnType<typeof useExplorerState>
) {
  // Now testable with mock state
}
```

#### 5. Multiple Responsibilities
```typescript
// BAD: Composable doing too much
export function useEverything() {
  // Data fetching
  // Filtering
  // Sorting
  // Pagination
  // Export
  // Save
  // ALL IN ONE!
}

// GOOD: Split into focused composables
useDataFetcher()
useFilters()
useSorting()
usePagination()
useExport()
useSave()
```

### Future Composables (Phase 15+)

The following composables are planned for future phases:

#### useErrorRecovery (Phase 15b)
**Purpose**: Centralized error handling with retry logic

**Planned usage**:
```typescript
const { withRetry, handleError } = useErrorRecovery()

// Wrap data fetching with automatic retry
await withRetry(() => fetchData())
```

**Will be used by**:
- useChartDataFetcher
- useRankingData
- useDataQualityOverrides

#### useFormValidation (Phase 15c)
**Purpose**: Reusable form validation logic

**Planned usage**:
```typescript
const { validate, errors, isValid } = useFormValidation(schema)
```

**Will be used by**:
- Auth forms (login, signup)
- Profile forms
- Admin forms
- Chart save modal

#### Integration Notes

When these composables are implemented:
1. Update dependency matrix to include them
2. Add to dependency graph
3. Update orchestrator composables to use them
4. Ensure they follow the leaf composable pattern (minimal dependencies)

## Patterns and Best Practices

### Naming Conventions

- **Prefix**: All composables start with `use`
- **Nouns**: `useAuth`, `useTheme` (state/service)
- **Domain-specific**: `useExplorerHelpers`, `useRankingData` (clear scope)
- **Descriptive**: `useDateRangeValidation` > `useDates`

### State Management Approaches

#### 1. Reactive References (ref)

Use for simple values:

```typescript
const isLoading = ref(false)
const count = ref(0)
```

#### 2. Reactive Objects (reactive)

Use for grouped state:

```typescript
const chartOptions = reactive({
  showBaseline: true,
  showPredictionInterval: false,
  cumulative: false
})
```

#### 3. Computed Values

Use for derived state:

```typescript
const displayColors = computed(() => {
  return userColors.value || defaultColors
})
```

**When to use computed vs ref:**

- **computed**: Value depends on other reactive values
- **ref**: Value is independent or set directly

### Error Handling

Composables should handle errors gracefully:

```typescript
export function useDataFetcher() {
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function fetchData() {
    try {
      isLoading.value = true
      error.value = null
      // ... fetch logic
    } catch (e) {
      error.value = e as Error
      handleError(e, 'Failed to fetch data', 'fetchData')
    } finally {
      isLoading.value = false
    }
  }

  return { fetchData, error, isLoading }
}
```

### TypeScript Best Practices

1. **Type function parameters**:
   ```typescript
   export function useFilters(
     data: Ref<DataType[]>,
     options: FilterOptions
   ) { ... }
   ```

2. **Type return values** (for complex returns):
   ```typescript
   export function useAuth(): {
     user: Ref<User | null>
     login: (email: string) => Promise<void>
   } { ... }
   ```

3. **Use generics** for reusable composables:
   ```typescript
   export function usePagination<T>(
     items: Ref<T[]>,
     pageSize: number = 20
   ) { ... }
   ```

### Cleanup and Lifecycle

Use `onUnmounted` for cleanup:

```typescript
export function useWebSocket() {
  const ws = new WebSocket(url)

  onUnmounted(() => {
    ws.close()
  })

  return { ws }
}
```

## Usage Examples

### Example 1: Basic Composable Usage

```typescript
// In a component
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user, login, logout } = useAuth()

async function handleLogin(email: string, password: string) {
  await login(email, password)
}
</script>
```

### Example 2: Composing Multiple Composables

```typescript
// In explorer.vue
<script setup lang="ts">
import { useExplorerState } from '@/composables/useExplorerState'
import { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import { useExplorerDataOrchestration } from '@/composables/useExplorerDataOrchestration'

// State management
const state = useExplorerState()

// Helper functions
const helpers = useExplorerHelpers(
  state.type,
  state.chartStyle,
  state.isExcess,
  // ... other state refs
)

// Data orchestration (composes other composables internally)
const {
  updateData,
  chartData,
  isUpdating
} = useExplorerDataOrchestration(state, helpers, allCountries, displayColors)
</script>
```

### Example 3: Conditional Composable Usage

```typescript
// Composables can be used conditionally
<script setup lang="ts">
import { useFeatureAccess } from '@/composables/useFeatureAccess'

const { hasAccess } = useFeatureAccess()

// Only use premium features if user has access
const premiumFeatures = hasAccess('premium')
  ? usePremiumFeatures()
  : null
</script>
```

### Example 4: Error Handling Pattern

```typescript
<script setup lang="ts">
import { useDataFetcher } from '@/composables/useDataFetcher'

const { fetchData, error, isLoading } = useDataFetcher()

onMounted(async () => {
  await fetchData()

  if (error.value) {
    // Handle error in component
    showToast(error.value.message, 'error')
  }
})
</script>
```

## Testing Strategies

### Unit Testing Composables

Composables should be tested in isolation using `@vue/test-utils`:

```typescript
import { mount } from '@vue/test-utils'
import { useDataQualityFilters } from '@/composables/useDataQualityFilters'

describe('useDataQualityFilters', () => {
  it('filters countries by search query', () => {
    const report = ref({ countries: [...mockCountries] })
    const { searchQuery, filteredCountries } = useDataQualityFilters(report)

    searchQuery.value = 'USA'

    expect(filteredCountries.value).toHaveLength(1)
    expect(filteredCountries.value[0].iso3c).toBe('USA')
  })
})
```

### Integration Testing

Test composables together as they're used in components:

```typescript
describe('Explorer Data Flow', () => {
  it('updates chart when state changes', async () => {
    const state = useExplorerState()
    const helpers = useExplorerHelpers(...)
    const orchestration = useExplorerDataOrchestration(state, helpers, ...)

    state.countries.value = ['USA']
    await orchestration.updateData(true, true)

    expect(orchestration.chartData.value).toBeDefined()
  })
})
```

### Testing with Dependencies

Use dependency injection for easier testing:

```typescript
// Composable accepts dependencies
export function useRankingData(
  state: ReturnType<typeof useRankingState>,
  metaData: ComputedRef<Record<string, Country>>
) { ... }

// In tests, inject mocks
const mockState = { ... }
const mockMetaData = computed(() => ({ ... }))
const ranking = useRankingData(mockState, mockMetaData)
```

### Existing Tests

Several composables already have comprehensive tests:

- `useChartDataFetcher.test.ts` - Data fetching logic
- `useExplorerDataOrchestration.test.ts` - Data orchestration
- `useExplorerState.test.ts` - State validation
- `useRankingData.test.ts` - Ranking data processing
- `useSaveChart.test.ts` - Chart saving
- `useUrlState.test.ts` - URL synchronization

Refer to these for testing patterns and best practices.

---

## Further Reading

- [Vue 3 Composables Documentation](https://vuejs.org/guide/reusability/composables.html)
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Testing Composables](https://test-utils.vuejs.org/guide/advanced/composition-api.html)
