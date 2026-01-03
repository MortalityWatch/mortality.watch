<script setup lang="ts">
import { computed } from 'vue'
import { types, standardPopulations } from '@/model'
import PeriodOfTimePicker from '@/components/shared/PeriodOfTimePicker.vue'
import type { ViewType } from '@/lib/state'

interface ViewOption {
  label: string
  value: string
  description: string
}

// Feature access for Z-Score
const { can } = useFeatureAccess()

const props = defineProps<{
  selectedType: string
  selectedChartType: string
  selectedStandardPopulation: string
  view: ViewType
  isUpdating: boolean
  isPopulationType: boolean
  showStandardPopulation: boolean
}>()

const emit = defineEmits<{
  'update:selectedType': [value: string]
  'update:selectedChartType': [value: string]
  'update:selectedStandardPopulation': [value: string]
  'update:view': [value: ViewType]
}>()

// Gate ASD metric for Pro users
const hasASDAccess = can('AGE_STANDARDIZED')

// Add 'label' property for USelect compatibility
// Also mark ASD as disabled if user doesn't have Pro access
const typesWithLabels = computed(() => types.map(t => ({
  ...t,
  label: t.value === 'asd' && !hasASDAccess ? `${t.name} (Pro)` : t.name,
  disabled: t.value === 'asd' && !hasASDAccess
})))
const standardPopulationsWithLabels = standardPopulations.map(t => ({ ...t, label: t.name }))

// View options for radio group - Z-Score handled separately with FeatureGate
const baseViewOptions: ViewOption[] = [
  {
    label: 'Raw Values',
    value: 'mortality',
    description: 'Observed values without adjustments or transformations'
  },
  {
    label: 'Excess',
    value: 'excess',
    description: 'Difference from expected baseline (observed - expected)'
  }
]

const zscoreOption: ViewOption = {
  label: 'Z-Score',
  value: 'zscore',
  description: 'How many standard deviations from baseline (±2 = significant)'
}

const selectedTypeModel = computed({
  get: () => props.selectedType,
  set: v => emit('update:selectedType', v)
})

const selectedChartTypeModel = computed({
  get: () => props.selectedChartType,
  set: v => emit('update:selectedChartType', v)
})

const selectedStandardPopulationModel = computed({
  get: () => props.selectedStandardPopulation,
  set: v => emit('update:selectedStandardPopulation', v)
})

const viewModel = computed({
  get: () => props.view,
  set: v => emit('update:view', v as ViewType)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiControlRow label="Metric">
      <USelect
        v-model="selectedTypeModel"
        :items="typesWithLabels"
        value-key="value"
        placeholder="Select the metric"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
      <template #help>
        <div class="text-xs text-gray-700 dark:text-gray-300">
          <strong>Life Expectancy:</strong> Expected years of life at birth<br>
          <strong>ASD:</strong> Age-Standardized Deaths (Levitt method)<br>
          <strong>ASMR:</strong> Age-Standardized Mortality Rate per 100k<br>
          <strong>CMR:</strong> Crude Mortality Rate per 100k<br>
          <strong>Deaths:</strong> Total death counts<br>
          <strong>Population:</strong> Total population size
        </div>
      </template>
    </UiControlRow>

    <!-- View Mode Section -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
        Analysis Mode
      </h4>
      <div
        class="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
        data-testid="view-selector"
      >
        <!-- Raw Values and Excess options -->
        <template
          v-for="option in baseViewOptions"
          :key="option.value"
        >
          <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
          <div
            class="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20': viewModel === option.value, 'opacity-50 pointer-events-none': props.isPopulationType }"
            @click="!props.isPopulationType && (viewModel = option.value as ViewType)"
          >
            <URadio
              v-model="viewModel"
              :value="option.value"
              :disabled="props.isPopulationType"
              color="primary"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ option.label }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ option.description }}
              </div>
            </div>
          </div>
        </template>

        <!-- Z-Score option with FeatureGate -->
        <FeatureGate feature="Z_SCORES">
          <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
          <div
            class="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20': viewModel === 'zscore', 'opacity-50 pointer-events-none': props.isPopulationType }"
            @click="!props.isPopulationType && (viewModel = 'zscore')"
          >
            <URadio
              v-model="viewModel"
              value="zscore"
              :disabled="props.isPopulationType"
              color="primary"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                {{ zscoreOption.label }}
                <FeatureBadge feature="Z_SCORES" />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ zscoreOption.description }}
              </div>
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>

    <PeriodOfTimePicker
      v-model="selectedChartTypeModel"
      :is-updating="props.isUpdating"
    />

    <UiControlRow
      v-if="props.showStandardPopulation"
      label="Standard Population"
      help-content="Reference population used to standardize mortality rates by age structure. Enables fair comparisons across countries and time periods."
    >
      <USelect
        v-model="selectedStandardPopulationModel"
        :items="standardPopulationsWithLabels"
        value-key="value"
        placeholder="Select the standard population"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
    </UiControlRow>
  </div>
</template>
