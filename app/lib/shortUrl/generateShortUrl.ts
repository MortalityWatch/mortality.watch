/**
 * Short URL Generation Utility
 *
 * Handles QR-friendly short URL generation with background database storage.
 * Optimized for performance with minimal blocking operations.
 */

import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { computeConfigHash, buildShortUrl, extractUrlParams } from '@/lib/shortUrl/hashConfig'
import { logger } from '@/lib/logger'

const log = logger.withPrefix('ShortUrlGenerator')

export interface GenerateShortUrlOptions {
  /** Current route object from useRoute() */
  route: RouteLocationNormalizedLoaded
  /** Callback to update the current short URL ref */
  onUrlGenerated?: (shortUrl: string) => void
}

/**
 * Generate a short URL for QR codes with background database storage.
 *
 * Performance characteristics:
 * - Hash computation: ~1-2ms (blocking)
 * - Database storage: Fire-and-forget (non-blocking)
 *
 * @param options - Configuration options
 * @returns Promise<string> - The generated short URL, or null if generation fails
 */
export async function generateShortUrl(options: GenerateShortUrlOptions): Promise<string | null> {
  const { route, onUrlGenerated } = options

  try {
    // Extract params and generate hash (fast async crypto operation ~1-2ms)
    const params = extractUrlParams(route.query as Record<string, string | string[] | undefined>)
    const hash = await computeConfigHash(params)
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.mortality.watch'
    const shortUrl = buildShortUrl(hash, siteUrl)

    // Notify caller of the generated URL
    onUrlGenerated?.(shortUrl)

    // Store in database in background (fire-and-forget)
    if (import.meta.client) {
      storeShortUrlInBackground(params, hash, route.path)
    }

    return shortUrl
  } catch (error) {
    // Log but don't fail - caller can use full URL as fallback
    log.warn('Failed to generate short URL, using full URL', { error })
    return null
  }
}

/**
 * Store the short URL mapping in database (background operation).
 * This is fire-and-forget to avoid blocking the UI.
 *
 * @param params - URL parameters
 * @param hash - Generated hash
 * @param routePath - Current route path
 */
async function storeShortUrlInBackground(
  params: Record<string, string>,
  hash: string,
  routePath: string
): Promise<void> {
  try {
    const queryParts = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')

    const page = routePath.includes('/ranking') ? 'ranking' : 'explorer'

    await $fetch('/api/shorten', {
      method: 'POST',
      body: { hash, query: queryParts, page }
    })
  } catch {
    // Silently ignore errors - short URL still works if hash exists
    // No need to log since this is background storage and non-critical
  }
}
