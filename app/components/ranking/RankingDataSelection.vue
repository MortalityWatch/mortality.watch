<script setup lang="ts">
import type { ChartType } from '@/model/period'
import PeriodOfTimePicker from '@/components/shared/PeriodOfTimePicker.vue'
import DateRangePicker from '@/components/shared/DateRangePicker.vue'

const props = defineProps<{
  selectedPeriodOfTime: string
  periodOfTimeItems: Array<{ label: string, name: string, value: string }>
  selectedJurisdictionType: string
  jurisdictionTypeItems: Array<{ label: string, name: string, value: string }>
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  allLabels: string[]
  sliderValue: string[]
  labels: string[] // Renamed from sliderValues for consistency with Explorer
  isUpdating: boolean
  selectedBaselineMethod?: string
  dataTour?: string
}>()

const emit = defineEmits<{
  'periodOfTimeChanged': [value: string]
  'update:selectedJurisdictionType': [value: string]
  'update:sliderStart': [value: string]
  'sliderChanged': [value: string[]]
}>()
</script>

<template>
  <UCard :data-tour="props.dataTour">
    <template #header>
      <h2 class="text-xl font-semibold">
        Data Selection
      </h2>
    </template>

    <div class="flex flex-wrap gap-4">
      <PeriodOfTimePicker
        :model-value="props.selectedPeriodOfTime"
        :items="props.periodOfTimeItems"
        :is-updating="props.isUpdating"
        data-tour="ranking-period"
        @update:model-value="emit('periodOfTimeChanged', $event)"
      />
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <label
          class="text-sm font-medium whitespace-nowrap"
          for="jurisdictionType"
        >Jurisdictions</label>
        <USelect
          id="jurisdictionType"
          :model-value="props.selectedJurisdictionType"
          :items="props.jurisdictionTypeItems"
          value-key="value"
          placeholder="Select the jurisdictions to include"
          size="sm"
          class="w-48"
          @update:model-value="emit('update:selectedJurisdictionType', $event)"
        />
      </div>
    </div>

    <div
      v-if="props.allLabels.length && props.selectedBaselineMethod !== 'auto'"
      class="mt-6"
    >
      <DateRangePicker
        :slider-start="props.sliderStart"
        :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique"
        :slider-value="props.sliderValue"
        :labels="props.labels"
        :chart-type="(props.selectedPeriodOfTime || 'yearly') as ChartType"
        :disabled="props.isUpdating"
        data-tour="ranking-date-range"
        @update:slider-start="emit('update:sliderStart', $event)"
        @slider-changed="emit('sliderChanged', $event)"
      />
    </div>
  </UCard>
</template>
