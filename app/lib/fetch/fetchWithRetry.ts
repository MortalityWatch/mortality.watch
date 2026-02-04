/**
 * Fetch with Retry
 *
 * Shared utility for making HTTP requests with retry logic and timeout.
 * Used by both client-side dataLoader and server-side baselineApi.
 */

export interface FetchWithRetryOptions {
  /** Number of retry attempts (default: 2) */
  retries?: number
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Base delay for exponential backoff in milliseconds (default: 500) */
  retryDelay?: number
}

/**
 * Fetch URL with retry logic and timeout
 *
 * @param url - URL to fetch
 * @param body - Optional JSON body for POST requests
 * @param options - Retry and timeout options
 * @returns Response text
 */
export async function fetchWithRetry(
  url: string,
  body?: Record<string, unknown>,
  options: FetchWithRetryOptions = {}
): Promise<string> {
  const { retries = 2, timeout = 10000, retryDelay = 500 } = options
  let lastError: Error | null = null
  const method = body ? 'POST' : 'GET'

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
        headers: {}
      }

      if (body) {
        // POST request - add content type
        fetchOptions.headers = {
          'Content-Type': 'application/json'
        }
        fetchOptions.body = JSON.stringify(body)
      } else {
        // GET request - allow caching for baseline requests
        fetchOptions.headers = {
          'Cache-Control': 'public, max-age=3600'
        }
      }

      const response = await fetch(url, fetchOptions)

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.text()
    } catch (error) {
      lastError = error as Error

      // Don't retry on abort (timeout)
      if (lastError.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`)
      }

      // Only retry on network/server errors
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }
    }
  }

  throw lastError || new Error('Failed to fetch')
}
