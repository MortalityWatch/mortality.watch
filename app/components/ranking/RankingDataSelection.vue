<script setup lang="ts">
import type { ChartType } from '@/model/period'
import DateSlider from '../charts/DateSlider.vue'
import { specialColor } from '@/colors'

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
}>()

const emit = defineEmits<{
  'periodOfTimeChanged': [value: { label: string, name: string, value: string }]
  'update:selectedJurisdictionType': [value: { label: string, name: string, value: string }]
  'update:sliderStart': [value: string]
  'sliderChanged': [value: string[]]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">
        Data Selection
      </h2>
    </template>

    <div class="flex flex-wrap gap-4">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <label
          class="text-sm font-medium whitespace-nowrap"
          for="periodOfTime"
        >Period of Time</label>
        <USelectMenu
          id="periodOfTime"
          :model-value="props.selectedPeriodOfTime"
          :items="props.periodOfTimeItems"
          placeholder="Select the period of time"
          size="sm"
          class="w-44"
          @update:model-value="emit('periodOfTimeChanged', $event)"
        />
      </div>
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
      v-if="props.allLabels.length"
      class="mt-6 flex flex-wrap gap-6"
    >
      <div
        v-show="props.selectedBaselineMethod?.value !== 'auto'"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
      >
        <label
          class="text-sm font-medium whitespace-nowrap"
          for="startingPeriod"
        >
          Start Period
        </label>
        <USelectMenu
          id="startingPeriod"
          :model-value="props.sliderStart"
          :items="props.allYearlyChartLabelsUnique"
          placeholder="Select the start period"
          :disabled="props.isUpdating"
          size="sm"
          class="w-24"
          @update:model-value="emit('update:sliderStart', $event)"
        />
      </div>

      <div class="flex-1 min-w-[400px] px-4 pt-1 pb-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium whitespace-nowrap">
            Date Range
          </label>
          <div class="flex-1 mt-12 px-4">
            <DateSlider
              :slider-value="props.sliderValue"
              :labels="props.sliderValues"
              :chart-type="(props.selectedPeriodOfTime?.value || 'yearly') as ChartType"
              :color="specialColor()"
              :min-range="0"
              @slider-changed="emit('sliderChanged', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
