<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Featured Charts Management
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          Manage which charts appear on the homepage
        </p>
      </div>

      <!-- Cache Management -->
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :loading="loadingCacheStats"
          @click="refreshCacheStats"
        >
          <Icon
            name="i-lucide-refresh-cw"
            class="w-4 h-4"
          />
          {{ cacheStats ? `${cacheStats.count} cached` : 'Cache Stats' }}
        </UButton>

        <UButton
          color="error"
          variant="outline"
          :loading="clearingCache"
          @click="clearCache"
        >
          <Icon
            name="i-lucide-trash-2"
            class="w-4 h-4"
          />
          Clear Cache
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-primary">
            {{ featuredCount }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Featured Charts
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">
            {{ publicCount }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Public Charts
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">
            {{ cacheStats?.totalSizeMB || '0' }} MB
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Cache Size
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <USelectMenu
        v-model="filterFeatured"
        :options="featuredFilterOptions"
        placeholder="All charts"
        class="w-full sm:w-48"
      />
      <USelectMenu
        v-model="filterType"
        :options="typeOptions"
        placeholder="All types"
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

    <!-- Charts List -->
    <div
      v-else-if="charts && charts.length > 0"
      class="space-y-4"
    >
      <UCard
        v-for="chart in charts"
        :key="chart.id"
      >
        <div class="flex items-center gap-6">
          <!-- Thumbnail -->
          <div
            class="shrink-0 w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden"
          >
            <img
              v-if="chart.thumbnailUrl"
              :src="chart.thumbnailUrl"
              :alt="chart.name"
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400"
            >
              <Icon
                name="i-lucide-bar-chart-2"
                class="w-8 h-8"
              />
            </div>
          </div>

          <!-- Chart Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-semibold truncate">
                  {{ chart.name }}
                </h3>
                <p
                  v-if="chart.description"
                  class="text-sm text-gray-600 dark:text-gray-400 truncate"
                >
                  {{ chart.description }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
              <UBadge
                :color="chart.chartType === 'explorer' ? 'info' : 'success'"
                variant="subtle"
                size="xs"
              >
                {{ chart.chartType === 'explorer' ? 'Explorer' : 'Ranking' }}
              </UBadge>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <UButton
              :to="`/charts/${chart.slug}`"
              color="neutral"
              variant="ghost"
              size="sm"
              target="_blank"
            >
              <Icon
                name="i-lucide-external-link"
                class="w-4 h-4"
              />
            </UButton>

            <USwitch
              :model-value="chart.isFeatured"
              :loading="togglingFeatured === chart.id"
              @update:model-value="(value: boolean) => toggleFeatured(chart.id, value)"
            />

            <span class="text-sm font-medium">
              {{ chart.isFeatured ? 'Featured' : 'Feature' }}
            </span>
          </div>
        </div>
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
          No public charts yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Charts will appear here once users publish them
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

interface CacheStats {
  count: number
  totalSize: number
  totalSizeMB: string
  oldestEntry: string | null
  newestEntry: string | null
}

// Page meta
definePageMeta({
  middleware: 'admin',
  title: 'Featured Charts Management'
})

// Filters
const filterFeatured = ref<string | null>(null)
const filterType = ref<string | null>(null)
const currentPage = ref(1)

const featuredFilterOptions = [
  { label: 'All Charts', value: null },
  { label: 'Featured Only', value: 'true' },
  { label: 'Not Featured', value: 'false' }
]

const typeOptions = [
  { label: 'All Types', value: null },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Ranking', value: 'ranking' }
]

// Query params
const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    sort: 'featured',
    limit: 20,
    offset: (currentPage.value - 1) * 20
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
const { data, pending, error, refresh } = await useFetch<{
  charts: Chart[]
  pagination: Pagination
}>('/api/charts', {
  query: queryParams,
  watch: [queryParams]
})

const charts = computed(() => data.value?.charts || [])
const pagination = computed(() => data.value?.pagination)

// Stats
const featuredCount = computed(() => {
  return charts.value.filter(c => c.isFeatured).length
})

const publicCount = computed(() => {
  return charts.value.length
})

// Cache management
const cacheStats = ref<CacheStats | null>(null)
const loadingCacheStats = ref(false)
const clearingCache = ref(false)

async function refreshCacheStats() {
  loadingCacheStats.value = true
  try {
    const response = await $fetch<{ success: boolean, stats: CacheStats }>(
      '/api/admin/cache'
    )
    cacheStats.value = response.stats
  } catch (err) {
    handleSilentError(err, 'refreshCacheStats')
  } finally {
    loadingCacheStats.value = false
  }
}

async function clearCache() {
  if (!confirm('Are you sure you want to clear all cached charts? This will temporarily slow down chart loading.')) {
    return
  }

  clearingCache.value = true
  try {
    const response = await $fetch<{ success: boolean, cleared: number, message: string }>(
      '/api/admin/cache',
      { method: 'DELETE' }
    )

    alert(response.message)
    await refreshCacheStats()
  } catch (err) {
    handleApiError(err, 'clear cache', 'clearCache')
  } finally {
    clearingCache.value = false
  }
}

// Toggle featured status
const togglingFeatured = ref<number | null>(null)

async function toggleFeatured(chartId: number, isFeatured: boolean) {
  togglingFeatured.value = chartId

  try {
    await $fetch(`/api/admin/charts/${chartId}/featured`, {
      method: 'PATCH',
      body: { isFeatured }
    })

    // Refresh the list
    await refresh()
  } catch (err) {
    handleApiError(err, 'update featured status', 'toggleFeatured')
  } finally {
    togglingFeatured.value = null
  }
}

// Reset page when filters change
watch([filterFeatured, filterType], () => {
  currentPage.value = 1
})

// Load cache stats on mount
onMounted(() => {
  refreshCacheStats()
})
</script>
