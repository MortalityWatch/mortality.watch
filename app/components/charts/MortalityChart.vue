<script lang="ts" setup>
import { computed, ref, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { createTypedChart, Line, Bar } from 'vue-chartjs'
import {
  BarWithErrorBar,
  BarWithErrorBarsController
} from 'chartjs-chart-error-bars'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type {
  MatrixDataPoint } from 'chartjs-chart-matrix'
import {
  MatrixController,
  MatrixElement
} from 'chartjs-chart-matrix'
import {
  makeBarLineChartConfig,
  makeMatrixChartConfig
} from '@/lib/chart/chartConfig'
import type {
  ChartJSConfig,
  ChartStyle,
  MortalityChartData
} from '@/lib/chart/chartTypes'
import { getLogoPlugin } from '@/lib/chart/logoPlugin'
import { getQRCodePlugin, clearQRCodeCache } from '@/lib/chart/qrCodePlugin'

const props = defineProps<{
  chartStyle: ChartStyle
  data: MortalityChartData
  isExcess: boolean
  isLifeExpectancyType: boolean
  showPredictionInterval: boolean
  showPercentage: boolean
  showLabels: boolean
  isDeathsType: boolean
  isPopulationType: boolean
  showLogo: boolean
  showQrCode: boolean
}>()

Chart.register(
  ...registerables,
  BarWithErrorBar,
  ChartDataLabels,
  MatrixController,
  MatrixElement,
  getLogoPlugin(),
  getQRCodePlugin()
)

createTypedChart(BarWithErrorBarsController.id, BarWithErrorBarsController)
const Matrix = createTypedChart('matrix', MatrixController)

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Make configs reactive so they update when props OR theme changes
const lineConfig = computed(() => {
  // Add colorMode.value as dependency to make this reactive to theme changes
  const _theme = colorMode.value
  if (props.chartStyle !== 'line') return undefined
  return makeBarLineChartConfig(
    props.data,
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo
  ) as unknown as ChartJSConfig<'line', (number | null)[]>
})

const barConfig = computed(() => {
  // Add colorMode.value as dependency to make this reactive to theme changes
  const _theme = colorMode.value
  if (props.chartStyle !== 'bar') return undefined
  return makeBarLineChartConfig(
    props.data,
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo
  ) as unknown as ChartJSConfig<'bar', (number | null)[]>
})

const matrixConfig = computed(() => {
  // Add colorMode.value as dependency to make this reactive to theme changes
  const _theme = colorMode.value
  if (props.chartStyle !== 'matrix') return undefined
  return makeMatrixChartConfig(
    props.data,
    props.isExcess,
    props.isLifeExpectancyType,
    props.showPredictionInterval,
    props.showPercentage,
    props.showLabels,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo
  ) as unknown as ChartJSConfig<'matrix', MatrixDataPoint[]>
})

// Watch for dark mode changes and update chart plugins
const lineChart = ref()
const barChart = ref()
const matrixChart = ref()

watch(() => colorMode.value, async (newValue, oldValue) => {
  console.log('[MortalityChart] Color mode changed:', { oldValue, newValue })

  // Wait for next tick to ensure theme state has fully updated
  await nextTick()

  console.log('[MortalityChart] After nextTick, colorMode.value:', colorMode.value)

  // Clear QR code cache to force regeneration with new theme colors
  clearQRCodeCache()
  console.log('[MortalityChart] QR code cache cleared')

  // Force chart update to re-render plugins with new theme
  // Check which chart type is currently active and update it
  const activeChart = lineChart.value || barChart.value || matrixChart.value
  if (activeChart?.chart) {
    console.log('[MortalityChart] Updating chart...')
    activeChart.chart.update()
    console.log('[MortalityChart] Chart updated')
  } else {
    console.log('[MortalityChart] No active chart found!')
  }
})
</script>

<template>
  <Line
    v-if="lineConfig?.data"
    id="chart"
    ref="lineChart"
    :data="lineConfig.data"
    :options="lineConfig.options"
  />
  <Bar
    v-if="barConfig?.data"
    id="chart"
    ref="barChart"
    :data="barConfig.data"
    :options="barConfig.options"
  />
  <Matrix
    v-if="matrixConfig?.data"
    id="chart"
    ref="matrixChart"
    :data="matrixConfig.data"
    :options="matrixConfig.options"
  />
</template>
