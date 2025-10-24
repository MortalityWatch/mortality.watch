<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

const props = defineProps<{
  sliderValue: string[]
  labels: string[]
  color: string
  minRange: number
  disabled?: boolean
}>()
const emit = defineEmits(['sliderChanged'])

const sliderIndices = ref<number[]>([0, props.labels.length - 1])
const isUpdatingFromProp = ref(false)

// Watch for label changes (e.g., when sliderStart changes)
watch(() => props.labels, (newLabels) => {
  if (!newLabels || newLabels.length === 0) return

  // Update slider indices based on current sliderValue
  const from = props.sliderValue[0]
  const to = props.sliderValue[1]
  if (from && to) {
    const fromIdx = newLabels.indexOf(from)
    const toIdx = newLabels.indexOf(to)
    if (fromIdx !== -1 && toIdx !== -1) {
      // Only update if indices actually changed
      if (sliderIndices.value[0] !== fromIdx || sliderIndices.value[1] !== toIdx) {
        isUpdatingFromProp.value = true
        sliderIndices.value = [fromIdx, toIdx]
        nextTick(() => {
          isUpdatingFromProp.value = false
        })
      }
    } else {
      // If current values aren't in new labels, reset to full range
      isUpdatingFromProp.value = true
      sliderIndices.value = [0, newLabels.length - 1]
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

// Convert indices back to string values when user changes slider
watch(sliderIndices, (newIndices) => {
  if (isUpdatingFromProp.value) {
    return // Don't emit if we're just updating from props
  }

  const idx0 = newIndices[0]
  const idx1 = newIndices[1]
  const values = [
    (idx0 !== undefined ? props.labels[idx0] : undefined) || props.labels[0] || '',
    (idx1 !== undefined ? props.labels[idx1] : undefined) || props.labels[props.labels.length - 1] || ''
  ]
  emit('sliderChanged', values)
})

// Display current values
const currentRange = computed(() => {
  const from = props.sliderValue[0]
  const to = props.sliderValue[1]
  return `${from} - ${to}`
})
</script>

<template>
  <div
    class="date-slider-container"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <div class="mb-2 text-center text-sm font-medium">
      {{ currentRange }}
    </div>
    <USlider
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
