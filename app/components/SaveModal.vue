<script setup lang="ts">
/**
 * Generic Save Modal Component
 *
 * Reusable modal for saving charts and rankings to the database.
 * Used by both explorer and ranking pages.
 */

interface ExistingChart {
  id: number
  slug: string | null
  name: string
  createdAt: number | null
}

interface DetectedChart {
  id: number
  slug: string | null
  name: string
}

const { trackChartSave } = useAnalytics()

const props = withDefaults(defineProps<{
  modelValue: boolean
  saving: boolean
  name: string
  description: string
  isPublic: boolean
  error: string | null
  success: boolean
  type?: 'chart' | 'ranking'
  generateDefaultTitle?: () => string
  generateDefaultDescription?: () => string
  isSaved?: boolean
  isModified?: boolean
  savedChartSlug?: string | null
  isButtonDisabled?: boolean
  buttonLabel?: string
  isDuplicate?: boolean
  existingChart?: ExistingChart | null
  detectedChart?: DetectedChart | null
  hideButton?: boolean
  editMode?: boolean
  modalTitle?: string
}>(), {
  type: 'chart',
  generateDefaultTitle: undefined,
  generateDefaultDescription: undefined,
  isSaved: false,
  isModified: false,
  savedChartSlug: null,
  isButtonDisabled: false,
  isDuplicate: false,
  existingChart: null,
  detectedChart: null,
  hideButton: false,
  editMode: false,
  modalTitle: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:name', value: string): void
  (e: 'update:description', value: string): void
  (e: 'update:isPublic', value: boolean): void
  (e: 'save'): void
  (e: 'saveAsNew'): void
  (e: 'updateExisting'): void
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

const handleOpenModal = (): void => {
  // In edit mode, keep existing values (parent already set them)
  if (!props.editMode) {
    // Generate default title and description if functions provided, otherwise reset to empty
    const defaultTitle = props.generateDefaultTitle ? props.generateDefaultTitle() : ''
    const defaultDescription = props.generateDefaultDescription ? props.generateDefaultDescription() : ''
    emit('update:name', defaultTitle)
    emit('update:description', defaultDescription)
    emit('update:isPublic', false)
  }
  localShow.value = true
}

const computedModalTitle = computed(() => {
  if (props.modalTitle) return props.modalTitle
  if (props.editMode) return `Edit ${typeLabel.value}`
  return `Save ${typeLabel.value}`
})

// Tracked save handlers
function handleSave() {
  trackChartSave(localPublic.value)
  emit('save')
}

function handleSaveAsNew() {
  trackChartSave(localPublic.value)
  emit('saveAsNew')
}

function handleUpdateExisting() {
  trackChartSave(localPublic.value)
  emit('updateExisting')
}
</script>

<template>
  <div>
    <button
      v-if="!hideButton"
      type="button"
      class="chart-option-button"
      :class="{ 'opacity-60': isButtonDisabled }"
      :disabled="isButtonDisabled"
      @click="handleOpenModal"
    >
      <UIcon
        :name="isSaved && !isModified ? 'i-lucide-check' : 'i-lucide-book-heart'"
        class="w-4 h-4 shrink-0"
      />
      <div class="flex-1 text-left">
        <div class="text-sm font-medium">
          {{ buttonLabel || `Save ${typeLabel}` }}
          <FeatureBadge
            v-if="!isSaved"
            feature="SAVE_CHART"
            class="ml-2"
          />
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <template v-if="isSaved && !isModified && savedChartSlug">
            <NuxtLink
              :to="`/charts/${savedChartSlug}`"
              class="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
              @click.stop
            >
              View saved chart
            </NuxtLink>
          </template>
          <template v-else-if="isSaved && isModified">
            Modifications detected
          </template>
          <template v-else>
            Bookmark for later access
          </template>
        </div>
      </div>
      <UIcon
        name="i-lucide-chevron-right"
        class="w-3 h-3 text-gray-400"
      />
    </button>

    <UModal
      v-model:open="localShow"
      :title="computedModalTitle"
      :close="{
        color: 'neutral',
        variant: 'ghost'
      }"
    >
      <template #body>
        <div class="space-y-4 w-full">
          <!-- Info when user has existing saved chart -->
          <UAlert
            v-if="(detectedChart || (isSaved && isModified)) && !isDuplicate"
            color="info"
            variant="subtle"
            :title="isModified ? 'You have unsaved modifications' : 'Similar chart found in your library'"
          >
            <template #description>
              <p class="text-sm">
                <template v-if="isModified">
                  You've modified a previously saved {{ typeLabelLower }}.
                </template>
                <template v-else-if="detectedChart">
                  You have a saved {{ typeLabelLower }} with this configuration:
                  <strong>"{{ detectedChart.name }}"</strong>
                </template>
              </p>
              <p class="text-sm mt-1 text-gray-600 dark:text-gray-400">
                <template v-if="isModified">
                  Update the original to replace it, or save as a new {{ typeLabelLower }}.
                </template>
                <template v-else>
                  You can update the existing {{ typeLabelLower }} or save as a new one.
                </template>
              </p>
            </template>
          </UAlert>

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

          <!-- Duplicate Warning -->
          <UAlert
            v-if="isDuplicate && existingChart"
            color="warning"
            variant="subtle"
            title="This chart already exists in your library"
          >
            <template #description>
              <div class="space-y-3">
                <p class="text-sm">
                  You've already saved a {{ typeLabelLower }} with this exact configuration as
                  <strong>"{{ existingChart.name }}"</strong>.
                </p>
                <div class="flex gap-3">
                  <NuxtLink
                    v-if="existingChart.slug"
                    :to="`/charts/${existingChart.slug}`"
                    class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <UIcon
                      name="i-lucide-eye"
                      class="w-4 h-4"
                    />
                    View saved {{ typeLabelLower }}
                  </NuxtLink>
                  <NuxtLink
                    to="/my-charts"
                    class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <UIcon
                      name="i-lucide-book-heart"
                      class="w-4 h-4"
                    />
                    View all saved charts
                  </NuxtLink>
                </div>
              </div>
            </template>
          </UAlert>

          <!-- Error Message -->
          <UAlert
            v-else-if="error"
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
          <!-- Edit mode: single update button -->
          <template v-if="editMode">
            <UButton
              color="primary"
              label="Save Changes"
              :loading="saving"
              :disabled="!name.trim()"
              @click="handleUpdateExisting"
            />
          </template>
          <!-- Show two buttons when user has a saved chart (detected or previously saved) -->
          <template v-else-if="(detectedChart || (isSaved && isModified)) && !isDuplicate">
            <UButton
              color="neutral"
              variant="outline"
              :label="`Save as New ${typeLabel}`"
              :loading="saving"
              :disabled="!name.trim()"
              @click="handleSaveAsNew"
            />
            <UButton
              color="primary"
              :label="isModified ? `Update Original` : `Update Existing`"
              :loading="saving"
              :disabled="!name.trim()"
              @click="handleUpdateExisting"
            />
          </template>
          <!-- Default single save button -->
          <UButton
            v-else
            color="primary"
            :label="`Save ${typeLabel}`"
            :loading="saving"
            :disabled="!name.trim()"
            @click="handleSave"
          />
        </div>
      </template>
    </UModal>
  </div>
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
