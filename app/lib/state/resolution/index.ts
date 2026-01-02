/**
 * Core State Resolution
 *
 * Framework-agnostic state resolution functions that work for both
 * server-side rendering (SSR) and client-side explorer.
 *
 * This module provides a single source of truth for:
 * - Effective date/baseline range computation
 * - Chart state resolution from URL parameters
 */

export {
  getDefaultPeriods,
  getVisibleLabels,
  computeEffectiveDateRange,
  computeEffectiveBaselineRange
} from './effectiveDefaults'

export {
  resolveChartStateForRendering,
  resolveChartStateFromSnapshot,
  toChartFilterConfig,
  generateUrlFromState,
  isYearlyChartType,
  computeShowCumPi,
  type ChartRenderState
} from './resolveChartState'
