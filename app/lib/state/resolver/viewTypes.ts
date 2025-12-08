/**
 * View Configuration Type Definitions
 *
 * Defines types for the view-based configuration system that controls
 * UI visibility and behavior based on analysis type (mortality, excess, z-score)
 */

import type { StateConstraint } from './types'

/**
 * View Type identifiers
 */
export type ViewType = 'mortality' | 'excess' | 'zscore'

/**
 * Chart style types
 */
export type ChartStyle = 'line' | 'bar' | 'matrix'

/**
 * Metric types
 */
export type MetricType = 'cmr' | 'asmr' | 'le' | 'deaths' | 'population'

/**
 * Conditions for conditional visibility
 */
export type UICondition
  = | { field: 'chartStyle', is: ChartStyle }
    | { field: 'chartStyle', isNot: ChartStyle }
    | { field: 'showBaseline', is: boolean }
    | { field: 'cumulative', is: boolean }
    | { and: UICondition[] }
    | { or: UICondition[] }

/**
 * UI Element Visibility Rules
 */
export type VisibilityRule
  = | { type: 'hidden' } // Never rendered
    | { type: 'visible', toggleable: true } // User can toggle
    | { type: 'visible', toggleable: false, value: boolean } // Forced value
    | { type: 'conditional', when: UICondition } // Conditional rendering

/**
 * Element that can be disabled
 */
export type DisableableElement
  = | { disabled: false }
    | { disabled: true, reason: string }
    | { disabled: 'conditional', when: UICondition }

/**
 * Complete UI element configuration
 */
export interface UIElement {
  visibility: VisibilityRule
  disabled?: DisableableElement
}

/**
 * View UI Configuration
 * Defines which UI elements are visible/hidden/required in this view
 */
export interface ViewUIConfig {
  // Core toggles
  baseline: UIElement
  predictionInterval: UIElement
  logarithmic: UIElement
  maximize: UIElement
  labels: UIElement

  // Excess-specific
  cumulative: UIElement
  percentage: UIElement
  showTotal: UIElement

  // Z-score specific (future)
  zScoreThreshold?: UIElement
  significanceLevel?: UIElement
}

/**
 * State values interface (from explorer state)
 */
export interface ExplorerStateValues {
  countries: string[]
  type: MetricType
  chartType: string
  chartStyle: ChartStyle
  ageGroups: string[]
  standardPopulation: string
  showPredictionInterval: boolean
  showBaseline: boolean
  baselineMethod: string
  baselineDateFrom: string
  baselineDateTo: string
  cumulative: boolean
  showPercentage: boolean
  showTotal: boolean
  maximize: boolean
  showLogarithmic: boolean
  showLabels: boolean
  showLogo: boolean
  showQrCode: boolean
  showCaption: boolean
  decimals: string
  dateFrom: string
  dateTo: string
  sliderStart: string
  userColors: string[]
  chartPreset: string
  darkMode: boolean
  zScoreThreshold?: number
  significanceLevel?: number
}

/**
 * Complete View Definition
 */
export interface ViewConfig {
  /** Unique view identifier */
  id: ViewType

  /** Display name */
  label: string

  /** Short URL param (null = default view, no param) */
  urlParam: string | null

  /** UI element configuration */
  ui: ViewUIConfig

  /** Default state values for this view */
  defaults: Partial<ExplorerStateValues>

  /** View-specific constraints */
  constraints: StateConstraint[]

  /** Which metrics are compatible */
  compatibleMetrics?: MetricType[]

  /** Which chart styles are compatible */
  compatibleChartStyles?: ChartStyle[]

  /** Which chart types are compatible (e.g., yearly, fluseason, weekly, monthly) */
  compatibleChartTypes?: string[]
}
