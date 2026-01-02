<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="space-y-4">
      <!-- Period filters -->
      <div class="flex flex-wrap gap-3 items-center">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
        <label
          v-for="chartType in chartTypes"
          :key="chartType"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="visibleChartTypes"
            type="checkbox"
            :value="chartType"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ chartTypeLabels[chartType] }}</span>
        </label>
      </div>

      <!-- Metric filters -->
      <div class="flex flex-wrap gap-3 items-center">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Metric:</span>
        <label
          v-for="metric in availableMetrics"
          :key="metric"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="visibleMetrics"
            type="checkbox"
            :value="metric"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ metricInfo[metric].label }}</span>
        </label>
      </div>

      <!-- View selector (single selection) -->
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
        <UTabs
          v-model="selectedView"
          :items="viewTabs"
          size="sm"
        />
      </div>
    </div>

    <!-- Matrix grid -->
    <div
      v-for="chartType in visibleChartTypes"
      :key="chartType"
      class="space-y-3"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ chartTypeLabels[chartType] }}
      </h3>

      <div
        class="grid gap-6"
        :class="gridColsClass"
      >
        <template
          v-for="metric in filteredMetrics"
          :key="`${chartType}-${metric}`"
        >
          <NuxtLink
            v-if="getViewForMetric(metric) && isMetricValidForChartType(metric, chartType)"
            :to="getCardUrl(metric, chartType, getViewForMetric(metric)!)"
            class="block group relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <!-- Header with title -->
            <div class="px-3 py-2 text-center border-b border-gray-200 dark:border-gray-800">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ metricInfo[metric].label }}
              </h4>
            </div>

            <!-- Thumbnail -->
            <div
              class="overflow-hidden bg-gray-100 dark:bg-gray-800"
              style="aspect-ratio: 16/9"
            >
              <img
                :src="getThumbnailUrl(metric, chartType, getViewForMetric(metric)!)"
                :alt="`${metricInfo[metric].label} ${chartTypeLabels[chartType]} ${viewLabels[getViewForMetric(metric)!]}`"
                class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                loading="lazy"
              >
            </div>

            <!-- Locked overlay -->
            <UiLockedOverlay v-if="isLocked(getViewForMetric(metric)!)" />
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="visibleChartTypes.length === 0 || filteredMetrics.length === 0"
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      Select at least one period and one metric to see charts
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  type Metric,
  type ChartType,
  type View,
  chartTypes,
  views,
  getPresetById,
  presetToExplorerUrl,
  presetToThumbnailUrl,
  getValidMetricsForCountry,
  isMetricValidForChartType
} from '@/lib/discover/presets'
import { chartTypeLabels, viewLabels, metricInfo, metrics } from '@/lib/discover/constants'

interface Props {
  country: string
  countryName: string
  hasAgeData: boolean
}

const props = defineProps<Props>()
const colorMode = useColorMode()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Visible chart types (all enabled by default)
const visibleChartTypes = ref<ChartType[]>([...chartTypes])

// Selected view (single selection, default to raw)
const selectedView = ref<View>('normal')

// View tabs for UTabs
const viewTabs = computed(() => views.map(view => ({
  label: viewLabels[view],
  value: view
})))

// Available metrics based on country data (uses validity checker)
const availableMetrics = computed<Metric[]>(() => {
  return getValidMetricsForCountry(props.hasAgeData)
})

// Visible metrics (hide Population and Deaths by default - less commonly used)
const visibleMetrics = ref<Metric[]>(metrics.filter(m => m !== 'population' && m !== 'deaths'))

// Filtered metrics (intersection of available and visible)
const filteredMetrics = computed<Metric[]>(() => {
  return availableMetrics.value.filter(m => visibleMetrics.value.includes(m))
})

// Dynamic grid columns based on number of visible metrics
const gridColsClass = computed(() => {
  const count = filteredMetrics.value.length
  // Adapt grid to show all metrics in one row on larger screens
  if (count <= 3) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  } else if (count <= 4) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  } else if (count <= 5) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  } else {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
  }
})

// Check if a view is a Pro feature
function isProFeature(view: View): boolean {
  return view === 'zscore'
}

// Get the feature key for a Pro feature
function getFeatureKey() {
  return 'Z_SCORES' as const
}

// Check if view is locked for current user
function isLocked(view: View): boolean {
  return isProFeature(view) && !can(getFeatureKey())
}

// Get the view to show for a metric
function getViewForMetric(metric: Metric): View | null {
  // Population only has 'normal' view
  if (metric === 'population') {
    return selectedView.value === 'normal' ? 'normal' : null
  }
  return selectedView.value
}

// Get card URL - explorer if unlocked, upgrade if locked
function getCardUrl(metric: Metric, chartType: ChartType, view: View): string {
  if (isLocked(view)) {
    return getFeatureUpgradeUrl(getFeatureKey())
  }
  return getExplorerUrl(metric, chartType, view)
}

// Get explorer URL for a preset
function getExplorerUrl(metric: Metric, chartType: ChartType, view: View): string {
  const preset = getPresetById(`${metric}-${chartType}-${view}`)
  if (!preset) return '/explorer'
  return presetToExplorerUrl(preset, props.country)
}

// Get thumbnail URL for a preset
function getThumbnailUrl(metric: Metric, chartType: ChartType, view: View): string {
  const preset = getPresetById(`${metric}-${chartType}-${view}`)
  if (!preset) return ''
  return presetToThumbnailUrl(preset, props.country, {
    darkMode: colorMode.value === 'dark'
  })
}
</script>
