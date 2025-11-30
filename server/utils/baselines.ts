/**
 * Server-side baseline calculations
 *
 * This module provides baseline calculation functionality for SSR chart rendering.
 * It mirrors the client-side baselines.ts but uses server-side fetch with circuit breaker.
 */

import type {
  Dataset,
  DatasetEntry,
  NumberArray,
  DataVector
} from '../../app/model'
import { fetchBaselineWithCircuitBreaker } from './baselineApi'

// Default stats API URL - can be overridden via NUXT_PUBLIC_STATS_URL
const DEFAULT_STATS_URL = 'https://stats.mortality.watch/'

/**
 * Calculate excess mortality from baseline data
 */
const calculateExcess = (data: DatasetEntry, key: keyof DatasetEntry): void => {
  const currentValues = data[key] as NumberArray
  const baseline = data[`${key}_baseline` as keyof DatasetEntry] as NumberArray
  const baselineLower = data[
    `${key}_baseline_lower` as keyof DatasetEntry
  ] as NumberArray
  const baselineUpper = data[
    `${key}_baseline_upper` as keyof DatasetEntry
  ] as NumberArray

  // Ensure arrays are initialized
  if (!data[`${key}_excess` as keyof DatasetEntry])
    data[`${key}_excess` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_lower` as keyof DatasetEntry])
    data[`${key}_excess_lower` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_upper` as keyof DatasetEntry])
    data[`${key}_excess_upper` as keyof DatasetEntry] = []

  const excess = data[`${key}_excess` as keyof DatasetEntry] as NumberArray | undefined
  const excessLower = data[`${key}_excess_lower` as keyof DatasetEntry] as NumberArray | undefined
  const excessUpper = data[`${key}_excess_upper` as keyof DatasetEntry] as NumberArray | undefined

  if (!excess || !excessLower || !excessUpper) return

  for (let i = 0; i < currentValues.length; i++) {
    const currentValue = currentValues[i] ?? 0
    const base = baseline[i] ?? 0
    const baseLower = baselineLower[i]
    const baseUpper = baselineUpper[i]

    excess[i] = currentValue - base
    // Propagate undefined for periods where PI is not calculated (baseline period)
    excessLower[i] = baseLower !== undefined ? currentValue - baseLower : undefined
    excessUpper[i] = baseUpper !== undefined ? currentValue - baseUpper : undefined
  }
}

/**
 * Get season type based on chart type
 */
const getSeasonType = (chartType: string) => {
  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma':
      return 4
    case 'monthly':
      return 3
    case 'quarterly':
      return 2
    default:
      return 1
  }
}

/**
 * Calculate baseline for a single dataset entry
 *
 * Sends full data to stats API with bs/be parameters to specify baseline range.
 * This allows z-scores to be calculated for all periods (pre-baseline, baseline, post-baseline).
 *
 * @param baselineStartIdx - 0-indexed start of baseline period within labels
 * @param baselineEndIdx - 0-indexed end of baseline period within labels (inclusive)
 * @param statsUrl - Optional stats API URL (defaults to https://stats.mortality.watch/)
 */
