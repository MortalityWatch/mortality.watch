<template>
  <NuxtLink
    :to="explorerUrl"
    class="block"
  >
    <UCard class="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <!-- Thumbnail -->
      <div
        class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 mb-3"
        style="aspect-ratio: 16/9"
      >
        <ClientOnly>
          <img
            :src="thumbnailUrl"
            :alt="`${countryName} chart`"
            class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
            loading="lazy"
          >
          <template #fallback>
            <div class="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700" />
          </template>
        </ClientOnly>
      </div>

      <!-- Country info -->
      <div class="flex items-center gap-2">
        <span
          v-if="flagCode"
          class="text-lg"
        >
          {{ getFlagEmoji(flagCode) }}
        </span>
        <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
          {{ countryName }}
        </span>
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DiscoveryPreset } from '@/lib/discover/presets'
import { presetToExplorerUrl, presetToThumbnailUrl } from '@/lib/discover/presets'
import countries from 'i18n-iso-countries'

interface Props {
  preset: DiscoveryPreset
  country: string // ISO3 code
  countryName: string
}

const props = defineProps<Props>()

const colorMode = useColorMode()

// Get ISO2 code for flag
const flagCode = computed(() => {
  // Handle special cases for sub-national regions
  if (props.country.startsWith('USA-')) return 'us'
  if (props.country.startsWith('CAN-')) return 'ca'
  if (props.country.startsWith('DEU-')) return 'de'
  if (props.country === 'GBRTENW') return 'gb'
  if (props.country === 'GBR_SCO') return 'gb'
  if (props.country === 'GBR_NIR') return 'gb'

  return countries.alpha3ToAlpha2(props.country)?.toLowerCase() || null
})

// Convert country code to flag emoji
function getFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return ''
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Generate explorer URL
const explorerUrl = computed(() => {
  return presetToExplorerUrl(props.preset, props.country)
})

// Generate thumbnail URL (reactive to color mode)
const thumbnailUrl = computed(() => {
  return presetToThumbnailUrl(props.preset, props.country, {
    darkMode: colorMode.value === 'dark'
  })
})
</script>
