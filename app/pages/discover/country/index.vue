<template>
  <div class="container mx-auto px-4 py-8">
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
        <span
          aria-current="page"
          class="text-gray-900 dark:text-gray-100"
        >Choose Country</span>
      </nav>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Explore by Country
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Select a country to see all available chart configurations
      </p>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      text="Loading countries..."
      size="lg"
      height="h-64"
    />

    <!-- Country Picker -->
    <DiscoverCountryPicker
      v-else
      :countries="allCountries"
    />
  </div>
</template>

<script setup lang="ts">
import type { Country } from '@/model'
import { loadCountryMetadata } from '@/lib/data/queries'

const isLoading = ref(true)
const allCountries = ref<Country[]>([])

onMounted(async () => {
  try {
    const metadata = await loadCountryMetadata()
    allCountries.value = Object.values(metadata)
  } finally {
    isLoading.value = false
  }
})

useSeoMeta({
  title: 'Explore by Country - Mortality Watch',
  description: 'Select a country to explore all available mortality chart configurations',
  ogTitle: 'Explore by Country - Mortality Watch',
  ogDescription: 'Select a country to explore all available mortality chart configurations'
})
</script>
