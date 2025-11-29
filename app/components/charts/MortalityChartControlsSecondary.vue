<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import DataTab from './controls/DataTab.vue'
import DisplayTab from './controls/DisplayTab.vue'
import BaselineTab from './controls/BaselineTab.vue'
import StyleTab from './controls/StyleTab.vue'
import { CHART_PRESETS } from '@/lib/constants'
import { chartStyles, baselineMethods, decimalPrecisions } from '@/model'
import { useChartUIState } from '@/composables/useChartUIState'
import type { ChartStyle } from '@/lib/chart/chartTypes'
import type { ViewType } from '@/lib/state'

// Feature access for tier-based features
const { can } = useFeatureAccess()

// Props
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
  view: ViewType
  baselineMethod: string
  baselineSliderValue: string[]
  showBaseline: boolean
  showPredictionInterval: boolean
  showPredictionIntervalDisabled: boolean
  showLabels: boolean
  maximize: boolean
  showLogarithmic: boolean
  showPercentage?: boolean
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
  sliderStart: string
  chartPreset?: string
  showLogo: boolean
  showQrCode: boolean
  showCaption: boolean
  decimals: string
}>()

// Emits
const emit = defineEmits<{
  typeChanged: [value: string]
  chartTypeChanged: [value: string]
  chartStyleChanged: [value: string]
  standardPopulationChanged: [value: string]
  viewChanged: [value: ViewType]
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
  userColorsChanged: [value: string[]]
  sliderStartChanged: [value: string]
  chartPresetChanged: [value: string]
  showLogoChanged: [value: boolean]
  showQrCodeChanged: [value: boolean]
  showCaptionChanged: [value: boolean]
  decimalsChanged: [value: string]
}>()

// Backward compat: compute isExcess from view for chartUIState
const isExcess = computed(() => props.view === 'excess')

// Initialize chart UI state configuration
const chartUIState = useChartUIState(
  toRef(props, 'type'),
  toRef(props, 'chartType'),
  computed(() => props.chartStyle as ChartStyle),
  isExcess,
  toRef(props, 'standardPopulation'),
  computed(() => props.countries.length),
  toRef(props, 'showBaseline'),
  toRef(props, 'cumulative'),
  toRef(props, 'baselineMethod')
)

// Options imported from @/model
// Add 'label' property for USelect compatibility
const chartStylesWithLabels = chartStyles.map(t => ({ ...t, label: t.name }))

// Feature gate: Show all baseline methods but disable advanced ones for non-registered users
const baselineMethodsWithLabels = computed(() => {
  const hasAccess = can('ALL_BASELINES')
  return baselineMethods.map((t) => {
    const isBasicMethod = t.value === 'naive' || t.value === 'mean' || t.value === 'median'
    return {
      ...t,
      label: t.name,
      disabled: !hasAccess && !isBasicMethod
    }
  })
})

const decimalPrecisionsWithLabels = decimalPrecisions.map(t => ({ ...t, label: t.name }))

// Computed v-models - now using primitive values directly
const selectedType = computed({
  get: () => props.type,
  set: (v: string) => emit('typeChanged', v)
})

const selectedChartType = computed({
  get: () => props.chartType,
  set: (v: string) => emit('chartTypeChanged', v)
})

const selectedChartStyle = computed({
  get: () => props.chartStyle,
  set: (v: string) => emit('chartStyleChanged', v)
})

const selectedStandardPopulation = computed({
  get: () => props.standardPopulation,
  set: (v: string) => emit('standardPopulationChanged', v)
})

const selectedBaselineMethod = computed({
  get: () => props.baselineMethod,
  set: (v: string) => emit('baselineMethodChanged', v)
})

const view = computed({
  get: () => props.view,
  set: (v: ViewType) => emit('viewChanged', v)
})

const showBaseline = computed({
  get: () => props.showBaseline,
  set: (v: boolean) => emit('showBaselineChanged', v)
})

const showPredictionInterval = computed({
  get: () => props.showPredictionInterval,
  set: (v: boolean) => emit('showPredictionIntervalChanged', v)
})

const showLabels = computed({
  get: () => props.showLabels,
  set: (v: boolean) => emit('showLabelsChanged', v)
})

const maximize = computed({
  get: () => props.maximize,
  set: (v: boolean) => emit('maximizeChanged', v)
})

const showLogarithmic = computed({
  get: () => props.showLogarithmic,
  set: (v: boolean) => emit('showLogarithmicChanged', v)
})

const showPercentage = computed({
  get: () => props.showPercentage || false,
  set: (v: boolean) => emit('showPercentageChanged', v)
})

const cumulative = computed({
  get: () => props.cumulative,
  set: (v: boolean) => emit('cumulativeChanged', v)
})

const showTotal = computed({
  get: () => props.showTotal,
  set: (v: boolean) => emit('showTotalChanged', v)
})

const _sliderStart = computed({
  get: () => props.sliderStart,
  set: (v: string) => emit('sliderStartChanged', v)
})

const chartPreset = computed({
  get: () => props.chartPreset,
  set: (v: string | undefined) => {
    if (v) emit('chartPresetChanged', v)
  }
})

const showLogo = computed({
  get: () => props.showLogo,
  set: (v: boolean) => emit('showLogoChanged', v)
})

