<script setup lang="ts">
import type { Country } from '@/model'
import type { ChartType } from '@/model/period'
import MortalityChartControlsPrimary from '@/components/charts/MortalityChartControlsPrimary.vue'
import DateSlider from '@/components/charts/DateSlider.vue'
import DateRangePicker from '@/components/shared/DateRangePicker.vue'
import { specialColor } from '@/lib/chart/chartColors'
import { getFullSamePeriodLabels, isSamePeriodChartType } from '@/lib/chart/samePeriodComparison'

const props = defineProps<{
  allCountries: Record<string, Country>
  allAgeGroups: string[]
  countries: string[]
  ageGroups: string[]
  isAsmrType: boolean
  isLifeExpectancyType: boolean
  isAsdType: boolean
  isUpdating: boolean
  maxCountriesAllowed?: number
  sliderValue: string[]
  labels: string[]
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  chartType: ChartType
  view: string
}>()

const emit = defineEmits<{
  countriesChanged: [value: string[]]
  ageGroupsChanged: [value: string[]]
  sliderStartChanged: [value: string]
  dateSliderChanged: [value: string[]]
}>()

const isSamePeriod = computed(() => props.view === 'samePeriod')

const labelYear = (label: string) => label.substring(0, 4)

const samePeriodAnchorYears = computed(() => {
  const years = Array.from(new Set(
    props.labels
      .map(labelYear)
      .filter(year => /^\d{4}$/.test(year))
  ))

  return years.map(year => ({ label: year, value: year }))
})

const samePeriodAnchorYear = computed(() => {
  const selectedYear = labelYear(props.sliderValue[1] || props.sliderValue[0] || '')
  if (samePeriodAnchorYears.value.some(item => item.value === selectedYear)) {
    return selectedYear
  }
  return samePeriodAnchorYears.value[samePeriodAnchorYears.value.length - 1]?.value ?? ''
})

const samePeriodLabels = computed(() => {
  const anchorYear = samePeriodAnchorYear.value
  const year = Number(anchorYear)
  if (!isSamePeriodChartType(props.chartType) || !Number.isFinite(year)) return props.labels
  return getFullSamePeriodLabels(props.chartType, year)
})

const samePeriodSliderValue = computed(() => {
  const labels = samePeriodLabels.value
  if (labels.length === 0) return props.sliderValue

  const [from, to] = props.sliderValue
  if (from && to && labelYear(from) === samePeriodAnchorYear.value && labelYear(to) === samePeriodAnchorYear.value) {
    return props.sliderValue
  }

  return [labels[0]!, labels[labels.length - 1]!]
})

const updateSamePeriodAnchorYear = (year: string) => {
  const parsedYear = Number(year)
  const labels = isSamePeriodChartType(props.chartType) && Number.isFinite(parsedYear)
    ? getFullSamePeriodLabels(props.chartType, parsedYear)
    : []
  if (labels.length === 0) return
  emit('dateSliderChanged', [labels[0]!, labels[labels.length - 1]!])
}
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
          :is-asd-type="props.isAsdType"
          :is-updating="false"
          :max-countries-allowed="props.maxCountriesAllowed"
          @countries-changed="emit('countriesChanged', $event)"
          @age-groups-changed="emit('ageGroupsChanged', $event)"
        />
      </div>

      <!-- Date Range Selection -->
      <DateRangePicker
        v-if="!isSamePeriod"
        :slider-start="props.sliderStart"
        :all-yearly-chart-labels-unique="props.allYearlyChartLabelsUnique"
        :slider-value="props.sliderValue"
        :labels="props.labels"
        :chart-type="props.chartType"
        @update:slider-start="emit('sliderStartChanged', $event)"
        @slider-changed="emit('dateSliderChanged', $event)"
      />

      <div
        v-else
        class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        data-tour="date-range"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium whitespace-nowrap">Anchor</label>
            <USelectMenu
              :model-value="samePeriodAnchorYear"
              :items="samePeriodAnchorYears"
              placeholder="Year"
              size="sm"
              class="w-24"
              value-key="value"
              @update:model-value="updateSamePeriodAnchorYear"
            />
          </div>

          <div class="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <div class="flex-1 flex items-center gap-2 w-full sm:w-auto">
            <div class="flex-1">
              <DateSlider
                :slider-value="samePeriodSliderValue"
                :labels="samePeriodLabels"
                :chart-type="props.chartType"
                :color="specialColor()"
                :min-range="0"
                :disabled="props.isUpdating"
                :delay-emit="true"
                @slider-changed="emit('dateSliderChanged', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
