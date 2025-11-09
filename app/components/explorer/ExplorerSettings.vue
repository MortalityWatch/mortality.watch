<script setup lang="ts">
import { computed } from 'vue'
import MortalityChartControlsSecondary from '@/components/charts/MortalityChartControlsSecondary.vue'
import type { useExplorerState } from '@/composables/useExplorerState'
import { VIEWS } from '@/lib/state/views'
import { isVisible } from '@/lib/state/viewHelpers'
import type { ExplorerStateValues } from '@/lib/state/viewTypes'

const props = defineProps<{
  state: ReturnType<typeof useExplorerState>
  labels: string[]
  allYearlyChartLabelsUnique: string[]
  colors: string[]
  showPredictionIntervalDisabled: boolean
  baselineRange: { from: string, to: string } | null
}>()

const emit = defineEmits<{
  typeChanged: [value: string]
  chartTypeChanged: [value: string]
  chartStyleChanged: [value: string]
  standardPopulationChanged: [value: string]
  isExcessChanged: [value: boolean]
  showBaselineChanged: [value: boolean]
  baselineMethodChanged: [value: string]
  baselineSliderValueChanged: [value: string[]]
  showPredictionIntervalChanged: [value: boolean]
  showLabelsChanged: [value: boolean]
  maximizeChanged: [value: boolean]
  showLogarithmicChanged: [value: boolean]
  showPercentageChanged: [value: boolean]
  cumulativeChanged: [value: boolean]
  showTotalChanged: [value: boolean]
  sliderStartChanged: [value: string]
  userColorsChanged: [value: string[]]
  chartPresetChanged: [value: string]
  showLogoChanged: [value: boolean]
  showQrCodeChanged: [value: boolean]
  showCaptionChanged: [value: boolean]
  decimalsChanged: [value: string]
}>()

// Get current view configuration
const currentView = computed(() => VIEWS[props.state.view.value])

// Build current state values for view helper functions
const currentStateValues = computed<ExplorerStateValues>(() => ({
  countries: props.state.countries.value,
  type: props.state.type.value,
  chartType: props.state.chartType.value,
  chartStyle: props.state.chartStyle.value,
  ageGroups: props.state.ageGroups.value,
  standardPopulation: props.state.standardPopulation.value,
  showPredictionInterval: props.state.showPredictionInterval.value,
  showBaseline: props.state.showBaseline.value,
  baselineMethod: props.state.baselineMethod.value,
  baselineDateFrom: props.state.baselineDateFrom.value,
  baselineDateTo: props.state.baselineDateTo.value,
  cumulative: props.state.cumulative.value,
  showPercentage: props.state.showPercentage.value,
  showTotal: props.state.showTotal.value,
  maximize: props.state.maximize.value,
  showLogarithmic: props.state.showLogarithmic.value,
  showLabels: props.state.showLabels.value,
  showLogo: props.state.showLogo.value,
  showQrCode: props.state.showQrCode.value,
  showCaption: props.state.showCaption.value,
  decimals: props.state.decimals.value,
  dateFrom: props.state.dateFrom.value,
  dateTo: props.state.dateTo.value,
  sliderStart: props.state.sliderStart.value,
  userColors: props.state.userColors.value,
  chartPreset: props.state.chartPreset.value
}))

// UI visibility based on view configuration
// NOTE: This is a partial implementation - only some UI elements are wired to view config.
// Complete UI wiring (including disabled states, forced values, etc.) will be implemented
// in the state library refactor. See docs/state-library-refactor-plan.md for details.
const showLogarithmicOption = computed(() => isVisible(currentView.value.ui.logarithmic, currentStateValues.value))
const showMaximizeOption = computed(() => isVisible(currentView.value.ui.maximize, currentStateValues.value))
const showPercentageOption = computed(() => isVisible(currentView.value.ui.percentage, currentStateValues.value))
const showCumulativeOption = computed(() => isVisible(currentView.value.ui.cumulative, currentStateValues.value))
const showTotalOption = computed(() => isVisible(currentView.value.ui.showTotal, currentStateValues.value))
const showPredictionIntervalOption = computed(() => isVisible(currentView.value.ui.predictionInterval, currentStateValues.value))

// Computed values derived from state
const isPopulationType = computed(() => props.state.type.value === 'population')
const isMatrixChartStyle = computed(() => props.state.chartStyle.value === 'matrix')

