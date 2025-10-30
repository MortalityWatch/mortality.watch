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
    if (isAsmr) {
      return `${key.split('_')[0]}_${key.split('_')[1]}_baseline`
    } else {
      return `${key.split('_')[0]}_baseline`
    }
  }
}
