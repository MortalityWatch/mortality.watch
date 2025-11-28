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
   * @param isExcessData - If true, data is already excess (data - baseline), so just divide by baseline
   * @returns Percentage values as decimal
   *   - For regular data: (data/baseline - 1) gives excess ratio
   *   - For excess data: (excess/baseline) gives excess ratio (already subtracted)
   */
  transform(dataRow: number[], blRow: number[], isExcessData = false): number[] {
    const result = []
    for (let i = 0; i < dataRow.length; i++) {
      const ratio = (dataRow[i] ?? 0) / (blRow[i] ?? 1)
      // For excess data, the subtraction is already done (excess = data - baseline)
      // So excess/baseline gives the correct percentage
      // For regular data, we need data/baseline - 1 to get excess percentage
      result.push(isExcessData ? ratio : ratio - 1)
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
    if (isAsmr) {
      return `${key.split('_')[0]}_${key.split('_')[1]}_baseline`
    } else {
      return `${key.split('_')[0]}_baseline`
    }
  }
}
