/**
 * Data validation and sanitization utilities for mortality data
 */

/**
 * Minimum threshold for baseline values to be considered valid
 */
export const MIN_BASELINE_THRESHOLD = 0.1

/**
 * Threshold for detecting -100% sentinel values in data
 */
export const SENTINEL_VALUE_THRESHOLD = 0.01

/**
 * Check if a data point and its baseline are valid for calculation
 *
 * @param value - The metric value to check
 * @param baseline - The baseline value to check against
 * @returns true if both values are valid for division
 */
export function isValidDataPoint(value: number | null | undefined, baseline: number | null | undefined): boolean {
  if (value == null || isNaN(value)) return false
  if (baseline == null || isNaN(baseline)) return false
  if (Math.abs(baseline) < MIN_BASELINE_THRESHOLD) return false
  return true
}

/**
 * Calculate relative excess mortality with sentinel value filtering
 *
 * @param metric - The excess mortality metric
 * @param baseline - The baseline value
 * @param decimals - Number of decimal places for rounding
 * @returns The relative excess as a decimal, or NaN if invalid
 */
export function calculateRelativeExcess(
  metric: number | undefined | null,
  baseline: number | undefined | null,
  _decimals = 3
): number {
  if (!isValidDataPoint(metric, baseline)) {
    return NaN
  }

  const result = metric! / baseline!

  // Filter out -100% sentinel values (typically indicates missing data)
  if (Math.abs(result - (-1)) < SENTINEL_VALUE_THRESHOLD) {
    return NaN
  }

  return result
}

/**
 * Sanitize array values by converting undefined/null to NaN
 *
 * @param arr - Array potentially containing undefined/null values
 * @returns Array with undefined/null replaced by NaN
 */
export function sanitizeArray(arr: (number | undefined | null)[]): number[] {
  return arr.map(v => (v === undefined || v === null ? NaN : v))
}

/**
 * Filter array to remove invalid values (null, undefined, NaN)
 *
 * @param arr - Array to filter
 * @returns Array with only valid numbers
 */
export function filterValidNumbers(arr: (number | undefined | null)[]): number[] {
  return arr.filter((v): v is number => v != null && !isNaN(v))
}
