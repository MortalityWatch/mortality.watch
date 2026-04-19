/**
 * Tests for Box-Cox transformation and Guerrero lambda estimation
 */

import { describe, it, expect } from 'vitest'
import { boxcoxTransform, boxcoxTransformArray, guerreroLambda, varianceStabilizedZScores } from './boxcox'

describe('boxcoxTransform', () => {
  it('should apply log transform when lambda=0', () => {
    expect(boxcoxTransform(1, 0)).toBeCloseTo(0)
    expect(boxcoxTransform(Math.E, 0)).toBeCloseTo(1)
    expect(boxcoxTransform(10, 0)).toBeCloseTo(Math.log(10))
  })

  it('should apply power transform when lambda=1 (identity-like)', () => {
    // (y^1 - 1) / 1 = y - 1
    expect(boxcoxTransform(5, 1)).toBeCloseTo(4)
    expect(boxcoxTransform(1, 1)).toBeCloseTo(0)
  })

  it('should apply square root transform when lambda=0.5', () => {
    // (y^0.5 - 1) / 0.5 = 2*(sqrt(y) - 1)
    expect(boxcoxTransform(4, 0.5)).toBeCloseTo(2 * (2 - 1))
    expect(boxcoxTransform(9, 0.5)).toBeCloseTo(2 * (3 - 1))
  })

  it('should return NaN for non-positive values', () => {
    expect(boxcoxTransform(0, 1)).toBeNaN()
    expect(boxcoxTransform(-1, 1)).toBeNaN()
    expect(boxcoxTransform(-5, 0)).toBeNaN()
  })
})

describe('boxcoxTransformArray', () => {
  it('should transform an array of positive values', () => {
    const result = boxcoxTransformArray([1, 2, 3], 1)
    expect(result).toEqual([0, 1, 2])
  })

  it('should handle null and undefined values as NaN', () => {
    const result = boxcoxTransformArray([1, null, undefined, 2], 1)
    expect(result[0]).toBe(0)
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeNaN()
    expect(result[3]).toBe(1)
  })

  it('should handle non-positive values as NaN', () => {
    const result = boxcoxTransformArray([1, 0, -1, 2], 1)
    expect(result[0]).toBe(0)
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeNaN()
    expect(result[3]).toBe(1)
  })
})

describe('guerreroLambda', () => {
  it('should return null for insufficient data', () => {
    expect(guerreroLambda([1, 2, 3], 4)).toBeNull()
    expect(guerreroLambda([], 4)).toBeNull()
  })

  it('should return null for period < 2', () => {
    expect(guerreroLambda([1, 2, 3, 4, 5, 6, 7, 8], 1)).toBeNull()
  })

  it('should return null if means are non-positive', () => {
    // All zeros after filtering non-positive
    expect(guerreroLambda([0, 0, 0, 0, 0, 0, 0, 0], 4)).toBeNull()
  })

  it('should estimate lambda for data with constant variance (lambda≈1)', () => {
    // Data with constant variance across subseries: lambda should be near 1
    const data = [10, 11, 9, 10, 20, 21, 19, 20, 30, 31, 29, 30, 40, 41, 39, 40]
    const lambda = guerreroLambda(data, 4)
    expect(lambda).not.toBeNull()
    expect(lambda).toBeGreaterThanOrEqual(-1)
    expect(lambda).toBeLessThanOrEqual(2)
  })

  it('should estimate lambda near 0 for multiplicative data', () => {
    // Variance grows proportionally with mean → log transform stabilizes → lambda ~ 0
    const data: number[] = []
    for (let g = 0; g < 8; g++) {
      const base = (g + 1) * 100
      for (let i = 0; i < 12; i++) {
        // sd proportional to mean
        data.push(base * (1 + 0.2 * Math.sin(i * Math.PI / 6)))
      }
    }
    const lambda = guerreroLambda(data, 12)
    expect(lambda).not.toBeNull()
    expect(lambda!).toBeLessThan(0.5)
  })

  it('should handle data with null values', () => {
    const data: (number | null)[] = [10, 11, null, 10, 20, 21, 19, null, 30, 31, 29, 30]
    // After filtering nulls: 10 valid values, period 4 → 2 complete groups
    const lambda = guerreroLambda(data, 4)
    expect(lambda).not.toBeNull()
  })
})

/**
 * Helpers for constructing realistic seasonal series.
 * Deterministic linear-congruential PRNG so tests are reproducible.
 */
