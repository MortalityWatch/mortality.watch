<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

useSeoMeta({
  title: 'Data Quality - Admin Dashboard',
  description: 'Monitor data freshness and quality'
})

interface CountryQuality {
  iso3c: string
  jurisdiction: string
  lastUpdate: string
  lastUpdateTimestamp: number
  daysSinceUpdate: number
  status: 'fresh' | 'warning' | 'stale'
  dataSource: string
  type: string
  ageGroups: string
  minDate: string
}

interface DataQualityReport {
  success: boolean
  timestamp: string
  summary: {
    total: number
    fresh: number
    warning: number
    stale: number
    averageDaysSinceUpdate: number
    mostStaleCountry: {
      iso3c: string
      jurisdiction: string
      daysSinceUpdate: number
    } | null
    mostRecentUpdate: number
  }
  countries: CountryQuality[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const report = ref<DataQualityReport | null>(null)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'fresh' | 'warning' | 'stale'>('all')
const sortBy = ref<'staleness' | 'alphabetical'>('staleness')
const triggeringUpdate = ref(false)
const checkingStaleness = ref(false)

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

// Filter and sort countries
const filteredCountries = computed(() => {
  if (!report.value) return []

  let countries = report.value.countries

  // Apply status filter
  if (statusFilter.value !== 'all') {
    countries = countries.filter(c => c.status === statusFilter.value)
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

  // Apply sorting
  if (sortBy.value === 'alphabetical') {
    countries = [...countries].sort((a, b) =>
      a.jurisdiction.localeCompare(b.jurisdiction)
    )
  } else {
    // Already sorted by staleness from API
    countries = [...countries]
  }

  return countries
})

// Status badge styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'fresh':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900'
    case 'stale':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900'
  }
}

// Trigger manual update (calls external cron API if available)
const triggerManualUpdate = async () => {
  triggeringUpdate.value = true
  try {
    // This would call an external cron.mortality.watch API
    // For now, we'll just show a message
    const cronUrl = 'https://cron.mortality.watch/api/trigger-update'

    try {
      const response = await fetch(cronUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        alert('Manual update triggered successfully. Data will be updated shortly.')
      } else {
        throw new Error('Failed to trigger update')
      }
    } catch {
      // Fallback message if cron API is not available
      alert(
        'Manual update API is not configured. Please contact system administrator to trigger data update manually.'
      )
    }

    // Refresh the report after a delay
    setTimeout(() => {
      fetchReport()
    }, 2000)
  } finally {
    triggeringUpdate.value = false
  }
}

// Check for stale data and send alerts
const checkStaleness = async () => {
  checkingStaleness.value = true
  try {
    const result = await $fetch('/api/admin/check-staleness', {
      method: 'POST'
    })

    if (result.success) {
      const message = result.staleCount === 0
        ? 'All data is fresh! No alerts sent.'
        : `Found ${result.staleCount} stale countries. Alerts sent to ${result.adminCount} admin(s).`

      alert(message)
    }
  } catch (err: unknown) {
    console.error('Error checking staleness:', err)
    alert('Failed to check data staleness. Please try again.')
  } finally {
    checkingStaleness.value = false
  }
}

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Fetch report on mount
onMounted(() => {
  fetchReport()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            Data Quality Monitor
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Monitor data freshness and quality across all countries
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-bell"
            variant="outline"
            :loading="checkingStaleness"
            :disabled="loading"
            @click="checkStaleness"
          >
            Check Staleness
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="triggeringUpdate"
            :disabled="loading"
            @click="triggerManualUpdate"
          >
            Trigger Manual Update
          </UButton>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-12"
    >
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <UCard
      v-else-if="error"
      class="mb-8"
    >
      <div class="text-red-600 dark:text-red-400">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-5 h-5 inline mr-2"
        />
        {{ error }}
      </div>
    </UCard>

    <!-- Data Quality Report -->
    <div v-else-if="report">
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ report.summary.total }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Countries
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ report.summary.fresh }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Fresh (&lt;7 days)
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {{ report.summary.warning }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Warning (7-14d)
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">
              {{ report.summary.stale }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Stale (&gt;14 days)
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ report.summary.averageDaysSinceUpdate }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Avg Days Since Update
            </p>
          </div>
        </UCard>
      </div>

      <!-- Filters and Search -->
      <UCard class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium mb-2">Search Countries</label>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search by country or ISO code..."
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">Filter by Status</label>
            <USelect
              v-model="statusFilter"
              :options="[
                { label: 'All Statuses', value: 'all' },
                { label: 'Fresh (<7 days)', value: 'fresh' },
                { label: 'Warning (7-14 days)', value: 'warning' },
                { label: 'Stale (>14 days)', value: 'stale' }
              ]"
              option-attribute="label"
              value-attribute="value"
            />
          </div>

          <!-- Sort By -->
          <div>
            <label class="block text-sm font-medium mb-2">Sort By</label>
            <USelect
              v-model="sortBy"
              :options="[
                { label: 'Staleness (Most Stale First)', value: 'staleness' },
                { label: 'Alphabetical', value: 'alphabetical' }
              ]"
              option-attribute="label"
              value-attribute="value"
            />
          </div>
        </div>
      </UCard>

      <!-- Countries Table -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Country Data Quality ({{ filteredCountries.length }} countries)
            </h2>
            <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              size="sm"
              :loading="loading"
              @click="fetchReport"
            >
              Refresh
            </UButton>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  Country
                </th>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  ISO Code
                </th>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  Last Update
                </th>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  Days Since Update
                </th>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  Status
                </th>
                <th class="text-left py-3 px-4 font-medium text-sm">
                  Data Source
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="country in filteredCountries"
                :key="country.iso3c"
                class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="py-3 px-4">
                  {{ country.jurisdiction }}
                </td>
                <td class="py-3 px-4 font-mono text-sm">
                  {{ country.iso3c }}
                </td>
                <td class="py-3 px-4 text-sm">
                  {{ formatDate(country.lastUpdate) }}
                </td>
                <td class="py-3 px-4 text-sm">
                  {{ country.daysSinceUpdate }} days
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="getStatusColor(country.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ country.status.toUpperCase() }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ country.dataSource }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div
            v-if="filteredCountries.length === 0"
            class="text-center py-12 text-gray-600 dark:text-gray-400"
          >
            <UIcon
              name="i-lucide-search-x"
              class="w-12 h-12 mx-auto mb-4 opacity-50"
            />
            <p>No countries match your filters</p>
          </div>
        </div>
      </UCard>

      <!-- Last Updated -->
      <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Report generated: {{ new Date(report.timestamp).toLocaleString() }}
      </div>
    </div>
  </div>
</template>
