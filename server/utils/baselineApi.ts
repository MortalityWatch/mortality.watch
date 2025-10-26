/**
 * Baseline API Wrapper
 *
 * Server-side wrapper for baseline API calls with circuit breaker protection.
 * This is used by the baseline calculation routes to protect against external API failures.
 */

import { baselineCircuitBreaker } from './circuitBreaker'

/**
 * Fetch baseline calculation with circuit breaker protection
 * Only available server-side - called from server routes/middleware
 */
export async function fetchBaselineWithCircuitBreaker(
  url: string,
  retries = 2
): Promise<string> {
  return await baselineCircuitBreaker.execute(async () => {
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
  })
}
