<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-center">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
      <label
        v-for="chartType in chartTypes"
        :key="chartType"
        class="inline-flex items-center gap-2 cursor-pointer"
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
          v-for="metric in availableMetrics"
          :key="`${chartType}-${metric}`"
        >
          <template
            v-for="view in getViewsForMetric(metric)"
            :key="`${chartType}-${metric}-${view}`"
          >
            <NuxtLink
              :to="getCardUrl(metric, chartType, view)"
              class="block"
            >
              <UCard
                class="h-full transition-shadow cursor-pointer"
                :class="isLocked(view) ? 'opacity-60' : 'hover:shadow-lg'"
              >
                <!-- Thumbnail -->
                <DiscoverThumbnail
                  :src="getThumbnailUrl(metric, chartType, view)"
                  :locked-src="getThumbnailUrl(metric, chartType, 'normal')"
                  :alt="`${metricInfo[metric].label} ${chartTypeLabels[chartType]} ${viewLabels[view]}`"
                  :locked="isLocked(view)"
                  class="mb-2"
                />

                <!-- Label -->
                <div class="text-center">
                  <div class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {{ metricInfo[metric].shortLabel }}
                  </div>
                  <div class="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ viewLabels[view] }}</span>
                    <UBadge
                      v-if="isLocked(view)"
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
        </template>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="visibleChartTypes.length === 0"
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      Select at least one chart type to view presets
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
  presetToThumbnailUrl
} from '@/lib/discover/presets'
import { chartTypeLabels, viewLabels, metricInfo } from '@/lib/discover/constants'
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
const visibleChartTypes = ref<ChartType[]>(['weekly', 'quarterly', 'yearly', 'fluseason'])

// Available metrics based on country data
const availableMetrics = computed<Metric[]>(() => {
  const allMetrics: Metric[] = ['le', 'asd', 'asmr', 'cmr', 'deaths', 'population']
  if (!props.hasAgeData) {
    return allMetrics.filter(m => m !== 'asmr' && m !== 'asd')
  }
  return allMetrics
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

// Get available views for a metric (Population only has 'normal')
function getViewsForMetric(metric: Metric): View[] {
  if (metric === 'population') {
    return ['normal']
  }
  return [...views]
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
