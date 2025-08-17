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
          v-model="selectedTab"
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

              <div
                v-if="isLoading"
                class="flex justify-center items-center h-64"
              >
                <div class="text-center">
                  <UIcon
                    name="i-lucide-loader-2"
                    class="animate-spin text-4xl mb-2"
                  />
                  <p class="text-gray-600 dark:text-gray-400">
                    Loading data sources...
                  </p>
                </div>
              </div>

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

              <div
                v-else
                class="overflow-x-auto"
              >
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ISO
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        FROM
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        UNTIL
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        TYPE
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        AGES
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SOURCE
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr
                      v-for="(product, index) in paginatedProducts"
                      :key="product.id"
                      :class="index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ product.iso3c }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ product.min_date }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ product.max_date }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ product.type }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ product.age_groups }}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                        v-html="product.source"
                      />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="!isLoading && !error && products.length > rowsPerPage"
                class="mt-4 flex justify-between items-center"
              >
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Showing {{ (currentPage - 1) * rowsPerPage + 1 }} to {{ Math.min(currentPage * rowsPerPage, products.length) }} of {{ products.length }} entries
                </div>
                <UPagination
                  v-model="currentPage"
                  :page-count="rowsPerPage"
                  :total="products.length"
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

              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        COUNTRY
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SOURCE
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr
                      v-for="(source, index) in populationSources"
                      :key="index"
                      :class="index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ source.country }}
                      </td>
                      <td
                        class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                        v-html="source.source"
                      />
                    </tr>
                  </tbody>
                </table>
              </div>
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

              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SOURCE
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <a
                          href="https://seer.cancer.gov/stdpopulations/stdpop.19ages.html"
                          target="_blank"
                          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >SEER</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </UTabs>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Tab configuration
const selectedTab = ref(0)
const tabs = [
  {
    key: 'mortality',
    label: 'Mortality Data'
  },
  {
    key: 'population',
    label: 'Population Data'
  },
  {
    key: 'standard',
    label: 'Standard Populations'
  }
]

// Loading state
const isLoading = ref(true)
const error = ref<string | null>(null)

// Pagination
const currentPage = ref(1)
const rowsPerPage = 25

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

const populationSources = [
  {
    country: 'USA',
    source: '<a href="https://www2.census.gov/programs-surveys/popest/datasets/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Census.gov</a>'
  },
  {
    country: 'Canada',
    source: '<a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000501" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Statistics Canada</a>'
  },
  {
    country: 'DEU (2000-2022)',
    source: 'Statistisches Bundesamt: <a href="https://www-genesis.destatis.de/genesis//online?operation=table&code=12411-0005&bypass=true&levelindex=1&levelid=1686002630001#abreadcrumb" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">1</a> | <a href="https://www-genesis.destatis.de/genesis//online?operation=table&code=12411-0012&bypass=true&levelindex=1&levelid=1686002711178#abreadcrumb" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">2</a>'
  },
  {
    country: 'Countries from Eurostat',
    source: '<a href="https://ec.europa.eu/eurostat/databrowser/view/DEMO_PJAN/default/table?lang=en" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Eurostat</a>'
  },
  {
    country: 'Countries from "Human Mortality Database (STMF)"',
    source: 'Data provided in dataset.'
  },
  {
    country: 'All other countries',
    source: '<a href="https://population.un.org/wpp/Download/Standard/MostUsed/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">UN World Population Prospects 2022</a>'
  }
]

// Computed property for paginated data
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage
  const end = start + rowsPerPage
  return products.value.slice(start, end)
})

// Mock data loading function
const loadData = async () => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock data - in a real app, this would come from an API
    products.value = [
      { id: 'USA_1_all', iso3c: 'USA', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.cdc.gov/nchs/nvss/vsrr/covid19/excess_deaths.htm" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">CDC NVSS</a>' },
      { id: 'GBR_1_all', iso3c: 'GBR', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.ons.gov.uk/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">ONS</a>' },
      { id: 'DEU_2_all', iso3c: 'DEU', min_date: '2020/01/01', max_date: '2024/12/31', type: 'monthly', age_groups: 'all', source: '<a href="https://www.destatis.de/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Destatis</a>' },
      { id: 'FRA_1_all', iso3c: 'FRA', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.insee.fr/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">INSEE</a>' },
      { id: 'ITA_1_all', iso3c: 'ITA', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.istat.it/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">ISTAT</a>' },
      { id: 'ESP_1_all', iso3c: 'ESP', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.ine.es/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">INE</a>' },
      { id: 'CAN_2_all', iso3c: 'CAN', min_date: '2020/01/01', max_date: '2024/12/31', type: 'monthly', age_groups: 'all', source: '<a href="https://www.statcan.gc.ca/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Statistics Canada</a>' },
      { id: 'AUS_1_all', iso3c: 'AUS', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.abs.gov.au/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">ABS</a>' },
      { id: 'JPN_2_all', iso3c: 'JPN', min_date: '2020/01/01', max_date: '2024/12/31', type: 'monthly', age_groups: 'all', source: '<a href="https://www.stat.go.jp/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Statistics Japan</a>' },
      { id: 'NLD_1_all', iso3c: 'NLD', min_date: '2020/01/01', max_date: '2024/12/31', type: 'weekly', age_groups: 'all', source: '<a href="https://www.cbs.nl/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">CBS</a>' }
    ]

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
  currentPage.value = 1
  loadData()
}

onMounted(() => {
  loadData()
})

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
