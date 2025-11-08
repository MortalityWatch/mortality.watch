import type {
  Dataset,
  DatasetEntry,
  NumberArray,
  DataVector
} from '~/model'
import { prefillUndefined } from '~/utils'
import { dataLoader } from '../dataLoader'

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

  const excess = data[`${key}_excess` as keyof DatasetEntry]
  const excessLower = data[`${key}_excess_lower` as keyof DatasetEntry]
  const excessUpper = data[`${key}_excess_upper` as keyof DatasetEntry]

  for (let i = 0; i < currentValues.length; i++) {
    const currentValue = currentValues[i] ?? 0
    const base = baseline[i] ?? 0
    const baseLower = baselineLower[i] ?? 0
    const baseUpper = baselineUpper[i] ?? 0

    excess[i] = currentValue - base
    excessLower[i] = currentValue - baseLower
    excessUpper[i] = currentValue - baseUpper
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
 */
const calculateBaseline = async (
  data: DatasetEntry,
  labels: string[],
  startIdx: number,
  endIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean
) => {
  if (method === 'auto') return

  const n = labels.length
  const firstKey = keys[0]
  const all_data = firstKey ? (data[firstKey]?.slice(startIdx, n) || []) : []
  const bl_data = firstKey ? (data[firstKey]?.slice(startIdx, endIdx + 1) || []) : []
  const h = all_data.length - bl_data.length
  const trend = method === 'lin_reg' // Only linear regression uses trend mode (t=1)
  const s = getSeasonType(chartType)

  if (bl_data.every(x => x == null || isNaN(x as number))) return

  // Validate indices before making API call
  if (startIdx < 0 || endIdx < 0) {
    console.warn('Invalid baseline indices:', {
      startIdx,
      endIdx,
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
      startIdx,
      endIdx,
      chartType
    })
    return
  }

  try {
    const baseUrl = 'https://stats.mortality.watch/'
    const dataParam
      = cumulative && s === 1 ? (all_data as (string | number)[]).join(',') : (bl_data as (string | number)[]).join(',')
    const url
      = cumulative && s === 1
        ? `${baseUrl}cum?y=${dataParam}&h=${h}&t=${trend ? 1 : 0}`
        : `${baseUrl}?y=${dataParam}&h=${h}&s=${s}&t=${trend ? 1 : 0}&m=${method}`

    const text = await dataLoader.fetchBaseline(url)
    const json = JSON.parse(text)

    // Update NA to undefined
    json.lower = (json.lower as string[]).map(x =>
      x === 'NA' ? undefined : x
    )
    json.upper = (json.upper as string[]).map(x =>
      x === 'NA' ? undefined : x
    )

    if (keys[1]) data[keys[1]] = prefillUndefined(
      json.y as NumberArray,
      startIdx
    ) as DataVector
    if (keys[2]) data[keys[2]] = prefillUndefined(json.lower, startIdx) as DataVector
    if (keys[3]) data[keys[3]] = prefillUndefined(json.upper, startIdx) as DataVector

    // Extract z-scores if available
    if (json.zscore && keys[0]) {
      const zscoreKey = `${String(keys[0])}_zscore` as keyof DatasetEntry
      data[zscoreKey] = prefillUndefined(json.zscore as NumberArray, startIdx) as DataVector
      console.log('[baselines] Extracted z-scores:', {
        key: keys[0],
        zscoreKey,
        hasZscores: !!json.zscore,
        zscoreLength: json.zscore?.length,
        sample: json.zscore?.slice(0, 5),
        dataObjectKeys: Object.keys(data),
        iso3c: data.iso3c?.[0],
        zscoreValueSet: !!data[zscoreKey]
      })
    }
  } catch (error) {
    console.error('Baseline calculation failed, using simple mean fallback:', {
      iso3c: data.iso3c?.[0],
      chartType,
      method,
      startIdx,
      endIdx,
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

      // Create baseline array filled with mean value
      const baselineArray = new Array(all_data.length).fill(mean)
      const lowerArray = new Array(all_data.length).fill(mean - 2 * stdDev)
      const upperArray = new Array(all_data.length).fill(mean + 2 * stdDev)

      if (keys[1]) data[keys[1]] = prefillUndefined(baselineArray as NumberArray, startIdx) as DataVector
      if (keys[2]) data[keys[2]] = prefillUndefined(lowerArray as NumberArray, startIdx) as DataVector
      if (keys[3]) data[keys[3]] = prefillUndefined(upperArray as NumberArray, startIdx) as DataVector
    }
  }

  if (firstKey) calculateExcess(data, firstKey)
}

/**
 * Calculate baselines for all entries in dataset
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
  progressCb?: (progress: number, total: number) => void
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
          cumulative
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
