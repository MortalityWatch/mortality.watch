# State Resolver Implementation Plan

**Date:** 2025-11-06
**Issue:** #147 - Excess toggle requires 3 clicks when baseline + PI enabled
**Goal:** Centralized state resolution system with constraint enforcement and full audit logging

---

## Overview

Replace scattered reactive state logic with a **centralized StateResolver** that:

- Takes any state change as input
- Applies business rules and constraints
- Returns complete resolved state with audit trail
- Works across all routes (explorer, ranking, etc.)
- Respects existing URL state system (short keys: `e=1`, `pi=1`, etc.)

## Architecture

### Flow Diagram: Current vs. New

**CURRENT FLOW (Reactive Hell):**

```
User clicks Excess toggle
  ↓
updateStateAndRefresh() sets isExcess.value = true
  ↓
Vue reactivity triggers watchers
  ↓
Multiple watchers fire independently:
  - validation schema checks (may fail)
  - useDataAvailability watcher
  - StateEffects.onIsExcessChange (manual logic)
  ↓
Each watcher may modify other state
  ↓
More watchers fire (cascading)
  ↓
Eventually settles (or requires multiple clicks if validation fails)
```

**NEW FLOW (Centralized Resolution):**

```
User clicks Excess toggle
  ↓
StateResolver.resolveChange({ field: 'isExcess', value: true }, currentState, userOverrides)
  ↓
[LOG: BEFORE STATE]
  ↓
Apply constraints in priority order:
  1. Priority 2 constraints (high priority, e.g., hard conflicts)
  2. Priority 1 constraints (normal, e.g., business rules)
  3. Priority 0 constraints (low priority, e.g., defaults)
  ↓
Respect user overrides (unless constraint.allowUserOverride = false)
  ↓
[LOG: AFTER STATE + ALL CHANGES WITH REASONS]
  ↓
Return ResolvedState { state, metadata, changedFields, log }
  ↓
StateEffects.applyResolved() sets all changed fields atomically
  ↓
useUrlState syncs to URL automatically (existing system)
  ↓
Done in one transaction
```

### State Priority System

1. **Default** (priority: 0) - System defaults (e.g., `showPredictionInterval: true`)
2. **Constraint** (priority: 1) - Business rules force values (e.g., excess requires `showBaseline: true`)
3. **User** (priority: 2) - User explicitly set (e.g., in URL or clicked toggle)

**Resolution:** User overrides win → Constraints override defaults → Defaults are fallback

---

## Implementation Steps

### Phase 1: Create Core Infrastructure

#### 1.1 Create Type Definitions (`app/lib/state/types.ts`)

**Lines:** ~150
**Dependencies:** None

```typescript
export interface StateChange {
  field: string; // Full field name (e.g., 'isExcess')
  value: any;
  source: "user" | "url" | "default";
}

export interface StateFieldMetadata {
  value: any;
  priority: "default" | "constraint" | "user";
  reason: string;
  changed: boolean;
  urlKey?: string; // Short key (e.g., 'e' for isExcess)
}

export interface ResolvedState {
  state: Record<string, any>; // Actual state values
  metadata: Record<string, StateFieldMetadata>; // Metadata per field
  changedFields: string[]; // Which fields changed
  userOverrides: Set<string>; // Fields set by user
  log: StateResolutionLog; // Full audit log
}

export interface StateResolutionLog {
  timestamp: string;
  trigger: StateChange | "initial";
  before: Record<string, any>;
  after: Record<string, any>;
  changes: Array<{
    field: string;
    urlKey: string;
    oldValue: any;
    newValue: any;
    priority: string;
    reason: string;
  }>;
  userOverridesFromUrl: string[];
}

export interface StateConstraint {
  when: (state: any) => boolean; // Condition
  apply: Record<string, any>; // field → value
  reason: string; // For logging
  allowUserOverride: boolean; // Can user override?
  priority?: number; // 0=default, 1=normal, 2=high (default: 1)
}
```

**Tests:** Create `app/lib/state/types.test.ts` with type validation tests

