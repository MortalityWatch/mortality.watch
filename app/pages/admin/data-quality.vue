<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import { getSourceDescription } from '~/lib/data/utils'
import { usePagination } from '~/composables/usePagination'
import { UI_CONFIG } from '~/lib/config/constants'

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
  status: 'fresh' | 'stale'
  overrideStatus: 'monitor' | 'muted' | 'hidden'
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

const loading = ref(true)
const error = ref<string | null>(null)
const report = ref<DataQualityReport | null>(null)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'fresh' | 'stale'>('all')
const sourceFilter = ref<string>('all')
const showMuted = ref(true)
const showHidden = ref(false)

// Status filter options
const statusOptions = [
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
const updateOverrideStatus = async (country: CountryQuality, newStatus: 'monitor' | 'muted' | 'hidden') => {
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

// Cycle through override statuses: monitor -> muted -> hidden -> monitor
const cycleOverrideStatus = (country: CountryQuality) => {
  let nextStatus: 'monitor' | 'muted' | 'hidden'

  switch (country.overrideStatus) {
    case 'monitor':
      nextStatus = 'muted'
      break
    case 'muted':
      nextStatus = 'hidden'
      break
    case 'hidden':
      nextStatus = 'monitor'
      break
  }

  updateOverrideStatus(country, nextStatus)
}

// Cycle override status for all sources in a jurisdiction
const cycleJurisdictionOverride = (jurisdiction: string) => {
  const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)

  if (entries.length === 0) return

  // Determine the most common current status
  const statusCounts = {
    monitor: entries.filter(e => e.overrideStatus === 'monitor').length,
    muted: entries.filter(e => e.overrideStatus === 'muted').length,
    hidden: entries.filter(e => e.overrideStatus === 'hidden').length
  }

  // Find the most common status
  let currentStatus: 'monitor' | 'muted' | 'hidden' = 'monitor'
  let maxCount = statusCounts.monitor

  if (statusCounts.muted > maxCount) {
    currentStatus = 'muted'
    maxCount = statusCounts.muted
  }
  if (statusCounts.hidden > maxCount) {
    currentStatus = 'hidden'
  }

  // Determine next status
  let nextStatus: 'monitor' | 'muted' | 'hidden'

  switch (currentStatus) {
    case 'monitor':
      nextStatus = 'muted'
      break
    case 'muted':
      nextStatus = 'hidden'
      break
    case 'hidden':
      nextStatus = 'monitor'
      break
  }

  // Apply to all entries
  entries.forEach((entry) => {
    updateOverrideStatus(entry, nextStatus)
  })
}

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

// Pagination
const pagination = usePagination({ items: filteredCountries, itemsPerPage: 25 })
const { currentPage, paginatedItems, total, startIndex, endIndex, itemsPerPage } = pagination

// Items per page options
const itemsPerPageOptionsRaw = [...UI_CONFIG.PAGINATION_OPTIONS]
const itemsPerPageOptions = computed(() =>
  itemsPerPageOptionsRaw.map(x => ({ label: String(x), value: x }))
)

const selectedItemsPerPage = computed(() =>
  itemsPerPageOptions.value.find(x => x.value === itemsPerPage.value) || itemsPerPageOptions.value[1]
)

const handleItemsPerPageChange = (val: { value: number } | number) => {
  const newValue = typeof val === 'number' ? val : val.value
  itemsPerPage.value = newValue
  currentPage.value = 1
}

// Table columns configuration
const columns: TableColumn<CountryQuality>[] = [
  {
    id: 'country',
    header: 'Country'
  },
  {
    accessorKey: 'jurisdiction',
    header: 'Jurisdiction'
  },
  {
    id: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'dataSource',
    header: 'Data Source',
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        const count = row.getValue('dataSource') as number
        return `${count} source${count === 1 ? '' : 's'}`
      }
      return getReadableSourceName(row.getValue('dataSource') as string)
    },
    aggregationFn: 'uniqueCount'
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    accessorKey: 'ageGroups',
    header: 'Age Groups'
  },
  {
    id: 'lastUpdate',
    header: 'Last Update'
  },
  {
    id: 'daysSince',
    header: () => h('div', { class: 'text-right' }, 'Days Since')
  },
  {
    id: 'actions',
    header: 'Monitor'
  }
]

// TanStack Table grouping options
const groupingOptions = ref<GroupingOptions>({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel()
})

