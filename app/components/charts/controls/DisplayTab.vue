<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  // Boolean switches
  isExcess: boolean
  showBaseline: boolean
  showPredictionInterval: boolean
  maximize: boolean
  isLogarithmic: boolean
  showPercentage: boolean
  cumulative: boolean
  showTotal: boolean
  showLogo: boolean
  showQrCode: boolean
  showZScores?: boolean
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
  showZScoresOption?: boolean
  // Chart preset
  chartPreset?: { name: string, value: string, label: string, category: string }
  chartPresetOptions: { name: string, value: string, label: string, category: string }[]
}>()

const emit = defineEmits<{
  'update:isExcess': [value: boolean]
  'update:showBaseline': [value: boolean]
  'update:showPredictionInterval': [value: boolean]
  'update:maximize': [value: boolean]
  'update:isLogarithmic': [value: boolean]
  'update:showPercentage': [value: boolean]
  'update:cumulative': [value: boolean]
  'update:showTotal': [value: boolean]
  'update:showLogo': [value: boolean]
  'update:showQrCode': [value: boolean]
  'update:showZScores': [value: boolean]
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

const showZScoresModel = computed({
  get: () => props.showZScores || false,
  set: v => emit('update:showZScores', v)
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
        <UiSwitchRow
          v-model="isExcessModel"
          label="Excess"
          :disabled="props.isPopulationType"
          test-id="excess-toggle"
          help-content="Compares observed mortality to expected baseline. Positive values indicate more deaths than expected, negative values indicate fewer deaths."
        />

        <UiSwitchRow
          v-model="showBaselineModel"
          label="Baseline"
          :disabled="!props.showBaselineOption"
          help-content="Shows the expected mortality level used for comparison. Configure baseline period and method in the Baseline tab."
        />

        <UiSwitchRow
          v-if="props.showPredictionIntervalOption"
          v-model="showPredictionIntervalModel"
          label="95% PI"
          :disabled="props.showPredictionIntervalOptionDisabled"
          help-content="95% Prediction Interval shows the range of uncertainty around expected values. Values outside this range are statistically significant."
        />

        <FeatureGate
          v-if="props.showZScoresOption"
          feature="Z_SCORES"
        >
          <UiSwitchRow
            v-model="showZScoresModel"
            label="Z-Scores"
            help-content="Shows how many standard deviations each value is from the baseline mean. Values beyond ±2 are statistically significant (95% confidence)."
            feature="Z_SCORES"
          />
          <template #disabled>
            <UiSwitchRow
              v-model="showZScoresModel"
              label="Z-Scores"
              disabled
              feature="Z_SCORES"
            />
          </template>
        </FeatureGate>
      </div>
    </div>

    <!-- Data Transformation Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Data Transformation
      </h3>
      <div class="flex flex-wrap gap-4">
        <UiSwitchRow
          v-if="props.showPercentageOption"
          v-model="showPercentageModel"
          label="Percentage"
        />

        <UiSwitchRow
          v-if="props.showCumulativeOption"
          v-model="cumulativeModel"
          label="Cumulative"
        />

        <UiSwitchRow
          v-if="props.showTotalOption"
          v-model="showTotalModel"
          label="Total"
          :disabled="props.showTotalOptionDisabled"
        />

        <UiSwitchRow
          v-if="props.showLogarithmicOption"
          v-model="isLogarithmicModel"
          label="Log Scale"
          :disabled="!props.showLogarithmicOption"
        />
      </div>
    </div>

    <!-- Chart Size Section -->
    <div>
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Chart Size
      </h3>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-4">
          <UiSwitchRow
            v-if="props.showMaximizeOption"
            v-model="maximizeModel"
            label="Maximize"
            :disabled="props.showMaximizeOptionDisabled"
          />
        </div>

        <!-- Feature gate: Only Pro users can customize chart size -->
        <FeatureGate feature="CUSTOM_CHART_SIZE">
          <UiControlRow>
            <template #default>
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
            </template>
          </UiControlRow>
        </FeatureGate>
      </div>
    </div>
  </div>
</template>
