/**
 * Strategy for transforming data to total sums
 */

import { sum } from '~/utils'

/**
 * Transforms data values to a single total sum
 */
export class TotalTransformStrategy {
  /**
   * Transform data row to single total value
   * @param dataRow - The data values to transform
   * @returns Array with single total sum value
   */
  transform(dataRow: number[]): number[] {
    return [sum(dataRow)]
  }
}
