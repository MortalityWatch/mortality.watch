import { type ChartErrorDataPoint, type MortalityChartData } from './lib/chart/chartTypes'
import {
  getChartTypeOrdinal,
  type ChartLabels,
  baselineMethods,
  getKeyForType,
  type Country,
  type DatasetReturn,
  type Dataset,
  type DatasetEntry,
  datasetEntryKeys,
  type FilteredChartData,
  type DataVector
} from './model'
import { cumulativeSum, sum, getCamelCase, repeat, isMobile } from './utils'
import type { ChartDataset, ChartType, DefaultDataPoint } from 'chart.js'

const SUBREGION_SEPERATOR = ' - '

export const isBl = (key: string) => key.includes('_baseline')

export const isPredictionIntervalKey = (key: string) =>
  key.includes('_lower') || key.includes('_upper')

const getLabel = (key: string, country: string, ageGroup: string) => {
  if (isBl(key) || isPredictionIntervalKey(key)) return ''
  const idx = country.indexOf(SUBREGION_SEPERATOR)
  if (idx > -1) return `${country.substring(idx + 3)}${ageGroup}`
  return `${country}${ageGroup}`
}

const getLabels = (dateFrom: string, dateTo: string): string[] => [
  (dateFrom ?? 'n/a') + ' - ' + (dateTo ?? 'n/a')
]

const getBLForKey = (isAsmr: boolean, key: string) => {
  if (isAsmr) return `${key.split('_')[0]}_${key.split('_')[1]}_baseline`
  else return `${key.split('_')[0]}_baseline`
}

const getPercentageDataRow = (dataRow: number[], blRow: number[]) => {
  const result = []
  for (let i = 0; i < dataRow.length; i++) result.push(dataRow[i] / blRow[i])
  return result
}

const getData = (
  showPercentage: boolean,
  cumulative: boolean,
  showTotal: boolean,
  isAsmrType: boolean,
  data: Record<string, number[]>,
  key: string
): number[] => {
  const dataRow = data[key]
  if (showPercentage) {
    const blDataRow = data[getBLForKey(isAsmrType, key)]
    // Absolute
    if (!cumulative) return getPercentageDataRow(dataRow, blDataRow)
    if (!showTotal)
      return getPercentageDataRow(
        // Cumulative
        cumulativeSum(dataRow),
        cumulativeSum(blDataRow)
      )
    else return [sum(dataRow) / sum(blDataRow)] // Cumulative Total
  } else {
    if (!cumulative) return dataRow // Absolute
    if (!showTotal)
      return cumulativeSum(dataRow) // Cumulative
    else return [sum(dataRow)] // Cumulative Total
  }
}

const getPointBackgroundColor = (key: string, color: string) => {
  if (isBl(key) || isPredictionIntervalKey(key)) return color + '00'
  return color
}

const getBackgroundColor = (key: string, color: string) => {
  if (isPredictionIntervalKey(key)) return color + '55'
  return color + 'ff'
}

const getBorderDash = (key: string) => {
  if (key.endsWith('_baseline')) return [2, 2]
  if (key.endsWith('_prediction')) return [6, 4]
  return undefined
}

const getBorderWidth = (key: string, isBarChartStyle: boolean) => {
  if (isPredictionIntervalKey(key)) return 0
  if (
    isBarChartStyle &&
    !key.endsWith('_baseline') &&
    !isPredictionIntervalKey(key)
  )
    return 0
  return 1.2
}

const getPointRadius = (chartType: string, key: string) => {
  if (isBl(key) && !['yearly', 'fluseason', 'midyear'].includes(chartType))
    return 0
  if (chartType.includes('quarterly')) return 2
  if (chartType.includes('monthly')) return 1.5
  if (chartType.includes('weekly')) return 1
  return 3
}

const getType = (key: string, isBarChartStyle: boolean, isExcess: boolean) => {
  if (isBarChartStyle && isExcess) return 'barWithErrorBars'
  else return isBarChartStyle && !key.includes('_baseline') ? 'bar' : 'line'
}

