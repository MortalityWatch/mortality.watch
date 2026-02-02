/**
 * Tests for calculateBaseline function
 */

import { describe, it, expect, vi } from 'vitest'
import { calculateBaseline, type BaselineDependencies } from './calculateBaseline'
import type { DatasetEntry } from '@/model'

// Mock logger to suppress output during tests
vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('calculateBaseline', () => {
  const createMockDeps = (response: Record<string, unknown>): BaselineDependencies => ({
    fetchBaseline: vi.fn().mockResolvedValue(JSON.stringify(response)),
    enqueue: vi.fn().mockImplementation(fn => fn())
  })

  describe('naive method normalization', () => {
    it('should normalize naive baseline to constant value across all positions', async () => {
      // Simulate stats API response for naive method
      // The API returns actual values within the baseline period instead of a constant
      // Input: [80, 81, 82, 83, 84, 85] with baseline period indices 0-2
      // API returns: [80, 81, 82, 82, 82, 82] (values within baseline, then constant after)
      // Expected: [82, 82, 82, 82, 82, 82] (constant value = last baseline value)
      const mockResponse = {
        y: [80, 81, 82, 82, 82, 82],
        lower: [null, null, null, 79, 79, 79],
        upper: [null, null, null, 85, 85, 85],
        zscore: [null, null, null, null, null, null]
      }

      const deps = createMockDeps(mockResponse)

      const data: DatasetEntry = {
        le: [80, 81, 82, 83, 84, 85]
      } as unknown as DatasetEntry

      const labels = ['2014', '2015', '2016', '2017', '2018', '2019']
      const keys = ['le', 'le_baseline', 'le_baseline_lower', 'le_baseline_upper'] as (keyof DatasetEntry)[]

      await calculateBaseline(
        deps,
        data,
        labels,
        0, // baselineStartIdx
        2, // baselineEndIdx (inclusive, so baseline is [80, 81, 82])
        keys,
        'naive',
        'yearly',
        false
      )

      // For naive method, all non-null values should be the last baseline value (82)
      expect(data.le_baseline).toEqual([82, 82, 82, 82, 82, 82])
    })

    it('should preserve null values in naive baseline', async () => {
      // API might return null for some positions
      // Input: [80, 81, 82, 83, 84] with baseline period indices 1-3
      // At baselineEndIdx=3, the value is 82
      const mockResponse = {
        y: [null, 80, 81, 82, 82],
        lower: [null, null, null, 79, 79],
        upper: [null, null, null, 85, 85]
      }

      const deps = createMockDeps(mockResponse)

      const data: DatasetEntry = {
        le: [80, 81, 82, 83, 84]
      } as unknown as DatasetEntry

      const labels = ['2015', '2016', '2017', '2018', '2019']
      const keys = ['le', 'le_baseline', 'le_baseline_lower', 'le_baseline_upper'] as (keyof DatasetEntry)[]

      await calculateBaseline(
        deps,
        data,
        labels,
        1, // baselineStartIdx
        3, // baselineEndIdx (inclusive, so baseline covers indices 1-3)
        keys,
        'naive',
        'yearly',
        false
      )

      // Null at position 0 should be preserved, others should be 82 (value at baselineEndIdx=3)
      expect(data.le_baseline).toEqual([null, 82, 82, 82, 82])
    })

    it('should not normalize if baselineEndIdx value is null', async () => {
      // Edge case: if the value at baselineEndIdx is null, don't normalize
      const mockResponse = {
        y: [80, 81, null, 83, 84],
        lower: [null, null, null, 79, 79],
        upper: [null, null, null, 85, 85]
      }

      const deps = createMockDeps(mockResponse)

      const data: DatasetEntry = {
        le: [80, 81, 82, 83, 84]
      } as unknown as DatasetEntry

      const labels = ['2015', '2016', '2017', '2018', '2019']
      const keys = ['le', 'le_baseline', 'le_baseline_lower', 'le_baseline_upper'] as (keyof DatasetEntry)[]

      await calculateBaseline(
        deps,
        data,
        labels,
        0,
        2, // baselineEndIdx points to null value
        keys,
        'naive',
        'yearly',
        false
      )

      // When baselineEndIdx value is null, don't apply normalization - use API response as-is
      expect(data.le_baseline).toEqual([80, 81, null, 83, 84])
    })

    it('should not modify mean method response', async () => {
      // Mean method should return constant values and not be modified
      const mockResponse = {
        y: [81, 81, 81, 81, 81, 81],
        lower: [null, null, null, 79, 79, 79],
        upper: [null, null, null, 83, 83, 83],
        zscore: [-1, 0, 1, 2, 3, null]
      }

      const deps = createMockDeps(mockResponse)

      const data: DatasetEntry = {
        le: [80, 81, 82, 83, 84, 85]
      } as unknown as DatasetEntry

      const labels = ['2014', '2015', '2016', '2017', '2018', '2019']
      const keys = ['le', 'le_baseline', 'le_baseline_lower', 'le_baseline_upper'] as (keyof DatasetEntry)[]

      await calculateBaseline(
        deps,
        data,
        labels,
        0,
        2,
        keys,
        'mean',
        'yearly',
        false
      )

      // Mean method response should not be modified
      expect(data.le_baseline).toEqual([81, 81, 81, 81, 81, 81])
    })
  })

  describe('auto method early return', () => {
    it('should return early for auto method without API call', async () => {
      const deps = createMockDeps({})

      const data: DatasetEntry = {
        le: [80, 81, 82]
      } as unknown as DatasetEntry

      await calculateBaseline(
        deps,
        data,
        ['2017', '2018', '2019'],
        0,
        1,
        ['le', 'le_baseline', 'le_baseline_lower', 'le_baseline_upper'] as (keyof DatasetEntry)[],
        'auto',
        'yearly',
        false
      )

      expect(deps.fetchBaseline).not.toHaveBeenCalled()
    })
  })
})
