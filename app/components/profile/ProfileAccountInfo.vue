<script setup lang="ts">
import type { User } from '#db/schema'
import { formatChartDate } from '@/lib/utils/dates'
import { handleError } from '@/lib/errors/errorHandler'

type AuthUser = Omit<User, 'passwordHash'>

const props = defineProps<{
  user: AuthUser
}>()

const emit = defineEmits<{
  updated: []
}>()

const { updateProfile } = useAuth()
const toast = useToast()

const isEditingEmail = ref(false)
const newEmail = ref('')
const isSubmitting = ref(false)

// Check if user has a placeholder email (from Twitter OAuth)
const hasPlaceholderEmail = computed(() => {
  return props.user.email.endsWith('@twitter.placeholder.local')
})

function startEditingEmail() {
  newEmail.value = hasPlaceholderEmail.value ? '' : props.user.email
  isEditingEmail.value = true
}

function cancelEditingEmail() {
  isEditingEmail.value = false
  newEmail.value = ''
}

async function saveEmail() {
  if (!newEmail.value || newEmail.value === props.user.email) {
    cancelEditingEmail()
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail.value)) {
    toast.add({
      title: 'Invalid email',
      description: 'Please enter a valid email address',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    await updateProfile({ email: newEmail.value })
    toast.add({
      title: 'Verification email sent',
      description: 'Please check your new email address to verify the change',
      color: 'success'
    })
    isEditingEmail.value = false
    emit('updated')
  } catch (err) {
    const message = handleError(err, 'Failed to update email', 'updateEmail')
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            Account Information
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your account details
          </p>
        </div>
        <TierBadge
          :tier="user.tier"
          size="lg"
        />
      </div>
    </template>

    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Address
        </label>

        <!-- Editing mode -->
        <div
          v-if="isEditingEmail"
          class="space-y-3"
        >
          <UInput
            v-model="newEmail"
            type="email"
            placeholder="Enter new email address"
            :disabled="isSubmitting"
            @keyup.enter="saveEmail"
            @keyup.escape="cancelEditingEmail"
          />
          <div class="flex gap-2">
            <UButton
              size="sm"
              :loading="isSubmitting"
              @click="saveEmail"
            >
              Save
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              :disabled="isSubmitting"
              @click="cancelEditingEmail"
            >
              Cancel
            </UButton>
          </div>
        </div>

        <!-- Display mode -->
        <div
          v-else
          class="flex items-center gap-2 flex-wrap"
        >
          <p
            v-if="hasPlaceholderEmail"
            class="text-base text-gray-500 dark:text-gray-400 italic"
          >
            No email set
          </p>
          <p
            v-else
            class="text-base text-gray-900 dark:text-gray-100"
          >
            {{ user.email }}
          </p>
          <UBadge
            v-if="!hasPlaceholderEmail"
            :color="user.emailVerified ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          >
            {{ user.emailVerified ? 'Verified' : 'Not Verified' }}
          </UBadge>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-pencil"
            @click="startEditingEmail"
          >
            {{ hasPlaceholderEmail ? 'Add email' : 'Change' }}
          </UButton>
        </div>

        <!-- Pending email notification -->
        <div
          v-if="user.pendingEmail"
          class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300"
        >
          Verification pending for: {{ user.pendingEmail }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Account Type
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ user.role === 'admin' ? 'Administrator' : 'User' }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Member Since
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ formatChartDate(user.createdAt, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>
    </div>
  </UCard>
</template>
