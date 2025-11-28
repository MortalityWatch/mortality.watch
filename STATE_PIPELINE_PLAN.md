# State Pipeline Refactor Plan

## Problem Statement

The explorer page has multiple state sources that update across multiple ticks, causing:

1. Reactive cascades (watchers triggering watchers)
2. URL updates that trigger ref updates that trigger more URL updates
3. Inconsistent state during transitions
4. Difficulty debugging what caused what

**Core issue**: `StateResolver` computes correct state but refs don't consume it directly - they react to URL changes on subsequent ticks.

## Current Architecture

```
URL (query params)
    ↓ (decoded by useUrlState)
Individual Refs (countries, chartType, showBaseline, etc.)
    ↓ (gathered by getCurrentStateValues)
StateResolver.resolve*()
    ↓ (encodes to URL)
applyResolvedState() → router.push()
    ↓ (next tick - URL changes)
Individual Refs react to URL
    ↓ (watchers fire)
Possible cascade...
```

**Three state layers**:

1. **URL State**: Query params (`?c=USA&e=1&sb=1`)
2. **App State**: Individual refs in `useExplorerState`
3. **Chart State**: Derived `chartData` in `useExplorerDataOrchestration`

## Proposed Architecture

```
URL (query params) ──────────────────────────────────┐
    ↓                                                │
StateResolver.resolveInitial(route)                  │
    ↓                                                │
ResolvedState {                                      │
  state: all values                                  │
  ui: visibility/disabled                            │
  log: audit trail                                   │
}                                                    │
    ↓                                                │
Apply directly to refs (same tick)                   │
    ↓                                                │
Sync URL for persistence (doesn't trigger refs) ─────┘
```

**Key insight**: Refs should be the source of truth for Vue reactivity. URL is just persistence. The resolver computes state, applies to refs directly, then syncs URL.

## Changes Required

### Phase 1: Consolidate Defaults (DONE - in unstaged changes)

**Files**: `constraints.ts`, `stateSerializer.ts`, `useExplorerState.ts`, `views.ts`

