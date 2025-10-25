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
  getFilteredLabelAndData,
  getFilteredChartData,
  baselineMinRange
} from './filtering'

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
