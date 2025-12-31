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
            :to="getExplorerUrl(chartType, view)"
            class="block"
          >
            <UCard class="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <!-- Thumbnail -->
              <div
                class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 mb-3"
                style="aspect-ratio: 16/9"
              >
                <ClientOnly>
                  <img
                    :src="getThumbnailUrl(chartType, view)"
                    :alt="`${countryName} ${chartTypeLabels[chartType]} ${viewLabels[view]}`"
                    class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
                    loading="lazy"
                  >
                  <template #fallback>
                    <div class="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700" />
                  </template>
                </ClientOnly>
              </div>

              <!-- Label -->
              <div class="text-center">
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ viewLabels[view] }}
                </span>
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
import { chartTypeLabels, viewLabels } from '@/lib/discover/constants'

interface Props {
  metric: Metric
  country: string
  countryName: string
}

const props = defineProps<Props>()
const colorMode = useColorMode()

// Get available views for a metric (Population only has 'normal')
function getViewsForMetric(m: Metric): View[] {
  if (m === 'population') {
    return ['normal']
  }
  return [...views]
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
