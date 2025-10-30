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
    :close="{
      color: 'neutral',
      variant: 'ghost'
    }"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <button class="chart-option-button">
      <UIcon
        name="i-lucide-save"
        class="w-4 h-4 flex-shrink-0"
      />
      <div class="flex-1 text-left">
        <div class="text-sm font-medium">
          Save Ranking
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Bookmark for later access
        </div>
      </div>
      <UIcon
        name="i-lucide-chevron-right"
        class="w-3 h-3 text-gray-400"
      />
    </button>

    <template #body>
      <div class="space-y-4 w-full">
        <!-- Name Input -->
        <UFormField
          label="Ranking Name"
          required
          class="w-full"
        >
          <UInput
            :model-value="saveChartName"
            placeholder="Enter a name for your ranking"
            class="w-full"
            @update:model-value="emit('update:saveChartName', $event)"
          />
        </UFormField>

        <!-- Description Input -->
        <UFormField
          label="Description (optional)"
          class="w-full"
        >
          <UTextarea
            :model-value="saveChartDescription"
            placeholder="Add a description (optional)"
            :rows="3"
            class="w-full"
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
    </template>

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

<style scoped>
.chart-option-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: inherit;
}

.chart-option-button:hover {
  background-color: rgb(243 244 246);
}

.dark .chart-option-button:hover {
  background-color: rgb(31 41 55);
}

.chart-option-button:active {
  background-color: rgb(229 231 235);
}

.dark .chart-option-button:active {
  background-color: rgb(17 24 39);
}
</style>
