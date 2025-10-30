<script setup lang="ts">
/**
 * Explorer Save Chart Modal Component
 *
 * Phase 5a: Extracted from explorer.vue to reduce page size
 *
 * Provides UI for saving explorer charts to the database with:
 * - Chart name input
 * - Optional description
 * - Public/private toggle
 * - Error/success feedback
 */

const props = defineProps<{
  modelValue: boolean
  savingChart: boolean
  chartName: string
  chartDescription: string
  chartPublic: boolean
  saveError: string | null
  saveSuccess: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:chartName': [value: string]
  'update:chartDescription': [value: string]
  'update:chartPublic': [value: boolean]
  'save': []
  'cancel': []
}>()

const localShow = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const localName = computed({
  get: () => props.chartName,
  set: value => emit('update:chartName', value)
})

const localDescription = computed({
  get: () => props.chartDescription,
  set: value => emit('update:chartDescription', value)
})

const localPublic = computed({
  get: () => props.chartPublic,
  set: value => emit('update:chartPublic', value)
})
</script>

<template>
  <UModal
    v-model="localShow"
    title="Save Chart"
    :close="{
      color: 'neutral',
      variant: 'ghost'
    }"
  >
    <button class="chart-option-button">
      <UIcon
        name="i-lucide-save"
        class="w-4 h-4 flex-shrink-0"
      />
      <div class="flex-1 text-left">
        <div class="text-sm font-medium">
          Save Chart
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
          label="Chart Name"
          required
          class="w-full"
        >
          <UInput
            v-model="localName"
            placeholder="Enter a name for your chart"
            class="w-full"
          />
        </UFormField>

        <!-- Description Input -->
        <UFormField
          label="Description (optional)"
          class="w-full"
        >
          <UTextarea
            v-model="localDescription"
            placeholder="Add a description (optional)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Public Toggle -->
        <UFormField>
          <div class="flex items-center gap-3">
            <USwitch v-model="localPublic" />
            <div>
              <div class="font-medium text-sm">
                Make this chart public
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Public charts appear in the chart gallery
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
          title="Chart saved successfully!"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="localShow = false"
        />
        <UButton
          color="primary"
          label="Save Chart"
          :loading="savingChart"
          :disabled="!chartName.trim()"
          @click="emit('save')"
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
