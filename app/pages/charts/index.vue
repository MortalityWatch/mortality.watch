<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Chart Gallery
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Explore published mortality visualizations from our community
      </p>
    </div>

    <!-- Filters and Sort -->
    <ChartsFiltersChartFilters
      v-model:sort-by="sortBy"
      v-model:filter-type="filterType"
      v-model:filter-featured="filterFeatured"
    />

    <!-- Loading State -->
    <LoadingSpinner
      v-if="pending"
      text="Loading charts..."
      size="lg"
      height="h-64"
    />

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Error loading charts"
      :description="error.message"
    />

    <!-- Charts Grid -->
    <div
      v-else-if="charts && charts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <ChartsChartCard
        v-for="chart in charts"
        :key="chart.id"
        :chart="chart"
        variant="gallery"
        :is-owner="isOwner(chart)"
        :is-admin="isAdmin"
        :is-toggling-featured="togglingFeatured === chart.id"
        :is-toggling-public="togglingPublic === chart.id"
        :is-clearing-cache="clearingCache === chart.id"
        @delete="deleteChart"
        @toggle-featured="handleToggleFeatured"
        @toggle-public="handleTogglePublic"
        @clear-cache="handleClearCache"
      />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!pending">
      <div class="text-center py-12">
        <Icon
          name="i-lucide-inbox"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No charts found
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Try adjusting your filters or check back later
        </p>
      </div>
    </UCard>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.total > pagination.limit"
      class="mt-8 flex justify-center"
    >
      <UPagination
        v-model="currentPage"
        :total="pagination.total"
        :page-count="pagination.limit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { handleApiError } from '@/lib/errors/errorHandler'

const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')

interface Chart {
  id: number
  name: string
  description: string | null
  slug: string | null
  chartType: 'explorer' | 'ranking'
  chartConfig: string // Query string (e.g., "c=SWE&c=DEU&ct=yearly")
  thumbnailUrl: string | null
  isFeatured: boolean
  isPublic: boolean
  viewCount: number
  createdAt: number
  updatedAt: number
  authorName: string
  userId: number
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// Page meta
definePageMeta({
  title: 'Chart Gallery',
  description: 'Explore published mortality visualizations from our community'
})

useSeoMeta({
  title: 'Chart Gallery',
  description: 'Explore published mortality visualizations from our community. Browse charts by type, popularity, or featured selections.',
  ogTitle: 'Chart Gallery - Mortality Watch',
  ogDescription: 'Explore published mortality visualizations from our community.',
  ogImage: '/og-image.png'
})

// Use shared filter composable
const {
  sortBy,
  filterType,
  filterFeatured,
  currentPage,
  queryParams
} = useChartFilters()

// Fetch charts
const { data, pending, error, refresh } = await useFetch<{
  charts: Chart[]
  pagination: Pagination
}>('/api/charts', {
  query: queryParams,
  watch: [queryParams]
})

const charts = computed(() => data.value?.charts || [])
const pagination = computed(() => data.value?.pagination)

// Check if current user owns a chart
function isOwner(chart: Chart) {
  return user.value?.id === chart.userId
}

// Use shared admin composable
const {
  togglingFeatured,
  togglingPublic,
  clearingCache,
  toggleFeatured: toggleFeaturedStatus,
  togglePublic: togglePublicStatus,
  clearCache: clearCacheStatus
} = useChartAdmin()

async function handleToggleFeatured(chartId: number, newValue: boolean) {
  await toggleFeaturedStatus(chartId, newValue)
  await refresh()
}

async function handleTogglePublic(chartId: number, newValue: boolean) {
  await togglePublicStatus(chartId, newValue)
  await refresh()
}

async function handleClearCache(chartId: number) {
  await clearCacheStatus(chartId)
}

// Delete chart (admin only in gallery)
async function deleteChart(chartId: number) {
  if (!isAdmin.value) return

  if (!confirm('Are you sure you want to delete this chart?')) {
    return
  }

  try {
    await $fetch(`/api/charts/${chartId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (err) {
    handleApiError(err, 'delete chart', 'deleteChart')
  }
}

// Page head
useHead({
  title: 'Chart Gallery',
  meta: [
    {
      name: 'description',
      content: 'Explore published mortality visualizations from our community'
    }
  ]
})
</script>
