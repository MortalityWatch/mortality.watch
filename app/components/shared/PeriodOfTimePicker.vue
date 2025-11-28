<script setup lang="ts">
import { computed } from 'vue'
import { chartTypes } from '@/model'

const props = defineProps<{
  modelValue: string
  isUpdating?: boolean
  items?: Array<{ label: string, name: string, value: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
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
  <UiControlRow
    label="Period of Time"
    data-tour="period-of-time"
  >
    <USelect
      id="periodOfTime"
      v-model="selectedValue"
      :items="chartTypesWithLabels"
      value-key="value"
      placeholder="Select the period of time"
      :disabled="props.isUpdating"
      size="sm"
      class="flex-1"
    />
  </UiControlRow>
</template>
