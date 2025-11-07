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
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <USelectMenu
        v-model="sortBy"
        :options="sortOptions"
        placeholder="Sort by"
        class="w-full sm:w-48"
      />
      <USelectMenu
        v-model="filterType"
        :options="typeOptions"
        placeholder="Chart type"
        class="w-full sm:w-48"
      />
      <USelectMenu
        v-model="filterFeatured"
        :options="featuredOptions"
        placeholder="All charts"
        class="w-full sm:w-48"
      />
    </div>

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
        :show-admin-toggle="isAdmin"
        :is-toggling="togglingFeatured === chart.id"
        @toggle-featured="toggleFeatured"
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
          No public charts yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ hasFilters ? 'Try adjusting your filters or create your own chart to share with the community' : 'Be the first to share a chart! Create a chart and make it public to appear in the gallery.' }}
        </p>
        <div class="flex gap-3 justify-center">
          <UButton
            to="/explorer"
            color="primary"
            variant="solid"
          >
            Create Explorer Chart
          </UButton>
          <UButton
            to="/ranking"
            color="primary"
            variant="outline"
          >
            Create Ranking Chart
          </UButton>
        </div>
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
  chartState: string
  thumbnailUrl: string | null
  isFeatured: boolean
  viewCount: number
  createdAt: number
  updatedAt: number
  authorName: string
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

// Filters and sorting
const sortBy = ref('featured')
const filterType = ref<string | null>(null)
const filterFeatured = ref<string | null>(null)
const currentPage = ref(1)

const sortOptions = [
  { label: 'Featured First', value: 'featured' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Newest', value: 'newest' }
]

const typeOptions = [
  { label: 'All Types', value: null },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Ranking', value: 'ranking' }
]

const featuredOptions = [
  { label: 'All Charts', value: null },
  { label: 'Featured Only', value: 'true' },
  { label: 'Not Featured', value: 'false' }
]

// Computed query params
const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    sort: sortBy.value,
    limit: 12,
    offset: (currentPage.value - 1) * 12
  }

  if (filterType.value) {
    params.chartType = filterType.value
  }

  if (filterFeatured.value) {
    params.featured = filterFeatured.value
  }

  return params
})

// Fetch charts
const { data, pending, error } = await useFetch<{
  charts: Chart[]
  pagination: Pagination
}>('/api/charts', {
  query: queryParams,
  watch: [queryParams]
})

const charts = computed(() => data.value?.charts || [])
const pagination = computed(() => data.value?.pagination)

// Check if any filters are active
const hasFilters = computed(() => {
  return filterType.value !== null || filterFeatured.value !== null
})

// Reset page when filters change
watch([sortBy, filterType, filterFeatured], () => {
  currentPage.value = 1
})

// Admin: Toggle featured status
const togglingFeatured = ref<number | null>(null)

async function toggleFeatured(chartId: number, newValue: boolean) {
  togglingFeatured.value = chartId
  try {
    await $fetch(`/api/admin/charts/${chartId}/featured`, {
      method: 'PATCH',
      body: { isFeatured: newValue }
    })

    // Update local state
    const chart = charts.value.find(c => c.id === chartId)
    if (chart) {
      chart.isFeatured = newValue
    }
  } catch (err) {
    handleApiError(err, 'update featured status', 'toggleFeatured')
  } finally {
    togglingFeatured.value = null
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
