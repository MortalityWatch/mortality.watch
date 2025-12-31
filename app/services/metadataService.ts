/**
 * Metadata Service
 *
 * Loads and queries mortality data availability metadata.
 * Used to determine which chart types, age groups, and date ranges
 * are available for selected countries.
 */

import Papa from 'papaparse'
import { dataLoader } from '@/lib/dataLoader'
import { getSeasonString } from '@/model/baseline'
import { logger } from '@/lib/logger'

export interface MetadataEntry {
  iso3c: string
  jurisdiction: string
  type: '1' | '2' | '3' // 1=yearly, 2=monthly, 3=weekly
  source: string
  minDate: string
  maxDate: string
  ageGroups: string[]
}

export class MetadataService {
  private metadata: MetadataEntry[] | null = null
  private loading: Promise<void> | null = null

  /**
   * Load and parse world_meta.csv
   * Called once on app initialization
   */
  async load(): Promise<void> {
    // If already loaded, return immediately
    if (this.metadata) return

    // If already loading, wait for that to complete
    if (this.loading) return this.loading

    // Start loading
    this.loading = this._loadInternal()
    await this.loading
    this.loading = null
  }

  private async _loadInternal(): Promise<void> {
    const csv = await dataLoader.fetchMetadata()

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    })

    this.metadata = (parsed.data as Array<Record<string, string>>)
      .filter((row: Record<string, string>) => row.iso3c && row.age_groups)
      .map((row: Record<string, string>) => ({
        iso3c: row.iso3c!,
        jurisdiction: row.jurisdiction || '',
        type: (row.type || '1') as '1' | '2' | '3',
        source: row.source || '',
        minDate: row.min_date || '',
        maxDate: row.max_date || '',
        ageGroups: row.age_groups!.split(',').map((s: string) => s.trim())
      }))
  }

  /**
   * Get available chart types for given countries
   * Returns intersection of available types (data available for ALL countries)
   */
  getAvailableChartTypes(countries: string[]): string[] {
    if (!this.metadata) throw new Error('Metadata not loaded')
    if (countries.length === 0) return []

    // Find entries for each country
    const typesByCountry = countries.map((country) => {
      const entries = this.metadata!.filter(e => e.iso3c === country)
      const types = new Set(entries.map(e => e.type))

      // Data derivation: Weekly data (type '3') can be aggregated to yearly (type '1') and monthly (type '2')
      if (types.has('3')) {
        types.add('1') // Weekly can be aggregated to yearly
        types.add('2') // Weekly can be aggregated to monthly
      }

      return types
    })

    if (typesByCountry.length === 0) return []

    // Intersection of all sets
    const commonTypes = typesByCountry.reduce((acc, set) =>
      new Set([...acc].filter(x => set.has(x)))
    )

    // Map data types to chart types
    const typeMap: Record<string, string[]> = {
      1: ['yearly', 'midyear', 'fluseason'],
      2: ['monthly', 'quarterly'],
      3: ['weekly', 'weekly_13w_sma', 'weekly_26w_sma', 'weekly_52w_sma', 'weekly_104w_sma']
    }

    return Array.from(commonTypes).flatMap(type => typeMap[type] || [])
  }

  /**
   * Get available age groups for given countries and chart type
   * Returns intersection of available age groups (data available for ALL countries)
   */
  getAvailableAgeGroups(countries: string[], chartType: string): string[] {
    if (!this.metadata) throw new Error('Metadata not loaded')
    if (countries.length === 0) return []

    const dataType = this.chartTypeToDataType(chartType)

    // Find entries for each country with matching type
    const ageGroupsByCountry = countries.map((country) => {
      let entries = this.metadata!.filter(
        e => e.iso3c === country && e.type === dataType
      )

      // Data derivation: Higher frequency data can be aggregated to lower frequency
      // - Weekly (type 3) can be aggregated to yearly or monthly
      // - Monthly (type 2) can be aggregated to yearly
      if (dataType === '1') {
        // For yearly, also check monthly and weekly data
        const monthlyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '2'
        )
        const weeklyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '3'
        )
        entries = [...entries, ...monthlyEntries, ...weeklyEntries]
      } else if (dataType === '2') {
        // For monthly, also check weekly data
        const weeklyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '3'
        )
        entries = [...entries, ...weeklyEntries]
      }

      const allGroups = entries.flatMap(e => e.ageGroups)
      return new Set(allGroups)
    })

    if (ageGroupsByCountry.length === 0) return []

    // Intersection
    const commonGroups = ageGroupsByCountry.reduce((acc, set) =>
      new Set([...acc].filter(x => set.has(x)))
    )

    return Array.from(commonGroups)
  }

  /**
   * Get date range for given selection
   * Returns intersection (latest start, earliest end)
   */
  getAvailableDateRange(
    countries: string[],
    chartType: string,
    ageGroups: string[]
  ): { minDate: string, maxDate: string } | null {
    if (!this.metadata) throw new Error('Metadata not loaded')
    if (countries.length === 0) return null

    const dataType = this.chartTypeToDataType(chartType)

    // Find matching entries
    let entries = this.metadata.filter(e =>
      countries.includes(e.iso3c)
      && e.type === dataType
      && ageGroups.some(ag => e.ageGroups.includes(ag))
    )

    // Data derivation: Higher frequency data can be aggregated to lower frequency
    // - Weekly (type 3) can be aggregated to yearly or monthly
    // - Monthly (type 2) can be aggregated to yearly
    if (dataType === '1') {
      // For yearly, also check monthly and weekly data
      const monthlyEntries = this.metadata.filter(e =>
        countries.includes(e.iso3c)
        && e.type === '2'
        && ageGroups.some(ag => e.ageGroups.includes(ag))
      )
      const weeklyEntries = this.metadata.filter(e =>
        countries.includes(e.iso3c)
        && e.type === '3'
        && ageGroups.some(ag => e.ageGroups.includes(ag))
      )
      entries = [...entries, ...monthlyEntries, ...weeklyEntries]
    } else if (dataType === '2') {
      // For monthly, also check weekly data
      const weeklyEntries = this.metadata.filter(e =>
        countries.includes(e.iso3c)
        && e.type === '3'
        && ageGroups.some(ag => e.ageGroups.includes(ag))
      )
      entries = [...entries, ...weeklyEntries]
    }

    if (entries.length === 0) return null

    // Union: earliest start, latest end (show maximum available range across all countries)
    const minDate = entries.reduce((min, e) =>
      e.minDate < min ? e.minDate : min,
    entries[0]!.minDate
    )

    const maxDate = entries.reduce((max, e) =>
      e.maxDate > max ? e.maxDate : max,
    entries[0]!.maxDate
    )

    // Convert ISO dates to period format based on chart type
    // For flu season/midyear, the ISO date represents the END of the period
    // So we need to add 1 to get the season that ends in that year
    const minYear = parseInt(minDate.substring(0, 4))
    const maxYear = parseInt(maxDate.substring(0, 4))

    const isFluSeason = chartType === 'fluseason' || chartType === 'midyear'
    const formattedMinDate = getSeasonString(chartType, isFluSeason ? minYear + 1 : minYear)
    const formattedMaxDate = getSeasonString(chartType, isFluSeason ? maxYear + 1 : maxYear)

    logger.debug('[MetadataService] Date range', {
      rawMin: minDate,
      rawMax: maxDate,
      minYear,
      maxYear,
      formattedMin: formattedMinDate,
      formattedMax: formattedMaxDate,
      chartType,
      countries
    })

    return { minDate: formattedMinDate, maxDate: formattedMaxDate }
  }

  /**
   * Check if specific combination is available
   */
  isAvailable(country: string, chartType: string, ageGroup: string): boolean {
    if (!this.metadata) return false

    const dataType = this.chartTypeToDataType(chartType)

    return this.metadata.some(e =>
      e.iso3c === country
      && e.type === dataType
      && e.ageGroups.includes(ageGroup)
    )
  }

  /**
   * Get sources with their age groups for ASD calculation
   *
   * Returns a map of source -> age groups (excluding "all")
   * For ASD, we need all age groups from ONE source to properly sum to 100%
   */
  getSourcesWithAgeGroups(
    country: string,
    chartType: string
  ): Map<string, string[]> {
    if (!this.metadata) throw new Error('Metadata not loaded')

    const dataType = this.chartTypeToDataType(chartType)
    const result = new Map<string, string[]>()

    // Find entries for this country and type
    const entries = this.metadata.filter(
      e => e.iso3c === country && e.type === dataType
    )

    // Group age groups by source
    for (const entry of entries) {
      // Exclude "all" - we only want individual age groups for ASD
      const ageGroups = entry.ageGroups.filter(ag => ag !== 'all')
      if (ageGroups.length > 0) {
        result.set(entry.source, ageGroups)
      }
    }

    return result
  }

  /**
   * Get sources with age groups that are available across ALL selected countries
   *
   * For multi-country ASD, we need sources that exist for all countries
   * with consistent age group availability
   */
  getCommonSourcesWithAgeGroups(
    countries: string[],
    chartType: string
  ): Map<string, string[]> {
    if (!this.metadata) throw new Error('Metadata not loaded')
    if (countries.length === 0) return new Map()

    const dataType = this.chartTypeToDataType(chartType)

    // Get source -> age groups for each country
    // Use data derivation: higher frequency data can be aggregated
    const byCountry = countries.map((country) => {
      const countryMap = new Map<string, Set<string>>()

      // First check the requested data type
      let entries = this.metadata!.filter(
        e => e.iso3c === country && e.type === dataType
      )

      // Data derivation: For yearly, also check monthly and weekly data
      if (dataType === '1') {
        const monthlyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '2'
        )
        const weeklyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '3'
        )
        entries = [...entries, ...monthlyEntries, ...weeklyEntries]
      } else if (dataType === '2') {
        // For monthly, also check weekly data
        const weeklyEntries = this.metadata!.filter(
          e => e.iso3c === country && e.type === '3'
        )
        entries = [...entries, ...weeklyEntries]
      }

      for (const entry of entries) {
        const ageGroups = entry.ageGroups.filter(ag => ag !== 'all')
        if (ageGroups.length > 0) {
          // Merge age groups if source already exists
          const existing = countryMap.get(entry.source)
          if (existing) {
            ageGroups.forEach(ag => existing.add(ag))
          } else {
            countryMap.set(entry.source, new Set(ageGroups))
          }
        }
      }
      return countryMap
    })

    // Find common sources
    const firstCountrySources = byCountry[0]
    if (!firstCountrySources) return new Map()

    const commonSources = new Map<string, string[]>()

    for (const [source, ageGroups] of firstCountrySources) {
      // Check if this source exists for all countries
      const existsInAll = byCountry.every(countryMap => countryMap.has(source))
      if (!existsInAll) continue

      // Get intersection of age groups across all countries
      let commonAgeGroups = new Set(ageGroups)
      for (const countryMap of byCountry) {
        const countryAgeGroups = countryMap.get(source)
        if (countryAgeGroups) {
          commonAgeGroups = new Set(
            [...commonAgeGroups].filter(ag => countryAgeGroups.has(ag))
          )
        }
      }

      if (commonAgeGroups.size > 0) {
        // Filter to mutually exclusive age groups (avoid double-counting)
        const filteredAgeGroups = selectMutuallyExclusiveAgeGroups(Array.from(commonAgeGroups))
        if (filteredAgeGroups.length > 0) {
          commonSources.set(source, filteredAgeGroups)
        }
      }
    }

    return commonSources
  }

  /**
   * Convert chart type to data type (1/2/3)
   */
  private chartTypeToDataType(chartType: string): '1' | '2' | '3' {
    if (['yearly', 'midyear', 'fluseason'].includes(chartType)) return '1'
    if (['monthly', 'quarterly'].includes(chartType)) return '2'
    return '3' // weekly variants
  }
}

