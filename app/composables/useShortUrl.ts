import { ref, computed } from 'vue'
import { computeConfigHash, buildShortUrl, extractUrlParams } from '@/lib/shortUrl/hashConfig'

/**
 * Client-side cache for short URLs
 * Maps config hash → short URL
 */
const shortUrlCache = new Map<string, string>()

/**
 * Composable for managing short URLs
 *
 * Uses deterministic hashing - same config always produces same short URL.
 * Hash is computed locally (instant), then stored to DB via fire-and-forget POST.
 */
export function useShortUrl() {
  const shortUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get short URL for current page state
   * - Computes hash locally (instant)
   * - Fires POST to store in DB (non-blocking)
   */
  async function getShortUrl(fullUrl?: string): Promise<string> {
    isLoading.value = true
    error.value = null

    try {
      // Extract params from URL
      const params = extractUrlParams()

      // Compute hash locally (instant, deterministic)
      // Hash is config-only (no path) - same config = same hash
      const hash = await computeConfigHash(params)

      // Check cache
      if (shortUrlCache.has(hash)) {
        const cached = shortUrlCache.get(hash)!
        shortUrl.value = cached
        isLoading.value = false
        return cached
      }

      // Build short URL
      const siteUrl = window.location.origin
      const shortUrlValue = buildShortUrl(hash, siteUrl)

      // Cache it
      shortUrlCache.set(hash, shortUrlValue)
      shortUrl.value = shortUrlValue

      // Fire-and-forget POST to store in DB (non-blocking)
      // Store query string (without leading ?)
      const query = window.location.search.slice(1)
      const page = window.location.pathname.includes('/ranking') ? 'ranking' : 'explorer'
      $fetch('/api/shorten', {
        method: 'POST',
        body: { hash, query, page }
      }).catch(() => {
        // Silently ignore errors - short URL will still work if hash is in DB
      })

      return shortUrlValue
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate short URL'
      // Fall back to full URL on error
      const fallback = fullUrl || window.location.href
      shortUrl.value = fallback
      return fallback
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear the short URL cache (useful for testing)
   */
  function clearCache() {
    shortUrlCache.clear()
  }

  return {
    shortUrl: computed(() => shortUrl.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    getShortUrl,
    clearCache
  }
}
