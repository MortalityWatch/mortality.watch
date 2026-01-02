<template>
  <NuxtLink
    :to="to"
    class="block"
  >
    <UCard
      class="h-full transition-shadow cursor-pointer"
      :class="locked ? 'opacity-60' : 'hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400'"
    >
      <!-- Thumbnail -->
      <DiscoverThumbnail
        :src="thumbnailUrl"
        :locked-src="lockedThumbnailUrl || thumbnailUrl"
        :alt="alt"
        :locked="locked"
        class="mb-3"
      />

      <!-- Label row -->
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-2 min-w-0">
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

          <!-- Pro badge when locked -->
          <UBadge
            v-if="locked"
            color="primary"
            variant="soft"
            size="xs"
            class="flex-shrink-0"
          >
            Pro
          </UBadge>

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
        class="text-xs text-gray-500 dark:text-gray-400 mt-1"
      >
        {{ description }}
      </div>

      <!-- Slot for extra content (e.g., admin info) -->
      <slot />
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  to: string
  thumbnailUrl: string
  lockedThumbnailUrl?: string
  alt: string
  label: string
  locked?: boolean
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
  icon: undefined,
  emoji: undefined,
  chartType: undefined,
  description: undefined,
  meta: undefined
})
</script>
