<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6">
      <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
        <span class="text-gray-900 dark:text-gray-100">{{ countryName }}</span>
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

    <!-- Tabs -->
    <UCard v-else>
      <UTabs
        v-model="activeTab"
        :items="availableTabs"
      >
        <!-- LE Tab -->
        <template #le>
          <DiscoverMetricPresetsGrid
            metric="le"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>

        <!-- ASD Tab (Pro feature) -->
        <template #asd>
          <div
            v-if="!can('AGE_STANDARDIZED')"
            class="py-12 text-center"
          >
            <UIcon
              name="i-heroicons-lock-closed"
              class="text-gray-400 size-12 mx-auto mb-4"
            />
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Age-Standardized Deaths is a Pro feature
            </p>
            <UButton
              :to="getFeatureUpgradeUrl('AGE_STANDARDIZED')"
              color="primary"
            >
              Upgrade to Pro
            </UButton>
          </div>
          <DiscoverMetricPresetsGrid
            v-else
            metric="asd"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>

        <!-- ASMR Tab -->
        <template #asmr>
          <DiscoverMetricPresetsGrid
            metric="asmr"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>

        <!-- CMR Tab -->
        <template #cmr>
          <DiscoverMetricPresetsGrid
            metric="cmr"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>

        <!-- Deaths Tab -->
        <template #deaths>
          <DiscoverMetricPresetsGrid
            metric="deaths"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>

        <!-- Population Tab -->
        <template #population>
          <DiscoverMetricPresetsGrid
            metric="population"
            :country="iso3c"
            :country-name="countryName"
          />
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Country } from '@/model'
import { loadCountryMetadata } from '@/lib/data/queries'
import { getMetricTabs, metricInfo } from '@/lib/discover/constants'
import { getFlagEmoji } from '@/lib/discover/countryUtils'

const route = useRoute()
const router = useRouter()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Get ISO3 code from route
const iso3c = computed(() => route.params.iso3c as string)

// State
const isLoading = ref(true)
const countryData = ref<Country | null>(null)
const activeTab = ref<string>((route.query.tab as string) || 'le')

// Load country data
onMounted(async () => {
  try {
    const metadata = await loadCountryMetadata()
    countryData.value = metadata[iso3c.value] || null

    if (!countryData.value) {
      router.replace('/discover/country')
    }
  } finally {
    isLoading.value = false
  }
})

// Check if country has age-stratified data
const hasAgeData = computed(() => {
  return countryData.value?.has_asmr() ?? false
})

// Get available tabs based on country data
const availableTabs = computed(() => {
  const allTabs = getMetricTabs()

  // Filter out ASMR and ASD if country doesn't have age-stratified data
  if (!hasAgeData.value) {
    return allTabs.filter(tab => tab.value !== 'asmr' && tab.value !== 'asd')
  }

  // Add Pro badge to ASD tab if user doesn't have access
  return allTabs.map((tab) => {
    if (tab.value === 'asd' && !can('AGE_STANDARDIZED')) {
      return {
        ...tab,
        label: `${metricInfo.asd.label} (Pro)`
      }
    }
    return tab
  })
})

// Watch tab changes to update URL
watch(activeTab, (newTab) => {
  if (newTab === 'le') {
    // Remove tab param for default
    const { tab, ...rest } = route.query
    router.replace({ query: Object.keys(rest).length ? rest : undefined })
  } else {
    router.replace({ query: { ...route.query, tab: newTab } })
  }
})

// Country name
const countryName = computed(() => {
  return countryData.value?.jurisdiction || iso3c.value
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
