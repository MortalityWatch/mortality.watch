import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import { db } from './db'
import { charts } from '../../db/schema'
import { normalizeConfig } from '../../app/lib/shortUrl/hashConfig'

/**
 * Compute SHA-256 hash of normalized config, return first 12 hex chars
 * Hash is config-only (no path) so same config = same hash across pages
 *
 * Note: Uses Node.js crypto for server-side (sync), while client uses Web Crypto (async).
 * Both produce identical hashes since they use the same normalization and SHA-256.
 */
function computeConfigHash(params: Record<string, string | undefined>): string {
  const normalized = normalizeConfig(params)
  const jsonStr = JSON.stringify(normalized)
  const hash = createHash('sha256').update(jsonStr).digest('hex')
  return hash.slice(0, 12)
}

/**
 * Extract query params from URL string
 * Multi-value params (like c=SWE&c=DEU) are joined with commas
 */
function extractParamsFromUrl(urlString: string): Record<string, string> {
  const parsedUrl = new URL(urlString)
  const params: Record<string, string> = {}
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    // For multi-value params (e.g., c=SWE&c=DEU), join with comma
    if (params[key]) {
      params[key] = `${params[key]},${value}`
    } else {
      params[key] = value
    }
  }
  return params
}

/**
 * Get or create a short URL for the given full URL
 * Uses deterministic hashing - same config always produces same hash
 * Stores only path (no domain) so URLs work across environments
 *
 * @param fullUrl - The full URL to shorten
 * @param baseUrl - Optional base URL for the short URL (defaults to NUXT_PUBLIC_SITE_URL)
 * @returns The short URL (e.g., https://www.mortality.watch/s/a1b2c3d4e5f6)
 */
export async function getOrCreateShortUrl(fullUrl: string, baseUrl?: string): Promise<string> {
  const siteUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'

  // Extract params and compute hash (hash is config-only, no path)
  const parsedUrl = new URL(fullUrl)
  const params = extractParamsFromUrl(fullUrl)
  const hash = computeConfigHash(params)

  // Check if this hash already exists
  const existing = await db
    .select()
    .from(charts)
    .where(eq(charts.id, hash))
    .limit(1)

  if (existing.length > 0) {
    return `${siteUrl}/s/${hash}`
  }

  // Extract query string only (no path) for storage
  const queryString = parsedUrl.search.slice(1) // Remove leading '?'

  // Detect page type from path
  const page = parsedUrl.pathname.includes('ranking') ? 'ranking' : 'explorer'

  // Store new chart config
  await db.insert(charts).values({
    id: hash,
    config: queryString,
    page
  })

  return `${siteUrl}/s/${hash}`
}