- [x] `DEFAULT_VALUES` re-exports `Defaults` from `stateSerializer.ts`
- [x] All `useUrlState` refs use `Defaults.xxx`
- [x] `showPercentage` default: `undefined` → `false`
- [x] Mortality view: remove `showBaseline: false` (it's toggleable, landing default is `true`)
- [x] `getCurrentStateValues()` applies view defaults for fields not in URL
- [x] `applyResolvedState()` builds minimal URL (only non-default values)

### Phase 2: Apply View Defaults in resolveInitial

**File**: `StateResolver.ts`

Currently `resolveInitial` does:

1. Start with `DEFAULT_VALUES`
2. Apply URL params
3. Detect view
4. Apply constraints

Missing step: Apply view defaults BEFORE constraints.

```typescript
// After detecting view, before applying constraints:
const viewConfig = VIEWS[view as ViewType] || VIEWS.mortality;
for (const [field, value] of Object.entries(viewConfig.defaults || {})) {
  // Only apply if user hasn't set this field in URL
  if (!userOverrides.has(field)) {
    state[field] = value;
    // Log as view-default priority
  }
}
```

### Phase 3: Direct State Application

**Files**: `useExplorerState.ts`, `explorer.vue`

Add method to directly apply resolved state to refs:

```typescript
// In useExplorerState.ts
const applyResolvedState = (resolved: ResolvedState) => {
  // Map of field names to refs
  const refMap: Record<string, Ref<unknown>> = {
    countries,
    chartType,
    chartStyle,
    type,
    showBaseline,
    // ... all refs
  };

  for (const [field, value] of Object.entries(resolved.state)) {
    const ref = refMap[field];
    if (ref && ref.value !== value) {
      ref.value = value;
    }
  }
};
```

Then in `explorer.vue`:

```typescript
onMounted(async () => {
  const resolved = StateResolver.resolveInitial(route);

  // 1. Apply to refs directly (same tick, no reactivity cascade)
  state.applyResolvedState(resolved);

  // 2. Sync URL if needed (persistence only)
  if (resolved.changedFields.length > 0) {
    await StateResolver.applyResolvedState(resolved, route, router, {
      replaceHistory: true,
    });
  }

  // 3. Load data
  await updateData(true, true);
});
```

### Phase 4: Enhanced Logging

**File**: `StateResolver.ts`

Add to `logResolution()`:

```typescript
private static logResolution(log, type, resolved) {
  // Existing logs...

  // Add URL state
  console.log('🔗 URL Query:', this.formatUrlQuery(resolved))

  // Add UI state summary
  console.log('👁️ UI Visibility:', this.formatUIState(resolved.ui))

  // Add data fetch prediction
  console.log('📊 Data Fetch:', this.predictDataFetch(log.trigger, resolved))
}

private static formatUrlQuery(resolved: ResolvedState): Record<string, string> {
  // Build the query that would be written to URL
}

private static formatUIState(ui: Record<string, UIFieldState>): string[] {
  // Return list of visible/enabled controls
}
```

### Phase 5: Remove Redundant Watchers

**Files**: `useExplorerState.ts`, `useExplorerDataOrchestration.ts`

After Phase 3, these watchers become unnecessary:

- Validation error watcher in `useExplorerState` (StateResolver handles this)
- Date validation in orchestration can be simplified

Review and remove any watcher that exists only to "fix" state that StateResolver already handles.

## Testing Strategy

1. Run existing tests after Phase 1 (should pass with updated expectations)
2. Add test for `resolveInitial` with view defaults (Phase 2)
3. Add test for `applyResolvedState` on composable (Phase 3)
4. Manual testing:
   - Load `/explorer?e=1` - should show excess view with correct defaults
   - Toggle controls - should update in single tick
   - Browser back/forward - should work correctly

## Logging Output Example

After implementation, console should show:

```
🚀 Initial State Resolution
📋 AFTER: {
  view: 'excess',
  chartStyle (cs): 'bar',
  showBaseline (sb): true,
  ...
}
🔧 Changes Applied:
  chartStyle (cs): "line" → "bar" [view-default] Excess view default
  showBaseline (sb): false → true [constraint (p2)] Excess requires baseline
👤 User Overrides: []
🔗 URL Query: { e: '1' }
👁️ UI Visibility: [baseline: visible+disabled, predictionInterval: visible, ...]
📊 Data Fetch: { needsDownload: true, needsFilter: true }
```

## Migration Path

1. Commit unstaged changes (Phase 1) - backwards compatible
2. Add view defaults to resolveInitial (Phase 2) - backwards compatible
3. Add applyResolvedState method (Phase 3) - backwards compatible
4. Use new method in explorer.vue (Phase 3) - behavioral change
5. Enhanced logging (Phase 4) - dev-only
6. Remove redundant watchers (Phase 5) - cleanup

Each phase can be a separate PR if needed.

## Success Criteria

- [ ] All state changes apply in a single tick
- [ ] No reactive cascades visible in Vue DevTools
- [ ] URL is minimal (only non-default values)
- [ ] Browser back/forward works correctly
- [ ] Logging shows complete state picture
- [ ] All existing tests pass
- [ ] E2E tests pass

## Concerns & Mitigations

### Phase 2: View Defaults

**Concern**: View defaults may contain `undefined` values.
**Mitigation**: Skip `undefined` values in the loop - they mean "use landing page default".

### Phase 3: Race Conditions & Maintenance

**Concern**: `refMap` creates maintenance burden (two places to update).
**Mitigation**: Generate map from `stateFieldEncoders` keys, or use consistent naming.

**Concern**: Watchers may fire between `applyResolvedState()` and URL sync.
**Mitigation**: The refs will already have correct values, so watcher logic should be idempotent. If needed, add `isApplyingState` flag to skip watcher during apply.

### Phase 5: Watcher Removal Risk

**Concern**: Removing watchers may break edge cases.
**Mitigation**:

1. Document each watcher's purpose before removal
2. Run E2E tests after each individual removal
3. Keep date validation for runtime data availability changes (not constraint-related)

### SSR Considerations

**Concern**: `resolveInitial` in `onMounted` is client-only.
**Current behavior**: SSR renders with defaults, client hydrates with URL state.
**Mitigation**: This is acceptable - explorer is excluded from prerender anyway (`nuxt.config.ts`). The resolver only runs client-side.

### Deep Link Handling

**Concern**: Invalid URL combinations like `?e=1&sb=0` (excess with baseline off).
**Behavior**: Resolver fixes to `?e=1` (baseline forced on, removed from URL as it matches view default).
**Mitigation**: Use `replaceHistory: true` on initial load so user doesn't see a redirect flash. The corrected URL is the canonical one.
