<script setup lang="ts">
import { ref } from 'vue'
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
  { label: '2 years', value: 2 },
  { label: '3 years', value: 3 },
  { label: '5 years', value: 5 },
  { label: '10 years', value: 10 },
  { label: 'Custom', value: 0 }
]

const selectedPeriodLength = ref(periodLengthOptions.find(o => o.value === 3) || periodLengthOptions[0])

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
