/**
 * Chart dataset builders
 */

import type { ChartDataset, ChartType, DefaultDataPoint } from 'chart.js'
import type { ChartErrorDataPoint } from './chartTypes'
import {
  getKeyForType,
  type Country,
  type DatasetReturn,
  type Dataset
} from '~/model'
import { cumulativeSum, sum, getCamelCase } from '~/utils'
import { isBl, isPredictionIntervalKey } from './predicates'

const SUBREGION_SEPERATOR = ' - '

const getLabel = (key: string, country: string, ageGroup: string) => {
  if (isBl(key) || isPredictionIntervalKey(key)) return ''
  const idx = country.indexOf(SUBREGION_SEPERATOR)
  if (idx > -1) return `${country.substring(idx + 3)}${ageGroup}`
  return `${country}${ageGroup}`
}

const getBLForKey = (isAsmr: boolean, key: string) => {
  if (isAsmr) return `${key.split('_')[0]}_${key.split('_')[1]}_baseline`
  else return `${key.split('_')[0]}_baseline`
}

const getPercentageDataRow = (dataRow: number[], blRow: number[]) => {
  const result = []
  for (let i = 0; i < dataRow.length; i++) result.push((dataRow[i] ?? 0) / (blRow[i] ?? 1))
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
  const dataRow = data[key] ?? []
  if (showPercentage) {
    const blDataRow = data[getBLForKey(isAsmrType, key)] ?? []
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
    isBarChartStyle
    && !key.endsWith('_baseline')
    && !isPredictionIntervalKey(key)
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
      y: row[i] ?? 0,
      yMin: lowerRow[i],
      yMax: upperRow[i],
      yMinMin: undefined,
      yMaxMax: undefined
    })
  }
  return result
}

const repeat = <T>(value: T, length: number): T[] => {
  return new Array(length).fill(value)
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
  const data = dataRaw[key] ?? []
  const dataL = dataRaw[`${key}_upper`] ?? []
  const dataU = dataRaw[`${key}_lower`] ?? []

  if (showPercentage) {
    const blDataRow = dataRaw[getBLForKey(isAsmrType, key)] ?? []
    const blDataLRow = dataRaw[getBLForKey(isAsmrType, `${key}_upper`)] ?? []
    const blDataURow = dataRaw[getBLForKey(isAsmrType, `${key}_lower`)] ?? []

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
    const agData = data[ag]
    if (!agData) continue
    for (const iso3c of Object.keys(agData)) {
      const ds = agData[iso3c]
      if (!ds) continue
      const dsRecord: Record<string, unknown[]> = ds
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
          isErrorBarType
          && (key.endsWith('_lower') || key.endsWith('_upper'))
        )
          return
        const offset
          = keys.length * countryIndex + 1 + (key.includes('_prediction') ? 1 : 0)
        const color: string = colors[countryIndex] ?? '#000000'
        const ag_str = ags.length === 1 ? '' : ` [${getCamelCase(ag)}]`
        const label = getLabel(
          key,
          isMatrixChartStyle || datasets.length === 0 || countries.length > 1
            ? country.jurisdiction
            : '',
          ag_str
        )
        if (label !== '') {
          const source = getSource(dsRecord, key)
          if (source) {
            (source as string[])
              .join(', ')
              .split(', ')
              .forEach(x => sources.add(x))
          }
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
                  dsRecord as Record<string, number[]>,
                  key
                )
              : getData(
                  showPercentage,
                  cumulative,
                  showTotal,
                  isAsmrType,
                  dsRecord as Record<string, number[]>,
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
