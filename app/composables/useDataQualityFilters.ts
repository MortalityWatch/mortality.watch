/**
 * Data Quality Filters Composable
 *
 * Data quality page composable
 *
 * Provides:
 * - Search query management
 * - Status filtering (fresh/stale/all)
 * - Source filtering
 * - Override visibility filters (show muted/hidden)
 * - Filtered data computation
 *
 * This separates filtering concerns from the page component,
 * making the code more modular and testable.
 */

import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { getSourceDescription } from '@/lib/data/utils'

export interface CountryQuality {
  iso3c: string
  jurisdiction: string
  lastUpdate: string
  lastUpdateTimestamp: number
  daysSinceUpdate: number
  status: 'fresh' | 'stale'
  overrideStatus: 'monitor' | 'muted' | 'hidden'
  dataSource: string
  type: string
  ageGroups: string
  minDate: string
}

export interface DataQualityReport {
  success: boolean
  timestamp: string
  summary: {
    total: number
    fresh: number
    stale: number
    medianFreshDays: number
    medianStaleDays: number
    mostStaleCountry: {
      iso3c: string
      jurisdiction: string
      daysSinceUpdate: number
    } | null
    mostRecentUpdate: number
  }
  countries: CountryQuality[]
}

export interface FilterOptions {
  label: string
  value: string
}

export function useDataQualityFilters(
  report: Ref<DataQualityReport | null>,
  onFilterChange?: () => void
) {
  // Filter state
  const searchQuery = ref('')
  const statusFilter = ref<'all' | 'fresh' | 'stale'>('all')
  const sourceFilter = ref<string>('all')
  const showMuted = ref(true)
  const showHidden = ref(false)

  // Status filter options
  const statusOptions: FilterOptions[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Fresh', value: 'fresh' },
    { label: 'Stale', value: 'stale' }
  ]

  // Get unique sources for filtering
  const uniqueSources = computed(() => {
    if (!report.value) return []
    const sources = new Set(report.value.countries.map(c => c.dataSource))
    return Array.from(sources).sort()
  })

  // Source filter options
  const sourceOptions = computed(() => {
    return [
      { label: 'All Sources', value: 'all' },
      ...uniqueSources.value.map(source => ({
        label: getReadableSourceName(source),
        value: source
      }))
    ]
  })

  // Helper to get readable source name (strips HTML)
  const getReadableSourceName = (source: string): string => {
    const description = getSourceDescription(source)
    if (!description || description === 'unknown') {
      return source
    }
    // Strip HTML tags to get plain text
    const plainText = description.replace(/<[^>]*>/g, '').trim()
    // Remove trailing numbers and colons (like ": 1 2")
    return plainText.replace(/:\s*[\d\s]+$/, '').trim()
  }

  // Filter countries based on all filter criteria
  const filteredCountries = computed(() => {
    if (!report.value) return []

    let countries = report.value.countries

    // Apply override visibility filters
    countries = countries.filter((c) => {
      if (c.overrideStatus === 'hidden' && !showHidden.value) return false
      if (c.overrideStatus === 'muted' && !showMuted.value) return false
      return true
    })

    // Apply status filter
    if (statusFilter.value !== 'all') {
      countries = countries.filter(c => c.status === statusFilter.value)
    }

    // Apply source filter
    if (sourceFilter.value !== 'all') {
      countries = countries.filter(c => c.dataSource === sourceFilter.value)
    }

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      countries = countries.filter(
        c =>
          c.jurisdiction.toLowerCase().includes(query)
          || c.iso3c.toLowerCase().includes(query)
      )
    }

    return countries
  })

  // Watch for filter changes and call callback
  if (onFilterChange) {
    watch([searchQuery, statusFilter, sourceFilter, showMuted, showHidden], () => {
      onFilterChange()
    })
  }

  return {
    // State
    searchQuery,
    statusFilter,
    sourceFilter,
    showMuted,
    showHidden,

    // Options
    statusOptions,
    sourceOptions,
    uniqueSources,

    // Computed
    filteredCountries,

    // Helpers
    getReadableSourceName
  }
}
