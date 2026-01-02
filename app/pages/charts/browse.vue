<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Chart History
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        All chart variants ever created on the platform
      </p>
    </div>

    <!-- Sort Controls -->
    <div class="mb-6 flex items-center gap-4">
      <span class="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
      <div class="flex gap-2">
        <UButton
          :variant="sortBy === 'newest' ? 'solid' : 'outline'"
          size="sm"
          @click="sortBy = 'newest'"
        >
          Newest
        </UButton>
        <UButton
          :variant="sortBy === 'popular' ? 'solid' : 'outline'"
          size="sm"
          @click="sortBy = 'popular'"
        >
          Most Viewed
        </UButton>
        <UButton
          :variant="sortBy === 'recent' ? 'solid' : 'outline'"
          size="sm"
          @click="sortBy = 'recent'"
        >
          Recently Accessed
        </UButton>
      </div>
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
        <!-- Thumbnail -->
        <NuxtLink
          :to="getChartUrl(chart)"
          class="block overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 mb-3"
          style="aspect-ratio: 16/9"
        >
          <img
            :src="getThumbnailUrl(chart)"
            :alt="`Chart ${chart.id}`"
            class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
            loading="lazy"
          >
        </NuxtLink>

        <!-- Meta info -->
        <div class="space-y-2">
          <!-- Stats row -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-3">
              <UBadge
                :color="chart.page === 'explorer' ? 'primary' : 'info'"
                variant="subtle"
                size="xs"
              >
                {{ chart.page }}
              </UBadge>
              <span>
                <Icon
                  name="i-lucide-eye"
                  class="w-3 h-3 inline"
                />
                {{ chart.accessCount }}
              </span>
            </div>
            <span>{{ formatDate(chart.createdAt) }}</span>
          </div>

          <!-- Admin: Saved By -->
          <div
            v-if="isAdmin && chart.savedBy"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            <Icon
              name="i-lucide-bookmark"
              class="w-3 h-3 inline"
            />
            Saved by {{ chart.savedBy.name }}
            <span v-if="chart.savedBy.count > 1">
              (+{{ chart.savedBy.count - 1 }})
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
          No charts found
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          No charts have been created yet
        </p>
      </div>
    </UCard>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.total > pagination.limit"
      class="mt-8 flex justify-center items-center gap-4"
    >
      <span class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ pagination.offset + 1 }}-{{ Math.min(pagination.offset + pagination.limit, pagination.total) }}
        of {{ pagination.total.toLocaleString() }} charts
      </span>
      <UPagination
        v-model="currentPage"
        :total="pagination.total"
        :page-count="pagination.limit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Chart {
  id: string
  page: 'explorer' | 'ranking'
  config: string
  createCount: number
  accessCount: number
  createdAt: string
  lastAccessedAt: string | null
  savedBy?: { name: string, count: number } | null
}

const { user } = useAuth()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()
const isAdmin = computed(() => user.value?.role === 'admin')
const colorMode = useColorMode()

// Redirect non-pro users to upgrade page
if (!can('BROWSE_ALL_CHARTS')) {
  await navigateTo(getFeatureUpgradeUrl('BROWSE_ALL_CHARTS'))
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// Page meta
definePageMeta({
  title: 'Chart History'
})

useSeoMeta({
  title: 'Chart History',
  description: 'Browse all chart variants ever created on Mortality Watch',
  ogTitle: 'Chart History - Mortality Watch',
  ogDescription: 'Browse all chart variants ever created on Mortality Watch'
})

// State
const sortBy = ref<'newest' | 'popular' | 'recent'>('newest')
const currentPage = ref(1)
const limit = 24 // Better for grid layout (divisible by 2 and 3)

// Computed query params
const queryParams = computed(() => ({
  sort: sortBy.value,
  limit,
  offset: (currentPage.value - 1) * limit
}))

// Reset to page 1 when sort changes
watch(sortBy, () => {
  currentPage.value = 1
})

// Fetch charts
const { data, pending, error } = await useFetch<{
  charts: Chart[]
  pagination: Pagination
}>('/api/charts/browse', {
  query: queryParams,
  watch: [queryParams]
})

const charts = computed(() => data.value?.charts || [])
const pagination = computed(() => data.value?.pagination)

// Format date (ISO string from API)
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get direct URL to chart (strip display-only params)
function getChartUrl(chart: Chart): string {
  const base = `/${chart.page}`
  if (!chart.config) return base

  // Remove thumbnail/display-only params that shouldn't be in deep links
  const params = new URLSearchParams(chart.config)
  const displayParams = ['l', 'qr', 'cap', 'ti', 'dm', 'dp', 'z', 'width', 'height']
  displayParams.forEach(p => params.delete(p))

  const cleanConfig = params.toString()
  return cleanConfig ? `${base}?${cleanConfig}` : base
}

// Generate thumbnail URL (same approach as ChartCard)
function getThumbnailUrl(chart: Chart): string {
  const endpoint = chart.page === 'ranking' ? '/ranking.png' : '/chart.png'
  const params = new URLSearchParams(chart.config)

  // First, remove any stored display params to reset to defaults
  const displayParams = ['l', 'qr', 'cap', 'ti', 'dm', 'dp', 'z', 'width', 'height']
  displayParams.forEach(p => params.delete(p))

  // Add dark mode if active
  if (colorMode.value === 'dark') {
    params.set('dm', '1')
  }

  // Thumbnail-specific options (title stays visible by default)
  params.set('qr', '0') // Hide QR code
  params.set('l', '0') // Hide logo
  params.set('cap', '0') // Hide caption
  params.set('dp', '2') // 2x device pixel ratio
  params.set('z', '1.5') // Zoom level
  params.set('width', '352')
  params.set('height', '198')

  return `${endpoint}?${params.toString()}`
}
</script>
