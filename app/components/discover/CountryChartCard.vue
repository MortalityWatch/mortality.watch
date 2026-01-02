<template>
  <ChartsThumbnailCard
    :to="linkUrl"
    :thumbnail-url="thumbnailUrl"
    :locked-thumbnail-url="lockedThumbnailUrl"
    :alt="`${countryName} chart`"
    :label="countryName"
    :emoji="getFlagEmoji(country)"
    :locked="isLocked"
  />
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
const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Z-Score is the only Pro feature view in discover presets
const isLocked = computed(() => {
  return props.preset.view === 'zscore' && !can('Z_SCORES')
})

// Generate explorer URL or upgrade URL based on access
const linkUrl = computed(() => {
  if (isLocked.value) {
    return getFeatureUpgradeUrl('Z_SCORES')
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
