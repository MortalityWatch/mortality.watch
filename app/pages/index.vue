<template>
  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-8">
    <div class="mb-12 mt-6 space-y-6 text-center">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Visualizing Global Mortality Data Since COVID-19
      </h1>
      <p class="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
        MortalityWatch provides comprehensive mortality analysis tools with daily
        updates from over 100 countries. Explore excess deaths, compare regions,
        analyze trends by age groups, and understand the true impact of global
        health events.
      </p>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
        Free, open-source, and transparent. All data from official government
        sources. Used by researchers, journalists, and policymakers worldwide.
      </p>
      <div class="flex items-center justify-center gap-4 mt-8">
        <NuxtLink to="/explorer">
          <UButton
            label="Explore Data"
            icon="i-lucide-bar-chart-2"
            trailing
            size="lg"
            color="primary"
          />
        </NuxtLink>
        <NuxtLink to="/about">
          <UButton
            label="Learn More"
            icon="i-lucide-info"
            trailing
            size="lg"
            variant="outline"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Showcase Gallery -->
    <div class="mb-12">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Featured Visualizations
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Click any chart below to explore interactive versions with your own
          customizations
        </p>
      </div>

      <!-- Loading state -->
      <LoadingSpinner
        v-if="isLoading"
        text="Loading visualizations..."
        size="lg"
        height="h-64"
      />

      <!-- Charts grid -->
      <div
        v-else-if="featuredCharts.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <ChartsChartCard
          v-for="chart of featuredCharts"
          :key="chart.id"
          :chart="chart"
          variant="homepage"
        />
      </div>

      <!-- View All Button -->
      <div
        v-if="featuredCharts.length > 0"
        class="text-center mt-8"
      >
        <UButton
          to="/charts"
          color="neutral"
          variant="outline"
          size="lg"
        >
          View All Charts
          <Icon
            name="i-lucide-arrow-right"
            class="w-4 h-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Key Features Section -->
    <div class="mb-12">
      <UCard class="max-w-5xl mx-auto">
        <template #header>
          <h2 class="text-2xl font-bold text-center">
            Why Choose MortalityWatch?
          </h2>
        </template>
        <div class="grid gap-8 md:grid-cols-3">
          <div class="text-center">
            <UIcon
              name="i-lucide-database"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Comprehensive Data
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Weekly, monthly, and yearly mortality data from 100+ countries
              with age stratification
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-refresh-cw"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Daily Updates
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Automatic data collection from official sources ensures the latest
              statistics
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-trending-up"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Advanced Analysis
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Multiple baseline methods, moving averages, and age-standardized
              rates
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Upgrade Card -->
    <div class="mb-8">
      <UpgradeCard />
    </div>
  </div>
</template>

<script setup lang="ts">
interface FeaturedChart {
  id: number
  name: string
  description: string | null
  slug: string | null
  chartType: 'explorer' | 'ranking'
  chartState: string
  thumbnailUrl: string | null
  isFeatured: boolean
  isPublic?: boolean
  viewCount: number
  createdAt: number
  updatedAt: number
  authorName: string
}

// Fetch featured charts from API
const { data, pending: isLoading } = await useFetch<{
  charts: FeaturedChart[]
}>('/api/charts', {
  query: {
    featured: 'true',
    sort: 'featured',
    limit: 6
  }
})

const featuredCharts = computed(() => data.value?.charts || [])

// Page metadata
definePageMeta({
  title: 'Home'
})

// SEO metadata
useSeoMeta({
  title: 'MortalityWatch - Global Mortality Data Visualization',
  description: 'Comprehensive mortality analysis tools with daily updates from over 100 countries. Explore excess deaths, compare regions, and understand the impact of global health events.',
  ogTitle: 'MortalityWatch - Visualizing Global Mortality Data',
  ogDescription: 'Free, open-source platform for analyzing mortality data worldwide.',
  ogImage: '/og-image.png',
  twitterTitle: 'MortalityWatch',
  twitterDescription: 'Visualizing global mortality data since COVID-19',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
