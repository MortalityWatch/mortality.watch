<script setup lang="ts">
import { computed } from 'vue'
import { types, standardPopulations } from '@/model'
import PeriodOfTimePicker from '@/components/shared/PeriodOfTimePicker.vue'

const props = defineProps<{
  selectedType: { name: string, value: string, label: string }
  selectedChartType: { name: string, value: string, label: string }
  selectedStandardPopulation: { name: string, value: string, label: string }
  isUpdating: boolean
  showStandardPopulation: boolean
}>()

const emit = defineEmits<{
  'update:selectedType': [value: { name: string, value: string, label: string }]
  'update:selectedChartType': [value: { name: string, value: string, label: string }]
  'update:selectedStandardPopulation': [value: { name: string, value: string, label: string }]
}>()

// Add 'label' property for USelectMenu compatibility
const typesWithLabels = types.map(t => ({ ...t, label: t.name }))
const standardPopulationsWithLabels = standardPopulations.map(t => ({ ...t, label: t.name }))

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
