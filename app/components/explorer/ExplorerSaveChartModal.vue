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
  >
    <div class="p-4 space-y-4">
      <!-- Name Input -->
      <UFormField
        label="Chart Name"
        required
      >
        <UInput
          v-model="localName"
          placeholder="Enter a name for your chart"
        />
      </UFormField>

      <!-- Description Input -->
      <UFormField label="Description (optional)">
        <UTextarea
          v-model="localDescription"
          placeholder="Add a description (optional)"
          :rows="3"
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

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="emit('cancel')"
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
