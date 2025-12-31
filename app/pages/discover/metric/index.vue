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
        <span class="text-gray-900 dark:text-gray-100">Choose Metric</span>
      </nav>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Explore by Metric
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Select a metric to see all available chart configurations
      </p>
    </div>

    <!-- Metric Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="metric in metrics"
        :key="metric"
        :to="`/discover/metric/${metric}`"
        class="block"
      >
        <UCard class="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-500 dark:hover:border-primary-400">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Icon
                  :name="metricInfo[metric].icon"
                  class="w-6 h-6 text-primary-600 dark:text-primary-400"
                />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {{ metricInfo[metric].label }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ metricInfo[metric].description }}
              </p>
              <div class="flex items-center gap-2">
                <UBadge
                  color="primary"
                  variant="subtle"
                  size="xs"
                >
                  {{ getPresetCountByMetric(metric) }} charts
                </UBadge>
              </div>
            </div>
            <div class="flex-shrink-0">
              <Icon
                name="i-lucide-chevron-right"
                class="w-5 h-5 text-gray-400"
              />
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Total count -->
    <div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Total: 80 chart configurations
    </div>
  </div>
</template>

<script setup lang="ts">
import { metrics, getPresetCountByMetric } from '@/lib/discover/presets'
import { metricInfo } from '@/lib/discover/constants'

useSeoMeta({
  title: 'Explore by Metric - Mortality Watch',
  description: 'Choose a metric to explore mortality data across all countries',
  ogTitle: 'Explore by Metric - Mortality Watch',
  ogDescription: 'Choose a metric to explore mortality data across all countries'
})
</script>
