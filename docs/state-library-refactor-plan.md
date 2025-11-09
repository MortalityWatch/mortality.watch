# State Library Refactor - Implementation Plan

**Date:** 2025-11-08
**Status:** DRAFT - Pending Review
**Related:** PR #184 (Phase 4), Issue #147

---

## Overview

Complete the state library vision: a standalone, self-contained state management system that outputs **everything components need** with zero conditional logic.

### Current Problems

1. **Scattered UI logic:** Components manually compute visibility with `isVisible()`
2. **Inconsistent naming:** `showBaseline` vs ViewConfig `baseline`
3. **Manual wiring:** Each component imports `VIEWS` and computes UI state
4. **URL sync mixed:** Both StateResolver and useExplorerState handle URL
5. **No view transitions:** handleExcessChanged bypasses state system

### Goals

✅ **Single source of truth:** StateResolver computes everything
✅ **Clean separation:** StatePersistence (URL), StateResolver (logic), ViewSystem (configs)
✅ **Zero conditionals in components:** `v-if="ui.baseline.visible"`
✅ **Consistent naming:** State fields match ViewConfig
✅ **Standalone library:** Can be extracted and reused

---

## Architecture

```
┌─────────────────────────────────────────┐
│    useExplorerState (Vue glue)          │
│  - Wires everything together            │
│  - Provides reactive state & ui         │
└─────────────────────────────────────────┘
           ↓           ↓           ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│StateResolver │ │StatePersist  │ │ViewSystem    │
│(pure logic)  │ │(side effects)│ │(configs)     │
│              │ │              │ │              │
│• resolve()   │ │• fromURL()   │ │• VIEWS       │
│• apply       │ │• toURL()     │ │• detectView()│
│  constraints │ │• sync()      │ │• isVisible() │
│• compute UI  │ │              │ │              │
│              │ │Uses:         │ │              │
│NO router     │ │- Serializer  │ │NO state      │
│NO URL        │ │- Router      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### StateResolver Output

```typescript
{
  state: {
    baseline: true,      // ← Aligned with ViewConfig
    logarithmic: false,
    countries: ['USA'],
    // ... all data state
  },
  ui: {
    baseline: { visible: true, disabled: true },
    logarithmic: { visible: false, disabled: false },
    // ... all UI metadata
  },
  metadata: { ... },
  log: { ... }
}
```

### Component Usage (Final State)

```vue
<UToggle
  v-if="ui.baseline.visible"
  :disabled="ui.baseline.disabled"
  v-model="state.baseline"
/>
```

---

## Field Renaming Map

Aligning state fields with ViewConfig for consistency:

| Old Name | New Name | URL Key | Notes |
|----------|----------|---------|-------|
| `showBaseline` | `baseline` | `sb` | Keep URL key for backward compat |
| `showPredictionInterval` | `predictionInterval` | `pi` | Keep URL key |
| `showLogarithmic` | `logarithmic` | `lg` | Keep URL key |
| `showLabels` | `labels` | `sl` | Keep URL key |
| `showPercentage` | `percentage` | `p` | Keep URL key |
| `showTotal` | `total` | `st` | Keep URL key |

**URL Compatibility:** Field names change internally, but URL params stay the same (`sb=1`, `pi=0`, etc.)

---

## Implementation Phases

### Phase 1: Foundation (NEW)

**Goal:** Extract StatePersistence, prepare infrastructure

**Files:**
- ✅ `app/lib/state/StatePersistence.ts` (NEW - created)
- ✅ `app/lib/state/StateResolver.ts` (use StatePersistence)

**Status:** ✅ Complete

---

### Phase 2: Field Renaming

**Goal:** Rename all state fields to match ViewConfig

#### 2.1 Core State Files
- ✅ `app/lib/state/stateSerializer.ts` - Update Defaults & encoders
- ✅ `app/lib/state/constraints.ts` - Update DEFAULT_VALUES & constraints
- ⏳ `app/lib/state/views.ts` - Update defaults & constraints
- ⏳ `app/model/explorerSchema.ts` - Update Zod schema

#### 2.2 State Management
- ⏳ `app/composables/useExplorerState.ts` - Rename all refs
- ⏳ `app/composables/useExplorerDataOrchestration.ts` - Update field refs
- ⏳ `app/composables/useExplorerHelpers.ts` - Update field refs

#### 2.3 Services
- ⏳ `app/services/dataService.ts` - Update field refs
- ⏳ `server/services/dataLoader.ts` - Update field refs

#### 2.4 Components (~30 files)
- ⏳ `app/pages/explorer.vue` - Update all handlers
- ⏳ `app/components/explorer/ExplorerSettings.vue`
- ⏳ `app/components/charts/MortalityChartControlsSecondary.vue`
- ⏳ `app/components/charts/controls/DisplayTab.vue`
- ⏳ `app/components/charts/controls/StyleTab.vue`
- ⏳ ... (all components using state)

#### 2.5 Tests (~40 files)
- ⏳ Update all test files with new field names

**Estimated Changes:** ~100 files

**Migration Helper:**
```bash
# Global find/replace (with manual review)
find app -type f -name "*.ts" -o -name "*.vue" | xargs sed -i \
  -e 's/showBaseline/baseline/g' \
  -e 's/showPredictionInterval/predictionInterval/g' \
  -e 's/showLogarithmic/logarithmic/g' \
  -e 's/showLabels/labels/g' \
  -e 's/showPercentage/percentage/g' \
  -e 's/showTotal/total/g'
