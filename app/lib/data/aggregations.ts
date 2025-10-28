import type {
  CountryData,
  Dataset,
  DatasetRaw,
  NumberEntryFields,
  AllChartData,
  NumberArray,
  StringArray
} from '~/model'
import { stringKeys, numberKeys } from '~/model'
import { ChartPeriod, type ChartType } from '~/model/period'
import { prefillUndefined } from '~/utils'
import { getDataForCountry } from './transformations'
import { getLabels } from './labels'
import { calculateBaselines } from './baselines'

/**
 * Get all chart data with optional baseline calculations
 */
export const getAllChartData = async (
  dataKey: keyof CountryData,
  chartType: string,
  rawData: DatasetRaw,
  allLabels: string[],
  startDateIndex: number,
  cumulative: boolean,
  ageGroupFilter?: string[],
  countryCodeFilter?: string[],
  baselineMethod?: string,
  baselineDateFrom?: string,
  baselineDateTo?: string,
  keys?: (keyof NumberEntryFields)[],
  progressCb?: (progress: number, total: number) => void
): Promise<AllChartData> => {
  const data: Dataset = {}
  const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
  const countryCodes = countryCodeFilter ?? Object.keys(rawData?.all || {})
  const noData: Record<string, Set<string>> = {}
  const noAsmr: Set<string> = new Set<string>()

  // Get Country data and labels
  for (const ag of ageGroups) {
    for (const iso3c of countryCodes) {
      if (!rawData[ag] || !rawData[ag][iso3c]) {
        if (!noData[iso3c]) noData[iso3c] = new Set<string>()
        noData[iso3c].add(ag)
        continue
      }
      const cd = getDataForCountry(
        rawData[ag][iso3c],
        iso3c,
        allLabels[startDateIndex] || ''
      )
      if (!data[ag]) data[ag] = {}
      if (
        !cd
        || (!baselineMethod && cd[dataKey].filter(x => x).length == 0)
      ) {
        if (dataKey.startsWith('asmr')) {
          noAsmr.add(iso3c)
        } else {
          if (!noData[iso3c]) noData[iso3c] = new Set<string>()
          noData[iso3c].add(ag)
        }

        continue
      }
      data[ag][iso3c] = cd
    }
  }

  const labels = getLabels(
    chartType,
    startDateIndex > 0 ? allLabels.slice(startDateIndex) : allLabels
  )

  // Align time series for all countries
  for (const ag of ageGroups) {
    if (!data[ag]) continue
    for (const iso3c of countryCodes) {
      if (!data[ag][iso3c]) continue
      let n = 0
      for (const label of labels) {
        if (data[ag][iso3c].date.includes(label)) break
        else n++
      }
      if (n > 0) {
        for (const key of stringKeys) {
          data[ag][iso3c][key] = prefillUndefined(
            data[ag][iso3c][key],
            n
          ) as StringArray
        }

        for (const key of numberKeys) {
          data[ag][iso3c][key] = prefillUndefined(
            data[ag][iso3c][key],
            n
          ) as NumberArray
        }
      }
    }
  }

  if (
    baselineDateFrom
    && baselineDateTo
    && keys
    && baselineMethod
    && dataKey !== 'population'
  ) {
    // Use ChartPeriod for smart date index lookup
    const period = new ChartPeriod(labels, chartType as ChartType)
    await calculateBaselines(
      data,
      labels,
      period.indexOf(baselineDateFrom),
      period.indexOf(baselineDateTo),
      keys,
      baselineMethod,
      chartType,
      cumulative,
      progressCb
    )
  }

  return { data, labels, notes: { noData, noAsmr } }
}
