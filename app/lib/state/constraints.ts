/**
 * State Constraints and Defaults
 *
 * Defines all business rules and default values for state resolution.
 * Constraints are applied in priority order (high to low) when their
 * condition is met.
 */

import type { StateConstraint } from './types'

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default values when nothing is set in URL
 */
export const DEFAULT_VALUES: Record<string, unknown> = {
  // Core settings
  countries: ['USA'],
  type: 'cmr',
  chartType: 'yearly',
  chartStyle: 'line',
  ageGroups: ['all'],
  standardPopulation: 'who',

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
  baselineMethod: 'mean',

  // Dates (undefined = use defaults from data availability)
  dateFrom: undefined,
  dateTo: undefined,
  sliderStart: undefined,
  baselineDateFrom: undefined,
  baselineDateTo: undefined,

  // Chart appearance
  decimals: 'auto',
  showLogo: true,
  showQrCode: true,
  showCaption: true,
  chartPreset: undefined,
  userColors: undefined
}

// ============================================================================
// CONSTRAINT DEFINITIONS
// ============================================================================

/**
 * Excess mode hard constraints (priority 2)
 * Cannot be overridden by user
 */
const excessModeHardConstraints: StateConstraint = {
  when: state => state.isExcess === true,
  apply: {
    showBaseline: true, // MUST be ON (excess needs baseline for calculation)
    isLogarithmic: false // MUST be off (incompatible with excess)
  },
  reason: 'Excess mode requires baseline and disables logarithmic scale',
  allowUserOverride: false,
  priority: 2
}

/**
 * Excess mode default overrides (priority 0)
 * User can override these
 */
const excessModeDefaults: StateConstraint = {
  when: state => state.isExcess === true,
  apply: {
    showPredictionInterval: false, // DEFAULT off (but user can turn back on)
    showPercentage: true // DEFAULT on (but user can turn off)
  },
  reason: 'Excess mode defaults: PI off, percentage on (user can override)',
  allowUserOverride: true,
  priority: 0
}

/**
 * When excess is disabled, reset excess-only features
 */
const excessOffConstraints: StateConstraint = {
  when: state => state.isExcess === false,
  apply: {
    cumulative: false,
    showPercentage: false
  },
  reason: 'Cumulative and percentage only available in excess mode',
  allowUserOverride: false,
  priority: 1
}

/**
 * Baseline OFF constraints
 * PI requires baseline to be shown
 */
const baselineOffConstraints: StateConstraint = {
  when: state => state.showBaseline === false && state.isExcess === false,
  apply: {
    showPredictionInterval: false // PI requires baseline
  },
  reason: 'Prediction intervals require baseline or excess mode',
  allowUserOverride: false,
  priority: 1
}

/**
 * Population type constraints
 * Population doesn't support excess or baseline
 */
const populationTypeConstraints: StateConstraint = {
  when: state => state.type === 'population',
  apply: {
    isExcess: false,
    showBaseline: false,
    showPredictionInterval: false
  },
  reason: 'Population type does not support excess or baseline',
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
    isLogarithmic: false
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

// ============================================================================
// CONSTRAINT REGISTRY
// ============================================================================

/**
 * All state constraints in order of priority
 * Applied in array order, but sorted by priority in StateResolver
 */
export const STATE_CONSTRAINTS: StateConstraint[] = [
  // Priority 2: Hard constraints (cannot be overridden)
  excessModeHardConstraints,
  populationTypeConstraints,
  asmrLeTypeConstraints,
  matrixStyleConstraints,

  // Priority 1: Normal business rules
  baselineOffConstraints,
  cumulativeOffConstraints,
  excessOffConstraints,

  // Priority 0: Default overrides (user can override)
  excessModeDefaults
]
