/**
 * Data Loader
 *
 * Abstraction layer for fetching mortality data.
 * Handles environment-aware data loading:
 * - Client: Uses API route with SWR caching (server proxy + client-side cache)
 * - Server: Direct S3 access (server-side caching only)
 */

import { requestCache } from './utils/cache'

const S3_BASE = 'https://s3.mortality.watch/data/mortality'

export class DataLoader {
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
   * Uses client-side cache on client, direct fetch on server
   */
  async fetchMetadata(): Promise<string> {
    const path = 'world_meta.csv'
    const url = this.getUrl(path)

    // Server-side or test environment: no client cache, just fetch
    // Check for test environment via process.env or vitest globals
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    if (import.meta.server || isTest) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
      }
      return response.text()
    }

    // Client-side: use SWR cache
    return requestCache.get(
      `metadata:${path}`,
      async () => {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
        }
        return response.text()
      },
      { staleTime: 10 * 60 * 1000 } // 10 minutes stale time for metadata
    )
  }

  /**
   * Fetch country data CSV
   * Uses client-side cache on client, direct fetch on server
   */
  async fetchData(
    country: string,
    chartType: string,
    ageGroup: string
  ): Promise<string> {
    const ageSuffix = ageGroup === 'all' ? '' : `_${ageGroup}`
    const path = `${country}/${chartType}${ageSuffix}.csv`
    const url = this.getUrl(path)

    // Server-side or test environment: no client cache, just fetch
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    if (import.meta.server || isTest) {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${country}/${chartType}/${ageGroup}: ${response.status}`)
      }

      return response.text()
    }

    // Client-side: use SWR cache
    return requestCache.get(
      `data:${country}:${chartType}:${ageGroup}`,
      async () => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${country}/${chartType}/${ageGroup}: ${response.status}`)
        }

        return response.text()
      },
      { staleTime: 5 * 60 * 1000 } // 5 minutes stale time for country data
    )
  }

  /**
   * Fetch baseline calculation from R stats server
   * Note: This always goes to external server, no caching
   * Includes retry logic with timeout for external service reliability
   */
  async fetchBaseline(url: string, retries = 2): Promise<string> {
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
}

// Singleton instance
export const dataLoader = new DataLoader()
