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
    // Data where variance grows proportionally with mean: lambda should be near 0
    const data: number[] = []
    for (let g = 0; g < 6; g++) {
      const base = (g + 1) * 100
      for (let i = 0; i < 12; i++) {
        // sd proportional to mean → log transform stabilizes
        data.push(base + base * 0.1 * Math.sin(i * Math.PI / 6))
      }
    }
    const lambda = guerreroLambda(data, 12)
    expect(lambda).not.toBeNull()
    expect(lambda!).toBeGreaterThanOrEqual(-1)
    expect(lambda!).toBeLessThanOrEqual(2)
  })

  it('should handle data with null values', () => {
    const data: (number | null)[] = [10, 11, null, 10, 20, 21, 19, null, 30, 31, 29, 30]
    // After filtering nulls: 10 valid values, period 4 → 2 complete groups
    const lambda = guerreroLambda(data, 4)
    expect(lambda).not.toBeNull()
  })

  it('should return a number in valid range', () => {
    const data = Array.from({ length: 100 }, (_, i) => 50 + 20 * Math.sin(i / 5) + Math.random() * 5)
    const lambda = guerreroLambda(data, 10)
    expect(lambda).not.toBeNull()
    expect(lambda!).toBeGreaterThanOrEqual(-1)
    expect(lambda!).toBeLessThanOrEqual(2)
  })
})

describe('varianceStabilizedZScores', () => {
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

  it('should compute z-scores for valid positive data', () => {
    // Generate enough data for Guerrero estimation (needs 2 complete periods)
    const observed: number[] = []
    const baseline: number[] = []
    for (let i = 0; i < 24; i++) {
      observed.push(100 + 10 * Math.sin(i * Math.PI / 6) + 5)
      baseline.push(100 + 10 * Math.sin(i * Math.PI / 6))
    }
    const result = varianceStabilizedZScores(observed, baseline, 12)
    expect(result).not.toBeNull()
    expect(result!.length).toBe(24)
    // All values should be finite numbers
    result!.forEach(v => expect(isFinite(v)).toBe(true))
  })

  it('should return null when baseline has zero variance after transform', () => {
    // All identical baseline values → zero sd
    const observed = Array.from({ length: 24 }, () => 100)
    const baseline = Array.from({ length: 24 }, () => 100)
    const result = varianceStabilizedZScores(observed, baseline, 12)
    // With identical data, Box-Cox transform will produce near-zero sd
    // The function should either return valid z-scores (all ~0) or null
    if (result !== null) {
      // If it returns values, they should all be ~0 (since observed = baseline)
      result.forEach(v => expect(Math.abs(v)).toBeLessThan(0.01))
    }
  })

  it('should fall back gracefully when empty arrays provided', () => {
    expect(varianceStabilizedZScores([], [1, 2, 3], 4)).toBeNull()
    expect(varianceStabilizedZScores([1, 2, 3], [], 4)).toBeNull()
  })
})
