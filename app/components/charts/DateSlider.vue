<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { ChartPeriod, type ChartType } from '~/model/period'

const props = defineProps<{
  sliderValue: string[]
  labels: string[]
  chartType: ChartType
  color: string
  minRange: number
  disabled?: boolean
  singleValue?: boolean // For baseline methods that only need one date (e.g., "Last Value")
  periodLength?: number // Fixed period length in years (0 = custom/independent sliders)
  delayEmit?: boolean // If true, only emit on mouse release. If false, emit immediately
}>()
const emit = defineEmits(['sliderChanged', 'periodLengthChanged'])

// Feature access for date restrictions
const { can } = useFeatureAccess()
const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))

// Calculate the minimum allowed index for public users (year 2000+)
const minAllowedIndex = computed(() => {
  if (hasExtendedTimeAccess.value) {
    return 0 // Free tier users can access all data
  }

  // Find the first label that is >= 2000
  const firstAllowedIndex = props.labels.findIndex((label) => {
    const year = parseInt(label.substring(0, 4))
    return year >= 2000
  })

  return firstAllowedIndex >= 0 ? firstAllowedIndex : 0
})

// Track if user is actively dragging the slider (only used when delayEmit is true)
const isDragging = ref(false)
const pendingEmitValues = ref<string[] | null>(null)

// Initialize slider indices from sliderValue prop
const getInitialIndices = (): number[] => {
  const period = new ChartPeriod(props.labels, props.chartType)

  if (props.singleValue) {
    const toIdx = period.indexOf(props.sliderValue[1] ?? '')
    return [toIdx, toIdx]
  }

  const fromIdx = period.indexOf(props.sliderValue[0] ?? '')
  const toIdx = period.indexOf(props.sliderValue[1] ?? '')

  return [fromIdx, toIdx]
}

const sliderIndices = ref<number[]>(getInitialIndices())
const isUpdatingFromProp = ref(false)

// Handler for single value slider updates
const handleSingleValueUpdate = (val: unknown) => {
  const numVal = val as number
  sliderIndices.value = [numVal, numVal]
}

// Watch for sliderValue prop changes to sync indices
watch(() => props.sliderValue, (newValue) => {
  if (!newValue || newValue.length !== 2) return

  // Don't sync from props while user is actively dragging (prevents jumping)
  if (props.delayEmit && isDragging.value) {
    return
  }

  const period = new ChartPeriod(props.labels, props.chartType)
  const fromIdx = period.indexOf(newValue[0] ?? '')
  const toIdx = period.indexOf(newValue[1] ?? '')

  // Only update if indices are different from current
  if (sliderIndices.value[0] !== fromIdx || sliderIndices.value[1] !== toIdx) {
    isUpdatingFromProp.value = true
    sliderIndices.value = [fromIdx, toIdx]
    prevIndices.value = [fromIdx, toIdx]
    nextTick(() => {
      isUpdatingFromProp.value = false
    })
  }
})

// Watch for periodLength changes to enforce fixed period
watch(() => props.periodLength, (newPeriodLength) => {
  if (!newPeriodLength || newPeriodLength === 0 || props.singleValue) return

  // Don't adjust period while user is actively dragging (prevents jumping)
  if (props.delayEmit && isDragging.value) {
    return
  }

  const periodIndices = calculatePeriodIndices(newPeriodLength)
  const currentSpan = (sliderIndices.value[1] ?? 0) - (sliderIndices.value[0] ?? 0)

  // If current span doesn't match desired period, adjust
  if (Math.abs(currentSpan - periodIndices) > 1) {
    isUpdatingFromProp.value = true
    const newEndIdx = Math.min((sliderIndices.value[0] ?? 0) + periodIndices, props.labels.length - 1)
    sliderIndices.value = [sliderIndices.value[0] ?? 0, newEndIdx]
    prevIndices.value = [...sliderIndices.value]
    nextTick(() => {
      isUpdatingFromProp.value = false
    })
  }
})

// Watch for label changes (e.g., when sliderStart changes)
watch(() => props.labels, (newLabels) => {
  if (!newLabels || newLabels.length === 0) return

  // Don't sync from props while user is actively dragging (prevents jumping)
  if (props.delayEmit && isDragging.value) {
    return
  }

  // Use ChartPeriod for smart index lookup with automatic fallback
  const period = new ChartPeriod(newLabels, props.chartType)

  // Update slider indices based on current sliderValue
  const from = props.sliderValue[0]
  const to = props.sliderValue[1]

  if (props.singleValue) {
    // For single value mode, use the end date
    const validIdx = to ? period.indexOf(to) : newLabels.length - 1
    if (sliderIndices.value[0] !== validIdx || sliderIndices.value[1] !== validIdx) {
      isUpdatingFromProp.value = true
      sliderIndices.value = [validIdx, validIdx]
      nextTick(() => {
        isUpdatingFromProp.value = false
      })
    }
  } else if (from && to) {
    // ChartPeriod.indexOf() handles exact match and smart fallback automatically
    const fromIdx = period.indexOf(from)
    const toIdx = period.indexOf(to)

    // Only update if indices actually changed
    if (sliderIndices.value[0] !== fromIdx || sliderIndices.value[1] !== toIdx) {
      isUpdatingFromProp.value = true
      sliderIndices.value = [fromIdx, toIdx]
      nextTick(() => {
        isUpdatingFromProp.value = false
      })
    }
  }
}, { immediate: true })

// NOTE: We intentionally DON'T watch sliderValue during normal operation
// because it creates a feedback loop with the USlider component.
// The slider maintains its own local state (sliderIndices) and only
// communicates changes outward via the sliderChanged emit.
// We only sync from props during initial mount (handled by labels watcher)

