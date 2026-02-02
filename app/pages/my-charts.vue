<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        My Charts
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        View, edit, and manage your saved charts and rankings
      </p>
    </div>

    <!-- Filters and Sort -->
    <ChartsFiltersChartFilters
      v-if="charts && charts.length > 0"
      v-model:sort-by="sortBy"
      v-model:filter-type="filterType"
      v-model:filter-featured="filterFeatured"
    />

    <!-- Loading State -->
    <LoadingSpinner
      v-if="pending"
      text="Loading your charts..."
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
      v-else-if="filteredCharts && filteredCharts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <ChartsChartCard
        v-for="chart in paginatedCharts"
        :key="chart.id"
        :chart="chart"
        variant="my-charts"
        :is-owner="true"
        :is-admin="isAdmin"
        :is-toggling-featured="togglingFeatured === chart.id"
        :is-toggling-public="togglingPublic === chart.id"
        :is-clearing-cache="clearingCache === chart.id"
        @delete="deleteChart"
        @edit="openEditModal"
        @toggle-featured="handleToggleFeatured"
        @toggle-public="handleTogglePublic"
        @clear-cache="handleClearCache"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="filteredCharts && filteredCharts.length > UI_CONFIG.CHARTS_PER_PAGE"
      class="mt-8 flex justify-center"
    >
      <UPagination
        v-model="currentPage"
        :total="filteredCharts.length"
        :page-count="UI_CONFIG.CHARTS_PER_PAGE"
      />
    </div>

    <!-- No Results (Filtered) -->
    <UCard v-else-if="charts && charts.length > 0 && filteredCharts && filteredCharts.length === 0">
      <div class="text-center py-16 px-4">
        <UIcon
          name="i-lucide-search-x"
          class="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-6"
        />
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          No charts match your filters
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Try adjusting your filter settings to see more results.
        </p>
      </div>
    </UCard>

    <!-- Empty State (No Charts) -->
    <UCard v-else-if="!pending && (!charts || charts.length === 0)">
      <div class="text-center py-16 px-4">
        <UIcon
          name="i-lucide-bar-chart-3"
          class="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-6"
        />
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          You haven't saved any charts yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Explore mortality data, create custom visualizations, and save your favorite charts for quick access later.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/explorer"
            color="primary"
            size="lg"
            icon="i-lucide-line-chart"
          >
            Create Your First Chart
          </UButton>
          <UButton
            to="/ranking"
            variant="outline"
            size="lg"
            icon="i-lucide-trending-up"
          >
            View Rankings
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Edit Chart Modal -->
    <SaveModal
      v-model="showEditModal"
      :saving="isSavingEdit"
      :name="editName"
      :description="editDescription"
      :is-public="editIsPublic"
      :error="editError"
      :success="false"
      hide-button
      edit-mode
      @update:name="editName = $event"
      @update:description="editDescription = $event"
      @update:is-public="editIsPublic = $event"
      @update-existing="saveEdit"
    />
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
  isPublic?: boolean
  viewCount: number
  createdAt: number | string | Date
  updatedAt: number | string | Date
  authorName: string
}

// Page meta
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'My Charts',
  description: 'View, edit, and manage your saved mortality charts and rankings. Access all your saved visualizations in one place.'
})

// Import constants
const { UI_CONFIG } = await import('@/lib/config/constants')

// Use shared filter composable
const {
  sortBy,
  filterType,
  filterFeatured,
  currentPage
} = useChartFilters()

// Fetch user's charts (filtered by userId on the backend)
const { data, pending, error, refresh } = await useFetch<{
  charts: Chart[]
}>('/api/charts', {
  query: {
    userId: user.value?.id,
    limit: 100
  }
})

const charts = computed(() => data.value?.charts || [])

// Apply client-side filtering and sorting
const filteredCharts = computed(() => {
  let result = [...charts.value]

  // Filter by chart type
  if (filterType.value) {
    result = result.filter(chart => chart.chartType === filterType.value)
  }

  // Filter by featured status
  if (filterFeatured.value === 'true') {
    result = result.filter(chart => chart.isFeatured)
  } else if (filterFeatured.value === 'false') {
    result = result.filter(chart => !chart.isFeatured)
  }

  // Sort
  if (sortBy.value === 'featured') {
    result.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return b.viewCount - a.viewCount
    })
  } else if (sortBy.value === 'views') {
    result.sort((a, b) => b.viewCount - a.viewCount)
  } else if (sortBy.value === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return result
})

// Paginate filtered results
const paginatedCharts = computed(() => {
  const start = (currentPage.value - 1) * UI_CONFIG.CHARTS_PER_PAGE
  const end = start + UI_CONFIG.CHARTS_PER_PAGE
  return filteredCharts.value.slice(start, end)
})

// Delete chart
async function deleteChart(chartId: number) {
  if (!confirm('Are you sure you want to delete this chart?')) {
    return
  }

  try {
    await $fetch(`/api/charts/${chartId}`, {
      method: 'DELETE'
    })

    // Refresh the list
    await refresh()
  } catch (err) {
    handleApiError(err, 'delete chart', 'deleteChart')
  }
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

// Edit chart modal state
const showEditModal = ref(false)
const editingChartId = ref<number | null>(null)
const editName = ref('')
const editDescription = ref('')
const editIsPublic = ref(false)
const editError = ref<string | null>(null)
const isSavingEdit = ref(false)

function openEditModal(chart: Chart) {
  editingChartId.value = chart.id
  editName.value = chart.name
  editDescription.value = chart.description || ''
  editIsPublic.value = chart.isPublic ?? false
  editError.value = null
  showEditModal.value = true
}

async function saveEdit() {
  if (!editingChartId.value) return

  if (!editName.value.trim()) {
    editError.value = 'Chart name is required'
    return
  }

  isSavingEdit.value = true
  editError.value = null

  try {
    await $fetch(`/api/charts/${editingChartId.value}`, {
      method: 'PATCH',
      body: {
        name: editName.value.trim(),
        description: editDescription.value.trim() || null,
        isPublic: editIsPublic.value
      }
    })

    showEditModal.value = false
    await refresh()
  } catch (err) {
    handleApiError(err, 'update chart', 'saveEdit')
    editError.value = err instanceof Error ? err.message : 'Failed to update chart'
  } finally {
    isSavingEdit.value = false
  }
}
</script>