```

**Verification:**
```bash
npm run typecheck
npm run test
npm run test:e2e
```

---

### Phase 3: UI State Computation

**Goal:** StateResolver computes UI visibility/disabled flags

#### 3.1 Add UI State Helper

**File:** `app/lib/state/uiStateComputer.ts` (NEW)

```typescript
/**
 * Compute UI state from ViewConfig and current state
 */
export function computeUIState(
  viewConfig: ViewConfig,
  state: Record<string, unknown>
): Record<string, { visible: boolean, disabled: boolean }> {
  const ui: Record<string, { visible: boolean, disabled: boolean }> = {}

  for (const [field, element] of Object.entries(viewConfig.ui)) {
    ui[field] = {
      visible: isVisible(element, state),
      disabled: isDisabled(element, state)
    }
  }

  return ui
}
```

#### 3.2 Update StateResolver

**File:** `app/lib/state/StateResolver.ts`

```typescript
import { computeUIState } from './uiStateComputer'
import { VIEWS } from './views'

static resolveInitial(route): ResolvedState {
  // ... existing logic ...

  const view = detectView(route.query)
  const viewConfig = VIEWS[view]

  // Compute UI state
  const ui = computeUIState(viewConfig, state)

  return {
    state,
    ui,  // ← NEW
    metadata,
    changedFields,
    userOverrides,
    log
  }
}
```

#### 3.3 Update ResolvedState Type

**File:** `app/lib/state/types.ts`

```typescript
export interface ResolvedState {
  state: Record<string, unknown>
  ui: Record<string, { visible: boolean, disabled: boolean }>  // ← NEW
  metadata: Record<string, StateFieldMetadata>
  changedFields: string[]
  userOverrides: Set<string>
  log: StateResolutionLog
}
```

**Files:**
- ⏳ `app/lib/state/uiStateComputer.ts` (NEW)
- ⏳ `app/lib/state/types.ts` (update ResolvedState)
- ⏳ `app/lib/state/StateResolver.ts` (call computeUIState)

---

### Phase 4: Update useExplorerState

**Goal:** Return separate `state` and `ui` objects

**File:** `app/composables/useExplorerState.ts`

```typescript
export function useExplorerState() {
  // ... existing refs ...

  // Compute UI state from current view
  const ui = computed(() => {
    const currentView = VIEWS[view.value]
    return computeUIState(currentView, getCurrentStateValues())
  })

  return {
    // State (reactive refs)
    baseline,
    logarithmic,
    countries,
    // ...

    // UI metadata (computed)
    ui,  // ← NEW

    // View
    view,

    // Helpers
    getCurrentStateValues,
    getUserOverrides,
    // ...
  }
}
```

**Files:**
- ⏳ `app/composables/useExplorerState.ts`

---

### Phase 5: Update Components

**Goal:** Use `ui.*` instead of manual visibility checks

#### Before:
```vue
<script>
import { VIEWS } from '@/lib/state/views'
import { isVisible } from '@/lib/state/viewHelpers'

const currentView = computed(() => VIEWS[state.view.value])
const showBaselineOption = computed(() =>
  isVisible(currentView.value.ui.baseline, state)
)
</script>

<template>
  <UToggle
    v-if="showBaselineOption"
    v-model="state.baseline"
  />
</template>
```

#### After:
```vue
<script>
// No imports needed!
</script>

<template>
  <UToggle
    v-if="ui.baseline.visible"
    :disabled="ui.baseline.disabled"
    v-model="state.baseline"
  />
</template>
```

**Files (~30):**
- ⏳ `app/components/explorer/ExplorerSettings.vue`
- ⏳ `app/components/charts/MortalityChartControlsSecondary.vue`
- ⏳ `app/components/charts/controls/DisplayTab.vue`
- ⏳ ... (all components with state)

---

### Phase 6: View Transitions

**Goal:** Add proper view change handling

#### 6.1 Add resolveViewChange

**File:** `app/lib/state/StateResolver.ts`

```typescript
/**
 * Resolve a view change
 *
 * Handles view transitions with proper constraint application
 */
