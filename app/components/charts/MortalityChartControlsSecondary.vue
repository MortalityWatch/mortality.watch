<script setup lang="ts">
import {
  chartStyles,
  chartTypes,
  types,
  standardPopulations,
  baselineMethods,
  type ListType
} from '@/model'
import { computed, ref } from 'vue'
import DateSlider from './DateSlider.vue'
import { specialColor } from '@/colors'
import { baselineMinRange } from '@/chart'
import MultiColorPicker from './MultiColorPicker.vue'

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
  colors: string[] | undefined
  sliderStart: string
}>()

const emit = defineEmits([
  'typeChanged',
  'chartTypeChanged',
  'chartStyleChanged',
  'standardPopulationChanged',
  'isExcessChanged',
  'baselineMethodChanged',
  'baselineSliderValueChanged',
  'showBaselineChanged',
  'showPredictionIntervalChanged',
  'showLabelsChanged',
  'maximizeChanged',
  'isLogarithmicChanged',
  'showPercentageChanged',
  'cumulativeChanged',
  'showTotalChanged',
  'userColorsChanged',
  'sliderStartChanged'
])

// Computed
const selectedType = computed({
  get: () => types.find(t => t.value === props.type) || types[0],
  set: (v: string | ListType) => emit('typeChanged', typeof v === 'string' ? v : v.value)
})
const selectedChartType = computed({
  get: () => chartTypes.find(t => t.value === props.chartType) || chartTypes[0],
  set: (v: string | ListType) => emit('chartTypeChanged', typeof v === 'string' ? v : v.value)
})
const selectedChartStyle = computed({
  get: () => chartStyles.find(t => t.value === props.chartStyle) || chartStyles[0],
  set: (v: string | ListType) => emit('chartStyleChanged', typeof v === 'string' ? v : v.value)
})
const selectedStandardPopulation = computed({
  get: () => standardPopulations.find(t => t.value === props.standardPopulation) || standardPopulations[0],
  set: (v: string | ListType) => emit('standardPopulationChanged', typeof v === 'string' ? v : v.value)
})
const selectedBaselineMethod = computed({
  get: () => baselineMethods.find(t => t.value === props.baselineMethod) || baselineMethods[0],
  set: (v: string | ListType) => emit('baselineMethodChanged', typeof v === 'string' ? v : v.value)
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
  get: () => props.showPercentage,
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
const sliderStart = computed({
  get: () => props.sliderStart,
  set: (v: boolean) => emit('sliderStartChanged', v)
})

const baselineSliderChanged = () => emit('baselineSliderValueChanged')
const showBaselineOption = computed(
  () => !props.isPopulationType && !props.isExcess
)

// Tab management
const selectedTab = ref(0)
const tabItems = computed(() => {
  const items = [
    {
      key: 'data',
      label: 'Data',
      content: 'Data'
    },
    {
      key: 'display',
      label: 'Display',
      content: 'Display'
    }
  ]
  if (props.showBaseline) {
    items.push({
      key: 'baseline',
      label: 'Baseline',
      content: 'Baseline'
    })
  }
  items.push({
    key: 'style',
    label: 'Style',
    content: 'Style'
  })
  return items
})
</script>

<template>
  <UTabs
    v-model="selectedTab"
    :items="tabItems"
    class="w-full"
  >
    <template
      v-for="item in tabItems"
      :key="item.key"
      #[item.key]
    >
      <!-- Data Tab: Chart configuration and data selection -->
      <div
        v-if="item.key === 'data'"
        class="pt-4"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Metric</label>
            <USelectMenu
              v-model="selectedType"
              :items="types"
              placeholder="Select the metric"
              :disabled="props.isUpdating"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Period of Time</label>
            <USelectMenu
              v-model="selectedChartType"
              :items="chartTypes"
              placeholder="Select the period of time"
              :disabled="props.isUpdating"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Start Period</label>
            <USelectMenu
              v-model="sliderStart"
              :items="props.allYearlyChartLabelsUnique"
              placeholder="Select the start period"
              :disabled="props.isUpdating"
            />
          </div>

          <div v-if="props.type.includes('asmr') || props.type === 'le'">
            <label class="block text-sm font-medium mb-2">Standard Population</label>
            <USelectMenu
              v-model="selectedStandardPopulation"
              :items="standardPopulations"
              placeholder="Select the standard population"
              :disabled="props.isUpdating"
            />
          </div>
        </div>
      </div>

      <!-- Display Tab: Toggle options for what to show -->
      <div
        v-else-if="item.key === 'display'"
        class="pt-4"
      >
        <div class="flex flex-wrap items-start gap-3">
          <div class="flex items-center gap-2">
            <USwitch
              v-model="isExcess"
              :disabled="props.isPopulationType"
            />
            <label class="text-sm">Excess</label>
          </div>
          <div class="flex items-center gap-2">
            <USwitch
              v-model="showBaseline"
              :disabled="showBaselineOption"
            />
            <label class="text-sm">Baseline</label>
          </div>

          <div
            v-if="props.showPredictionIntervalOption"
            class="flex items-center gap-2"
          >
            <USwitch
              v-model="showPredictionInterval"
              :disabled="props.showPredictionIntervalOptionDisabled"
            />
            <label class="text-sm">95% PI</label>
          </div>

          <div class="flex items-center gap-2">
            <USwitch v-model="showLabels" />
            <label class="text-sm">Show Labels</label>
          </div>

          <div
            v-if="props.showMaximizeOption"
            class="flex items-center gap-2"
          >
            <USwitch
              v-model="maximize"
              :disabled="props.showMaximizeOptionDisabled"
            />
            <label class="text-sm">Maximize</label>
          </div>

          <div
            v-if="props.showLogarithmicOption"
            class="flex items-center gap-2"
          >
            <USwitch
              v-model="isLogarithmic"
              :disabled="!props.showLogarithmicOption"
            />
            <label class="text-sm">Log Scale</label>
          </div>

          <div
            v-if="props.showPercentageOption"
            class="flex items-center gap-2"
          >
            <USwitch v-model="showPercentage" />
            <label class="text-sm">Percentage</label>
          </div>
          <div
            v-if="props.showCumulativeOption"
            class="flex items-center gap-2"
          >
            <USwitch v-model="cumulative" />
            <label class="text-sm">Cumulative</label>
          </div>
          <div
            v-if="props.showTotalOption"
            class="flex items-center gap-2"
          >
            <USwitch
              v-model="showTotal"
              :disabled="props.showTotalOptionDisabled"
            />
            <label class="text-sm">Total</label>
          </div>
        </div>
      </div>

      <!-- Baseline Tab: Baseline configuration (conditional) -->
      <div
        v-else-if="item.key === 'baseline'"
        class="pt-4"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Baseline Method</label>
            <USelectMenu
              v-model="selectedBaselineMethod"
              :items="baselineMethods"
              placeholder="Select Baseline Method"
              :disabled="props.isUpdating"
            />
          </div>

          <div
            v-if="selectedBaselineMethod?.value != 'auto'"
            class="border rounded-lg border-gray-300 dark:border-gray-600 p-3 pb-2 hover:border-gray-400 dark:hover:border-gray-500 relative bg-white dark:bg-gray-800"
          >
            <span
              class="absolute -top-2 left-3 bg-white dark:bg-gray-800 px-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Baseline Period
            </span>
            <DateSlider
              :slider-value="props.baselineSliderValue"
              :labels="props.labels"
              :color="specialColor()"
              :min-range="baselineMinRange(props.baselineMethod)"
              @slider-changed="baselineSliderChanged"
            />
          </div>
        </div>
      </div>

      <!-- Style Tab: Chart appearance and colors -->
      <div
        v-else-if="item.key === 'style'"
        class="pt-4"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Chart Type</label>
            <USelectMenu
              v-model="selectedChartStyle"
              :items="chartStyles"
              placeholder="Select the chart type"
              :disabled="props.isUpdating"
            />
          </div>

          <div
            v-if="!props.isMatrixChartStyle"
            class="border rounded-lg border-gray-300 dark:border-gray-600 p-4 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
          >
            <label class="mb-2 text-sm font-medium">Colors</label>
            <div class="overflow-x-auto">
              <MultiColorPicker
                :colors="props.colors || []"
                @colors-changed="(val) => emit('userColorsChanged', val)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UTabs>
</template>

<style scoped>
</style>
