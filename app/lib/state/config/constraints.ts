/**
 * State Constraints
 *
 * Defines business rule constraints for state resolution.
 * Constraints are applied in priority order (high to low) when their
 * condition is met.
 *
 * NOTE: Defaults are now in VIEWS (views.ts). Each view has its own defaults.
 * Use VIEWS[viewType].defaults to get defaults for a specific view.
 */

import type { StateConstraint } from '../resolver/types'

// ============================================================================
// FIELD UPDATE STRATEGY
// ============================================================================

/**
 * Update type for field changes - determines what kind of data refresh is needed
 */
export type FieldUpdateType = 'download' | 'update' | 'filter' | 'none'

/**
 * Field Update Strategy
 *
 * Centralized mapping of state field changes to required data operations.
 * This extracts the logic from explorer.vue into a single source of truth.
 *
 * - download: Requires fresh data fetch from server (e.g., country/type change)
 * - update: Requires dataset recalculation (e.g., baseline method change)
 * - filter: Only needs chart re-rendering (e.g., date range, style change)
 * - none: No data operation needed (e.g., display-only options like showLabels)
 *
 * Note: Some fields have conditional behavior based on current state,
 * which is handled by getFieldUpdateType()
 */
export const FIELD_UPDATE_STRATEGY: Record<string, FieldUpdateType> = {
  // Download: Requires fetching new data from server
  countries: 'download',
  type: 'download',
  chartType: 'download',
  ageGroups: 'download',

  // Update: Requires recalculating baseline/dataset
  baselineMethod: 'update',
  standardPopulation: 'update',
  baselineDateFrom: 'update',
  baselineDateTo: 'update',
  sliderStart: 'update',
  // Note: cumulative is conditional - see getFieldUpdateType()

  // Filter: Only needs chart re-rendering with existing data
  dateFrom: 'filter',
  dateTo: 'filter',
  chartStyle: 'filter',
  view: 'filter',
  isExcess: 'filter',
  showBaseline: 'filter',
  cumulative: 'filter', // Default to filter, but may be 'update' if baselineMethod !== 'auto'
  showPredictionInterval: 'filter',
  showPercentage: 'filter',
  showTotal: 'filter',
  userColors: 'filter',

  // None: Display-only, no data refresh needed
  showLabels: 'none',
  maximize: 'none',
  showLogarithmic: 'none',
  showLogo: 'none',
  showQrCode: 'none',
  showCaption: 'none',
  showTitle: 'none',
  decimals: 'none',
  chartPreset: 'none'
}

/**
 * Get the update type for a field change, considering current state.
 *
 * Some fields have conditional behavior:
 * - cumulative: needs 'update' if baselineMethod !== 'auto' (affects baseline calculation)
 *
 * @param field - The field that changed (without underscore prefix)
 * @param currentState - Current state values for conditional checks
 * @returns The type of update needed
 */
export function getFieldUpdateType(
  field: string,
  currentState?: Record<string, unknown>
): FieldUpdateType {
  // Handle underscore-prefixed keys (legacy format from explorer.vue)
  const normalizedField = field.startsWith('_') ? field.slice(1) : field

  // Special case: dateRange is a virtual field for combined dateFrom/dateTo changes
  if (normalizedField === 'dateRange') {
    return 'filter'
  }

  // Conditional: cumulative needs 'update' if baseline is not auto
  if (normalizedField === 'cumulative' && currentState) {
    if (currentState.baselineMethod !== 'auto') {
      return 'update'
    }
  }

  return FIELD_UPDATE_STRATEGY[normalizedField] ?? 'none'
}

/**
 * Determine if a field change requires downloading new data from server
 */
export function requiresDataDownload(field: string, currentState?: Record<string, unknown>): boolean {
  return getFieldUpdateType(field, currentState) === 'download'
}

/**
 * Determine if a field change requires updating the dataset (baseline recalculation)
 */
export function requiresDatasetUpdate(field: string, currentState?: Record<string, unknown>): boolean {
  return getFieldUpdateType(field, currentState) === 'update'
}

/**
 * Determine if a field change requires re-filtering/re-rendering chart data
 */
export function requiresFilterUpdate(field: string, currentState?: Record<string, unknown>): boolean {
  const updateType = getFieldUpdateType(field, currentState)
  // Download and update also require filter update
  return updateType === 'download' || updateType === 'update' || updateType === 'filter'
}

// ============================================================================
// CONSTRAINT DEFINITIONS
// ============================================================================

/**
 * Baseline OFF constraints
 * PI requires baseline to be shown (unless in a view that allows it)
 * Note: Excess view handles this via view-specific constraints
 */
