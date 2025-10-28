<script setup lang="ts">
import { computed } from 'vue'
import { types, chartTypes, standardPopulations } from '@/model'

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
const chartTypesWithLabels = chartTypes.map(t => ({ ...t, label: t.name }))
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
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <label class="text-sm font-medium whitespace-nowrap">Metric</label>
      <UInputMenu
        v-model="selectedTypeModel"
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
      <UInputMenu
        v-model="selectedChartTypeModel"
        :items="chartTypesWithLabels"
        placeholder="Select the period of time"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
    </div>

    <div
      v-if="props.showStandardPopulation"
      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      <label class="text-sm font-medium whitespace-nowrap">Standard Population</label>
      <UInputMenu
        v-model="selectedStandardPopulationModel"
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
</template>
