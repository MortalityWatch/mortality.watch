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
   * @param availableLabels - Array of valid labels for the current period type
   * @param minSpan - Minimum number of periods required (optional, for baseline validation)
   * @returns Validation result with corrected values if invalid
   */
  function validateRange(
    range: DateRange,
    availableLabels: string[],
    defaultRange: DateRange,
    minSpan?: number
  ): ValidationResult {
    if (availableLabels.length === 0) {
      return {
        isValid: false,
        correctedRange: defaultRange
      }
    }

    const fromIdx = availableLabels.indexOf(range.from)
    const toIdx = availableLabels.indexOf(range.to)

    // Check if dates exist in labels
    if (fromIdx === -1 || toIdx === -1) {
      return {
        isValid: false,
        correctedRange: defaultRange
      }
    }

    // Check if range is valid (to >= from)
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
    availableLabels: string[],
    defaultRange: DateRange,
    minSpan?: number
  ): DateRange {
    const result = validateRange(range, availableLabels, defaultRange, minSpan)
    return result.correctedRange
  }

  return {
    validateRange,
    getValidatedRange
  }
}
