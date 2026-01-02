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
        <template
          v-for="view in getViewsForMetric(metric)"
          :key="`${chartType}-${view}`"
        >
          <NuxtLink
            :to="getCardUrl(chartType, view)"
            class="block"
          >
            <UCard
              class="h-full transition-shadow cursor-pointer"
              :class="isLocked(view) ? 'opacity-60' : 'hover:shadow-lg'"
            >
              <!-- Thumbnail -->
              <DiscoverThumbnail
                :src="getThumbnailUrl(chartType, view)"
                :locked-src="getThumbnailUrl(chartType, 'normal')"
                :alt="`${countryName} ${chartTypeLabels[chartType]} ${viewLabels[view]}`"
                :locked="isLocked(view)"
                class="mb-3"
              />

              <!-- Label -->
              <div class="text-center flex items-center justify-center gap-2">
                <Icon
                  :name="viewIcons[view]"
                  class="w-4 h-4 text-primary-600 dark:text-primary-400"
                />
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ viewLabels[view] }}
                </span>
                <UBadge
                  v-if="isLocked(view)"
                  color="primary"
                  variant="soft"
                  size="xs"
                >
                  Pro
                </UBadge>
              </div>
            </UCard>
          </NuxtLink>
        </template>
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
