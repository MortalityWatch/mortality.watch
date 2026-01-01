<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      v-for="region in regions"
      :key="region.value"
      :variant="modelValue === region.value ? 'solid' : 'outline'"
      :color="modelValue === region.value ? 'primary' : 'neutral'"
      size="sm"
      @click="$emit('update:modelValue', region.value)"
    >
      {{ region.label }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { regionFilters } from '@/lib/discover/constants'

interface Props {
  modelValue: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: string]
}>()

const regions = regionFilters
</script>
