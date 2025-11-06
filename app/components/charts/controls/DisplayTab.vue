<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  // Boolean switches
  isExcess: boolean
  showBaseline: boolean
  showPredictionInterval: boolean
  showLabels: boolean
  showCaption: boolean
  maximize: boolean
  isLogarithmic: boolean
  showPercentage: boolean
  cumulative: boolean
  showTotal: boolean
  showLogo: boolean
  showQrCode: boolean
  // Disabled states
  isPopulationType: boolean
  showBaselineOption: boolean
  showPredictionIntervalOptionDisabled: boolean
  showMaximizeOptionDisabled: boolean
  showTotalOptionDisabled: boolean
  // Visibility flags
  showPredictionIntervalOption: boolean
  showMaximizeOption: boolean
  showLogarithmicOption: boolean
  showPercentageOption: boolean
  showCumulativeOption: boolean
  showTotalOption: boolean
  // Chart preset
  chartPreset?: { name: string, value: string, label: string, category: string }
  chartPresetOptions: { name: string, value: string, label: string, category: string }[]
}>()

const emit = defineEmits<{
  'update:isExcess': [value: boolean]
  'update:showBaseline': [value: boolean]
  'update:showPredictionInterval': [value: boolean]
  'update:showLabels': [value: boolean]
  'update:showCaption': [value: boolean]
  'update:maximize': [value: boolean]
  'update:isLogarithmic': [value: boolean]
  'update:showPercentage': [value: boolean]
  'update:cumulative': [value: boolean]
  'update:showTotal': [value: boolean]
  'update:showLogo': [value: boolean]
  'update:showQrCode': [value: boolean]
  'update:chartPreset': [value: { name: string, value: string, label: string, category: string } | undefined]
}>()

// Computed v-models
const isExcessModel = computed({
  get: () => props.isExcess,
  set: v => emit('update:isExcess', v)
})

const showBaselineModel = computed({
  get: () => props.showBaseline,
  set: v => emit('update:showBaseline', v)
})

const showPredictionIntervalModel = computed({
  get: () => props.showPredictionInterval,
  set: v => emit('update:showPredictionInterval', v)
})

const showLabelsModel = computed({
  get: () => props.showLabels,
  set: v => emit('update:showLabels', v)
})

const showCaptionModel = computed({
  get: () => props.showCaption,
  set: v => emit('update:showCaption', v)
})

const maximizeModel = computed({
  get: () => props.maximize,
  set: v => emit('update:maximize', v)
})

const isLogarithmicModel = computed({
  get: () => props.isLogarithmic,
  set: v => emit('update:isLogarithmic', v)
})

const showPercentageModel = computed({
  get: () => props.showPercentage,
  set: v => emit('update:showPercentage', v)
})

const cumulativeModel = computed({
  get: () => props.cumulative,
  set: v => emit('update:cumulative', v)
})

const showTotalModel = computed({
  get: () => props.showTotal,
  set: v => emit('update:showTotal', v)
})

const showLogoModel = computed({
  get: () => props.showLogo,
  set: v => emit('update:showLogo', v)
})

const showQrCodeModel = computed({
  get: () => props.showQrCode,
  set: v => emit('update:showQrCode', v)
})