// Use user-set baseline dates from URL if available, otherwise use computed defaults
const baselineSliderValue = computed(() => {
  const fromUrl = props.state.baselineDateFrom.value
  const toUrl = props.state.baselineDateTo.value

  // If both are set in URL, use them
  if (fromUrl && toUrl) {
    return [fromUrl, toUrl]
  }

  // Otherwise use computed baseline range (won't pollute URL)
  if (props.baselineRange) {
    return [props.baselineRange.from, props.baselineRange.to]
  }

  // Fallback to empty array if no baseline available yet
  return []
})
</script>

<template>
  <UCard
    class="tab-card"
    data-tour="chart-controls"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Settings
      </h2>
    </template>

    <MortalityChartControlsSecondary
      :countries="props.state.countries.value"
      :labels="props.labels"
      :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique || []"
      :type="props.state.type.value"
      :chart-type="props.state.chartType.value"
      :chart-style="props.state.chartStyle.value"
      :standard-population="props.state.standardPopulation.value"
      :is-updating="false"
      :is-population-type="isPopulationType"
      :is-excess="props.state.isExcess.value"
      :baseline-method="props.state.baselineMethod.value"
      :baseline-slider-value="baselineSliderValue"
      :show-baseline="props.state.showBaseline.value"
      :slider-start="props.state.sliderStart.value"
      :show-prediction-interval="props.state.showPredictionInterval.value"
      :show-prediction-interval-disabled="props.showPredictionIntervalDisabled"
      :show-labels="props.state.showLabels.value"
      :maximize="props.state.maximize.value"
      :show-logarithmic="props.state.showLogarithmic.value"
      :show-percentage="props.state.showPercentage.value || false"
      :cumulative="props.state.cumulative.value"
      :show-total="props.state.showTotal.value"
      :show-logarithmic-option="showLogarithmicOption"
      :show-maximize-option="showMaximizeOption"
      :show-maximize-option-disabled="
        props.state.showLogarithmic.value || (props.state.isExcess.value && !showTotalOption)
      "
      :show-percentage-option="showPercentageOption"
      :show-cumulative-option="showCumulativeOption"
      :show-total-option="showTotalOption"
      :show-total-option-disabled="!props.state.cumulative.value"
      :show-prediction-interval-option="showPredictionIntervalOption"
      :show-prediction-interval-option-disabled="props.showPredictionIntervalDisabled"
      :is-matrix-chart-style="isMatrixChartStyle"
      :colors="props.colors"
      :chart-preset="props.state.chartPreset.value"
      :show-logo="props.state.showLogo.value"
      :show-qr-code="props.state.showQrCode.value"
      :show-caption="props.state.showCaption.value"
      :decimals="props.state.decimals.value"
      @type-changed="emit('typeChanged', $event)"
      @chart-type-changed="emit('chartTypeChanged', $event)"
      @chart-style-changed="emit('chartStyleChanged', $event)"
      @standard-population-changed="emit('standardPopulationChanged', $event)"
      @is-excess-changed="emit('isExcessChanged', $event)"
      @show-baseline-changed="emit('showBaselineChanged', $event)"
      @baseline-method-changed="emit('baselineMethodChanged', $event)"
      @baseline-slider-value-changed="emit('baselineSliderValueChanged', $event)"
      @show-prediction-interval-changed="emit('showPredictionIntervalChanged', $event)"
      @show-labels-changed="emit('showLabelsChanged', $event)"
      @maximize-changed="emit('maximizeChanged', $event)"
      @is-logarithmic-changed="emit('showLogarithmicChanged', $event)"
      @show-percentage-changed="emit('showPercentageChanged', $event)"
      @cumulative-changed="emit('cumulativeChanged', $event)"
      @show-total-changed="emit('showTotalChanged', $event)"
      @slider-start-changed="emit('sliderStartChanged', $event)"
      @user-colors-changed="emit('userColorsChanged', $event)"
      @chart-preset-changed="emit('chartPresetChanged', $event)"
      @show-logo-changed="emit('showLogoChanged', $event)"
      @show-qr-code-changed="emit('showQrCodeChanged', $event)"
      @show-caption-changed="emit('showCaptionChanged', $event)"
      @decimals-changed="emit('decimalsChanged', $event)"
    />
  </UCard>
</template>

<style scoped>
.tab-card :deep(.divide-y) {
  border: none;
}
</style>
