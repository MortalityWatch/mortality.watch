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
    <div
      v-if="images.length > 0"
      class="mb-12"
    >
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Featured Visualizations
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Click any chart below to explore interactive versions with your own
          customizations
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="image of images"
          :key="image.title"
          class="hover:shadow-lg transition-shadow"
        >
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ image.title }}
            </h3>
          </template>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ image.description }}
          </p>
          <div
            class="overflow-hidden rounded-md"
            :style="{ aspectRatio: image.width / image.height }"
          >
            <NuxtLink
              :to="`/${image.url}`"
              class="block"
            >
              <img
                class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                :src="`/showcase/${getFilename(image.title)}_${colorMode.value}.webp`"
                :alt="image.title"
                loading="lazy"
              >
            </NuxtLink>
          </div>
        </UCard>
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
import { onMounted, onUnmounted, ref } from 'vue'

// Type definition for showcase images
interface ShowcaseImage {
  title: string
  description: string
  url: string
  width: number
  height: number
}

// Use Nuxt's built-in color mode
const colorMode = useColorMode()

// Helper function to get filename
const getFilename = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

// Check if mobile or desktop
const isMobile = () => window.innerWidth < 768
const isDesktop = () => window.innerWidth >= 1024

// Reactive state for images
const images = ref<ShowcaseImage[]>([])
const allImages = ref<ShowcaseImage[]>([])

// Lazy loading with Intersection Observer
const observer = ref<IntersectionObserver | null>(null)

// Load showcase configuration
onMounted(async () => {
  try {
    const response = await fetch('/showcase/config.json')
    if (response.ok) {
      allImages.value = await response.json()
      // Initial load based on screen size
      images.value = allImages.value.slice(0, isMobile() ? 2 : isDesktop() ? 6 : 4)

      // Set up lazy loading
      observer.value = new IntersectionObserver(([entry]) => {
        if (entry && entry.isIntersecting && allImages.value.length > 0) {
          images.value = allImages.value
        }
      })
      const target = document.getElementById('donate')
      if (target) observer.value.observe(target)
    }
  } catch (error) {
    console.error('Failed to load showcase images:', error)
    // Mock data for demonstration
    images.value = [
      {
        title: 'Global Excess Deaths',
        description: 'Compare excess mortality across countries during COVID-19',
        url: 'explorer?chart=excess_deaths',
        width: 800,
        height: 600
      },
      {
        title: 'Age-Stratified Analysis',
        description: 'Mortality rates by age groups showing demographic impacts',
        url: 'explorer?chart=age_groups',
        width: 800,
        height: 600
      },
      {
        title: 'Regional Comparisons',
        description: 'Side-by-side mortality trends for different regions',
        url: 'explorer?chart=regional',
        width: 800,
        height: 600
      },
      {
        title: 'Time Series Trends',
        description: 'Weekly and monthly mortality patterns over time',
        url: 'explorer?chart=time_series',
        width: 800,
        height: 600
      },
      {
        title: 'Baseline Models',
        description: 'Different methods for calculating expected deaths',
        url: 'explorer?chart=baselines',
        width: 800,
        height: 600
      },
      {
        title: 'Life Expectancy Impact',
        description: 'Changes in life expectancy across populations',
        url: 'explorer?chart=life_expectancy',
        width: 800,
        height: 600
      }
    ]
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
})

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
