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
            :src="getThumbnailUrl"
            :alt="chart.name"
            class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
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
        <span>
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

    <!-- Footer -->
    <template
      v-if="showFooter"
      #footer
    >
      <div class="space-y-2">
        <!-- Action buttons -->
        <div class="flex gap-2">
          <!-- View button -->
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

          <!-- Remix button -->
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

          <!-- Delete button (owner or admin) -->
          <UButton
            v-if="isOwner || isAdmin"
            color="error"
            variant="ghost"
            size="sm"
            @click="handleDelete"
          >
            <Icon
              name="i-lucide-trash-2"
              class="w-4 h-4"
            />
          </UButton>
        </div>

        <!-- Chart Controls (owner or admin) -->
        <ChartsChartControls
          v-if="isOwner || isAdmin"
          :is-public="chart.isPublic"
          :is-featured="chart.isFeatured"
          :is-owner="isOwner"
          :is-admin="isAdmin"
          :is-toggling-public="isTogglingPublic"
          :is-toggling-featured="isTogglingFeatured"
          variant="card"
          @toggle-public="(value: boolean) => $emit('toggle-public', chart.id, value)"
          @toggle-featured="(value: boolean) => $emit('toggle-featured', chart.id, value)"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { formatChartDate } from '@/lib/utils/dates'

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

interface Props {
  chart: Chart
  variant: 'homepage' | 'gallery' | 'my-charts' | 'admin'
  isOwner?: boolean
  isAdmin?: boolean
  isTogglingFeatured?: boolean
  isTogglingPublic?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOwner: false,
  isAdmin: false,
  isTogglingFeatured: false,
  isTogglingPublic: false
})

const emit = defineEmits<{
  'delete': [chartId: number]
  'toggle-featured': [chartId: number, value: boolean]
  'toggle-public': [chartId: number, value: boolean]
}>()

// Show footer if not homepage variant
const showFooter = computed(() => props.variant !== 'homepage')

// Handle delete button click
function handleDelete() {
  emit('delete', props.chart.id)
}

// Get the public chart link (/charts/:slug)
function getChartLink() {
  if (props.chart.slug) {
    return `/charts/${props.chart.slug}`
  }
  return getRemixUrl()
}

// Get the remix URL - chartConfig is already a query string
function getRemixUrl() {
  const baseUrl = props.chart.chartType === 'explorer' ? '/explorer' : '/ranking'
  const config = props.chart.chartConfig

  return config ? `${baseUrl}?${config}` : baseUrl
}

// Get thumbnail URL - chartConfig is already a query string (reactive to theme changes)
const getThumbnailUrl = computed(() => {
  if (props.chart.thumbnailUrl) {
    return props.chart.thumbnailUrl
  }

  const colorMode = useColorMode()
  const config = props.chart.chartConfig
  const endpoint = props.chart.chartType === 'ranking' ? '/ranking.png' : '/chart.png'

  // Build params for thumbnail-specific options
  const params = new URLSearchParams(config)

  // Add dark mode parameter if in dark mode
  if (colorMode.value === 'dark') {
    params.set('dm', '1')
  }

  // Hide title, QR code and logo for thumbnails
  params.set('ti', '0')
  params.set('qr', '0')
  params.set('l', '0')
  params.set('cap', '0')
  // Use 2x device pixel ratio for thumbnails and adjusted zoom
  params.set('dp', '2')
  params.set('z', '1.33')
  params.set('width', '352')
  params.set('height', '198')

  return `${endpoint}?${params.toString()}`
})

// Format date for my-charts
function formatDate(value: number | string | Date) {
  return formatChartDate(value)
}
</script>
