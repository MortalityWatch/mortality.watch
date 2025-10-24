/**
 * Composable for converting years to period-specific formats
 * Handles conversion for different period types (yearly, quarterly, monthly, etc.)
 */
export function usePeriodFormat() {
  /**
   * Get the first period of a year for a given period type
   * @param year - The year to convert
   * @param periodType - The type of period (yearly, quarterly, monthly, etc.)
   * @returns The formatted first period string
   */
  function getPeriodStart(year: number, periodType: string): string {
    switch (periodType) {
      case 'yearly':
        return `${year}`
      case 'midyear':
      case 'fluseason':
        return `${year - 1}/${year.toString().slice(-2)}`
      case 'quarterly':
        return `${year} Q1`
      case 'monthly':
        return `${year} Jan`
    }
    throw new Error(`Invalid period type: ${periodType}`)
  }

  /**
   * Get the last period of a year for a given period type
   * @param year - The year to convert
   * @param periodType - The type of period (yearly, quarterly, monthly, etc.)
   * @returns The formatted last period string
   */
  function getPeriodEnd(year: number, periodType: string): string {
    switch (periodType) {
      case 'yearly':
        return `${year}`
      case 'midyear':
      case 'fluseason':
        return `${year - 1}/${year.toString().slice(-2)}`
      case 'quarterly':
        return `${year} Q4`
      case 'monthly':
        return `${year} Dec`
    }
    throw new Error(`Invalid period type: ${periodType}`)
  }

  return {
    getPeriodStart,
    getPeriodEnd
  }
}
