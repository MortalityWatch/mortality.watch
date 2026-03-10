/**
 * Shared baseline calculation functions
 *
 * This module contains the core baseline calculation logic used by both client and server.
 * The fetch mechanism is injected as a dependency to allow different implementations
 * (client uses dataLoader.fetchBaseline, server uses fetchBaselineWithCircuitBreaker).
 */

import type {
  Dataset,
  DatasetEntry,
  DataVector
} from '@/model'
import { EXTERNAL_SERVICES, BASELINE_DATA_PRECISION, getMaxBaselinePeriod } from '../config/constants'
import { logger } from '../logger'
import { calculateExcess, getSeasonType, labelToXsParam } from './core'

// Default stats API URL - can be overridden via NUXT_PUBLIC_STATS_URL
const DEFAULT_STATS_URL = EXTERNAL_SERVICES.STATS_API_URL

/**
 * Function type for fetching baseline data from stats API
 */
export type BaselineFetchFn = (endpoint: string, body: Record<string, unknown>) => Promise<string>

/**
 * Function type for queue wrapper (rate limiting)
 */
export type QueueEnqueueFn = <T>(fn: () => Promise<T>) => Promise<T>

/**
 * Dependencies for baseline calculation
 */
export interface BaselineDependencies {
  fetchBaseline: BaselineFetchFn
  enqueue: QueueEnqueueFn
}

/**
 * Calculate baseline for a single dataset entry
 *
 * Sends full data to stats API with bs/be parameters to specify baseline range.
 * This allows z-scores to be calculated for all periods (pre-baseline, baseline, post-baseline).
 *
 * @param deps - Injected dependencies (fetch function and queue)
 * @param data - Dataset entry to calculate baseline for
 * @param labels - Chart labels
 * @param baselineStartIdx - 0-indexed start of baseline period within labels
 * @param baselineEndIdx - 0-indexed end of baseline period within labels (inclusive)
 * @param keys - Keys for data fields
 * @param method - Baseline calculation method
 * @param chartType - Chart type
 * @param cumulative - Whether cumulative mode is enabled
 * @param statsUrl - Optional stats API URL (defaults to https://stats.mortality.watch/)
 */
