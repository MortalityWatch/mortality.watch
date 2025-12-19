/**
 * Ranking State Type Definitions
 *
 * Defines types for the ranking page state resolution system.
 * Follows the same patterns as the explorer state resolver.
 */

import type { StateConstraint } from '../resolver/types'

// ============================================================================
// VALUE TYPES
// ============================================================================

/**
 * Metric type for ranking calculations
 * - cmr: Crude Mortality Rate (deaths per population)
 * - asmr: Age-Standardized Mortality Rate (requires standard population)
 * - le: Life Expectancy (years)
 */
export type MetricType = 'cmr' | 'asmr' | 'le'

/**
 * Display mode for ranking values
 * - absolute: Raw metric values (e.g., ASMR = 850.2)
 * - relative: Excess from baseline (e.g., +5.2% from baseline)
 */
export type DisplayMode = 'absolute' | 'relative'

/**
 * Ranking view type - maps to display mode for consistency with explorer
 * The view determines which UI elements are visible and which constraints apply
 */
export type RankingViewType = 'absolute' | 'relative'

/**
 * Period types for ranking data
 */
export type RankingPeriod = 'yearly' | 'fluseason' | 'midyear' | 'quarterly'

/**
 * Jurisdiction types for filtering countries/regions
 */
export type JurisdictionType
  = 'countries'
    | 'subdivision'
    | 'countries_states'
    | 'usa'
    | 'can'
    | 'aus'
    | 'eu'
    | 'eu27'
    | 'europe'
    | 'na'
    | 'sa'
    | 'oc'
    | 'af'
    | 'as'
    | 'deu'

/**
 * Standard population options for ASMR
 */
export type StandardPopulation = 'who' | 'esp' | 'usa2000'

/**
 * Baseline calculation methods
 */
export type BaselineMethod = 'mean' | 'median' | 'auto'

/**
 * Decimal precision for display
 */
export type DecimalPrecision = '0' | '1' | '2' | '3' | 'auto'

// ============================================================================
// STATE INTERFACES
// ============================================================================

/**
 * Complete ranking state
 *
 * Contains all state values for the ranking page.
 * This is the resolved state after applying constraints.
 */
export interface RankingState {
  // View (determines absolute vs relative mode)
  view: RankingViewType

  // Period configuration
  periodOfTime: RankingPeriod
  jurisdictionType: JurisdictionType

  // Metric configuration
  metricType: MetricType
  standardPopulation: StandardPopulation

  // Display toggles
  showTotals: boolean
  showTotalsOnly: boolean
  showPercentage: boolean
  showPI: boolean
  cumulative: boolean
  hideIncomplete: boolean

  // Decimal precision for display
  decimalPrecision: DecimalPrecision

  // Baseline configuration (only used in relative mode)
  baselineMethod: BaselineMethod
  baselineDateFrom?: string
  baselineDateTo?: string

  // Date range
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// UI CONFIGURATION TYPES
// ============================================================================

/**
 * UI element visibility/disabled state
 * Matches the explorer pattern from uiStateComputer.ts
 */
export interface UIFieldState {
  visible: boolean
  disabled: boolean
}

/**
 * Conditions for conditional visibility
 * Matches the explorer pattern from viewTypes.ts
 */
export type RankingUICondition
  = { field: 'metricType', is: MetricType }
    | { field: 'view', is: RankingViewType }
    | { field: 'showTotals', is: boolean }
    | { field: 'cumulative', is: boolean }
    | { field: 'showTotalsOnly', is: boolean }
    | { and: RankingUICondition[] }
    | { or: RankingUICondition[] }

/**
 * UI visibility rules - matches explorer pattern
 */
export type VisibilityRule
  = { type: 'hidden' }
    | { type: 'visible', toggleable: true }
    | { type: 'visible', toggleable: false, value: boolean }
    | { type: 'conditional', when: RankingUICondition }

/**
 * UI element configuration
 */
export interface UIElement {
  visibility: VisibilityRule
}

/**
 * Ranking UI Configuration
 * Defines which UI elements are visible/hidden/required in each view
 */
export interface RankingUIConfig {
  // Metric configuration
  standardPopulation: UIElement
  baselineMethod: UIElement
  baselinePeriod: UIElement

  // Display toggles
  percentage: UIElement
  predictionInterval: UIElement
  totalsOnly: UIElement
  cumulative: UIElement
  showTotal: UIElement
}

// ============================================================================
// VIEW CONFIGURATION
// ============================================================================

/**
 * Complete Ranking View Definition
 * Matches the explorer ViewConfig pattern
 */
export interface RankingViewConfig {
  /** Unique view identifier */
  id: RankingViewType

  /** Display name */
  label: string

  /** Short URL param (null = default view, no param) */
  urlParam: string | null

  /** UI element configuration */
  ui: RankingUIConfig

  /** Default state values for this view */
  defaults: Partial<RankingState>

  /** View-specific constraints */
  constraints: StateConstraint[]
}

// ============================================================================
// RESOLVED STATE
// ============================================================================

/**
 * Resolution log entry
 */
export interface RankingStateChange {
  field: string
  urlKey: string
  oldValue: unknown
  newValue: unknown
  priority: string
  reason: string
}

/**
 * Resolution log
 */
export interface RankingResolutionLog {
  timestamp: string
  trigger: { field: string, value: unknown } | 'initial'
  before: Record<string, unknown>
  after: Record<string, unknown>
  changes: RankingStateChange[]
  userOverridesFromUrl: string[]
}

/**
 * Complete resolved ranking state with UI metadata
 */
export interface ResolvedRankingState {
  /** The resolved state values */
  state: RankingState

  /** UI state for each field (visibility, disabled state) */
  ui: Record<string, UIFieldState>

  /** Current view type */
  view: RankingViewType

  /** Fields that were explicitly set by user in URL */
  userOverrides: Set<string>

  /** Audit log of all changes */
  log: RankingResolutionLog
}
