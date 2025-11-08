# View System Migration Guide

**Date:** 2025-11-08
**PR:** #184
**Version:** Phase 4 Complete

This guide helps developers understand and work with the new view-based configuration system that replaced scattered `isExcess` conditionals.

---

## Overview

The view system provides a clean, type-safe way to configure UI behavior based on the current analysis mode (mortality, excess, z-score, etc.).

**Key Concept:** Views are detected from URL parameters and drive all UI configuration through a single source of truth.

---

## Architecture

### Flow Diagram

```
URL Parameters (e=1, zs=1)
    ↓
viewDetector.ts → ViewType ('excess', 'mortality', 'zscore')
    ↓
views.ts → ViewConfig (UI rules, constraints, defaults)
    ↓
Components use isVisible() / isRequired() helpers
    ↓
StateResolver applies view constraints
```

### Core Files

| File | Purpose |
|------|---------|
| `app/lib/state/viewTypes.ts` | TypeScript type definitions |
| `app/lib/state/views.ts` | View configurations (single source of truth) |
| `app/lib/state/viewDetector.ts` | URL → View detection |
| `app/lib/state/viewHelpers.ts` | UI helper functions |
| `app/lib/state/viewConstraints.ts` | View-specific constraints |

---

## Three View Types

### 1. Mortality View (Default)

**URL:** No special parameter
**Purpose:** Standard mortality analysis

**UI Visibility:**
- ✅ Logarithmic scale (toggleable)
- ✅ Maximize (toggleable)
- ✅ Baseline (optional)
- ❌ Cumulative (hidden)
- ❌ Percentage (hidden)

**Constraints:** None (most permissive)

### 2. Excess View

**URL:** `?e=1`
**Purpose:** Excess mortality analysis

**UI Visibility:**
- ❌ Logarithmic scale (hidden - incompatible)
- ✅ Maximize (toggleable)
- ✅ Baseline (forced ON - required for calculation)
- ✅ Cumulative (toggleable)
- ✅ Percentage (toggleable)
- ✅ Show Total (conditional: requires bar chart + cumulative)

**Constraints:**
- **Hard:** `showBaseline` must be `true` (priority 2)
- **Hard:** `isLogarithmic` must be `false` (priority 2)

### 3. Z-Score View

**URL:** `?zs=1`
**Purpose:** Z-score statistical analysis

**UI Visibility:**
- ❌ All display options hidden
- Chart shows z-score bands and reference lines

**Constraints:** TBD (placeholder for future implementation)

---

## Migration Examples

### Before (Phase 3 and earlier)

Scattered conditionals across components:

```vue
<!-- ExplorerSettings.vue -->
<template>
  <ChartControls
    :show-logarithmic-option="!isMatrixChartStyle && !props.state.isExcess.value"
    :show-maximize-option="!(props.state.isExcess.value && ...) && !isMatrixChartStyle"
    :show-percentage-option="props.state.isExcess.value"
    :show-cumulative-option="props.state.isExcess.value"
  />
</template>
```

**Problems:**
- Logic scattered across multiple files
- Hard to reason about which options are available
- Difficult to add new analysis types
- `isExcess` is stored state (requires syncing)

### After (Phase 4 and later)

Centralized view configuration:

```vue
<!-- ExplorerSettings.vue -->
<script setup>
import { isVisible } from '@/lib/state/viewHelpers'
import { VIEWS } from '@/lib/state/views'

const currentView = computed(() => VIEWS[state.view.value])

const showLogarithmicOption = computed(() =>
  isVisible(currentView.value.ui.logarithmic, state)
)
const showMaximizeOption = computed(() =>
  isVisible(currentView.value.ui.maximize, state)
)
// ...
</script>

<template>
  <ChartControls
    :show-logarithmic-option="showLogarithmicOption"
    :show-maximize-option="showMaximizeOption"
    :show-percentage-option="showPercentageOption"
    :show-cumulative-option="showCumulativeOption"
  />
</template>
```

**Benefits:**
- All view config in `views.ts` (single source of truth)
- Type-safe with discriminated unions
- Easy to add new views
- `isExcess` is computed from view (no syncing needed)

---

