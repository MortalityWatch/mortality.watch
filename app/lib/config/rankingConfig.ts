/**
 * Centralized Ranking Configuration System
 *
 * This file defines all UI behavior rules for the ranking table based on
 * metric type and display settings. Instead of scattered if-statements
 * throughout components, all configuration logic is centralized here.
 */

// ============================================================================
// 1. CONFIGURATION INTERFACES
// ============================================================================

export interface RankingUIState {
  // Visibility - what options are shown
  showStandardPopulation: boolean

  // Disabled States - what options are disabled
  standardPopulationDisabled: boolean
  totalsOnlyDisabled: boolean
  predictionIntervalDisabled: boolean

  // Computed Values
  isExcessMode: boolean // Always true for ranking (excess mortality)
}

// ============================================================================
// 2. METRIC CONFIGURATION
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
// 3. COMPUTED UI STATE
// ============================================================================

/**
 * Computes the complete UI state for the ranking page based on current settings.
 *
 * This function encapsulates all the business logic about what should be
 * visible/disabled based on the combination of settings.
 *
 * @param metricType - The selected metric type ('cmr', 'asmr', or 'le')
 * @param showTotals - Whether the totals column is shown
 * @param cumulative - Whether cumulative mode is active
 * @param showTotalsOnly - Whether only the total column is shown
 * @returns Complete UI state with all visibility and disabled flags
 */
export function computeRankingUIState(
  metricType: string,
  showTotals: boolean,
  cumulative: boolean,
  showTotalsOnly: boolean
): RankingUIState {
  const metricConfig = RANKING_METRIC_CONFIGS[metricType] || RANKING_METRIC_CONFIGS.asmr!

  return {
    // Visibility
    showStandardPopulation: true, // Always shown, but disabled for CMR and LE

    // Disabled States
    // Standard Population is only relevant for ASMR
    standardPopulationDisabled: !metricConfig.requiresStandardPopulation,

    // Totals Only requires Totals to be enabled
    totalsOnlyDisabled: !showTotals,

    // Prediction Interval cannot be shown with cumulative or totals-only view
    // Reason: PI is per-period, but cumulative sums and totals aggregate across periods
    predictionIntervalDisabled: cumulative || showTotalsOnly,

    // Computed Values
    isExcessMode: true // Ranking always shows excess mortality
  }
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

/**
 * Get metric configuration by type
 */
export function getRankingMetricConfig(metricType: string): RankingMetricConfig {
  return RANKING_METRIC_CONFIGS[metricType] || RANKING_METRIC_CONFIGS.asmr!
}

/**
 * Check if standard population selector should be visible and enabled
 */
export function shouldEnableStandardPopulation(metricType: string): boolean {
  return getRankingMetricConfig(metricType).requiresStandardPopulation
}

/**
 * Get metric items for dropdown selector
 */
export function getMetricTypeItems() {
  return Object.values(RANKING_METRIC_CONFIGS).map(config => ({
    value: config.value,
    label: config.shortName
  }))
}

/**
 * Get user-friendly explanation for why an option is disabled
 */
const disabledReasons: Record<
  'standardPopulation' | 'totalsOnly' | 'predictionInterval',
  (state: RankingUIState) => string | null
> = {
  standardPopulation: state =>
    state.standardPopulationDisabled
      ? 'Standard Population is only available for ASMR'
      : null,
  totalsOnly: state =>
    state.totalsOnlyDisabled ? 'Enable "Show Totals" first' : null,
  predictionInterval: state =>
    state.predictionIntervalDisabled
      ? 'Prediction Interval is not available in cumulative or totals-only mode'
      : null
}

export function getDisabledReason(
  option: 'standardPopulation' | 'totalsOnly' | 'predictionInterval',
  state: RankingUIState
): string | null {
  return disabledReasons[option]?.(state) ?? null
}
