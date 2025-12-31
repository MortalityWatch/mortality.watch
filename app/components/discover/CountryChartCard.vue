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
        <span class="text-lg">
          {{ getFlagEmoji(country) }}
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
import { getFlagEmoji } from '@/lib/discover/countryUtils'

interface Props {
  preset: DiscoveryPreset
  country: string // ISO3 code
  countryName: string
}

const props = defineProps<Props>()

const colorMode = useColorMode()

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
