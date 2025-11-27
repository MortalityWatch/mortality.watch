<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import DataTab from './controls/DataTab.vue'
import DisplayTab from './controls/DisplayTab.vue'
import BaselineTab from './controls/BaselineTab.vue'
import StyleTab from './controls/StyleTab.vue'
import { CHART_PRESETS } from '@/lib/constants'
import { types, chartTypes, chartStyles, standardPopulations, baselineMethods, decimalPrecisions } from '@/model'
import { useChartUIState } from '@/composables/useChartUIState'
import type { ChartStyle } from '@/lib/chart/chartTypes'
import type { ViewType } from '@/lib/state/viewTypes'

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
// Add 'label' property for USelectMenu compatibility
const typesWithLabels = types.map(t => ({ ...t, label: t.name }))
const chartTypesWithLabels = chartTypes.map(t => ({ ...t, label: t.name }))
const chartStylesWithLabels = chartStyles.map(t => ({ ...t, label: t.name }))
const standardPopulationsWithLabels = standardPopulations.map(t => ({ ...t, label: t.name }))

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

// Computed v-models
const selectedType = computed({
  get: () => typesWithLabels.find(t => t.value === props.type) || typesWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('typeChanged', v.value)
})

const selectedChartType = computed({
  get: () => chartTypesWithLabels.find(t => t.value === props.chartType) || chartTypesWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('chartTypeChanged', v.value)
})

const selectedChartStyle = computed({
  get: () => chartStylesWithLabels.find(t => t.value === props.chartStyle) || chartStylesWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('chartStyleChanged', v.value)
})

const selectedStandardPopulation = computed({
  get: () => standardPopulationsWithLabels.find(t => t.value === props.standardPopulation) || standardPopulationsWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('standardPopulationChanged', v.value)
})

type BaselineMethodItem = { name: string, value: string, label: string, disabled?: boolean }
const selectedBaselineMethod = computed({
  get: (): BaselineMethodItem => (baselineMethodsWithLabels.value.find(t => t.value === props.baselineMethod) || baselineMethodsWithLabels.value[0]) as BaselineMethodItem,
  set: (v: BaselineMethodItem) => emit('baselineMethodChanged', v.value)
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
  get: () => {
    if (!props.chartPreset) return undefined

    // First try exact match
    let preset = chartPresetOptions.find(p => p.value === props.chartPreset)

    // If no match, check if it's in dimensional format (e.g., "1000x625")
    if (!preset) {
      const match = props.chartPreset.match(/^(\d+)x(\d+)$/)
      if (match && match[1] && match[2]) {
        const width = parseInt(match[1])
        const height = parseInt(match[2])
        // Find preset by dimensions from CHART_PRESETS
        const dimensionPreset = CHART_PRESETS.find(p => p.width === width && p.height === height)
        if (dimensionPreset) {
          preset = chartPresetOptions.find(p => p.value === dimensionPreset.name)
        }
      }
    }

    return preset
  },
  set: (v: { name: string, value: string, label: string, category: string } | undefined) => {
    if (v) emit('chartPresetChanged', v.value)
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
  get: () => decimalPrecisionsWithLabels.find(t => t.value === props.decimals) || decimalPrecisionsWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('decimalsChanged', v.value)
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
        :selected-type="selectedType as { name: string, value: string, label: string }"
        :selected-chart-type="selectedChartType as { name: string, value: string, label: string }"
        :selected-standard-population="selectedStandardPopulation as { name: string, value: string, label: string }"
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
        @update:is-logarithmic="showLogarithmic = $event"
        @update:show-percentage="showPercentage = $event"
        @update:cumulative="cumulative = $event"
        @update:show-total="showTotal = $event"
        @update:chart-preset="chartPreset = $event"
      />

      <!-- Baseline Tab -->
      <BaselineTab
        v-if="activeTab === 'baseline'"
        :selected-baseline-method="selectedBaselineMethod as { name: string, value: string, label: string }"
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
        :selected-chart-style="selectedChartStyle as { name: string, value: string, label: string }"
        :chart-styles-with-labels="chartStylesWithLabels"
        :selected-decimals="selectedDecimals as { name: string, value: string, label: string }"
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