---

#### 1.2 Define Business Rules (`app/lib/state/constraints.ts`)

**Lines:** ~120
**Dependencies:** `types.ts`

```typescript
import type { StateConstraint } from "./types";

// Default values when nothing is set
export const DEFAULT_VALUES: Record<string, any> = {
  // Core settings
  countries: ["USA"],
  type: "cmr",
  chartType: "yearly",
  chartStyle: "line",
  ageGroups: ["all"],
  standardPopulation: "who",

  // Display options
  showPredictionInterval: true, // Default ON normally
  showBaseline: true, // Default ON
  cumulative: false,
  showPercentage: false,
  showTotal: false,
  maximize: false,
  isLogarithmic: false,
  showLabels: true,
  isExcess: false,

  // Baseline
  baselineMethod: "mean",

  // Chart appearance
  decimals: "auto",
  showLogo: true,
  showQrCode: true,
  showCaption: true,
};

// Business rule constraints (sorted by priority: high → low)
export const STATE_CONSTRAINTS: StateConstraint[] = [
  // ===================================================================
  // EXCESS MODE CONSTRAINTS
  // ===================================================================

  // Hard constraints (priority 2) - cannot be overridden
  {
    when: (state) => state.isExcess === true,
    apply: {
      showBaseline: true, // MUST be ON (excess needs baseline for calculation)
      isLogarithmic: false, // MUST be off (incompatible with excess)
    },
    reason: "Excess mode requires baseline and disables logarithmic scale",
    allowUserOverride: false,
    priority: 2,
  },

  // Default overrides (priority 0) - user can override
  {
    when: (state) => state.isExcess === true,
    apply: {
      showPredictionInterval: false, // DEFAULT off (but user can turn back on)
    },
    reason:
      "Excess mode defaults prediction intervals to off (user can override)",
    allowUserOverride: true,
    priority: 0,
  },

  // ===================================================================
  // BASELINE OFF CONSTRAINTS
  // ===================================================================
  {
    when: (state) => !state.showBaseline && !state.isExcess,
    apply: {
      showPredictionInterval: false, // PI requires baseline
    },
    reason: "Prediction intervals require baseline or excess mode",
    allowUserOverride: false,
  },

  // ===================================================================
  // POPULATION TYPE CONSTRAINTS
  // ===================================================================
  {
    when: (state) => state.type === "population",
    apply: {
      isExcess: false,
      showBaseline: false,
      showPredictionInterval: false,
    },
    reason: "Population type does not support excess or baseline",
    allowUserOverride: false,
  },

  // ===================================================================
  // ASMR/LE TYPE CONSTRAINTS
  // ===================================================================
  {
    when: (state) => state.type === "asmr" || state.type === "le",
    apply: {
      ageGroups: ["all"],
    },
    reason: 'ASMR and Life Expectancy only support "all" age group',
    allowUserOverride: false,
  },

  // ===================================================================
  // MATRIX STYLE CONSTRAINTS
  // ===================================================================
  {
    when: (state) => state.chartStyle === "matrix",
    apply: {
      showBaseline: false,
      showPredictionInterval: false,
      maximize: false,
      isLogarithmic: false,
    },
    reason: "Matrix style disables baseline, PI, maximize, and logarithmic",
    allowUserOverride: false,
  },

  // ===================================================================
  // CUMULATIVE OFF CONSTRAINTS
  // ===================================================================
  {
    when: (state) => !state.cumulative,
    apply: {
      showTotal: false,
    },
    reason: "Show total requires cumulative mode",
    allowUserOverride: false,
  },

  // ===================================================================
  // EXCESS OFF CONSTRAINTS
  // ===================================================================
  {
    when: (state) => !state.isExcess,
    apply: {
      cumulative: false,
      showPercentage: false,
    },
    reason: "Cumulative and percentage only available in excess mode",
    allowUserOverride: false,
  },
];
```

**Tests:** Create `app/lib/state/constraints.test.ts` with constraint logic tests

---