const makeErrorBarData = (
  row: number[],
  lowerRow: (number | undefined)[],
  upperRow: (number | undefined)[]
): ChartErrorDataPoint[] => {
  const result: ChartErrorDataPoint[] = []
  for (let i = 0; i < row.length; i++) {
    result.push({
      x: i,
      y: row[i],
      yMin: lowerRow[i],
      yMax: upperRow[i],
      yMinMin: undefined,
      yMaxMax: undefined
    })
  }
  return result
}

const getBarExcessData = (
  showPercentage: boolean,
  cumulative: boolean,
  showTotal: boolean,
  showCumPi: boolean,
  isAsmrType: boolean,
  dataRaw: Record<string, number[]>,
  key: string
): (number | null)[] | ChartErrorDataPoint[] => {
  const data = dataRaw[key]
  const dataL = dataRaw[`${key}_upper`]
  const dataU = dataRaw[`${key}_lower`]

  if (showPercentage) {
    const blDataRow = dataRaw[getBLForKey(isAsmrType, key)]
    const blDataLRow = dataRaw[getBLForKey(isAsmrType, `${key}_upper`)]
    const blDataURow = dataRaw[getBLForKey(isAsmrType, `${key}_lower`)]

    // Absolute
    if (!cumulative)
      return makeErrorBarData(
        getPercentageDataRow(data, blDataRow),
        getPercentageDataRow(dataL, blDataLRow),
        getPercentageDataRow(dataU, blDataURow)
      )

    if (!showTotal) {
      if (showCumPi) {
        // Cumulative
        return makeErrorBarData(
          getPercentageDataRow(cumulativeSum(data), cumulativeSum(blDataRow)),
          getPercentageDataRow(cumulativeSum(dataL), cumulativeSum(blDataLRow)),
          getPercentageDataRow(cumulativeSum(dataU), cumulativeSum(blDataURow))
        )
      } else {
        return makeErrorBarData(
          getPercentageDataRow(cumulativeSum(data), cumulativeSum(blDataRow)),
          repeat(undefined, data.length),
          repeat(undefined, data.length)
        )
      }
    } else {
      if (showCumPi) {
        return makeErrorBarData(
          [sum(data) / sum(blDataRow)],
          [sum(dataL) / sum(blDataLRow)],
          [sum(dataU) / sum(blDataURow)]
        ) // Cumulative Total
      } else {
        return makeErrorBarData(
          [sum(data) / sum(blDataRow)],
          [undefined],
          [undefined]
        ) // Cumulative Total
      }
    }
  } else {
    if (!cumulative) return makeErrorBarData(data, dataL, dataU) // Absolute

    if (!showTotal) {
      if (showCumPi) {
        return makeErrorBarData(
          cumulativeSum(data),
          cumulativeSum(dataL),
          cumulativeSum(dataU)
        )
      } else {
        return makeErrorBarData(
          cumulativeSum(data),
          repeat(undefined, data.length),
          repeat(undefined, data.length)
        )
      }
    } else {
      if (showCumPi) {
        return makeErrorBarData([sum(data)], [sum(dataL)], [sum(dataU)]) // Cumulative Total
      } else {
        return makeErrorBarData([sum(data)], [undefined], [undefined]) // Cumulative Total
      }
    }
  }
}

const getSource = (ds: Record<string, unknown[]>, key: string) => {
  if (key.startsWith('asmr') && ds['source_asmr']) {
    return ds.source_asmr
  } else {
    return ds.source
  }
}

