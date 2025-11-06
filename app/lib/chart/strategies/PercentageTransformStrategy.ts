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
   * @param key - The data key
   * @returns The baseline key
   */
  getBaselineKey(isAsmr: boolean, key: string): string {
    // Handle confidence interval suffixes (_lower, _upper)
    const ciSuffix = key.endsWith('_lower') ? '_lower' : key.endsWith('_upper') ? '_upper' : ''
    const keyWithoutCi = ciSuffix ? key.slice(0, -ciSuffix.length) : key

    // Remove _excess suffix if present
    const keyWithoutExcess = keyWithoutCi.replace(/_excess$/, '')

    if (isAsmr) {
      // ASMR format: asmr_who_excess → asmr_who_baseline
      const parts = keyWithoutExcess.split('_')
      return `${parts[0]}_${parts[1]}_baseline${ciSuffix}`
    } else {
      // Non-ASMR format: deaths_excess → deaths_baseline
      const parts = keyWithoutExcess.split('_')
      return `${parts[0]}_baseline${ciSuffix}`
    }
  }
}
