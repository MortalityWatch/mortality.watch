<script setup lang="ts">
import type { ChartType } from '@/model/period'
import PeriodOfTimePicker from '@/components/shared/PeriodOfTimePicker.vue'
import DateRangePicker from '@/components/shared/DateRangePicker.vue'

const props = defineProps<{
  selectedPeriodOfTime: { label: string, name: string, value: string }
  periodOfTimeItems: Array<{ label: string, name: string, value: string }>
  selectedJurisdictionType: { label: string, name: string, value: string }
  jurisdictionTypeItems: Array<{ label: string, name: string, value: string }>
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  allLabels: string[]
  sliderValue: string[]
  sliderValues: string[]
  isUpdating: boolean
  selectedBaselineMethod?: { label: string, name: string, value: string }
  dataTour?: string
}>()

const emit = defineEmits<{
  'periodOfTimeChanged': [value: { label: string, name: string, value: string }]
  'update:selectedJurisdictionType': [value: { label: string, name: string, value: string }]
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
        <USelectMenu
          id="jurisdictionType"
          :model-value="props.selectedJurisdictionType"
          :items="props.jurisdictionTypeItems"
          placeholder="Select the jurisdictions to include"
          size="sm"
          class="w-48"
          @update:model-value="emit('update:selectedJurisdictionType', $event)"
        />
      </div>
    </div>

    <div
      v-if="props.allLabels.length && props.selectedBaselineMethod?.value !== 'auto'"
      class="mt-6"
    >
      <DateRangePicker
        :slider-start="props.sliderStart"
        :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique"
        :slider-value="props.sliderValue"
        :labels="props.sliderValues"
        :chart-type="(props.selectedPeriodOfTime?.value || 'yearly') as ChartType"
        :disabled="props.isUpdating"
        :show-from-picker="false"
        data-tour="ranking-date-range"
        @update:slider-start="emit('update:sliderStart', $event)"
        @slider-changed="emit('sliderChanged', $event)"
      />
    </div>
  </UCard>
</template>