#### 1.3 Create StateResolver (`app/lib/state/StateResolver.ts`)

**Lines:** ~350
**Dependencies:** `types.ts`, `constraints.ts`, `useExplorerState.ts` (for stateFieldEncoders)

```typescript
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { stateFieldEncoders } from "@/composables/useExplorerState";
import { STATE_CONSTRAINTS, DEFAULT_VALUES } from "./constraints";
import type {
  StateChange,
  ResolvedState,
  StateResolutionLog,
  StateFieldMetadata,
} from "./types";

export class StateResolver {
  /**
   * Resolve initial state from URL parameters + defaults
   * Called on page load (explorer, ranking, etc.)
   */
  static resolveInitial(route: RouteLocationNormalizedLoaded): ResolvedState {
    const log: StateResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: "initial",
      before: {},
      after: {},
      changes: [],
      userOverridesFromUrl: [],
    };

    const state = { ...DEFAULT_VALUES };
    const metadata: Record<string, StateFieldMetadata> = {};
    const userOverrides = new Set<string>();

    // Initialize with defaults
    for (const [field, value] of Object.entries(DEFAULT_VALUES)) {
      metadata[field] = {
        value,
        priority: "default",
        reason: "System default",
        changed: false,
        urlKey: stateFieldEncoders[field]?.key,
      };
    }

    // Apply URL parameters (user overrides)
    for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
      const urlKey = encoder.key;
      const urlValue = route.query[urlKey];

      if (urlValue !== undefined && urlValue !== null) {
        userOverrides.add(field);
        log.userOverridesFromUrl.push(field);

        const decoded = encoder.decode?.(urlValue) ?? urlValue;
        state[field] = decoded;

        metadata[field] = {
          value: decoded,
          priority: "user",
          reason: "Set in URL",
          changed: true,
          urlKey,
        };

        log.changes.push({
          field,
          urlKey,
          oldValue: DEFAULT_VALUES[field],
          newValue: decoded,
          priority: "user",
          reason: "Set in URL",
        });
      }
    }

    // Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log);

    log.after = { ...constrainedState };
    this.logResolution(log, "INITIAL");

    return {
      state: constrainedState,
      metadata,
      changedFields: log.changes.map((c) => c.field),
      userOverrides,
      log,
    };
  }

  /**
   * Resolve a state change from user action
   * Called when user clicks toggle, changes dropdown, etc.
   */
  static resolveChange(
    change: StateChange,
    currentState: Record<string, any>,
    userOverrides: Set<string>,
  ): ResolvedState {
    const log: StateResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: change,
      before: { ...currentState },
      after: {},
      changes: [],
      userOverridesFromUrl: Array.from(userOverrides),
    };

    const state = { ...currentState };
    const metadata: Record<string, StateFieldMetadata> = {};
    const urlKey = stateFieldEncoders[change.field]?.key || change.field;

    // Apply triggering change
    state[change.field] = change.value;

    if (change.source === "user") {
      userOverrides.add(change.field);
    }

    metadata[change.field] = {
      value: change.value,
      priority: "user",
      reason: `User ${change.source} action`,
      changed: true,
      urlKey,
    };

    log.changes.push({
      field: change.field,
      urlKey,
      oldValue: currentState[change.field],
      newValue: change.value,
      priority: "user",
      reason: `User ${change.source} action`,
    });

    // Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log);

    log.after = { ...constrainedState };
    this.logResolution(log, "CHANGE");

    return {
      state: constrainedState,
      metadata,
      changedFields: log.changes.map((c) => c.field),
      userOverrides,
      log,
    };
  }

  /**
   * Apply all constraints to state in priority order
   * @private
   */
  private static applyConstraints(
    state: Record<string, any>,
    userOverrides: Set<string>,
    log: StateResolutionLog,
  ): Record<string, any> {
    const newState = { ...state };

    // Sort constraints by priority (high to low)
    const sortedConstraints = [...STATE_CONSTRAINTS].sort((a, b) => {
      const priorityA = a.priority ?? 1;
      const priorityB = b.priority ?? 1;
      return priorityB - priorityA; // Descending
    });

    for (const constraint of sortedConstraints) {
      if (constraint.when(newState)) {
        for (const [field, value] of Object.entries(constraint.apply)) {
          const isUserOverride = userOverrides.has(field);
          const urlKey = stateFieldEncoders[field]?.key || field;

          // Apply constraint unless:
          // 1. User has overridden this field AND
          // 2. Constraint allows user override
          const shouldApply = !(isUserOverride && constraint.allowUserOverride);

          if (shouldApply) {
            const oldValue = newState[field];

            if (oldValue !== value) {
              newState[field] = value;

              log.changes.push({
                field,
                urlKey,
                oldValue,
                newValue: value,
                priority: `constraint (p${constraint.priority ?? 1})`,
                reason: constraint.reason,
              });
            }
          }
        }
      }
    }

    return newState;
  }

  /**
   * Validate and sanitize URL parameters
   * Handles malformed URLs and old bookmarked URLs gracefully
   * @private
   */
  private static validateUrlParams(
    route: RouteLocationNormalizedLoaded,
  ): Record<string, any> {
    const validated: Record<string, any> = {};

    for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
      const urlKey = encoder.key;
      const urlValue = route.query[urlKey];

      if (urlValue !== undefined && urlValue !== null) {
        try {
          // Attempt to decode
          const decoded = encoder.decode?.(urlValue) ?? urlValue;

          // Validate type matches expected (basic check)
          if (decoded !== null && decoded !== undefined) {
            validated[field] = decoded;
          }
        } catch (error) {
          // Malformed param - skip it and use default
          console.warn(
            `[StateResolver] Skipping malformed URL param: ${urlKey}=${urlValue}`,
            error,
          );
        }
      }
    }

    return validated;
  }

  /**
   * Log resolution to console (can be disabled in production)
   * @private
   */
  private static logResolution(
    log: StateResolutionLog,
    type: "INITIAL" | "CHANGE",
  ): void {
    if (import.meta.env.PROD) return; // Disable in production

    const emoji = type === "INITIAL" ? "🚀" : "🔄";
    const title =
      type === "INITIAL"
        ? "Initial State Resolution"
        : `State Resolution: ${log.trigger.field} = ${log.trigger.value}`;

    console.group(`${emoji} ${title}`);

    if (type === "CHANGE") {
      console.log("📋 BEFORE:", this.formatState(log.before));
    }
    console.log("📋 AFTER:", this.formatState(log.after));

    if (log.changes.length > 0) {
      console.group("🔧 Changes Applied:");
      log.changes.forEach((change) => {
        const arrow =
          change.oldValue !== undefined
            ? `${change.oldValue} → ${change.newValue}`
            : change.newValue;
        console.log(
          `  ${change.field} (${change.urlKey}): ${arrow}`,
          `[${change.priority}] ${change.reason}`,
        );
      });
      console.groupEnd();
    }

    console.log("👤 User Overrides:", log.userOverridesFromUrl);
    console.groupEnd();
  }

  /**
   * Format state with URL keys for readability
   * @private
   */
  private static formatState(state: Record<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {};

    for (const [field, value] of Object.entries(state)) {
      const urlKey = stateFieldEncoders[field]?.key || field;
      formatted[`${field} (${urlKey})`] = value;
    }

    return formatted;
  }
}
```

