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
      v-else-if="charts && charts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <ChartsChartCard
        v-for="chart in charts"
        :key="chart.id"
        :chart="chart"
        variant="my-charts"
        :show-admin-toggle="isAdmin"
        :is-toggling="togglingFeatured === chart.id"
        @delete="deleteChart"
        @toggle-featured="toggleFeatured"
      />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!pending">
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
  isPublic: boolean
  viewCount: number
  createdAt: number
  updatedAt: number
  authorName: string
}

// Page meta
definePageMeta({
  title: 'My Charts',
  middleware: 'auth'
})

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
