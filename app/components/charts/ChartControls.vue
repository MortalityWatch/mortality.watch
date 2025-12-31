<template>
  <div :class="variant === 'card' ? '' : 'space-y-4'">
    <!-- Card variant: horizontal layout -->
    <div
      v-if="variant === 'card' && showPublicToggle"
      class="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700"
    >
      <!-- Public Toggle -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Public
        </span>
        <USwitch
          :model-value="isPublic"
          :loading="isTogglingPublic"
          size="sm"
          @update:model-value="$emit('toggle-public', $event)"
        />
      </div>

      <!-- Featured Toggle (admin only, requires public) -->
      <div
        v-if="showFeaturedToggle"
        class="flex items-center gap-2"
      >
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured
        </span>
        <USwitch
          :model-value="isFeatured"
          :loading="isTogglingFeatured"
          size="sm"
          @update:model-value="$emit('toggle-featured', $event)"
        />
      </div>

      <!-- Clear Cache Button (admin only) -->
      <UButton
        v-if="isAdmin"
        variant="ghost"
        color="neutral"
        size="xs"
        :loading="isClearingCache"
        @click="$emit('clear-cache')"
      >
        <Icon
          name="i-lucide-refresh-cw"
          class="w-3.5 h-3.5"
        />
        Clear cache
      </UButton>
    </div>

    <!-- Full variant: vertical layout -->
    <template v-else-if="variant === 'full'">
      <!-- Public Toggle (owner or admin) -->
      <div
        v-if="showPublicToggle"
        class="flex items-center justify-between"
      >
        <div>
          <div class="font-medium text-sm">
            Public
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Make this chart visible in the gallery
          </div>
        </div>
        <USwitch
          :model-value="isPublic"
          :loading="isTogglingPublic"
          @update:model-value="$emit('toggle-public', $event)"
        />
      </div>

      <!-- Featured Toggle (admin only, requires public) -->
      <div
        v-if="showFeaturedToggle"
        class="flex items-center justify-between"
      >
        <div>
          <div class="font-medium text-sm">
            Featured
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Show this chart on the homepage
          </div>
        </div>
        <USwitch
          :model-value="isFeatured"
          :loading="isTogglingFeatured"
          @update:model-value="$emit('toggle-featured', $event)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isPublic?: boolean
  isFeatured?: boolean
  isOwner?: boolean
  isAdmin?: boolean
  isTogglingPublic?: boolean
  isTogglingFeatured?: boolean
  isClearingCache?: boolean
  variant?: 'full' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  isPublic: false,
  isFeatured: false,
  isOwner: false,
  isAdmin: false,
  isTogglingPublic: false,
  isTogglingFeatured: false,
  isClearingCache: false,
  variant: 'full'
})

defineEmits<{
  'toggle-public': [value: boolean]
  'toggle-featured': [value: boolean]
  'clear-cache': []
}>()

// Show public toggle for owners or admins
const showPublicToggle = computed(() => props.isOwner || props.isAdmin)

// Show featured toggle only for admins and only when chart is public
const showFeaturedToggle = computed(() => props.isAdmin && props.isPublic)
</script>
