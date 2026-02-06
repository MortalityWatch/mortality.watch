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
  LogarithmicScale,
  TimeScale,
  Tooltip,
  Legend,
  Title,
  SubTitle,
  Filler
} from 'chart.js'
import { createTypedChart, Line, Bar } from 'vue-chartjs'
import {
  BarWithErrorBar,
  BarWithErrorBarsController
} from 'chartjs-chart-error-bars'
import annotationPlugin from 'chartjs-plugin-annotation'
import { getCustomDatalabelsPlugin } from '@/lib/chart/customDatalabelsPlugin'
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
import { shouldShowLabels, getDataPointCount } from '@/lib/chart/labelVisibility'

const props = defineProps<{
  chartStyle: ChartStyle
  data: MortalityChartData
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
  showTitle: boolean
  showLegend: boolean
  autoHideLegend: boolean
  showXAxisTitle: boolean
  showYAxisTitle: boolean
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
  LogarithmicScale,
  TimeScale,
  Tooltip,
  Legend,
  Title,
  SubTitle,
  Filler,
  BarWithErrorBar,
  getCustomDatalabelsPlugin(),
  annotationPlugin,
  MatrixController,
  MatrixElement,
  getLogoPlugin(),
  getQRCodePlugin()
)

createTypedChart(BarWithErrorBarsController.id, BarWithErrorBarsController)
const Matrix = createTypedChart('matrix', MatrixController)

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Get user tier for feature gating (logo/QR visibility)
const { tier } = useAuth()

// Track chart width for auto-hide label logic
const chartWidth = ref<number>(800)

// Calculate effective label visibility based on data density
// When showLabels is true: apply auto-hide logic based on data density
// When showLabels is false: always hide labels (user override)
const effectiveShowLabels = computed(() => {
  const dataPointCount = getDataPointCount(props.data.labels)

  // Pass undefined when true (enables auto-calculation), false when false (forces hide)
  const userPreference = props.showLabels ? undefined : false

  return shouldShowLabels(dataPointCount, chartWidth.value, userPreference)
})

// Make configs reactive so they update when props OR theme changes
const lineConfig = computed(() => {
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
  if (props.chartStyle !== 'line') return undefined
  return makeBarLineChartConfig(
    { ...props.data, showLabels: effectiveShowLabels.value, showLogarithmic: props.showLogarithmic },
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo,
    props.decimals,
    isDark,
    tier.value, // userTier: enforce logo/QR visibility based on viewer's tier
    props.showCaption,
    props.showTitle,
    false, // isSSR
    'line',
    props.showLegend,
    props.showXAxisTitle,
    props.showYAxisTitle,
    props.autoHideLegend
  ) as unknown as ChartJSConfig<'line', (number | null)[]>
})

const barConfig = computed(() => {
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
  if (props.chartStyle !== 'bar') return undefined
  return makeBarLineChartConfig(
    { ...props.data, showLabels: effectiveShowLabels.value, showLogarithmic: props.showLogarithmic },
    props.isExcess,
    props.showPredictionInterval,
    props.showPercentage,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo,
    props.decimals,
    isDark,
    tier.value, // userTier: enforce logo/QR visibility based on viewer's tier
    props.showCaption,
    props.showTitle,
    false, // isSSR
    'bar',
    props.showLegend,
    props.showXAxisTitle,
    props.showYAxisTitle,
    props.autoHideLegend
  ) as unknown as ChartJSConfig<'bar', (number | null)[]>
})

const matrixConfig = computed(() => {
  // Pass isDark to config so text colors update with theme
  const isDark = colorMode.value === 'dark'
  if (props.chartStyle !== 'matrix') return undefined
  return makeMatrixChartConfig(
    { ...props.data, showLabels: effectiveShowLabels.value },
    props.isExcess,
    props.isLifeExpectancyType,
    props.showPredictionInterval,
    props.showPercentage,
    effectiveShowLabels.value,
    props.isDeathsType,
    props.isPopulationType,
    props.showQrCode,
    props.showLogo,
    isDark,
    props.decimals,
    tier.value, // userTier: enforce logo/QR visibility based on viewer's tier
    props.showCaption,
    props.showTitle,
    false, // isSSR
    props.showLegend,
    props.showXAxisTitle,
    props.showYAxisTitle,
    props.autoHideLegend
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
onMounted(async () => {
  // Wait for vue-chartjs to finish rendering and container layout to settle
  await nextTick()

  // Get the chart canvas container
  const chartCanvas = document.querySelector('#chart')
  if (!chartCanvas || !chartCanvas.parentElement) {
    return
  }

  const parentContainer = chartCanvas.parentElement

  // Wait for container to have a non-zero width (layout may not have settled
  // after client-side navigation, e.g. after login redirect)
  let retries = 0
  while (parentContainer.offsetWidth === 0 && retries < 10) {
    await new Promise(resolve => requestAnimationFrame(resolve))
    retries++
  }

  // Update initial chart width for auto-hide label logic
  chartWidth.value = parentContainer.offsetWidth || 800

  // Force chart to recalculate size from container (fixes default 300x150 canvas)
  const activeChart = getActiveChart()
  if (activeChart?.chart) {
    activeChart.chart.resize()
  }

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const resizeObserver = new ResizeObserver(() => {
    // Update chart width for auto-hide label logic
    const newWidth = parentContainer?.offsetWidth || 800
    if (newWidth !== chartWidth.value) {
      chartWidth.value = newWidth
    }

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
    v-if="props.chartStyle === 'line' && lineConfig?.data"
    id="chart"
    ref="lineChart"
    :data="lineConfig.data"
    :options="lineConfig.options"
  />
  <Bar
    v-else-if="props.chartStyle === 'bar' && barConfig?.data"
    id="chart"
    ref="barChart"
    :data="barConfig.data"
    :options="barConfig.options"
  />
  <Matrix
    v-else-if="props.chartStyle === 'matrix' && matrixConfig?.data"
    id="chart"
    ref="matrixChart"
    :data="matrixConfig.data"
    :options="matrixConfig.options"
  />
</template>
