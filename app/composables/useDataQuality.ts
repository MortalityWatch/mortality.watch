import { ref, computed } from 'vue'

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

export const useDataQuality = () => {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const report = ref<DataQualityReport | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<'all' | 'fresh' | 'stale'>('all')
  const sourceFilter = ref<string>('all')
  const showMuted = ref(true)
  const showHidden = ref(false)

  // Fetch data quality report
  const fetchReport = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<DataQualityReport>('/api/admin/data-quality')
      report.value = data
    } catch (err: unknown) {
      console.error('Error fetching data quality report:', err)
      error.value = (err as Error).message || 'Failed to fetch data quality report'
    } finally {
      loading.value = false
    }
  }

  // Update override status
  const updateOverrideStatus = async (
    country: CountryQuality,
    newStatus: 'monitor' | 'muted' | 'hidden'
  ) => {
    try {
      await $fetch('/api/admin/data-quality-override', {
        method: 'POST',
        body: {
          iso3c: country.iso3c,
          source: country.dataSource,
          status: newStatus
        }
      })

      // Update local state
      country.overrideStatus = newStatus

      // Show toast notification
      useToast().add({
        title: 'Override updated',
        description: `${country.jurisdiction} (${country.dataSource}) is now ${newStatus}`,
        color: 'success'
      })
    } catch (err) {
      console.error('Failed to update override:', err)
      useToast().add({
        title: 'Error',
        description: 'Failed to update override status',
        color: 'error'
      })
    }
  }

  // Get unique sources for filtering
  const uniqueSources = computed(() => {
    if (!report.value) return []
    const sources = new Set(report.value.countries.map(c => c.dataSource))
    return Array.from(sources).sort()
  })

  // Filter countries
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

  return {
    loading,
    error,
    report,
    searchQuery,
    statusFilter,
    sourceFilter,
    showMuted,
    showHidden,
    uniqueSources,
    filteredCountries,
    fetchReport,
    updateOverrideStatus
  }
}