const showQrCode = computed({
  get: () => props.showQrCode,
  set: (v: boolean) => emit('showQrCodeChanged', v)
})

const showCaption = computed({
  get: () => props.showCaption,
  set: (v: boolean) => emit('showCaptionChanged', v)
})

const selectedDecimals = computed({
  get: () => props.decimals,
  set: (v: string) => emit('decimalsChanged', v)
})

const baselineSliderChanged = (values: string[]) => {
  emit('baselineSliderValueChanged', values)
}
// Use configuration-based baseline option visibility (kept for backward compatibility)
const showBaselineOption = chartUIState.showBaselineOption

// Chart presets for dropdown
const chartPresetOptions = CHART_PRESETS.map(preset => ({
  name: preset.name,
  value: preset.name,
  label: preset.name,
  category: preset.category
}))

// Tab management
const activeTab = ref('data')
</script>

<template>
  <div class="w-full">
    <!-- Custom tab header -->
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'data'
            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
            : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
        @click="activeTab = 'data'"
      >
        Data & Analysis
      </button>
      <button
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'display'
            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
            : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
        @click="activeTab = 'display'"
      >
        Display
      </button>
      <button
        v-if="props.showBaseline"
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'baseline'
            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
            : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
        @click="activeTab = 'baseline'"
      >
        Baseline
      </button>
      <button
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'style'
            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
            : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
        @click="activeTab = 'style'"
      >
        Style
      </button>
    </div>

    <!-- Tab content panels -->
    <div class="mt-4">
      <!-- Data Tab -->
      <DataTab
        v-if="activeTab === 'data'"
        :selected-type="selectedType"
        :selected-chart-type="selectedChartType"
        :selected-standard-population="selectedStandardPopulation"
        :view="props.view"
        :is-updating="props.isUpdating"
        :is-population-type="props.isPopulationType"
        :show-standard-population="chartUIState.showStandardPopulation.value"
        @update:selected-type="selectedType = $event"
        @update:selected-chart-type="selectedChartType = $event"
        @update:selected-standard-population="selectedStandardPopulation = $event"
        @update:view="view = $event"
      />

      <!-- Display Tab -->
      <DisplayTab
        v-if="activeTab === 'display'"
        :show-baseline="props.showBaseline"
        :show-prediction-interval="props.showPredictionInterval"
        :maximize="props.maximize"
        :show-logarithmic="props.showLogarithmic"
        :show-percentage="props.showPercentage || false"
        :cumulative="props.cumulative"
        :show-total="props.showTotal"
        :is-population-type="props.isPopulationType"
        :show-baseline-option="showBaselineOption"
        :show-prediction-interval-option-disabled="props.showPredictionIntervalOptionDisabled"
        :show-maximize-option-disabled="props.showMaximizeOptionDisabled"
        :show-total-option-disabled="props.showTotalOptionDisabled"
        :show-prediction-interval-option="props.showPredictionIntervalOption"
        :show-maximize-option="props.showMaximizeOption"
        :show-logarithmic-option="props.showLogarithmicOption"
        :show-percentage-option="props.showPercentageOption"
        :show-cumulative-option="props.showCumulativeOption"
        :show-total-option="props.showTotalOption"
        :chart-preset="chartPreset"
        :chart-preset-options="chartPresetOptions"
        @update:show-baseline="showBaseline = $event"
        @update:show-prediction-interval="showPredictionInterval = $event"
        @update:maximize="maximize = $event"
        @update:show-logarithmic="showLogarithmic = $event"
        @update:show-percentage="showPercentage = $event"
        @update:cumulative="cumulative = $event"
        @update:show-total="showTotal = $event"
        @update:chart-preset="chartPreset = $event"
      />

      <!-- Baseline Tab -->
      <BaselineTab
        v-if="activeTab === 'baseline'"
        :selected-baseline-method="selectedBaselineMethod"
        :baseline-methods-with-labels="baselineMethodsWithLabels"
        :baseline-method="props.baselineMethod"
        :baseline-slider-value="props.baselineSliderValue"
        :labels="props.labels"
        :chart-type="props.chartType"
        :is-updating="props.isUpdating"
        @update:selected-baseline-method="selectedBaselineMethod = $event"
        @baseline-slider-changed="baselineSliderChanged"
      />

      <!-- Style Tab -->
      <StyleTab
        v-if="activeTab === 'style'"
        :selected-chart-style="selectedChartStyle"
        :chart-styles-with-labels="chartStylesWithLabels"
        :selected-decimals="selectedDecimals"
        :decimal-precisions-with-labels="decimalPrecisionsWithLabels"
        :colors="props.colors"
        :is-matrix-chart-style="props.isMatrixChartStyle"
        :is-updating="props.isUpdating"
        :show-labels="showLabels"
        :show-caption="showCaption"
        :show-logo="showLogo"
        :show-qr-code="showQrCode"
        @update:selected-chart-style="selectedChartStyle = $event"
        @update:selected-decimals="selectedDecimals = $event"
        @colors-changed="(val) => emit('userColorsChanged', val)"
        @update:show-labels="showLabels = $event"
        @update:show-caption="showCaption = $event"
        @update:show-logo="showLogo = $event"
        @update:show-qr-code="showQrCode = $event"
      />
    </div>
  </div>
</template>
