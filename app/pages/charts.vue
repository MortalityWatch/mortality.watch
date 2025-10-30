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
      <UCard
        v-for="chart in charts"
        :key="chart.id"
        class="hover:shadow-lg transition-shadow"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-semibold flex-1">
              {{ chart.name }}
            </h3>
            <UBadge
              v-if="chart.isFeatured"
              color="primary"
              variant="subtle"
              size="sm"
            >
              Featured
            </UBadge>
          </div>
        </template>

        <div class="space-y-3">
          <!-- Description -->
          <p
            v-if="chart.description"
            class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
          >
            {{ chart.description }}
          </p>

          <!-- Thumbnail -->
          <div
            class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
            style="aspect-ratio: 16/9"
          >
            <NuxtLink :to="`/charts/${chart.slug}`">
              <img
                v-if="chart.thumbnailUrl"
                :src="chart.thumbnailUrl"
                :alt="chart.name"
                class="w-full h-full object-cover hover:scale-105 transition-transform"
                loading="lazy"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <Icon
                  name="i-lucide-bar-chart-2"
                  class="w-12 h-12"
                />
              </div>
            </NuxtLink>
          </div>

          <!-- Meta info -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              <Icon
                name="i-lucide-user"
                class="w-3 h-3 inline"
              />
              {{ chart.authorName }}
            </span>
            <span>
              <Icon
                name="i-lucide-eye"
                class="w-3 h-3 inline"
              />
              {{ chart.viewCount }} views
            </span>
          </div>

          <!-- Badge for chart type -->
          <UBadge
            :color="chart.chartType === 'explorer' ? 'info' : 'success'"
            variant="subtle"
            size="xs"
          >
            {{ chart.chartType }}
          </UBadge>
        </div>

        <template #footer>
          <div class="space-y-2">
            <div class="flex gap-2">
              <UButton
                :to="`/charts/${chart.slug}`"
                color="primary"
                variant="outline"
                size="sm"
                block
              >
                <Icon
                  name="i-lucide-eye"
                  class="w-4 h-4"
                />
                View Chart
              </UButton>
              <UButton
                :to="getRemixUrl(chart)"
                color="neutral"
                variant="outline"
                size="sm"
                block
              >
                <Icon
                  name="i-lucide-copy"
                  class="w-4 h-4"
                />
                Remix
              </UButton>
            </div>

            <!-- Admin: Feature Toggle -->
            <div
              v-if="isAdmin"
              class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ chart.isFeatured ? 'Featured' : 'Feature' }}
              </span>
              <USwitch
                :model-value="chart.isFeatured"
                :loading="togglingFeatured === chart.id"
                @update:model-value="(value: boolean) => toggleFeatured(chart.id, value)"
              />
            </div>
          </div>
        </template>
      </UCard>
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
import { handleSilentError, handleApiError } from '@/lib/errors/errorHandler'

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

// Reset page when filters change
watch([sortBy, filterType, filterFeatured], () => {
  currentPage.value = 1
})

// Get remix URL for a chart
function getRemixUrl(chart: Chart) {
  try {
    const state = JSON.parse(chart.chartState)
    const baseUrl = chart.chartType === 'explorer' ? '/explorer' : '/ranking'

    // Convert state to URL params
    const params = new URLSearchParams()
    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `${baseUrl}?${params.toString()}`
  } catch (err) {
    handleSilentError(err, 'getChartUrl')
    return chart.chartType === 'explorer' ? '/explorer' : '/ranking'
  }
}

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
</script>
