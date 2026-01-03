<template>
  <div class="space-y-6">
    <!-- Search -->
    <div>
      <UInput
        v-model="searchQuery"
        placeholder="Search countries..."
        icon="i-lucide-search"
        size="lg"
        class="w-full max-w-md"
      />
    </div>

    <!-- Popular Countries -->
    <div v-if="!searchQuery">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Popular
      </h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="country in popularCountriesData"
          :key="country.iso3c"
          :to="`/discover/country/${country.iso3c}`"
        >
          <UButton
            variant="outline"
            size="sm"
          >
            <span class="mr-1">{{ getFlagEmoji(country.iso3c) }}</span>
            {{ formatJurisdictionName(country.jurisdiction) }}
          </UButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Region Buttons -->
    <div v-if="!searchQuery">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Browse by Region
      </h3>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="region in regions"
          :key="region.value"
          variant="outline"
          size="sm"
          @click="selectedRegion = region.value"
        >
          {{ region.label }}
        </UButton>
      </div>
    </div>

    <!-- Search Results or Region Countries -->
    <div v-if="searchQuery || selectedRegion">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          <template v-if="searchQuery">
            Search Results ({{ filteredCountries.length }})
          </template>
          <template v-else>
            {{ selectedRegionLabel }} ({{ filteredCountries.length }})
          </template>
        </h3>
        <UButton
          v-if="selectedRegion"
          variant="ghost"
          size="xs"
          @click="selectedRegion = ''"
        >
          Clear
        </UButton>
      </div>
      <div
        v-if="filteredCountries.length > 0"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        <NuxtLink
          v-for="country in filteredCountries"
          :key="country.iso3c"
          :to="`/discover/country/${country.iso3c}`"
        >
          <UCard class="hover:shadow-md transition-shadow cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 p-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ getFlagEmoji(country.iso3c) }}</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ formatJurisdictionName(country.jurisdiction) }}
              </span>
            </div>
          </UCard>
        </NuxtLink>
      </div>
      <div
        v-else
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        No countries found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Country } from '@/model'
import { popularCountries } from '@/lib/discover/constants'
import { getFlagEmoji, isSubNationalRegion, formatJurisdictionName } from '@/lib/discover/countryUtils'
import { useJurisdictionFilter } from '@/composables/useJurisdictionFilter'

interface Props {
  countries: Country[]
}

const props = defineProps<Props>()

const searchQuery = ref('')
const selectedRegion = ref('')

const { shouldShowCountry } = useJurisdictionFilter()

// Region options (subset for browsing)
const regions = [
  { label: 'Europe', value: 'eu' },
  { label: 'EU27', value: 'eu27' },
  { label: 'North America', value: 'na' },
  { label: 'Asia', value: 'as' },
  { label: 'South America', value: 'sa' },
  { label: 'Oceania', value: 'oc' },
  { label: 'Africa', value: 'af' },
  { label: 'U.S. States', value: 'usa' },
  { label: 'German States', value: 'deu' },
  { label: 'Canadian Provinces', value: 'can' }
]

const selectedRegionLabel = computed(() => {
  const region = regions.find(r => r.value === selectedRegion.value)
  return region?.label || ''
})

// Get popular countries data
const popularCountriesData = computed(() => {
  return popularCountries
    .map(iso => props.countries.find(c => c.iso3c === iso))
    .filter(Boolean) as Country[]
})

// Filter countries based on search or region
const filteredCountries = computed(() => {
  let result = props.countries

  // Filter out sub-national regions for general browsing
  if (!selectedRegion.value || !['usa', 'deu', 'can'].includes(selectedRegion.value)) {
    result = result.filter(c => !isSubNationalRegion(c.iso3c))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.jurisdiction.toLowerCase().includes(query)
      || c.iso3c.toLowerCase().includes(query)
    )
  } else if (selectedRegion.value) {
    result = result.filter(c => shouldShowCountry(c.iso3c, selectedRegion.value))
  }

  return result.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction))
})
</script>
