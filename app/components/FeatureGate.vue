<template>
  <div>
    <!-- Show feature if user has access -->
    <slot v-if="can(feature)" />

    <!-- Show upgrade prompt if locked and showUpgradePrompt is true -->
    <div
      v-else-if="showUpgradePrompt"
      class="flex flex-col items-center gap-4 p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
    >
      <UIcon
        name="i-heroicons-lock-closed"
        class="text-gray-400 dark:text-gray-500 size-5"
      />
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ getUpgradeMessage(feature) }}
      </p>
      <UButton
        :to="getFeatureUpgradeUrl(feature)"
        :label="getFeatureUpgradeCTA(feature)"
        color="primary"
        size="sm"
      />
    </div>

    <!-- Hide entirely if silent mode -->
    <template v-else-if="silent" />

    <!-- Show disabled state with optional custom slot -->
    <div
      v-else
      class="relative"
    >
      <slot
        name="disabled"
        :message="getUpgradeMessage(feature)"
        :url="getFeatureUpgradeUrl(feature)"
        :cta="getFeatureUpgradeCTA(feature)"
      >
        <!-- Default disabled state: just show the content but disabled -->
        <div class="opacity-50 pointer-events-none">
          <slot />
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeatureKey } from '~/lib/featureFlags'

withDefaults(
  defineProps<{
    feature: FeatureKey
    showUpgradePrompt?: boolean
    silent?: boolean
  }>(),
  {
    showUpgradePrompt: false,
    silent: false
  }
)

const {
  can,
  getUpgradeMessage,
  getFeatureUpgradeUrl,
  getFeatureUpgradeCTA
} = useFeatureAccess()
</script>
