/**
 * Ranking View Configurations
 *
 * Defines all available ranking view types and their UI/constraint configurations.
 * Follows the same pattern as explorer's views.ts
 */

import type {
  RankingViewConfig,
  RankingViewType,
  UIElement,
  RankingUICondition
} from './types'

// Re-export the type for external use
export type { RankingViewConfig } from './types'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Hidden - element is never rendered */
const hidden = (): UIElement => ({
  visibility: { type: 'hidden' }
})

/** Toggleable - user can toggle the element */
const toggleable = (): UIElement => ({
  visibility: { type: 'visible', toggleable: true }
})

/** Conditional - visibility depends on state */
const conditional = (when: RankingUICondition): UIElement => ({
  visibility: { type: 'conditional', when }
})

// ============================================================================
// VIEW DEFINITIONS
// ============================================================================

/**
 * Ranking View Definitions
 *
 * - relative: Shows excess mortality from baseline (default)
 * - absolute: Shows raw metric values (CMR, ASMR, or LE)
 */
export const RANKING_VIEWS: Record<RankingViewType, RankingViewConfig> = {
  /**
   * Relative View (Default) - Excess Mortality
   *
   * Shows excess from baseline, requires baseline calculations.
   * Default view when no URL params are present.
   */
  relative: {
    id: 'relative',
    label: 'Excess Mortality',
    urlParam: null, // default, no URL param needed (or e=1)

    ui: {
      // Standard Population - conditional on ASMR metric
      standardPopulation: conditional({
        field: 'metricType',
        is: 'asmr'
      }),

      // Baseline options - visible and toggleable in relative mode
      baselineMethod: toggleable(),
      baselinePeriod: toggleable(),

      // Percentage - visible and toggleable
      percentage: toggleable(),

      // Prediction Interval - conditional on cumulative and totals-only
      predictionInterval: conditional({
        and: [
          { field: 'cumulative', is: false },
          { field: 'showTotalsOnly', is: false }
        ]
      }),

      // Totals Only - conditional on showTotals
      totalsOnly: conditional({
        field: 'showTotals',
        is: true
      }),

      // Cumulative - toggleable
      cumulative: toggleable(),

      // Show Total - visible in cumulative mode
      showTotal: conditional({
        field: 'cumulative',
        is: true
      })
    },

    defaults: {
      view: 'relative',
      metricType: 'asmr',
      showPercentage: true,
      showPI: false,
      baselineMethod: 'mean'
    },

    constraints: []
  },

  /**
   * Absolute View - Raw Values
   *
   * Shows raw CMR, ASMR, or LE values without baseline calculations.
   * Accessed via ?e=0 URL param.
   */
  absolute: {
    id: 'absolute',
    label: 'Raw Values',
    urlParam: 'e', // e=0 for absolute mode

    ui: {
      // Standard Population - conditional on ASMR metric
      standardPopulation: conditional({
        field: 'metricType',
        is: 'asmr'
      }),

      // Baseline options - hidden in absolute mode (no baseline calculations)
      baselineMethod: hidden(),
      baselinePeriod: hidden(),

      // Percentage - hidden in absolute mode (absolute values aren't percentages)
      percentage: hidden(),

      // Prediction Interval - hidden in absolute mode
      predictionInterval: hidden(),

      // Totals Only - conditional on showTotals
      totalsOnly: conditional({
        field: 'showTotals',
        is: true
      }),

      // Cumulative - toggleable
      cumulative: toggleable(),

      // Show Total - visible in cumulative mode
      showTotal: conditional({
        field: 'cumulative',
        is: true
      })
    },

    defaults: {
      view: 'absolute',
      metricType: 'asmr',
      showPercentage: false, // Forced off in absolute mode
      showPI: false // Forced off in absolute mode
    },

    constraints: []
  }
}

/**
 * Get view config by type
 */
export function getRankingViewConfig(view: RankingViewType): RankingViewConfig {
  return RANKING_VIEWS[view] || RANKING_VIEWS.relative
}

/**
 * Get default view
 */
export function getDefaultRankingView(): RankingViewType {
  return 'relative'
}
