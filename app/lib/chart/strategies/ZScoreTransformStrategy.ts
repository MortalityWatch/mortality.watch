/**
 * Strategy for accessing pre-calculated z-score data and computing
 * variance-stabilized z-scores via Box-Cox transformation.
 */

import { varianceStabilizedZScores } from '../../math/boxcox'

/** Z-score method types */
export type ZScoreMethod = 'standard' | 'variance_stabilized'

/**
 * Provides z-score data via standard (pre-calculated) or variance-stabilized (Box-Cox) methods
 */
export class ZScoreTransformStrategy {
  /**
   * Get the z-score key for a given data key
   * Z-scores are pre-calculated by the R stats API during baseline calculation
   * @param isAsmr - Whether this is ASMR data
   * @param key - The data key (e.g., "deaths", "asmr_who")
   * @returns The z-score key (e.g., "deaths_zscore", "asmr_who_zscore")
   */
  getZScoreKey(isAsmr: boolean, key: string): string {
    if (isAsmr) {
      // For ASMR: asmr_who -> asmr_who_zscore
      return `${key.split('_')[0]}_${key.split('_')[1]}_zscore`
    } else if (key === 'le_adj') {
      // For seasonally adjusted LE: le_adj -> le_adj_zscore
      return 'le_adj_zscore'
    } else {
      // For other metrics: deaths -> deaths_zscore, le -> le_zscore
      return `${key.split('_')[0]}_zscore`
    }
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
    } else if (key === 'le_adj') {
      return 'le_adj_baseline'
    } else {
      return `${key.split('_')[0]}_baseline`
    }
  }

  /**
   * Get z-score data using the specified method.
   *
   * - 'standard': Returns pre-calculated z-scores from the R stats API
   * - 'variance_stabilized': Computes Box-Cox variance-stabilized z-scores client-side,
   *   falling back to standard z-scores if Box-Cox fails
   *
   * @param method - Z-score calculation method
   * @param data - Full data record with all metric fields
   * @param isAsmr - Whether this is ASMR data
   * @param key - The data key
   * @param period - Seasonal period for Guerrero estimation
   * @param isDev - Whether to log debug info
   * @returns Z-score array
   */
  getZScoreData(
    method: ZScoreMethod,
    data: Record<string, number[]>,
    isAsmr: boolean,
    key: string,
    period: number,
    isDev: boolean = false
  ): number[] {
    const standardKey = this.getZScoreKey(isAsmr, key)
    const standardData = data[standardKey] ?? []

    if (method === 'standard') {
      return standardData
    }

    // Variance-stabilized: try Box-Cox, fall back to standard
    const observed = data[key] ?? []
    const baselineKey = this.getBaselineKey(isAsmr, key)
    const baseline = data[baselineKey] ?? []

    if (observed.length === 0 || baseline.length === 0) {
      return standardData
    }

    const vsZScores = varianceStabilizedZScores(observed, baseline, period, isDev)
    if (vsZScores === null) {
      // Fallback to standard z-scores
      return standardData
    }

    return vsZScores
  }
}
