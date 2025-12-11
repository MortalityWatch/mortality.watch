<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSourceDescription } from '~/lib/data'
import { getDataTypeDescription } from '~/utils'
import { usePagination } from '~/composables/usePagination'
import { useBrowserNavigation } from '~/composables/useBrowserNavigation'
import { dataLoader } from '~/lib/dataLoader'
import Papa from 'papaparse'
import type { CountryRaw } from '~/model/country'
import {
  tabs,
  mortalityColumns,
  populationColumns,
  standardColumns,
  standardSources,
  populationSources
} from '~/lib/sourcesConstants'
import { UI_CONFIG } from '~/lib/config/constants'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')

// URL state
const activeTab = ref<string>((route.query.tab as string) || 'mortality')

// Search/filter state
const searchQuery = ref('')

// Loading state
const isLoading = ref(true)
const error = ref<string | null>(null)

// Data
const products = ref<Array<{
  id: string
  iso3c: string
  jurisdiction: string
  country: string
  min_date: string
  max_date: string
  type: string
  age_groups: string
  source: string
}>>([])

// Filtered products
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value

  const query = searchQuery.value.toLowerCase()
  return products.value.filter(
    p =>
      p.iso3c.toLowerCase().includes(query)
      || p.jurisdiction.toLowerCase().includes(query)
      || p.source.toLowerCase().includes(query)
      || p.type.toLowerCase().includes(query)
  )
})

// Summary stats
const summary = computed(() => {
  const uniqueCountries = new Set(products.value.map(p => p.iso3c))
  const uniqueSources = new Set(products.value.map(p => p.source))

  return {
    totalEntries: products.value.length,
    countries: uniqueCountries.size,
    sources: uniqueSources.size
  }
})

// Pagination
const initialItemsPerPage = route.query.limit ? parseInt(route.query.limit as string) : 10
const pagination = usePagination({ items: filteredProducts, itemsPerPage: initialItemsPerPage })
const { currentPage, paginatedItems, total, startIndex, endIndex, itemsPerPage } = pagination

// Initialize page from URL
if (route.query.page) {
  currentPage.value = parseInt(route.query.page as string) || 1
}

// Items per page options
const itemsPerPageOptionsRaw = [...UI_CONFIG.PAGINATION_OPTIONS]
const itemsPerPageOptions = computed(() =>
  itemsPerPageOptionsRaw.map(x => ({ label: String(x), value: x }))
)

const selectedItemsPerPage = computed(() =>
  itemsPerPageOptions.value.find(x => x.value === itemsPerPage.value) || itemsPerPageOptions.value[0]
)

const handleItemsPerPageChange = (val: { value: number } | number) => {
  const newValue = typeof val === 'number' ? val : val.value
  itemsPerPage.value = newValue
}

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab, page: undefined } })
  currentPage.value = 1
})

// Watch for page changes and update URL
watch(currentPage, (newPage) => {
  if (newPage === 1) {
    const { page, ...rest } = route.query
    router.replace({ query: rest })
  } else {
    router.replace({ query: { ...route.query, page: String(newPage) } })
  }
})

// Watch for items per page changes and update URL
watch(itemsPerPage, (newLimit) => {
  currentPage.value = 1 // Reset to first page when changing items per page
  if (newLimit === 10) {
    // Default value, remove from URL
    const { limit, page, ...rest } = route.query
    router.replace({ query: rest })
  } else {
    const { page, ...rest } = route.query
    router.replace({ query: { ...rest, limit: String(newLimit) } })
  }
})

// Watch for search query changes and reset to page 1
watch(searchQuery, () => {
  currentPage.value = 1
})

// Handle browser back/forward navigation
// Updates tab and page state when URL changes from browser navigation
useBrowserNavigation({
  queryParams: ['tab', 'page', 'limit'],
  onNavigate: () => {
    // Sync state from URL
    activeTab.value = (route.query.tab as string) || 'mortality'
    currentPage.value = parseInt(route.query.page as string) || 1
    if (route.query.limit) {
      itemsPerPage.value = parseInt(route.query.limit as string)
    }
  },
  isReady: computed(() => !isLoading.value),
  isUpdating: isLoading
})

const { withRetry, handleError } = useErrorRecovery()

const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Fetch metadata CSV with automatic retry
    await withRetry(async () => {
      const metadataText = await dataLoader.fetchMetadata()
      const allMeta = Papa.parse(metadataText, {
        header: true,
        skipEmptyLines: true
      }).data as CountryRaw[]

      products.value = allMeta.map(r => ({
        id: `${r.iso3c}_${r.type}_${r.age_groups}`,
        iso3c: r.iso3c,
        jurisdiction: r.jurisdiction,
        country: `<div><strong>${r.jurisdiction}</strong><br/><span class="font-mono text-xs text-gray-600 dark:text-gray-400">${r.iso3c}</span></div>`,
        min_date: r.min_date.replaceAll('-', '/'),
        max_date: r.max_date.replaceAll('-', '/'),
        type: getDataTypeDescription(r.type),
        age_groups: r.age_groups,
        source: getSourceDescription(r.source)
      }))
    }, {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'loadSourcesData'
    })

    isLoading.value = false
  } catch (err) {
    handleError(err, 'Failed to load data sources. Please try again.', 'loadSourcesData')
    error.value = 'Failed to load data sources. Please try again.'
    isLoading.value = false
  }
}

const retryLoad = () => {
  error.value = null
  isLoading.value = true
  pagination.reset()
  loadData()
}

onMounted(() => loadData())

// Page metadata
definePageMeta({
  title: 'Sources'
})