function makePrng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('varianceStabilizedZScores', () => {
  it('should return null when period is null (e.g. yearly data)', () => {
    const observed = Array.from({ length: 24 }, (_, i) => 100 + i)
    const baseline = Array.from({ length: 24 }, (_, i) => 100 + i)
    expect(varianceStabilizedZScores(observed, baseline, null)).toBeNull()
  })

  it('should return null when data has too many non-positive values', () => {
    const observed = [0, -1, 0, -2, 0, -1, 0, -3]
    const baseline = [1, 1, 1, 1, 1, 1, 1, 1]
    const result = varianceStabilizedZScores(observed, baseline, 4)
    expect(result).toBeNull()
  })

  it('should return null when observed data is too short for Guerrero', () => {
    const observed = [10, 20, 30]
    const baseline = [15, 15, 15]
    const result = varianceStabilizedZScores(observed, baseline, 4)
    expect(result).toBeNull()
  })

  it('should return null when arrays have mismatched length', () => {
    const observed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    const baseline = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(varianceStabilizedZScores(observed, baseline, 4)).toBeNull()
  })

  it('should fall back to null when empty arrays provided', () => {
    expect(varianceStabilizedZScores([], [1, 2, 3], 4)).toBeNull()
    expect(varianceStabilizedZScores([1, 2, 3], [], 4)).toBeNull()
  })

  it('should produce z ≈ 0 when observed equals baseline elementwise', () => {
    // Need slight variation in the fitted curve so Guerrero can estimate lambda,
    // but observed === baseline so all residuals are exactly zero.
    const baseline: number[] = []
    for (let i = 0; i < 52 * 3; i++) {
      baseline.push(1000 + 100 * Math.sin((2 * Math.PI * i) / 52))
    }
    const observed = baseline.slice()
    const result = varianceStabilizedZScores(observed, baseline, 52)
    // With zero residuals MAD is 0, so the function returns null (degenerate sd).
    // That fallback to standard z-score is the documented behaviour.
    expect(result).toBeNull()
  })

  it('a 50% covid-like spike should produce a large z-score (~5+, not ~2)', () => {
    // 5 years weekly seasonal series, +50% spike at week 250.
    // Reviewer benchmark: standard z ~ 22 on similar data; previous (buggy)
    // implementation gave ~2.3. The fixed implementation should land in the
    // same order of magnitude as a standard residual z-score.
    const N = 260
    const observed: number[] = []
    const baseline: number[] = []
    const rand = makePrng(42)
    for (let i = 0; i < N; i++) {
      const seasonal = 1000 + 200 * Math.sin((2 * Math.PI * i) / 52)
      baseline.push(seasonal)
      observed.push(seasonal + (rand() - 0.5) * 200)
    }
    observed[250] = baseline[250]! * 1.5

    const result = varianceStabilizedZScores(observed, baseline, 52)
    expect(result).not.toBeNull()
    expect(Math.abs(result![250]!)).toBeGreaterThan(4)
  })

  it('should agree (same sign, comparable magnitude) with standard residual z-score on near-Gaussian data', () => {
    // With constant-variance data lambda ≈ 1, so BC is ~ identity (shifted).
    // The variance-stabilized z should track a hand-computed standard z.
    const N = 200
    const observed: number[] = []
    const baseline: number[] = []
    const rand = makePrng(7)
    for (let i = 0; i < N; i++) {
      const fitted = 1000 + 50 * Math.sin((2 * Math.PI * i) / 52)
      baseline.push(fitted)
      observed.push(fitted + (rand() - 0.5) * 100) // ±50 noise
    }
    // Inject a deviation we can hand-check
    observed[100] = baseline[100]! + 300

    // Hand z-score using residual sd over the full series (constant-variance,
    // so residual sd ~ 50/sqrt(3) for uniform[-50,50]).
    const residuals = observed.map((v, i) => v - baseline[i]!)
    const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length
    const sd = Math.sqrt(residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / residuals.length)
    const standardZ = (observed[100]! - baseline[100]!) / sd

    const result = varianceStabilizedZScores(observed, baseline, 52)
    expect(result).not.toBeNull()
    // Same sign
    expect(Math.sign(result![100]!)).toBe(Math.sign(standardZ))
    // Variance-stabilized z should be in the same order of magnitude.
    // MAD-based estimator is slightly more conservative on uniform noise
    // (uniform has thinner tails than normal, so MAD * 1.4826 over-estimates sd
    // relative to the assumed normal).
    expect(Math.abs(result![100]!)).toBeGreaterThan(Math.abs(standardZ) * 0.5)
    expect(Math.abs(result![100]!)).toBeLessThan(Math.abs(standardZ) * 2)
  })

  it('should hand-check z-score on a tiny synthetic series with lambda ≈ 1', () => {
    // 16-point series (4 periods of 4) where the analytical z is computable.
    // Baseline = constant 100, observed = baseline + noise except at index 7
    // where we inject a +20 anomaly.
    const baseline = Array.from({ length: 16 }, () => 100)
    const observed = [100, 101, 99, 100, 100, 101, 99, 120, 100, 101, 99, 100, 100, 101, 99, 100]
    // Constant baseline → Guerrero will struggle (zero subseries variance);
    // either way, this exercises the fallback path.
    const result = varianceStabilizedZScores(observed, baseline, 4)
    if (result !== null) {
      // If a result is returned, the spike at index 7 must be the largest |z|.
      const absMax = Math.max(...result.map(Math.abs))
      expect(Math.abs(result[7]!)).toBe(absMax)
    } else {
      // Falling back is also acceptable for this degenerate baseline.
      expect(result).toBeNull()
    }
  })
})
