<script setup lang="ts">
import { ref, computed, toRef, nextTick, watch } from 'vue'
import { standardPopulationItems, baselineMethodItems, decimalPrecisionItems } from '@/model'
import type { ChartType } from '@/model/period'
import type { MetricType, DisplayMode } from '@/model/rankingSchema'
import BaselineMethodPicker from '@/components/shared/BaselineMethodPicker.vue'
import BaselinePeriodPicker from '@/components/shared/BaselinePeriodPicker.vue'
import { useRankingUIState } from '@/composables/useRankingUIState'
import { getMetricTypeItems } from '@/lib/config/rankingConfig'

// Props
interface Props {
  metricType: MetricType
  displayMode: DisplayMode
  selectedStandardPopulation: string
  showTotals: boolean
  showTotalsOnly: boolean
  hideIncomplete: boolean
  showPercentage: boolean
  cumulative: boolean
  showPI: boolean
  selectedBaselineMethod: string
  selectedDecimalPrecision: string
  isUpdating: boolean
  allLabels: string[]
  baselineSliderValue: string[]
  baselineSliderValues: () => string[]
  greenColor: () => string
  chartType: ChartType
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:metricType': [value: MetricType]
  'update:displayMode': [value: DisplayMode]
  'update:selectedStandardPopulation': [value: string]
  'update:showTotals': [value: boolean]
  'update:showTotalsOnly': [value: boolean]
  'update:hideIncomplete': [value: boolean]
  'update:showPercentage': [value: boolean]
  'update:cumulative': [value: boolean]
  'update:showPI': [value: boolean]
  'update:selectedBaselineMethod': [value: string]
  'update:selectedDecimalPrecision': [value: string]
  'baselineSliderChanged': [value: string[]]
}>()

// Metric type items for dropdown
const metricTypeItems = getMetricTypeItems()

// Track percentage state before switching to raw mode so we can restore it
const savedPercentageState = ref<boolean | null>(null)

// Handle display mode toggle - manage percentage state appropriately
const handleDisplayModeToggle = (isExcess: boolean) => {
  const newMode: DisplayMode = isExcess ? 'relative' : 'absolute'
  // Set pending state immediately for optimistic UI update
  pendingDisplayMode.value = newMode
  // Emit to parent (URL update is async)
  emit('update:displayMode', newMode)

  if (!isExcess) {
    // Switching to raw mode: save and turn off percentage
    savedPercentageState.value = props.showPercentage
    if (props.showPercentage) {
      nextTick(() => {
        emit('update:showPercentage', false)
      })
    }
  } else {
    // Switching to excess mode: restore percentage if it was on before
    if (savedPercentageState.value === true) {
      nextTick(() => {
        emit('update:showPercentage', true)
      })
    }
    savedPercentageState.value = null
  }
}

// Local state for optimistic UI updates (fixes async URL update lag)
const pendingDisplayMode = ref<DisplayMode | null>(null)

// Local computed values that emit updates
const metricTypeLocal = computed({
  get: () => props.metricType,
  set: val => emit('update:metricType', val as MetricType)
})

const displayModeLocal = computed({
  get: () => pendingDisplayMode.value ?? props.displayMode,
  set: val => emit('update:displayMode', val as DisplayMode)
})

// Sync pending state with props when they update
watch(() => props.displayMode, () => {
  pendingDisplayMode.value = null
})

const selectedStandardPopulationLocal = computed({
  get: () => props.selectedStandardPopulation,
  set: val => emit('update:selectedStandardPopulation', val)
})

const showTotalsLocal = computed({
  get: () => props.showTotals,
  set: val => emit('update:showTotals', val)
})

const showTotalsOnlyLocal = computed({
  get: () => props.showTotalsOnly,
  set: val => emit('update:showTotalsOnly', val)
})

const hideIncompleteLocal = computed({
  get: () => props.hideIncomplete,
  set: val => emit('update:hideIncomplete', val)
})

const showPercentageLocal = computed({
  get: () => props.showPercentage,
  set: val => emit('update:showPercentage', val)
})

const cumulativeLocal = computed({
  get: () => props.cumulative,
  set: val => emit('update:cumulative', val)
})

const showPILocal = computed({
  get: () => props.showPI,
  set: val => emit('update:showPI', val)
})

