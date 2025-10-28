<script setup lang="ts">
import { ref } from 'vue'
import DateSlider from '../DateSlider.vue'
import { specialColor } from '@/colors'
import type { ChartType } from '@/model/period'

// Feature access for tier-based features
const { can } = useFeatureAccess()

const props = defineProps<{
  selectedBaselineMethod: { name: string, value: string, label: string }
  baselineMethodsWithLabels: { name: string, value: string, label: string }[]
  baselineMethod: string
  baselineSliderValue: string[]
  labels: string[]
  chartType: string
  isUpdating: boolean
}>()

const emit = defineEmits<{
  'update:selectedBaselineMethod': [value: { name: string, value: string, label: string }]
  'baseline-slider-changed': [value: string[]]
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

const baselineSliderChanged = (values: string[]) => emit('baseline-slider-changed', values)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <label class="text-sm font-medium whitespace-nowrap">
        Method
      </label>
      <UInputMenu
        :model-value="props.selectedBaselineMethod"
        :items="props.baselineMethodsWithLabels"
        placeholder="Select Baseline Method"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
        @update:model-value="emit('update:selectedBaselineMethod', $event)"
      />
      <UPopover>
        <UButton
          icon="i-lucide-info"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Baseline method information"
        />
        <template #content>
          <div class="p-3 space-y-2 max-w-xs">
            <div class="text-xs text-gray-700 dark:text-gray-300">
              <strong>Last Value:</strong> Uses the final value from baseline period<br>
              <strong>Average:</strong> Mean of baseline period<br>
              <strong>Median:</strong> Median of baseline period<br>
              <strong>Linear Regression:</strong> Linear trend projection <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Free</span><br>
              <strong>Exponential Smoothing (ETS):</strong> Adaptive trend and seasonality <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Free</span>
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Feature upgrade hint for baseline methods -->
    <div
      v-if="!can('ALL_BASELINES')"
      class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
    >
      <p class="text-xs text-blue-700 dark:text-blue-300">
        <UIcon
          name="i-heroicons-information-circle"
          class="inline-block mr-1 size-3"
        />
        Register for free to unlock advanced baseline methods.
      </p>
    </div>

    <div
      v-if="props.selectedBaselineMethod"
      class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium">Period</label>
        <!-- Period Length Selection -->
        <div
          v-if="props.baselineMethod !== 'naive'"
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
          :slider-value="props.baselineSliderValue"
          :labels="props.labels"
          :chart-type="props.chartType as ChartType"
          :color="specialColor()"
          :min-range="baselineMinRange(props.baselineMethod)"
          :single-value="props.baselineMethod === 'naive'"
          :period-length="selectedPeriodLength?.value ?? 3"
          :delay-emit="true"
          @slider-changed="baselineSliderChanged"
        />
      </div>
    </div>
  </div>
</template>
