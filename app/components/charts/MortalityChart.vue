<script lang="ts" setup>
import { computed } from 'vue'
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
import { getQRCodePlugin } from '@/lib/chart/qrCodePlugin'

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

// Make configs reactive so they update when props change
const lineConfig = computed(() => {
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
</script>

<template>
  <Line
    v-if="lineConfig?.data"
    id="chart"
    ref="wrapper"
    :data="lineConfig.data"
    :options="lineConfig.options"
  />
  <Bar
    v-if="barConfig?.data"
    id="chart"
    ref="wrapper"
    :data="barConfig.data"
    :options="barConfig.options"
  />
  <Matrix
    v-if="matrixConfig?.data"
    id="chart"
    ref="wrapper"
    :data="matrixConfig.data"
    :options="matrixConfig.options"
  />
</template>
