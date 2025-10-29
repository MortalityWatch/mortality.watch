/**
 * Base fields that are always present in a table row
 */
interface TableRowBase {
  country: string
  iso2c?: string
  href: string
}

/**
 * Dynamic period columns (e.g., "2020", "Q1 2021", "TOTAL")
 * Values are numbers representing mortality data, or undefined for missing data
 */
interface TableRowDynamic {
  [periodKey: string]: number | undefined
}

/**
 * Complete table row combining fixed fields and dynamic period columns
 */
export type TableRow = TableRowBase & TableRowDynamic

export interface TableData {
  labels: string[]
  paginatedResult: TableRow[]
  sortedResult: TableRow[]
}

export interface TableDisplay {
  showTotals: boolean
  showRelative: boolean
  showPI: boolean
  totalRowKey: string
  selectedBaselineMethod: string
  decimalPrecision: string
  subtitle: string
}

export interface TableSort {
  field: string
  order: 'asc' | 'desc'
}

export interface TablePagination {
  currentPage: number
  itemsPerPage: number
  options: number[]
  totalPages: number
}

export interface TableLoading {
  isUpdating: boolean
  hasLoaded: boolean
  progress: number
  initialLoadDone: boolean
}

export interface ProcessCountryRowOptions {
  iso3c: string
  countryData: import('@/model').DatasetEntry
  dataKey: string
  range: {
    startIndex: number
    endIndex: number
  }
  dataLabels: string[]
  metaData: Record<string, import('@/model').Country>
  explorerLink: (codes: string[]) => string
  display: {
    showRelative: boolean
    cumulative: boolean
    hideIncomplete: boolean
  }
  totalRowKey: string
}
