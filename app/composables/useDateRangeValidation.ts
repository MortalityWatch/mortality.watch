import type { ChartPeriod } from '~/model/period'

export interface DateRange {
  from: string
  to: string
}

export interface ValidationResult {
  isValid: boolean
  correctedRange: DateRange
}

/**
 * Composable for validating and correcting date ranges
 * based on available labels and period type constraints
 */
export function useDateRangeValidation() {
  /**
   * Validate a date range against available labels
   * @param range - The date range to validate
   * @param period - ChartPeriod containing valid labels for the current period type
   * @param minSpan - Minimum number of periods required (optional, for baseline validation)
   * @returns Validation result with corrected values if invalid
   */
  function validateRange(
    range: DateRange,
    period: ChartPeriod,
    defaultRange: DateRange,
    minSpan?: number
  ): ValidationResult {
    if (period.length === 0) {
      return {
        isValid: false,
        correctedRange: defaultRange
      }
    }

    const fromIdx = period.indexOf(range.from)
    const toIdx = period.indexOf(range.to)

    // Check if range is valid (to >= from)
    // Note: ChartPeriod.indexOf() returns valid index with fallback, so no -1 check needed
    if (toIdx < fromIdx) {
      return {
        isValid: false,
        correctedRange: defaultRange
      }
    }

    // Check minimum span if provided (for baseline validation)
    if (minSpan !== undefined && (toIdx - fromIdx) < minSpan) {
      return {
        isValid: false,
        correctedRange: defaultRange
      }
    }

    return {
      isValid: true,
      correctedRange: range
    }
  }

  /**
   * Validate and return corrected range, or original if valid
   */
  function getValidatedRange(
    range: DateRange,
    period: ChartPeriod,
    defaultRange: DateRange,
    minSpan?: number
  ): DateRange {
    const result = validateRange(range, period, defaultRange, minSpan)
    return result.correctedRange
  }

  return {
    validateRange,
    getValidatedRange
  }
}
