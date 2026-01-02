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

    <!-- Three main options -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

      <!-- Browse All Charts (Pro Feature) -->
      <NuxtLink
        :to="can('BROWSE_ALL_CHARTS') ? '/charts/browse' : getFeatureUpgradeUrl('BROWSE_ALL_CHARTS')"
        class="block"
      >
        <UCard
          class="h-full transition-shadow"
          :class="can('BROWSE_ALL_CHARTS')
            ? 'hover:shadow-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400'
            : 'opacity-60 cursor-pointer'"
        >
          <div class="text-center py-8">
            <div class="mb-4 relative w-fit mx-auto">
              <Icon
                name="i-lucide-library"
                class="w-16 h-16 mx-auto"
                :class="can('BROWSE_ALL_CHARTS') ? 'text-primary-500' : 'text-gray-400'"
              />
              <UIcon
                v-if="!can('BROWSE_ALL_CHARTS')"
                name="i-heroicons-lock-closed"
                class="absolute -top-1 -right-1 text-gray-500 size-5"
              />
            </div>
            <div class="flex items-center justify-center gap-2 mb-2">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Chart History
              </h2>
              <UBadge
                v-if="!can('BROWSE_ALL_CHARTS')"
                color="primary"
                variant="soft"
                size="xs"
              >
                Pro
              </UBadge>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Browse all chart variants ever created on the platform, sorted by popularity or date.
            </p>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Every chart ever generated
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
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

useSeoMeta({
  title: 'Discover - Mortality Watch',
  description: 'Explore mortality data by metric or country with pre-configured chart settings',
  ogTitle: 'Discover Mortality Data - Mortality Watch',
  ogDescription: 'Explore mortality data by metric or country with pre-configured chart settings'
})
</script>
