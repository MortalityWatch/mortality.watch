<script setup lang="ts">
import MultiColorPicker from '../MultiColorPicker.vue'

const props = defineProps<{
  selectedChartStyle: { name: string, value: string, label: string }
  chartStylesWithLabels: { name: string, value: string, label: string }[]
  selectedDecimals: { name: string, value: string, label: string }
  decimalPrecisionsWithLabels: { name: string, value: string, label: string }[]
  colors: string[]
  isMatrixChartStyle: boolean
  isUpdating: boolean
}>()

const emit = defineEmits<{
  'update:selectedChartStyle': [value: { name: string, value: string, label: string }]
  'update:selectedDecimals': [value: { name: string, value: string, label: string }]
  'colors-changed': [value: string[]]
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <label class="text-sm font-medium whitespace-nowrap">Chart Type</label>
      <UInputMenu
        :model-value="props.selectedChartStyle"
        :items="props.chartStylesWithLabels"
        placeholder="Select the chart type"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
        @update:model-value="emit('update:selectedChartStyle', $event)"
      />
    </div>

    <!-- Feature gate: Only Pro users can customize number precision -->
    <FeatureGate feature="CUSTOM_DECIMALS">
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <label class="text-sm font-medium whitespace-nowrap">
          Number Precision
          <FeatureBadge
            feature="CUSTOM_DECIMALS"
            class="ml-2"
          />
        </label>
        <UInputMenu
          :model-value="props.selectedDecimals"
          :items="props.decimalPrecisionsWithLabels"
          placeholder="Select decimal precision"
          :disabled="props.isUpdating"
          size="sm"
          class="flex-1"
          @update:model-value="emit('update:selectedDecimals', $event)"
        />
      </div>
    </FeatureGate>

    <!-- Feature gate: Only registered users can customize colors -->
    <FeatureGate feature="CUSTOM_COLORS">
      <div
        v-if="!props.isMatrixChartStyle"
        class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
      >
        <label class="block mb-2 text-sm font-medium">
          Colors
          <FeatureBadge
            feature="CUSTOM_COLORS"
            class="ml-2"
          />
        </label>
        <div class="overflow-x-auto">
          <MultiColorPicker
            :colors="props.colors || []"
            @colors-changed="(val) => emit('colors-changed', val)"
          />
        </div>
      </div>
    </FeatureGate>
  </div>
</template>
