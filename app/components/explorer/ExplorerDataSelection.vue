<script setup lang="ts">
import type { Country } from '@/model'
import type { ChartType } from '@/model/period'
import MortalityChartControlsPrimary from '@/components/charts/MortalityChartControlsPrimary.vue'
import DateRangePicker from '@/components/shared/DateRangePicker.vue'

const props = defineProps<{
  allCountries: Record<string, Country>
  allAgeGroups: string[]
  countries: string[]
  ageGroups: string[]
  isAsmrType: boolean
  isLifeExpectancyType: boolean
  isUpdating: boolean
  maxCountriesAllowed?: number
  sliderValue: string[]
  labels: string[]
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  chartType: ChartType
}>()

const emit = defineEmits<{
  countriesChanged: [value: string[]]
  ageGroupsChanged: [value: string[]]
  sliderStartChanged: [value: string]
  dateSliderChanged: [value: string[]]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">
        Data Selection
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <!-- Jurisdictions - full width -->
      <div
        class="w-full"
        data-tour="country-selection"
      >
        <MortalityChartControlsPrimary
          :all-countries="props.allCountries"
          :all-age-groups="props.allAgeGroups"
          :countries="props.countries"
          :age-groups="props.ageGroups"
          :is-asmr-type="props.isAsmrType"
          :is-life-expectancy-type="props.isLifeExpectancyType"
          :is-updating="false"
          :max-countries-allowed="props.maxCountriesAllowed"
          @countries-changed="emit('countriesChanged', $event)"
          @age-groups-changed="emit('ageGroupsChanged', $event)"
        />
      </div>

      <!-- Date Range Selection -->
      <DateRangePicker
        :slider-start="props.sliderStart"
        :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique"
        :slider-value="props.sliderValue"
        :labels="props.labels"
        :chart-type="props.chartType"
        @update:slider-start="emit('sliderStartChanged', $event)"
        @slider-changed="emit('dateSliderChanged', $event)"
      />
    </div>
  </UCard>
</template>