// Helper to get status counts for a jurisdiction
const getStatusCounts = (jurisdiction: string) => {
  const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)
  return {
    fresh: entries.filter(e => e.status === 'fresh').length,
    stale: entries.filter(e => e.status === 'stale').length
  }
}

// Helper to get the most common override status for a jurisdiction
const getMostCommonOverrideStatus = (jurisdiction: string): 'monitor' | 'muted' | 'hidden' => {
  const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)

  if (entries.length === 0) return 'monitor'

  const statusCounts = {
    monitor: entries.filter(e => e.overrideStatus === 'monitor').length,
    muted: entries.filter(e => e.overrideStatus === 'muted').length,
    hidden: entries.filter(e => e.overrideStatus === 'hidden').length
  }

  let currentStatus: 'monitor' | 'muted' | 'hidden' = 'monitor'
  let maxCount = statusCounts.monitor

  if (statusCounts.muted > maxCount) {
    currentStatus = 'muted'
    maxCount = statusCounts.muted
  }
  if (statusCounts.hidden > maxCount) {
    currentStatus = 'hidden'
  }

  return currentStatus
}

// Helper to get override status icon
const getOverrideIcon = (status: 'monitor' | 'muted' | 'hidden') => {
  switch (status) {
    case 'monitor':
      return 'i-lucide-bell'
    case 'muted':
      return 'i-lucide-bell-off'
    case 'hidden':
      return 'i-lucide-eye-off'
  }
}

// Helper to get readable source name (strips HTML)
const getReadableSourceName = (source: string) => {
  const description = getSourceDescription(source)
  if (!description || description === 'unknown') {
    return source
  }
  // Strip HTML tags to get plain text
  const plainText = description.replace(/<[^>]*>/g, '').trim()
  // Remove trailing numbers and colons (like ": 1 2")
  return plainText.replace(/:\s*[\d\s]+$/, '').trim()
}

// Status badge styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'fresh':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
    case 'stale':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900'
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

// Format days since update in a readable way
const formatDaysSince = (days: number) => {
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)

  if (years > 0) {
    if (months > 0) {
      return `${years}y ${months}m`
    }
    return `${years}y`
  }
  if (months > 0) {
    return `${months}m`
  }
  return `${days}d`
}

// Watch for filter changes and reset to page 1
watch([searchQuery, statusFilter, sourceFilter, showMuted, showHidden], () => {
  currentPage.value = 1
})

