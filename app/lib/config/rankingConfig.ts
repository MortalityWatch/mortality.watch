/**
 * Ranking Configuration
 *
 * Provides metric configuration and helper functions for the ranking page.
 *
 * NOTE: UI state computation has been moved to the StateResolver pattern.
 * See @/lib/state/ranking for the new centralized state management.
 */

// ============================================================================
// METRIC CONFIGURATION
// ============================================================================

export interface RankingMetricConfig {
  value: 'cmr' | 'asmr' | 'le'
  name: string
  shortName: string
  requiresStandardPopulation: boolean
}

export const RANKING_METRIC_CONFIGS: Record<string, RankingMetricConfig> = {
  cmr: {
    value: 'cmr',
    name: 'Crude Mortality Rate',
    shortName: 'CMR',
    requiresStandardPopulation: false
  },
  asmr: {
    value: 'asmr',
    name: 'Age-Standardized Mortality Rate',
    shortName: 'ASMR',
    requiresStandardPopulation: true
  },
  le: {
    value: 'le',
    name: 'Life Expectancy',
    shortName: 'LE',
    requiresStandardPopulation: false
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get metric configuration by type
 */
export function getRankingMetricConfig(metricType: string): RankingMetricConfig {
  return RANKING_METRIC_CONFIGS[metricType] || RANKING_METRIC_CONFIGS.asmr!
}

/**
 * Check if standard population selector should be enabled for a metric type
 */
export function shouldEnableStandardPopulation(metricType: string): boolean {
  return getRankingMetricConfig(metricType).requiresStandardPopulation
}

/**
 * Get metric items for dropdown selector
 * Uses full name with abbreviation to match explorer page format
 */
export function getMetricTypeItems() {
  return Object.values(RANKING_METRIC_CONFIGS).map(config => ({
    value: config.value,
    label: `${config.name} (${config.shortName})`
  }))
}

/**
 * Get display mode items for dropdown/toggle selector
 */
export function getDisplayModeItems() {
  return [
    { value: 'relative', label: 'Relative' },
    { value: 'absolute', label: 'Absolute' }
  ]
}
