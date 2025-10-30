<script setup lang="ts">
/**
 * RankingSaveModal Component
 *
 * Modal dialog for saving ranking configurations.
 * Extracted from ranking.vue as part of Phase 5b refactoring.
 */

interface Props {
  modelValue: boolean
  savingChart: boolean
  saveChartName: string
  saveChartDescription: string
  saveChartPublic: boolean
  saveError: string
  saveSuccess: boolean
}

interface Emits {
  (e: 'update:modelValue' | 'update:saveChartPublic', value: boolean): void
  (e: 'update:saveChartName' | 'update:saveChartDescription', value: string): void
  (e: 'save'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSave = () => {
  emit('save')
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <UModal
    :model-value="modelValue"
    title="Save Ranking"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="p-4 space-y-4">
      <!-- Name Input -->
      <UFormField
        label="Ranking Name"
        required
      >
        <UInput
          :model-value="saveChartName"
          placeholder="Enter a name for your ranking"
          @update:model-value="emit('update:saveChartName', $event)"
        />
      </UFormField>

      <!-- Description Input -->
      <UFormField label="Description (optional)">
        <UTextarea
          :model-value="saveChartDescription"
          placeholder="Add a description (optional)"
          :rows="3"
          @update:model-value="emit('update:saveChartDescription', $event)"
        />
      </UFormField>

      <!-- Public Toggle -->
      <UFormField>
        <div class="flex items-center gap-3">
          <USwitch
            :model-value="saveChartPublic"
            @update:model-value="emit('update:saveChartPublic', $event)"
          />
          <div>
            <div class="font-medium text-sm">
              Make this ranking public
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Public rankings appear in the chart gallery
            </div>
          </div>
        </div>
      </UFormField>

      <!-- Error Message -->
      <UAlert
        v-if="saveError"
        color="error"
        variant="subtle"
        :title="saveError"
      />

      <!-- Success Message -->
      <UAlert
        v-if="saveSuccess"
        color="success"
        variant="subtle"
        title="Ranking saved successfully!"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="handleClose"
        />
        <UButton
          color="primary"
          label="Save Ranking"
          :loading="savingChart"
          :disabled="!saveChartName.trim()"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
