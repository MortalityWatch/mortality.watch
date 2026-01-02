<template>
  <!-- Hover overlay for locked/gated content - shows lock icon and upgrade CTA -->
  <div
    class="absolute inset-0 bg-gray-900/5 dark:bg-gray-100/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
  >
    <div class="flex flex-col items-center gap-1">
      <UIcon
        name="i-heroicons-lock-closed"
        class="text-gray-500 dark:text-gray-400 size-5"
      />
      <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
        {{ text }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
}>(), {
  text: 'Click to upgrade'
})
</script>
