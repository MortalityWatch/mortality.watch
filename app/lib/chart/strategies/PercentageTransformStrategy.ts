/**
 * Strategy for transforming absolute values to percentages relative to baseline
 */

/**
 * Transforms absolute data values to percentage values relative to baseline
 */
export class PercentageTransformStrategy {
  /**
   * Transform data row to percentage values relative to baseline.
   * Converts undefined to 0 for main data values.
   * @param dataRow - The data values to transform
   * @param blRow - The baseline values to use as denominator
   * @returns Percentage values (data/baseline)
   */
  transform(dataRow: (number | undefined)[], blRow: (number | undefined)[]): number[] {
    const result: number[] = []
    for (let i = 0; i < dataRow.length; i++) {
      result.push((dataRow[i] ?? 0) / (blRow[i] ?? 1))
    }
    return result
  }

  /**
   * Transform data row to percentage values, preserving null.
   * Used for error bar bounds where null hides the error bar.
   * @param dataRow - The data values to transform
   * @param blRow - The baseline values to use as denominator
   * @returns Percentage values, with null preserved for Chart.js gaps
   */
  transformPreservingUndefined(dataRow: (number | null | undefined)[], blRow: (number | null | undefined)[]): (number | null)[] {
    const result: (number | null)[] = []
    for (let i = 0; i < dataRow.length; i++) {
      const data = dataRow[i]
      // Preserve null to hide error bars for periods without PI (Chart.js uses null for gaps)
      if (data === undefined || data === null) {
        result.push(null)
      } else {
        result.push(data / (blRow[i] ?? 1))
      }
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
