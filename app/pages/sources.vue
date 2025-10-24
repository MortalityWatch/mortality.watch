<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadCountryMetadataFlat, getSourceDescription } from '~/data'
import { getDataTypeDescription } from '~/utils'
import { usePagination } from '~/composables/usePagination'
import {
  tabs,
  mortalityColumns,
  populationColumns,
  standardColumns,
  standardSources,
  populationSources
} from '~/lib/sourcesConstants'

const route = useRoute()
const router = useRouter()

// URL state
const activeTab = ref<string>((route.query.tab as string) || 'mortality')

// Loading state
const isLoading = ref(true)
const error = ref<string | null>(null)

// Data
const products = ref<Array<{
  id: string
  iso3c: string
  min_date: string
  max_date: string
  type: string
  age_groups: string
  source: string
}>>([])

// Pagination
const pagination = usePagination({ items: products })
const { currentPage, paginatedItems, total, startIndex, endIndex, itemsPerPage } = pagination

// Initialize page from URL
if (route.query.page) {
  currentPage.value = parseInt(route.query.page as string) || 1
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

const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Load all metadata, then filter client-side
    const allMeta = await loadCountryMetadataFlat()
    const { filterCountries } = useCountryFilter()
    const meta = filterCountries.length > 0
      ? allMeta.filter(obj => filterCountries.includes(obj.iso3c))
      : allMeta
    products.value = meta.map(r => ({
      id: `${r.iso3c}_${r.type}_${r.age_groups}`,
      iso3c: r.iso3c,
      min_date: r.min_date.replaceAll('-', '/'),
      max_date: r.max_date.replaceAll('-', '/'),
      type: getDataTypeDescription(r.type),
      age_groups: r.age_groups,
      source: getSourceDescription(r.source)
    }))
    isLoading.value = false
  } catch (err) {
    console.error('Failed to load country metadata:', err)
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
  description: 'Explore comprehensive mortality data sources from over 100 countries, including official statistics, population data, and age-standardization references.',
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
      <h1 class="text-4xl font-bold mb-6">
        Data Sources & Coverage
      </h1>

      <div class="space-y-4">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Mortality Watch aggregates data from official statistical offices and
          international organizations to provide comprehensive mortality statistics.
          We collect daily updates from over 100 countries and territories, ensuring
          the most current and reliable mortality data available.
        </p>

        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Our dataset includes weekly, monthly, and yearly mortality data spanning
          different age groups and time periods. Each data source is carefully
          validated and updated regularly to maintain accuracy and completeness.
          Click on the tabs below to explore our data sources for deaths, population
          statistics, and standard populations used for age-adjustment.
        </p>
      </div>

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
                :html-columns="['source']"
              />

              <div
                v-if="!isLoading && !error && total > itemsPerPage"
                class="mt-4 flex justify-between items-center"
              >
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Showing {{ startIndex }} to {{ endIndex }} of {{ total }} entries
                </div>
                <UPagination
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
    </div>
  </div>
</template>
