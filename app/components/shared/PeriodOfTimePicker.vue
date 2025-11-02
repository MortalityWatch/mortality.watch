<script setup lang="ts">
import { computed } from 'vue'
import { chartTypes } from '@/model'

const props = defineProps<{
  modelValue: { label: string, name: string, value: string }
  isUpdating?: boolean
  items?: Array<{ label: string, name: string, value: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { label: string, name: string, value: string }]
}>()

// Use provided items or default to all chart types
const chartTypesWithLabels = computed(() => {
  const items = props.items || chartTypes
  return items.map((t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (t as any).label || t.name
    return {
      name: t.name,
      value: t.value,
      label
    }
  })
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    data-tour="period-of-time"
  >
    <label
      class="text-sm font-medium whitespace-nowrap"
      for="periodOfTime"
    >
      Period of Time
    </label>
    <UInputMenu
      id="periodOfTime"
      v-model="selectedValue"
      :items="chartTypesWithLabels"
      placeholder="Select the period of time"
      :disabled="props.isUpdating"
      size="sm"
      class="flex-1"
    />
  </div>
</template>
