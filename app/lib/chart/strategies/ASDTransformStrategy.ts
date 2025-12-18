/**
 * Strategy for accessing Age-Standardized Deaths (ASD) data
 *
 * ASD shows age-standardized deaths using the Levitt method:
 * - Calculates mean baseline mortality rate (deaths/population) during baseline period
 * - Applies this rate to current population to get expected deaths (asd_bl)
 * - Compares actual deaths (asd) to expected deaths
 *
 * The calculation is performed by the R stats API during baseline calculation,
 * similar to how z-scores are pre-calculated.
 */

/**
 * Provides access to pre-calculated ASD data from the R stats API
 */
export class ASDTransformStrategy {
  /**
   * Get the ASD key for actual age-standardized deaths
   * ASD data is pre-calculated by the R stats API
   * @returns The ASD key (always 'asd' for actual deaths)
   */
  getASDKey(): string {
    return 'asd'
  }

  /**
   * Get the ASD baseline key for expected age-standardized deaths
   * @returns The ASD baseline key (always 'asd_bl' for baseline/expected)
   */
  getASDBaselineKey(): string {
    return 'asd_bl'
  }

  /**
   * Calculate excess ASD (difference between actual and expected)
   * @param asd - Actual age-standardized deaths
   * @param asdBl - Expected age-standardized deaths (baseline)
   * @returns Excess age-standardized deaths
   */
  calculateExcess(asd: number[], asdBl: number[]): number[] {
    const result: number[] = []
    for (let i = 0; i < asd.length; i++) {
      result.push((asd[i] ?? 0) - (asdBl[i] ?? 0))
    }
    return result
  }

  /**
   * Calculate percentage excess ASD
   * @param asd - Actual age-standardized deaths
   * @param asdBl - Expected age-standardized deaths (baseline)
   * @returns Percentage excess (as decimal, e.g., 0.15 = 15%)
   */
  calculatePercentageExcess(asd: number[], asdBl: number[]): number[] {
    const result: number[] = []
    for (let i = 0; i < asd.length; i++) {
      const actual = asd[i] ?? 0
      const expected = asdBl[i] ?? 1
      result.push((actual - expected) / expected)
    }
    return result
  }
}
