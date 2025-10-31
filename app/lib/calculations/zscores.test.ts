import { describe, it, expect } from 'vitest'
import {
  getMean,
  getStdDev,
  calculateZScores,
  calculateZScoresFromRows,
  calculateExcessZScores,
  getZScoreSignificance,
  isSignificant
} from './zscores'

describe('getMean', () => {
  it('calculates mean of array', () => {
    expect(getMean([1, 2, 3, 4, 5])).toBe(3)
    expect(getMean([10, 20, 30])).toBe(20)
  })

  it('handles empty array', () => {
    expect(getMean([])).toBe(0)
  })

  it('handles single value', () => {
    expect(getMean([5])).toBe(5)
  })

  it('handles negative numbers', () => {
    expect(getMean([-10, 0, 10])).toBe(0)
  })
})

describe('getStdDev', () => {
  it('calculates standard deviation', () => {
    // Known values: [2, 4, 4, 4, 5, 5, 7, 9]
    // Mean = 5, Sample StdDev ≈ 2.138 (using n-1)
    const values = [2, 4, 4, 4, 5, 5, 7, 9]
    const result = getStdDev(values)
    expect(result).toBeCloseTo(2.138, 2)
  })

  it('handles empty array', () => {
    expect(getStdDev([])).toBe(0)
  })

  it('handles single value', () => {
    expect(getStdDev([5])).toBe(0)
  })

  it('uses provided mean', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9]
    const mean = 5
    const result = getStdDev(values, mean)
    expect(result).toBeCloseTo(2.138, 2)
  })

  it('handles identical values', () => {
    expect(getStdDev([5, 5, 5, 5])).toBe(0)
  })
})

describe('calculateZScores', () => {
  it('calculates z-scores correctly', () => {
    // Baseline: [10, 10, 10, 10] -> mean=10, stddev=0
    // Data: [10, 12, 8, 15]
    // Since stddev=0, should return special values
    const baseline = [10, 10, 10, 10]
    const data = [10, 12, 8, 15]
    const zscores = calculateZScores(data, baseline)

    expect(zscores[0]).toBe(0) // 10 == mean
    expect(zscores[1]).toBe(999) // 12 > mean
    expect(zscores[2]).toBe(-999) // 8 < mean
    expect(zscores[3]).toBe(999) // 15 > mean
  })

  it('calculates z-scores with normal distribution', () => {
    // Baseline with variation
    const baseline = [8, 9, 10, 11, 12] // mean=10, stddev~1.58
    const data = [10, 12, 14, 8]

    const zscores = calculateZScores(data, baseline)

    // z = (x - 10) / 1.58
    expect(zscores[0]).toBeCloseTo(0, 0) // (10-10)/1.58 = 0
    expect(zscores[1]).toBeCloseTo(1.26, 0) // (12-10)/1.58 = 1.26
    expect(zscores[2]).toBeCloseTo(2.53, 0) // (14-10)/1.58 = 2.53
    expect(zscores[3]).toBeCloseTo(-1.26, 0) // (8-10)/1.58 = -1.26
  })

  it('handles empty baseline', () => {
    const baseline: number[] = []
    const data = [10, 12, 14]
    const zscores = calculateZScores(data, baseline)

    expect(zscores).toEqual([0, 0, 0])
  })

  it('handles zero standard deviation', () => {
    const baseline = [10, 10, 10]
    const data = [10, 15, 5]
    const zscores = calculateZScores(data, baseline)

    expect(zscores[0]).toBe(0)
    expect(zscores[1]).toBe(999)
    expect(zscores[2]).toBe(-999)
  })
})

describe('calculateZScoresFromRows', () => {
  it('calculates z-scores from two rows', () => {
    const dataRow = [100, 110, 105, 120]
    const baselineRow = [100, 100, 100, 100]

    const zscores = calculateZScoresFromRows(dataRow, baselineRow)

    // Since baseline has stddev=0, should get special values
    expect(zscores[0]).toBe(0)
    expect(zscores[1]).toBe(999)
    expect(zscores[2]).toBe(999)
    expect(zscores[3]).toBe(999)
  })
})

describe('calculateExcessZScores', () => {
  it('calculates z-scores for excess mortality', () => {
    const observed = [110, 120, 105, 130]
    const baseline = [100, 100, 100, 100] // mean=100, stddev=0

    const zscores = calculateExcessZScores(observed, baseline)

    // Excess: [10, 20, 5, 30]
    // Since baseline stddev=0, should get special values
    expect(zscores[0]).toBe(999) // excess > 0
    expect(zscores[1]).toBe(999)
    expect(zscores[2]).toBe(999)
    expect(zscores[3]).toBe(999)
  })

  it('calculates with baseline variation', () => {
    const observed = [110, 120, 105, 130]
    const baseline = [95, 100, 100, 105, 100] // mean=100, sample stddev≈3.536

    const zscores = calculateExcessZScores(observed, baseline)

    // Excess: observed[i] - baseline[i] = [15, 20, 5, 25] (baseline[3]=105, baseline[4] not used)
    // z = excess / 3.536
    expect(zscores[0]).toBeCloseTo(4.24, 1) // 15/3.536 ≈ 4.24
    expect(zscores[1]).toBeCloseTo(5.66, 1) // 20/3.536 ≈ 5.66
    expect(zscores[2]).toBeCloseTo(1.41, 1) // 5/3.536 ≈ 1.41
    expect(zscores[3]).toBeCloseTo(7.07, 1) // 25/3.536 ≈ 7.07
  })

  it('handles negative excess (below baseline)', () => {
    const observed = [90, 80, 95]
    const baseline = [95, 100, 100, 105, 100] // mean=100, stddev~3.54

    const zscores = calculateExcessZScores(observed, baseline)

    // All should be negative
    expect(zscores[0]).toBeLessThan(0)
    expect(zscores[1]).toBeLessThan(0)
    expect(zscores[2]).toBeLessThan(0)
  })
})

describe('getZScoreSignificance', () => {
  it('returns correct significance labels', () => {
    expect(getZScoreSignificance(0)).toBe('Within normal range')
    expect(getZScoreSignificance(0.5)).toBe('Within normal range')
    expect(getZScoreSignificance(1.5)).toBe('Moderate deviation')
    expect(getZScoreSignificance(2.5)).toBe('Significant (95%)')
    expect(getZScoreSignificance(3.5)).toBe('Highly significant (99.7%)')
    expect(getZScoreSignificance(-2.5)).toBe('Significant (95%)')
    expect(getZScoreSignificance(-3.5)).toBe('Highly significant (99.7%)')
  })
})

describe('isSignificant', () => {
  it('checks significance at default threshold (2)', () => {
    expect(isSignificant(0)).toBe(false)
    expect(isSignificant(1)).toBe(false)
    expect(isSignificant(1.9)).toBe(false)
    expect(isSignificant(2)).toBe(true)
    expect(isSignificant(2.5)).toBe(true)
    expect(isSignificant(-2.5)).toBe(true)
  })

  it('checks significance at custom threshold', () => {
    expect(isSignificant(2.5, 3)).toBe(false)
    expect(isSignificant(3, 3)).toBe(true)
    expect(isSignificant(3.5, 3)).toBe(true)
  })
})
