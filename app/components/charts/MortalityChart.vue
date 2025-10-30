<script lang="ts" setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
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
  decimals?: string
}>()

Chart.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
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
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
  if (props.chartStyle !== 'line') return undefined
  return makeBarLineChartConfig(
    props.data,
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo,
    props.decimals,
    isDark
  ) as unknown as ChartJSConfig<'line', (number | null)[]>
})

const barConfig = computed(() => {
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
  if (props.chartStyle !== 'bar') return undefined
  return makeBarLineChartConfig(
    props.data,
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo,
    props.decimals,
    isDark
  ) as unknown as ChartJSConfig<'bar', (number | null)[]>
})

const matrixConfig = computed(() => {
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
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
    props.showLogo,
    isDark,
    props.decimals
  ) as unknown as ChartJSConfig<'matrix', MatrixDataPoint[]>
})

// Watch for dark mode changes and update chart plugins
const lineChart = ref()
const barChart = ref()
const matrixChart = ref()

// Helper to get active chart
const getActiveChart = () => lineChart.value || barChart.value || matrixChart.value

// Watch for dark mode changes and update chart plugins
watch(() => colorMode.value, async () => {
  // Wait for next tick to ensure theme state has fully updated
  await nextTick()

  // Clear QR code cache to force regeneration with new theme colors
  clearQRCodeCache()

  // Force chart update to re-render plugins with new theme
  const activeChart = getActiveChart()
  if (activeChart?.chart) {
    activeChart.chart.update()
  }
})

// Setup ResizeObserver to force chart updates when container resizes
onMounted(() => {
  // Get the chart canvas container
  const chartCanvas = document.querySelector('#chart')
  if (!chartCanvas || !chartCanvas.parentElement) {
    return
  }

  const parentContainer = chartCanvas.parentElement

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const resizeObserver = new ResizeObserver(() => {
    // Debounce to avoid excessive updates
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      const activeChart = getActiveChart()
      if (activeChart?.chart) {
        activeChart.chart.resize()
      }
    }, 50)
  })

  resizeObserver.observe(parentContainer)

  // Cleanup
  onBeforeUnmount(() => {
    resizeObserver.disconnect()
    if (resizeTimeout) clearTimeout(resizeTimeout)
  })
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