// SEO metadata
useSeoMeta({
  title: 'Data Sources - Mortality Watch',
  description: 'Explore comprehensive mortality data sources from over 300+ regions, including official statistics, population data, and age-standardization references.',
  ogTitle: 'Data Sources - Mortality Watch',
  ogDescription: 'Official mortality statistics and population data sources used by Mortality Watch.',
  ogImage: '/og-image.png',
  twitterTitle: 'Data Sources - Mortality Watch',
  twitterDescription: 'Comprehensive mortality data sources from official statistical offices worldwide.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center max-w-7xl mx-auto">
      <PageHeader
        title="Data Sources & Coverage"
        max-width="xl"
      >
        <p>
          Mortality Watch aggregates data from official statistical offices and
          international organizations to provide comprehensive mortality statistics.
          We collect daily updates from over 300+ regions, ensuring
          the most current and reliable mortality data available.
        </p>

        <p>
          Our dataset includes weekly, monthly, and yearly mortality data spanning
          different age groups and time periods. Each data source is carefully
          validated and updated regularly to maintain accuracy and completeness.
          Click on the tabs below to explore our data sources for deaths, population
          statistics, and standard populations used for age-adjustment.
        </p>
      </PageHeader>

      <UCard>
        <UTabs
          v-model="activeTab"
          :items="tabs"
        >
          <template #mortality>
            <div class="p-4">
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-left">
                <strong>Coverage:</strong> This table shows all available
                mortality data sources by country/region (ISO code), date range,
                data frequency (weekly/monthly/yearly), age groups, and the
                official source organization.
              </p>

              <!-- Summary Stats -->
              <div
                v-if="!isLoading && !error"
                class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
              >
                <UCard>
                  <div class="text-center">
                    <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {{ summary.countries }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Countries/Regions
                    </p>
                  </div>
                </UCard>

                <UCard>
                  <div class="text-center">
                    <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {{ summary.sources }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Data Sources
                    </p>
                  </div>
                </UCard>

                <UCard>
                  <div class="text-center">
                    <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {{ summary.totalEntries }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total Datasets
                    </p>
                  </div>
                </UCard>
              </div>

              <!-- Search Filter -->
              <div class="mb-4">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 max-w-md">
                  <label class="text-sm font-medium whitespace-nowrap">Search</label>
                  <UInput
                    v-model="searchQuery"
                    icon="i-lucide-search"
                    placeholder="Country, ISO code, source, or type..."
                    size="sm"
                    class="flex-1"
                    :ui="{ base: 'bg-transparent border-0' }"
                  />
                </div>
              </div>

              <LoadingSpinner
                v-if="isLoading"
                text="Loading data sources..."
                size="lg"
                height="h-64"
              />

              <div
                v-else-if="error"
                class="flex justify-center items-center h-64"
              >
                <div class="text-center">
                  <UIcon
                    name="i-lucide-alert-circle"
                    class="text-red-500 text-4xl mb-2"
                  />
                  <p class="text-red-600 dark:text-red-400 mb-4">
                    {{ error }}
                  </p>
                  <UButton
                    variant="outline"
                    @click="retryLoad"
                  >
                    Retry
                  </UButton>
                </div>
              </div>

              <DataTable
                v-else
                :columns="mortalityColumns"
                :data="paginatedItems"
                row-key="id"
                :allow-html="true"
                :html-columns="['country', 'source']"
              />

              <div
                v-if="!isLoading && !error && total > 0"
                class="mt-4 flex justify-between items-center gap-4"
              >
                <div class="flex items-center gap-3">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    Showing {{ startIndex }} to {{ endIndex }} of {{ total }} entries
                  </div>
                  <USelectMenu
                    :model-value="selectedItemsPerPage"
                    :items="itemsPerPageOptions"
                    size="xs"
                    class="w-20"
                    @update:model-value="handleItemsPerPageChange"
                  />
                </div>
                <UPagination
                  v-if="total > itemsPerPage"
                  v-model:page="currentPage"
                  :total="total"
                  :items-per-page="itemsPerPage"
                />
              </div>
            </div>
          </template>

          <template #population>
            <div class="p-4">
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-left">
                <strong>Purpose:</strong> Population data is essential for
                calculating mortality rates (deaths per 100,000 population). We
                use the most authoritative sources available for each country to
                ensure accurate rate calculations.
              </p>

              <DataTable
                :columns="populationColumns"
                :data="populationSources"
                :allow-html="true"
                :html-columns="['source']"
              />
            </div>
          </template>

          <template #standard>
            <div class="p-4">
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-left">
                <strong>About Age-Standardization:</strong> Standard populations
                are reference age distributions used to calculate
                Age-Standardized Mortality Rates (ASMR). This allows fair
                comparisons between countries with different age structures by
                adjusting for population aging. We support WHO2015, ESP2013,
                US2000, and country-specific 2020 standards.
              </p>

              <DataTable
                :columns="standardColumns"
                :data="standardSources"
                :allow-html="true"
                :html-columns="['source']"
              />
            </div>
          </template>
        </UTabs>
      </UCard>

      <!-- Admin Link to Data Quality Dashboard -->
      <div
        v-if="isAdmin"
        class="mt-6"
      >
        <UCard>
          <div class="flex items-center justify-between p-4">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <UIcon
                  name="i-lucide-activity"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Data Quality Monitoring
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Monitor data freshness and staleness across all sources
                </p>
              </div>
            </div>
            <NuxtLink to="/admin/data-quality">
              <UButton
                color="primary"
                variant="solid"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              >
                View Dashboard
              </UButton>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