/**
 * Parse age range from age group string.
 * Handles formats like "0-9", "80+", "85+"
 */
function parseAgeRange(ageGroup: string): { min: number, max: number } | null {
  // Handle open-ended ranges like "80+", "85+"
  const openMatch = ageGroup.match(/^(\d+)\+$/)
  if (openMatch) {
    return { min: parseInt(openMatch[1]!, 10), max: 999 }
  }

  // Handle ranges like "0-9", "10-19"
  const rangeMatch = ageGroup.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]!, 10), max: parseInt(rangeMatch[2]!, 10) }
  }

  return null
}

/**
 * Check if two age ranges overlap.
 */
function rangesOverlap(
  a: { min: number, max: number },
  b: { min: number, max: number }
): boolean {
  return a.min <= b.max && b.min <= a.max
}

/**
 * Filter age groups to select a mutually exclusive set with complete coverage.
 *
 * When multiple overlapping age group sets exist (e.g., 10-year bands vs 25-year bands),
 * select a complete set that covers from age 0 to the maximum age without gaps.
 */
function selectMutuallyExclusiveAgeGroups(ageGroups: string[]): string[] {
  // Parse all age groups
  const parsed: Array<{ name: string, range: { min: number, max: number } }> = []
  for (const ag of ageGroups) {
    const range = parseAgeRange(ag)
    if (range) {
      parsed.push({ name: ag, range })
    }
  }

  if (parsed.length === 0) return ageGroups

  // Find all possible complete coverage sets
  // A complete set starts at 0 and has no gaps between consecutive ranges

  // Sort by min age, then by max age (prefer ranges ending earlier for same start)
  const sorted = [...parsed].sort((a, b) => {
    if (a.range.min !== b.range.min) return a.range.min - b.range.min
    return a.range.max - b.range.max
  })

  // Build complete sets using dynamic programming approach
  // For each starting point (must be 0), find all valid paths to max age
  const findCompleteSets = (): string[][] => {
    const sets: string[][] = []

    // Recursive helper to build sets
    const buildSet = (currentMax: number, currentSet: string[], usedRanges: Set<string>): void => {
      // Find ranges that can extend from currentMax
      const candidates = sorted.filter(item =>
        !usedRanges.has(item.name)
        && item.range.min === currentMax + 1 // Must start exactly where previous ended
      )

      if (candidates.length === 0) {
        // No more candidates - check if we have an open-ended range (999 = infinity)
        const hasOpenEnd = currentSet.some((name) => {
          const p = parsed.find(x => x.name === name)
          return p && p.range.max === 999
        })
        if (hasOpenEnd && currentSet.length >= 2) {
          sets.push([...currentSet])
        }
        return
      }

      for (const candidate of candidates) {
        const newSet = [...currentSet, candidate.name]
        const newUsed = new Set(usedRanges)
        newUsed.add(candidate.name)

        if (candidate.range.max === 999) {
          // This is an open-ended range - we've completed a set
          sets.push(newSet)
        } else {
          // Continue building
          buildSet(candidate.range.max, newSet, newUsed)
        }
      }
    }

    // Start with ranges beginning at 0
    const startersAt0 = sorted.filter(item => item.range.min === 0)
    for (const starter of startersAt0) {
      const usedRanges = new Set([starter.name])
      if (starter.range.max === 999) {
        // Single range covering everything (unlikely but possible)
        sets.push([starter.name])
      } else {
        buildSet(starter.range.max, [starter.name], usedRanges)
      }
    }

    return sets
  }

  const completeSets = findCompleteSets()

  if (completeSets.length === 0) {
    // Fallback: no complete sets found, use greedy approach
    console.warn('[MetadataService] No complete age group coverage found, using greedy selection')
    const result: string[] = []
    const sortedByMin = [...parsed].sort((a, b) => a.range.min - b.range.min)
    for (const item of sortedByMin) {
      const overlapsSelected = result.some((selected) => {
        const selectedParsed = parsed.find(p => p.name === selected)
        return selectedParsed && rangesOverlap(item.range, selectedParsed.range)
      })
      if (!overlapsSelected) {
        result.push(item.name)
      }
    }
    return result
  }

  // Choose the set with the most groups (finest granularity)
  completeSets.sort((a, b) => b.length - a.length)
  const best = completeSets[0]!

  console.log('[MetadataService] Selected complete age group set:', best, 'from', completeSets.length, 'candidates')
  return best
}

// Singleton instance
export const metadataService = new MetadataService()
