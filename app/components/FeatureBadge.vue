<template>
  <UPopover v-if="shouldShowBadge">
    <span
      :class="badgeClasses"
      class="cursor-help"
    >
      {{ tierName }}
    </span>
    <template #content>
      <div class="p-3 max-w-xs">
        <div class="text-xs space-y-1">
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ tierName }} Feature
          </div>
          <div class="text-gray-600 dark:text-gray-400">
            {{ message || getUpgradeMessage(feature) }}
          </div>
          <div
            v-if="!can(feature)"
            class="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <NuxtLink
              :to="getFeatureUpgradeUrl(feature)"
              class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {{ getFeatureUpgradeCTA(feature) }} →
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { FeatureKey } from '~/lib/featureFlags'
import { FEATURES, TIERS } from '~/config/features.config'

const props = defineProps<{
  feature: FeatureKey
  message?: string
}>()

const {
  can,
  getUpgradeMessage,
  getFeatureUpgradeUrl,
  getFeatureUpgradeCTA
} = useFeatureAccess()

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const tier = FEATURES[props.feature].tier

  switch (tier) {
    case TIERS.PUBLIC:
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`
    case TIERS.REGISTERED:
      return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
    case TIERS.PRO:
      return `${baseClasses} bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`
    default:
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`
  }
})

const tierName = computed(() => {
  const tier = FEATURES[props.feature].tier

  switch (tier) {
    case TIERS.PUBLIC:
      return 'Public'
    case TIERS.REGISTERED:
      return 'Sign Up'
    case TIERS.PRO:
      return 'Upgrade'
    default:
      return 'Unknown'
  }
})

// Only show badge when user doesn't have access to the feature
const shouldShowBadge = computed(() => {
  const tier = FEATURES[props.feature].tier
  const hasAccess = can(props.feature)

  // Don't show for PUBLIC tier (everyone has access)
  if (tier === TIERS.PUBLIC) return false

  // Only show if user doesn't have access
  return !hasAccess
})
</script>
