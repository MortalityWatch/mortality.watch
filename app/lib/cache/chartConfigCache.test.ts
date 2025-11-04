import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChartConfigCache } from './chartConfigCache'
import type { ChartStyle } from '../chart/chartTypes'

describe('ChartConfigCache', () => {
  let cache: ChartConfigCache

  beforeEach(() => {
    cache = new ChartConfigCache()
  })

  const mockChartConfig: Record<string, unknown> = {
    options: { responsive: true },
    data: { labels: ['2020', '2021'], datasets: [] }
  }

  const mockData: Array<Record<string, unknown>> = [
    { labels: ['2020', '2021'], datasets: [{ data: [100, 200] }] }
  ]

  describe('Basic caching operations', () => {
    it('should return null for cache miss', () => {
      const result = cache.get(
        'bar',
        mockData,
        true,
        false,
        false,
        false,
        false,
        false,
        false
      )
      expect(result).toBeNull()
    })

    it('should cache and retrieve chart config', () => {
      cache.set(
        mockChartConfig,
        'bar',
        mockData,
        true,
        false,
        false,
        false,
        false,
        false,
        false
      )

      const result = cache.get(
        'bar',
        mockData,
        true,
        false,
        false,
        false,
        false,
        false,
        false
      )

      expect(result).toEqual(mockChartConfig)
    })

    it('should differentiate between chart styles', () => {
      const barConfig = { ...mockChartConfig, type: 'bar' }
      const matrixConfig = { ...mockChartConfig, type: 'matrix' }

      cache.set(barConfig, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set(matrixConfig, 'matrix', mockData, true, false, false, false, false, false, false)

      const barResult = cache.get('bar', mockData, true, false, false, false, false, false, false)
      const matrixResult = cache.get('matrix', mockData, true, false, false, false, false, false, false)

      expect(barResult).toEqual(barConfig)
      expect(matrixResult).toEqual(matrixConfig)
    })

    it('should differentiate between boolean parameters', () => {
      const config1 = { ...mockChartConfig, variant: 'deaths' }
      const config2 = { ...mockChartConfig, variant: 'excess' }

      cache.set(config1, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set(config2, 'bar', mockData, true, true, false, false, false, false, false)

      const result1 = cache.get('bar', mockData, true, false, false, false, false, false, false)
      const result2 = cache.get('bar', mockData, true, true, false, false, false, false, false)

      expect(result1).toEqual(config1)
      expect(result2).toEqual(config2)
    })

    it('should differentiate between optional parameters', () => {
      const lightConfig = { ...mockChartConfig, theme: 'light' }
      const darkConfig = { ...mockChartConfig, theme: 'dark' }

      cache.set(lightConfig, 'bar', mockData, true, false, false, false, false, false, false, true, true, false)
      cache.set(darkConfig, 'bar', mockData, true, false, false, false, false, false, false, true, true, true)

      const lightResult = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, false)
      const darkResult = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, true)

      expect(lightResult).toEqual(lightConfig)
      expect(darkResult).toEqual(darkConfig)
    })
  })

  describe('Data hashing', () => {
    it('should return same config for identical data', () => {
      const data1 = [{ labels: ['2020', '2021'], datasets: [{ data: [100, 200] }] }]
      const data2 = [{ labels: ['2020', '2021'], datasets: [{ data: [100, 200] }] }]

      cache.set(mockChartConfig, 'bar', data1, true, false, false, false, false, false, false)
      const result = cache.get('bar', data2, true, false, false, false, false, false, false)

      expect(result).toEqual(mockChartConfig)
    })

    it('should return null for different data', () => {
      const data1 = [{ labels: ['2020', '2021'], datasets: [{ data: [100, 200] }] }]
      const data2 = [{ labels: ['2020', '2021'], datasets: [{ data: [150, 250] }] }]

      cache.set(mockChartConfig, 'bar', data1, true, false, false, false, false, false, false)
      const result = cache.get('bar', data2, true, false, false, false, false, false, false)

      expect(result).toBeNull()
    })

    it('should handle empty data arrays', () => {
      const emptyData: Array<Record<string, unknown>> = []

      cache.set(mockChartConfig, 'bar', emptyData, true, false, false, false, false, false, false)
      const result = cache.get('bar', emptyData, true, false, false, false, false, false, false)

      expect(result).toEqual(mockChartConfig)
    })
  })

  describe('TTL expiration', () => {
    it('should expire cache after TTL', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 6 * 60 * 1000) // 6 minutes later (expired)

      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)
      const result = cache.get('bar', mockData, true, false, false, false, false, false, false)

      expect(result).toBeNull()
      vi.restoreAllMocks()
    })

    it('should not expire cache before TTL', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 4 * 60 * 1000) // 4 minutes later (not expired)

      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)
      const result = cache.get('bar', mockData, true, false, false, false, false, false, false)

      expect(result).toEqual(mockChartConfig)
      vi.restoreAllMocks()
    })

    it('should update timestamp on cache hit', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 3 * 60 * 1000) // 3 minutes later - first access
        .mockReturnValueOnce(now + 3 * 60 * 1000) // timestamp update
        .mockReturnValueOnce(now + 7 * 60 * 1000) // 7 minutes from start (4 from update)

      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)

      // First access updates timestamp
      cache.get('bar', mockData, true, false, false, false, false, false, false)

      // Second access should still work (4 min from update, not 7 from set)
      const result = cache.get('bar', mockData, true, false, false, false, false, false, false)

      expect(result).toEqual(mockChartConfig)
      vi.restoreAllMocks()
    })
  })

  describe('LRU eviction', () => {
    it('should enforce max cache size', () => {
      // Fill cache to max (100 entries)
      for (let i = 0; i < 100; i++) {
        const data = [{ id: i, value: i * 10 }]
        cache.set({ config: i }, 'bar', data, true, false, false, false, false, false, false)
      }

      const stats = cache.getStats()
      expect(stats.size).toBe(100)

      // Add one more - should trigger eviction
      const newData = [{ id: 999, value: 9990 }]
      cache.set({ config: 999 }, 'bar', newData, true, false, false, false, false, false, false)

      const finalStats = cache.getStats()
      expect(finalStats.size).toBe(100)
      expect(finalStats.evictions).toBe(1)
    })

    it('should evict least recently used entry', () => {
      // Add 100 entries
      for (let i = 0; i < 100; i++) {
        const data = [{ id: i, value: i * 10 }]
        cache.set({ config: i }, 'bar', data, true, false, false, false, false, false, false)
      }

      // Access first entry to make it recently used
      const firstData = [{ id: 0, value: 0 }]
      cache.get('bar', firstData, true, false, false, false, false, false, false)

      // Add new entry - should evict something other than first
      const newData = [{ id: 999, value: 9990 }]
      cache.set({ config: 999 }, 'bar', newData, true, false, false, false, false, false, false)

      // First entry should still be accessible
      const result = cache.get('bar', firstData, true, false, false, false, false, false, false)
      expect(result).toEqual({ config: 0 })
    })
  })

  describe('Cache invalidation', () => {
    it('should invalidate all cache entries', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set(mockChartConfig, 'matrix', mockData, true, false, false, false, false, false, false)

      cache.invalidate()

      expect(cache.get('bar', mockData, true, false, false, false, false, false, false)).toBeNull()
      expect(cache.get('matrix', mockData, true, false, false, false, false, false, false)).toBeNull()
      expect(cache.getStats().size).toBe(0)
    })

    it('should invalidate by style pattern', () => {
      const barConfig = { type: 'bar' }
      const matrixConfig = { type: 'matrix' }

      cache.set(barConfig, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set(matrixConfig, 'matrix', mockData, true, false, false, false, false, false, false)

      cache.invalidateByPattern({ style: 'bar' })

      expect(cache.get('bar', mockData, true, false, false, false, false, false, false)).toBeNull()
      expect(cache.get('matrix', mockData, true, false, false, false, false, false, false)).toEqual(matrixConfig)
    })

    it('should invalidate by isDeathsType pattern', () => {
      const deathsConfig = { variant: 'deaths' }
      const otherConfig = { variant: 'other' }

      cache.set(deathsConfig, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set(otherConfig, 'bar', mockData, false, false, false, false, false, false, false)

      cache.invalidateByPattern({ isDeathsType: true })

      expect(cache.get('bar', mockData, true, false, false, false, false, false, false)).toBeNull()
      expect(cache.get('bar', mockData, false, false, false, false, false, false, false)).toEqual(otherConfig)
    })

    it('should invalidate by multiple pattern criteria', () => {
      cache.set({ id: 1 }, 'bar', mockData, true, true, false, false, false, false, false)
      cache.set({ id: 2 }, 'bar', mockData, true, false, false, false, false, false, false)
      cache.set({ id: 3 }, 'matrix', mockData, true, true, false, false, false, false, false)

      cache.invalidateByPattern({ style: 'bar', isExcess: true })

      expect(cache.get('bar', mockData, true, true, false, false, false, false, false)).toBeNull()
      expect(cache.get('bar', mockData, true, false, false, false, false, false, false)).toEqual({ id: 2 })
      expect(cache.get('matrix', mockData, true, true, false, false, false, false, false)).toEqual({ id: 3 })
    })
  })

  describe('Performance metrics', () => {
    it('should track cache hits', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)

      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)

      const stats = cache.getStats()
      expect(stats.hits).toBe(3)
      expect(stats.misses).toBe(0)
    })

    it('should track cache misses', () => {
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('matrix', mockData, true, false, false, false, false, false, false)

      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(2)
    })

    it('should calculate hit rate correctly', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)

      // 3 hits
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)

      // 2 misses
      cache.get('matrix', mockData, true, false, false, false, false, false, false)
      cache.get('line' as ChartStyle, mockData, true, false, false, false, false, false, false)

      const stats = cache.getStats()
      expect(stats.hits).toBe(3)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(60) // 3/5 = 60%
    })

    it('should reset metrics', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('matrix', mockData, true, false, false, false, false, false, false)

      cache.resetMetrics()

      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(0)
    })

    it('should track entry hit counts', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)

      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)
      cache.get('bar', mockData, true, false, false, false, false, false, false)

      const entries = cache.getEntries()
      expect(entries.length).toBe(1)
      expect(entries[0]?.hits).toBe(3)
    })

    it('should provide entry age information', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 2 * 60 * 1000) // 2 minutes later

      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false)

      const entries = cache.getEntries()
      expect(entries.length).toBe(1)
      expect(entries[0]?.age).toBe(2 * 60 * 1000)

      vi.restoreAllMocks()
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined optional parameters consistently', () => {
      cache.set(mockChartConfig, 'bar', mockData, true, false, false, false, false, false, false, undefined, undefined, undefined)

      const result1 = cache.get('bar', mockData, true, false, false, false, false, false, false, undefined, undefined, undefined)
      const result2 = cache.get('bar', mockData, true, false, false, false, false, false, false)

      expect(result1).toEqual(mockChartConfig)
      expect(result2).toEqual(mockChartConfig)
    })

    it('should handle user tier parameter', () => {
      const tier0Config = { tier: 0 }
      const tier2Config = { tier: 2 }

      cache.set(tier0Config, 'bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto', 0)
      cache.set(tier2Config, 'bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto', 2)

      const result0 = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto', 0)
      const result2 = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto', 2)

      expect(result0).toEqual(tier0Config)
      expect(result2).toEqual(tier2Config)
    })

    it('should handle decimals parameter', () => {
      const autoConfig = { decimals: 'auto' }
      const fixedConfig = { decimals: '2' }

      cache.set(autoConfig, 'bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto')
      cache.set(fixedConfig, 'bar', mockData, true, false, false, false, false, false, false, true, true, false, '2')

      const resultAuto = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, false, 'auto')
      const resultFixed = cache.get('bar', mockData, true, false, false, false, false, false, false, true, true, false, '2')

      expect(resultAuto).toEqual(autoConfig)
      expect(resultFixed).toEqual(fixedConfig)
    })

    it('should handle large data structures', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        label: `Item ${i}`,
        value: i * Math.random()
      }))

      cache.set(mockChartConfig, 'bar', largeData, true, false, false, false, false, false, false)
      const result = cache.get('bar', largeData, true, false, false, false, false, false, false)

      expect(result).toEqual(mockChartConfig)
    })
  })
})
