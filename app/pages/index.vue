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
        <UCard
          v-for="chart of featuredCharts"
          :key="chart.id"
          class="hover:shadow-lg transition-shadow"
        >
          <template #header>
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold flex-1">
                {{ chart.name }}
              </h3>
              <UBadge
                color="primary"
                variant="subtle"
                size="sm"
              >
                Featured
              </UBadge>
            </div>
          </template>
          <div class="space-y-3">
            <p
              v-if="chart.description"
              class="text-gray-600 dark:text-gray-400 text-sm"
            >
              {{ chart.description }}
            </p>
            <div
              class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
              style="aspect-ratio: 16/9"
            >
              <NuxtLink :to="getChartUrl(chart)">
                <img
                  :src="getChartImageUrl(chart)"
                  :alt="chart.name"
                  class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                >
              </NuxtLink>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                <Icon
                  name="i-lucide-user"
                  class="w-3 h-3 inline"
                />
                {{ chart.authorName }}
              </span>
              <span>
                <Icon
                  name="i-lucide-eye"
                  class="w-3 h-3 inline"
                />
                {{ chart.viewCount }} views
              </span>
            </div>
          </div>
        </UCard>
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

    <!-- Upgrade Card -->
    <div class="mb-12">
      <UpgradeCard />
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

    <!-- Donation Section -->
    <div class="mb-8">
      <UCard
        id="donate"
        class="max-w-lg mx-auto text-center"
      >
        <template #header>
          <h2 class="text-xl font-bold">
            Keep MortalityWatch Free for Everyone
          </h2>
        </template>
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Your support helps maintain our servers, develop new features, and
            keep this vital public health resource accessible to all.
          </p>
          <NuxtLink to="/donate">
            <UButton
              icon="i-lucide-heart"
              label="Support Our Work"
              size="lg"
              color="primary"
            />
          </NuxtLink>
        </div>
      </UCard>
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
  viewCount: number
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

// Get chart URL for navigation
function getChartUrl(chart: FeaturedChart) {
  // Link directly to the chart detail page
  return `/charts/${chart.slug}`
}

// Get chart image URL for rendering
function getChartImageUrl(chart: FeaturedChart) {
  try {
    const state = JSON.parse(chart.chartState)
    const params = new URLSearchParams()

    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    })

    return `/chart.png?${params.toString()}&width=800&height=450`
  } catch (err) {
    console.error('Failed to parse chart state:', err)
    return chart.thumbnailUrl || '/placeholder-chart.png'
  }
}

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