**Tests:** Create `app/lib/state/StateResolver.test.ts` with comprehensive tests

---

### Phase 2: Integration

#### 2.1 Add Helpers to useExplorerState

**File:** `app/composables/useExplorerState.ts`
**Changes:** Add two helper methods

```typescript
/**
 * Get set of fields explicitly set by user in URL
 */
const getUserOverrides = (): Set<string> => {
  const overrides = new Set<string>();

  for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
    if (encoder.key in route.query) {
      overrides.add(field);
    }
  }

  return overrides;
};

/**
 * Get current state as plain object for StateResolver
 */
const getCurrentState = (): Record<string, any> => {
  return {
    countries: countries.value,
    type: type.value,
    chartType: chartType.value,
    chartStyle: chartStyle.value,
    ageGroups: ageGroups.value,
    standardPopulation: standardPopulation.value,
    isExcess: isExcess.value,
    showBaseline: showBaseline.value,
    showPredictionInterval: showPredictionInterval.value,
    cumulative: cumulative.value,
    showPercentage: showPercentage.value,
    showTotal: showTotal.value,
    maximize: maximize.value,
    isLogarithmic: isLogarithmic.value,
    showLabels: showLabels.value,
    baselineMethod: baselineMethod.value,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    sliderStart: sliderStart.value,
    userColors: userColors.value,
    decimals: decimals.value,
    showLogo: showLogo.value,
    showQrCode: showQrCode.value,
    showCaption: showCaption.value,
    chartPreset: chartPreset.value,
  };
};

// Add to return statement
return {
  // ... existing exports
  getUserOverrides,
  getCurrentState,
};
```

