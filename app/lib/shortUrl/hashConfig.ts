/**
 * Short URL hash generation from chart config
 *
 * Creates a deterministic 12-char hex hash from normalized config.
 * Same config always produces same hash.
 *
 * Important: Country order is preserved (affects chart colors/legend).
 */

// Default values that should be omitted from hash (to normalize equivalent configs)
const DEFAULTS: Record<string, string> = {
  cs: 'line', // chartStyle default
  ct: 'yearly', // chartType default
  bm: 'lin_reg', // baselineMethod default
  sp: 'esp', // standardPopulation default
  ag: 'all' // ageGroups default
}

/**
 * Normalize config for consistent hashing
 * - Sorts keys alphabetically (for consistency)
 * - Preserves value order for order-sensitive keys (c, ag - affects chart colors)
 * - Removes default values
 * - Removes empty/undefined values
 * - Does NOT include path (hash is config-only, path stored separately in DB)
 */
export function normalizeConfig(
  params: Record<string, string | undefined>
): Record<string, string> {
  const normalized: Record<string, string> = {}

  // Sort keys alphabetically for consistent hashing
  const sortedKeys = Object.keys(params).sort()

  for (const key of sortedKeys) {
    const value = params[key]

    // Skip undefined/null/empty
    if (value === undefined || value === null || value === '') continue

    // Skip default values
    if (DEFAULTS[key] === value) continue

    // For order-sensitive keys, preserve value as-is
    // For others, we could sort comma-separated values but it's not needed
    normalized[key] = value
  }

  return normalized
}

/**
 * Compute SHA-256 hash and return first 12 hex chars
 * Works in both browser and Node.js
 * Hash is config-only (no path) so same config = same hash across pages
 */
export async function computeConfigHash(
  params: Record<string, string | undefined>
): Promise<string> {
  const normalized = normalizeConfig(params)
  const jsonStr = JSON.stringify(normalized)

  // Use Web Crypto API (works in browser and Node 18+)
  const encoder = new TextEncoder()
  const data = encoder.encode(jsonStr)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert to hex and take first 12 chars
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex.slice(0, 12)
}

/**
 * Build the short URL from a hash
 */
export function buildShortUrl(hash: string, baseUrl = 'https://www.mortality.watch'): string {
  return `${baseUrl}/s/${hash}`
}

/**
 * Extract URL params from current explorer state
 * Used to create the config object for hashing
 * Multi-value params (like c=SWE&c=DEU) are joined with commas
 */
export function extractUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(window.location.search)

  for (const [key, value] of searchParams.entries()) {
    // For multi-value params (e.g., c=SWE&c=DEU), join with comma
    if (params[key]) {
      params[key] = `${params[key]},${value}`
    } else {
      params[key] = value
    }
  }

  return params
}
