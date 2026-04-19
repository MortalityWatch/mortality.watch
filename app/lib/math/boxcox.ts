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
  let bestLambda: number | null = null
  let bestCV = Infinity

  for (let i = 0; i <= steps; i++) {
    const lambda = lMin + (lMax - lMin) * (i / steps)

    // Compute ratios: sd_h / mean_h^(1-lambda)
    // Use exp/log form to reduce overflow risk for very large counts
    const ratios: number[] = []
    let allValid = true
    for (let g = 0; g < nGroups; g++) {
      const r = sds[g]! / Math.exp((1 - lambda) * Math.log(means[g]!))
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

  if (bestLambda === null || !isFinite(bestCV)) return null

  // Round to 2 decimal places for cleaner output
  return Math.round(bestLambda * 100) / 100
}

/**
 * Compute variance-stabilized z-scores using Box-Cox transformation.
 *
 * 1. Estimate lambda via Guerrero on the baseline (fitted) series — never on
 *    `observed`, which contains the anomalies the method is meant to detect.
 * 2. Box-Cox transform both observed and baseline with that lambda.
 * 3. Form per-time-point residuals r_t = BC(observed_t) - BC(baseline_t).
 * 4. Estimate residual sd robustly via MAD (median absolute deviation), so
 *    spikes in `observed` do not inflate the denominator. This approximates
 *    the "sd over the baseline window" the standard residual z-score uses,
 *    without requiring callers to plumb the baseline window indices through.
 * 5. z_t = r_t / sd_robust.
 *
 * Falls back to null (caller uses standard z-score) if:
 * - period is null/<2 (no seasonality, e.g. yearly data)
 * - too many non-positive values
 * - lambda estimation fails
 * - residual sd is degenerate
 *
 * @param observed - Full observed data array
 * @param baseline - Full baseline (fitted) array (same length as observed)
 * @param period - Seasonal period for Guerrero estimation, or null for none
 * @param isDev - Whether to log debug info
 * @returns Z-score array, or null if fallback to standard is needed
 */
export function varianceStabilizedZScores(
  observed: (number | null | undefined)[],
  baseline: (number | null | undefined)[],
  period: number | null,
  isDev: boolean = false
): number[] | null {
  if (period == null || period < 2) {
    if (isDev) log.debug('No seasonal period — falling back to standard z-score')
    return null
  }

  if (observed.length === 0 || baseline.length === 0) return null
  if (observed.length !== baseline.length) {
    log.warn('observed and baseline length mismatch — falling back to standard z-score')
    return null
  }

  const positiveCount = observed.filter(v => v != null && isFinite(v as number) && (v as number) > 0).length
  if (positiveCount < observed.length * 0.5) {
    if (isDev) log.debug('Too many non-positive values for Box-Cox, falling back to standard z-score')
    return null
  }

  // Estimate lambda on the baseline (fitted) series — not on observed.
  // Falls back to estimating on the positive subset of observed only if the
  // baseline doesn't yield a usable estimate (e.g. baseline missing/short).
  let lambda = guerreroLambda(baseline, period)
  if (lambda === null) {
    log.warn('Guerrero lambda estimation on baseline failed, retrying on observed')
    lambda = guerreroLambda(observed, period)
  }
  if (lambda === null) {
    log.warn('Guerrero lambda estimation failed, falling back to standard z-score')
    return null
  }

  if (isDev) log.debug(`Guerrero lambda: ${lambda}`)

  const bcObserved = boxcoxTransformArray(observed, lambda)
  const bcBaseline = boxcoxTransformArray(baseline, lambda)

  // Per-time-point residuals in transformed space
  const residuals: number[] = []
  for (let i = 0; i < bcObserved.length; i++) {
    const o = bcObserved[i]!
    const b = bcBaseline[i]!
    if (isFinite(o) && isFinite(b)) residuals.push(o - b)
  }

  if (residuals.length < 3) {
    if (isDev) log.debug('Insufficient valid residuals after Box-Cox')
    return null
  }

  // Robust residual sd via MAD: 1.4826 * median(|r - median(r)|).
  // MAD is resistant to the very anomalies (covid-style spikes) that the
  // z-score is designed to flag, so it approximates "sd over the baseline
  // window" without needing the caller to pass window indices.
  const sorted = [...residuals].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]!
  const absDev = residuals.map(r => Math.abs(r - median)).sort((a, b) => a - b)
  const mad = absDev[Math.floor(absDev.length / 2)]!
  const sdRobust = 1.4826 * mad

  if (!isFinite(sdRobust) || sdRobust < 1e-10) {
    if (isDev) log.debug('Near-zero robust residual sd after Box-Cox')
    return null
  }

  return bcObserved.map((v, i) => {
    const b = bcBaseline[i]!
    if (!isFinite(v) || !isFinite(b)) return NaN
    return (v - b) / sdRobust
  })
}
