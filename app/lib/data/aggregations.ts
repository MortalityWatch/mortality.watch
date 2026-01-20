import type {
  CountryData,
  Dataset,
  DatasetRaw,
  DatasetEntry,
  NumberEntryFields,
  AllChartData,
  NumberArray,
  StringArray
} from '@/model'
import { stringKeys, numberKeys } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import { prefillUndefined } from '@/utils'
import { getDataForCountry } from './transformations'
import { getLabels } from './labels'
import { calculateBaselines as clientCalculateBaselines } from './baselines'

/**
 * Type for the baseline calculator function.
 * Both client and server implement this interface.
 */
export type BaselineCalculatorFn = (
  data: Dataset,
  labels: string[],
  startIdx: number,
  endIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean,
  progressCb?: (progress: number, total: number) => void,
  statsUrl?: string
) => Promise<void>

/**
 * Get all chart data with optional baseline calculations
 *
 * This function is shared between client and server. The baseline calculation
 * is environment-specific, so callers can inject their own implementation.
 *
 * @param calculateBaselines - Optional baseline calculator function. If not provided,
 *                            uses the client-side implementation. Server-side callers
 *                            should pass their own implementation.
 * @param statsUrl - Optional stats API URL for baseline calculations
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
  progressCb?: (progress: number, total: number) => void,
  statsUrl?: string,
  calculateBaselines: BaselineCalculatorFn = clientCalculateBaselines
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
        || (!baselineMethod && cd[dataKey]?.filter(x => x).length == 0)
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

  // Align time series for all countries to match labels exactly
  // This handles both:
  // 1. Data starting after labels (prefill with undefined)
  // 2. Data arrays being longer than labels (align by date matching)
  for (const ag of ageGroups) {
    if (!data[ag]) continue
    for (const iso3c of countryCodes) {
      if (!data[ag][iso3c]) continue

      const countryData = data[ag][iso3c]
      const dataDateArray = countryData.date as string[]

      // Check if data length matches labels - if not, we need to align by date
      if (dataDateArray.length !== labels.length) {
        // Create a map from date string to data index for efficient lookup
        const dateToDataIndex = new Map<string, number>()
        dataDateArray.forEach((date, idx) => {
          dateToDataIndex.set(date, idx)
        })

        // Create new aligned arrays based on labels
        const alignedData: DatasetEntry = {} as DatasetEntry

        for (const key of stringKeys) {
          const originalArray = countryData[key] as unknown[]
          if (!originalArray) continue
          alignedData[key] = labels.map((label) => {
            const dataIdx = dateToDataIndex.get(label)
            return dataIdx !== undefined ? originalArray[dataIdx] : undefined
          }) as StringArray
        }

        for (const key of numberKeys) {
          const originalArray = countryData[key] as unknown[]
          if (!originalArray) continue
          alignedData[key] = labels.map((label) => {
            const dataIdx = dateToDataIndex.get(label)
            return dataIdx !== undefined ? originalArray[dataIdx] : null
          }) as NumberArray
        }

        data[ag][iso3c] = alignedData
      } else {
        // Original logic: check if data starts after labels and prefill
        let n = 0
        for (const label of labels) {
          if (dataDateArray.includes(label)) break
          else n++
        }
        if (n > 0) {
          for (const key of stringKeys) {
            countryData[key] = prefillUndefined(
              countryData[key],
              n
            ) as StringArray
          }

          for (const key of numberKeys) {
            const currentValue = countryData[key]
            if (currentValue !== undefined) {
              countryData[key] = prefillUndefined(
                currentValue,
                n
              ) as NumberArray
            }
          }
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
      progressCb,
      statsUrl
    )
  }

  return { data, labels, notes: { noData, noAsmr } }
}
