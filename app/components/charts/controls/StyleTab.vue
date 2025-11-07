<script setup lang="ts">
import { computed } from 'vue'
import MultiColorPicker from '../MultiColorPicker.vue'

const props = defineProps<{
  selectedChartStyle: { name: string, value: string, label: string }
  chartStylesWithLabels: { name: string, value: string, label: string }[]
  selectedDecimals: { name: string, value: string, label: string }
  decimalPrecisionsWithLabels: { name: string, value: string, label: string }[]
  colors: string[]
  isMatrixChartStyle: boolean
  isUpdating: boolean
  showLabels: boolean
  showCaption: boolean
  showLogo: boolean
  showQrCode: boolean
}>()

const emit = defineEmits<{
  'update:selectedChartStyle': [value: { name: string, value: string, label: string }]
  'update:selectedDecimals': [value: { name: string, value: string, label: string }]
  'colors-changed': [value: string[]]
  'update:showLabels': [value: boolean]
  'update:showCaption': [value: boolean]
  'update:showLogo': [value: boolean]
  'update:showQrCode': [value: boolean]
}>()

// Computed v-models
const showLabelsModel = computed({
  get: () => props.showLabels,
  set: v => emit('update:showLabels', v)
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
          <UInputMenu
            :model-value="props.selectedChartStyle"
            :items="props.chartStylesWithLabels"
            placeholder="Select the chart type"
            :disabled="props.isUpdating"
            size="sm"
            class="flex-1"
            @update:model-value="emit('update:selectedChartStyle', $event)"
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
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-4">
          <UiSwitchRow
            v-model="showLabelsModel"
            label="Show Labels"
          />
        </div>

        <!-- Feature gate: Only Pro users can customize number precision -->
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
              <UInputMenu
                :model-value="props.selectedDecimals"
                :items="props.decimalPrecisionsWithLabels"
                placeholder="Select decimal precision"
                :disabled="props.isUpdating"
                size="sm"
                class="flex-1"
                @update:model-value="emit('update:selectedDecimals', $event)"
              />
            </template>
          </UiControlRow>
        </FeatureGate>

        <div class="flex flex-wrap gap-4">
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
            <template #disabled>
              <UiControlRow>
                <template #default>
                  <div class="opacity-50 flex items-center gap-2">
                    <label class="text-sm font-medium whitespace-nowrap">
                      Show Caption
                      <FeatureBadge
                        feature="SHOW_CAPTION"
                        class="ml-2"
                      />
                    </label>
                    <USwitch
                      v-model="showCaptionModel"
                      disabled
                    />
                  </div>
                </template>
              </UiControlRow>
            </template>
          </FeatureGate>
        </div>
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
