/**
 * Tests for shared baseline calculation core functions
 */

import { describe, it, expect } from 'vitest'
import { cumulativeSumFrom, calculateExcess, getSeasonType, labelToXsParam } from './core'
import type { DatasetEntry } from '@/model'

describe('cumulativeSumFrom', () => {
  it('should calculate cumulative sum from start index', () => {
    const result = cumulativeSumFrom([1, 2, 3, 4, 5], 0)
    expect(result).toEqual([1, 3, 6, 10, 15])
  })

  it('should set values before startIdx to undefined', () => {
    const result = cumulativeSumFrom([1, 2, 3, 4, 5], 2)
    expect(result).toEqual([undefined, undefined, 3, 7, 12])
  })

  it('should handle undefined values in input', () => {
    const result = cumulativeSumFrom([1, undefined, 3, 4], 0)
    expect(result).toEqual([1, 1, 4, 8])
  })
})

describe('calculateExcess', () => {
  it('should calculate excess mortality correctly', () => {
    const data: DatasetEntry = {
      cmr: [100, 110, 120],
      cmr_baseline: [100, 100, 100],
      cmr_baseline_lower: [95, 95, 95],
      cmr_baseline_upper: [105, 105, 105]
    } as unknown as DatasetEntry

    calculateExcess(data, 'cmr' as keyof DatasetEntry)

    expect(data.cmr_excess).toEqual([0, 10, 20])
    expect(data.cmr_excess_lower).toEqual([5, 15, 25]) // 100-95, 110-95, 120-95
    expect(data.cmr_excess_upper).toEqual([-5, 5, 15]) // 100-105, 110-105, 120-105
  })

  it('should handle cumulative baseline mode', () => {
    // Simulate data from /cum endpoint where baseline is already cumulative
    const data: DatasetEntry = {
      cmr: [100, 110, 120], // Non-cumulative observed values
      cmr_baseline: [100, 200, 300], // Cumulative baseline (100, 100+100, 100+100+100)
      cmr_baseline_lower: [95, 190, 285],
      cmr_baseline_upper: [105, 210, 315]
    } as unknown as DatasetEntry

    // When isBaselineCumulative=true, observed values should be cumulated
    // before subtraction: cumsum([100, 110, 120]) = [100, 210, 330]
    // excess = [100-100, 210-200, 330-300] = [0, 10, 30]
    calculateExcess(data, 'cmr' as keyof DatasetEntry, true, 0)

    expect(data.cmr_excess).toEqual([0, 10, 30])
  })

  it('should start cumulation from baselineStartIdx', () => {
    const data: DatasetEntry = {
      cmr: [50, 100, 110, 120], // Non-cumulative observed values
      cmr_baseline: [undefined, 100, 200, 300], // Cumulative baseline starting from index 1
      cmr_baseline_lower: [undefined, 95, 190, 285],
      cmr_baseline_upper: [undefined, 105, 210, 315]
    } as unknown as DatasetEntry

    // With baselineStartIdx=1, cumulation starts from index 1
    // cumsum from index 1: [undefined, 100, 210, 330]
    calculateExcess(data, 'cmr' as keyof DatasetEntry, true, 1)

    expect(data.cmr_excess?.[0]).toBeUndefined()
    expect(data.cmr_excess?.[1]).toBe(0) // 100 - 100
    expect(data.cmr_excess?.[2]).toBe(10) // 210 - 200
    expect(data.cmr_excess?.[3]).toBe(30) // 330 - 300
  })
})

describe('getSeasonType', () => {
  it('should return 1 for yearly chart types', () => {
    expect(getSeasonType('yearly')).toBe(1)
    expect(getSeasonType('fluseason')).toBe(1)
    expect(getSeasonType('midyear')).toBe(1)
  })

  it('should return 2 for quarterly', () => {
    expect(getSeasonType('quarterly')).toBe(2)
  })

  it('should return 3 for monthly', () => {
    expect(getSeasonType('monthly')).toBe(3)
  })

  it('should return 4 for weekly variants', () => {
    expect(getSeasonType('weekly')).toBe(4)
    expect(getSeasonType('weekly_52w_sma')).toBe(4)
    expect(getSeasonType('weekly_26w_sma')).toBe(4)
  })
})

describe('labelToXsParam', () => {
  it('should convert weekly labels', () => {
    expect(labelToXsParam('2020 W01', 'weekly')).toBe('2020W01')
    expect(labelToXsParam('2020 W52', 'weekly_52w_sma')).toBe('2020W52')
  })

  it('should convert monthly labels', () => {
    expect(labelToXsParam('2020 Jan', 'monthly')).toBe('2020-01')
    expect(labelToXsParam('2020 Dec', 'monthly')).toBe('2020-12')
  })

  it('should convert quarterly labels', () => {
    expect(labelToXsParam('2020 Q1', 'quarterly')).toBe('2020Q1')
    expect(labelToXsParam('2020 Q4', 'quarterly')).toBe('2020Q4')
  })

  it('should convert fluseason labels', () => {
    expect(labelToXsParam('2019/20', 'fluseason')).toBe('2019')
    expect(labelToXsParam('2020/21', 'midyear')).toBe('2020')
  })

  it('should convert yearly labels', () => {
    expect(labelToXsParam('2020', 'yearly')).toBe('2020')
  })

  it('should return null for invalid labels', () => {
    expect(labelToXsParam('', 'yearly')).toBeNull()
    expect(labelToXsParam('invalid', 'weekly')).toBeNull()
  })
})
