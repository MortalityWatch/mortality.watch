<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import DateSlider from './DateSlider.vue'
import MultiColorPicker from './MultiColorPicker.vue'
import { specialColor } from '@/colors'
import { CHART_PRESETS } from '@/lib/constants'
import { types, chartTypes, chartStyles, standardPopulations, baselineMethods, decimalPrecisions } from '@/model'
import { useChartUIState } from '@/composables/useChartUIState'
import type { ChartStyle } from '@/lib/chart/chartTypes'

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
  isExcess: boolean
  baselineMethod: string
  baselineSliderValue: string[]
  showBaseline: boolean
  showPredictionInterval: boolean
  showPredictionIntervalDisabled: boolean
  showLabels: boolean
  maximize: boolean
  isLogarithmic: boolean
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
  decimals: string
}>()

// Emits
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
  userColorsChanged: [value: string[]]
  sliderStartChanged: [value: string]
  chartPresetChanged: [value: string]
  showLogoChanged: [value: boolean]
  showQrCodeChanged: [value: boolean]
  decimalsChanged: [value: string]
}>()

// Initialize chart UI state configuration
const chartUIState = useChartUIState(
  toRef(props, 'type'),
  toRef(props, 'chartType'),
  computed(() => props.chartStyle as ChartStyle),
  toRef(props, 'isExcess'),
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
const baselineMethodsWithLabels = baselineMethods.map(t => ({ ...t, label: t.name }))
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

const selectedBaselineMethod = computed({
  get: () => baselineMethodsWithLabels.find(t => t.value === props.baselineMethod) || baselineMethodsWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('baselineMethodChanged', v.value)
})

const isExcess = computed({
  get: () => props.isExcess,
  set: (v: boolean) => emit('isExcessChanged', v)
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

const isLogarithmic = computed({
  get: () => props.isLogarithmic,
  set: (v: boolean) => emit('isLogarithmicChanged', v)
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
      if (match) {
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

const selectedDecimals = computed({
  get: () => decimalPrecisionsWithLabels.find(t => t.value === props.decimals) || decimalPrecisionsWithLabels[0],
  set: (v: { name: string, value: string, label: string }) => emit('decimalsChanged', v.value)
})

const baselineSliderChanged = (values: string[]) => emit('baselineSliderValueChanged', values)
// Use configuration-based baseline option visibility (kept for backward compatibility)
const showBaselineOption = chartUIState.showBaselineOption

const baselineMinRange = (method: string) => method === 'mean' ? 0 : 2

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
        Data
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
      <div v-if="activeTab === 'data'">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Metric</label>
            <USelectMenu
              v-model="selectedType"
              :items="typesWithLabels"
              placeholder="Select the metric"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Metric information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    <strong>CMR:</strong> Crude Mortality Rate per 100k<br>
                    <strong>ASMR:</strong> Age-Standardized Mortality Rate per 100k<br>
                    <strong>Life Expectancy:</strong> Expected years of life at birth<br>
                    <strong>Deaths:</strong> Total death counts<br>
                    <strong>Population:</strong> Total population size
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Period of Time</label>
            <USelectMenu
              v-model="selectedChartType"
              :items="chartTypesWithLabels"
              placeholder="Select the period of time"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
          </div>

          <div
            v-if="chartUIState.showStandardPopulation.value"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Standard Population</label>
            <USelectMenu
              v-model="selectedStandardPopulation"
              :items="standardPopulationsWithLabels"
              placeholder="Select the standard population"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Standard population information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    Reference population used to standardize mortality rates by age structure. Enables fair comparisons across countries and time periods.
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>

      <!-- Display Tab -->
      <div v-if="activeTab === 'display'">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Excess</label>
            <USwitch
              v-model="isExcess"
              :disabled="props.isPopulationType"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Excess mortality information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    Compares observed mortality to expected baseline. Positive values indicate more deaths than expected, negative values indicate fewer deaths.
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Baseline</label>
            <USwitch
              v-model="showBaseline"
              :disabled="!showBaselineOption"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Baseline information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    Shows the expected mortality level used for comparison. Configure baseline period and method in the Baseline tab.
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div
            v-if="props.showPredictionIntervalOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">95% PI</label>
            <USwitch
              v-model="showPredictionInterval"
              :disabled="props.showPredictionIntervalOptionDisabled"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Prediction interval information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    95% Prediction Interval shows the range of uncertainty around expected values. Values outside this range are statistically significant.
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Show Labels</label>
            <USwitch v-model="showLabels" />
          </div>

          <div
            v-if="props.showMaximizeOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Maximize</label>
            <USwitch
              v-model="maximize"
              :disabled="props.showMaximizeOptionDisabled"
            />
          </div>

          <div
            v-if="props.showLogarithmicOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Log Scale</label>
            <USwitch
              v-model="isLogarithmic"
              :disabled="!props.showLogarithmicOption"
            />
          </div>

          <div
            v-if="props.showPercentageOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Percentage</label>
            <USwitch v-model="showPercentage" />
          </div>

          <div
            v-if="props.showCumulativeOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Cumulative</label>
            <USwitch v-model="cumulative" />
          </div>

          <div
            v-if="props.showTotalOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Total</label>
            <USwitch
              v-model="showTotal"
              :disabled="props.showTotalOptionDisabled"
            />
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Show Logo</label>
            <USwitch v-model="showLogo" />
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Show QR Code</label>
            <USwitch v-model="showQrCode" />
          </div>
        </div>

        <!-- Chart Options Section -->
        <div class="mt-6 flex flex-col gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Chart Size</label>
            <USelectMenu
              v-model="chartPreset"
              :items="chartPresetOptions"
              placeholder="Select a size"
              size="sm"
              class="flex-1"
            />
          </div>
        </div>
      </div>

      <!-- Baseline Tab -->
      <div v-if="activeTab === 'baseline'">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Method</label>
            <USelectMenu
              v-model="selectedBaselineMethod"
              :items="baselineMethodsWithLabels"
              placeholder="Select Baseline Method"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
            <UPopover>
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Baseline method information"
              />
              <template #content>
                <div class="p-3 space-y-2 max-w-xs">
                  <div class="text-xs text-gray-700 dark:text-gray-300">
                    <strong>Last Value:</strong> Uses the final value from baseline period<br>
                    <strong>Average:</strong> Mean of baseline period<br>
                    <strong>Linear Regression:</strong> Linear trend projection<br>
                    <strong>Exponential Smoothing (ETS):</strong> Adaptive trend and seasonality
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <div
            v-if="selectedBaselineMethod"
            class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium">Period</label>
            <div class="mt-2">
              <DateSlider
                :slider-value="props.baselineSliderValue"
                :labels="props.labels"
                :color="specialColor()"
                :min-range="baselineMinRange(props.baselineMethod)"
                :single-value="props.baselineMethod === 'naive'"
                @slider-changed="baselineSliderChanged"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Style Tab -->
      <div v-if="activeTab === 'style'">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Chart Type</label>
            <USelectMenu
              v-model="selectedChartStyle"
              :items="chartStylesWithLabels"
              placeholder="Select the chart type"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Number Precision</label>
            <USelectMenu
              v-model="selectedDecimals"
              :items="decimalPrecisionsWithLabels"
              placeholder="Select decimal precision"
              :disabled="props.isUpdating"
              size="sm"
              class="flex-1"
            />
          </div>

          <div
            v-if="!props.isMatrixChartStyle"
            class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="block mb-2 text-sm font-medium">Colors</label>
            <div class="overflow-x-auto">
              <MultiColorPicker
                :colors="props.colors || []"
                @colors-changed="(val) => emit('userColorsChanged', val)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