export const getDatasets = (
  type: string,
  showBaseline: boolean,
  standardPopulation: string,
  isExcess: boolean,
  allCountries: Record<string, Country>,
  isErrorBarType: boolean,
  colors: string[],
  isMatrixChartStyle: boolean,
  countries: string[],
  showPercentage: boolean,
  cumulative: boolean,
  showTotal: boolean,
  showCumPi: boolean,
  isAsmrType: boolean,
  showPredictionInterval: boolean,
  chartType: string,
  isBarChartStyle: boolean,
  data: Dataset
): DatasetReturn => {
  let countryIndex = 0
  const datasets: ChartDataset<ChartType, DefaultDataPoint<ChartType>>[] = []
  const sources = new Set<string>()
  const ags = Object.keys(data)

  for (const ag of ags) {
    for (const iso3c of Object.keys(data[ag])) {
      const ds: Record<string, unknown[]> = data[ag][iso3c]
      const keys = getKeyForType(
        type,
        showBaseline,
        standardPopulation,
        isExcess,
        true
      )
      const country = allCountries[iso3c]
      if (!country) throw new Error(`No country found for iso3c ${iso3c}`)
      keys.forEach((key) => {
        if (
          isErrorBarType &&
          (key.endsWith('_lower') || key.endsWith('_upper'))
        )
          return
        const offset =
          keys.length * countryIndex + 1 + (key.includes('_prediction') ? 1 : 0)
        const color: string = colors[countryIndex]
        const ag_str = ags.length === 1 ? '' : ` [${getCamelCase(ag)}]`
        const label = getLabel(
          key,
          isMatrixChartStyle || datasets.length === 0 || countries.length > 1
            ? country.jurisdiction
            : '',
          ag_str
        )
        if (label !== '') {
          getSource(ds, key)
            .join(', ')
            .split(', ')
            .forEach((x) => sources.add(x))
        }
        datasets.push({
          label,
          data:
            isErrorBarType && showPredictionInterval
              ? getBarExcessData(
                showPercentage,
                cumulative,
                showTotal,
                showCumPi,
                isAsmrType,
                ds as Record<string, number[]>,
                key
              )
              : getData(
                showPercentage,
                cumulative,
                showTotal,
                isAsmrType,
                ds as Record<string, number[]>,
                key
              ),
          borderColor: colors[countryIndex],
          backgroundColor: getBackgroundColor(key, color),
          fill: isPredictionIntervalKey(key) ? offset : undefined,
          borderWidth: getBorderWidth(key, isBarChartStyle),
          borderDash: getBorderDash(key),
          pointRadius:
            countries.length * ags.length > 5
              ? 0
              : getPointRadius(chartType, key),
          pointBackgroundColor: getPointBackgroundColor(key, color),
          type: getType(key, isBarChartStyle, isExcess),
          hidden: isPredictionIntervalKey(key) && !showPredictionInterval
        })
      })
      countryIndex++
    }
  }

  if (showTotal) {
    return {
      datasets: datasets.sort(
        (a, b) => (a.data[0] as number) - (b.data[0] as number)
      ),
      sources: Array.from(sources)
    }
  }
  return { datasets, sources: Array.from(sources) } as DatasetReturn
}

const getASMRTitle = (countries: string[], standardPopulation: string) => {
  const result = 'Standard Population'
  switch (standardPopulation) {
    case 'who':
      return `WHO ${result}`
    case 'esp':
      return `European ${result}`
    case 'usa':
      return `U.S. ${result}`
    case 'country':
      return `${countries.join(',')} 2020 ${result}`
    default:
      throw new Error('Uncrecognized standard population key.')
  }
}

const getMethodDescription = (baselineMethod: string) =>
  baselineMethods.filter((x) => x.value === baselineMethod)[0].name

export const blDescription = (
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string
) =>
  `Baseline: ${getMethodDescription(baselineMethod)} ${baselineDateFrom}-${baselineDateTo}`

