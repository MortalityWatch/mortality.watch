/**
 * Steep Drop Detection
 *
 * Detects artificial steep drops in mortality data caused by reporting delays.
 * Recent weeks/months often show incomplete data, causing charts to end with
 * an unrealistic sharp drop that can be misleading.
 *
 * This module provides functions to:
 * 1. Detect if a steep drop exists in the recent data
 * 2. Find an adjusted end date that excludes the steep drop period
 *
 * The detection is based on comparing recent values against the median
 * of a lookback window. If recent values drop below a threshold percentage
 * of the median, a steep drop is detected.
 */

/**
 * Configuration for steep drop detection per chart type.
 * Different chart types have different data frequencies and thus
 * need different lookback periods for reliable median calculation.
 */
export interface SteepDropConfig {
  /** Number of periods to look back for calculating median (reference window) */
  lookbackPeriods: number
  /** Number of recent periods to check for drops */
  checkPeriods: number
  /** Threshold as a fraction (0.0 to 1.0) - values below (median * threshold) trigger detection */
  dropThreshold: number
}

/**
 * Default configurations per chart type
 */
export const STEEP_DROP_CONFIGS: Record<string, SteepDropConfig> = {
  weekly: {
    lookbackPeriods: 26, // 6 months of context
    checkPeriods: 4, // Check last 4 weeks
    dropThreshold: 0.80 // 20% drop triggers detection
  },
  monthly: {
    lookbackPeriods: 12, // 1 year of context
    checkPeriods: 2, // Check last 2 months
    dropThreshold: 0.80
  },
  quarterly: {
    lookbackPeriods: 8, // 2 years of context
    checkPeriods: 1, // Check last quarter
    dropThreshold: 0.80
  },
  yearly: {
    lookbackPeriods: 5, // 5 years of context
    checkPeriods: 1, // Check last year
    dropThreshold: 0.80
  },
  fluseason: {
    lookbackPeriods: 5, // 5 flu seasons
    checkPeriods: 1, // Check last season
    dropThreshold: 0.80
  },
  midyear: {
    lookbackPeriods: 5, // 5 mid-year periods
    checkPeriods: 1, // Check last period
    dropThreshold: 0.80
  }
}

/**
 * Result of steep drop detection
 */
export interface SteepDropResult {
  /** Whether a steep drop was detected */
  detected: boolean
  /** The index in the data array where the steep drop begins (first dropped period) */
  dropStartIndex: number | null
  /** Suggested end index (exclusive) for the data to hide the steep drop */
  adjustedEndIndex: number | null
}

/**
 * Calculate the median of an array of numbers, ignoring null values
 */
function calculateMedian(values: (number | null)[]): number | null {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v) && isFinite(v))
  if (validValues.length === 0) return null

  const sorted = [...validValues].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}

/**
 * Detect steep drop in mortality data
 *
 * Algorithm:
 * 1. Extract a lookback window of recent data (excluding the check periods)
 * 2. Calculate the median of this lookback window
 * 3. Check if any of the recent periods (check periods) fall below the threshold
 * 4. If consecutive periods from the end are below threshold, identify the drop start
 *
 * @param data - Array of values (deaths, rates, etc.) for a single country/series
 * @param chartType - The chart type for selecting appropriate config
 * @param config - Optional custom configuration (overrides default for chart type)
 * @returns Detection result with drop information
 */
