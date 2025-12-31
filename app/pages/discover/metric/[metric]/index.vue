<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <NuxtLink
          to="/discover"
          class="hover:text-primary-500"
        >
          Discover
        </NuxtLink>
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <NuxtLink
          to="/discover/metric"
          class="hover:text-primary-500"
        >
          Metric
        </NuxtLink>
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <span class="text-gray-900 dark:text-gray-100">{{ metricLabel }}</span>
      </nav>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon
            :name="metricIcon"
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
          />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ metricLabel }}
        </h1>
      </div>
      <p class="text-gray-600 dark:text-gray-400">
        Select a chart configuration to see all countries
      </p>
    </div>

    <!-- Preset Grid grouped by Chart Type -->
    <div class="space-y-8">
      <div
        v-for="chartType in chartTypes"
        :key="chartType"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {{ chartTypeLabels[chartType] }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NuxtLink
            v-for="view in getViewsForMetric(metric)"
            :key="`${chartType}-${view}`"
            :to="`/discover/metric/${metric}/${chartType}-${view}`"
            class="block"
          >
            <UCard class="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary-500 dark:hover:border-primary-400">
              <div class="text-center py-2">
                <div class="font-medium text-gray-900 dark:text-gray-100">
                  {{ viewLabels[view] }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ viewDescriptions[view] }}
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Count -->
    <div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ presetCount }} chart configurations
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  type Metric,
  type View,
  chartTypes,
  views,
  isValidMetric,
  getPresetCountByMetric
} from '@/lib/discover/presets'
import {
  metricInfo,
  chartTypeLabels,
  viewLabels,
  viewDescriptions
} from '@/lib/discover/constants'

const route = useRoute()
const router = useRouter()

// Get and validate metric param
const metric = computed(() => route.params.metric as string)

// Redirect if invalid metric
onMounted(() => {
  if (!isValidMetric(metric.value)) {
    router.replace('/discover/metric')
  }
})

// Computed properties
const metricLabel = computed(() => {
  if (!isValidMetric(metric.value)) return ''
  return metricInfo[metric.value as Metric].label
})

const metricIcon = computed(() => {
  if (!isValidMetric(metric.value)) return 'i-lucide-bar-chart'
  return metricInfo[metric.value as Metric].icon
})

const presetCount = computed(() => {
  if (!isValidMetric(metric.value)) return 0
  return getPresetCountByMetric(metric.value as Metric)
})

// Get available views for a metric (Population only has 'normal')
function getViewsForMetric(m: string): View[] {
  if (m === 'population') {
    return ['normal']
  }
  return [...views]
}

// SEO
useSeoMeta({
  title: () => `${metricLabel.value} Charts - Mortality Watch`,
  description: () => `Explore ${metricLabel.value} data with ${presetCount.value} chart configurations`,
  ogTitle: () => `${metricLabel.value} Charts - Mortality Watch`,
  ogDescription: () => `Explore ${metricLabel.value} data with ${presetCount.value} chart configurations`
})
</script>
