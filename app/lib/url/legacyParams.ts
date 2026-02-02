/**
 * Legacy URL Parameter Migration
 *
 * Maps old URL parameter names to their current equivalents.
 * This ensures backwards compatibility with old QR codes and saved links.
 *
 * Migration history:
 * - bdf → bf: baseline date from
 * - bdt → bt: baseline date to
 * - cum → ce: cumulative mode
 * - pct → p: show percentage
 * - a → m: metric type (ranking page - ASMR vs CMR)
 */

/**
 * Legacy to current parameter name mappings
 *
 * Keys are old parameter names, values are current parameter names.
 * Only includes parameters that have been renamed - not those that
 * were added new in the current version.
 */
export const LEGACY_PARAM_MAPPINGS: Record<string, string> = {
  // Baseline date range
  bdf: 'bf', // baselineDateFrom
  bdt: 'bt', // baselineDateTo

  // Display toggles
  cum: 'ce', // cumulative
  pct: 'p' // showPercentage

  // Metric type (ranking page only)
  // Note: 'a' → 'm' is handled separately in RankingStateResolver
  // because it requires value transformation (0/1 → cmr/asmr)
}

/**
 * Migrate a URL query string from legacy to current parameter format.
 *
 * This function:
 * 1. Parses the query string
 * 2. Renames legacy parameters to current names
 * 3. Preserves current parameters (no duplication)
 * 4. Returns the migrated query string
 *
 * @param queryString - URL query string (without leading ?)
 * @returns Migrated query string
 *
 * @example
 * migrateLegacyParams('c=USA&bdf=2015&bdt=2019&cum=1')
 * // Returns: 'c=USA&bf=2015&bt=2019&ce=1'
 */
export function migrateLegacyParams(queryString: string): string {
  if (!queryString) return queryString

  const params = new URLSearchParams(queryString)
  const migratedParams = new URLSearchParams()
  let hasLegacyKeys = false

  for (const [key, value] of params.entries()) {
    const newKey = LEGACY_PARAM_MAPPINGS[key]

    if (newKey) {
      // This is a legacy key
      hasLegacyKeys = true
      // Only migrate if the new key isn't already set
      // (prefer explicit new key over legacy)
      if (!params.has(newKey)) {
        migratedParams.append(newKey, value)
      }
      // Skip adding the legacy key - it's been migrated or superseded
    } else {
      // Not a legacy key, keep as-is
      migratedParams.append(key, value)
    }
  }

  return hasLegacyKeys ? migratedParams.toString() : queryString
}

/**
 * Migrate a query object from legacy to current parameter format.
 *
 * @param query - Query object (e.g., from Vue Router)
 * @returns Migrated query object
 */
export function migrateLegacyQuery(
  query: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const migrated: Record<string, string | string[] | undefined> = {}
  let hasLegacyKeys = false

  for (const [key, value] of Object.entries(query)) {
    const newKey = LEGACY_PARAM_MAPPINGS[key]

    if (newKey) {
      // This is a legacy key
      hasLegacyKeys = true
      // Only migrate if the new key isn't already set
      if (!(newKey in query)) {
        migrated[newKey] = value
      }
      // Skip adding the legacy key - it's been migrated or superseded
    } else {
      migrated[key] = value
    }
  }

  return hasLegacyKeys ? migrated : query
}

/**
 * Check if a query string contains any legacy parameters
 */
export function hasLegacyParams(queryString: string): boolean {
  if (!queryString) return false

  const params = new URLSearchParams(queryString)
  return Object.keys(LEGACY_PARAM_MAPPINGS).some(legacyKey => params.has(legacyKey))
}

/**
 * Build reverse mapping from current URL keys to legacy URL keys.
 * Used by state resolvers to look up legacy values when current key is not found.
 *
 * @example
 * // LEGACY_PARAM_MAPPINGS = { bdf: 'bf', bdt: 'bt' }
 * // Returns Map { 'bf' => ['bdf'], 'bt' => ['bdt'] }
 */
export function buildLegacyKeyLookup(): Map<string, string[]> {
  const lookup = new Map<string, string[]>()
  for (const [legacyKey, currentKey] of Object.entries(LEGACY_PARAM_MAPPINGS)) {
    const existing = lookup.get(currentKey) || []
    existing.push(legacyKey)
    lookup.set(currentKey, existing)
  }
  return lookup
}

// Pre-built lookup for use in hot paths
export const LEGACY_KEY_LOOKUP = buildLegacyKeyLookup()
