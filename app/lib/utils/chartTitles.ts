/**
 * Chart Title Generation Utilities
 *
 * Generates user-friendly default titles for saved charts and rankings
 * based on current chart state.
 */

import type { Country } from '@/model'
import { types } from '@/model'

/**
 * Format a list of countries for display in title
 * Handles multiple countries with proper formatting
 */
function formatCountries(
  countryIsoCodes: string[],
  allCountries: Record<string, Country>,
  maxDisplay: number = 3
): string {
  if (countryIsoCodes.length === 0) return ''

  const countryNames = countryIsoCodes
    .map(iso => allCountries[iso]?.jurisdiction || iso)
    .slice(0, maxDisplay)

  if (countryIsoCodes.length <= maxDisplay) {
    if (countryNames.length === 1) return countryNames[0]!
    if (countryNames.length === 2) return countryNames.join(' vs ')
    return countryNames.slice(0, -1).join(', ') + ' & ' + countryNames[countryNames.length - 1]
  }

  // More than maxDisplay countries
  return `${countryNames.join(', ')} +${countryIsoCodes.length - maxDisplay} more`
}

/**
 * Format age groups for display in title
 */
function formatAgeGroups(ageGroups: string[]): string {
  if (ageGroups.length === 0 || ageGroups.includes('TOTAL')) {
    return 'All Ages'
  }

  if (ageGroups.length === 1) {
    return ageGroups[0]!
  }

  if (ageGroups.length === 2) {
    return ageGroups.join(' & ')
  }

  return `${ageGroups.length} Age Groups`
}

/**
 * Format date range for display in title
 */
function formatDateRange(dateFrom: string | undefined, dateTo: string | undefined): string {
  if (!dateFrom || !dateTo) return ''

  // Extract years from date strings
  const yearFrom = dateFrom.substring(0, 4)
  const yearTo = dateTo.substring(0, 4)

  if (yearFrom === yearTo) {
    return yearFrom
  }

  return `${yearFrom}-${yearTo}`
}

/**
 * Get readable metric name from type value with view mode
 */
function getMetricName(type: string, view?: 'mortality' | 'excess' | 'zscore'): string {
  const typeConfig = types.find(t => t.value === type)
  if (!typeConfig) return type

  const baseName = typeConfig.name.replace(/\s*\([^)]*\)/g, '') // Remove abbreviations in parentheses

  // Z-Score view: prefix with "Z-Score "
  if (view === 'zscore') {
    return `Z-Score ${baseName}`
  }

  // Excess view: prefix with "Excess " (except for LE and population)
  if (view === 'excess' && type !== 'le' && type !== 'population') {
    return `Excess ${baseName}`
  }

  // Mortality view or undefined: no prefix
  return baseName
}

/**
 * Generate default title for ranking charts
 * Format: {countries} - {ageGroup} - {dateRange}
 * Example: "USA vs GBR - All Ages - 2020-2023"
 */
export function generateRankingTitle(params: {
  jurisdictionType?: string
  dateFrom?: string
  dateTo?: string
  showASMR?: boolean
  showTotalsOnly?: boolean
}): string {
  const {
    jurisdictionType = 'countries',
    dateFrom,
    dateTo,
    showASMR = false,
    showTotalsOnly = false
  } = params

  const parts: string[] = []

  // Jurisdiction type
  if (jurisdictionType !== 'countries') {
    const jurisdictionMap: Record<string, string> = {
      countries_states: 'Countries & States',
      usa: 'US States',
      can: 'Canadian Provinces',
      eu27: 'EU27',
      deu: 'German States',
      af: 'Africa',
      as: 'Asia',
      eu: 'Europe',
      na: 'North America',
      oc: 'Oceania',
      sa: 'South America'
    }
    parts.push(jurisdictionMap[jurisdictionType] || jurisdictionType)
  } else {
    parts.push('Ranking')
  }

  // Age group (implicit from ASMR vs CMR)
  if (!showTotalsOnly) {
    parts.push(showASMR ? 'ASMR' : 'CMR')
  }

  // Date range
  const dateRange = formatDateRange(dateFrom, dateTo)
  if (dateRange) {
    parts.push(dateRange)
  }

  return parts.filter(Boolean).join(' - ')
}

/**
 * Generate default title for explorer charts
 * Format: {metric} - {countries} - {dateRange}
 * Example: "Total Deaths - USA - 2020-2023"
 */
export function generateExplorerTitle(params: {
  countries: string[]
  allCountries: Record<string, Country>
  type: string
  isExcess: boolean
  ageGroups?: string[]
  dateFrom?: string
  dateTo?: string
  view?: 'mortality' | 'excess' | 'zscore'
}): string {
  const {
    countries,
    allCountries,
    type,
    isExcess,
    ageGroups = [],
    dateFrom,
    dateTo,
    view
  } = params

  const parts: string[] = []

  // Determine view mode if not explicitly provided
  const effectiveView = view || (isExcess ? 'excess' : 'mortality')

  // Metric name
  parts.push(getMetricName(type, effectiveView))

  // Countries
  const countriesStr = formatCountries(countries, allCountries, 3)
  if (countriesStr) {
    parts.push(countriesStr)
  }

  // Age groups (if specific)
  if (ageGroups.length > 0 && !ageGroups.includes('TOTAL')) {
    const ageGroupStr = formatAgeGroups(ageGroups)
    if (ageGroupStr !== 'All Ages') {
      parts.push(ageGroupStr)
    }
  }

  // Date range
  const dateRange = formatDateRange(dateFrom, dateTo)
  if (dateRange) {
    parts.push(dateRange)
  }

  return parts.filter(Boolean).join(' - ')
}
