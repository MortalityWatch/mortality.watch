<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import DateSlider from '@/components/charts/DateSlider.vue'
import { specialColor } from '@/lib/chart/chartColors'
import type { ChartType } from '@/model/period'
import {
  validateBaselinePeriod,
  clampBaselinePeriod
} from '@/lib/baseline/calculateBaselineRange'
import { getMaxBaselineYears } from '@/lib/config/constants'

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
// Note: 1 year is not offered as an option - it's only used internally for naive method
// which has the period selector hidden anyway (uses single-value mode)
const periodLengthOptions = [
  { label: '3 years', value: 3 },
  { label: '5 years', value: 5 },
  { label: '10 years', value: 10 },
  { label: 'Custom', value: 0 }
]

// Get default period length based on baseline method
// Different methods have different optimal period lengths
const getDefaultPeriodLength = (method: string): number => {
  if (method === 'naive') return 1 // Last value only needs 1 year
  if (method === 'exp' || method === 'lin_reg') return 10 // ETS and linear regression need 10 years
  return 3 // Default for mean/median
}

/**
 * Calculate period length from baseline dates
 * Returns 3, 5, 10 if the year range matches those presets, otherwise 0 (Custom)
 * Falls back to method-based default if sliderValue is not available
 */
const calculatePeriodLength = (sliderValue: string[], fallbackMethod?: string): number => {
  // Validate input - need both dates and labels
  if (!sliderValue || sliderValue.length !== 2 || !props.labels.length) {
    return fallbackMethod ? getDefaultPeriodLength(fallbackMethod) : 3
  }

  const startDate = sliderValue[0]
  const endDate = sliderValue[1]

  // Validate date strings exist and have minimum length for year extraction
  if (!startDate || !endDate || startDate.length < 4 || endDate.length < 4) {
    return fallbackMethod ? getDefaultPeriodLength(fallbackMethod) : 3
  }

  // Find the actual number of labels spanned by this period
  const startIdx = props.labels.indexOf(startDate)
  const endIdx = props.labels.indexOf(endDate)

  if (startIdx === -1 || endIdx === -1) {
    return fallbackMethod ? getDefaultPeriodLength(fallbackMethod) : 3
  }

  // Calculate the span in labels (inclusive)
  const labelSpan = endIdx - startIdx + 1

  // Calculate expected label spans for each preset based on labels per year
  const uniqueYears = Array.from(new Set(props.labels.filter(l => l).map(l => l.substring(0, 4))))

  // Guard against empty labels (prevent divide-by-zero)
  if (uniqueYears.length === 0) {
    return fallbackMethod ? getDefaultPeriodLength(fallbackMethod) : 3
  }

  const labelsPerYear = Math.round(props.labels.length / uniqueYears.length)

  // Expected spans for each preset (allowing for small rounding differences)
  const expected3 = 3 * labelsPerYear
  const expected5 = 5 * labelsPerYear
  const expected10 = 10 * labelsPerYear

  // Match to preset options with tolerance for off-by-one errors
  // This is necessary because of rounding in the calculation
  if (Math.abs(labelSpan - expected3) <= 1) return 3
  if (Math.abs(labelSpan - expected5) <= 1) return 5
  if (Math.abs(labelSpan - expected10) <= 1) return 10

  // Otherwise it's custom
  return 0
}

// Initialize with calculated value, falling back to method-based default
const selectedPeriodLength = ref(
  calculatePeriodLength(props.sliderValue, props.baselineMethod)
)

// Update period length when slider value changes externally (e.g., URL navigation)
watch(() => props.sliderValue, (newValue) => {
  const calculated = calculatePeriodLength(newValue)
  // Update if:
  // 1. The calculated value is a preset (3, 5, 10) AND current is also a preset
  // 2. OR the calculated value is Custom (0) - always reflect custom ranges
  if (calculated === 0 || selectedPeriodLength.value !== 0) {
    selectedPeriodLength.value = calculated
  }
}, { deep: true })

// Watch for baseline method changes to update default period length
// Always preserve user's Custom selection (value === 0)
watch(() => props.baselineMethod, (newMethod) => {
  // Don't change if user has selected Custom
  if (selectedPeriodLength.value === 0) return

  const defaultLength = getDefaultPeriodLength(newMethod)
  if (selectedPeriodLength.value !== defaultLength) {
    selectedPeriodLength.value = defaultLength
  }
})

// Watch for period length changes to recalculate baseline dates
// When user changes period length or when method changes (triggering period length change),
// we need to adjust the baseline slider to match the new period length
watch(() => selectedPeriodLength.value, (newLength, oldLength) => {
  // Skip if Custom (0) or if this is the initial value
  if (!newLength || newLength === 0 || oldLength === undefined) return

  // Skip for naive method - it uses single-value mode and doesn't need period adjustment
  if (props.baselineMethod === 'naive') return

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

    // Guard against empty labels (prevent divide-by-zero)
    if (uniqueYears.length === 0) return

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

// Validate current baseline period and show warning if too large
const baselineValidation = computed(() => {
  if (!props.sliderValue || props.sliderValue.length !== 2 || !props.labels.length) {
    return null
  }
  const from = props.sliderValue[0]
  const to = props.sliderValue[1]
  if (!from || !to) return null

  return validateBaselinePeriod(props.chartType, props.labels, from, to)
})

const maxYears = computed(() => getMaxBaselineYears(props.chartType))

const baselineSliderChanged = (values: string[]) => {
  // Validate and clamp if necessary
  if (values.length === 2 && values[0] && values[1]) {
    const validation = validateBaselinePeriod(props.chartType, props.labels, values[0], values[1])

    if (!validation.isValid) {
      // Clamp to maximum allowed period
      const clamped = clampBaselinePeriod(props.chartType, props.labels, values[0], values[1])
      emit('slider-changed', [clamped.from, clamped.to])
      return
    }
  }

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
        <USelect
          v-model="selectedPeriodLength"
          :items="periodLengthOptions"
          value-key="value"
          placeholder="Select period length"
          size="xs"
          class="w-28"
        />
      </div>
    </div>
    <div>
      <DateSlider
        :key="`${props.baselineMethod}-${selectedPeriodLength ?? 3}`"
        :slider-value="props.sliderValue"
        :labels="props.labels"
        :chart-type="props.chartType"
        :color="specialColor()"
        :min-range="baselineMinRange(props.baselineMethod)"
        :single-value="props.baselineMethod === 'naive'"
        :period-length="selectedPeriodLength ?? 3"
        :delay-emit="true"
        @slider-changed="baselineSliderChanged"
      />
    </div>
    <!-- Warning when baseline period approaches limit -->
    <div
      v-if="baselineValidation && baselineValidation.periodLength > baselineValidation.maxPeriod * 0.8"
      class="mt-2 text-xs text-amber-600 dark:text-amber-400"
    >
      <template v-if="!baselineValidation.isValid">
        Baseline period limited to {{ maxYears }} years max for this chart type.
      </template>
      <template v-else>
        Note: Max baseline period is {{ maxYears }} years for this chart type.
      </template>
    </div>
  </div>
</template>