export function detectSteepDrop(
  data: (number | null)[],
  chartType: string,
  config?: Partial<SteepDropConfig>
): SteepDropResult {
  // Get base config for chart type, fall back to weekly if unknown
  const baseConfig = STEEP_DROP_CONFIGS[chartType] || STEEP_DROP_CONFIGS.weekly!
  const mergedConfig: SteepDropConfig = { ...baseConfig, ...config }

  const { lookbackPeriods, checkPeriods, dropThreshold } = mergedConfig

  // Need enough data for meaningful analysis
  const minDataPoints = lookbackPeriods + checkPeriods
  if (data.length < minDataPoints) {
    return { detected: false, dropStartIndex: null, adjustedEndIndex: null }
  }

  // Extract lookback window (before the check periods)
  const lookbackEnd = data.length - checkPeriods
  const lookbackStart = Math.max(0, lookbackEnd - lookbackPeriods)
  const lookbackWindow = data.slice(lookbackStart, lookbackEnd)

  // Calculate median of lookback window
  const median = calculateMedian(lookbackWindow)
  if (median === null || median <= 0) {
    return { detected: false, dropStartIndex: null, adjustedEndIndex: null }
  }

  // Calculate the drop threshold value
  const thresholdValue = median * dropThreshold

  // Check recent periods from the end, looking for consecutive drops
  // We scan from the end backwards to find where the drop starts
  let dropStartIndex: number | null = null

  for (let i = data.length - 1; i >= lookbackEnd; i--) {
    const value = data[i]
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      // Treat null/undefined/invalid as a drop (incomplete data)
      dropStartIndex = i
    } else if (value < thresholdValue) {
      // Value is below threshold - this is part of the drop
      dropStartIndex = i
    } else {
      // Found a valid value above threshold - stop looking
      break
    }
  }

  if (dropStartIndex === null) {
    return { detected: false, dropStartIndex: null, adjustedEndIndex: null }
  }

  return {
    detected: true,
    dropStartIndex,
    adjustedEndIndex: dropStartIndex // End index is exclusive, so use dropStartIndex
  }
}

/**
 * Find the adjusted end label when hiding steep drops
 *
 * @param data - Array of values for a single country/series
 * @param labels - Array of date labels corresponding to data
 * @param chartType - The chart type
 * @param config - Optional custom configuration
 * @returns The adjusted end label, or null if no adjustment needed
 */
export function findAdjustedEndLabel(
  data: (number | null)[],
  labels: string[],
  chartType: string,
  config?: Partial<SteepDropConfig>
): string | null {
  if (data.length === 0 || labels.length === 0) return null
  if (data.length !== labels.length) return null

  const result = detectSteepDrop(data, chartType, config)

  if (!result.detected || result.adjustedEndIndex === null) {
    return null
  }

  // adjustedEndIndex is where the drop starts, so we want the label just before
  const labelIndex = result.adjustedEndIndex - 1
  if (labelIndex < 0 || labelIndex >= labels.length) {
    return null
  }

  return labels[labelIndex]!
}

/**
 * Detect steep drop across multiple data series and find a common adjusted end
 *
 * When multiple countries/age groups are displayed, we need to find the earliest
 * drop across all series to ensure consistent chart rendering.
 *
 * @param dataArrays - Array of data series (one per country/age group)
 * @param labels - Array of date labels (same for all series)
 * @param chartType - The chart type
 * @param config - Optional custom configuration
 * @returns The adjusted end label (earliest across all series), or null if no drops detected
 */
export function findCommonAdjustedEndLabel(
  dataArrays: (number | null)[][],
  labels: string[],
  chartType: string,
  config?: Partial<SteepDropConfig>
): string | null {
  if (dataArrays.length === 0 || labels.length === 0) return null

  let earliestDropIndex: number | null = null

  for (const data of dataArrays) {
    if (data.length !== labels.length) continue

    const result = detectSteepDrop(data, chartType, config)

    if (result.detected && result.adjustedEndIndex !== null) {
      if (earliestDropIndex === null || result.adjustedEndIndex < earliestDropIndex) {
        earliestDropIndex = result.adjustedEndIndex
      }
    }
  }

  if (earliestDropIndex === null) {
    return null
  }

  // Get the label just before the earliest drop
  const labelIndex = earliestDropIndex - 1
  if (labelIndex < 0 || labelIndex >= labels.length) {
    return null
  }

  return labels[labelIndex]!
}
