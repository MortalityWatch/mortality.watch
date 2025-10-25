/**
 * Composable for accessing chart UI configuration state
 *
 * This composable provides reactive access to all UI visibility and
 * disabled state based on current chart settings.
 */

import { computed, unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ChartStyle } from '@/lib/chart/chartTypes'
import {
  computeChartUIState,
  getMetricConfig,
  getPeriodConfig,
  getChartStyleConfig,
  type ChartUIState
} from '@/lib/config/chartConfig'

export function useChartUIState(
  type: Ref<string> | ComputedRef<string>,
  chartType: Ref<string> | ComputedRef<string>,
  chartStyle: Ref<ChartStyle> | ComputedRef<ChartStyle>,
  isExcess: Ref<boolean> | ComputedRef<boolean>,
  standardPopulation: Ref<string> | ComputedRef<string>,
  countriesCount: Ref<number> | ComputedRef<number>,
  showBaseline: Ref<boolean> | ComputedRef<boolean>,
  cumulative: Ref<boolean> | ComputedRef<boolean>,
  baselineMethod: Ref<string> | ComputedRef<string>
) {
  const isYearlyType = computed(() => {
    const ct = unref(chartType)
    return ct.includes('year')
      || ct.includes('fluseason')
      || ct.includes('midyear')
  })

  const uiState = computed<ChartUIState>(() =>
    computeChartUIState(
      unref(type),
      unref(chartType),
      unref(chartStyle),
      unref(isExcess),
      unref(standardPopulation),
      unref(countriesCount),
      unref(showBaseline),
      unref(cumulative),
      unref(baselineMethod),
      isYearlyType.value
    )
  )

  // Also expose individual config getters
  const metricConfig = computed(() => getMetricConfig(unref(type)))
  const periodConfig = computed(() => getPeriodConfig(unref(chartType)))
  const styleConfig = computed(() => getChartStyleConfig(unref(chartStyle)))

  return {
    // Main UI State
    uiState,

    // Individual configs (for direct access if needed)
    metricConfig,
    periodConfig,
    styleConfig,

    // Convenience computed properties (extract from uiState)
    showStandardPopulation: computed(() => uiState.value.showStandardPopulation),
    showAgeGroups: computed(() => uiState.value.showAgeGroups),
    showBaselineOption: computed(() => uiState.value.showBaselineOption),
    showBaselineMethodSelector: computed(() => uiState.value.showBaselineMethodSelector),
    showPredictionIntervalOption: computed(() => uiState.value.showPredictionIntervalOption),
    showMaximizeOption: computed(() => uiState.value.showMaximizeOption),
    showLogarithmicOption: computed(() => uiState.value.showLogarithmicOption),
    showCumulativeOption: computed(() => uiState.value.showCumulativeOption),
    showPercentageOption: computed(() => uiState.value.showPercentageOption),
    showTotalOption: computed(() => uiState.value.showTotalOption),
    showLabelsOption: computed(() => uiState.value.showLabelsOption),
    maximizeDisabled: computed(() => uiState.value.maximizeDisabled),
    predictionIntervalDisabled: computed(() => uiState.value.predictionIntervalDisabled),
    totalDisabled: computed(() => uiState.value.totalDisabled),
    maxCountriesAllowed: computed(() => uiState.value.maxCountriesAllowed),
    availableBaselineMethods: computed(() => uiState.value.availableBaselineMethods),
    availableChartStyles: computed(() => uiState.value.availableChartStyles)
  }
}
