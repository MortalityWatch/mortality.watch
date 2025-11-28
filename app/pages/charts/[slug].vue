<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <LoadingSpinner
      v-if="pending"
      text="Loading chart..."
      size="lg"
      height="h-64"
    />

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Chart not found"
      description="This chart may have been deleted or is not public."
      class="mb-8"
    />

    <!-- Chart Content -->
    <div v-else-if="chart">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {{ chart.name }}
            </h1>
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <Icon
                  name="i-lucide-user"
                  class="w-4 h-4 inline"
                />
                {{ chart.authorName }}
              </span>
              <span>
                <Icon
                  name="i-lucide-eye"
                  class="w-4 h-4 inline"
                />
                {{ chart.viewCount }} views
              </span>
              <span>
                <Icon
                  name="i-lucide-calendar"
                  class="w-4 h-4 inline"
                />
                {{ formatDate(chart.createdAt) }}
              </span>
            </div>
          </div>
          <UBadge
            v-if="chart.isFeatured"
            color="primary"
            size="lg"
          >
            Featured
          </UBadge>
        </div>

        <p
          v-if="chart.description"
          class="text-lg text-gray-700 dark:text-gray-300"
        >
          {{ chart.description }}
        </p>
      </div>

      <!-- Chart Visualization -->
      <UCard class="mb-8">
        <div class="rounded-lg overflow-hidden">
          <!-- Chart rendered with state -->
          <img
            v-if="chartImageUrl"
            :src="chartImageUrl"
            :alt="chart.name"
            class="w-full h-auto"
          >
          <div
            v-else
            class="aspect-video flex flex-col items-center justify-center text-gray-400 gap-4"
          >
            <Icon
              name="i-lucide-bar-chart-2"
              class="w-16 h-16"
            />
            <p
              v-if="chart.chartType === 'ranking'"
              class="text-sm"
            >
              Preview not available for ranking charts yet
            </p>
            <p
              v-else
              class="text-sm"
            >
              Chart preview unavailable
            </p>
          </div>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="flex flex-wrap gap-4 mb-8">
        <UButton
          :to="getRemixUrl()"
          color="primary"
          size="lg"
        >
          <Icon
            name="i-lucide-copy"
            class="w-5 h-5"
          />
          Remix This Chart
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          @click="shareChart"
        >
          <Icon
            name="i-lucide-share-2"
            class="w-5 h-5"
          />
          Share
        </UButton>
      </div>

      <!-- Chart Details -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Chart Details
          </h2>
        </template>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Chart Type
            </dt>
            <dd class="mt-1">
              <UBadge
                :color="chart.chartType === 'explorer' ? 'info' : 'success'"
                variant="subtle"
              >
                {{ chart.chartType === 'explorer' ? 'Explorer' : 'Ranking' }}
              </UBadge>
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {{ formatDateTime(chart.createdAt) }}
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last Updated
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {{ formatDateTime(chart.updatedAt) }}
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              View Count
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {{ chart.viewCount }} views
            </dd>
          </div>
        </dl>
      </UCard>

      <!-- Chart Controls (Owner or Admin) -->
      <UCard
        v-if="(isOwner || isAdmin) && chart"
        class="mt-8"
      >
        <template #header>
          <h2 class="text-xl font-semibold">
            {{ isAdmin && !isOwner ? 'Admin Controls' : 'Chart Settings' }}
          </h2>
        </template>

        <ChartsChartControls
          :is-public="chart.isPublic ?? false"
          :is-featured="chart.isFeatured"
          :is-owner="!!isOwner"
          :is-admin="isAdmin"
          :is-toggling-public="togglingPublic === chart.id"
          :is-toggling-featured="togglingFeatured === chart.id"
          @toggle-public="handleTogglePublic"
          @toggle-featured="handleToggleFeatured"
        />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { handleSilentError } from '@/lib/errors/errorHandler'
import { showToast } from '@/toast'
import { encodeChartState } from '@/lib/chartState'
import type { ChartState } from '@/lib/chartState'
import { formatChartDate } from '@/lib/utils/dates'

const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')
const isOwner = computed(() => chart.value && user.value && chart.value.userId === user.value.id)

