/**
 * Box-Cox Transformation with Guerrero Lambda Estimation
 *
 * Implements variance-stabilized z-scores using the Box-Cox power transformation.
 * Lambda is auto-selected via the Guerrero (1993) method.
 *
 * Reference: https://otexts.com/fpp3/transformations.html#eq:boxcox
 */

import { logger } from '../logger'

const log = logger.withPrefix('boxcox')

/**
 * Apply Box-Cox transformation to a single value.
 * Requires y > 0.
 *
 * @param y - Value to transform (must be positive)
 * @param lambda - Transformation parameter
 * @returns Transformed value
 */
export function boxcoxTransform(y: number, lambda: number): number {
  if (y <= 0) return NaN
  if (Math.abs(lambda) < 1e-10) return Math.log(y)
  return (Math.pow(y, lambda) - 1) / lambda
}

/**
 * Apply Box-Cox transformation to an array of values.
 * Non-positive or non-finite values become NaN.
 *
 * @param data - Array of values
 * @param lambda - Transformation parameter
 * @returns Transformed array
 */
export function boxcoxTransformArray(data: (number | null | undefined)[], lambda: number): number[] {
  return data.map((v) => {
    if (v == null || !isFinite(v) || v <= 0) return NaN
    return boxcoxTransform(v, lambda)
  })
}

/**
 * Estimate optimal Box-Cox lambda using the Guerrero (1993) method.
 *
 * Divides the series into non-overlapping subseries of length `period`,
 * computes mean and standard deviation of each, then finds the lambda
 * that minimizes the coefficient of variation of (sd / mean^(1-lambda)).
 *
 * @param data - Time series values (positive values only)
 * @param period - Seasonal period (e.g., 12 for monthly, 52 for weekly)
 * @param lambdaRange - [min, max] range to search (default [-1, 2])
 * @returns Optimal lambda, or null if estimation fails
 */
export function guerreroLambda(
  data: (number | null | undefined)[],
  period: number,
  lambdaRange: [number, number] = [-1, 2]
): number | null {
  // Filter to valid positive values while preserving indices for subseries grouping
  const valid: number[] = []
  for (const v of data) {
    if (v != null && isFinite(v) && v > 0) {
      valid.push(v)
    }
  }

  // Need at least 2 complete subseries for meaningful CV calculation
  if (valid.length < period * 2) return null
  if (period < 2) return null

  // Split into non-overlapping subseries of length `period`
  const nGroups = Math.floor(valid.length / period)
  if (nGroups < 2) return null

  const means: number[] = []
  const sds: number[] = []

  for (let g = 0; g < nGroups; g++) {
    const start = g * period
    const sub = valid.slice(start, start + period)

    const mean = sub.reduce((s, v) => s + v, 0) / sub.length
    if (mean <= 0) return null // Can't take power of non-positive mean

    const variance = sub.reduce((s, v) => s + (v - mean) ** 2, 0) / (sub.length - 1)
    const sd = Math.sqrt(variance)

    means.push(mean)
    sds.push(sd)
  }

  // Grid search for lambda that minimizes CV of ratios
  const steps = 200
  const [lMin, lMax] = lambdaRange
  let bestLambda = 1
  let bestCV = Infinity

  for (let i = 0; i <= steps; i++) {
    const lambda = lMin + (lMax - lMin) * (i / steps)

    // Compute ratios: sd_h / mean_h^(1-lambda)
    const ratios: number[] = []
    let allValid = true
    for (let g = 0; g < nGroups; g++) {
      const r = sds[g]! / Math.pow(means[g]!, 1 - lambda)
      if (!isFinite(r)) {
        allValid = false
        break
      }
      ratios.push(r)
    }
    if (!allValid || ratios.length === 0) continue

    // Compute CV = sd(ratios) / mean(ratios)
    const rMean = ratios.reduce((s, v) => s + v, 0) / ratios.length
    if (rMean === 0) continue
    const rVar = ratios.reduce((s, v) => s + (v - rMean) ** 2, 0) / ratios.length
    const cv = Math.sqrt(rVar) / Math.abs(rMean)

    if (cv < bestCV) {
      bestCV = cv
      bestLambda = lambda
    }
  }

  // Round to 2 decimal places for cleaner output
  return Math.round(bestLambda * 100) / 100
}

/**
 * Compute variance-stabilized z-scores using Box-Cox transformation.
 *
 * 1. Estimate lambda via Guerrero method on the baseline period
 * 2. Box-Cox transform all data using estimated lambda
 * 3. Compute mean and sd from the transformed baseline period
 * 4. Z-score = (BC(y) - mean(BC(baseline))) / sd(BC(baseline))
 *
 * Falls back to standard z-scores if:
 * - Data contains non-positive values
 * - Lambda estimation fails
 * - Transformed baseline has zero variance
 *
 * @param observed - Full observed data array
 * @param baseline - Full baseline array (same length as observed)
 * @param period - Seasonal period for Guerrero estimation
 * @param isDev - Whether to log debug info
 * @returns Z-score array, or null if fallback to standard is needed
 */
export function varianceStabilizedZScores(
  observed: (number | null | undefined)[],
  baseline: (number | null | undefined)[],
  period: number,
  isDev: boolean = false
): number[] | null {
  // Check that we have enough positive data for Box-Cox
  const positiveCount = observed.filter(v => v != null && isFinite(v as number) && (v as number) > 0).length
  if (positiveCount < observed.length * 0.5) {
    if (isDev) log.debug('Too many non-positive values for Box-Cox, falling back to standard z-score')
    return null
  }

  // Estimate lambda from observed data
  const lambda = guerreroLambda(observed, period)
  if (lambda === null) {
    if (isDev) log.debug('Guerrero lambda estimation failed, falling back to standard z-score')
    return null
  }

  if (isDev) log.debug(`Guerrero lambda: ${lambda}`)

  // Transform observed and baseline
  const bcObserved = boxcoxTransformArray(observed, lambda)
  const bcBaseline = boxcoxTransformArray(baseline, lambda)

  // Compute mean and sd from transformed baseline (non-NaN values only)
  const validBl = bcBaseline.filter(v => isFinite(v))
  if (validBl.length < 3) {
    if (isDev) log.debug('Insufficient valid transformed baseline values')
    return null
  }

  const blMean = validBl.reduce((s, v) => s + v, 0) / validBl.length
  const blVar = validBl.reduce((s, v) => s + (v - blMean) ** 2, 0) / validBl.length
  const blSd = Math.sqrt(blVar)

  if (blSd < 1e-10) {
    if (isDev) log.debug('Near-zero baseline standard deviation after Box-Cox')
    return null
  }

  // Compute z-scores
  return bcObserved.map((v) => {
    if (!isFinite(v)) return NaN
    return (v - blMean) / blSd
  })
}
