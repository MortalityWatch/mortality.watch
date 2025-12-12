import type {
  Dataset,
  DatasetEntry,
  NumberArray,
  DataVector
} from '@/model'
import { dataLoader } from '../dataLoader'
import { getMaxBaselinePeriod, EXTERNAL_SERVICES } from '../config/constants'
import { logger } from '../logger'

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

// Default stats API URL - can be overridden via NUXT_PUBLIC_STATS_URL
const DEFAULT_STATS_URL = EXTERNAL_SERVICES.STATS_API_URL

/**
 * Convert a chart label to the xs (start time) parameter format for the stats API
 *
 * Label formats by chart type:
 * - Weekly: "2020 W01" -> "2020W01"
 * - Monthly: "2020 Jan" -> "2020-01"
 * - Quarterly: "2020 Q1" -> "2020Q1"
 * - Yearly: "2020" -> "2020"
 * - Fluseason/midyear: "2019/20" -> "2019" (use start year)
 */
const labelToXsParam = (label: string, chartType: string): string | null => {
  if (!label) return null

  // Weekly: "2020 W01" -> "2020W01"
  if (chartType.startsWith('weekly')) {
    const match = label.match(/^(\d{4})\s*W(\d{2})$/)
    if (match) {
      return `${match[1]}W${match[2]}`
    }
    return null
  }

  // Monthly: "2020 Jan" -> "2020-01"
  if (chartType === 'monthly') {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    }
    const match = label.match(/^(\d{4})\s+(\w{3})$/)
    if (match && match[1] && match[2] && months[match[2]]) {
      return `${match[1]}-${months[match[2]]}`
    }
    return null
  }

  // Quarterly: "2020 Q1" -> "2020Q1"
  if (chartType === 'quarterly') {
    const match = label.match(/^(\d{4})\s*Q(\d)$/)
    if (match && match[1] && match[2]) {
      return `${match[1]}Q${match[2]}`
    }
    return null
  }

  // Fluseason/midyear: "2019/20" -> "2019" (use start year, treated as yearly)
  if (chartType === 'fluseason' || chartType === 'midyear') {
    const match = label.match(/^(\d{4})\/\d{2}$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  }

  // Yearly: "2020" -> "2020"
  const yearMatch = label.match(/^(\d{4})$/)
  if (yearMatch && yearMatch[1]) {
    return yearMatch[1]
  }

  return null
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
    logger.warn('Invalid baseline indices', {
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
    logger.warn('Insufficient data points for baseline calculation', {
      iso3c: data.iso3c?.[0],
      validDataPoints,
      blDataLength: bl_data.length,
      baselineStartIdx,
      baselineEndIdx,
      chartType
    })
    return
  }

  // Validate baseline period length to prevent server timeouts
  const baselinePeriodLength = baselineEndIdx - baselineStartIdx + 1
  const maxPeriod = getMaxBaselinePeriod(chartType)
  if (baselinePeriodLength > maxPeriod) {
    logger.warn('Baseline period too large, using fallback calculation', {
      iso3c: data.iso3c?.[0],
      baselinePeriodLength,
      maxPeriod,
      chartType
    })
    // Use simple mean fallback for excessively large baseline periods
    const validData = bl_data.filter(x => x != null && !isNaN(x as number)) as number[]
    if (validData.length > 0) {
      const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
      const stdDev = Math.sqrt(
        validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
      )
      const baselineArray = new Array(all_data.length).fill(mean)
      const lowerArray = new Array(all_data.length).fill(mean - 2 * stdDev)
      const upperArray = new Array(all_data.length).fill(mean + 2 * stdDev)

      if (keys[1]) data[keys[1]] = baselineArray as DataVector
      if (keys[2]) data[keys[2]] = lowerArray as DataVector
      if (keys[3]) data[keys[3]] = upperArray as DataVector

      if (firstKey) calculateExcess(data, firstKey)
    }
    return
  }

  try {
    const baseUrl = statsUrl || DEFAULT_STATS_URL

    // Only send data from baseline start onwards to reduce payload size
    // This significantly reduces the URL length and server processing time
    const trimmed_data = all_data.slice(baselineStartIdx)
    const dataParam = (trimmed_data as (string | number)[]).join(',')

    // Adjust bs/be to be relative to trimmed data (1-indexed)
    // Since we start from baselineStartIdx, baseline now starts at index 1
    const bs = 1
    const be = baselineEndIdx - baselineStartIdx + 1

    // Get the starting time period for proper seasonal alignment
    // The xs parameter tells the server what calendar period the first data point represents
    const startLabel = labels[baselineStartIdx]
    const xs = startLabel ? labelToXsParam(startLabel, chartType) : null
    const xsParam = xs ? `&xs=${xs}` : ''

    // With bs/be, PI is calculated for all post-be periods - no h needed
    const url
      = cumulative && s === 1
        ? `${baseUrl}cum?y=${dataParam}&bs=${bs}&be=${be}&t=${trend ? 1 : 0}${xsParam}`
        : `${baseUrl}?y=${dataParam}&bs=${bs}&be=${be}&s=${s}&t=${trend ? 1 : 0}&m=${method}${xsParam}`

    const text = await dataLoader.fetchBaseline(url)
    const json = JSON.parse(text)

    // Update NA/null to undefined and trim forecast values (API returns input length + h)
    // We only want values matching our trimmed input data length
    const trimmedLength = trimmed_data.length
    json.y = (json.y as (string | number)[]).slice(0, trimmedLength)
    json.lower = (json.lower as (string | number | null)[]).slice(0, trimmedLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    json.upper = (json.upper as (string | number | null)[]).slice(0, trimmedLength).map((x: string | number | null) =>
      x === 'NA' || x === null ? undefined : x
    )
    if (json.zscore) {
      json.zscore = (json.zscore as (string | number)[]).slice(0, trimmedLength)
    }

    // Prefill arrays for indices before baselineStartIdx with undefined
    // Response is aligned with trimmed input starting at baselineStartIdx
    const prefill = new Array(baselineStartIdx).fill(undefined)

    if (keys[1]) data[keys[1]] = [...prefill, ...json.y] as DataVector
    if (keys[2]) data[keys[2]] = [...prefill, ...json.lower] as DataVector
    if (keys[3]) data[keys[3]] = [...prefill, ...json.upper] as DataVector

    // Extract z-scores if available
    if (json.zscore && keys[0]) {
      const zscoreKey = `${String(keys[0])}_zscore` as keyof DatasetEntry
      data[zscoreKey] = [...prefill, ...json.zscore] as DataVector
    }
  } catch (error) {
    logger.error('Baseline calculation failed, using simple mean fallback', error, {
      iso3c: data.iso3c?.[0],
      chartType,
      method,
      baselineStartIdx,
      baselineEndIdx,
      blDataLength: bl_data.length,
      validDataPoints
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
