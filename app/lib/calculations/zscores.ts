/**
 * Z-Score Calculations for Mortality Data
 *
 * Z-scores represent the number of standard deviations a value is from the mean.
 * Formula: z = (x - μ) / σ
 * where:
 *   x = observed value
 *   μ = mean of baseline period
 *   σ = standard deviation of baseline period
 *
 * Interpretation:
 *   z > 2: Statistically significant at 95% confidence level
 *   z > 3: Highly significant at 99.7% confidence level
 *   z < -2: Significantly below baseline
 */

/**
 * Calculate mean (average) of an array of numbers
 * @param values - Array of numbers
 * @returns Mean value
 */
export function getMean(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Calculate standard deviation of an array of numbers
 * @param values - Array of numbers
 * @param mean - Pre-calculated mean (optional, will calculate if not provided)
 * @returns Standard deviation
 */
export function getStdDev(values: number[], mean?: number): number {
  if (values.length === 0) return 0
  if (values.length === 1) return 0

  const m = mean !== undefined ? mean : getMean(values)
  const squaredDiffs = values.map(val => Math.pow(val - m, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Calculate z-scores for a data array relative to baseline statistics
 * @param dataValues - Array of observed values
 * @param baselineValues - Array of baseline values used to calculate mean and stddev
 * @returns Array of z-scores
 */
export function calculateZScores(
  dataValues: number[],
  baselineValues: number[]
): number[] {
  if (baselineValues.length === 0) {
    // No baseline data - return zeros
    return new Array(dataValues.length).fill(0)
  }

  const mean = getMean(baselineValues)
  const stddev = getStdDev(baselineValues, mean)

  // Handle edge case: zero standard deviation
  if (stddev === 0) {
    // All baseline values are identical
    // Return 0 for values equal to mean, large positive/negative for deviations
    return dataValues.map(val => {
      if (val === mean) return 0
      return val > mean ? 999 : -999
    })
  }

  // Calculate z-score for each data point
  return dataValues.map(val => (val - mean) / stddev)
}

/**
 * Calculate z-scores from two data rows (typical use case)
 * @param dataRow - Array of observed values (e.g., weekly deaths)
 * @param baselineRow - Array of baseline values (expected values)
 * @returns Array of z-scores
 */
export function calculateZScoresFromRows(
  dataRow: number[],
  baselineRow: number[]
): number[] {
  // For mortality data, we typically calculate z-scores by comparing
  // each observed value against the distribution of baseline values
  // This assumes the baseline represents expected variation
  return calculateZScores(dataRow, baselineRow)
}

/**
 * Calculate z-scores for excess mortality
 * @param observedRow - Array of observed mortality values
 * @param baselineRow - Array of baseline (expected) mortality values
 * @returns Array of z-scores for excess (observed - baseline)
 */
export function calculateExcessZScores(
  observedRow: number[],
  baselineRow: number[]
): number[] {
  // Calculate excess values
  const excessValues = observedRow.map((val, i) => val - (baselineRow[i] ?? 0))

  // Calculate mean and stddev from baseline
  const baselineMean = getMean(baselineRow)
  const baselineStdDev = getStdDev(baselineRow, baselineMean)

  // Handle edge case: zero standard deviation
  if (baselineStdDev === 0) {
    return excessValues.map(val => {
      if (val === 0) return 0
      return val > 0 ? 999 : -999
    })
  }

  // Z-score for excess = (excess) / stddev
  return excessValues.map(excess => excess / baselineStdDev)
}

/**
 * Get statistical significance label for a z-score
 * @param z - Z-score value
 * @returns Description of statistical significance
 */
export function getZScoreSignificance(z: number): string {
  const absZ = Math.abs(z)
  if (absZ >= 3) return 'Highly significant (99.7%)'
  if (absZ >= 2) return 'Significant (95%)'
  if (absZ >= 1) return 'Moderate deviation'
  return 'Within normal range'
}

/**
 * Check if a z-score is statistically significant
 * @param z - Z-score value
 * @param threshold - Threshold for significance (default: 2 for 95% CI)
 * @returns True if |z| >= threshold
 */
export function isSignificant(z: number, threshold: number = 2): boolean {
  return Math.abs(z) >= threshold
}
