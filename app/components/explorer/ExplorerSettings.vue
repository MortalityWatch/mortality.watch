<script setup lang="ts">
import MortalityChartControlsSecondary from '@/components/charts/MortalityChartControlsSecondary.vue'

const props = defineProps<{
  countries: string[]
  labels: string[]
  allYearlyChartLabelsUnique: string[]
  type: string
  chartType: string
  chartStyle: string
  standardPopulation: string
  isUpdating: boolean
  isPopulationType: boolean
  isExcess: boolean
  baselineMethod: string
  baselineSliderValue: string[]
  showBaseline: boolean
  sliderStart: string
  showPredictionInterval: boolean
  showPredictionIntervalDisabled: boolean
  showLabels: boolean
  maximize: boolean
  isLogarithmic: boolean
  showPercentage: boolean
  cumulative: boolean
  showTotal: boolean
  showLogarithmicOption: boolean
  showMaximizeOption: boolean
  showMaximizeOptionDisabled: boolean
  showPercentageOption: boolean
  showCumulativeOption: boolean
  showTotalOption: boolean
  showTotalOptionDisabled: boolean
  showPredictionIntervalOption: boolean
  showPredictionIntervalOptionDisabled: boolean
  isMatrixChartStyle: boolean
  colors: string[]
  chartPreset?: string
  showLogo: boolean
  showQrCode: boolean
  decimals: string
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
  decimalsChanged: [value: string]
}>()
</script>

<template>
  <UCard class="tab-card">
    <template #header>
      <h2 class="text-xl font-semibold">
        Settings
      </h2>
    </template>

    <MortalityChartControlsSecondary
      :countries="props.countries"
      :labels="props.labels"
      :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique || []"
      :type="props.type"
      :chart-type="props.chartType"
      :chart-style="props.chartStyle"
      :standard-population="props.standardPopulation"
      :is-updating="false"
      :is-population-type="props.isPopulationType"
      :is-excess="props.isExcess"
      :baseline-method="props.baselineMethod"
      :baseline-slider-value="props.baselineSliderValue"
      :show-baseline="props.showBaseline"
      :slider-start="props.sliderStart"
      :show-prediction-interval="props.showPredictionInterval"
      :show-prediction-interval-disabled="props.showPredictionIntervalDisabled"
      :show-labels="props.showLabels"
      :maximize="props.maximize"
      :is-logarithmic="props.isLogarithmic"
      :show-percentage="props.showPercentage || false"
      :cumulative="props.cumulative"
      :show-total="props.showTotal"
      :show-logarithmic-option="!props.isMatrixChartStyle && !props.isExcess"
      :show-maximize-option="
        !(props.isExcess && props.chartStyle === 'line') && !props.isMatrixChartStyle
      "
      :show-maximize-option-disabled="
        props.isLogarithmic || (props.isExcess && !props.showTotalOption)
      "
      :show-percentage-option="props.isExcess"
      :show-cumulative-option="props.isExcess"
      :show-total-option="props.isExcess && props.chartStyle === 'bar'"
      :show-total-option-disabled="!props.cumulative"
      :show-prediction-interval-option="
        props.showBaseline || (props.isExcess && !props.isMatrixChartStyle)
      "
      :show-prediction-interval-option-disabled="props.showPredictionIntervalDisabled"
      :is-matrix-chart-style="props.isMatrixChartStyle"
      :colors="props.colors"
      :chart-preset="props.chartPreset"
      :show-logo="props.showLogo"
      :show-qr-code="props.showQrCode"
      :decimals="props.decimals"
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
      @decimals-changed="emit('decimalsChanged', $event)"
    />
  </UCard>
</template>

<style scoped>
.tab-card :deep(.divide-y) {
  border: none;
}
</style>