const calculateBaseline = async (
  data: DatasetEntry,
  labels: string[],
  baselineStartIdx: number,
  baselineEndIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean,
  statsUrl?: string
) => {
  if (method === 'auto') return

  const n = labels.length
  const firstKey = keys[0]

  // Use full data array - labels and data should be aligned
  // Baseline is calculated on full dataset; slider filtering happens at display time
  const all_data = firstKey ? (data[firstKey]?.slice(0, n) || []) : []
  const bl_data = all_data.slice(baselineStartIdx, baselineEndIdx + 1)
  const trend = method === 'lin_reg' // Only linear regression uses trend mode (t=1)
  const s = getSeasonType(chartType)

  if (bl_data.every(x => x == null || isNaN(x as number))) return

  // Validate indices before making API call
  if (baselineStartIdx < 0 || baselineEndIdx < 0) {
    console.warn('Invalid baseline indices:', {
      baselineStartIdx,
      baselineEndIdx,
      chartType,
      labelsLength: labels.length,
      firstLabel: labels[0],
      lastLabel: labels[labels.length - 1]
    })
    return
  }

  // Ensure we have enough data points for meaningful baseline calculation
  const validDataPoints = bl_data.filter(x => x != null && !isNaN(x as number)).length
  if (validDataPoints < 3) {
    console.warn('Insufficient data points for baseline calculation:', {
      iso3c: data.iso3c?.[0],
      validDataPoints,
      blDataLength: bl_data.length,
      baselineStartIdx,
      baselineEndIdx,
      chartType
    })
    return
  }

  try {
    const baseUrl = statsUrl || DEFAULT_STATS_URL
    // Send full dataset with bs/be params to specify baseline range
    // API uses 1-indexed values, so add 1 to our 0-indexed values
    const dataParam = (all_data as (string | number)[]).join(',')
    const bs = baselineStartIdx + 1 // Convert to 1-indexed
    const be = baselineEndIdx + 1 // Convert to 1-indexed
    // With bs/be, PI is calculated for all post-be periods - no h needed
    const url
      = cumulative && s === 1
        ? `${baseUrl}cum?y=${dataParam}&bs=${bs}&be=${be}&t=${trend ? 1 : 0}`
        : `${baseUrl}?y=${dataParam}&bs=${bs}&be=${be}&s=${s}&t=${trend ? 1 : 0}&m=${method}`

    // Use server-side fetch with circuit breaker
    const text = await fetchBaselineWithCircuitBreaker(url)
    const json = JSON.parse(text)

    // Update NA/null to undefined and trim forecast values (API returns input length + h)
    // We only want the first n values (matching our input data length)
    // Note: Stats API returns null for baseline period where PI is not calculated
    const inputLength = all_data.length
    json.y = (json.y as (string | number)[]).slice(0, inputLength)
    json.lower = (json.lower as (string | number | null)[]).slice(0, inputLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    json.upper = (json.upper as (string | number | null)[]).slice(0, inputLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    if (json.zscore) {
      json.zscore = (json.zscore as (string | number)[]).slice(0, inputLength)
    }

    // Response is aligned with input - no prefill needed since we send from index 0
    if (keys[1]) data[keys[1]] = json.y as DataVector
    if (keys[2]) data[keys[2]] = json.lower as DataVector
    if (keys[3]) data[keys[3]] = json.upper as DataVector

    // Extract z-scores if available
    if (json.zscore && keys[0]) {
      const zscoreKey = `${String(keys[0])}_zscore` as keyof DatasetEntry
      data[zscoreKey] = json.zscore as DataVector
    }
  } catch (error) {
    console.error('Baseline calculation failed, using simple mean fallback:', {
      iso3c: data.iso3c?.[0],
      chartType,
      method,
      baselineStartIdx,
      baselineEndIdx,
      blDataLength: bl_data.length,
      validDataPoints,
      error
    })

    // Fallback: Use simple mean baseline when external service fails
    const validData = bl_data.filter(x => x != null && !isNaN(x as number)) as number[]
    if (validData.length > 0) {
      const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
      const stdDev = Math.sqrt(
        validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
      )

      // Create baseline array for full data length
      const baselineArray = new Array(all_data.length).fill(mean)
      const lowerArray = new Array(all_data.length).fill(mean - 2 * stdDev)
      const upperArray = new Array(all_data.length).fill(mean + 2 * stdDev)

      if (keys[1]) data[keys[1]] = baselineArray as DataVector
      if (keys[2]) data[keys[2]] = lowerArray as DataVector
      if (keys[3]) data[keys[3]] = upperArray as DataVector
    }
  }

  if (firstKey) calculateExcess(data, firstKey)
}

/**
 * Calculate baselines for all entries in dataset
 *
 * @param statsUrl - Optional stats API URL (defaults to https://stats.mortality.watch/)
 */
export const calculateBaselines = async (
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
) => {
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
          data[ag]?.[iso] || ({} as DatasetEntry),
          labels,
          startIdx,
          endIdx,
          keys,
          method,
          chartType,
          cumulative,
          statsUrl
        ).then((result) => {
          if (!progressCb) return
          count++
          progressCb(count, total)
          return result
        })
      )
    }
  }
  if (progressCb) progressCb(0, total)
  await Promise.all(promises)
}
