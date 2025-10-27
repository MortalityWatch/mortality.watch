<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

const props = defineProps<{
  sliderValue: string[]
  labels: string[]
  color: string
  minRange: number
  disabled?: boolean
  singleValue?: boolean // For baseline methods that only need one date (e.g., "Last Value")
  periodLength?: number // Fixed period length in years (0 = custom/independent sliders)
  delayEmit?: boolean // If true, only emit on mouse release. If false, emit immediately
}>()
const emit = defineEmits(['sliderChanged', 'periodLengthChanged'])

// Track if user is actively dragging the slider (only used when delayEmit is true)
const isDragging = ref(false)
const pendingEmitValues = ref<string[] | null>(null)

// Initialize slider indices from sliderValue prop
const getInitialIndices = (): number[] => {
  if (props.singleValue) {
    const toIdx = props.labels.indexOf(props.sliderValue[1] ?? '')
    return [
      toIdx !== -1 ? toIdx : props.labels.length - 1,
      toIdx !== -1 ? toIdx : props.labels.length - 1
    ]
  }

  const fromIdx = props.labels.indexOf(props.sliderValue[0] ?? '')
  const toIdx = props.labels.indexOf(props.sliderValue[1] ?? '')

  return [
    fromIdx !== -1 ? fromIdx : 0,
    toIdx !== -1 ? toIdx : props.labels.length - 1
  ]
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

  const fromIdx = props.labels.indexOf(newValue[0] ?? '')
  const toIdx = props.labels.indexOf(newValue[1] ?? '')

  if (fromIdx !== -1 && toIdx !== -1) {
    // Only update if indices are different from current
    if (sliderIndices.value[0] !== fromIdx || sliderIndices.value[1] !== toIdx) {
      isUpdatingFromProp.value = true
      sliderIndices.value = [fromIdx, toIdx]
      prevIndices.value = [fromIdx, toIdx]
      nextTick(() => {
        isUpdatingFromProp.value = false
      })
    }
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

  // Update slider indices based on current sliderValue
  const from = props.sliderValue[0]
  const to = props.sliderValue[1]

  if (props.singleValue) {
    // For single value mode, use the end date
    const toIdx = to ? newLabels.indexOf(to) : newLabels.length - 1
    const validIdx = toIdx !== -1 ? toIdx : newLabels.length - 1
    if (sliderIndices.value[0] !== validIdx || sliderIndices.value[1] !== validIdx) {
      isUpdatingFromProp.value = true
      sliderIndices.value = [validIdx, validIdx]
      nextTick(() => {
        isUpdatingFromProp.value = false
      })
    }
  } else if (from && to) {
    let fromIdx = newLabels.indexOf(from)
    let toIdx = newLabels.indexOf(to)

    // If exact values not found, try to find closest match by year to preserve user selection
    if (fromIdx === -1 && from) {
      const fromYear = from.substring(0, 4)
      // First try exact year match
      const yearMatch = newLabels.find(l => l.startsWith(fromYear))
      if (yearMatch) {
        fromIdx = newLabels.indexOf(yearMatch)
      } else {
        // Find closest year
        const targetYear = parseInt(fromYear)
        const availableYears = Array.from(new Set(newLabels.map(l => parseInt(l.substring(0, 4)))))
        const closestYear = availableYears.reduce((prev, curr) =>
          Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
        )
        const closestLabel = newLabels.find(l => l.startsWith(closestYear.toString()))
        fromIdx = closestLabel ? newLabels.indexOf(closestLabel) : 0
      }
    }

    if (toIdx === -1 && to) {
      const toYear = to.substring(0, 4)
      // First try exact year match (prefer last label of that year)
      const yearMatches = newLabels.filter(l => l.startsWith(toYear))
      if (yearMatches.length > 0) {
        toIdx = newLabels.indexOf(yearMatches[yearMatches.length - 1]!)
      } else {
        // Find closest year
        const targetYear = parseInt(toYear)
        const availableYears = Array.from(new Set(newLabels.map(l => parseInt(l.substring(0, 4)))))
        const closestYear = availableYears.reduce((prev, curr) =>
          Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
        )
        const closestLabels = newLabels.filter(l => l.startsWith(closestYear.toString()))
        toIdx = closestLabels.length > 0 ? newLabels.indexOf(closestLabels[closestLabels.length - 1]!) : newLabels.length - 1
      }
    }

    if (fromIdx !== -1 && toIdx !== -1) {
      // Only update if indices actually changed
      if (sliderIndices.value[0] !== fromIdx || sliderIndices.value[1] !== toIdx) {
        isUpdatingFromProp.value = true
        sliderIndices.value = [fromIdx, toIdx]
        nextTick(() => {
          isUpdatingFromProp.value = false
        })
      }
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
      :min="0"
      :max="labels.length - 1"
      :step="1"
      :disabled="disabled"
      @update:model-value="handleSingleValueUpdate"
    />
    <USlider
      v-else
      v-model="sliderIndices"
      :min="0"
      :max="labels.length - 1"
      :step="1"
      :disabled="disabled"
    />
    <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{{ labels[0] }}</span>
      <span>{{ labels[labels.length - 1] }}</span>
    </div>
  </div>
</template>

<style scoped>
.date-slider-container {
  padding: 0.5rem 0;
}
</style>
