import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaselineCache, type BaselineResult } from './baselineCache'

describe('BaselineCache', () => {
  let cache: BaselineCache

  beforeEach(() => {
    cache = new BaselineCache()
  })

  const mockData: number[] = [100, 110, 105, 115, 120, 125, 130]
  const mockResult: BaselineResult = {
    y: [100, 110, 105, 115, 120, 125, 130],
    lower: [95, 105, 100, 110, 115, 120, 125],
    upper: [105, 115, 110, 120, 125, 130, 135]
  }

  describe('Cache key generation', () => {
    it('should generate different keys for different parameters', () => {
      // Set two different baselines
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 10, 4, 1, 'lin_reg', false, mockResult)

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })

    it('should generate same key for identical parameters', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      const stats = cache.getStats()
      expect(stats.size).toBe(1)
    })

    it('should generate different keys for different data arrays', () => {
      const data1 = [100, 110, 105]
      const data2 = [200, 210, 205]

      cache.set(data1, 10, 4, 0, 'mean', false, mockResult)
      cache.set(data2, 10, 4, 0, 'mean', false, mockResult)

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })

    it('should generate different keys for different h values', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 20, 4, 0, 'mean', false, mockResult)

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })

    it('should generate different keys for cumulative vs non-cumulative', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 10, 4, 0, 'mean', true, mockResult)

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })
  })

  describe('Cache get/set operations', () => {
    it('should return null for cache miss', () => {
      const result = cache.get(mockData, 10, 4, 0, 'mean', false)
      expect(result).toBeNull()
    })

    it('should cache and retrieve baseline result', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(mockData, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
      expect(result?.y).toEqual(mockResult.y)
      expect(result?.lower).toEqual(mockResult.lower)
      expect(result?.upper).toEqual(mockResult.upper)
    })

    it('should return cached result on multiple gets', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      const result1 = cache.get(mockData, 10, 4, 0, 'mean', false)
      const result2 = cache.get(mockData, 10, 4, 0, 'mean', false)
      const result3 = cache.get(mockData, 10, 4, 0, 'mean', false)

      expect(result1).toEqual(mockResult)
      expect(result2).toEqual(mockResult)
      expect(result3).toEqual(mockResult)
    })

    it('should handle undefined values in data array', () => {
      const dataWithUndefined = [100, undefined, 105, 115, 120] as number[]
      cache.set(dataWithUndefined, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(dataWithUndefined, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
    })
  })

  describe('TTL expiration', () => {
    it('should expire cache after TTL', () => {
      // Mock Date.now to control time
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 16 * 60 * 1000) // 16 minutes later (expired)

      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(mockData, 10, 4, 0, 'mean', false)

      expect(result).toBeNull()
      vi.restoreAllMocks()
    })

    it('should not expire cache before TTL', () => {
      // Mock Date.now to control time
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 14 * 60 * 1000) // 14 minutes later (not expired)

      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(mockData, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
      vi.restoreAllMocks()
    })

    it('should remove expired entries from cache', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 16 * 60 * 1000) // 16 minutes later (expired)

      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.get(mockData, 10, 4, 0, 'mean', false)

      const stats = cache.getStats()
      expect(stats.size).toBe(0)
      vi.restoreAllMocks()
    })
  })

  describe('LRU eviction', () => {
    it('should evict oldest entry when cache is full', () => {
      // Fill cache to max size (100)
      for (let i = 0; i < 101; i++) {
        const data = [i, i + 1, i + 2]
        cache.set(data, i, 4, 0, 'mean', false, mockResult)
      }

      const stats = cache.getStats()
      expect(stats.size).toBe(100)
    })

    it('should evict least recently used entry', () => {
      const now = Date.now()
      let callIndex = 0

      vi.spyOn(Date, 'now').mockImplementation(() => {
        callIndex++
        if (callIndex === 1) return now // First set
        if (callIndex === 2) return now + 1000 // Second set (newer)
        if (callIndex === 3) return now + 2000 // Get first entry (update timestamp)
        return now + callIndex * 1000
      })

      // Fill cache to max - 1
      for (let i = 0; i < 99; i++) {
        const data = [i, i + 1, i + 2]
        cache.set(data, i, 4, 0, 'mean', false, mockResult)
      }

      // Add entry A (oldest)
      const dataA = [1000, 1001, 1002]
      cache.set(dataA, 1000, 4, 0, 'mean', false, mockResult)

      // Add entry B (newer)
      const dataB = [2000, 2001, 2002]
      cache.set(dataB, 2000, 4, 0, 'mean', false, mockResult)

      // Access entry A to make it more recently used
      cache.get(dataA, 1000, 4, 0, 'mean', false)

      // Add one more to trigger eviction
      const dataC = [3000, 3001, 3002]
      cache.set(dataC, 3000, 4, 0, 'mean', false, mockResult)

      // Entry B should be evicted (oldest unused)
      const resultA = cache.get(dataA, 1000, 4, 0, 'mean', false)
      const resultC = cache.get(dataC, 3000, 4, 0, 'mean', false)

      expect(resultA).toBeTruthy() // A was accessed, should be kept
      expect(resultC).toBeTruthy() // C is newest, should be kept

      vi.restoreAllMocks()
    })
  })

  describe('Cache invalidation', () => {
    it('should invalidate all cached entries', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 20, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 30, 4, 0, 'mean', false, mockResult)

      expect(cache.getStats().size).toBe(3)

      cache.invalidate()

      expect(cache.getStats().size).toBe(0)
      expect(cache.get(mockData, 10, 4, 0, 'mean', false)).toBeNull()
      expect(cache.get(mockData, 20, 4, 0, 'mean', false)).toBeNull()
      expect(cache.get(mockData, 30, 4, 0, 'mean', false)).toBeNull()
    })

    it('should reset hit/miss counters on invalidate', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 99, 4, 0, 'mean', false) // miss

      const statsBefore = cache.getStats()
      expect(statsBefore.hits).toBeGreaterThan(0)
      expect(statsBefore.misses).toBeGreaterThan(0)

      cache.invalidate()

      const statsAfter = cache.getStats()
      expect(statsAfter.hits).toBe(0)
      expect(statsAfter.misses).toBe(0)
    })
  })

  describe('Cache statistics', () => {
    it('should return correct cache stats', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 20, 4, 0, 'mean', false, mockResult)
      cache.set(mockData, 30, 4, 0, 'mean', false, mockResult)

      const stats = cache.getStats()

      expect(stats.size).toBe(3)
      expect(stats.entries).toHaveLength(3)
      expect(stats.entries.every(e => e.age >= 0)).toBe(true)
    })

    it('should track cache hits correctly', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit

      const stats = cache.getStats()
      expect(stats.hits).toBe(3)
      expect(stats.entries[0]?.hits).toBe(3)
    })

    it('should track cache misses correctly', () => {
      cache.get(mockData, 10, 4, 0, 'mean', false) // miss
      cache.get(mockData, 20, 4, 0, 'mean', false) // miss
      cache.get(mockData, 30, 4, 0, 'mean', false) // miss

      const stats = cache.getStats()
      expect(stats.misses).toBe(3)
    })

    it('should track both hits and misses', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 20, 4, 0, 'mean', false) // miss
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 30, 4, 0, 'mean', false) // miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
    })
  })

  describe('Cache hit rate', () => {
    it('should return 0% for empty cache', () => {
      expect(cache.getHitRate()).toBe(0)
    })

    it('should return 100% for all hits', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      cache.get(mockData, 10, 4, 0, 'mean', false)
      cache.get(mockData, 10, 4, 0, 'mean', false)
      cache.get(mockData, 10, 4, 0, 'mean', false)

      expect(cache.getHitRate()).toBe(100)
    })

    it('should return 0% for all misses', () => {
      cache.get(mockData, 10, 4, 0, 'mean', false)
      cache.get(mockData, 20, 4, 0, 'mean', false)
      cache.get(mockData, 30, 4, 0, 'mean', false)

      expect(cache.getHitRate()).toBe(0)
    })

    it('should return 50% for half hits', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 20, 4, 0, 'mean', false) // miss

      expect(cache.getHitRate()).toBe(50)
    })

    it('should return 75% for 3 hits and 1 miss', () => {
      cache.set(mockData, 10, 4, 0, 'mean', false, mockResult)

      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 10, 4, 0, 'mean', false) // hit
      cache.get(mockData, 20, 4, 0, 'mean', false) // miss

      expect(cache.getHitRate()).toBe(75)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty data arrays', () => {
      const emptyData: number[] = []
      cache.set(emptyData, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(emptyData, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
    })

    it('should handle large data arrays', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => i)
      cache.set(largeData, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(largeData, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
    })

    it('should handle different baseline methods', () => {
      const methods = ['mean', 'median', 'naive', 'lin_reg', 'exp']

      methods.forEach((method, index) => {
        cache.set(mockData, index, 4, 0, method, false, mockResult)
      })

      const stats = cache.getStats()
      expect(stats.size).toBe(methods.length)
    })

    it('should handle zero values in data', () => {
      const dataWithZeros = [0, 0, 0, 100, 0]
      cache.set(dataWithZeros, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(dataWithZeros, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
    })

    it('should handle negative values in data', () => {
      const dataWithNegatives = [-100, -50, 0, 50, 100]
      cache.set(dataWithNegatives, 10, 4, 0, 'mean', false, mockResult)
      const result = cache.get(dataWithNegatives, 10, 4, 0, 'mean', false)

      expect(result).toEqual(mockResult)
    })
  })
})
