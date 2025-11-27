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
  // View (default to mortality)
  view: 'mortality',
  isExcess: false,
  isZScore: false,

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
  showLogarithmic: false,
  showLabels: true,

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
  cumulativeOffConstraints
]