---

#### 2.2 Update StateEffects to Use StateResolver

**File:** `app/model/state/StateEffects.ts`
**Changes:** Replace manual constraint logic with StateResolver calls

```typescript
import { StateResolver } from "@/lib/state/StateResolver";
import type { StateChange } from "@/lib/state/types";

export class StateEffects {
  // ... existing code ...

  /**
   * Handle any state change through StateResolver
   * This replaces individual handlers with centralized resolution
   */
  private resolveAndApply(change: StateChange): void {
    const currentState = this.data.getCurrentState();
    const userOverrides = this.data.getUserOverrides();

    const resolved = StateResolver.resolveChange(
      change,
      currentState,
      userOverrides,
    );

    // Apply all resolved changes
    for (const field of resolved.changedFields) {
      if (field !== change.field) {
        // Skip trigger field (already set)
        this.data[field] = resolved.state[field];
      }
    }

    // Reconfigure chart options
    this.configureChartOptions();
  }

  /**
   * Handle excess mode toggle - now uses StateResolver
   */
  onIsExcessChange(newIsExcess: boolean): void {
    this.resolveAndApply({
      field: "isExcess",
      value: newIsExcess,
      source: "user",
    });
  }

  /**
   * Handle type change - now uses StateResolver
   */
  onTypeChange(newType: string): void {
    this.resolveAndApply({
      field: "type",
      value: newType,
      source: "user",
    });
  }

  // Similar for other handlers...
}
```

---

#### 2.3 Initialize State in Pages

**File:** `app/pages/explorer.vue`
**Changes:** Use StateResolver.resolveInitial() on mount

```typescript
import { StateResolver } from "@/lib/state/StateResolver";

onMounted(async () => {
  // Resolve initial state from URL
  const resolved = StateResolver.resolveInitial(route);

  // Apply resolved state
  // (Note: useUrlState will automatically encode and sync to URL)
  for (const [field, value] of Object.entries(resolved.state)) {
    if (state[field]) {
      state[field].value = value;
    }
  }

  // ... rest of existing initialization code
});
```

**Similar changes for:** `app/pages/ranking.vue`

---

### Phase 3: Testing

#### 3.1 Unit Tests

Create comprehensive unit tests:

1. **`app/lib/state/constraints.test.ts`**
   - Test each constraint in isolation
   - Test constraint combinations
   - Test allowUserOverride behavior

2. **`app/lib/state/StateResolver.test.ts`**
   - Test resolveInitial() with various URL combinations
   - Test resolveChange() with various state changes
   - Test priority resolution (user > constraint > default)
   - Test logging output

3. **Integration tests in existing files**
   - Update `app/composables/useExplorerState.test.ts`
   - Update `app/model/state/StateEffects.test.ts`

#### 3.2 Constraint Conflict Tests

**Test constraint priorities and interactions:**

