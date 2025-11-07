/**
 * Ranking State Utilities
 *
 * Utilities for encoding/decoding ranking state to/from query parameters.
 * Used for server-side ranking chart rendering and OG image generation.
 */

export interface RankingState {
  periodOfTime: string
  jurisdictionType: string
  showASMR: boolean
  showTotals: boolean
  showTotalsOnly: boolean
  showRelative: boolean
  showPI: boolean
  cumulative: boolean
  hideIncomplete: boolean
  standardPopulation: string
  baselineMethod: string
  decimalPrecision: string
  dateFrom: string
  dateTo: string
  baselineDateFrom: string
  baselineDateTo: string
  sortField?: string
  sortOrder?: string
  currentPage?: number
  itemsPerPage?: number
  darkMode?: boolean
}

/**
 * Decode query parameters to ranking state
 */
export function decodeRankingState(query: Record<string, string | string[]>): RankingState {
  const getString = (key: string, defaultValue: string): string => {
    const value = query[key]
    return Array.isArray(value) ? value[0] || defaultValue : value || defaultValue
  }

  const getBool = (key: string, defaultValue: boolean): boolean => {
    const value = query[key]
    const stringValue = Array.isArray(value) ? value[0] : value
    if (stringValue === undefined || stringValue === '') return defaultValue
    return stringValue === '1' || stringValue === 'true'
  }

  const getNumber = (key: string, defaultValue: number): number => {
    const value = query[key]
    const stringValue = Array.isArray(value) ? value[0] : value
    if (!stringValue) return defaultValue
    const num = parseInt(stringValue, 10)
    return isNaN(num) ? defaultValue : num
  }

  return {
    // Period configuration
    periodOfTime: getString('p', 'yearly'),
    jurisdictionType: getString('j', 'country'),

    // Display toggles
    showASMR: getBool('a', false),
    showTotals: getBool('t', false),
    showTotalsOnly: getBool('to', false),
    showRelative: getBool('r', false),
    showPI: getBool('pi', false),
    cumulative: getBool('c', false),
    hideIncomplete: !getBool('i', true), // Inverted: 'i' means showIncomplete

    // Metric configuration
    standardPopulation: getString('sp', 'esp2013'),
    baselineMethod: getString('bm', 'lin_reg'),
    decimalPrecision: getString('dp', '1'),

    // Date range
    dateFrom: getString('df', '2020'),
    dateTo: getString('dt', '2024'),
    baselineDateFrom: getString('bf', '2015'),
    baselineDateTo: getString('bt', '2019'),

    // Sort and pagination
    sortField: getString('sortField', ''),
    sortOrder: getString('sortOrder', 'desc'),
    currentPage: getNumber('currentPage', 1),
    itemsPerPage: getNumber('itemsPerPage', 50),

    // Display mode
    darkMode: getBool('darkMode', false)
  }
}

/**
 * Encode ranking state to query parameters
 */
export function encodeRankingState(state: Partial<RankingState>): Record<string, string> {
  const query: Record<string, string> = {}

  if (state.periodOfTime !== undefined && state.periodOfTime !== 'yearly') {
    query.p = state.periodOfTime
  }
  if (state.jurisdictionType !== undefined && state.jurisdictionType !== 'country') {
    query.j = state.jurisdictionType
  }
  if (state.showASMR) query.a = '1'
  if (state.showTotals) query.t = '1'
  if (state.showTotalsOnly) query.to = '1'
  if (state.showRelative) query.r = '1'
  if (state.showPI) query.pi = '1'
  if (state.cumulative) query.c = '1'
  if (state.hideIncomplete === false) query.i = '1' // Inverted

  if (state.standardPopulation && state.standardPopulation !== 'esp2013') {
    query.sp = state.standardPopulation
  }
  if (state.baselineMethod && state.baselineMethod !== 'lin_reg') {
    query.bm = state.baselineMethod
  }
  if (state.decimalPrecision && state.decimalPrecision !== '1') {
    query.dp = state.decimalPrecision
  }

  if (state.dateFrom) query.df = state.dateFrom
  if (state.dateTo) query.dt = state.dateTo
  if (state.baselineDateFrom) query.bf = state.baselineDateFrom
  if (state.baselineDateTo) query.bt = state.baselineDateTo

  if (state.sortField) query.sortField = state.sortField
  if (state.sortOrder) query.sortOrder = state.sortOrder
  if (state.currentPage !== undefined && state.currentPage !== 1) {
    query.currentPage = String(state.currentPage)
  }
  if (state.itemsPerPage !== undefined && state.itemsPerPage !== 50) {
    query.itemsPerPage = String(state.itemsPerPage)
  }

  if (state.darkMode) query.darkMode = '1'

  return query
}
