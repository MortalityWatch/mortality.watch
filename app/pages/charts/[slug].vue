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
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <!-- Chart rendered with state -->
          <img
            v-if="chartImageUrl"
            :src="chartImageUrl"
            :alt="chart.name"
            class="w-full h-auto rounded"
          >
          <div
            v-else
            class="aspect-video flex items-center justify-center text-gray-400"
          >
            <Icon
              name="i-lucide-bar-chart-2"
              class="w-16 h-16"
            />
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

        <UButton
          to="/charts"
          color="neutral"
          variant="ghost"
          size="lg"
        >
          <Icon
            name="i-lucide-arrow-left"
            class="w-5 h-5"
          />
          Back to Gallery
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { handleSilentError } from '@/lib/errors/errorHandler'
import { showToast } from '@/toast'

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

const route = useRoute()
const slug = route.params.slug as string

// Fetch chart data
const { data: chart, pending, error } = await useFetch<Chart>(
  `/api/charts/slug/${slug}`
)

// Generate chart image URL from state
const chartImageUrl = computed(() => {
  if (!chart.value) return null

  try {
    const state = JSON.parse(chart.value.chartState)
    const params = new URLSearchParams()

    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `/chart.png?${params.toString()}&width=1200&height=600`
  } catch (err) {
    handleSilentError(err, 'chartImageUrl')
    return null
  }
})

// Get remix URL
function getRemixUrl() {
  if (!chart.value) return '/explorer'

  try {
    const state = JSON.parse(chart.value.chartState)
    const baseUrl = chart.value.chartType === 'explorer' ? '/explorer' : '/ranking'

    const params = new URLSearchParams()
    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
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

// Format dates
function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Page meta
useHead({
  title: computed(() => chart.value?.name || 'Chart'),
  meta: [
    {
      name: 'description',
      content: computed(() => chart.value?.description || 'Mortality data visualization')
    },
    {
      property: 'og:title',
      content: computed(() => chart.value?.name || 'Chart')
    },
    {
      property: 'og:description',
      content: computed(() => chart.value?.description || 'Mortality data visualization')
    },
    {
      property: 'og:image',
      content: computed(() => chartImageUrl.value || '')
    }
  ]
})
</script>
