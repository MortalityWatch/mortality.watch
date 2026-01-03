<template>
  <div class="w-full px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <nav
        aria-label="Breadcrumb"
        class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
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
          to="/discover/country"
          class="hover:text-primary-500"
        >
          Country
        </NuxtLink>
        <Icon
          name="i-lucide-chevron-right"
          class="w-4 h-4"
        />
        <span
          aria-current="page"
          class="text-gray-900 dark:text-gray-100"
        >{{ countryName }}</span>
      </nav>
    </div>

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">{{ flagEmoji }}</span>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ countryName }}
        </h1>
      </div>
      <p class="text-gray-600 dark:text-gray-400">
        All available chart configurations for this country
      </p>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      text="Loading..."
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

    <!-- Presets Matrix -->
    <DiscoverPresetsMatrix
      v-else
      :country="iso3c"
      :country-name="countryName"
      :has-age-data="hasAgeData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Country } from '@/model'
import { loadCountryMetadata } from '@/lib/data/queries'
import { getFlagEmoji, formatJurisdictionName } from '@/lib/discover/countryUtils'

const route = useRoute()
const router = useRouter()

// Get ISO3 code from route
const iso3c = computed(() => route.params.iso3c as string)

// State
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const countryData = ref<Country | null>(null)

// Load country data
onMounted(async () => {
  try {
    const metadata = await loadCountryMetadata()
    countryData.value = metadata[iso3c.value] || null

    if (!countryData.value) {
      router.replace('/discover/country')
    }
  } catch (error) {
    loadError.value = 'Failed to load country data. Please try again.'
    console.error('Failed to load country metadata:', error)
  } finally {
    isLoading.value = false
  }
})

// Check if country has age-stratified data
const hasAgeData = computed(() => {
  return countryData.value?.has_asmr() ?? false
})

// Country name
const countryName = computed(() => {
  if (!countryData.value?.jurisdiction) return iso3c.value
  return formatJurisdictionName(countryData.value.jurisdiction)
})

// Flag emoji
const flagEmoji = computed(() => getFlagEmoji(iso3c.value))

// SEO
useSeoMeta({
  title: () => `${countryName.value} - Discover - Mortality Watch`,
  description: () => `Explore all mortality chart configurations for ${countryName.value}`,
  ogTitle: () => `${countryName.value} - Discover - Mortality Watch`,
  ogDescription: () => `Explore all mortality chart configurations for ${countryName.value}`
})
</script>
