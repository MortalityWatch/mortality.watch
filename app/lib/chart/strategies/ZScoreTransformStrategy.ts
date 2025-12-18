/**
 * Strategy for accessing pre-calculated z-score data
 * Z-scores show how many standard deviations each value is from the baseline mean
 * Z-scores are calculated by the R stats API and stored as <metric>_zscore fields
 */

/**
 * Provides access to pre-calculated z-score data from the R stats API
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
}