const chartPresetModel = computed({
  get: () => props.chartPreset,
  set: v => emit('update:chartPreset', v)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Data Analysis Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Data Analysis
      </h3>
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Excess</label>
          <USwitch
            v-model="isExcessModel"
            :disabled="props.isPopulationType"
          />
          <UPopover>
            <UButton
              icon="i-lucide-info"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Excess mortality information"
            />
            <template #content>
              <div class="p-3 space-y-2 max-w-xs">
                <div class="text-xs text-gray-700 dark:text-gray-300">
                  Compares observed mortality to expected baseline. Positive values indicate more deaths than expected, negative values indicate fewer deaths.
                </div>
              </div>
            </template>
          </UPopover>
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <label class="text-sm font-medium whitespace-nowrap">Baseline</label>
          <USwitch
            v-model="showBaselineModel"
            :disabled="!props.showBaselineOption"
          />
          <UPopover>
            <UButton
              icon="i-lucide-info"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Baseline information"
            />
            <template #content>
              <div class="p-3 space-y-2 max-w-xs">
                <div class="text-xs text-gray-700 dark:text-gray-300">
                  Shows the expected mortality level used for comparison. Configure baseline period and method in the Baseline tab.
                </div>
              </div>
            </template>
          </UPopover>
        </div>

        <div
          v-if="props.showPredictionIntervalOption"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <label class="text-sm font-medium whitespace-nowrap">95% PI</label>
          <USwitch
            v-model="showPredictionIntervalModel"
            :disabled="props.showPredictionIntervalOptionDisabled"
          />
          <UPopover>
            <UButton
              icon="i-lucide-info"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Prediction interval information"
            />
            <template #content>
              <div class="p-3 space-y-2 max-w-xs">
                <div class="text-xs text-gray-700 dark:text-gray-300">
                  95% Prediction Interval shows the range of uncertainty around expected values. Values outside this range are statistically significant.
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
    </div>

    <!-- Data Transformation Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Data Transformation
      </h3>
      <div class="flex flex-wrap gap-4">
        <div
          v-if="props.showPercentageOption"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <label class="text-sm font-medium whitespace-nowrap">Percentage</label>
          <USwitch v-model="showPercentageModel" />
        </div>

        <div
          v-if="props.showCumulativeOption"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <label class="text-sm font-medium whitespace-nowrap">Cumulative</label>
          <USwitch v-model="cumulativeModel" />
        </div>

        <div
          v-if="props.showTotalOption"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <label class="text-sm font-medium whitespace-nowrap">Total</label>
          <USwitch
            v-model="showTotalModel"
            :disabled="props.showTotalOptionDisabled"
          />
        </div>

        <div
          v-if="props.showLogarithmicOption"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <label class="text-sm font-medium whitespace-nowrap">Log Scale</label>
          <USwitch
            v-model="isLogarithmicModel"
            :disabled="!props.showLogarithmicOption"
          />
        </div>
      </div>
    </div>

    <!-- Chart Presentation Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Chart Presentation
      </h3>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Show Labels</label>
            <USwitch v-model="showLabelsModel" />
          </div>

          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">Show Caption</label>
            <USwitch v-model="showCaptionModel" />
          </div>

          <div
            v-if="props.showMaximizeOption"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <label class="text-sm font-medium whitespace-nowrap">Maximize</label>
            <USwitch
              v-model="maximizeModel"
              :disabled="props.showMaximizeOptionDisabled"
            />
          </div>
        </div>

        <!-- Feature gate: Only Pro users can customize chart size -->
        <FeatureGate feature="CUSTOM_CHART_SIZE">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">
              Chart Size
              <FeatureBadge
                feature="CUSTOM_CHART_SIZE"
                class="ml-2"
              />
            </label>
            <UInputMenu
              v-model="chartPresetModel"
              :items="props.chartPresetOptions"
              placeholder="Select a size"
              size="sm"
              class="flex-1"
            />
          </div>
        </FeatureGate>
      </div>
    </div>

    <!-- Branding Section -->
    <div>
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Branding
      </h3>
      <div class="flex flex-wrap gap-4">
        <!-- Feature gate: Only Pro users can hide watermark -->
        <FeatureGate feature="HIDE_WATERMARK">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">
              Show Logo
              <FeatureBadge
                feature="HIDE_WATERMARK"
                class="ml-2"
              />
            </label>
            <USwitch v-model="showLogoModel" />
          </div>
        </FeatureGate>

        <!-- Feature gate: Only Pro users can hide QR code -->
        <FeatureGate feature="HIDE_QR">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <label class="text-sm font-medium whitespace-nowrap">
              Show QR Code
              <FeatureBadge
                feature="HIDE_QR"
                class="ml-2"
              />
            </label>
            <USwitch v-model="showQrCodeModel" />
          </div>
        </FeatureGate>
      </div>
    </div>
  </div>
</template>
