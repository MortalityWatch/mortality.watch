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
      <UCard
        class="mb-8"
        :ui="{ body: 'p-0' }"
      >
        <img
          v-if="chartImageUrl"
          :src="chartImageUrl"
          :alt="chart.name"
          class="w-full h-auto block"
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

        <div class="space-y-6">
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

          <!-- Delete Section -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-sm text-error-600 dark:text-error-400">
                  Delete Chart
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Permanently remove this chart
                </div>
              </div>
              <UButton
                color="error"
                variant="soft"
                size="sm"
                :loading="isDeleting"
                @click="handleDelete"
              >
                <Icon
                  name="i-lucide-trash-2"
                  class="w-4 h-4"
                />
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@/toast'
import { formatChartDate } from '@/lib/utils/dates'
import { handleApiError } from '@/lib/errors/errorHandler'

const { user } = useAuth()
const router = useRouter()
const isAdmin = computed(() => user.value?.role === 'admin')
const isOwner = computed(() => chart.value && user.value && chart.value.userId === user.value.id)

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

// Delete chart
const isDeleting = ref(false)

async function handleDelete() {
  if (!chart.value) return

  if (!confirm('Are you sure you want to delete this chart? This action cannot be undone.')) {
    return
  }

  isDeleting.value = true
  try {
    await $fetch(`/api/charts/${chart.value.id}`, {
      method: 'DELETE'
    })
    showToast('Chart deleted successfully', 'success')
    router.push('/charts')
  } catch (err) {
    handleApiError(err, 'delete chart', 'handleDelete')
  } finally {
    isDeleting.value = false
  }
}

// Get site URL for absolute OG image URLs
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public.siteUrl || 'https://sentry.mortality.watch'

// Get color mode to pass dark mode to chart image
const colorMode = useColorMode()

// Generate chart image URL from config (relative for display, absolute for OG)
// Dark mode is only applied client-side since colorMode.value isn't resolved during SSR
const chartImageUrl = computed(() => {
  if (!chart.value) return null

  const chartConfig = chart.value.chartConfig
  const endpoint = chart.value.chartType === 'ranking' ? '/ranking.png' : '/chart.png'

  // Config is already a query string, just append dimensions
  const separator = chartConfig ? '&' : ''

  // Add dark mode parameter based on user's color preference (client-side only)
  // During SSR, colorMode.value may not reflect user's preference, so we skip dm param
  // The image will re-render correctly once the client hydrates
  const isDarkMode = !import.meta.server && colorMode.value === 'dark'
  const dmParam = isDarkMode ? '&dm=1' : ''

  return `${endpoint}?${chartConfig}${separator}width=1200&height=600${dmParam}`
})

// Absolute URL version for OG meta tags
const absoluteChartImageUrl = computed(() => {
  const relativeUrl = chartImageUrl.value
  return relativeUrl ? `${siteUrl}${relativeUrl}` : null
})

// Get remix URL - chartConfig is already a query string
function getRemixUrl() {
  if (!chart.value) return '/explorer'

  const baseUrl = chart.value.chartType === 'explorer' ? '/explorer' : '/ranking'
  const config = chart.value.chartConfig

  return config ? `${baseUrl}?${config}` : baseUrl
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
  twitterCard: 'summary_large_image',
  twitterImage: absoluteChartImageUrl,
  twitterTitle: () => chart.value?.name || 'Chart',
  twitterDescription: () => chart.value?.description || 'Mortality data visualization'
})
</script>
