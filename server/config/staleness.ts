/**
 * Data Staleness Configuration
 *
 * Defines source-specific staleness thresholds based on expected update frequency
 *
 * Threshold in days:
 * - staleAfter: Number of days after which data is considered stale
 */

export interface StalenessThreshold {
  staleAfter: number
  description: string
}

// Default threshold for most sources
// Most mortality data sources update weekly or monthly
export const defaultThreshold: StalenessThreshold = {
  staleAfter: 180, // 6 months - reasonable for weekly/monthly data
  description: 'Default: weekly/monthly updates'
}

// Source-specific overrides for non-standard update frequencies
export const stalenessOverrides: Record<string, Partial<StalenessThreshold>> = {
  // United Nations - Annual demographic data with multi-year lag
  // UN data is always 2-3 years behind and that's expected/acceptable
  un: {
    staleAfter: 365 * 5, // 5 years - effectively never stale unless truly abandoned
    description: 'UN data updates annually (2-3 year lag is normal)'
  },

  // CDC, StatCan, Destatis - Monthly with processing lag
  cdc: {
    staleAfter: 240, // 8 months
    description: 'CDC updates monthly'
  },
  statcan: {
    staleAfter: 240, // 8 months
    description: 'StatCan updates monthly'
  },
  destatis: {
    staleAfter: 240, // 8 months
    description: 'Destatis updates monthly'
  }

  // Sources using defaults (180 days / 6 months):
  // - mortality_org (HMD STMF)
  // - eurostat
  // - world_mortality
}

/**
 * Sources to ignore in staleness monitoring
 * Add sources here that are deprecated, unreliable, or intentionally not updated
 */
export const ignoredSources: string[] = [
  // Example: 'deprecated_source'
]

/**
 * Get merged threshold for a source (default + overrides)
 */
function getThreshold(source: string): StalenessThreshold {
  const overrides = stalenessOverrides[source]
  if (!overrides) {
    return defaultThreshold
  }

  return {
    staleAfter: overrides.staleAfter ?? defaultThreshold.staleAfter,
    description: overrides.description ?? defaultThreshold.description
  }
}

/**
 * Get staleness status for a data source
 */
export function getStalenessStatus(
  source: string,
  daysSinceUpdate: number
): 'fresh' | 'stale' {
  const threshold = getThreshold(source)
  return daysSinceUpdate < threshold.staleAfter ? 'fresh' : 'stale'
}

/**
 * Get threshold description for a source
 */
export function getThresholdDescription(source: string): string {
  return getThreshold(source).description
}

/**
 * Get stale threshold in days for a source
 */
export function getStaleThreshold(source: string): number {
  return getThreshold(source).staleAfter
}

/**
 * Check if a source should be ignored in staleness monitoring
 */
export function isSourceIgnored(source: string): boolean {
  return ignoredSources.includes(source)
}
