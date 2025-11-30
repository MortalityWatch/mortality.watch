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
  if (ageGroups.length === 0 || ageGroups.includes('all')) {
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

  // Age groups (if specific, not 'all')
  if (ageGroups.length > 0 && !ageGroups.includes('all')) {
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

/**
 * Format full date for description (e.g., "January 2020" or "2020/01")
 */
function formatFullDate(date: string | undefined): string {
  if (!date) return ''

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Parse YYYY/MM format
  const match = date.match(/^(\d{4})\/(\d{2})$/)
  if (match) {
    const year = match[1]
    const monthIndex = parseInt(match[2]!, 10) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`
    }
  }

  return date
}

/**
 * Get view mode description
 */
function getViewDescription(view: 'mortality' | 'excess' | 'zscore'): string {
  switch (view) {
    case 'zscore':
      return 'Z-Score view shows how many standard deviations the current value is from the baseline mean.'
    case 'excess':
      return 'Excess view shows the difference between observed and expected (baseline) values.'
    default:
      return ''
  }
}

/**
 * Get baseline method description
 */
function getBaselineMethodDescription(method: string): string {
  switch (method) {
    case 'mean':
      return 'mean average'
    case 'median':
      return 'median'
    case 'lm':
    case 'lin_reg':
      return 'linear regression'
    default:
      return method
  }
}

/**
 * Generate detailed description for explorer charts
 * Includes all relevant chart configuration details
 */
export function generateExplorerDescription(params: {
  countries: string[]
  allCountries: Record<string, Country>
  type: string
  isExcess: boolean
  ageGroups?: string[]
  dateFrom?: string
  dateTo?: string
  view?: 'mortality' | 'excess' | 'zscore'
  chartType?: string
  showBaseline?: boolean
  baselineMethod?: string
  baselineDateFrom?: string
  baselineDateTo?: string
  cumulative?: boolean
  showPercentage?: boolean
  standardPopulation?: string
}): string {
  const {
    countries,
    allCountries,
    type,
    isExcess,
    ageGroups = [],
    dateFrom,
    dateTo,
    view,
    chartType,
    showBaseline,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    cumulative,
    showPercentage,
    standardPopulation
  } = params

  const parts: string[] = []

  // Determine effective view
  const effectiveView = view || (isExcess ? 'excess' : 'mortality')

  // Get metric info
  const typeConfig = types.find(t => t.value === type)
  const metricName = typeConfig?.name || type

  // Countries list (full names)
  const countryNames = countries
    .map(iso => allCountries[iso]?.jurisdiction || iso)
  const countriesDescription = countryNames.length === 1
    ? countryNames[0]
    : countryNames.length === 2
      ? `${countryNames[0]} and ${countryNames[1]}`
      : `${countryNames.slice(0, -1).join(', ')}, and ${countryNames[countryNames.length - 1]}`

  // Main description sentence
  parts.push(`${metricName} data for ${countriesDescription}.`)

  // Date range
  if (dateFrom && dateTo) {
    const fromStr = formatFullDate(dateFrom)
    const toStr = formatFullDate(dateTo)
    parts.push(`Data period: ${fromStr} to ${toStr}.`)
  }

  // Age groups
  if (ageGroups.length > 0 && !ageGroups.includes('all')) {
    const ageStr = ageGroups.length === 1
      ? `age group ${ageGroups[0]}`
      : `age groups: ${ageGroups.join(', ')}`
    parts.push(`Filtered to ${ageStr}.`)
  }

  // Chart type
  if (chartType) {
    const chartTypeMap: Record<string, string> = {
      weekly: 'Weekly data',
      monthly: 'Monthly data',
      yearly: 'Yearly data',
      fluseason: 'Flu season (July-June) aggregation'
    }
    if (chartTypeMap[chartType]) {
      parts.push(chartTypeMap[chartType] + '.')
    }
  }

  // View-specific info
  const viewDesc = getViewDescription(effectiveView)
  if (viewDesc) {
    parts.push(viewDesc)
  }

  // Baseline info
  if (showBaseline && baselineDateFrom && baselineDateTo) {
    const baselineFrom = formatFullDate(baselineDateFrom)
    const baselineTo = formatFullDate(baselineDateTo)
    const methodDesc = baselineMethod ? getBaselineMethodDescription(baselineMethod) : 'mean'
    parts.push(`Baseline calculated using ${methodDesc} from ${baselineFrom} to ${baselineTo}.`)
  }

  // Display options
  if (cumulative) {
    parts.push('Showing cumulative values.')
  }
  if (showPercentage) {
    parts.push('Values shown as percentage of baseline.')
  }

  // Standard population for ASMR
  if (type === 'asmr' && standardPopulation) {
    const popMap: Record<string, string> = {
      who: 'WHO World Standard',
      esp2013: 'European Standard Population 2013',
      usa2000: 'US 2000 Standard'
    }
    const popName = popMap[standardPopulation] || standardPopulation
    parts.push(`Age-standardized using ${popName}.`)
  }

  return parts.join(' ')
}
