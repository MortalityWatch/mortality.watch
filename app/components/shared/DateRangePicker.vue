<script setup lang="ts">
import { computed } from 'vue'
import type { ChartType } from '@/model/period'
import DateSlider from '@/components/charts/DateSlider.vue'
import { specialColor } from '@/colors'

const props = defineProps<{
  sliderStart: string
  allYearlyChartLabelsUnique: string[]
  sliderValue: string[]
  labels: string[]
  chartType: ChartType
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:sliderStart': [value: string]
  'slider-changed': [value: string[]]
}>()

// Feature access for extended time periods
const { can } = useFeatureAccess()
const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))

// For users without extended access, restrict to year 2000+
const availableStartYears = computed(() => {
  if (hasExtendedTimeAccess.value) {
    return props.allYearlyChartLabelsUnique || []
  }

  // Filter to only years >= 2000
  return (props.allYearlyChartLabelsUnique || []).filter((label) => {
    const year = parseInt(label.substring(0, 4))
    return year >= 2000
  })
})

// Ensure sliderStart is within allowed range
const effectiveSliderStart = computed(() => {
  if (!props.sliderStart || !props.allYearlyChartLabelsUnique?.length) {
    return props.sliderStart
  }

  if (hasExtendedTimeAccess.value) {
    return props.sliderStart
  }

  // For non-premium users, if current sliderStart is before 2000, use first available year >= 2000
  const year = parseInt(props.sliderStart.substring(0, 4))
  if (year < 2000) {
    const year2000OrLater = availableStartYears.value.find((label) => {
      const y = parseInt(label.substring(0, 4))
      return y >= 2000
    })
    if (!year2000OrLater) {
      console.warn(
        `[DateRangePicker] No years >= 2000 available for free user. Falling back to ${props.sliderStart}. Available years:`,
        availableStartYears.value
      )
    }
    return year2000OrLater || props.sliderStart
  }

  return props.sliderStart
})
</script>

<template>
  <div
    class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    data-tour="date-range"
  >
    <div class="flex items-center gap-3">
      <!-- From dropdown -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">From</label>
        <USelectMenu
          :model-value="effectiveSliderStart"
          :items="availableStartYears"
          placeholder="Start"
          size="sm"
          class="w-24"
          :disabled="props.disabled"
          @update:model-value="emit('update:sliderStart', $event)"
        />
        <UPopover>
          <UButton
            icon="i-lucide-info"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Start period information"
          />
          <template #content>
            <div class="p-3 space-y-2 max-w-xs">
              <div class="text-xs text-gray-700 dark:text-gray-300">
                <template v-if="!hasExtendedTimeAccess">
                  Data before 2000 is restricted.
                  <NuxtLink
                    to="/signup"
                    class="text-primary hover:underline font-medium"
                  >
                    Register for free
                  </NuxtLink>
                  to access the full historical dataset.
                </template>
                <template v-else>
                  Sets the earliest year in the available data range. The slider will start from this year.
                </template>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Divider -->
      <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      <!-- Date Range Slider -->
      <div class="flex-1 flex items-center gap-2">
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
