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
            <div class="flex gap-1">
              <UBadge
                v-if="chart.isFeatured"
                color="primary"
                variant="subtle"
                size="sm"
              >
                Featured
              </UBadge>
              <UBadge
                v-if="chart.isPublic"
                color="success"
                variant="subtle"
                size="sm"
              >
                Public
              </UBadge>
              <UBadge
                v-else
                color="neutral"
                variant="subtle"
                size="sm"
              >
                Private
              </UBadge>
            </div>
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
            class="overflow-hidden rounded-md bg-gray-100 dark:text-gray-800"
            style="aspect-ratio: 16/9"
          >
            <NuxtLink :to="getChartUrl(chart)">
              <img
                :src="getChartImageUrl(chart)"
                :alt="chart.name"
                class="w-full h-full object-cover hover:scale-105 transition-transform"
                loading="lazy"
              >
            </NuxtLink>
          </div>

          <!-- Meta info -->
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              <Icon
                name="i-lucide-calendar"
                class="w-3 h-3 inline"
              />
              {{ formatDate(chart.createdAt) }}
            </span>
            <span v-if="chart.isPublic">
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
          <div class="flex gap-2">
            <UButton
              :to="getChartUrl(chart)"
              color="primary"
              variant="outline"
              size="sm"
              class="flex-1"
            >
              <Icon
                name="i-lucide-eye"
                class="w-4 h-4"
              />
              View
            </UButton>
            <UButton
              v-if="chart.isPublic && chart.slug"
              :to="`/charts/${chart.slug}`"
              color="neutral"
              variant="outline"
              size="sm"
              class="flex-1"
            >
              <Icon
                name="i-lucide-external-link"
                class="w-4 h-4"
              />
              Public Page
            </UButton>
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              @click="deleteChart(chart.id)"
            />
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
          No saved charts yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Start exploring and save your first chart
        </p>
        <div class="flex gap-4 justify-center">
          <UButton
            to="/explorer"
            color="primary"
          >
            Go to Explorer
          </UButton>
          <UButton
            to="/ranking"
            variant="outline"
          >
            Go to Ranking
          </UButton>
        </div>
      </div>
    </UCard>
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
  isPublic: boolean
  viewCount: number
  createdAt: number
  updatedAt: number
  authorName: string
}

// Page meta
definePageMeta({
  title: 'My Charts'
  // TODO: Add middleware to require authentication
  // middleware: 'auth'
})

// Fetch user's charts
// TODO: Filter by actual user ID when auth is implemented
// For now, show all charts as a demo
const { data, pending, error, refresh } = await useFetch<{
  charts: Chart[]
}>('/api/charts', {
  query: {
    // userId: user.id, // TODO: Add when auth is implemented
    limit: 100
  }
})

const charts = computed(() => data.value?.charts || [])

// Get chart URL for viewing
function getChartUrl(chart: Chart) {
  try {
    const state = JSON.parse(chart.chartState)
    const baseUrl = chart.chartType === 'explorer' ? '/explorer' : '/ranking'

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

// Get chart image URL for thumbnail
function getChartImageUrl(chart: Chart) {
  try {
    const state = JSON.parse(chart.chartState)
    const params = new URLSearchParams()

    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `/chart.png?${params.toString()}&width=600&height=337`
  } catch (err) {
    handleSilentError(err, 'getChartImageUrl')
    return chart.thumbnailUrl || '/placeholder-chart.png'
  }
}

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

// Format date
function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
