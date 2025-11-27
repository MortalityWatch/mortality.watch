<script setup lang="ts">
import { computed } from 'vue'
import { types, standardPopulations } from '@/model'
import PeriodOfTimePicker from '@/components/shared/PeriodOfTimePicker.vue'
import type { RadioGroupItem } from '@nuxt/ui'
import type { ViewType } from '@/lib/state/viewTypes'

// Feature access for Z-Score
const { can } = useFeatureAccess()

const props = defineProps<{
  selectedType: { name: string, value: string, label: string }
  selectedChartType: { name: string, value: string, label: string }
  selectedStandardPopulation: { name: string, value: string, label: string }
  view: ViewType
  isUpdating: boolean
  isPopulationType: boolean
  showStandardPopulation: boolean
}>()

const emit = defineEmits<{
  'update:selectedType': [value: { name: string, value: string, label: string }]
  'update:selectedChartType': [value: { name: string, value: string, label: string }]
  'update:selectedStandardPopulation': [value: { name: string, value: string, label: string }]
  'update:view': [value: ViewType]
}>()

// Add 'label' property for USelectMenu compatibility
const typesWithLabels = types.map(t => ({ ...t, label: t.name }))
const standardPopulationsWithLabels = standardPopulations.map(t => ({ ...t, label: t.name }))

// View options for radio group - gate Z-Score for Pro users
const viewOptions = computed<RadioGroupItem[]>(() => {
  const hasZScoreAccess = can('Z_SCORES')
  return [
    {
      label: 'Raw Values',
      value: 'mortality',
      description: 'Observed values without adjustments or transformations'
    },
    {
      label: 'Excess',
      value: 'excess',
      description: 'Difference from expected baseline (observed - expected)'
    },
    {
      label: 'Z-Score',
      value: 'zscore',
      description: 'How many standard deviations from baseline (±2 = significant)',
      disabled: !hasZScoreAccess
    }
  ]
})

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
      <UInputMenu
        v-model="selectedTypeModel"
        :items="typesWithLabels"
        placeholder="Select the metric"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
      <template #help>
        <div class="text-xs text-gray-700 dark:text-gray-300">
          <strong>CMR:</strong> Crude Mortality Rate per 100k<br>
          <strong>ASMR:</strong> Age-Standardized Mortality Rate per 100k<br>
          <strong>Life Expectancy:</strong> Expected years of life at birth<br>
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
      <URadioGroup
        v-model="viewModel"
        color="primary"
        variant="table"
        :items="viewOptions"
        :disabled="props.isPopulationType"
        data-testid="view-selector"
      >
        <template #label="{ item }">
          <div class="flex items-center gap-2">
            <span>{{ item.label }}</span>
            <FeatureBadge
              v-if="item.value === 'zscore'"
              feature="Z_SCORES"
            />
          </div>
        </template>
      </URadioGroup>
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
      <UInputMenu
        v-model="selectedStandardPopulationModel"
        :items="standardPopulationsWithLabels"
        placeholder="Select the standard population"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
    </UiControlRow>
  </div>
</template>
