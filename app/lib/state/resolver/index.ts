/**
 * State Resolution Core Library
 *
 * Framework-agnostic state resolution engine with:
 * - Constraint-based state resolution
 * - Priority-based conflict resolution
 * - View system with UI visibility rules
 * - URL state serialization utilities
 * - Audit logging
 */

// Core resolver
export { StateResolver } from './StateResolver'

// Types
export type {
  StateChange,
  StateFieldMetadata,
  ResolvedState,
  StateResolutionLog,
  StateConstraint
} from './types'

// View types
export type {
  ViewType,
  ViewConfig,
  UIElement,
  UICondition,
  ExplorerStateValues,
  MetricType,
  ChartStyle
} from './viewTypes'

// UI state computation
export { computeUIState, type UIFieldState } from './uiStateComputer'

// View utilities
export { detectView } from './viewDetector'
export { getViewConstraints } from './viewConstraints'
export {
  isVisible,
  isRequired,
  getDefaultValue,
  isDisabled,
  getDisabledReason,
  evaluateCondition,
  isMetricCompatible,
  isChartStyleCompatible,
  inferIsExcessFromFlags
} from './viewHelpers'

// Encoding utilities
export {
  encodeBool,
  decodeBool,
  encodeString,
  decodeString
} from './encoders'
