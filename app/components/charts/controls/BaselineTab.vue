<script setup lang="ts">
import { computed } from 'vue'
import type { ChartType } from '@/model/period'
import BaselineMethodPicker from '@/components/shared/BaselineMethodPicker.vue'
import BaselinePeriodPicker from '@/components/shared/BaselinePeriodPicker.vue'
import { zscoreMethodItems, zscoreLambdaModeItems } from '@/model'

const props = defineProps<{
  selectedBaselineMethod: string
  baselineMethodsWithLabels: { name: string, value: string, label: string, disabled?: boolean }[]
  baselineMethod: string
  baselineSliderValue: string[]
  labels: string[]
  chartType: string
  isUpdating: boolean
  view: string
  zscoreMethod: string
  zscoreLambdaMode: string
  zscoreLambda?: string
}>()

const emit = defineEmits<{
  'update:selectedBaselineMethod': [value: string]
  'baseline-slider-changed': [value: string[]]
  'update:zscoreMethod': [value: string]
  'update:zscoreLambdaMode': [value: string]
  'update:zscoreLambda': [value: string]
}>()

const showZScoreControls = computed(() => props.view === 'zscore')
const isManualLambda = computed(() =>
  props.zscoreMethod === 'variance_stabilized' && props.zscoreLambdaMode === 'manual'
)
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

    <template v-if="showZScoreControls">
      <UiControlRow label="Z-Score Method">
        <USelect
          :model-value="props.zscoreMethod"
          :items="zscoreMethodItems"
          value-key="value"
          size="sm"
          class="flex-1"
          :disabled="props.isUpdating"
          @update:model-value="emit('update:zscoreMethod', $event)"
        />
      </UiControlRow>

      <UiControlRow
        v-if="props.zscoreMethod === 'variance_stabilized'"
        label="Lambda Mode"
      >
        <USelect
          :model-value="props.zscoreLambdaMode"
          :items="zscoreLambdaModeItems"
          value-key="value"
          size="sm"
          class="flex-1"
          :disabled="props.isUpdating"
          @update:model-value="emit('update:zscoreLambdaMode', $event)"
        />
      </UiControlRow>

      <UiControlRow
        v-if="isManualLambda"
        label="Manual Lambda"
      >
        <UInput
          :model-value="props.zscoreLambda ?? ''"
          type="number"
          step="0.1"
          min="-5"
          max="5"
          class="flex-1"
          :disabled="props.isUpdating"
          @update:model-value="emit('update:zscoreLambda', String($event ?? ''))"
        />
        <template #help>
          <div class="text-xs text-gray-700 dark:text-gray-300">
            Box-Cox lambda used for variance stabilization.
          </div>
        </template>
      </UiControlRow>
    </template>
  </div>
</template>