```typescript
// app/lib/state/constraints.test.ts

describe("Constraint Conflicts", () => {
  test("higher priority constraint wins", () => {
    const state = { isExcess: true, showBaseline: false };
    // Priority 2 constraint forces showBaseline=true
    // Should win over any lower priority constraint
  });

  test("user override blocks constraint when allowUserOverride=true", () => {
    const state = { isExcess: true, showPredictionInterval: true };
    const userOverrides = new Set(["showPredictionInterval"]);
    // PI should stay true (user override)
  });

  test("user override cannot block constraint when allowUserOverride=false", () => {
    const state = { isExcess: true, showBaseline: false };
    const userOverrides = new Set(["showBaseline"]);
    // Baseline should still be forced to true (hard constraint)
  });

  test("conflicting constraints use priority order", () => {
    // If two constraints try to set same field to different values,
    // higher priority wins
  });
});
```

#### 3.3 URL Edge Case Tests

**Test malformed and edge case URLs:**

```typescript
// app/lib/state/StateResolver.test.ts

describe("URL Edge Cases", () => {
  test("handles malformed boolean params", () => {
    const url = "?e=invalid&pi=true";
    // Should skip 'e', use default
    // Should decode 'pi' correctly
  });

  test("handles conflicting params", () => {
    const url = "?e=1&sb=0"; // Excess on but baseline off
    // Constraint should force baseline=true
  });

  test("handles missing required params", () => {
    const url = "?e=1"; // Excess but no countries
    // Should use default countries
  });

  test("handles old bookmarked URLs", () => {
    const url = "?e=1&pi=1&sb=1"; // Old URL with all params
    // Should respect user choices
  });

  test("handles array params", () => {
    const url = "?c=USA&c=SWE"; // Multiple values
    // Should decode as array
  });

  test("handles encoded special chars", () => {
    const url = "?c=USA%2CSWE"; // URL encoded comma
    // Should decode correctly
  });
});
```

#### 3.4 E2E Tests

Update E2E tests to verify:

- Excess toggle works in single click
- PI respects user override
- Baseline stays on when excess enabled
- URL state properly synced
- Malformed URLs don't crash page
- Old bookmarked URLs still work

---

### Phase 4: Cleanup & Documentation

#### 4.1 Code to Remove/Simplify

**Remove these hacks:**

1. ~~`app/pages/explorer.vue` - Remove `handleExcessChanged()` if it exists~~
2. ~~Any computed wrappers like `effectiveShowPredictionInterval`~~
3. ~~Manual constraint checks in StateEffects individual handlers~~

**Simplify:**

1. `app/model/state/StateEffects.ts` - Consolidate handlers to use `resolveAndApply()`
2. `app/composables/useExplorerHelpers.ts` - Remove `showPredictionIntervalDisabled` (now in constraints)

#### 4.2 Update Documentation

1. **This file** - Mark as "Implemented" with completion date
2. **README.md** - Add link to State Management section
3. **CLAUDE.md** - Update architecture section with StateResolver

---

## Example Console Output

### Initial Load (`?e=1&c=USA,SWE&pi=1`)

```
🚀 Initial State Resolution
  📋 AFTER: {
    isExcess (e): true,
    countries (c): ['USA', 'SWE'],
    showPredictionInterval (pi): true,     // User set in URL
    showBaseline (sb): true,               // Constraint forced
    isLogarithmic (lg): false,             // Constraint forced
    ...
  }
  🔧 Changes Applied:
    isExcess (e): false → true [user] Set in URL
    countries (c): ['USA'] → ['USA', 'SWE'] [user] Set in URL
    showPredictionInterval (pi): true → true [user] Set in URL
    showBaseline (sb): true → true [constraint] Excess mode requires baseline
    isLogarithmic (lg): false → false [constraint] Excess mode disables logarithmic
  👤 User Overrides: ['isExcess', 'countries', 'showPredictionInterval']
```

### User Clicks Excess Toggle (no PI in URL)

