<template>
  <UCard class="hover:shadow-lg transition-shadow">
    <!-- Header -->
    <template #header>
      <div
        v-if="variant === 'homepage'"
        class="text-center"
      >
        <h3 class="text-lg font-semibold">
          {{ chart.name }}
        </h3>
      </div>
      <div
        v-else
        class="flex items-start justify-between"
      >
        <h3 class="text-lg font-semibold flex-1">
          {{ chart.name }}
        </h3>
        <div
          v-if="variant === 'my-charts'"
          class="flex gap-1"
        >
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

    <!-- Body -->
    <div :class="variant === 'homepage' ? '' : 'space-y-3'">
      <!-- Description (not shown on homepage) -->
      <p
        v-if="variant !== 'homepage' && chart.description"
        class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
      >
        {{ chart.description }}
      </p>

      <!-- Thumbnail -->
      <div
        class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
        style="aspect-ratio: 16/9"
      >
        <NuxtLink :to="getChartLink()">
          <img
            :src="getThumbnailUrl()"
            :alt="chart.name"
            class="w-full h-full object-cover hover:scale-105 transition-transform"
            loading="lazy"
          >
        </NuxtLink>
      </div>

      <!-- Meta info (not shown on homepage) -->
      <div
        v-if="variant !== 'homepage'"
        class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
      >
        <span v-if="variant === 'my-charts'">
          <Icon
            name="i-lucide-calendar"
            class="w-3 h-3 inline"
          />
          {{ formatDate(chart.createdAt) }}
        </span>
        <span v-else>
          <Icon
            name="i-lucide-user"
            class="w-3 h-3 inline"
          />
          {{ chart.authorName }}
        </span>
        <span v-if="chart.isPublic || variant === 'gallery'">
          <Icon
            name="i-lucide-eye"
            class="w-3 h-3 inline"
          />
          {{ chart.viewCount }} views
        </span>
      </div>

      <!-- Chart type badge (not shown on homepage) -->
      <UBadge
        v-if="variant !== 'homepage'"
        :color="chart.chartType === 'explorer' ? 'info' : 'success'"
        variant="subtle"
        size="xs"
      >
        {{ chart.chartType === 'explorer' ? 'Explorer' : 'Ranking' }}
      </UBadge>
    </div>

    <!-- Footer (not shown on homepage) -->
    <template
      v-if="variant !== 'homepage'"
      #footer
    >
      <div class="space-y-2">
        <!-- Action buttons -->
        <div class="flex gap-2">
          <!-- Gallery variant buttons -->
          <template v-if="variant === 'gallery'">
            <UButton
              :to="getChartLink()"
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
              :to="getRemixUrl()"
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
          </template>

          <!-- My Charts variant buttons -->
          <template v-else-if="variant === 'my-charts'">
            <UButton
              :to="getRemixUrl()"
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
              :to="getChartLink()"
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
              @click="$emit('delete', chart.id)"
            />
          </template>

          <!-- Admin Featured Charts variant buttons -->
          <template v-else-if="variant === 'admin'">
            <UButton
              :to="getChartLink()"
              color="primary"
              variant="outline"
              size="sm"
              block
            >
              <Icon
                name="i-lucide-eye"
                class="w-4 h-4"
              />
              View
            </UButton>
            <UButton
              :to="getRemixUrl()"
              color="neutral"
              variant="outline"
              size="sm"
              block
            >
              <Icon
                name="i-lucide-external-link"
                class="w-4 h-4"
              />
              Open
            </UButton>
          </template>
        </div>

        <!-- Admin: Feature Toggle -->
        <div
          v-if="showAdminToggle && (variant === 'my-charts' ? chart.isPublic : true)"
          class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ chart.isFeatured ? 'Featured' : 'Feature' }}
          </span>
          <USwitch
            :model-value="chart.isFeatured"
            :loading="isToggling"
            @update:model-value="(value: boolean) => $emit('toggle-featured', chart.id, value)"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { handleSilentError } from '@/lib/errors/errorHandler'

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
  createdAt: number
  updatedAt: number
  authorName: string
}

interface Props {
  chart: Chart
  variant: 'homepage' | 'gallery' | 'my-charts' | 'admin'
  showAdminToggle?: boolean
  isToggling?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAdminToggle: false,
  isToggling: false
})

defineEmits<{
  'delete': [chartId: number]
  'toggle-featured': [chartId: number, value: boolean]
}>()

// Get the public chart link (/charts/:slug)
function getChartLink() {
  if (props.chart.slug) {
    return `/charts/${props.chart.slug}`
  }
  return getRemixUrl()
}

// Get the remix URL (explorer or ranking with state)
function getRemixUrl() {
  try {
    const state = JSON.parse(props.chart.chartState)
    const baseUrl = props.chart.chartType === 'explorer' ? '/explorer' : '/ranking'

    const params = new URLSearchParams()
    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `${baseUrl}?${params.toString()}`
  } catch (err) {
    handleSilentError(err, 'getRemixUrl')
    return props.chart.chartType === 'explorer' ? '/explorer' : '/ranking'
  }
}

// Get thumbnail URL
function getThumbnailUrl() {
  if (props.chart.thumbnailUrl) {
    return props.chart.thumbnailUrl
  }

  // Generate thumbnail from chart state
  try {
    const state = JSON.parse(props.chart.chartState)
    const params = new URLSearchParams()

    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `/chart.png?${params.toString()}&width=600&height=337`
  } catch (err) {
    handleSilentError(err, 'getThumbnailUrl')
    return '/placeholder-chart.png'
  }
}

// Format date for my-charts
function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
