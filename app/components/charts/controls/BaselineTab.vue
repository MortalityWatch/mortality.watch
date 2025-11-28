<script setup lang="ts">
import type { ChartType } from '@/model/period'
import BaselineMethodPicker from '@/components/shared/BaselineMethodPicker.vue'
import BaselinePeriodPicker from '@/components/shared/BaselinePeriodPicker.vue'

const props = defineProps<{
  selectedBaselineMethod: string
  baselineMethodsWithLabels: { name: string, value: string, label: string, disabled?: boolean }[]
  baselineMethod: string
  baselineSliderValue: string[]
  labels: string[]
  chartType: string
  isUpdating: boolean
}>()

const emit = defineEmits<{
  'update:selectedBaselineMethod': [value: string]
  'baseline-slider-changed': [value: string[]]
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <BaselineMethodPicker
      :model-value="props.selectedBaselineMethod"
      :items="props.baselineMethodsWithLabels"
      :is-updating="props.isUpdating"
      @update:model-value="emit('update:selectedBaselineMethod', $event)"
    />

    <BaselinePeriodPicker
      v-if="props.selectedBaselineMethod"
      :baseline-method="props.baselineMethod"
      :slider-value="props.baselineSliderValue"
      :labels="props.labels"
      :chart-type="props.chartType as ChartType"
      :show-period-length="true"
      @slider-changed="emit('baseline-slider-changed', $event)"
    />
  </div>
</template>