```
🔄 State Resolution: isExcess = true
  📋 BEFORE: {
    isExcess (e): false,
    showBaseline (sb): true,
    showPredictionInterval (pi): true,
    ...
  }
  📋 AFTER: {
    isExcess (e): true,
    showBaseline (sb): true,
    showPredictionInterval (pi): false,  // Auto-disabled
    ...
  }
  🔧 Changes Applied:
    isExcess (e): false → true [user] User user action
    showPredictionInterval (pi): true → false [constraint] Excess mode default
    isLogarithmic (lg): false → false [constraint] Excess mode disables logarithmic
  👤 User Overrides: ['countries', 'type']
```

---

## Constraint Efficiency Optimization

### Current Approach (Simple)

```typescript
// constraints.ts - Array iteration O(n)
export const STATE_CONSTRAINTS: StateConstraint[] = [
  { when: (s) => s.isExcess, apply: {...}, ... },
  { when: (s) => !s.showBaseline, apply: {...}, ... },
  // ... more constraints
]

// StateResolver.ts - Check all constraints
for (const constraint of STATE_CONSTRAINTS) {
  if (constraint.when(state)) {
    // apply...
  }
}
```

**Pros:** Simple, readable, easy to maintain
**Cons:** O(n) - checks all constraints every time

### Optimized Approach (Field-Indexed)

If performance becomes an issue (unlikely with ~10 constraints), we can index by trigger field:

```typescript
// constraints.ts
interface IndexedConstraints {
  byField: Map<string, StateConstraint[]>  // Field → constraints that check it
  global: StateConstraint[]                 // Always-check constraints
}

export const INDEXED_CONSTRAINTS: IndexedConstraints = {
  byField: new Map([
    ['isExcess', [
      { when: (s) => s.isExcess === true, apply: {...}, ... },
      { when: (s) => s.isExcess === false, apply: {...}, ... }
    ]],
    ['type', [
      { when: (s) => s.type === 'population', apply: {...}, ... },
      { when: (s) => s.type === 'asmr' || s.type === 'le', apply: {...}, ... }
    ]],
    // ... more
  ]),
  global: [
    // Constraints that depend on multiple fields
  ]
}

// StateResolver.ts - Only check relevant constraints
const relevantConstraints = [
  ...(INDEXED_CONSTRAINTS.byField.get(change.field) || []),
  ...INDEXED_CONSTRAINTS.global
]

for (const constraint of relevantConstraints) {
  if (constraint.when(state)) {
    // apply...
  }
}
```

**Pros:** O(1) lookup, only checks relevant constraints
**Cons:** More complex, harder to maintain

### Recommendation

**Start with simple array approach:**

- ~10 constraints total
- O(n) with n=10 is negligible (~microseconds)
- Much easier to read and maintain
- Easy to add/modify constraints
- Sufficient for this use case

**Optimize later if needed:**

- Profile shows constraint checking is bottleneck (unlikely)
- Number of constraints grows significantly (>50)
- Can refactor without API changes

### Constraint Declaration Pattern

To make constraints readable and efficient:

```typescript
// Group by feature area
export const STATE_CONSTRAINTS: StateConstraint[] = [
  // ===== EXCESS MODE =====
  excessOnConstraint,
  excessOffConstraint,

  // ===== TYPE CONSTRAINTS =====
  populationTypeConstraint,
  asmrLeTypeConstraint,

  // ===== STYLE CONSTRAINTS =====
  matrixStyleConstraint,

  // ===== CUMULATIVE =====
  cumulativeOffConstraint,
];

// Define constraints as constants for reusability
const excessOnConstraint: StateConstraint = {
  when: (s) => s.isExcess === true,
  apply: {
    showBaseline: true,
    showPredictionInterval: false,
    isLogarithmic: false,
  },
  reason:
    "Excess mode requires baseline, defaults PI to off, disables logarithmic",
  allowUserOverride: true,
};
```

This keeps code organized and makes it easy to test constraints individually.

---

## Benefits

✅ **Single source of truth** - All state resolution logic in one place
✅ **Full audit trail** - Complete logging of every state change with reasons
✅ **Priority system** - Clear, predictable resolution order
✅ **User respect** - User overrides preserved unless hard constraint
✅ **Debuggable** - Rich console logging with before/after state
✅ **Testable** - Pure functions, easy to unit test
✅ **Reusable** - Works for explorer, ranking, any route
✅ **No reactive hell** - Clean, predictable, one-way data flow
✅ **URL compatible** - Uses existing short keys (e, pi, etc.)
✅ **QR friendly** - No breaking changes to URL format

