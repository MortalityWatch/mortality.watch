<template>
  <NuxtLink
    :to="to"
    class="block group"
  >
    <UCard
      class="h-full transition-shadow cursor-pointer relative"
      :class="locked
        ? ''
        : 'hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400'"
    >
      <!-- Header with title (like ChartCard) -->
      <template #header>
        <div
          class="flex items-center gap-2"
          :class="locked ? 'opacity-50' : ''"
        >
          <!-- Optional icon prefix -->
          <Icon
            v-if="icon"
            :name="icon"
            class="w-4 h-4 flex-shrink-0"
            :class="locked ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'"
          />

          <!-- Optional emoji prefix -->
          <span
            v-if="emoji"
            class="text-lg flex-shrink-0"
          >
            {{ emoji }}
          </span>

          <!-- Label -->
          <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ label }}
          </span>

          <!-- Feature badge when locked (shows "Sign Up" or "Upgrade" based on tier) -->
          <FeatureBadge
            v-if="locked && feature"
            :feature="feature"
            class="flex-shrink-0"
          />
        </div>
      </template>

      <!-- Content wrapper (grayed out when locked) -->
      <div
        class="space-y-3"
        :class="locked ? 'opacity-50' : ''"
      >
        <!-- Thumbnail -->
        <DiscoverThumbnail
          :src="thumbnailUrl"
          :locked-src="lockedThumbnailUrl || thumbnailUrl"
          :alt="alt"
          :locked="locked"
        />

        <!-- Meta row (badges, views, date) -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-2 min-w-0">
            <!-- Chart type badge -->
            <UBadge
              v-if="chartType"
              :color="chartType === 'explorer' ? 'info' : 'warning'"
              variant="subtle"
              size="xs"
              class="flex-shrink-0"
            >
              {{ chartType === 'explorer' ? 'Explorer' : 'Ranking' }}
            </UBadge>

            <!-- View count -->
            <span
              v-if="meta?.views !== undefined"
              class="flex items-center gap-1 flex-shrink-0"
            >
              <Icon
                name="i-lucide-eye"
                class="w-3 h-3"
              />
              {{ meta.views }}
            </span>
          </div>

          <!-- Date on the right -->
          <span
            v-if="meta?.date"
            class="flex-shrink-0"
          >
            {{ meta.date }}
          </span>
        </div>

        <!-- Optional description/secondary info -->
        <div
          v-if="description"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{ description }}
        </div>

        <!-- Slot for extra content (e.g., admin info) -->
        <slot />
      </div>

      <!-- Hover overlay for locked state (shows on hover) -->
      <div
        v-if="locked"
        class="absolute inset-0 bg-gray-900/5 dark:bg-gray-100/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
      >
        <div class="flex flex-col items-center gap-1">
          <UIcon
            name="i-heroicons-lock-closed"
            class="text-gray-500 dark:text-gray-400 size-5"
          />
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
            Click to upgrade
          </span>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { FeatureKey } from '@/lib/featureFlags'

interface Props {
  to: string
  thumbnailUrl: string
  lockedThumbnailUrl?: string
  alt: string
  label: string
  locked?: boolean
  feature?: FeatureKey
  icon?: string
  emoji?: string
  chartType?: 'explorer' | 'ranking'
  description?: string
  meta?: {
    views?: number
    date?: string
  }
}

withDefaults(defineProps<Props>(), {
  locked: false,
  lockedThumbnailUrl: undefined,
  feature: undefined,
  icon: undefined,
  emoji: undefined,
  chartType: undefined,
  description: undefined,
  meta: undefined
})
</script>
