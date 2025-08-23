<script lang="ts" setup>
import { Chart, registerables } from 'chart.js'
import { createTypedChart } from 'vue-chartjs'
import { getLogoPlugin } from '@/logoPlugin'
import { Line, Bar } from 'vue-chartjs'
import {
  BarWithErrorBar,
  BarWithErrorBarsController
} from 'chartjs-chart-error-bars'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {
  MatrixController,
  MatrixDataPoint,
  MatrixElement
} from 'chartjs-chart-matrix'
import {
  makeBarLineChartConfig,
  makeMatrixChartConfig
} from '@/lib/chart/chartConfig'
import {
  ChartJSConfig,
  ChartStyle,
  MortalityChartData
} from '@/lib/chart/chartTypes'

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
}>()

Chart.register(
  ...registerables,
  BarWithErrorBar,
  ChartDataLabels,
  MatrixController,
  MatrixElement
)
if (props.showLogo) {
  Chart.register(getLogoPlugin())
}

createTypedChart(BarWithErrorBarsController.id, BarWithErrorBarsController)
const Matrix = createTypedChart('matrix', MatrixController)

let lineConfig: ChartJSConfig<'line', (number | null)[]> | undefined
let barConfig: ChartJSConfig<'bar', (number | null)[]> | undefined
let matrixConfig: ChartJSConfig<'matrix', MatrixDataPoint[]> | undefined

switch (props.chartStyle) {
  case 'line':
    lineConfig = makeBarLineChartConfig(
      props.data,
      props.isExcess,
      props.showPredictionInterval,
      props.showPercentage,
      props.isDeathsType,
      props.isPopulationType
    ) as unknown as ChartJSConfig<'line', (number | null)[]>
    break
  case 'bar':
    barConfig = makeBarLineChartConfig(
      props.data,
      props.isExcess,
      props.showPredictionInterval,
      props.showPercentage,
      props.isDeathsType,
      props.isPopulationType
    ) as unknown as ChartJSConfig<'bar', (number | null)[]>
    break
  case 'matrix':
    matrixConfig = makeMatrixChartConfig(
      props.data,
      props.isExcess,
      props.isLifeExpectancyType,
      props.showPredictionInterval,
      props.showPercentage,
      props.showLabels,
      props.isDeathsType,
      props.isPopulationType
    ) as unknown as ChartJSConfig<'matrix', MatrixDataPoint[]>
    break
}
</script>

<template>
  <Line
    v-if="lineConfig"
    ref="wrapper"
    id="chart"
    :data="lineConfig.data"
    :options="lineConfig.options"
  />
  <Bar
    v-if="barConfig"
    ref="wrapper"
    id="chart"
    :data="barConfig.data"
    :options="barConfig.options"
  />
  <Matrix
    v-if="matrixConfig"
    ref="wrapper"
    id="chart"
    :data="matrixConfig.data"
    :options="matrixConfig.options"
  />
</template>
