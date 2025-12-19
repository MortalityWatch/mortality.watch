/**
 * Data Loader
 *
 * Abstraction layer for fetching mortality data.
 * Handles environment-aware data loading:
 * - Client: Uses API route (goes through server proxy with caching)
 * - Server: Direct S3 access (caching handled by API routes)
 */

import { UI_CONFIG } from './config/constants'
import { fetchWithRetry } from './fetch/fetchWithRetry'

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
   */
  async fetchMetadata(): Promise<string> {
    const url = this.getUrl('world_meta.csv')
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }

  /**
   * Fetch country data CSV
   */
  async fetchData(
    country: string,
    chartType: string,
    ageGroup: string
  ): Promise<string> {
    const ageSuffix = ageGroup === 'all' ? '' : `_${ageGroup}`
    const path = `${country}/${chartType}${ageSuffix}.csv`
    const url = this.getUrl(path)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${country}/${chartType}/${ageGroup}: ${response.status}`)
    }

    return response.text()
  }

  /**
   * Fetch baseline calculation from R stats server
   * Note: This always goes to external server, no caching
   * Includes retry logic with timeout for external service reliability
   *
   * @param url - Base URL for GET requests, or full URL with query params for GET
   * @param body - Optional JSON body for POST requests (used when data is too large for URL)
   * @param retries - Number of retry attempts
   */
  async fetchBaseline(url: string, body?: Record<string, unknown>, retries = 2): Promise<string> {
    return fetchWithRetry(url, body, {
      retries,
      timeout: 10000,
      retryDelay: UI_CONFIG.RETRY_DELAY / 2 // Use configured delay
    })
  }
}

// Singleton instance
export const dataLoader = new DataLoader()