const baselineOffConstraints: StateConstraint = {
  when: state => state.showBaseline === false,
  apply: {
    showPredictionInterval: false // PI requires baseline
  },
  reason: 'Prediction intervals require baseline',
  allowUserOverride: false,
  priority: 1
}

/**
 * Baseline ON restoration constraint
 * When baseline is enabled and PI is not explicitly overridden by user,
 * restore PI to view default. This fixes the issue where PI stays disabled
 * after baseline disable→enable cycle.
 *
 * Only applies to mortality view where PI defaults to true.
 * Excess and Z-score views have PI=false by default.
 *
 * Priority 0 (lowest) ensures user overrides take precedence.
 */
const baselineOnRestorePI: StateConstraint = {
  when: state => state.showBaseline === true && (state.view === 'mortality' || state.view === undefined),
  apply: {
    showPredictionInterval: true // Restore to mortality view default
  },
  reason: 'Restore prediction interval to default when baseline is enabled',
  allowUserOverride: true, // Allow user to explicitly set PI=false
  priority: 0 // Lowest priority - only acts as fallback default
}

/**
 * Population type constraints
 * Population doesn't support baseline or prediction intervals
 * Note: Population is not compatible with excess view (handled by view.compatibleMetrics)
 */
const populationTypeConstraints: StateConstraint = {
  when: state => state.type === 'population',
  apply: {
    showBaseline: false,
    showPredictionInterval: false
  },
  reason: 'Population type does not support baseline or prediction intervals',
  allowUserOverride: false,
  priority: 2
}

/**
 * ASMR and Life Expectancy type constraints
 * These types only support 'all' age group
 */
const asmrLeTypeConstraints: StateConstraint = {
  when: state => state.type === 'asmr' || state.type === 'le',
  apply: {
    ageGroups: ['all']
  },
  reason: 'ASMR and Life Expectancy only support "all" age group',
  allowUserOverride: false,
  priority: 2
}

/**
 * Matrix chart style constraints
 * Matrix disables several features
 */
const matrixStyleConstraints: StateConstraint = {
  when: state => state.chartStyle === 'matrix',
  apply: {
    showBaseline: false,
    showPredictionInterval: false,
    maximize: false,
    showLogarithmic: false
  },
  reason: 'Matrix style disables baseline, PI, maximize, and logarithmic',
  allowUserOverride: false,
  priority: 2
}

/**
 * Cumulative OFF constraints
 * Show total requires cumulative mode
 */
const cumulativeOffConstraints: StateConstraint = {
  when: state => state.cumulative === false,
  apply: {
    showTotal: false
  },
  reason: 'Show total requires cumulative mode',
  allowUserOverride: false,
  priority: 1
}

/**
 * View synchronization constraints
 * Synchronize isExcess and isZScore flags with the view field
 */
const viewSyncExcessConstraint: StateConstraint = {
  when: state => state.view === 'excess',
  apply: {
    isExcess: true,
    isZScore: false
  },
  reason: 'Excess view sets isExcess=true',
  allowUserOverride: false,
  priority: 2
}

const viewSyncZScoreConstraint: StateConstraint = {
  when: state => state.view === 'zscore',
  apply: {
    isExcess: false,
    isZScore: true
  },
  reason: 'Z-Score view sets isZScore=true',
  allowUserOverride: false,
  priority: 2
}

const viewSyncMortalityConstraint: StateConstraint = {
  when: state => state.view === 'mortality',
  apply: {
    isExcess: false,
    isZScore: false
  },
  reason: 'Mortality view clears view flags',
  allowUserOverride: false,
  priority: 2
}

// ============================================================================
// CONSTRAINT REGISTRY
// ============================================================================

/**
 * All state constraints in order of priority
 * Applied in array order, but sorted by priority in StateResolver
 */
export const STATE_CONSTRAINTS: StateConstraint[] = [
  // Priority 2: Hard constraints (cannot be overridden)
  // Note: Excess-related constraints moved to view-based system (views.ts)
  // Note: Z-score constraints moved to view-based system (views.ts)
  populationTypeConstraints,
  asmrLeTypeConstraints,
  matrixStyleConstraints,

  // View synchronization (keep isExcess/isZScore in sync with view field)
  viewSyncExcessConstraint,
  viewSyncZScoreConstraint,
  viewSyncMortalityConstraint,

  // Priority 1: Normal business rules
  baselineOffConstraints,
  cumulativeOffConstraints,

  // Priority 0: Soft defaults (lowest priority, allow user override)
  baselineOnRestorePI
]
