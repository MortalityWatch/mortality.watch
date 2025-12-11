<template>
  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-8">
    <div class="mb-12 mt-6 space-y-6 text-center">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Track Global Mortality Trends and Excess Deaths
      </h1>
      <p class="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
        The world's most comprehensive open mortality database with 300+ regions and historical data from 1950 onwards.
        Explore excess deaths, compare regions, analyze trends by age groups, and understand the true impact of global health events.
      </p>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
        Free, open-source, and transparent. All data from official government sources.
        Used by researchers, journalists, and policymakers worldwide.
      </p>

      <!-- Trust Indicators -->
      <div class="flex flex-wrap items-center justify-center gap-4 pt-6 pb-4">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 rounded-full border border-primary-200 dark:border-primary-800">
          <UIcon
            name="i-lucide-globe"
            class="w-4 h-4 text-primary-600 dark:text-primary-400"
          />
          <span class="text-sm font-semibold text-primary-900 dark:text-primary-100">300+ Regions</span>
        </div>
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 rounded-full border border-primary-200 dark:border-primary-800">
          <UIcon
            name="i-lucide-code"
            class="w-4 h-4 text-primary-600 dark:text-primary-400"
          />
          <span class="text-sm font-semibold text-primary-900 dark:text-primary-100">Open Source & Transparent</span>
        </div>
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 rounded-full border border-primary-200 dark:border-primary-800">
          <UIcon
            name="i-lucide-refresh-cw"
            class="w-4 h-4 text-primary-600 dark:text-primary-400"
          />
          <span class="text-sm font-semibold text-primary-900 dark:text-primary-100">Updated Daily</span>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
        <UButton
          to="/explorer"
          label="Explore Data"
          icon="i-lucide-line-chart"
          trailing
          size="xl"
          color="primary"
        />
        <UButton
          to="/about"
          label="Learn More"
          icon="i-lucide-info"
          trailing
          size="lg"
          variant="outline"
          color="neutral"
        />
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
          :is-owner="false"
          :is-admin="false"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!isLoading && featuredCharts.length === 0"
        class="text-center py-12"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
        />
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No featured charts yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Check out the Explorer to create your first visualization!
        </p>
        <UButton
          to="/explorer"
          color="primary"
          size="lg"
        >
          Go to Explorer
          <UIcon
            name="i-lucide-arrow-right"
            class="w-4 h-4"
          />
        </UButton>
      </div>

      <!-- Error state -->
      <div
        v-else-if="!isLoading && !featuredCharts.length"
        class="text-center py-12"
      >
        <UIcon
          name="i-lucide-alert-circle"
          class="w-16 h-16 mx-auto text-red-400 dark:text-red-600 mb-4"
        />
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Error loading charts
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Please try refreshing the page
        </p>
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
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div class="text-center">
            <UIcon
              name="i-lucide-globe"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              300+ Countries & Regions
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Weekly, monthly, and yearly mortality data with age stratification
              from official government sources
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-chart-line"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Five Baseline Methods
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Last value, average, median, linear regression, and ETS for
              accurate excess mortality calculations
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-download"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Export Charts & Data
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Download visualizations as PNG and data as CSV/JSON (free account required for data export)
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-code"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Open Source & Transparent
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Fully open-source codebase with transparent methodology. All data processing
              and calculations are publicly auditable
            </p>
            <UButton
              to="https://github.com/akarlsten/mortality.watch"
              target="_blank"
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-lucide-github"
            >
              View on GitHub
            </UButton>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-refresh-cw"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Daily Automatic Updates
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Data is automatically fetched and updated daily from official government
              statistical agencies worldwide
            </p>
          </div>
          <div class="text-center">
            <UIcon
              name="i-lucide-shield-check"
              class="text-5xl mb-4 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold mb-2">
              Trusted by Researchers
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Used by academics, journalists, and policymakers for
              evidence-based analysis and reporting
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
  chartConfig: string // Query string (e.g., "c=SWE&c=DEU&ct=yearly")
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
  title: 'MortalityWatch - Track Global Mortality Trends and Excess Deaths',
  description: 'The world\'s most comprehensive open mortality database with daily updates from 300+ countries and regions. Explore excess deaths, compare regions, and analyze trends with Five Baseline Methods.',
  ogTitle: 'MortalityWatch - Track Global Mortality Trends',
  ogDescription: 'Free, open-source platform with 300+ regions, Five Baseline Methods, and daily updates from official sources.',
  ogImage: '/og-image.png',
  twitterTitle: 'MortalityWatch - Global Mortality Database',
  twitterDescription: 'Track mortality trends and excess deaths across 300+ countries and regions with advanced statistical analysis.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
