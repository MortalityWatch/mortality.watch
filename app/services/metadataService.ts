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
   * Convert chart type to data type (1/2/3)
   */
  private chartTypeToDataType(chartType: string): '1' | '2' | '3' {
    if (['yearly', 'midyear', 'fluseason'].includes(chartType)) return '1'
    if (['monthly', 'quarterly'].includes(chartType)) return '2'
    return '3' // weekly variants
  }
}

// Singleton instance
export const metadataService = new MetadataService()
