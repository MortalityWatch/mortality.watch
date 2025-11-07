<template>
  <UiControlRow
    :label="label"
    :help-content="helpContent"
    :help-title="helpTitle"
  >
    <slot />
    <template
      v-if="$slots.help"
      #help
    >
      <slot name="help" />
    </template>
  </UiControlRow>
</template>

<script setup lang="ts">
/**
 * FilterRow - Alias for UiControlRow
 * Convenience wrapper for filter-specific use cases
 */
interface Props {
  label: string
  helpContent?: string
  helpTitle?: string
}

defineProps<Props>()
</script>
