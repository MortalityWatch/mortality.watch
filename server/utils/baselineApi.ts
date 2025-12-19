/**
 * Baseline API Wrapper
 *
 * Server-side wrapper for baseline API calls with circuit breaker protection.
 * This is used by the baseline calculation routes to protect against external API failures.
 */

import { baselineCircuitBreaker } from './circuitBreaker'
import { fetchWithRetry } from '../../app/lib/fetch/fetchWithRetry'

/**
 * Fetch baseline calculation with circuit breaker protection
 * Only available server-side - called from server routes/middleware
 *
 * @param url - Base URL for the endpoint
 * @param body - Optional JSON body for POST requests (used when data is too large for URL)
 * @param retries - Number of retry attempts
 */
export async function fetchBaselineWithCircuitBreaker(
  url: string,
  body?: Record<string, unknown>,
  retries = 2
): Promise<string> {
  return await baselineCircuitBreaker.execute(async () => {
    return fetchWithRetry(url, body, {
      retries,
      timeout: 10000,
      retryDelay: 500
    })
  })
}
