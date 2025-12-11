/**
 * Strategy for transforming data to cumulative sums
 */

import { cumulativeSum } from '@/utils'

/**
 * Transforms data values to cumulative sums
 */
export class CumulativeTransformStrategy {
  /**
   * Transform data row to cumulative sum
   * @param dataRow - The data values to transform
   * @returns Cumulative sum values
   */
  transform(dataRow: number[]): number[] {
    return cumulativeSum(dataRow)
  }
}
