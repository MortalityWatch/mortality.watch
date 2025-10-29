/**
 * Client-side request cache with SWR (Stale-While-Revalidate) pattern
 *
 * Provides in-memory caching for data fetches with automatic revalidation.
 * Complements server-side caching for optimal performance.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  revalidating: boolean
}

interface CacheOptions {
  /**
   * Time in milliseconds before data is considered stale (default: 5 minutes)
   */
  staleTime?: number

  /**
   * Time in milliseconds before cache entry expires (default: 30 minutes)
   */
  cacheTime?: number
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000 // 5 minutes
const DEFAULT_CACHE_TIME = 30 * 60 * 1000 // 30 minutes

/**
 * Simple in-memory cache for client-side data fetching
 *
 * Features:
 * - Stale-while-revalidate: Returns stale data immediately while fetching fresh data
 * - Automatic cleanup: Removes expired entries
 * - SSR-safe: Only runs on client-side
 */
export class RequestCache {
  private cache: Map<string, CacheEntry<unknown>>
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.cache = new Map()

    // Only run cleanup on client-side
    if (import.meta.client) {
      // Clean up expired entries every 5 minutes
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000)
    }
  }

  /**
   * Get cached data or fetch fresh data
   *
   * @param key - Unique cache key
   * @param fetcher - Function to fetch fresh data
   * @param options - Cache configuration
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const staleTime = options.staleTime ?? DEFAULT_STALE_TIME
    const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME
    const now = Date.now()

    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    // No cache entry - fetch fresh
    if (!entry) {
      const data = await fetcher()
      this.cache.set(key, {
        data,
        timestamp: now,
        revalidating: false
      })
      return data
    }

    const age = now - entry.timestamp

    // Cache expired - fetch fresh
    if (age > cacheTime) {
      const data = await fetcher()
      this.cache.set(key, {
        data,
        timestamp: now,
        revalidating: false
      })
      return data
    }

    // Cache is fresh - return immediately
    if (age < staleTime) {
      return entry.data
    }

    // Cache is stale but valid - return stale data and revalidate in background (SWR)
    if (!entry.revalidating) {
      // Mark as revalidating
      entry.revalidating = true

      // Revalidate in background
      fetcher()
        .then((data) => {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            revalidating: false
          })
        })
        .catch((error) => {
          console.error(`[RequestCache] Revalidation failed for key "${key}":`, error)
          // Keep stale data on error, just mark as not revalidating
          entry.revalidating = false
        })
    }

    // Return stale data immediately
    return entry.data
  }

  /**
   * Manually set cache entry
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      revalidating: false
    })
  }

  /**
   * Check if key exists and is fresh
   */
  has(key: string, maxAge: number = DEFAULT_STALE_TIME): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const age = Date.now() - entry.timestamp
    return age < maxAge
  }

  /**
   * Invalidate (remove) cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = DEFAULT_CACHE_TIME

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > maxAge) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Cleanup on destruction
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

/**
 * Global singleton instance
 */
export const requestCache = new RequestCache()
