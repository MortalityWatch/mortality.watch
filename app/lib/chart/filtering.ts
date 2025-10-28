/**
 * Chart data filtering functions
 */

import {
  getChartTypeOrdinal,
  type Country,
  type Dataset,
  type DatasetEntry,
  datasetEntryKeys,
  type FilteredChartData,
  type DataVector
} from '~/model'
import { ChartPeriod, type ChartType } from '~/model/period'
import type { MortalityChartData } from './chartTypes'
import { getDatasets } from './datasets'
import { getChartLabels } from './labels'

export const getFilteredLabelAndData = (
  allLabels: string[],
  dateFrom: string,
  dateTo: string,
  chartTypeOrdinal: number,
  chartType: ChartType,
  allChartData: Dataset
): FilteredChartData => {
  // Filter Labels and Data based on selected dates using ChartPeriod
  const period = new ChartPeriod(allLabels, chartType)
  const from = period.indexOf(dateFrom)
  const to = period.indexOf(dateTo)
  const labels = allLabels.slice(from, to + 1)
  const disaggregatedData: Record<string, number[]> = {}

  const data: Dataset = {}
  for (const ag in allChartData) {
    data[ag] = {}
    for (const iso3c in allChartData[ag]) {
      data[ag][iso3c] = {} as DatasetEntry
      for (const key of datasetEntryKeys) {
        const agData = allChartData[ag]
        if (!agData) continue
        const countryData = agData[iso3c]
        if (!countryData) continue
        const dataRow = countryData[key] ?? []
        data[ag][iso3c][key] = dataRow.slice(from, to + 1) as DataVector
      }
      const types = new Set(
        (data[ag][iso3c]['type'] as string[])
          .flatMap((str: undefined | string) => str?.split(', '))
          .map(x => (x ? parseInt(x, 10) : 0))
      )
      const lowerRes = Array.from(types).filter(x => x < chartTypeOrdinal)
      if (lowerRes.length) {
        disaggregatedData[iso3c] = Array.from(types).filter(
          x => x < chartTypeOrdinal
        )
      }
    }
  }
  return { labels, data, notes: { disaggregatedData } }
}

const getLabels = (dateFrom: string, dateTo: string): string[] => [
  (dateFrom ?? 'n/a') + ' - ' + (dateTo ?? 'n/a')
]

export const getFilteredChartData = async (
  countries: string[],
  standardPopulation: string,
  ageGroups: string[],
  showPredictionInterval: boolean,
  isExcess: boolean,
  type: string,
  cumulative: boolean,
  showBaseline: boolean,
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string,
  showTotal: boolean,
  chartType: string,
  dateFrom: string,
  dateTo: string,
  isBarChartStyle: boolean,
  allCountries: Record<string, Country>,
  isErrorBarType: boolean,
  colors: string[],
  isMatrixChartStyle: boolean,
  showPercentage: boolean,
  showCumPi: boolean,
  isAsmrType: boolean,
  maximize: boolean,
  showLabels: boolean,
  url: string,
  isLogarithmic: boolean,
  isPopulationType: boolean,
  isDeathsType: boolean,
  allLabels: string[],
  allChartData: Dataset
): Promise<MortalityChartData> => {
  const chartLabels = getChartLabels(
    countries,
    standardPopulation,
    ageGroups,
    showPredictionInterval,
    isExcess,
    type,
    cumulative,
    showBaseline,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    showTotal,
    chartType
  )

  const filteredData = getFilteredLabelAndData(
    allLabels,
    dateFrom,
    dateTo,
    getChartTypeOrdinal(chartType),
    chartType as ChartType,
    allChartData
  )

  const labels
    = cumulative && showTotal && isBarChartStyle
      ? getLabels(dateFrom, dateTo)
      : filteredData.labels

  const ds = getDatasets(
    type,
    showBaseline,
    standardPopulation,
    isExcess,
    allCountries,
    isErrorBarType,
    colors,
    isMatrixChartStyle,
    countries,
    showPercentage,
    cumulative,
    showTotal,
    showCumPi,
    isAsmrType,
    showPredictionInterval,
    chartType,
    isBarChartStyle,
    filteredData.data
  )

  return {
    labels,
    datasets: ds.datasets,
    title: chartLabels.title,
    subtitle: chartLabels.subtitle,
    xtitle: chartLabels.xtitle,
    ytitle: chartLabels.ytitle,
    isMaximized: maximize,
    showLabels: showLabels,
    url,
    showPercentage,
    isLogarithmic,
    showXOffset: isBarChartStyle || isPopulationType || isDeathsType,
    sources: ds.sources
  }
}

export const baselineMinRange = (baselineMethod: string) => {
  switch (baselineMethod) {
    case 'lin_reg':
      return 2
    case 'exp':
      return 6
    default:
      return 1
  }
}