// Fetch report on mount
onMounted(() => {
  fetchReport()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Breadcrumb / Navigation -->
    <div class="mb-6">
      <nav class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <NuxtLink
          to="/"
          class="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Home
        </NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <NuxtLink
          to="/sources"
          class="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Data Sources
        </NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <span class="text-gray-900 dark:text-gray-200 font-medium">Data Quality</span>
      </nav>
    </div>

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
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Staleness thresholds vary by source: UN (annual), HMD/Eurostat/World Mortality (weekly/monthly), CDC/StatCan/Destatis (monthly)
          </div>
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ report.summary.total }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Entries
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <UIcon
                name="i-lucide-check-circle"
                class="w-5 h-5 text-green-600 dark:text-green-400"
              />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fresh Data
              </p>
            </div>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ report.summary.fresh }}
            </p>
            <p
              v-if="report.summary.fresh > 0"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              median: {{ formatDaysSince(report.summary.medianFreshDays) }} old
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-5 h-5 text-red-600 dark:text-red-400"
              />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stale Data
              </p>
            </div>
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">
              {{ report.summary.stale }}
            </p>
            <p
              v-if="report.summary.stale > 0"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              median: {{ formatDaysSince(report.summary.medianStaleDays) }} old
            </p>
          </div>
        </UCard>
      </div>

      <!-- Filters and Search -->
      <UCard class="mb-6">
        <div class="flex flex-col gap-3 sm:flex-row">
          <!-- Search -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex-1 min-w-[250px]">
            <label class="text-sm font-medium whitespace-nowrap">Search</label>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Country or ISO code..."
              size="sm"
              class="flex-1"
              :ui="{ base: 'bg-transparent border-0' }"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex-1 min-w-[200px]">
            <label class="text-sm font-medium whitespace-nowrap">Status</label>
            <USelect
              v-model="statusFilter"
              :items="statusOptions"
              size="sm"
              class="flex-1"
            />
          </div>

          <!-- Source Filter -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex-1 min-w-[200px]">
            <label class="text-sm font-medium whitespace-nowrap">Source</label>
            <USelect
              v-model="sourceFilter"
              :items="sourceOptions"
              size="sm"
              class="flex-1"
            />
          </div>
        </div>
      </UCard>

      <!-- Countries Table with Grouping -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Country Data Quality ({{ total }} entries)
            </h2>
            <div class="flex items-center gap-4">
              <UCheckbox
                v-model="showMuted"
                label="Show muted"
              />
              <UCheckbox
                v-model="showHidden"
                label="Show hidden"
              />
            </div>
          </div>
        </template>

        <UTable
          :data="paginatedItems"
          :columns="columns"
          :grouping="['jurisdiction']"
          :grouping-options="groupingOptions"
          :ui="{
            root: 'min-w-full',
            td: 'empty:p-0'
          }"
        >
          <template #country-cell="{ row }">
            <div
              v-if="row.getIsGrouped()"
              class="flex items-center gap-2"
            >
              <UButton
                variant="outline"
                color="neutral"
                size="xs"
                :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                @click="row.toggleExpanded()"
              />
              <strong>{{ row.original.jurisdiction }}</strong>
              <span class="font-mono text-xs text-gray-600 dark:text-gray-400">
                {{ row.original.iso3c }}
              </span>
              <UButton
                :icon="getOverrideIcon(getMostCommonOverrideStatus(row.original.jurisdiction))"
                size="xs"
                :color="getMostCommonOverrideStatus(row.original.jurisdiction) === 'monitor' ? 'primary' : 'neutral'"
                variant="ghost"
                @click="cycleJurisdictionOverride(row.original.jurisdiction)"
              />
              <span
                v-if="getMostCommonOverrideStatus(row.original.jurisdiction) !== 'monitor'"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                {{ getMostCommonOverrideStatus(row.original.jurisdiction) }}
              </span>
            </div>
          </template>

          <template #status-cell="{ row }">
            <div v-if="row.getIsGrouped()">
              <div class="flex gap-2 text-xs">
                <span
                  v-if="getStatusCounts(row.original.jurisdiction).fresh > 0"
                  class="text-green-600 dark:text-green-400"
                >
                  {{ getStatusCounts(row.original.jurisdiction).fresh }} fresh
                </span>
                <span
                  v-if="getStatusCounts(row.original.jurisdiction).stale > 0"
                  class="text-red-600 dark:text-red-400"
                >
                  {{ getStatusCounts(row.original.jurisdiction).stale }} stale
                </span>
              </div>
            </div>
            <span
              v-else
              :class="getStatusColor(row.original.status)"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
            >
              {{ row.original.status }}
            </span>
          </template>

          <template #lastUpdate-cell="{ row }">
            <span v-if="!row.getIsGrouped()">
              {{ formatDate(row.original.lastUpdate) }}
            </span>
          </template>

          <template #daysSince-cell="{ row }">
            <div
              v-if="row.getIsGrouped()"
              class="text-right text-xs text-gray-600 dark:text-gray-400"
            >
              Most stale: {{ formatDaysSince(Math.max(...filteredCountries.filter(c => c.jurisdiction === row.original.jurisdiction).map(c => c.daysSinceUpdate))) }}
            </div>
            <div
              v-else
              class="text-right"
            >
              {{ formatDaysSince(row.original.daysSinceUpdate) }}
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div
              v-if="!row.getIsGrouped()"
              class="flex items-center gap-1"
            >
              <UButton
                :icon="getOverrideIcon(row.original.overrideStatus)"
                size="xs"
                :color="row.original.overrideStatus === 'monitor' ? 'primary' : 'neutral'"
                variant="ghost"
                @click="cycleOverrideStatus(row.original)"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ row.original.overrideStatus === 'monitor' ? '' : row.original.overrideStatus }}
              </span>
            </div>
          </template>
        </UTable>

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

        <!-- Pagination Controls -->
        <div
          v-if="total > 0"
          class="mt-4 flex justify-between items-center gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ startIndex }} to {{ endIndex }} of {{ total }} entries
            </div>
            <USelectMenu
              :model-value="selectedItemsPerPage"
              :items="itemsPerPageOptions"
              size="xs"
              class="w-20"
              @update:model-value="handleItemsPerPageChange"
            />
          </div>
          <UPagination
            v-if="total > itemsPerPage"
            v-model:page="currentPage"
            :total="total"
            :items-per-page="itemsPerPage"
          />
        </div>
      </UCard>

      <!-- Last Updated -->
      <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Report generated: {{ new Date(report.timestamp).toLocaleString() }}
      </div>
    </div>
  </div>
</template>
