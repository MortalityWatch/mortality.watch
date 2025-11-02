<script setup lang="ts">
import { computed } from 'vue'
import MortalityChartControlsSecondary from '@/components/charts/MortalityChartControlsSecondary.vue'
import type { useExplorerState } from '@/composables/useExplorerState'

const props = defineProps<{
  state: ReturnType<typeof useExplorerState>
  labels: string[]
  allYearlyChartLabelsUnique: string[]
  colors: string[]
  showPredictionIntervalDisabled: boolean
  showTotalOption: boolean
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
  isLogarithmicChanged: [value: boolean]
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

// Computed values derived from state
const isPopulationType = computed(() => props.state.type.value === 'population')
const isMatrixChartStyle = computed(() => props.state.chartStyle.value === 'matrix')
const baselineSliderValue = computed(() => [
  props.state.baselineDateFrom.value,
  props.state.baselineDateTo.value
])
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
      :is-logarithmic="props.state.isLogarithmic.value"
      :show-percentage="props.state.showPercentage.value || false"
      :cumulative="props.state.cumulative.value"
      :show-total="props.state.showTotal.value"
      :show-logarithmic-option="!isMatrixChartStyle && !props.state.isExcess.value"
      :show-maximize-option="
        !(props.state.isExcess.value && props.state.chartStyle.value === 'line') && !isMatrixChartStyle
      "
      :show-maximize-option-disabled="
        props.state.isLogarithmic.value || (props.state.isExcess.value && !props.showTotalOption)
      "
      :show-percentage-option="props.state.isExcess.value"
      :show-cumulative-option="props.state.isExcess.value"
      :show-total-option="props.state.isExcess.value && props.state.chartStyle.value === 'bar'"
      :show-total-option-disabled="!props.state.cumulative.value"
      :show-prediction-interval-option="
        props.state.showBaseline.value || (props.state.isExcess.value && !isMatrixChartStyle)
      "
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
      @is-logarithmic-changed="emit('isLogarithmicChanged', $event)"
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
