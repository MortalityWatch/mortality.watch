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
} from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import type { MortalityChartData } from './chartTypes'
import type { DataTransformationConfig, ChartFilterConfig } from './types'
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

/**
 * Generate filtered chart data from a config object.
 * This is the primary API - uses a single config object instead of 30+ parameters.
 *
 * @param config - Complete chart filter configuration
 * @param allLabels - All available date labels
 * @param allChartData - Raw dataset
 * @returns Filtered and transformed chart data ready for rendering
 */
export const getFilteredChartDataFromConfig = (
  config: ChartFilterConfig,
  allLabels: string[],
  allChartData: Dataset
): MortalityChartData => {
  const chartLabels = getChartLabels(
    config.countries,
    config.standardPopulation,
    config.ageGroups,
    config.showPredictionInterval,
    config.isExcess,
    config.type,
    config.cumulative,
    config.showBaseline,
    config.baselineMethod,
    config.baselineDateFrom,
    config.baselineDateTo,
    config.showTotal,
    config.chartType,
    config.view
  )

  const filteredData = getFilteredLabelAndData(
    allLabels,
    config.dateFrom,
    config.dateTo,
    getChartTypeOrdinal(config.chartType),
    config.chartType as ChartType,
    allChartData
  )

  const labels
    = config.cumulative && config.showTotal && config.isBarChartStyle
      ? getLabels(config.dateFrom, config.dateTo)
      : filteredData.labels

  const transformConfig: DataTransformationConfig = {
    display: {
      showPercentage: config.showPercentage,
      cumulative: config.cumulative,
      showTotal: config.showTotal,
      showCumPi: config.showCumPi,
      showBaseline: config.showBaseline,
      showPredictionInterval: config.showPredictionInterval,
      view: config.view,
      leAdjusted: config.leAdjusted
    },
    chart: {
      type: config.type,
      chartType: config.chartType,
      isExcess: config.isExcess,
      isAsmrType: config.isAsmrType,
      isBarChartStyle: config.isBarChartStyle,
      isMatrixChartStyle: config.isMatrixChartStyle,
      isErrorBarType: config.isErrorBarType,
      standardPopulation: config.standardPopulation
    },
    visual: {
      colors: config.colors
    },
    context: {
      countries: config.countries,
      allCountries: config.allCountries
    }
  }

  const ds = getDatasets(transformConfig, filteredData.data)

  return {
    labels,
    datasets: ds.datasets,
    title: chartLabels.title,
    subtitle: chartLabels.subtitle,
    xtitle: chartLabels.xtitle,
    ytitle: chartLabels.ytitle,
    isMaximized: config.maximize,
    showLabels: config.showLabels,
    url: config.url,
    showPercentage: config.showPercentage,
    showLogarithmic: config.showLogarithmic,
    showXOffset: config.isBarChartStyle || config.isPopulationType || config.isDeathsType,
    sources: ds.sources
  }
}

/**
 * Generate filtered chart data (legacy API with individual parameters).
 * @deprecated Use getFilteredChartDataFromConfig instead
 */
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
  showLogarithmic: boolean,
  isPopulationType: boolean,
  isDeathsType: boolean,
  view: string,
  allLabels: string[],
  allChartData: Dataset
): Promise<MortalityChartData> => {
  // Convert to config object and delegate to new implementation
  const config: ChartFilterConfig = {
    countries,
    ageGroups,
    type,
    chartType,
    standardPopulation,
    view,
    isExcess,
    chartStyle: isBarChartStyle ? 'bar' : (isMatrixChartStyle ? 'matrix' : 'line'),
    isBarChartStyle,
    isMatrixChartStyle,
    isErrorBarType,
    isAsmrType,
    isPopulationType,
    isDeathsType,
    dateFrom,
    dateTo,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    showBaseline,
    cumulative,
    showTotal,
    showPredictionInterval,
    showPercentage,
    showCumPi,
    maximize,
    showLabels,
    showLogarithmic,
    leAdjusted: true, // Legacy function defaults to adjusted
    colors,
    allCountries,
    url
  }

  return getFilteredChartDataFromConfig(config, allLabels, allChartData)
}

const baselineMinRanges: Record<string, number> = {
  lin_reg: 2,
  exp: 6
}

export const baselineMinRange = (baselineMethod: string) =>
  baselineMinRanges[baselineMethod] ?? 1