// Calculate period length in indices based on labels
const calculatePeriodIndices = (years: number): number => {
  if (years === 0 || !props.labels.length) return 0

  // Count unique years in labels
  const uniqueYears = Array.from(new Set(props.labels.map(l => l.substring(0, 4))))
  const labelsPerYear = Math.round(props.labels.length / uniqueYears.length)

  return years * labelsPerYear
}

// Previous indices to detect which handle moved
const prevIndices = ref<number[]>([...sliderIndices.value])

// Convert indices back to string values when user changes slider
watch(sliderIndices, (newIndices) => {
  if (isUpdatingFromProp.value) {
    return // Don't emit if we're just updating from props
  }

  if (props.singleValue) {
    // For single value mode, use the first index for both values
    const idx = newIndices[0]
    const value = (idx !== undefined ? props.labels[idx] : undefined) || props.labels[props.labels.length - 1] || ''

    // Store pending values but don't emit yet if dragging (only when delayEmit is true)
    if (props.delayEmit && isDragging.value) {
      pendingEmitValues.value = [value, value]
    } else {
      emit('sliderChanged', [value, value])
    }
  } else {
    let idx0 = newIndices[0] ?? 0
    let idx1 = newIndices[1] ?? props.labels.length - 1

    // Enforce minimum date restriction for public users
    const restrictedMinIdx = minAllowedIndex.value
    if (idx0 < restrictedMinIdx) {
      idx0 = restrictedMinIdx
    }
    if (idx1 < restrictedMinIdx) {
      idx1 = restrictedMinIdx
    }

    // Handle fixed period length mode
    if (props.periodLength && props.periodLength > 0) {
      const periodIndices = calculatePeriodIndices(props.periodLength)

      // Determine which handle moved
      const startMoved = idx0 !== prevIndices.value[0]
      const endMoved = idx1 !== prevIndices.value[1]

      if (startMoved && !endMoved) {
        // Start handle moved - adjust end handle
        idx1 = Math.min(idx0 + periodIndices, props.labels.length - 1)
      } else if (endMoved && !startMoved) {
        // End handle moved - adjust start handle
        idx0 = Math.max(idx1 - periodIndices, 0)
      }

      // Update indices if they changed
      if (idx0 !== newIndices[0] || idx1 !== newIndices[1]) {
        isUpdatingFromProp.value = true
        sliderIndices.value = [idx0, idx1]
        nextTick(() => {
          isUpdatingFromProp.value = false
        })
        prevIndices.value = [idx0, idx1]
        return
      }
    }

    // Update previous indices
    prevIndices.value = [idx0, idx1]

    // Ensure indices are sorted before emitting
    const minIdx = Math.min(idx0 ?? 0, idx1 ?? 0)
    const maxIdx = Math.max(idx0 ?? 0, idx1 ?? 0)
    const values = [
      (minIdx !== undefined ? props.labels[minIdx] : undefined) || props.labels[0] || '',
      (maxIdx !== undefined ? props.labels[maxIdx] : undefined) || props.labels[props.labels.length - 1] || ''
    ]

    // Store pending values but don't emit yet if dragging (only when delayEmit is true)
    if (props.delayEmit && isDragging.value) {
      pendingEmitValues.value = values
    } else {
      emit('sliderChanged', values)
    }
  }
})

// Handle mouse/touch events to detect when user finishes dragging
const handlePointerDown = () => {
  isDragging.value = true
  pendingEmitValues.value = null
}

const handlePointerUp = () => {
  isDragging.value = false
  // Emit pending values if any
  if (pendingEmitValues.value) {
    emit('sliderChanged', pendingEmitValues.value)
    pendingEmitValues.value = null
  }
}

// Display current values based on slider indices, not props
// This ensures the display matches what the slider is actually pointing to
const currentRange = computed(() => {
  if (props.singleValue) {
    const idx = sliderIndices.value[0]
    return (idx !== undefined && props.labels[idx]) ? props.labels[idx] : ''
  }
  const fromIdx = sliderIndices.value[0]
  const toIdx = sliderIndices.value[1]
  // Ensure indices are sorted to always display in chronological order
  const minIdx = Math.min(fromIdx ?? 0, toIdx ?? 0)
  const maxIdx = Math.max(fromIdx ?? 0, toIdx ?? 0)
  const from = (minIdx !== undefined && props.labels[minIdx]) ? props.labels[minIdx] : ''
  const to = (maxIdx !== undefined && props.labels[maxIdx]) ? props.labels[maxIdx] : ''
  return from && to ? `${from} - ${to}` : ''
})
</script>

<template>
  <div
    class="date-slider-container"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div class="mb-2 text-center text-sm font-medium">
      {{ currentRange }}
    </div>
    <USlider
      v-if="singleValue"
      v-model="sliderIndices[0]"
      :min="minAllowedIndex"
      :max="labels.length - 1"
      :step="1"
      :disabled="disabled"
      @update:model-value="handleSingleValueUpdate"
    />
    <USlider
      v-else
      v-model="sliderIndices"
      :min="minAllowedIndex"
      :max="labels.length - 1"
      :step="1"
      :disabled="disabled"
    />
    <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span :class="{ 'opacity-40': minAllowedIndex > 0 }">{{ labels[0] }}</span>
      <span>{{ labels[labels.length - 1] }}</span>
    </div>

    <!-- Restricted date notice for public users -->
    <div
      v-if="!hasExtendedTimeAccess && minAllowedIndex > 0"
      class="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
    >
      <Icon
        name="i-lucide-lock"
        class="w-3 h-3"
      />
      <span>Data before {{ labels[minAllowedIndex]?.substring(0, 4) }} requires </span>
      <NuxtLink
        to="/signup"
        class="text-primary hover:underline"
      >
        free registration
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.date-slider-container {
  padding: 0.5rem 0;
}
</style>
