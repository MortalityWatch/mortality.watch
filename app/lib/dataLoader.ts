/**
 * Data Loader
 *
 * Abstraction layer for fetching mortality data.
 * Handles environment-aware data loading:
 * - Client: Uses API route (goes through server proxy)
 * - Server: Uses filesystem cache first, then S3 if cache miss
 * - Cache has TTL to ensure data freshness
 */

const S3_BASE = 'https://s3.mortality.watch/data/mortality'

interface ICache {
  getMetadata(): Promise<string | null>
  setMetadata(data: string): Promise<void>
  getMortalityData(country: string, chartType: string, ageGroup: string): Promise<string | null>
  setMortalityData(country: string, chartType: string, ageGroup: string, data: string): Promise<void>
}

export class DataLoader {
  private cache: ICache | null = null

  /**
   * Get cache instance (server-side only, lazy loaded)
   */
  private async getCache(): Promise<ICache | null> {
    if (!import.meta.server) return null

    if (!this.cache) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Server-side module not available in client bundle
        const module = await import('~/server/utils/cache')
        this.cache = module.filesystemCache
      } catch (error) {
        console.warn('Failed to load cache module:', error)
        return null
      }
    }

    return this.cache
  }

  /**
   * Get the appropriate URL for data fetching based on environment
   */
  private getUrl(path: string): string {
    // Server-side rendering
    if (import.meta.server) {
      // Production SSR: use S3 directly (faster, no extra hop)
      return `${S3_BASE}/${path}`
    }

    // Client-side: always use API route (goes through server proxy)
    return `/api/data/${path}`
  }

  /**
   * Fetch metadata CSV
   */
  async fetchMetadata(): Promise<string> {
    // Server-side: try cache first
    if (import.meta.server) {
      const cache = await this.getCache()
      if (cache) {
        const cached = await cache.getMetadata()
        if (cached) {
          return cached
        }
      }
    }

    // Cache miss or client-side: fetch from source
    const url = this.getUrl('world_meta.csv')
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
    }

    const data = await response.text()

    // Server-side: write to cache for next time
    if (import.meta.server) {
      const cache = await this.getCache()
      if (cache) {
        await cache.setMetadata(data)
      }
    }

    return data
  }

  /**
   * Fetch country data CSV
   */
  async fetchData(
    country: string,
    chartType: string,
    ageGroup: string
  ): Promise<string> {
    // Server-side: try cache first
    if (import.meta.server) {
      const cache = await this.getCache()
      if (cache) {
        const cached = await cache.getMortalityData(country, chartType, ageGroup)
        if (cached) {
          return cached
        }
      }
    }

    // Cache miss or client-side: fetch from source
    const ageSuffix = ageGroup === 'all' ? '' : `_${ageGroup}`
    const path = `${country}/${chartType}${ageSuffix}.csv`
    const url = this.getUrl(path)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${country}/${chartType}/${ageGroup}: ${response.status}`)
    }

    const data = await response.text()

    // Server-side: write to cache for next time
    if (import.meta.server) {
      const cache = await this.getCache()
      if (cache) {
        await cache.setMortalityData(country, chartType, ageGroup, data)
      }
    }

    return data
  }

  /**
   * Fetch baseline calculation from R stats server
   * Note: This always goes to external server, no caching
   * Includes retry logic with timeout and circuit breaker for external service reliability
   */
  async fetchBaseline(url: string, retries = 2): Promise<string> {
    // Get circuit breaker (server-side only)
    const circuitBreaker = await this.getCircuitBreaker()

    // Define the fetch operation
    const fetchOperation = async () => {
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

          const response = await fetch(url, {
            signal: controller.signal
          })

          clearTimeout(timeout)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return response.text()
        } catch (error) {
          lastError = error as Error

          // Don't retry on abort (timeout)
          if (lastError.name === 'AbortError') {
            throw new Error(`Baseline calculation timeout after 10s`)
          }

          // Only retry on network/server errors
          if (attempt < retries) {
            // Exponential backoff: 500ms, 1000ms
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
            continue
          }
        }
      }

      throw lastError || new Error('Failed to fetch baseline')
    }

    // Execute with circuit breaker if available (server-side)
    // Otherwise execute directly (client-side)
    if (circuitBreaker) {
      return await circuitBreaker.execute(fetchOperation)
    } else {
      return await fetchOperation()
    }
  }

  /**
   * Get circuit breaker instance (server-side only)
   */
  private async getCircuitBreaker() {
    if (!import.meta.server) return null

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Server-side module not available in client bundle
      const module = await import('~/server/utils/circuitBreaker')
      return module.baselineCircuitBreaker
    } catch (error) {
      console.warn('Failed to load circuit breaker:', error)
      return null
    }
  }
}

// Singleton instance
export const dataLoader = new DataLoader()
