/**
 * Strategy for transforming mortality data to z-scores
 * Z-scores show how many standard deviations each value is from the baseline mean
 */

import { calculateZScores } from '~/lib/calculations/zscores'

/**
 * Transforms mortality data values to z-scores relative to baseline
 */
export class ZScoreTransformStrategy {
  /**
   * Transform data row to z-scores relative to baseline
   * @param dataRow - The data values to transform
   * @param blRow - The baseline values used to calculate mean and stddev
   * @returns Z-score values
   */
  transform(dataRow: number[], blRow: number[]): number[] {
    return calculateZScores(dataRow, blRow)
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
