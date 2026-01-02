<template>
  <div class="py-4 space-y-8">
    <div
      v-for="chartType in chartTypes"
      :key="chartType"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ chartTypeLabels[chartType] }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ChartsThumbnailCard
          v-for="view in getViewsForMetric(metric)"
          :key="`${chartType}-${view}`"
          :to="getCardUrl(chartType, view)"
          :thumbnail-url="getThumbnailUrl(chartType, view)"
          :locked-thumbnail-url="getThumbnailUrl(chartType, 'normal')"
          :alt="`${countryName} ${chartTypeLabels[chartType]} ${viewLabels[view]}`"
          :label="viewLabels[view]"
          :icon="viewIcons[view]"
          :locked="isLocked(view)"
        />
      </div>
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
import { chartTypeLabels, viewLabels, viewIcons } from '@/lib/discover/constants'
import type { FeatureKey } from '@/lib/featureFlags'

interface Props {
  metric: Metric
  country: string
  countryName: string
}

const props = defineProps<Props>()
const colorMode = useColorMode()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Check if a view is a Pro feature
function isProFeature(view: View): boolean {
  return view === 'zscore'
}

// Get the feature key for a Pro feature (only called for pro views)
function getFeatureKey(): FeatureKey {
  // zscore is the only pro feature view
  return 'Z_SCORES'
}

// Check if view is locked for current user
function isLocked(view: View): boolean {
  return isProFeature(view) && !can(getFeatureKey())
}

// Get available views for a metric (Population only has 'normal')
function getViewsForMetric(m: Metric): View[] {
  if (m === 'population') {
    return ['normal']
  }
  return [...views]
}

// Get card URL - explorer if unlocked, upgrade if locked
function getCardUrl(chartType: ChartType, view: View): string {
  if (isLocked(view)) {
    return getFeatureUpgradeUrl(getFeatureKey())
  }
  return getExplorerUrl(chartType, view)
}

// Get explorer URL for a preset
function getExplorerUrl(chartType: ChartType, view: View): string {
  const preset = getPresetById(`${props.metric}-${chartType}-${view}`)
  if (!preset) return '/explorer'
  return presetToExplorerUrl(preset, props.country)
}

// Get thumbnail URL for a preset
function getThumbnailUrl(chartType: ChartType, view: View): string {
  const preset = getPresetById(`${props.metric}-${chartType}-${view}`)
  if (!preset) return ''
  return presetToThumbnailUrl(preset, props.country, {
    darkMode: colorMode.value === 'dark'
  })
}
</script>
