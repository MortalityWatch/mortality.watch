<script setup lang="ts">
import { computed } from 'vue'
import MultiColorPicker from '../MultiColorPicker.vue'

const props = defineProps<{
  selectedChartStyle: string
  chartStylesWithLabels: { name: string, value: string, label: string }[]
  selectedDecimals: string
  decimalPrecisionsWithLabels: { name: string, value: string, label: string }[]
  colors: string[]
  isMatrixChartStyle: boolean
  isUpdating: boolean
  showLabels: boolean
  showTitle: boolean
  showCaption: boolean
  showLogo: boolean
  showQrCode: boolean
}>()

const emit = defineEmits<{
  'update:selectedChartStyle': [value: string]
  'update:selectedDecimals': [value: string]
  'colors-changed': [value: string[]]
  'update:showLabels': [value: boolean]
  'update:showTitle': [value: boolean]
  'update:showCaption': [value: boolean]
  'update:showLogo': [value: boolean]
  'update:showQrCode': [value: boolean]
}>()

// Computed v-models
const showLabelsModel = computed({
  get: () => props.showLabels,
  set: v => emit('update:showLabels', v)
})

const showTitleModel = computed({
  get: () => props.showTitle,
  set: v => emit('update:showTitle', v)
})

const showCaptionModel = computed({
  get: () => props.showCaption,
  set: v => emit('update:showCaption', v)
})

const showLogoModel = computed({
  get: () => props.showLogo,
  set: v => emit('update:showLogo', v)
})

const showQrCodeModel = computed({
  get: () => props.showQrCode,
  set: v => emit('update:showQrCode', v)
})

const selectedChartStyleModel = computed({
  get: () => props.selectedChartStyle,
  set: v => emit('update:selectedChartStyle', v)
})

const selectedDecimalsModel = computed({
  get: () => props.selectedDecimals,
  set: v => emit('update:selectedDecimals', v)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Visual Appearance Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Visual Appearance
      </h3>
      <div class="flex flex-col gap-4">
        <UiControlRow label="Chart Type">
          <USelect
            v-model="selectedChartStyleModel"
            :items="props.chartStylesWithLabels"
            value-key="value"
            placeholder="Select the chart type"
            :disabled="props.isUpdating"
            size="sm"
            class="flex-1"
          />
        </UiControlRow>

        <!-- Feature gate: Only registered users can customize colors -->
        <FeatureGate feature="CUSTOM_COLORS">
          <UiControlRow v-if="!props.isMatrixChartStyle">
            <template #default>
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
            </template>
          </UiControlRow>
        </FeatureGate>
      </div>
    </div>

    <!-- Text & Labels Section -->
    <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-primary-500 rounded-full" />
        Text &amp; Labels
      </h3>
      <div class="flex flex-wrap gap-4">
        <!-- Feature gate: Only Pro users can hide title -->
        <FeatureGate feature="HIDE_TITLE">
          <UiControlRow>
            <template #default>
              <label class="text-sm font-medium whitespace-nowrap">
                Show Title
                <FeatureBadge
                  feature="HIDE_TITLE"
                  class="ml-2"
                />
              </label>
              <USwitch v-model="showTitleModel" />
            </template>
          </UiControlRow>
        </FeatureGate>

        <!-- Feature gate: Only Pro users can show caption -->
        <FeatureGate feature="SHOW_CAPTION">
          <UiControlRow>
            <template #default>
              <label class="text-sm font-medium whitespace-nowrap">
                Show Caption
                <FeatureBadge
                  feature="SHOW_CAPTION"
                  class="ml-2"
                />
              </label>
              <USwitch v-model="showCaptionModel" />
            </template>
          </UiControlRow>
        </FeatureGate>

        <UiSwitchRow
          v-model="showLabelsModel"
          label="Show Labels"
        />
      </div>

      <!-- Feature gate: Only Pro users can customize number precision -->
      <div class="mt-4">
        <FeatureGate feature="CUSTOM_DECIMALS">
          <UiControlRow>
            <template #default>
              <label class="text-sm font-medium whitespace-nowrap">
                Number Precision
                <FeatureBadge
                  feature="CUSTOM_DECIMALS"
                  class="ml-2"
                />
              </label>
              <USelect
                v-model="selectedDecimalsModel"
                :items="props.decimalPrecisionsWithLabels"
                value-key="value"
                placeholder="Select decimal precision"
                :disabled="props.isUpdating"
                size="sm"
                class="flex-1"
              />
            </template>
          </UiControlRow>
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
          <UiControlRow>
            <template #default>
              <label class="text-sm font-medium whitespace-nowrap">
                Show Logo
                <FeatureBadge
                  feature="HIDE_WATERMARK"
                  class="ml-2"
                />
              </label>
              <USwitch v-model="showLogoModel" />
            </template>
          </UiControlRow>
        </FeatureGate>

        <!-- Feature gate: Only Pro users can hide QR code -->
        <FeatureGate feature="HIDE_QR">
          <UiControlRow>
            <template #default>
              <label class="text-sm font-medium whitespace-nowrap">
                Show QR Code
                <FeatureBadge
                  feature="HIDE_QR"
                  class="ml-2"
                />
              </label>
              <USwitch v-model="showQrCodeModel" />
            </template>
          </UiControlRow>
        </FeatureGate>
      </div>
    </div>
  </div>
</template>
