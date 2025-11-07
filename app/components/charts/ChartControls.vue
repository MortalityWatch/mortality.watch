<template>
  <div :class="variant === 'card' ? 'space-y-2' : 'space-y-4'">
    <!-- Public Toggle (owner or admin) -->
    <div
      v-if="showPublicToggle"
      :class="[
        'flex items-center justify-between',
        variant === 'card' && 'pt-2 border-t border-gray-200 dark:border-gray-700'
      ]"
    >
      <div v-if="variant === 'full'">
        <div class="font-medium text-sm">
          Public
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Make this chart visible in the gallery
        </div>
      </div>
      <span
        v-else
        class="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Public
      </span>
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
      <div v-if="variant === 'full'">
        <div class="font-medium text-sm">
          Featured
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Show this chart on the homepage
        </div>
      </div>
      <div v-else>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured
        </span>
      </div>
      <USwitch
        :model-value="isFeatured"
        :loading="isTogglingFeatured"
        @update:model-value="$emit('toggle-featured', $event)"
      />
    </div>
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
  variant?: 'full' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  isPublic: false,
  isFeatured: false,
  isOwner: false,
  isAdmin: false,
  isTogglingPublic: false,
  isTogglingFeatured: false,
  variant: 'full'
})

defineEmits<{
  'toggle-public': [value: boolean]
  'toggle-featured': [value: boolean]
}>()

// Show public toggle for owners or admins
const showPublicToggle = computed(() => props.isOwner || props.isAdmin)

// Show featured toggle only for admins and only when chart is public
const showFeaturedToggle = computed(() => props.isAdmin && props.isPublic)
</script>
