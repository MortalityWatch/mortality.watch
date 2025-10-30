<script setup lang="ts">
/**
 * Generic Save Modal Component
 *
 * Reusable modal for saving charts and rankings to the database.
 * Used by both explorer and ranking pages.
 */

const props = withDefaults(defineProps<{
  modelValue: boolean
  saving: boolean
  name: string
  description: string
  isPublic: boolean
  error: string | null
  success: boolean
  type?: 'chart' | 'ranking'
}>(), {
  type: 'chart'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:name': [value: string]
  'update:description': [value: string]
  'update:isPublic': [value: boolean]
  'save': []
}>()

const localShow = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const localName = computed({
  get: () => props.name,
  set: value => emit('update:name', value)
})

const localDescription = computed({
  get: () => props.description,
  set: value => emit('update:description', value)
})

const localPublic = computed({
  get: () => props.isPublic,
  set: value => emit('update:isPublic', value)
})

const typeLabel = computed(() => props.type === 'ranking' ? 'Ranking' : 'Chart')
const typeLabelLower = computed(() => typeLabel.value.toLowerCase())
</script>

<template>
  <UModal
    v-model="localShow"
    :title="`Save ${typeLabel}`"
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
          Save {{ typeLabel }}
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
          :label="`${typeLabel} Name`"
          required
          class="w-full"
        >
          <UInput
            v-model="localName"
            :placeholder="`Enter a name for your ${typeLabelLower}`"
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
                Make this {{ typeLabelLower }} public
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Public {{ typeLabelLower }}s appear in the {{ typeLabelLower }} gallery
              </div>
            </div>
          </div>
        </UFormField>

        <!-- Error Message -->
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
        />

        <!-- Success Message -->
        <UAlert
          v-if="success"
          color="success"
          variant="subtle"
          :title="`${typeLabel} saved successfully!`"
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
          :label="`Save ${typeLabel}`"
          :loading="saving"
          :disabled="!name.trim()"
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
