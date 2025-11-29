# State Management System

URL-first state management with constraint-based resolution for complex UI state.

## Overview

This system provides:

- **URL as source of truth** - State is persisted in URL query parameters
- **Constraint-based resolution** - Business rules applied via priority-based constraints
- **View system** - Different modes (mortality/excess/zscore) with their own defaults and UI rules
- **Single-tick updates** - All state changes resolved in one pass, avoiding reactive cascades
- **Audit logging** - Detailed before/after logging for debugging

## Structure

```
app/lib/state/
├── index.ts           # Main barrel export
├── resolver/          # Framework-agnostic library code
│   ├── StateResolver.ts    # Core resolution engine
│   ├── types.ts            # TypeScript interfaces
│   ├── encoders.ts         # URL encoding utilities
│   ├── uiStateComputer.ts  # UI visibility computation
│   ├── viewTypes.ts        # View type definitions
│   ├── viewDetector.ts     # Detect view from URL params
│   ├── viewConstraints.ts  # Get constraints for a view
│   └── viewHelpers.ts      # Utility functions
└── config/            # App-specific configuration
    ├── views.ts            # View definitions
    ├── constraints.ts      # Global constraints
    └── fieldEncoders.ts    # Field → URL key mappings
```

## Usage

### Basic imports

```typescript
// Import everything from main module
import { StateResolver, VIEWS, stateFieldEncoders } from '@/lib/state'

// Or from specific submodules
import { StateResolver } from '@/lib/state/resolver'
import { VIEWS } from '@/lib/state/config'
```

### Resolving initial state from URL

```typescript
import { StateResolver } from '@/lib/state'

// On page load
const resolved = StateResolver.resolveInitial(route)

// Apply to your state refs
applyResolvedState(resolved)

// Sync URL (for corrected/minimal URL)
await StateResolver.applyResolvedState(resolved, route, router, { replaceHistory: true })
```

### Handling user changes

```typescript
// When user toggles a control
const resolved = StateResolver.resolveChange(
  { field: 'showBaseline', value: false, source: 'user' },
  currentState,
  userOverrides
)

// Apply and sync
applyResolvedState(resolved)
await StateResolver.applyResolvedState(resolved, route, router)
```

### Switching views

```typescript
// When user switches from mortality to excess view
const resolved = StateResolver.resolveViewChange(
  'excess',
  currentState,
  userOverrides
)
```

## Core Concepts

### Constraints

Constraints are business rules that enforce valid state combinations:

```typescript
const constraint: StateConstraint = {
  when: state => state.showBaseline === false,
  apply: { showPredictionInterval: false },
  reason: 'Prediction intervals require baseline',
  allowUserOverride: false,
  priority: 1  // 0=default, 1=normal, 2=hard
}
```

### Views

Views define different modes with their own defaults, constraints, and UI visibility:

```typescript
const excessView: ViewConfig = {
  id: 'excess',
  label: 'Excess Mortality',
  urlParam: 'e',  // URL: ?e=1

  ui: {
    baseline: { visibility: { type: 'visible', toggleable: false, value: true } },
    cumulative: { visibility: { type: 'visible', toggleable: true } }
  },

  defaults: {
    chartStyle: 'bar',
    showBaseline: true
  },

  constraints: [
    { when: () => true, apply: { showBaseline: true }, priority: 2, ... }
  ]
}
```

### UI State Computation

The resolver computes UI visibility/disabled state from view config:

```typescript
const resolved = StateResolver.resolveInitial(route)

// resolved.ui contains:
// {
//   baseline: { visible: true, disabled: true },   // required, can't toggle
//   cumulative: { visible: true, disabled: false }, // toggleable
//   logarithmic: { visible: false, disabled: true } // hidden in this view
// }
```

### URL Serialization

Fields are encoded with short keys to keep URLs compact:

```typescript
const stateFieldEncoders = {
  countries: { key: 'c' },
  showBaseline: { key: 'sb', encode: encodeBool, decode: decodeBool },
  // ...
}

// Results in: ?c=USA,SWE&sb=1
```

## Resolution Flow

```
URL Query Params
    ↓
detectView(query)           → Determine view (mortality/excess/zscore)
    ↓
getViewDefaults(view)       → Start with view-specific defaults
    ↓
validateUrlParams(route)    → Parse and validate URL params
    ↓
applyConstraints(state)     → Apply business rules in priority order
    ↓
computeUIState(viewConfig)  → Compute visibility/disabled for each control
    ↓
ResolvedState {
  state: { ... },           // All state values
  ui: { ... },              // UI visibility/disabled
  changedFields: [...],     // What changed
  userOverrides: Set<...>,  // What user explicitly set
  log: { ... }              // Audit trail
}
```

## Logging

In development, the resolver logs all state changes:

```
🚀 Initial State Resolution
📋 AFTER: { view: 'excess', chartStyle: 'bar', ... }
🔧 Changes Applied:
  chartStyle (cs): "line" → "bar" [view-default] Excess view default
  showBaseline (sb): false → true [constraint (p2)] Excess requires baseline
👤 User Overrides: []
🔗 URL Query: { e: '1' }
👁️ UI State: [baseline (disabled), cumulative, percentage, ...]
```

## Testing

Run tests:

```bash
npm run test -- app/lib/state
```

The system has comprehensive unit tests covering:
- Constraint application and priority
- View detection and defaults
- UI state computation
- URL encoding/decoding
- State resolution flow