interface Chart {
  id: number
  name: string
  description: string | null
  slug: string | null
  chartType: 'explorer' | 'ranking'
  chartState: string
  thumbnailUrl: string | null
  isFeatured: boolean
  isPublic?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  authorName: string
  userId: number
}

const route = useRoute()
const slug = route.params.slug as string

// Fetch chart data
const { data: chart, pending, error } = await useFetch<Chart>(
  `/api/charts/slug/${slug}`
)

// Use shared admin composable
const { togglingFeatured, togglingPublic, toggleFeatured: toggleFeaturedStatus, togglePublic: togglePublicStatus } = useChartAdmin()

async function handleToggleFeatured(newValue: boolean) {
  if (!chart.value) return

  // Optimistic update
  const oldValue = chart.value.isFeatured
  chart.value.isFeatured = newValue

  try {
    await toggleFeaturedStatus(chart.value.id, newValue)
  } catch {
    // Revert on error
    chart.value.isFeatured = oldValue
  }
}

async function handleTogglePublic(newValue: boolean) {
  if (!chart.value) return

  // Optimistic update
  const oldValue = chart.value.isPublic
  chart.value.isPublic = newValue

  try {
    await togglePublicStatus(chart.value.id, newValue)
  } catch {
    // Revert on error
    if (chart.value.isPublic !== undefined) {
      chart.value.isPublic = oldValue
    }
  }
}

// Get site URL for absolute OG image URLs
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || 'https://sentry.mortality.watch'

// Generate chart image URL from state (relative for display, absolute for OG)
const chartImageUrl = computed(() => {
  if (!chart.value) return null

  try {
    const state = JSON.parse(chart.value.chartState)

    // For ranking charts, use ranking.png endpoint
    if (chart.value.chartType === 'ranking') {
      const params = new URLSearchParams()
      Object.entries(state).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.set(key, String(value))
        }
      })
      return `/ranking.png?${params.toString()}&width=1200&height=600`
    }

    // For explorer charts, encode state using the same encoding as the explorer page
    const encodedState = encodeChartState(state as Partial<ChartState>)
    const params = new URLSearchParams()

    Object.entries(encodedState).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, String(value))
      }
    })

    return `/chart.png?${params.toString()}&width=1200&height=600`
  } catch (err) {
    handleSilentError(err, 'chartImageUrl')
    return null
  }
})

// Absolute URL version for OG meta tags
const absoluteChartImageUrl = computed(() => {
  const relativeUrl = chartImageUrl.value
  return relativeUrl ? `${siteUrl}${relativeUrl}` : null
})

// Get remix URL
function getRemixUrl() {
  if (!chart.value) return '/explorer'

  try {
    const state = JSON.parse(chart.value.chartState) as Partial<ChartState>
    const baseUrl = chart.value.chartType === 'explorer' ? '/explorer' : '/ranking'
    const encodedState = encodeChartState(state)
    const params = new URLSearchParams()

    Object.entries(encodedState).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, String(value))
      }
    })

    return `${baseUrl}?${params.toString()}`
  } catch (err) {
    handleSilentError(err, 'getRemixUrl')
    return chart.value.chartType === 'explorer' ? '/explorer' : '/ranking'
  }
}

// Share chart
async function shareChart() {
  const url = `${window.location.origin}/charts/${slug}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: chart.value?.name || 'Mortality Chart',
        text: chart.value?.description || 'Check out this mortality visualization',
        url
      })
    } catch {
      // User cancelled or error - fall back to clipboard
      copyToClipboard(url)
    }
  } else {
    copyToClipboard(url)
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link copied to clipboard!', 'success')
  }).catch(() => {
    showToast('Failed to copy link', 'error')
  })
}

// Format dates using utility
function formatDate(dateString: string) {
  return formatChartDate(dateString, 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(dateString: string) {
  return formatChartDate(dateString, 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Page meta
useSeoMeta({
  title: () => chart.value?.name || 'Chart',
  description: () => chart.value?.description || 'Mortality data visualization',
  ogTitle: () => chart.value?.name || 'Chart',
  ogDescription: () => chart.value?.description || 'Mortality data visualization',
  ogImage: absoluteChartImageUrl,
  twitterCard: 'summary_large_image'
})
</script>