export const calculateBaseline = async (
  deps: BaselineDependencies,
  data: DatasetEntry,
  labels: string[],
  baselineStartIdx: number,
  baselineEndIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean,
  statsUrl?: string
): Promise<void> => {
  if (method === 'auto') return

  const firstKey = keys[0]
  if (!firstKey) return

  // Use full data array - labels and data should be aligned.
  // We trim leading/trailing missing values before calling stats API because
  // long null prefixes can distort regression output in the external service.
  const allData = (data[firstKey]?.slice(0, labels.length) || []) as (number | null | undefined)[]

  const isValidNumber = (v: number | null | undefined): v is number =>
    v != null && !isNaN(v)

  const firstDataIdx = allData.findIndex(isValidNumber)
  if (firstDataIdx === -1) return

  let lastDataIdx = allData.length - 1
  while (lastDataIdx >= 0 && !isValidNumber(allData[lastDataIdx])) {
    lastDataIdx--
  }
  if (lastDataIdx < firstDataIdx) return

  const effectiveBaselineStartIdx = Math.max(baselineStartIdx, firstDataIdx)
  const effectiveBaselineEndIdx = Math.min(baselineEndIdx, lastDataIdx)
  if (effectiveBaselineStartIdx > effectiveBaselineEndIdx) {
    logger.warn('Baseline range has no overlap with available data', {
      baselineStartIdx,
      baselineEndIdx,
      effectiveBaselineStartIdx,
      effectiveBaselineEndIdx,
      firstDataIdx,
      lastDataIdx,
      chartType
    })
    return
  }

  const seriesData = allData.slice(firstDataIdx, lastDataIdx + 1)
  const bl_data = allData.slice(effectiveBaselineStartIdx, effectiveBaselineEndIdx + 1)
  const trend = method === 'lin_reg' // Only linear regression uses trend mode (t=1)
  const s = getSeasonType(chartType)

  if (bl_data.every(x => x == null || isNaN(x as number))) return

  // Validate indices before making API call
  if (baselineStartIdx < 0 || baselineEndIdx < 0) {
    logger.warn('Invalid baseline indices', {
      baselineStartIdx,
      baselineEndIdx,
      effectiveBaselineStartIdx,
      effectiveBaselineEndIdx,
      chartType,
      labelsLength: labels.length,
      firstLabel: labels[0],
      lastLabel: labels[labels.length - 1]
    })
    return
  }

  // Ensure we have enough data points for meaningful baseline calculation
  // Naive method only needs 1 data point (the selected date's value)
  // Other methods need at least 3 points for statistical calculations
  const validDataPoints = bl_data.filter(x => x != null && !isNaN(x as number)).length
  const minRequired = method === 'naive' ? 1 : 3
  if (validDataPoints < minRequired) {
    logger.warn('Insufficient data points for baseline calculation', {
      iso3c: data.iso3c?.[0],
      validDataPoints,
      minRequired,
      blDataLength: bl_data.length,
      baselineStartIdx,
      baselineEndIdx,
      chartType
    })
    return
  }

  // Validate baseline period length to prevent server timeouts
  const baselinePeriodLength = effectiveBaselineEndIdx - effectiveBaselineStartIdx + 1
  const maxPeriod = getMaxBaselinePeriod(chartType)
  if (baselinePeriodLength > maxPeriod) {
    logger.warn('Baseline period too large, using fallback calculation', {
      iso3c: data.iso3c?.[0],
      baselinePeriodLength,
      maxPeriod,
      chartType
    })
    applyMeanFallback(data, keys, allData, bl_data, effectiveBaselineEndIdx)
    // IMPORTANT: Fallback baseline is NOT cumulative - it's just repeated mean values
    // So we must NOT cumulate observed values when calculating excess
    calculateExcess(data, firstKey, false, effectiveBaselineStartIdx)
    return
  }

  try {
    const baseUrl = statsUrl || DEFAULT_STATS_URL

    // Round numbers to avoid floating point precision issues (e.g., 82.15455999999999 -> 82.1546)
    // Send as array in POST body to avoid URL length limits with large datasets
    const yData = (seriesData as (string | number)[])
      .map(v => typeof v === 'number' ? Number(v.toFixed(BASELINE_DATA_PRECISION)) : v)

    // bs/be are 1-indexed for R
    const bs = effectiveBaselineStartIdx - firstDataIdx + 1
    const be = effectiveBaselineEndIdx - firstDataIdx + 1

    // Get the starting time period for proper seasonal alignment
    // The xs parameter tells the server what calendar period the first data point represents
    const startLabel = labels[firstDataIdx]
    const xs = startLabel ? labelToXsParam(startLabel, chartType) : null

    // Use POST with JSON body to avoid URL length limits
    // This is especially important for weekly/monthly data with long time series
    const isCumulative = cumulative && s === 1
    const endpoint = isCumulative ? `${baseUrl}cum` : baseUrl

    const body: Record<string, unknown> = {
      y: yData,
      bs,
      be,
      t: trend ? 1 : 0
    }

    // Add non-cumulative specific params
    if (!isCumulative) {
      body.s = s
      body.m = method
    }

    // Add optional xs parameter for seasonal alignment
    if (xs) {
      body.xs = xs
    }

    // Use injected fetch function with queue
    const text = await deps.enqueue(() => deps.fetchBaseline(endpoint, body))
    const json = JSON.parse(text)

    // Update NA/null to undefined and trim to match input data length
    const dataLength = seriesData.length
    json.y = (json.y as (string | number)[]).slice(0, dataLength)
    json.lower = (json.lower as (string | number | null)[]).slice(0, dataLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    json.upper = (json.upper as (string | number | null)[]).slice(0, dataLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    if (json.zscore) {
      json.zscore = (json.zscore as (string | number)[]).slice(0, dataLength)
    }

    // For naive method, the stats API returns actual values within the baseline period
    // instead of a constant. Fix this by using the last baseline value for all positions.
    // The naive baseline should be a horizontal line at the last value of the baseline period.
    if (method === 'naive') {
      const naiveValue = json.y[be - 1]
      if (naiveValue != null && typeof naiveValue === 'number') {
        json.y = (json.y as (number | null)[]).map(v =>
          v != null ? naiveValue : v
        )
      }
    }

    // Re-align baseline arrays back to full label length.
    if (keys[1]) {
      const aligned = new Array(allData.length).fill(null)
      for (let i = 0; i < dataLength; i++) aligned[firstDataIdx + i] = json.y[i]
      data[keys[1]] = aligned as DataVector
    }
    if (keys[2]) {
      const aligned = new Array(allData.length).fill(undefined)
      for (let i = 0; i < dataLength; i++) aligned[firstDataIdx + i] = json.lower[i]
      data[keys[2]] = aligned as DataVector
    }
    if (keys[3]) {
      const aligned = new Array(allData.length).fill(undefined)
      for (let i = 0; i < dataLength; i++) aligned[firstDataIdx + i] = json.upper[i]
      data[keys[3]] = aligned as DataVector
    }

    // Extract z-scores if available
    if (json.zscore && keys[0]) {
      const zscoreKey = `${String(keys[0])}_zscore` as keyof DatasetEntry
      const aligned = new Array(allData.length).fill(undefined)
      for (let i = 0; i < dataLength; i++) aligned[firstDataIdx + i] = json.zscore[i]
      data[zscoreKey] = aligned as DataVector
    }
    // When /cum endpoint succeeds, baseline is cumulative
    // Calculate excess with cumulative baseline handling
    const isBaselineCumulative = cumulative && s === 1
    calculateExcess(data, firstKey, isBaselineCumulative, effectiveBaselineStartIdx)
  } catch (error) {
    logger.error('Baseline calculation failed, using simple mean fallback', error, {
      iso3c: data.iso3c?.[0],
      chartType,
      method,
      baselineStartIdx,
      baselineEndIdx,
      effectiveBaselineStartIdx,
      effectiveBaselineEndIdx,
      blDataLength: bl_data.length,
      validDataPoints
    })

    applyMeanFallback(data, keys, allData, bl_data, effectiveBaselineEndIdx)

    // IMPORTANT: Fallback baseline is NOT cumulative - it's just repeated mean values
    // So we must NOT cumulate observed values when calculating excess
    calculateExcess(data, firstKey, false, effectiveBaselineStartIdx)
  }
}

/**
 * Apply simple mean fallback when external service fails or baseline period is too large
 */
function applyMeanFallback(
  data: DatasetEntry,
  keys: (keyof DatasetEntry)[],
  all_data: unknown[],
  bl_data: unknown[],
  baselineEndIdx: number
): void {
  const validData = bl_data.filter(x => x != null && !isNaN(x as number)) as number[]
  if (validData.length > 0) {
    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
    const stdDev = Math.sqrt(
      validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
    )

    // Create baseline array for full data length
    // Baseline mean is available for all periods
    const baselineArray = new Array(all_data.length).fill(mean)

    // PI (lower/upper) is only calculated AFTER baseline period ends
    // During and before baseline period, PI values are undefined
    // This matches the stats API behavior
    const lowerArray = new Array(all_data.length).fill(undefined)
    const upperArray = new Array(all_data.length).fill(undefined)

    // Only fill PI values for periods AFTER the baseline period (index > baselineEndIdx)
    for (let i = baselineEndIdx + 1; i < all_data.length; i++) {
      lowerArray[i] = mean - 2 * stdDev
      upperArray[i] = mean + 2 * stdDev
    }

    if (keys[1]) data[keys[1]] = baselineArray as DataVector
    if (keys[2]) data[keys[2]] = lowerArray as DataVector
    if (keys[3]) data[keys[3]] = upperArray as DataVector
  }
}

/**
 * Calculate baselines for all entries in dataset
 *
 * @param deps - Injected dependencies (fetch function and queue)
 * @param data - Dataset containing all country data
 * @param labels - Chart labels
 * @param startIdx - Baseline start index
 * @param endIdx - Baseline end index
 * @param keys - Keys for data fields
 * @param method - Baseline calculation method
 * @param chartType - Chart type
 * @param cumulative - Whether cumulative mode is enabled
 * @param progressCb - Optional progress callback
 * @param statsUrl - Optional stats API URL
 */
export const calculateBaselines = async (
  deps: BaselineDependencies,
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
): Promise<void> => {
  let count = 0
  const total = Object.keys(data || {}).reduce(
    (sum, ag) => sum + Object.keys(data[ag] || {}).length,
    0
  )

  const promises = []
  for (const ag of Object.keys(data || {})) {
    for (const iso of Object.keys(data[ag] || {})) {
      promises.push(
        calculateBaseline(
          deps,
          data[ag]?.[iso] || ({} as DatasetEntry),
          labels,
          startIdx,
          endIdx,
          keys,
          method,
          chartType,
          cumulative,
          statsUrl
        ).then(() => {
          if (!progressCb) return
          count++
          progressCb(count, total)
        })
      )
    }
  }
  if (progressCb) progressCb(0, total)
  await Promise.all(promises)
}
