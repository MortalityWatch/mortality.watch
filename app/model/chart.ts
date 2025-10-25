/**
 * Chart-related types
 */

import type {
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  DefaultDataPoint
} from 'chart.js'
import type { Dataset, Notes } from './types'

export interface ChartDataRaw {
  data: Record<string, Record<string, Record<string, (number | string)[]>>>
  labels: string[]
  notes?: Notes
}

export interface FilteredChartData {
  data: Dataset
  labels: string[]
  notes?: Notes
}

export type ChartLabels = {
  title: string[]
  subtitle: string
  xtitle: string
  ytitle: string
}

export type DatasetReturn = {
  datasets: ChartDataset<ChartType, DefaultDataPoint<ChartType>>[]
  sources: string[]
}

export type ChartJSConfig<
  TType extends ChartType,
  TData = unknown,
  TLabel = unknown
> = {
  data: ChartData<TType, TData, TLabel>
  options: ChartOptions<TType>
}

export type AllChartData = {
  data: Dataset
  labels: string[]
  notes: {
    noData: Record<string, Set<string>> | undefined
    noAsmr: Set<string> | undefined
    disaggregatedData?: Record<string, number[]>
  }
}
