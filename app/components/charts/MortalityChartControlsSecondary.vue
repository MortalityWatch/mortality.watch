<script setup lang="ts">
import {
  chartStyles,
  chartTypes,
  types,
  standardPopulations,
  type ListType,
  baselineMethods
} from '@/model'
import { computed } from 'vue'
import DateSlider from './DateSlider.vue'
import { specialColor } from '@/colors'
import { baselineMinRange } from '@/chart'
import MultiColorPicker from './MultiColorPicker.vue'
import { ToggleSwitch, Select, IftaLabel } from 'primevue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

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
  get: () => types.filter(v => v.value === props.type)[0],
  set: (v: ListType) => emit('typeChanged', v.value)
})
const selectedChartType = computed({
  get: () => chartTypes.filter(v => v.value === props.chartType)[0],
  set: (v: ListType) => emit('chartTypeChanged', v.value)
})
const selectedChartStyle = computed({
  get: () => chartStyles.filter(v => v.value === props.chartStyle)[0],
  set: (v: ListType) => emit('chartStyleChanged', v.value)
})
const selectedStandardPopulation = computed({
  get: () =>
    standardPopulations.filter(v => v.value === props.standardPopulation)[0],
  set: (v: ListType) => emit('standardPopulationChanged', v.value)
})
const selectedBaselineMethod = computed({
  get: () => baselineMethodEntry(),
  set: (v: ListType) => emit('baselineMethodChanged', v.value)
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

const baselineMethodEntry = (): ListType =>
  baselineMethods.filter(v => v.value === props.baselineMethod)[0]
const baselineSliderChanged = () => emit('baselineSliderValueChanged')
const showBaselineOption = computed(
  () => !props.isPopulationType && !props.isExcess
)
</script>

<template>
  <Tabs
    value="0"
    class="secondary-controls-tabs"
  >
    <TabList>
      <Tab value="0">
        Data
      </Tab>
      <Tab value="1">
        Display
      </Tab>
      <Tab
        v-if="props.showBaseline"
        value="2"
      >
        Baseline
      </Tab>
      <Tab value="3">
        Style
      </Tab>
    </TabList>
    <TabPanels>
      <!-- Data Tab: Chart configuration and data selection -->
      <TabPanel value="0">
        <div class="flex flex-col gap-4">
          <IftaLabel class="w-full">
            <Select
              v-model="selectedType"
              :options="types"
              option-label="name"
              placeholder="Select the metric"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="country">Metric</label>
          </IftaLabel>

          <IftaLabel class="w-full">
            <Select
              v-model="selectedChartType"
              :options="chartTypes"
              option-label="name"
              placeholder="Select the period of time"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="chartType">Period of Time</label>
          </IftaLabel>

          <IftaLabel class="w-full">
            <Select
              v-model="sliderStart"
              :options="props.allYearlyChartLabelsUnique"
              placeholder="Select the start period"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="startingPeriod">Start Period</label>
          </IftaLabel>

          <IftaLabel
            v-if="props.type.includes('asmr') || props.type === 'le'"
            class="w-full"
          >
            <Select
              v-model="selectedStandardPopulation"
              :options="standardPopulations"
              option-label="name"
              placeholder="Select the standard population"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="standardPopulation">Standard Population</label>
          </IftaLabel>
        </div>
      </TabPanel>

      <!-- Display Tab: Toggle options for what to show -->
      <TabPanel value="1">
        <div class="flex flex-wrap items-start gap-4">
          <div
            :disabled="props.isPopulationType"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="isExcess"
              input-id="isExcessToggle"
            />
            <label
              for="isExcessToggle"
              class="mb-0"
            >Excess</label>
          </div>
          <div
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="showBaseline"
              input-id="toggle-showBaseline"
              :disabled="showBaselineOption"
            />
            <label
              for="toggle-showBaseline"
              class="mb-0"
            >Baseline</label>
          </div>

          <div
            v-show="props.showPredictionIntervalOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="showPredictionInterval"
              :disabled="props.showPredictionIntervalOptionDisabled"
              input-id="toggle-showPredictionInterval"
            />
            <label
              for="toggle-showPredictionInterval"
              class="mb-0"
            >95% PI</label>
          </div>

          <div
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="showLabels"
              input-id="toggle-showLabels"
            />
            <label
              for="toggle-showLabels"
              class="mb-0"
            >Show Labels</label>
          </div>

          <div
            v-show="props.showMaximizeOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="maximize"
              :disabled="props.showMaximizeOptionDisabled"
              input-id="toggle-maximize"
            />
            <label
              for="toggle-maximize"
              class="mb-0"
            >Maximize</label>
          </div>

          <div
            v-show="props.showLogarithmicOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="isLogarithmic"
              :disabled="!props.showLogarithmicOption"
              input-id="toggle-isLogarithmic"
            />
            <label
              for="toggle-isLogarithmic"
              class="mb-0"
            >Log Scale</label>
          </div>

          <div
            v-show="props.showPercentageOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="showPercentage"
              input-id="toggle-showPercentage"
            />
            <label
              for="toggle-showPercentage"
              class="mb-0"
            >Percentage</label>
          </div>
          <div
            v-show="props.showCumulativeOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="cumulative"
              input-id="toggle-cumulative"
            />
            <label
              for="toggle-cumulative"
              class="mb-0"
            >Cumulative</label>
          </div>
          <div
            v-show="props.showTotalOption"
            class="border-1 flex items-center gap-2 rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <ToggleSwitch
              v-model="showTotal"
              :disabled="props.showTotalOptionDisabled"
              input-id="toggle-showTotal"
            />
            <label
              for="toggle-showTotal"
              class="mb-0"
            >Total</label>
          </div>
        </div>
      </TabPanel>

      <!-- Baseline Tab: Baseline configuration (conditional) -->
      <TabPanel
        v-if="props.showBaseline"
        value="2"
      >
        <div class="flex flex-col gap-4">
          <IftaLabel class="w-full">
            <Select
              v-model="selectedBaselineMethod"
              :options="baselineMethods"
              option-label="name"
              placeholder="Select Baseline Method"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="baselineMethod">Baseline Method</label>
          </IftaLabel>

          <div
            v-if="selectedBaselineMethod.value != 'auto'"
            class="border-1 w-full rounded border-slate-300 p-4 pb-7 pl-7 pr-7 pt-10 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
          >
            <span
              class="relative -left-4 -top-8 float-left text-xs text-slate-500 dark:text-zinc-400"
            >Baseline Period</span>
            <DateSlider
              :slider-value="props.baselineSliderValue"
              :labels="props.labels"
              :color="specialColor()"
              :min-range="baselineMinRange(props.baselineMethod)"
              @slider-changed="baselineSliderChanged"
            />
          </div>
        </div>
      </TabPanel>

      <!-- Style Tab: Chart appearance and colors -->
      <TabPanel value="3">
        <div class="flex flex-col gap-4">
          <IftaLabel class="w-full">
            <Select
              v-model="selectedChartStyle"
              :options="chartStyles"
              option-label="name"
              placeholder="Select the chart type"
              class="w-full"
              :disabled="props.isUpdating"
            />
            <label for="chartStyle">Chart Type</label>
          </IftaLabel>

          <div
            v-if="!props.isMatrixChartStyle"
            class="border-1 flex flex-col rounded border-slate-300 p-4 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:border-zinc-500"
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
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<style scoped>
/* Override tab styles to match the card's rounded-lg (0.5rem) */
.secondary-controls-tabs :deep(.p-tablist) {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.secondary-controls-tabs :deep(.p-tab) {
  @apply px-4 py-2 font-medium;
  border-radius: 0.5rem 0.5rem 0 0; /* Match rounded-lg radius */
}

.secondary-controls-tabs :deep(.p-tab[data-p-active="true"]) {
  border-radius: 0.5rem 0.5rem 0 0; /* Ensure active tab also has matching radius */
}

.secondary-controls-tabs :deep(.p-tab:first-child) {
  border-top-left-radius: 0.5rem; /* Match card's top-left radius */
}

.secondary-controls-tabs :deep(.p-tabpanel) {
  @apply pt-4;
}

/* Ensure the tabs component itself doesn't add conflicting radius */
.secondary-controls-tabs {
  border-radius: 0;
}
</style>
