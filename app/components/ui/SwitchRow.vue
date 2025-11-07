<template>
  <UiControlRow
    :label="label"
    :help-content="helpContent"
    :help-title="helpTitle"
  >
    <USwitch
      :model-value="modelValue"
      :disabled="disabled"
      :data-testid="testId"
      @update:model-value="$emit('update:modelValue', $event)"
    />
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
 * SwitchRow - Convenience wrapper for USwitch in UiControlRow
 * Combines label, switch, and optional help tooltip in gray card
 */
interface Props {
  label: string
  modelValue: boolean
  disabled?: boolean
  testId?: string
  helpContent?: string
  helpTitle?: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
