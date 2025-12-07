import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { computeConfigHash, buildShortUrl, extractUrlParams } from '@/lib/shortUrl/hashConfig'

/**
 * SSR-compatible origin getter
 * Uses useRequestURL on server, window.location on client
 */
function getOrigin(): string {
  if (import.meta.server) {
    // On server, try to use useRequestURL from Nuxt
    try {
      // Dynamic import to avoid bundling issues in tests
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useRequestURL } = require('#imports')
      return useRequestURL().origin
    } catch {
      return 'https://www.mortality.watch'
    }
  }
  // On client, use window.location
  return typeof window !== 'undefined' ? window.location.origin : 'https://www.mortality.watch'
}

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
 *
 * SSR-compatible: Uses useRoute().query which works on both server and client.
 */
export function useShortUrl() {
  const shortUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const route = useRoute()

  /**
   * Get short URL for current page state
   * - Computes hash locally (instant)
   * - Fires POST to store in DB (non-blocking)
   *
   * @param explicitParams - Optional params to use instead of route.query.
   *                         Use this to pass original URL params before state resolution modifies the URL.
   */
  async function getShortUrl(explicitParams?: Record<string, string | string[] | undefined>): Promise<string> {
    isLoading.value = true
    error.value = null

    try {
      // Extract params - use explicit params if provided, otherwise use route.query
      const params = extractUrlParams(explicitParams ?? route.query as Record<string, string | string[] | undefined>)

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

      // Build short URL using SSR-compatible origin
      const siteUrl = getOrigin()
      const shortUrlValue = buildShortUrl(hash, siteUrl)

      // Cache it
      shortUrlCache.set(hash, shortUrlValue)
      shortUrl.value = shortUrlValue

      // Fire-and-forget POST to store in DB (non-blocking)
      // Only on client side (POST requests don't work in SSR context)
      if (import.meta.client) {
        // Build query string from route params
        const queryParts = Object.entries(params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
        const page = route.path.includes('/ranking') ? 'ranking' : 'explorer'
        $fetch('/api/shorten', {
          method: 'POST',
          body: { hash, query: queryParts, page }
        }).catch(() => {
          // Silently ignore errors - short URL will still work if hash is in DB
        })
      }

      return shortUrlValue
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate short URL'
      // Fall back to full URL on error
      const origin = getOrigin()
      const fallback = `${origin}${route.fullPath}`
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
