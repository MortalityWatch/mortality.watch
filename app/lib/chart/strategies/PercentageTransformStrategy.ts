/**
 * Strategy for transforming absolute values to percentages relative to baseline
 */

/**
 * Transforms absolute data values to percentage values relative to baseline
 */
export class PercentageTransformStrategy {
  /**
   * Transform data row to percentage values relative to baseline
   * @param dataRow - The data values to transform
   * @param blRow - The baseline values to use as denominator
   * @returns Percentage values (data/baseline)
   */
  transform(dataRow: number[], blRow: number[]): number[] {
    const result = []
    for (let i = 0; i < dataRow.length; i++) {
      result.push((dataRow[i] ?? 0) / (blRow[i] ?? 1))
    }
    return result
  }

  /**
   * Get the baseline key for a given data key
   * @param isAsmr - Whether this is ASMR data
   * @param key - The data key (e.g., 'deaths', 'deaths_excess', 'deaths_excess_lower', 'asmr_who_excess')
   * @returns The baseline key (e.g., 'deaths_baseline', 'deaths_baseline_lower', 'asmr_who_baseline')
   */
  getBaselineKey(isAsmr: boolean, key: string): string {
    // For excess data with confidence intervals, preserve the _lower/_upper suffix
    // because baseline fields exist with those suffixes (deaths_baseline_lower, deaths_baseline_upper)
    const isExcessData = key.includes('_excess')
    const lowerSuffix = key.endsWith('_lower') ? '_lower' : ''
    const upperSuffix = key.endsWith('_upper') ? '_upper' : ''
    const suffix = (lowerSuffix || upperSuffix) && isExcessData ? (lowerSuffix || upperSuffix) : ''

    // Remove _lower or _upper suffix if present
    let baseKey = key
    if (lowerSuffix || upperSuffix) {
      baseKey = key.slice(0, -(lowerSuffix || upperSuffix).length)
    }

    // Remove _excess if present (it will be replaced with _baseline)
    baseKey = baseKey.replace('_excess', '')

    if (isAsmr) {
      // For ASMR keys like 'asmr_who' or 'asmr_european'
      const parts = baseKey.split('_')
      if (parts.length >= 2) {
        return `${parts[0]}_${parts[1]}_baseline${suffix}`
      }
    }

    // For non-ASMR keys like 'deaths', 'cmr', 'le'
    const parts = baseKey.split('_')
    return `${parts[0]}_baseline${suffix}`
  }
}