## How to Add a New View

### Step 1: Define the View in `views.ts`

```typescript
// app/lib/state/views.ts
export const VIEWS: Record<ViewType, ViewConfig> = {
  // ... existing views

  myNewView: {
    id: 'myNewView',
    label: 'My New Analysis',
    urlParam: 'mynew',  // URL: ?mynew=1

    ui: {
      logarithmic: hidden(),
      maximize: visible(),
      cumulative: visible(),
      percentage: hidden(),
      showTotal: conditional({
        and: [
          { field: 'chartStyle', is: 'bar' },
          { field: 'cumulative', is: true }
        ]
      }),
      // ... other UI elements
    },

    defaults: {
      showBaseline: true,
      showPredictionInterval: false
    },

    constraints: [
      {
        when: () => true,
        apply: { showBaseline: true },
        reason: 'My new view requires baseline',
        allowUserOverride: false,
        priority: 2  // Hard constraint
      }
    ],

    compatibleMetrics: ['cmr', 'deaths']
  }
}
```

### Step 2: Update Type Definition

```typescript
// app/lib/state/viewTypes.ts
export type ViewType = 'mortality' | 'excess' | 'zscore' | 'myNewView'
```

### Step 3: Write Tests

```typescript
// app/lib/state/views.test.ts
describe('My New View', () => {
  const config = VIEWS.myNewView

  it('has correct metadata', () => {
    expect(config.id).toBe('myNewView')
    expect(config.label).toBe('My New Analysis')
    expect(config.urlParam).toBe('mynew')
  })

  it('hides logarithmic option', () => {
    expect(config.ui.logarithmic.visibility.type).toBe('hidden')
  })

  it('shows cumulative option', () => {
    expect(config.ui.cumulative.visibility.type).toBe('visible')
  })

  // ... more tests
})
```

### Step 4: Update viewDetector (if needed)

```typescript
// app/lib/state/viewDetector.ts
export function detectView(query: Record<string, unknown>): ViewType {
  if (query.zs === '1') return 'zscore'
  if (query.e === '1' || query.isExcess === 'true') return 'excess'
  if (query.mynew === '1') return 'myNewView'  // Add this
  return 'mortality'
}
```

Done! The new view is fully integrated.

---

## Common Patterns

### Checking View in Components

```typescript
// Computed property
const isExcessView = computed(() => state.view.value === 'excess')

// Helper function
const isViewActive = (viewType: ViewType) => state.view.value === viewType
```

### Conditional Rendering

```typescript
// Simple visibility
const showOption = computed(() =>
  isVisible(currentView.value.ui.someOption, state)
)

// Conditional visibility
showTotal: conditional({
  and: [
    { field: 'chartStyle', is: 'bar' },
    { field: 'cumulative', is: true }
  ]
})

// Or condition
myOption: conditional({
  or: [
    { field: 'type', is: 'deaths' },
    { field: 'type', is: 'cmr' }
  ]
})
```

### View Transitions

When user switches views (e.g., clicks excess toggle):

```typescript
// app/pages/explorer.vue
const handleExcessChanged = async (v: boolean) => {
  const router = useRouter()
  const route = useRoute()
  const currentQuery = { ...route.query }

  if (v) {
    currentQuery.e = '1'  // Switch to excess view
  } else {
    delete currentQuery.e  // Switch to mortality view
  }

  await router.push({ path: route.path, query: currentQuery })
  await update('_isExcess')  // Refresh chart
}
```

**What happens:**
1. URL updates with new query params
2. `viewDetector` detects new view from URL
3. `state.view` computed property updates
4. All UI visibility rules update automatically
5. View constraints applied by StateResolver
6. Chart refreshes with new configuration

---

## Backward Compatibility

### Old URLs Still Work

The view detector handles legacy URL parameters:

```typescript
// Old URL
?e=1                → view='excess'
?isExcess=true      → view='excess'
?zs=1               → view='zscore'

// New URL (same result)
?e=1                → view='excess'
```

### isExcess Computed Property

Components can still access `state.isExcess.value`:

