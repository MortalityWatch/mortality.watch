/**
 * Chart View System
 *
 * Hierarchical chart view configuration with inheritance
 *
 * Structure:
 * - BASE_VIEW: Master config with default implementations
 * - Individual views (mortality, excess, zscore): Inherit from base and override as needed
 * - mergeWithBase(): Merges view-specific overrides with base config
 *
 * Benefits:
 * - DRY: Shared logic in base, views only define differences
 * - Consistency: All views inherit same base behavior
 * - Easy to extend: New views just specify overrides
 */

import type { ViewType } from '../../state'
import type { ChartViewConfig, CompleteChartViewConfig } from './types'
import { BASE_VIEW } from './base'
import { MORTALITY_VIEW } from './mortality'
import { EXCESS_VIEW } from './excess'
import { ZSCORE_VIEW } from './zscore'

// Re-export types for external use
export type { ChartContext, ReferenceLineConfig, ChartViewConfig, CompleteChartViewConfig } from './types'
export { getAgeGroupSuffix, getASMRTitle, getBaselineDescription } from './helpers'

/**
 * Merge view-specific config with base config
 * View overrides take precedence over base defaults
 */
function mergeWithBase(viewConfig: ChartViewConfig): CompleteChartViewConfig {
  return {
    getTitleParts: viewConfig.getTitleParts || BASE_VIEW.getTitleParts,
    getSubtitle: viewConfig.getSubtitle || BASE_VIEW.getSubtitle,
    yAxisLabel: viewConfig.yAxisLabel || BASE_VIEW.yAxisLabel,
    xAxisLabel: viewConfig.xAxisLabel || BASE_VIEW.xAxisLabel,
    referenceLines: viewConfig.referenceLines || BASE_VIEW.referenceLines
  }
}

/**
 * Chart view configurations with inheritance
 * Each view inherits from BASE_VIEW and overrides as needed
 */
export const CHART_VIEWS: Record<ViewType, CompleteChartViewConfig> = {
  mortality: mergeWithBase(MORTALITY_VIEW),
  excess: mergeWithBase(EXCESS_VIEW),
  zscore: mergeWithBase(ZSCORE_VIEW)
}

/**
 * Get chart view configuration for a given view type
 * Always returns a valid config (defaults to mortality view)
 */
export function getChartView(view: ViewType): CompleteChartViewConfig {
  const config = CHART_VIEWS[view]
  if (!config) {
    return CHART_VIEWS.mortality
  }
  return config
}