---

## Timeline

- **Phase 1 (Core):** 4-6 hours
- **Phase 2 (Integration):** 2-3 hours
- **Phase 3 (Testing):** 3-4 hours
- **Phase 4 (Cleanup):** 1-2 hours

**Total:** ~10-15 hours

---

## Status

- [x] Phase 1: Create Core Infrastructure
  - [x] 1.1 Create types.ts
  - [x] 1.2 Create constraints.ts
  - [x] 1.3 Create StateResolver.ts
- [x] Phase 2: Integration
  - [x] 2.1 Add helpers to useExplorerState (getUserOverrides, getCurrentStateValues)
  - [x] ~~2.2 Update StateEffects~~ (SKIPPED - old architecture, cleanup in Phase 4)
  - [x] 2.3 Use StateResolver in explorer.vue (handleExcessChanged)
- [ ] Phase 3: Testing
  - [ ] 3.1 Unit tests
  - [ ] 3.2 Constraint conflict tests
  - [ ] 3.3 URL edge case tests
  - [ ] 3.4 E2E tests
- [ ] Phase 4: Cleanup & Documentation
  - [ ] 4.1 Remove old code
  - [ ] 4.2 Update docs

**Phase 1 Completed:** 2025-11-06
**By:** Claude & Ben

---

## View-Based System Implementation (Separate Initiative)

**Date:** 2025-11-08
**Goal:** Replace isExcess conditionals with view-based configuration system
**PR:** #184

This was a separate refactoring initiative that ran parallel to StateResolver work.

### Completed Phases

#### Phase 0: TDD Foundation (2025-11-08)
- ✅ 80 unit tests written before implementation
- Created: viewDetector.test.ts, viewHelpers.test.ts, views.test.ts, viewConstraints.test.ts
- **Result:** All 80 tests passing

#### Phase 1: Core View System (2025-11-08)
- ✅ Created view type system (mortality, excess, zscore)
- ✅ Implemented viewDetector (URL → view)
- ✅ Implemented viewHelpers (isVisible, isRequired, evaluateCondition)
- ✅ Created viewConstraints (view-specific business rules)
- ✅ Integrated with StateResolver
- **Files:** 9 new files created

#### Phase 2: UI Refactoring (2025-11-08)
- ✅ Replaced isExcess conditionals in ExplorerSettings.vue
- ✅ Computed visibility rules from view configuration
- ✅ Removed scattered conditional logic
- **Result:** ~15 isExcess checks removed

#### Phase 4: Remove isExcess Field (2025-11-08)
- ✅ Removed isExcess as URL state field
- ✅ Made isExcess a computed property: `computed(() => view.value === 'excess')`
- ✅ Updated all tests (1464 passing, 5 skipped)
- ✅ Fixed TypeScript errors
- ✅ Updated server-side code to compute isExcess from flags
- **Files Changed:** 22 files, +214 insertions, -1101 deletions

### Architecture Impact

The view-based system complements StateResolver by:
1. **View Detection:** URL params (e=1, zs=1) → view type
2. **View Constraints:** Applied via StateResolver at priority 2 (hard constraints)
3. **UI Configuration:** Typed visibility rules replace scattered conditionals
4. **Backward Compatibility:** Old URLs still work via viewDetector

### Key Learnings

1. **isExcess as derived state:** Making isExcess computed from view eliminated the need to sync it as separate state
2. **View constraints integrate cleanly:** Priority 2 constraints in StateResolver enforce view-specific rules
3. **Test coverage essential:** 80 TDD tests caught edge cases before implementation
4. **Gradual migration successful:** Phases 0-2 laid foundation, Phase 4 completed migration

### Status: ✅ COMPLETE

All phases of view-based system implementation complete. System is production-ready.
