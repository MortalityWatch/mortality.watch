<template>
  <div class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
    <div class="flex items-center gap-2">
      <label
        v-if="label"
        class="text-sm font-medium whitespace-nowrap"
      >
        {{ label }}
      </label>
      <slot />
      <UPopover v-if="helpContent || $slots.help">
        <UButton
          icon="i-lucide-info"
          :color="helpWarning ? 'warning' : 'neutral'"
          variant="ghost"
          size="xs"
          :aria-label="helpAriaLabel"
        />
        <template #content>
          <div class="p-3 max-w-xs">
            <div
              v-if="helpTitle"
              class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              {{ helpTitle }}
            </div>
            <div
              v-if="helpContent"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              {{ helpContent }}
            </div>
            <slot name="help" />
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /**
   * Label text displayed on the left side
   */
  label?: string

  /**
   * Simple help text shown in tooltip
   */
  helpContent?: string

  /**
   * Optional title for the help tooltip
   */
  helpTitle?: string

  /**
   * Show help button in warning (orange) color
   */
  helpWarning?: boolean
}

const props = defineProps<Props>()

const helpAriaLabel = computed(() =>
  props.label ? `${props.label} help` : 'Help'
)
</script>