static resolveViewChange(
  newView: ViewType,
  currentState: Record<string, unknown>,
  currentUserOverrides: Set<string>
): ResolvedState {
  const log: StateResolutionLog = {
    timestamp: new Date().toISOString(),
    trigger: { field: 'view', value: newView, source: 'user' },
    before: { ...currentState },
    after: {},
    changes: [],
    userOverridesFromUrl: Array.from(currentUserOverrides)
  }

  const state = { ...currentState }
  const metadata: Record<string, StateFieldMetadata> = {}
  const userOverrides = new Set(currentUserOverrides)

  // 1. Update view
  state.view = newView

  // 2. Apply view defaults (for fields not explicitly set by user)
  const viewConfig = VIEWS[newView]
  for (const [field, value] of Object.entries(viewConfig.defaults || {})) {
    if (!userOverrides.has(field)) {
      state[field] = value
      log.changes.push({
        field,
        oldValue: currentState[field],
        newValue: value,
        priority: 'view-default',
        reason: `${viewConfig.label} view default`
      })
    }
  }

  // 3. Apply constraints
  const constrainedState = this.applyConstraints(state, userOverrides, log)

  // 4. Compute UI
  const ui = computeUIState(viewConfig, constrainedState)

  log.after = { ...constrainedState }
  this.logResolution(log, 'VIEW_CHANGE')

  return {
    state: constrainedState,
    ui,
    metadata,
    changedFields: log.changes.map(c => c.field),
    userOverrides,
    log
  }
}
```

#### 6.2 Update handleExcessChanged

**File:** `app/pages/explorer.vue`

```typescript
// OLD (bypasses state system)
const handleExcessChanged = async (v: boolean) => {
  const router = useRouter()
  const route = useRoute()
  const currentQuery = { ...route.query }

  if (v) {
    currentQuery.e = '1'
    currentQuery.pi = '0'
    currentQuery.p = '1'
  } else {
    delete currentQuery.e
  }

  await router.push({ path: route.path, query: currentQuery })
  await update('_isExcess')
}

// NEW (uses state system)
const handleExcessChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Resolve view change through state system
  const newView = v ? 'excess' : 'mortality'
  const resolved = StateResolver.resolveViewChange(
    newView,
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  // Apply to URL
  const persistence = new StatePersistence(router)
  await persistence.sync(resolved.state, resolved.changedFields, route)

  // Trigger chart refresh
  await update('_view')
}
```

**Files:**
- ⏳ `app/lib/state/StateResolver.ts` (add resolveViewChange)
- ⏳ `app/pages/explorer.vue` (update handleExcessChanged)

---

## Testing Strategy

### Unit Tests
- ✅ StatePersistence (fromURL, toURL, sync)
- ⏳ UIStateComputer (computeUIState)
- ⏳ StateResolver (resolveViewChange)

### Integration Tests
- ⏳ useExplorerState (ui computed correctly)
- ⏳ View transitions (excess ↔ mortality)

### E2E Tests
- ⏳ Excess toggle (Issue #147)
- ⏳ URL persistence
- ⏳ View defaults applied

---

## Migration Checklist

### Pre-Migration
- [ ] Review and approve this plan
- [ ] Create feature branch
- [ ] Backup current state

### Phase Execution
- [x] Phase 1: Foundation
- [ ] Phase 2: Field Renaming
  - [ ] 2.1 Core state files
  - [ ] 2.2 State management
  - [ ] 2.3 Services
  - [ ] 2.4 Components
  - [ ] 2.5 Tests
- [ ] Phase 3: UI State Computation
- [ ] Phase 4: Update useExplorerState
- [ ] Phase 5: Update Components
- [ ] Phase 6: View Transitions

### Verification
- [ ] All tests pass (unit, integration, E2E)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Manual testing (explorer, ranking)
- [ ] URL backward compatibility verified

### Post-Migration
- [ ] Update documentation
- [ ] Create PR
- [ ] Code review
- [ ] Merge to main

---

## Risks & Mitigation

### Risk 1: Breaking Changes
**Impact:** High - 100+ files affected
**Mitigation:**
- Incremental phases with testing between
- Keep URL params same (backward compat)
- Automated find/replace with verification

### Risk 2: Performance
**Impact:** Medium - New UI computation on every state change
**Mitigation:**
- Use Vue computed (memoized)
- Benchmark before/after
- Optimize if needed

### Risk 3: Bugs in Migration
**Impact:** Medium - Complex refactor
**Mitigation:**
- Comprehensive test coverage
- Manual QA of all features
- Can revert if issues found

---

## Success Metrics

✅ **Zero conditional UI logic in components**
✅ **All UI elements controlled by view config**
✅ **StateResolver is pure (no router dependency)**
✅ **Can extract as standalone library**
✅ **All tests pass**
✅ **E2E test for Issue #147 passes**

---

## Timeline Estimate

- **Phase 1:** ✅ Complete (1 hour)
- **Phase 2:** 4-6 hours (field renaming)
- **Phase 3:** 2 hours (UI computation)
- **Phase 4:** 1 hour (useExplorerState)
- **Phase 5:** 3-4 hours (components)
- **Phase 6:** 2 hours (view transitions)

**Total:** ~12-15 hours of focused work

---

## Next Steps

1. Review this plan
2. Get approval to proceed
3. Execute Phase 2 (can be done incrementally)
4. Test after each phase
5. Merge when complete

---

**Questions?**
- Architecture concerns?
- Missing edge cases?
- Better approach?
- Should we split into multiple PRs?

**Last Updated:** 2025-11-08
**Author:** Claude Code
