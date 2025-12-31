<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <nav
        aria-label="Breadcrumb"
        class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap"
      >
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
        <NuxtLink
          to="/discover/metric"
          class="hover:text-primary-500"
        >
          Metric
        </NuxtLink>
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <NuxtLink
          :to="`/discover/metric/${metric}`"
          class="hover:text-primary-500"
        >
          {{ metricLabel }}
        </NuxtLink>
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <span
          aria-current="page"
          class="text-gray-900 dark:text-gray-100"
        >{{ presetLabel }}</span>
      </nav>
    </div>

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {{ metricLabel }} - {{ presetLabel }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Select a country to view the chart in explorer
      </p>
    </div>

    <!-- Region Filter -->
    <div class="mb-6">
      <DiscoverRegionFilter v-model="selectedRegion" />
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      text="Loading countries..."
      size="lg"
      height="h-64"
    />

    <!-- Error State -->
    <UCard
      v-else-if="loadError"
      class="text-center py-12"
    >
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="text-red-500 size-12 mx-auto mb-4"
      />
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        {{ loadError }}
      </p>
      <UButton
        color="primary"
        @click="$router.go(0)"
      >
        Retry
      </UButton>
    </UCard>

    <!-- Country Grid -->
    <div
      v-else-if="currentPreset && paginatedCountries.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <DiscoverCountryChartCard
        v-for="country in paginatedCountries"
        :key="country.iso3c"
        :preset="currentPreset"
        :country="country.iso3c"
        :country-name="country.jurisdiction"
      />
    </div>

    <!-- Empty State -->
    <UCard v-else>
      <div class="text-center py-12">
        <Icon
          name="i-lucide-globe"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No countries found
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          No countries match the selected filter
        </p>
      </div>
    </UCard>

    <!-- Pagination -->
    <div
      v-if="totalCountries > itemsPerPage"
      class="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4"
    >
      <span class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ startIndex + 1 }}-{{ Math.min(startIndex + itemsPerPage, totalCountries) }}
        of {{ totalCountries }} countries
      </span>
      <UPagination
        v-model="currentPage"
        :total="totalCountries"
        :page-count="itemsPerPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Country } from '@/model'
import { loadCountryMetadata } from '@/lib/data/queries'
import {
  type Metric,
  isValidMetric,
  getPresetById,
  parsePresetId
} from '@/lib/discover/presets'
import {
  metricInfo,
  chartTypeLabels,
  viewLabels
} from '@/lib/discover/constants'
import { isSubNationalRegion } from '@/lib/discover/countryUtils'
import { useJurisdictionFilter } from '@/composables/useJurisdictionFilter'

const route = useRoute()
const router = useRouter()

// Get route params
const metric = computed(() => route.params.metric as string)
const presetParam = computed(() => route.params.preset as string)

// Parse preset ID (format: chartType-view, e.g., 'weekly-excess')
const presetId = computed(() => `${metric.value}-${presetParam.value}`)
const currentPreset = computed(() => getPresetById(presetId.value))

// Validate params
onMounted(() => {
  if (!isValidMetric(metric.value)) {
    router.replace('/discover/metric')
    return
  }
  if (!currentPreset.value) {
    router.replace(`/discover/metric/${metric.value}`)
  }
})

// Labels
const metricLabel = computed(() => {
  if (!isValidMetric(metric.value)) return ''
  return metricInfo[metric.value as Metric].label
})

const presetLabel = computed(() => {
  const parsed = parsePresetId(presetId.value)
  if (!parsed) return ''
  return `${chartTypeLabels[parsed.chartType]} ${viewLabels[parsed.view]}`
})

// State
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const allCountries = ref<Country[]>([])
const selectedRegion = ref('all')
const currentPage = ref(1)
const itemsPerPage = 24

// Load countries
const { shouldShowCountry } = useJurisdictionFilter()

onMounted(async () => {
  try {
    const metadata = await loadCountryMetadata()
    allCountries.value = Object.values(metadata)
  } catch (error) {
    loadError.value = 'Failed to load countries. Please try again.'
    console.error('Failed to load country metadata:', error)
  } finally {
    isLoading.value = false
  }
})

// Check if metric requires age-stratified data (ASMR or ASD)
const requiresAgeData = computed(() => {
  return metric.value === 'asmr' || metric.value === 'asd'
})

// Filtered countries based on region and data availability
const filteredCountries = computed(() => {
  let result = allCountries.value

  // Filter by age-stratified data availability for ASMR/ASD
  if (requiresAgeData.value) {
    result = result.filter(c => c.has_asmr())
  }

  if (selectedRegion.value === 'all') {
    // Show all countries but exclude sub-national regions by default
    return result.filter(c => !isSubNationalRegion(c.iso3c))
  }
  return result.filter(c =>
    shouldShowCountry(c.iso3c, selectedRegion.value)
  )
})

// Sort countries alphabetically
const sortedCountries = computed(() => {
  return [...filteredCountries.value].sort((a, b) =>
    a.jurisdiction.localeCompare(b.jurisdiction)
  )
})

// Pagination
const totalCountries = computed(() => sortedCountries.value.length)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)

const paginatedCountries = computed(() => {
  return sortedCountries.value.slice(startIndex.value, startIndex.value + itemsPerPage)
})

// Reset to page 1 when filter changes
watch(selectedRegion, () => {
  currentPage.value = 1
})

// SEO
useSeoMeta({
  title: () => `${metricLabel.value} ${presetLabel.value} - Mortality Watch`,
  description: () => `Explore ${metricLabel.value} ${presetLabel.value} charts for all countries`,
  ogTitle: () => `${metricLabel.value} ${presetLabel.value} - Mortality Watch`,
  ogDescription: () => `Explore ${metricLabel.value} ${presetLabel.value} charts for all countries`
})
</script>
