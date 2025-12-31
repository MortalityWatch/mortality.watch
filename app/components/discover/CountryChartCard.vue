<template>
  <NuxtLink
    :to="linkUrl"
    class="block"
  >
    <UCard
      class="h-full transition-shadow cursor-pointer"
      :class="isLocked ? 'opacity-60' : 'hover:shadow-lg'"
    >
      <!-- Thumbnail -->
      <DiscoverThumbnail
        :src="thumbnailUrl"
        :locked-src="lockedThumbnailUrl"
        :alt="`${countryName} chart`"
        :locked="isLocked"
        class="mb-3"
      />

      <!-- Country info -->
      <div class="flex items-center gap-2">
        <span class="text-lg">
          {{ getFlagEmoji(country) }}
        </span>
        <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
          {{ countryName }}
        </span>
        <UBadge
          v-if="isLocked"
          color="primary"
          variant="soft"
          size="xs"
        >
          Pro
        </UBadge>
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DiscoveryPreset } from '@/lib/discover/presets'
import { presetToExplorerUrl, presetToThumbnailUrl } from '@/lib/discover/presets'
import { getFlagEmoji } from '@/lib/discover/countryUtils'
import type { FeatureKey } from '@/lib/featureFlags'

interface Props {
  preset: DiscoveryPreset
  country: string // ISO3 code
  countryName: string
}

const props = defineProps<Props>()

const colorMode = useColorMode()
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Check if this preset is a pro feature
function isProFeature(): boolean {
  return props.preset.view === 'zscore'
}

// Get the feature key for the preset (only called for pro features)
function getFeatureKey(): FeatureKey {
  // zscore is the only pro feature view
  return 'Z_SCORES'
}

// Check if the feature is locked for current user
const isLocked = computed(() => {
  return isProFeature() && !can(getFeatureKey())
})

// Generate explorer URL or upgrade URL based on access
const linkUrl = computed(() => {
  if (isLocked.value) {
    return getFeatureUpgradeUrl(getFeatureKey())
  }
  return presetToExplorerUrl(props.preset, props.country)
})

// Generate thumbnail URL (reactive to color mode)
const thumbnailUrl = computed(() => {
  return presetToThumbnailUrl(props.preset, props.country, {
    darkMode: colorMode.value === 'dark'
  })
})

// Generate thumbnail URL for locked features (use normal view, which is likely cached)
const lockedThumbnailUrl = computed(() => {
  const normalPreset: DiscoveryPreset = {
    ...props.preset,
    view: 'normal'
  }
  return presetToThumbnailUrl(normalPreset, props.country, {
    darkMode: colorMode.value === 'dark'
  })
})
</script>