const selectedBaselineMethodLocal = computed({
  get: () => props.selectedBaselineMethod,
  set: val => emit('update:selectedBaselineMethod', val)
})

const selectedDecimalPrecisionLocal = computed({
  get: () => props.selectedDecimalPrecision,
  set: val => emit('update:selectedDecimalPrecision', val)
})

// Initialize ranking UI state configuration
const rankingUIState = useRankingUIState(
  toRef(props, 'metricType'),
  toRef(props, 'displayMode'),
  toRef(props, 'showTotals'),
  toRef(props, 'cumulative'),
  toRef(props, 'showTotalsOnly')
)

// Tab state
const activeTab = ref('metric')
</script>

<template>
  <UCard data-tour="ranking-settings">
    <template #header>
      <h2 class="text-xl font-semibold">
        Settings
      </h2>
    </template>

    <!-- Tab Navigation -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
      <button
        :class="[
          'px-4 py-2 text-sm font-medium',
          activeTab === 'metric'
            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
            : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
        @click="activeTab = 'metric'"
      >
        Metric
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
        v-if="rankingUIState.showBaselineOptions.value"
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
    </div>

    <!-- Tab Content -->
    <!-- Metric Tab -->
    <div v-if="activeTab === 'metric'">
      <div class="flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label
            class="text-sm font-medium whitespace-nowrap"
            for="metricType"
          >
            Metric
          </label>
          <USelect
            id="metricType"
            v-model="metricTypeLocal"
            :items="metricTypeItems"
            value-key="value"
            size="sm"
            class="w-72"
          />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Excess</label>
          <USwitch
            :model-value="displayModeLocal === 'relative'"
            @update:model-value="handleDisplayModeToggle"
          />
        </div>

        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          :class="{ 'opacity-50 pointer-events-none': rankingUIState.standardPopulationDisabled.value }"
        >
          <label
            class="text-sm font-medium whitespace-nowrap"
            for="standardPopulation"
          >
            Standard Population
          </label>
          <USelect
            id="standardPopulation"
            v-model="selectedStandardPopulationLocal"
            :items="standardPopulationItems"
            value-key="value"
            placeholder="Select the standard population"
            size="sm"
            class="w-40"
          />
        </div>
      </div>
    </div>

    <!-- Display Tab -->
    <div v-if="activeTab === 'display'">
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Show Totals</label>
          <USwitch v-model="showTotalsLocal" />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Totals Only</label>
          <USwitch
            v-model="showTotalsOnlyLocal"
            :disabled="rankingUIState.totalsOnlyDisabled.value"
          />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Hide Incomplete</label>
          <USwitch v-model="hideIncompleteLocal" />
        </div>

        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          :class="{ 'opacity-50': rankingUIState.percentageDisabled.value }"
        >
          <label class="text-sm font-medium whitespace-nowrap">Percentage</label>
          <USwitch
            v-model="showPercentageLocal"
            :disabled="rankingUIState.percentageDisabled.value"
          />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Cumulative</label>
          <USwitch v-model="cumulativeLocal" />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Show 95% PI</label>
          <USwitch
            v-model="showPILocal"
            :disabled="rankingUIState.predictionIntervalDisabled.value"
          />
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label
            class="text-sm font-medium whitespace-nowrap"
            for="decimalPrecision"
          >
            Decimal Places
          </label>
          <USelect
            id="decimalPrecision"
            v-model="selectedDecimalPrecisionLocal"
            :items="decimalPrecisionItems"
            value-key="value"
            placeholder="Select Decimal Precision"
            size="sm"
            class="w-20"
          />
        </div>
      </div>
    </div>

    <!-- Baseline Tab (only shown in relative mode) -->
    <div v-if="activeTab === 'baseline' && rankingUIState.showBaselineOptions.value">
      <div class="flex flex-col gap-4">
        <BaselineMethodPicker
          v-model="selectedBaselineMethodLocal"
          :items="baselineMethodItems"
          :is-updating="isUpdating"
        />

        <BaselinePeriodPicker
          v-if="allLabels.length && selectedBaselineMethod"
          :baseline-method="selectedBaselineMethod || 'mean'"
          :slider-value="baselineSliderValue"
          :labels="baselineSliderValues()"
          :chart-type="chartType"
          :show-period-length="false"
          @slider-changed="(val: string[]) => emit('baselineSliderChanged', val)"
        />
      </div>
    </div>
  </UCard>
</template>
