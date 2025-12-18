/**
 * Composable for accessing ranking UI configuration state
 *
 * This composable provides reactive access to all UI visibility and
 * disabled state based on current ranking settings.
 */

import { computed, unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import {
  computeRankingUIState,
  getRankingMetricConfig,
  shouldEnableStandardPopulation,
  getDisabledReason,
  type RankingUIState
} from '@/lib/config/rankingConfig'

export function useRankingUIState(
  metricType: Ref<string> | ComputedRef<string>,
  showTotals: Ref<boolean> | ComputedRef<boolean>,
  cumulative: Ref<boolean> | ComputedRef<boolean>,
  showTotalsOnly: Ref<boolean> | ComputedRef<boolean>
) {
  const uiState = computed<RankingUIState>(() =>
    computeRankingUIState(
      unref(metricType),
      unref(showTotals),
      unref(cumulative),
      unref(showTotalsOnly)
    )
  )

  // Also expose metric config
  const metricConfig = computed(() => getRankingMetricConfig(unref(metricType)))

  return {
    // Main UI State
    uiState,

    // Metric config (for direct access if needed)
    metricConfig,

    // Convenience computed properties (extract from uiState)
    showStandardPopulation: computed(() => uiState.value.showStandardPopulation),
    standardPopulationDisabled: computed(() => uiState.value.standardPopulationDisabled),
    totalsOnlyDisabled: computed(() => uiState.value.totalsOnlyDisabled),
    predictionIntervalDisabled: computed(() => uiState.value.predictionIntervalDisabled),
    isExcessMode: computed(() => uiState.value.isExcessMode),

    // Helper functions
    isStandardPopulationEnabled: computed(() => shouldEnableStandardPopulation(unref(metricType))),
    getDisabledReason: (option: 'standardPopulation' | 'totalsOnly' | 'predictionInterval') =>
      getDisabledReason(option, uiState.value)
  }
}
