import type { DatasetEntry } from '@/model'
import countries from 'i18n-iso-countries'
import {
  calculateRelativeExcess,
  sanitizeArray,
  MIN_BASELINE_THRESHOLD
} from '@/lib/mortality/dataValidation'
import { cumulativeSum, round } from '@/utils'
import { last } from '@/lib/utils/array'
import type { TableRow, ProcessCountryRowOptions } from './types'

/**
 * Map special jurisdiction codes to their flag country codes
 */
const SPECIAL_FLAG_MAPPINGS: Record<string, string> = {
  GBRTENW: 'gb', // England & Wales -> GB
  GBR_SCO: 'gb', // Scotland -> GB
  GBR_NIR: 'gb' // Northern Ireland -> GB
}

/**
 * Calculate relative excess arrays from cumulative data
 */
export function calculateRelativeExcessArrays(
  cumMetric: number[] | undefined,
  cumMetricLower: number[] | undefined,
  cumMetricUpper: number[] | undefined,
  cumBaseline: number[] | undefined
) {
  if (!cumMetric || !cumMetricLower || !cumMetricUpper || !cumBaseline) {
    return { excessCum: [], excessCumLower: [], excessCumUpper: [] }
  }

  const excessCum = cumMetric.map((v, i) => {
    const base = cumBaseline[i]
    if (!base || isNaN(base) || Math.abs(base) < MIN_BASELINE_THRESHOLD) return NaN
    return v / base
  })

  const excessCumLower = cumMetricLower.map((v, i) => {
    const base = cumBaseline[i]
    if (!base || isNaN(base) || Math.abs(base) < MIN_BASELINE_THRESHOLD) return NaN
    return v / base
  })

  const excessCumUpper = cumMetricUpper.map((v, i) => {
    const base = cumBaseline[i]
    if (!base || isNaN(base) || Math.abs(base) < MIN_BASELINE_THRESHOLD) return NaN
    return v / base
  })

  return { excessCum, excessCumLower, excessCumUpper }
}

/**
 * Process a single country's data into a table row
 */
export function processCountryRow(options: ProcessCountryRowOptions): { row: TableRow, hasData: boolean } {
  const {
    iso3c,
    countryData,
    dataKey,
    range: { startIndex, endIndex },
    dataLabels,
    metaData,
    explorerLink,
    display: { showRelative, cumulative, hideIncomplete },
    totalRowKey
  } = options

  const row: Record<string, string | number | undefined> = {
    country: metaData[iso3c]?.jurisdiction || iso3c,
    iso2c: SPECIAL_FLAG_MAPPINGS[iso3c] || countries.alpha3ToAlpha2(iso3c)?.toLowerCase(),
    href: explorerLink([iso3c])
  }

  const hasData: boolean[] = []

  // Extract metric and baseline data
  const metric = (countryData[`${dataKey}_excess` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]
  const metricLower = (countryData[`${dataKey}_excess_lower` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]
  const metricUpper = (countryData[`${dataKey}_excess_upper` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]
  const baseline = (countryData[`${dataKey}_baseline` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]
  const baselineLower = (countryData[`${dataKey}_baseline_lower` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]
  const baselineUpper = (countryData[`${dataKey}_baseline_upper` as keyof DatasetEntry] || []).slice(
    startIndex,
    endIndex
  ) as number[]

  // Calculate cumulative sums
  const arrays = [metric, metricLower, metricUpper, baseline]
  const [cumMetric, cumMetricLower, cumMetricUpper, cumBaseline] = arrays.map(arr =>
    cumulativeSum(sanitizeArray(arr))
  )

  // Calculate relative excess if needed
  if (showRelative) {
    const { excessCum, excessCumLower, excessCumUpper } = calculateRelativeExcessArrays(
      cumMetric,
      cumMetricLower,
      cumMetricUpper,
      cumBaseline
    )

    const filteredExcessCum = excessCum.filter(v => v != null && !isNaN(v))
    const filteredExcessCumUpper = excessCumUpper.filter(v => v != null && !isNaN(v))
    const filteredExcessCumLower = excessCumLower.filter(v => v != null && !isNaN(v))

    row[totalRowKey] = last(filteredExcessCum)
    row[`${totalRowKey}_l`] = last(filteredExcessCumLower)
    row[`${totalRowKey}_u`] = last(filteredExcessCumUpper)
  } else {
    // For absolute mode, use cumulative sum as total
    const filteredCumMetric = (cumMetric || []).filter(v => v != null && !isNaN(v))
    const filteredCumMetricLower = (cumMetricLower || []).filter(v => v != null && !isNaN(v))
    const filteredCumMetricUpper = (cumMetricUpper || []).filter(v => v != null && !isNaN(v))

    row[totalRowKey] = last(filteredCumMetric)
    row[`${totalRowKey}_l`] = last(filteredCumMetricLower)
    row[`${totalRowKey}_u`] = last(filteredCumMetricUpper)
  }

  const metricVal: number[] = (cumulative ? cumMetric : metric) as number[]
  const baselineVal: number[] = (cumulative ? cumBaseline : baseline) as number[]

  // Process each time period
  for (let i = 0; i < endIndex - startIndex; i++) {
    const label = dataLabels[i]
    if (!label) continue

    if (showRelative) {
      const metVal = metricVal[i]
      const metLower = metricLower[i]
      const metUpper = metricUpper[i]
      const base = baselineVal[i]
      const baseLower = baselineLower[i]
      const baseUpper = baselineUpper[i]

      row[label] = round(calculateRelativeExcess(metVal, base), 3)
      row[`${label}_l`] = round(calculateRelativeExcess(metLower, baseLower), 3)
      row[`${label}_u`] = round(calculateRelativeExcess(metUpper, baseUpper), 3)
    } else {
      row[label] = round(metricVal[i] || 0, 3)
      row[`${label}_l`] = round(metricLower[i] || 0, 3)
      row[`${label}_u`] = round(metricUpper[i] || 0, 3)
    }

    // Track if we have valid data
    if (isNaN(row[label] as number)) {
      row[label] = Number.MIN_SAFE_INTEGER
      hasData.push(false)
    } else {
      hasData.push(true)
    }
  }

  // Filter logic:
  // - If hideIncomplete is false: include any country with at least some data
  // - If hideIncomplete is true: only include if the LAST period (most recent) has data
  //   (we don't care about missing historical data at the beginning)
  const shouldInclude = (() => {
    // If no data at all, exclude
    if (!hasData.includes(true)) {
      return false
    }

    // If hideIncomplete is false, include any country with at least some data
    if (!hideIncomplete) {
      return true
    }

    // If hideIncomplete is true, only check the last period
    // This filters out countries missing the most recent data
    const lastPeriodIndex = hasData.length - 1
    return hasData[lastPeriodIndex] === true
  })()

  return { row: row as TableRow, hasData: shouldInclude }
}

/**
 * Convert country codes to explorer link query params
 */
export function visibleCountryCodesForExplorer(countryCodes: string[]): string[] {
  const result = []
  for (const iso3c of countryCodes) {
    result.push(`c=${iso3c}`)
  }
  return result
}
