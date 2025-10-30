/**
 * Metadata Cache
 *
 * Singleton cache for country metadata to reduce repeated loadCountryMetadata() calls.
 * Implements TTL-based caching with 1 day expiration.
 *
 * Performance impact:
 * - Eliminates ~50-100ms on subsequent page loads
 * - Reduces redundant CSV parsing across 6+ call sites
 */

import type { Country, CountryRaw } from '~/model'

interface CacheEntry {
  data: Record<string, Country>
  timestamp: number
}

interface FlatCacheEntry {
  data: CountryRaw[]
  timestamp: number
}

export class MetadataCache {
  private cache: Map<string, CacheEntry> = new Map()
  private flatCache: Map<string, FlatCacheEntry> = new Map()
  private readonly TTL = 24 * 60 * 60 * 1000 // 1 day in milliseconds

  /**
   * Generate cache key based on filter options
   */
  private getCacheKey(filterCountries?: string[]): string {
    if (!filterCountries || filterCountries.length === 0) {
      return 'all'
    }
    // Sort to ensure consistent cache keys
    return filterCountries.slice().sort().join(',')
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.TTL
  }

  /**
   * Get cached metadata (Record format)
   * Returns null if not cached or expired
   */
  get(filterCountries?: string[]): Record<string, Country> | null {
    const key = this.getCacheKey(filterCountries)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (!this.isValid(entry.timestamp)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Get cached flat metadata (Array format)
   * Returns null if not cached or expired
   */
  getFlat(filterCountries?: string[]): CountryRaw[] | null {
    const key = this.getCacheKey(filterCountries)
    const entry = this.flatCache.get(key)

    if (!entry) {
      return null
    }

    if (!this.isValid(entry.timestamp)) {
      this.flatCache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Store metadata in cache (Record format)
   */
  set(data: Record<string, Country>, filterCountries?: string[]): void {
    const key = this.getCacheKey(filterCountries)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Store flat metadata in cache (Array format)
   */
  setFlat(data: CountryRaw[], filterCountries?: string[]): void {
    const key = this.getCacheKey(filterCountries)
    this.flatCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Invalidate all cached entries
   */
  invalidate(): void {
    this.cache.clear()
    this.flatCache.clear()
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateKey(filterCountries?: string[]): void {
    const key = this.getCacheKey(filterCountries)
    this.cache.delete(key)
    this.flatCache.delete(key)
  }

  /**
   * Get cache statistics (useful for debugging/monitoring)
   */
  getStats(): {
    size: number;
    flatSize: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp
    }))

    return {
      size: this.cache.size,
      flatSize: this.flatCache.size,
      entries
    }
  }
}

// Singleton instance
export const metadataCache = new MetadataCache()
