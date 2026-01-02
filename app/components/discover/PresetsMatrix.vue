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

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <template
          v-for="metric in filteredMetrics"
          :key="`${chartType}-${metric}`"
        >
          <NuxtLink
            v-if="getViewForMetric(metric) && isMetricValidForChartType(metric, chartType)"
            :to="getCardUrl(metric, chartType, getViewForMetric(metric)!)"
            class="block"
          >
            <UCard
              class="h-full transition-shadow cursor-pointer"
              :class="isLocked(getViewForMetric(metric)!) ? 'opacity-60' : 'hover:shadow-lg'"
            >
              <!-- Thumbnail -->
              <DiscoverThumbnail
                :src="getThumbnailUrl(metric, chartType, getViewForMetric(metric)!)"
                :locked-src="getThumbnailUrl(metric, chartType, 'normal')"
                :alt="`${metricInfo[metric].label} ${chartTypeLabels[chartType]} ${viewLabels[getViewForMetric(metric)!]}`"
                :locked="isLocked(getViewForMetric(metric)!)"
                class="mb-2"
              />

              <!-- Label -->
              <div class="text-center">
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {{ metricInfo[metric].label }}
                </div>
                <div
                  v-if="isLocked(getViewForMetric(metric)!)"
                  class="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  <UBadge
                    color="primary"
                    variant="soft"
                    size="xs"
                  >
                    Pro
                  </UBadge>
                </div>
              </div>
            </UCard>
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
import type { FeatureKey } from '@/lib/featureFlags'

interface Props {
  country: string
  countryName: string
  hasAgeData: boolean
}

const props = defineProps<Props>()
const colorMode = useColorMode()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Visible chart types (hide monthly by default)
const visibleChartTypes = ref<ChartType[]>(['weekly', 'quarterly', 'yearly', 'midyear', 'fluseason'])

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

// Visible metrics (hide Population by default - less commonly used)
const visibleMetrics = ref<Metric[]>(metrics.filter(m => m !== 'population'))

// Filtered metrics (intersection of available and visible)
const filteredMetrics = computed<Metric[]>(() => {
  return availableMetrics.value.filter(m => visibleMetrics.value.includes(m))
})

// Check if a view is a Pro feature
function isProFeature(view: View): boolean {
  return view === 'zscore'
}

// Get the feature key for a Pro feature
function getFeatureKey(): FeatureKey {
  return 'Z_SCORES'
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
