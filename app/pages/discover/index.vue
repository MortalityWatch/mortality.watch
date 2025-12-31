<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Discover Mortality Data
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Explore mortality data across countries and metrics with pre-configured chart settings.
        Choose to browse by metric or by country.
      </p>
    </div>

    <!-- Two main options -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <!-- By Metric -->
      <NuxtLink
        to="/discover/metric"
        class="block"
      >
        <UCard class="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-500 dark:hover:border-primary-400">
          <div class="text-center py-8">
            <div class="mb-4">
              <Icon
                name="i-lucide-bar-chart-3"
                class="w-16 h-16 mx-auto text-primary-500"
              />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Explore by Metric
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Choose a metric (ASMR, Deaths, Life Expectancy, etc.) and see all countries for that configuration.
            </p>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              80 chart configurations across 6 metrics
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <!-- By Country -->
      <NuxtLink
        to="/discover/country"
        class="block"
      >
        <UCard class="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-500 dark:hover:border-primary-400">
          <div class="text-center py-8">
            <div class="mb-4">
              <Icon
                name="i-lucide-globe"
                class="w-16 h-16 mx-auto text-primary-500"
              />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Explore by Country
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Choose a country and see all available metrics and chart types for that jurisdiction.
            </p>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              180+ countries and regions
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Quick stats -->
    <div class="mt-12 text-center">
      <div class="inline-flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <Icon
            name="i-lucide-layers"
            class="w-4 h-4"
          />
          <span>6 Metrics</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon
            name="i-lucide-calendar"
            class="w-4 h-4"
          />
          <span>5 Time Periods</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon
            name="i-lucide-eye"
            class="w-4 h-4"
          />
          <span>3 View Modes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Discover - Mortality Watch',
  description: 'Explore mortality data by metric or country with pre-configured chart settings',
  ogTitle: 'Discover Mortality Data - Mortality Watch',
  ogDescription: 'Explore mortality data by metric or country with pre-configured chart settings'
})
</script>
