<script setup lang="ts">
import { ref, watch } from 'vue'
import DateSlider from '@/components/charts/DateSlider.vue'
import { specialColor } from '@/colors'
import type { ChartType } from '@/model/period'

const props = defineProps<{
  baselineMethod: string
  sliderValue: string[]
  labels: string[]
  chartType: ChartType
  showPeriodLength?: boolean // Option to show/hide period length selector
}>()

const emit = defineEmits<{
  'slider-changed': [value: string[]]
}>()

// Period length management
const periodLengthOptions = [
  { label: '3 years', value: 3 },
  { label: '5 years', value: 5 },
  { label: '10 years', value: 10 },
  { label: 'Custom', value: 0 }
]

// Get default period length based on baseline method
// ETS needs at least 10 years of data to work properly
const getDefaultPeriodLength = (method: string): number => {
  if (method === 'exp') return 10 // ETS requires 10 years
  return 3 // Default for other methods
}

const selectedPeriodLength = ref(
  periodLengthOptions.find(o => o.value === getDefaultPeriodLength(props.baselineMethod)) || periodLengthOptions[0]
)

// Watch for baseline method changes to update default period length
// Always preserve user's Custom selection (value === 0)
watch(() => props.baselineMethod, (newMethod) => {
  // Don't change if user has selected Custom
  if (!selectedPeriodLength.value || selectedPeriodLength.value.value === 0) return

  const defaultLength = getDefaultPeriodLength(newMethod)
  if (selectedPeriodLength.value.value !== defaultLength) {
    selectedPeriodLength.value = periodLengthOptions.find(o => o.value === defaultLength) || periodLengthOptions[0]!
  }
})

// Watch for period length changes to recalculate baseline dates
// When user changes period length or when method changes (triggering period length change),
// we need to adjust the baseline slider to match the new period length
watch(() => selectedPeriodLength.value?.value, (newLength, oldLength) => {
  // Skip if Custom (0) or if this is the initial value
  if (!newLength || newLength === 0 || oldLength === undefined) return

  // Calculate new baseline range based on the period length
  // Keep the start date, adjust the end date
  if (props.sliderValue && props.sliderValue.length === 2) {
    const startDate = props.sliderValue[0]
    if (!startDate || !props.labels.length) return

    const startIdx = props.labels.indexOf(startDate)
    if (startIdx === -1) return

    // Calculate new end index based on period length
    // For yearly charts: 3 years = 3 labels (2017, 2018, 2019)
    // For weekly charts: 3 years = ~156 labels
    const uniqueYears = Array.from(new Set(props.labels.filter(l => l).map(l => l.substring(0, 4))))
    const labelsPerYear = Math.round(props.labels.length / uniqueYears.length)
    const periodIndices = newLength * labelsPerYear - 1 // -1 for inclusive range

    const newEndIdx = Math.min(startIdx + periodIndices, props.labels.length - 1)
    const newEndDate = props.labels[newEndIdx]

    if (newEndDate && newEndDate !== props.sliderValue[1]) {
      // Emit the new range
      emit('slider-changed', [startDate, newEndDate])
    }
  }
}, { flush: 'post' })

const baselineMinRange = (method: string) => method === 'mean' ? 0 : 2

const baselineSliderChanged = (values: string[]) => {
  emit('slider-changed', values)
}
</script>

<template>
  <div
    class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
  >
    <div class="flex items-center justify-between mb-3">
      <label class="text-sm font-medium">Period</label>
      <!-- Period Length Selection -->
      <div
        v-if="props.showPeriodLength !== false && props.baselineMethod !== 'naive'"
        class="flex items-center gap-2"
      >
        <label class="text-xs text-gray-600 dark:text-gray-400">Length:</label>
        <UInputMenu
          v-model="selectedPeriodLength"
          :items="periodLengthOptions"
          placeholder="Select period length"
          size="xs"
          class="w-28"
        />
      </div>
    </div>
    <div>
      <DateSlider
        :key="`${props.baselineMethod}-${selectedPeriodLength?.value ?? 3}`"
        :slider-value="props.sliderValue"
        :labels="props.labels"
        :chart-type="props.chartType"
        :color="specialColor()"
        :min-range="baselineMinRange(props.baselineMethod)"
        :single-value="props.baselineMethod === 'naive'"
        :period-length="selectedPeriodLength?.value ?? 3"
        :delay-emit="true"
        @slider-changed="baselineSliderChanged"
      />
    </div>
  </div>
</template>
