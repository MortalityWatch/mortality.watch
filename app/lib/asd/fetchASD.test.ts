import { describe, it, expect } from 'vitest'
import { alignASDToChartLabels, type ASDResult } from './fetchASD'

describe('alignASDToChartLabels', () => {
  const createASDResult = (overrides: Partial<ASDResult> = {}): ASDResult => ({
    asd: [100, 110, 120],
    asd_bl: [95, 100, 105],
    lower: [90, 95, 100],
    upper: [100, 105, 110],
    zscore: [1.0, 1.5, 2.0],
    labels: ['2020', '2021', '2022'],
    ...overrides
  })

  describe('basic alignment', () => {
    it('should align data to matching chart labels', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      expect(result.asd).toEqual([100, 110, 120])
      expect(result.asd_bl).toEqual([95, 100, 105])
      expect(result.lower).toEqual([90, 95, 100])
      expect(result.upper).toEqual([100, 105, 110])
      expect(result.zscore).toEqual([1.0, 1.5, 2.0])
    })

    it('should insert nulls for missing labels', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2019', '2020', '2021', '2022', '2023']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      expect(result.asd).toEqual([null, 100, 110, 120, null])
      expect(result.asd_bl).toEqual([null, 95, 100, 105, null])
    })

    it('should handle partial overlap', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2021', '2022', '2023']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      expect(result.asd).toEqual([110, 120, null])
      expect(result.asd_bl).toEqual([100, 105, null])
    })
  })

  describe('excess PI calculation', () => {
    it('should calculate excess_lower as asd - lower', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      // excess_lower = asd - lower: [100-90, 110-95, 120-100] = [10, 15, 20]
      expect(result.excess_lower).toEqual([10, 15, 20])
    })

    it('should calculate excess_upper as asd - upper', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      // excess_upper = asd - upper: [100-100, 110-105, 120-110] = [0, 5, 10]
      expect(result.excess_upper).toEqual([0, 5, 10])
    })

    it('should return null for excess PI when asd is null', () => {
      const asdResult = createASDResult({
        asd: [null, 110, 120]
      })
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      expect(result.excess_lower[0]).toBeNull()
      expect(result.excess_upper[0]).toBeNull()
      // Other values should still be calculated
      expect(result.excess_lower[1]).toBe(15) // 110 - 95
      expect(result.excess_upper[1]).toBe(5) // 110 - 105
    })

    it('should return null for excess PI when baseline is null (pre-baseline period)', () => {
      const asdResult = createASDResult({
        asd_bl: [null, 100, 105],
        lower: [null, 95, 100],
        upper: [null, 105, 110]
      })
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      // First period has null baseline, so excess PI should be null
      expect(result.excess_lower[0]).toBeNull()
      expect(result.excess_upper[0]).toBeNull()
      // Other values should still be calculated
      expect(result.excess_lower[1]).toBe(15) // 110 - 95
      expect(result.excess_upper[1]).toBe(5) // 110 - 105
    })

    it('should return null for excess PI when PI bound is null', () => {
      const asdResult = createASDResult({
        lower: [null, 95, 100],
        upper: [null, 105, 110]
      })
      const chartLabels = ['2020', '2021', '2022']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      expect(result.excess_lower[0]).toBeNull()
      expect(result.excess_upper[0]).toBeNull()
    })

    it('should return null for excess PI on unaligned labels', () => {
      const asdResult = createASDResult()
      const chartLabels = ['2019', '2020', '2021', '2022', '2023']

      const result = alignASDToChartLabels(asdResult, chartLabels)

      // 2019 and 2023 are not in ASD data
      expect(result.excess_lower[0]).toBeNull() // 2019
      expect(result.excess_lower[4]).toBeNull() // 2023
      expect(result.excess_upper[0]).toBeNull() // 2019
      expect(result.excess_upper[4]).toBeNull() // 2023
      // Aligned values should be calculated
      expect(result.excess_lower[1]).toBe(10) // 2020: 100 - 90
      expect(result.excess_upper[1]).toBe(0) // 2020: 100 - 100
    })
  })
})