export const getChartLabels = (
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
  chartType: string
): ChartLabels => {
  const title = []
  let subtitle = ''
  let xtitle = ''
  let ytitle = 'Deaths per 100k'
  const asmrTitle = getASMRTitle(countries, standardPopulation)

  // Display age group in title, if single age group and multiple countries.
  let ag = ''
  if (ageGroups.length === 1 && ageGroups[0] !== 'all') {
    ag = ` [${ageGroups[0]}]`
  }

  const pi = showPredictionInterval ? '95% Prediction Interval' : ''

  if (cumulative) title.push('Cumulative')

  if (isExcess) {
    switch (type) {
      case 'deaths':
        title.push(`Excess Deaths${ag}`)
        ytitle = cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
        break
      case 'cmr':
        title.push(`Crude Excess`, `Mortality${ag}`)
        ytitle = 'Excess Deaths per 100k'
        break
      case 'asmr':
        title.push('Age-Standardized', 'Excess Mortality')
        subtitle = [asmrTitle].filter((x) => x).join(' · ')
        ytitle = 'Excess Deaths per 100k'
        break
      case 'le':
        title.push('Change in', 'Life Expectancy')
        subtitle = 'Based on WHO2015 Std. Pop.'
        ytitle = 'Years'
        break
    }
  } else {
    switch (type) {
      case 'population':
        title.push(`Population${ag}`)
        ytitle = 'People'
        break
      case 'deaths':
        title.push(`Deaths${ag}`)
        ytitle = 'Deaths'
        break
      case 'cmr':
        title.push(`Crude`, `Mortality Rate${ag}`)
        break
      case 'asmr':
        title.push('Age-Standardized', 'Mortality Rate')
        subtitle = showBaseline
          ? [asmrTitle].filter((x) => x).join(' · ')
          : asmrTitle
        break
      case 'le':
        title.push('Life Expectancy')
        ytitle = 'Years'
        subtitle = 'Based on WHO2015 Std. Pop.'
        break
    }
  }

  subtitle = [
    subtitle,
    showBaseline
      ? blDescription(baselineMethod, baselineDateFrom, baselineDateTo)
      : ''
  ]
    .filter((x) => x)
    .join(' · ')

  if (showBaseline && showPredictionInterval) {
    subtitle = [subtitle, pi].filter((x) => x).join(' · ')
  }

  if (showTotal) {
    // Cumulative Total
    xtitle = ''
  } else {
    switch (chartType) {
      case 'weekly_104w_sma':
        subtitle = ['104 week moving average (SMA)', subtitle]
          .filter((x) => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_52w_sma':
        subtitle = ['52 week moving average (SMA)', subtitle]
          .filter((x) => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_26w_sma':
        subtitle = ['26 week moving average (SMA)', subtitle]
          .filter((x) => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_13w_sma':
        subtitle = ['13 week moving average (SMA)', subtitle]
          .filter((x) => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'midyear':
        subtitle = ['7/1-6/30', subtitle].filter((x) => x).join(' · ')
        xtitle = 'Year'
        break
      case 'fluseason':
        subtitle = ['10/1-9/30', subtitle].filter((x) => x).join(' · ')
        xtitle = 'Year'
        break
      case 'weekly':
        xtitle = 'Week of Year'
        break
      case 'monthly':
        xtitle = 'Month of Year'
        break
      case 'quarterly':
        xtitle = 'Quarter of Year'
        break
      case 'yearly':
        subtitle = [subtitle].filter((x) => x).join(' · ')
        xtitle = 'Year'
        break
    }
  }
  if (isMobile()) {
    return { title, subtitle, xtitle, ytitle }
  } else {
    return { title: [title.join(' ')], subtitle, xtitle, ytitle }
  }
}

export const getFilteredLabelAndData = (
  allLabels: string[],
  dateFrom: string,
  dateTo: string,
  chartTypeOrdinal: number,
  allChartData: Dataset
): FilteredChartData => {
  // Filter Labels and Data based on selected dates.
  const from = allLabels.indexOf(dateFrom)
  const to = allLabels.indexOf(dateTo)
  const labels = allLabels.slice(from, to + 1)
  const disaggregatedData: Record<string, number[]> = {}

  const data: Dataset = {}
  for (const ag in allChartData) {
    data[ag] = {}
    for (const iso3c in allChartData[ag]) {
      data[ag][iso3c] = {} as DatasetEntry
      for (const key of datasetEntryKeys) {
        const dataRow = allChartData[ag][iso3c][key]
        data[ag][iso3c][key] = dataRow.slice(from, to + 1) as DataVector
      }
      const types = new Set(
        (data[ag][iso3c]['type'] as string[])
          .flatMap((str: undefined | string) => str?.split(', '))
          .map((x) => (x ? parseInt(x, 10) : 0))
      )
      const lowerRes = Array.from(types).filter((x) => x < chartTypeOrdinal)
      if (lowerRes.length) {
        disaggregatedData[iso3c] = Array.from(types).filter(
          (x) => x < chartTypeOrdinal
        )
      }
    }
  }
  return { labels, data, notes: { disaggregatedData } }
}

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
    allChartData
  )

  const labels =
    cumulative && showTotal && isBarChartStyle
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
