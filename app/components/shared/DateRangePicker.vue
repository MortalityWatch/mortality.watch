<script setup lang="ts">
import { computed } from 'vue'
import type { ChartType } from '@/model/period'
import DateSlider from '@/components/charts/DateSlider.vue'
import FeatureBadge from '@/components/FeatureBadge.vue'
import { specialColor } from '@/colors'

const props = defineProps<{
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  sliderValue: string[]
  labels: string[]
  chartType: ChartType
  disabled?: boolean
  showFromPicker?: boolean // Option to hide the "From" picker (for ranking without feature gate)
}>()

const emit = defineEmits<{
  'update:sliderStart': [value: string]
  'slider-changed': [value: string[]]
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

// Determine if we should show the feature gate (only on Explorer with showFromPicker=true by default)
const shouldShowFeatureGate = computed(() => props.showFromPicker !== false)
</script>

<template>
  <div
    class="w-full px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    data-tour="date-range"
  >
    <div class="flex items-center gap-3">
      <!-- Start Period (From) - Optional with feature gating -->
      <div
        v-if="shouldShowFeatureGate"
        class="flex items-center gap-2"
      >
        <label class="text-sm font-medium whitespace-nowrap">From</label>
        <USelectMenu
          :model-value="displaySliderStart"
          :items="props.allYearlyChartLabelsUnique || []"
          placeholder="Start"
          size="sm"
          class="w-24"
          :disabled="!hasExtendedTimeAccess"
          @update:model-value="emit('update:sliderStart', $event)"
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

      <!-- Start Period (From) - Simple version without feature gate -->
      <div
        v-else-if="props.allYearlyChartLabelsUnique?.length"
        class="flex items-center gap-2"
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
          :disabled="props.disabled"
          size="sm"
          class="w-24"
          @update:model-value="emit('update:sliderStart', $event)"
        />
      </div>

      <!-- Divider (only show if From picker is shown) -->
      <div
        v-if="shouldShowFeatureGate || props.allYearlyChartLabelsUnique?.length"
        class="h-6 w-px bg-gray-300 dark:bg-gray-600"
      />

      <!-- Date Range Slider -->
      <div class="flex-1 flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">
          {{ shouldShowFeatureGate ? 'Display' : 'Date Range' }}
        </label>
        <div class="flex-1">
          <DateSlider
            :slider-value="props.sliderValue"
            :labels="props.labels"
            :chart-type="props.chartType"
            :color="specialColor()"
            :min-range="0"
            :disabled="props.disabled || false"
            :delay-emit="true"
            @slider-changed="emit('slider-changed', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
