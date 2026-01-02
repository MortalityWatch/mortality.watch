/**
 * Chart module - Public API
 * Exports all chart-related functionality
 */

// Predicates
export { isBl, isPredictionIntervalKey } from './predicates'

// Dataset builders
export { getDatasets } from './datasets'

// Label builders
export { getChartLabels, blDescription } from './labels'

// Filtering
export {
  getFilteredChartDataFromConfig,
  baselineMinRange
} from './filtering'

// Types
export type { ChartFilterConfig, ChartStateSnapshot } from './types'

// Chart configuration and utilities
export * from './chartConfig'
export * from './chartUtils'
export * from './chartTypes'
export * from './chartColors'
export * from './chartStyling'

// Plugins
export * from './backgroundPlugin'
export * from './logoPlugin'
export * from './qrCodePlugin'

// Steep drop detection
export {
  detectSteepDrop,
  findAdjustedEndLabel,
  findCommonAdjustedEndLabel,
  STEEP_DROP_CONFIGS
} from './steepDropDetection'
export type { SteepDropConfig, SteepDropResult } from './steepDropDetection'
