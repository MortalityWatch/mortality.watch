<script setup lang="ts">
import { ref } from 'vue'
import MortalityChart from '@/components/charts/MortalityChart.vue'
import type { ChartStyle, MortalityChartData } from '@/lib/chart/chartTypes'
import { isMobile } from '@/utils'

const props = defineProps<{
  countries: string[]
  chartData?: MortalityChartData
  chartStyle: ChartStyle
  isExcess: boolean
  isLifeExpectancyType: boolean
  showPredictionInterval: boolean
  showPercentage: boolean
  showLabels: boolean
  showLogarithmic: boolean
  isDeathsType: boolean
  isPopulationType: boolean
  showLogo: boolean
  showQrCode: boolean
  showCaption: boolean
  decimals: string
  showLoadingOverlay: boolean
  showSizeLabel: boolean
  containerSize: string
  hasBeenResized: boolean
  isCustomMode: boolean
}>()

// Ref to the actual DOM element for ResizeObserver
const chartWrapperElement = ref<HTMLElement | null>(null)

defineExpose({
  // Expose the actual DOM element to parent for ResizeObserver
  chartWrapperElement
})
</script>

<template>
  <UCard
    class="chart-card"
    :class="{ 'chart-card-resizable': !isMobile(), 'chart-card-resized': props.hasBeenResized, 'chart-card-custom': props.isCustomMode }"
    :ui="{ body: 'p-0' }"
    data-tour="chart-visualization"
  >
    <div
      ref="chartWrapperElement"
      class="chart-wrapper relative"
      :class="{ 'resizable': !isMobile(), 'auto-mode': !props.hasBeenResized, 'custom-mode': props.isCustomMode }"
    >
      <!-- Glass overlay for loading (only shown after 500ms delay) -->
      <GlassOverlay
        v-if="props.showLoadingOverlay && props.chartData"
        title="Loading data..."
      />
      <div
        v-if="props.showSizeLabel"
        class="size-label"
      >
        {{ props.containerSize }}
      </div>
      <div
        v-if="props.countries.length === 0"
        class="banner"
      >
        <p>Please select a country.</p>
      </div>
      <MortalityChart
        v-if="props.countries.length > 0 && props.chartData"
        :chart-style="props.chartStyle"
        :data="props.chartData"
        :is-excess="props.isExcess"
        :is-life-expectancy-type="props.isLifeExpectancyType"
        :show-prediction-interval="props.showPredictionInterval"
        :show-percentage="props.showPercentage"
        :show-labels="props.showLabels"
        :show-logarithmic="props.showLogarithmic"
        :is-deaths-type="props.isDeathsType"
        :is-population-type="props.isPopulationType"
        :show-logo="props.showLogo"
        :show-qr-code="props.showQrCode"
        :show-caption="props.showCaption"
        :decimals="props.decimals"
      />
    </div>
  </UCard>
</template>

<style scoped>
.chart-card {
  aspect-ratio: 16/10;
  overflow: hidden;
}

.chart-card :deep(.p-4) {
  padding: 0 !important;
}

.chart-card :deep([class*="p-"]) {
  padding: 0 !important;
}

.chart-card.chart-card-resizable {
  aspect-ratio: unset;
  height: 100%;
  overflow: hidden; /* Default to hidden */
}

/* In Custom mode, allow overflow so resize handle is visible */
.chart-card.chart-card-custom {
  overflow: visible !important;
}

@media (min-width: 1280px) {
  .chart-card.chart-card-resizable {
    max-height: none; /* Remove max-height to prevent clipping */
  }
}

.chart-card.chart-card-resizable.chart-card-resized {
  width: fit-content;
  min-width: 0; /* Allow shrinking */
}

/* In Auto mode, chart card should be flexible */
.chart-card.chart-card-resizable:not(.chart-card-resized) {
  width: 100%;
  min-width: 0;
  max-width: 100%; /* Ensure it doesn't exceed parent */
}

/* Ensure UCard body can shrink */
.chart-card :deep(.overflow-hidden) {
  min-width: 0;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-wrapper.resizable {
  min-width: v-bind('400 + "px"');
  min-height: v-bind('300 + "px"');
}

/* Preset mode - fixed height, no resize handle */
.chart-wrapper.resizable:not(.auto-mode):not(.custom-mode) {
  height: 55vh;
  width: 100%;
  overflow: hidden; /* No scrollbars for presets */
  resize: none; /* No resize handle for presets */
}

/* Custom mode - allow resizing */
.chart-wrapper.resizable.custom-mode {
  height: 55vh;
  width: 100%;
  overflow: auto; /* Enable resize handle without forcing scrollbars */
  resize: both; /* Show resize handle only in Custom mode */
}

/* Hide scrollbars in custom mode - they're not needed, just the resize handle */
.chart-wrapper.resizable.custom-mode::-webkit-scrollbar {
  display: none;
}
.chart-wrapper.resizable.custom-mode {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* Auto mode - responsive with aspect ratio, no resize handle */
.chart-wrapper.resizable.auto-mode {
  width: 100%;
  max-width: 100%;
  height: auto; /* Override fixed height */
  min-width: 0; /* Allow shrinking below default min-width */
  min-height: 0; /* Allow shrinking below default min-height */
  aspect-ratio: 1 / 1; /* Mobile: square for vertical space */
  overflow: hidden; /* No scrollbars or resize handle in Auto mode */
  resize: none; /* Hide resize handle in Auto mode */
}

/* sm: tablet portrait - slightly wider */
@media (min-width: 640px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 4 / 3;
  }
}

/* md: tablet landscape - standard widescreen */
@media (min-width: 768px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 16 / 9;
  }
}

/* lg: desktop - 16:10 aspect ratio */
@media (min-width: 1024px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 16 / 10;
  }
}

/* xl: large desktop - 2:1 aspect ratio */
@media (min-width: 1280px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 2 / 1;
  }
}

/* 2xl: ultra-wide desktop - 21:9 for time series */
@media (min-width: 1536px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 21 / 9;
  }
}

.size-label {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: rgb(107 114 128);
}
</style>
