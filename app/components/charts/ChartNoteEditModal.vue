<template>
  <UModal
    v-model:open="isOpen"
    title="Edit Notes"
    :close="{
      color: 'neutral',
      variant: 'ghost'
    }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Notes"
          class="w-full"
        >
          <UTextarea
            v-model="localNotes"
            placeholder="Add private notes about this chart (only visible to you)"
            :rows="5"
            class="w-full"
          />
          <template #hint>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Notes are private and only visible to you
            </span>
          </template>
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="handleCancel"
        />
        <UButton
          color="primary"
          label="Save Notes"
          :loading="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { showToast } from '@/toast'

interface Props {
  modelValue: boolean
  chartId: number
  initialNotes: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [notes: string | null]
}>()

const localNotes = ref(props.initialNotes || '')
const saving = ref(false)
const error = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

// Reset local notes when modal opens with new initial value
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localNotes.value = props.initialNotes || ''
    error.value = ''
  }
})

async function handleSave() {
  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/charts/${props.chartId}`, {
      method: 'PATCH',
      body: {
        notes: localNotes.value.trim() || null
      }
    })

    emit('saved', localNotes.value.trim() || null)
    isOpen.value = false
    showToast('Notes saved successfully!', 'success')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save notes'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  isOpen.value = false
}
</script>