```typescript
// Before (writable state field)
state.isExcess.value = true  // ✅ Worked

// After (computed property)
state.isExcess.value         // ✅ Works (read-only)
state.isExcess.value = true  // ❌ Error (read-only)
```

**Note:** `isExcess` is now computed as:

```typescript
const isExcess = computed(() => view.value === 'excess')
```

This maintains compatibility while eliminating state syncing issues.

---

## Testing

### Unit Tests

View system has 80+ unit tests covering:

- View configuration (app/lib/state/views.test.ts)
- View detection (app/lib/state/viewDetector.test.ts)
- UI helpers (app/lib/state/viewHelpers.test.ts)
- View constraints (app/lib/state/viewConstraints.test.ts)

### Integration Tests

- StateResolver integration (app/lib/state/StateResolver.test.ts)
- Explorer state (app/composables/useExplorerState.test.ts)

### E2E Tests

- Excess mode toggle (tests/e2e/explorer.spec.ts)
- URL state persistence
- View transitions

---

## Troubleshooting

### Issue: UI option not showing

**Check:**
1. Is it visible in view config? `VIEWS[viewType].ui.option.visibility`
2. Does it have conditional logic? Check `when` conditions
3. Is there a constraint hiding it? Check `viewConstraints.ts`

**Debug:**
```typescript
import { isVisible, evaluateCondition } from '@/lib/state/viewHelpers'

console.log('Option visibility:', currentView.value.ui.option.visibility)
console.log('Is visible:', isVisible(currentView.value.ui.option, state))
```

### Issue: Constraint not applying

**Check:**
1. Priority level: higher priority wins (2 > 1 > 0)
2. User override: `allowUserOverride` flag
3. Constraint condition: `when` function returns true?

**Debug:**
```typescript
const constraints = getViewConstraints(state.view.value)
console.log('Active constraints:', constraints)
console.log('User overrides:', state.getUserOverrides())
```

### Issue: View not detecting from URL

**Check:**
1. URL parameter correct? (`?e=1` not `?excess=1`)
2. Case sensitive? (`?E=1` won't work)
3. ViewDetector logic? Check `viewDetector.ts`

**Debug:**
```typescript
import { detectView } from '@/lib/state/viewDetector'

console.log('Detected view:', detectView(route.query))
console.log('URL query:', route.query)
```

---

## Best Practices

### 1. Always Use View Configuration

❌ **Don't:**
```vue
<template>
  <div v-if="state.isExcess.value">Excess controls</div>
</template>
```

✅ **Do:**
```vue
<script setup>
const showExcessControls = computed(() =>
  state.view.value === 'excess'
)
</script>

<template>
  <div v-if="showExcessControls">Excess controls</div>
</template>
```

### 2. Use isVisible() Helper

❌ **Don't:**
```typescript
const show = currentView.ui.option.visibility.type !== 'hidden'
```

✅ **Do:**
```typescript
const show = isVisible(currentView.ui.option, state)
```

### 3. Document View-Specific Logic

✅ **Do:**
```typescript
// Excess view requires baseline for calculations
if (state.view.value === 'excess' && !state.showBaseline.value) {
  console.warn('Baseline required for excess view')
}
```

### 4. Test All Views

✅ **Do:**
```typescript
describe.each(['mortality', 'excess', 'zscore'])('%s view', (viewType) => {
  it('shows correct options', () => {
    const config = VIEWS[viewType]
    expect(isVisible(config.ui.logarithmic, mockState)).toBe(...)
  })
})
```

---

## Additional Resources

- **PR #184:** Original implementation and discussion
- **Issue #147:** Original problem (excess toggle requiring 3 clicks)
- **View Types:** `app/lib/state/viewTypes.ts`
- **View Configs:** `app/lib/state/views.ts`
- **Helper Functions:** `app/lib/state/viewHelpers.ts`
- **StateResolver:** `app/lib/state/StateResolver.ts`
- **Tests:** `app/lib/state/*.test.ts`

---

## Questions?

If you encounter issues or have questions about the view system:

1. Check this migration guide
2. Review unit tests for examples
3. Check PR #184 for implementation details
4. Ask in team chat or create a GitHub issue

---

**Last Updated:** 2025-11-08
**Maintained By:** Development Team
