<template>
  <div>
    <!-- Save Button -->
    <UButton
      :icon="icon"
      :label="label"
      :color="color"
      :variant="variant"
      :size="size"
      :loading="saving"
      @click="openModal"
    />

    <!-- Save Modal -->
    <UModal
      v-model="isOpen"
      :title="`Save ${chartType === 'ranking' ? 'Ranking' : 'Chart'}`"
    >
      <div class="p-4 space-y-4">
        <!-- Name Input -->
        <UFormField
          label="Chart Name"
          required
        >
          <UInput
            v-model="chartName"
            placeholder="Enter a name for your chart"
          />
        </UFormField>

        <!-- Description Input -->
        <UFormField label="Description (optional)">
          <UTextarea
            v-model="chartDescription"
            placeholder="Add a description (optional)"
            :rows="3"
          />
        </UFormField>

        <!-- Public Toggle -->
        <UFormField>
          <div class="flex items-center gap-3">
            <USwitch v-model="isPublic" />
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
          title="Chart saved successfully!"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="closeModal"
          />
          <UButton
            color="primary"
            label="Save Chart"
            :loading="saving"
            :disabled="!chartName.trim()"
            @click="saveChart"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

interface Props {
  chartState: Record<string, unknown>
  chartType: 'explorer' | 'ranking'
  label?: string
  icon?: string
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Save Chart',
  icon: 'i-lucide-save',
  color: 'primary',
  variant: 'solid',
  size: 'md'
})

// Auth
const { user, isAuthenticated } = useAuth()

// Current route for redirect
const route = useRoute()

// Modal state
const isOpen = ref(false)
const chartName = ref('')
const chartDescription = ref('')
const isPublic = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref(false)

// Open modal
function openModal(): void {
  // Check if user is authenticated
  if (!isAuthenticated.value) {
    navigateTo('/login?redirect=' + encodeURIComponent(route.path))
    return
  }

  // Check if user has required tier (Pro or Premium)
  if (user.value && user.value.tier < 1) {
    navigateTo('/pricing')
    return
  }

  isOpen.value = true
  chartName.value = ''
  chartDescription.value = ''
  isPublic.value = false
  error.value = ''
  success.value = false
}

// Close modal
function closeModal(): void {
  isOpen.value = false
}

// Save chart
async function saveChart(): Promise<void> {
  if (!chartName.value.trim()) {
    error.value = 'Chart name is required'
    return
  }

  saving.value = true
  error.value = ''
  success.value = false

  try {
    const response = await $fetch('/api/charts', {
      method: 'POST',
      body: {
        name: chartName.value.trim(),
        description: chartDescription.value.trim() || null,
        chartState: JSON.stringify(props.chartState),
        chartType: props.chartType,
        isPublic: isPublic.value
      }
    })

    success.value = true

    // Close modal after delay
    setTimeout(() => {
      closeModal()

      // Optionally navigate to the saved chart
      if (isPublic.value && response.chart?.slug) {
        navigateTo(`/charts/${response.chart.slug}`)
      } else {
        // Navigate to My Charts
        navigateTo('/my-charts')
      }
    }, 1500)
  } catch (err) {
    error.value = handleError(err, 'Failed to save chart', 'saveChart')
  } finally {
    saving.value = false
  }
}
</script>
