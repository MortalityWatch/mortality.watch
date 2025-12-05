import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import { db } from './db'
import { shortUrls } from '../../db/schema'

// Default values that should be omitted from hash (to normalize equivalent configs)
const DEFAULTS: Record<string, string> = {
  cs: 'line', // chartStyle default
  ct: 'yearly', // chartType default
  bm: 'lin_reg', // baselineMethod default
  sp: 'esp', // standardPopulation default
  ag: 'all' // ageGroups default
}

/**
 * Normalize config params for consistent hashing
 * - Sorts keys alphabetically
 * - Preserves value order for order-sensitive keys (c, ag - affects chart colors)
 * - Removes default values
 * - Removes empty/undefined values
 * - Does NOT include path (hash is config-only, page stored separately)
 */
function normalizeConfig(params: Record<string, string | undefined>): Record<string, string> {
  const normalized: Record<string, string> = {}

  // Sort keys alphabetically for consistent hashing
  const sortedKeys = Object.keys(params).sort()

  for (const key of sortedKeys) {
    const value = params[key]

    // Skip undefined/null/empty
    if (value === undefined || value === null || value === '') continue

    // Skip default values
    if (DEFAULTS[key] === value) continue

    normalized[key] = value
  }

  return normalized
}

/**
 * Compute SHA-256 hash of normalized config, return first 12 hex chars
 * Hash is config-only (no path) so same config = same hash across pages
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
 * @returns The short URL (e.g., https://www.mortality.watch/s/a1b2c3d4e5f6)
 */
export async function getOrCreateShortUrl(fullUrl: string): Promise<string> {
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'

  // Extract params and compute hash (hash is config-only, no path)
  const parsedUrl = new URL(fullUrl)
  const params = extractParamsFromUrl(fullUrl)
  const hash = computeConfigHash(params)

  // Check if this hash already exists
  const existing = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.id, hash))
    .limit(1)

  if (existing.length > 0) {
    return `${siteUrl}/s/${hash}`
  }

  // Extract path only (no domain) for storage
  const pathAndQuery = parsedUrl.pathname + parsedUrl.search

  // Store new mapping (path only)
  await db.insert(shortUrls).values({
    id: hash,
    urlHash: hash,
    fullUrl: pathAndQuery
  })

  return `${siteUrl}/s/${hash}`
}
