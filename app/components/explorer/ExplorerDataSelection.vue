<script setup lang="ts">
import { computed } from 'vue'
import type { Country } from '@/model'
import type { ChartType } from '@/model/period'
import MortalityChartControlsPrimary from '@/components/charts/MortalityChartControlsPrimary.vue'
import DateSlider from '@/components/charts/DateSlider.vue'
import FeatureBadge from '@/components/FeatureBadge.vue'
import { specialColor } from '@/colors'

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

// Feature access for extended time periods
const { can } = useFeatureAccess()
const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))

// For users without extended access, find the year 2000 or earliest after
const restrictedSliderStart = computed(() => {
  if (hasExtendedTimeAccess.value) return null

  const year2000OrLater = props.allYearlyChartLabelsUnique.find((label) => {
    const year = parseInt(label.substring(0, 4))
    return year >= 2000
  })

  return year2000OrLater || props.allYearlyChartLabelsUnique[0] || ''
})

// Display value for the From input
const displaySliderStart = computed(() => {
  return restrictedSliderStart.value || props.sliderStart
})
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
      <div
        class="w-full px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        data-tour="date-range"
      >
        <div class="flex items-center gap-3">
          <!-- Start Period -->
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium whitespace-nowrap">From</label>
            <USelectMenu
              :model-value="displaySliderStart"
              :items="props.allYearlyChartLabelsUnique || []"
              placeholder="Start"
              size="sm"
              class="w-24"
              :disabled="!hasExtendedTimeAccess"
              @update:model-value="emit('sliderStartChanged', $event)"
            />
            <FeatureBadge
              v-if="!hasExtendedTimeAccess"
              feature="EXTENDED_TIME_PERIODS"
            />
            <UPopover v-if="hasExtendedTimeAccess">
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Start period information"
              />
              <template #content>
                <div class="p-3 max-w-xs">
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    Sets the earliest year in the available data range. The Display slider will start from this year.
                  </div>
                </div>
              </template>
            </UPopover>
          </div>

          <!-- Divider -->
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <!-- Date Range Slider -->
          <div class="flex-1 flex items-center gap-2">
            <label class="text-sm font-medium whitespace-nowrap">Display</label>
            <div class="flex-1">
              <DateSlider
                :slider-value="props.sliderValue"
                :labels="props.labels"
                :chart-type="props.chartType"
                :color="specialColor()"
                :min-range="0"
                :disabled="false"
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
