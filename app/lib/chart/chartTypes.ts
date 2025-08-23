import {
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  DefaultDataPoint
} from 'chart.js'
import { MatrixDataPoint } from 'chartjs-chart-matrix'

export type ChartStyle = 'line' | 'bar' | 'matrix'

export type MortalityChartData = {
  labels: string[]
  datasets: ChartDataset<ChartType, DefaultDataPoint<ChartType>>[]
  title: string | string[]
  subtitle: string
  xtitle: string
  ytitle: string
  isMaximized: boolean
  isLogarithmic: boolean
  showLabels: boolean
  url: string
  showPercentage: boolean
  showXOffset: boolean
  sources: string[]
}

export type MortalityMatrixDataPoint = {
  x: number | string
  y: number | string
  country: string
  v: number
}

export type MatrixDatapoint = {
  country: string
  x: number
  y: number
  v: number
}

export type ChartErrorDataPoint = {
  x: number
  y: number
  yMin: number | undefined
  yMax: number | undefined
  yMinMin: number | undefined
  yMaxMax: number | undefined
}

export type ChartJSConfig<
  TType extends ChartType,
  TData = unknown,
  TLabel = unknown
> = {
  data: ChartData<TType, TData, TLabel>
  options: ChartOptions<TType>
}

export type MatrixData = {
  data: MatrixDataPoint[]
  min: number
  max: number
  localMinMax: Record<
    string,
    {
      min: number
      max: number
    }
  >
}
