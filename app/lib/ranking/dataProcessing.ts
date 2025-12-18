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
    display: { showPercentage, cumulative, hideIncomplete, displayMode },
    totalRowKey
  } = options

  const isAbsolute = displayMode === 'absolute'

  const row: Record<string, string | number | undefined> = {
    country: metaData[iso3c]?.jurisdiction || iso3c,
    iso2c: SPECIAL_FLAG_MAPPINGS[iso3c] || countries.alpha3ToAlpha2(iso3c)?.toLowerCase(),
    href: explorerLink([iso3c])
  }

  const hasData: boolean[] = []

  // For absolute mode: use raw values directly (no baseline/excess calculation needed)
  // For relative mode: use excess values (observed - baseline)
  let metric: number[]
  let metricLower: number[]
  let metricUpper: number[]
  let baseline: number[]
  let baselineLower: number[]
  let baselineUpper: number[]

  if (isAbsolute) {
    // Absolute mode: read raw values directly from the data key
    metric = (countryData[dataKey as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    // No prediction intervals in absolute mode
    metricLower = metric
    metricUpper = metric
    baseline = [] // Not used in absolute mode
    baselineLower = []
    baselineUpper = []
  } else {
    // Relative mode: use excess and baseline data
    const excess = (countryData[`${dataKey}_excess` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    const excessLower = (countryData[`${dataKey}_excess_lower` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    const excessUpper = (countryData[`${dataKey}_excess_upper` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    baseline = (countryData[`${dataKey}_baseline` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    baselineLower = (countryData[`${dataKey}_baseline_lower` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]
    baselineUpper = (countryData[`${dataKey}_baseline_upper` as keyof DatasetEntry] || []).slice(
      startIndex,
      endIndex
    ) as number[]

    metric = excess
    metricLower = excessLower
    metricUpper = excessUpper
  }

  // Calculate cumulative sums
  const arrays = [metric, metricLower, metricUpper, baseline]
  const [cumMetric, cumMetricLower, cumMetricUpper, cumBaseline] = arrays.map(arr =>
    cumulativeSum(sanitizeArray(arr))
  )

  // Calculate total row value based on display mode
  if (isAbsolute) {
    // For absolute mode, show average of valid values (since rates/LE don't sum meaningfully)
    const validMetric = metric.filter(v => v != null && !isNaN(v))
    const validMetricLower = metricLower.filter(v => v != null && !isNaN(v))
    const validMetricUpper = metricUpper.filter(v => v != null && !isNaN(v))

    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN

    row[totalRowKey] = average(validMetric)
    row[`${totalRowKey}_l`] = average(validMetricLower)
    row[`${totalRowKey}_u`] = average(validMetricUpper)
  } else if (showPercentage) {
    // For relative mode with percentage, show relative excess ratio
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
    // For relative mode without percentage, show cumulative excess
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

    if (isAbsolute) {
      // Absolute mode: show actual values (already computed in metric array)
      // Treat 0 or near-zero as missing data (actual rates are never exactly 0)
      const val = metricVal[i]
      const valLower = metricLower[i]
      const valUpper = metricUpper[i]
      const isMissing = val === undefined || val === null || val === 0 || Math.abs(val) < 0.001

      row[label] = isMissing ? Number.MIN_SAFE_INTEGER : round(val, 3)
      row[`${label}_l`] = isMissing ? Number.MIN_SAFE_INTEGER : round(valLower || 0, 3)
      row[`${label}_u`] = isMissing ? Number.MIN_SAFE_INTEGER : round(valUpper || 0, 3)
    } else if (showPercentage) {
      // Relative mode with percentage: show excess as ratio of baseline
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
      // Relative mode without percentage: show excess values
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
