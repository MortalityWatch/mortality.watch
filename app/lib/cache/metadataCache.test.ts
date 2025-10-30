import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MetadataCache } from './metadataCache'
import { Country, type CountryRaw } from '~/model'

describe('MetadataCache', () => {
  let cache: MetadataCache

  beforeEach(() => {
    cache = new MetadataCache()
  })

  describe('Record format caching', () => {
    it('should return null for cache miss', () => {
      const result = cache.get()
      expect(result).toBeNull()
    })

    it('should cache and retrieve metadata', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      cache.set(mockData)
      const result = cache.get()

      expect(result).toEqual(mockData)
      expect(result?.USA?.iso3c).toBe('USA')
    })

    it('should handle filtered cache keys', () => {
      const allData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw),
        GBR: new Country({
          iso3c: 'GBR',
          jurisdiction: 'United Kingdom',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'ONS'
        } as CountryRaw)
      }

      const filteredData: Record<string, Country> = {
        USA: allData.USA!
      }

      // Cache both all and filtered
      cache.set(allData)
      cache.set(filteredData, ['USA'])

      // Should have separate cache entries
      const allResult = cache.get()
      const filteredResult = cache.get(['USA'])

      expect(allResult).toEqual(allData)
      expect(filteredResult).toEqual(filteredData)
      expect(Object.keys(allResult!)).toHaveLength(2)
      expect(Object.keys(filteredResult!)).toHaveLength(1)
    })

    it('should normalize cache keys by sorting', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      // Cache with one order
      cache.set(mockData, ['USA', 'GBR', 'FRA'])

      // Retrieve with different order - should hit cache
      const result = cache.get(['FRA', 'GBR', 'USA'])

      expect(result).toEqual(mockData)
    })
  })

  describe('Flat array format caching', () => {
    it('should return null for cache miss', () => {
      const result = cache.getFlat()
      expect(result).toBeNull()
    })

    it('should cache and retrieve flat metadata', () => {
      const mockData: CountryRaw[] = [
        {
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        },
        {
          iso3c: 'GBR',
          jurisdiction: 'United Kingdom',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'ONS'
        }
      ]

      cache.setFlat(mockData)
      const result = cache.getFlat()

      expect(result).toEqual(mockData)
      expect(result).toHaveLength(2)
      expect(result?.[0]?.iso3c).toBe('USA')
    })

    it('should handle filtered flat cache', () => {
      const filteredData: CountryRaw[] = [
        {
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        }
      ]

      cache.setFlat(filteredData, ['USA'])
      const result = cache.getFlat(['USA'])

      expect(result).toEqual(filteredData)
      expect(result).toHaveLength(1)
    })
  })

  describe('TTL expiration', () => {
    it('should expire cache after TTL', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      // Mock Date.now to control time
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 25 * 60 * 60 * 1000) // 25 hours later (expired)

      cache.set(mockData)
      const result = cache.get()

      expect(result).toBeNull()
      vi.restoreAllMocks()
    })

    it('should not expire cache before TTL', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      // Mock Date.now to control time
      const now = Date.now()
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set time
        .mockReturnValueOnce(now + 23 * 60 * 60 * 1000) // 23 hours later (not expired)

      cache.set(mockData)
      const result = cache.get()

      expect(result).toEqual(mockData)
      vi.restoreAllMocks()
    })
  })

  describe('Cache invalidation', () => {
    it('should invalidate all cache entries', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      const mockFlat: CountryRaw[] = [
        {
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        }
      ]

      cache.set(mockData)
      cache.setFlat(mockFlat)

      cache.invalidate()

      expect(cache.get()).toBeNull()
      expect(cache.getFlat()).toBeNull()
    })

    it('should invalidate specific cache key', () => {
      const allData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      const filteredData: Record<string, Country> = {
        USA: allData.USA!
      }

      cache.set(allData)
      cache.set(filteredData, ['USA'])

      // Invalidate only filtered
      cache.invalidateKey(['USA'])

      expect(cache.get()).toEqual(allData)
      expect(cache.get(['USA'])).toBeNull()
    })
  })

  describe('Cache statistics', () => {
    it('should return correct cache stats', () => {
      const mockData: Record<string, Country> = {
        USA: new Country({
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        } as CountryRaw)
      }

      cache.set(mockData)
      cache.set(mockData, ['USA'])

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.entries).toHaveLength(2)
      expect(stats.entries.every(e => e.age >= 0)).toBe(true)
    })

    it('should include flat cache in stats', () => {
      const mockFlat: CountryRaw[] = [
        {
          iso3c: 'USA',
          jurisdiction: 'United States',
          min_date: '2020-01-01',
          max_date: '2023-12-31',
          type: 'deaths',
          age_groups: 'all',
          source: 'CDC'
        }
      ]

      cache.setFlat(mockFlat)

      const stats = cache.getStats()

      expect(stats.flatSize).toBe(1)
    })
  })
})
