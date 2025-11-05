<script setup lang="ts">
import type { User } from '#db/schema'
import { passwordChangeSchema } from '~/schemas/profile'

type AuthUser = Omit<User, 'passwordHash'>

defineProps<{
  user: AuthUser
}>()

const emit = defineEmits<{
  'change-password': [passwords: { currentPassword: string, newPassword: string, confirmPassword: string }]
}>()

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Initialize form validation
const { validate, clearErrors, getError } = useFormValidation(passwordChangeSchema)

const savingPassword = ref(false)

async function handleSubmit() {
  // Validate form before submission
  const result = validate(passwordState)

  if (!result.valid) {
    return
  }

  savingPassword.value = true
  try {
    emit('change-password', {
      currentPassword: passwordState.currentPassword,
      newPassword: passwordState.newPassword,
      confirmPassword: passwordState.confirmPassword
    })

    // Clear password fields on success (parent will handle error notifications)
    // Wait a bit for parent to handle the event
    await new Promise(resolve => setTimeout(resolve, 100))

    // Only clear if no errors occurred (parent manages error state)
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
    clearErrors()
  } finally {
    savingPassword.value = false
  }
}

const isFormValid = computed(() => {
  return passwordState.currentPassword
    && passwordState.newPassword
    && passwordState.confirmPassword
})
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="text-xl font-semibold">
          Security
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your password and security settings
        </p>
      </div>
    </template>

    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <div>
        <label
          for="currentPassword"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Current Password
        </label>
        <UInput
          id="currentPassword"
          v-model="passwordState.currentPassword"
          type="password"
          placeholder="Enter current password"
          autocomplete="current-password"
          name="currentPassword"
          :error="!!getError('currentPassword')"
        />
        <p
          v-if="getError('currentPassword')"
          class="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {{ getError('currentPassword') }}
        </p>
        <p
          v-else
          class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          Enter your current password to verify your identity
        </p>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-800" />

      <div>
        <label
          for="newPassword"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          New Password
        </label>
        <UInput
          id="newPassword"
          v-model="passwordState.newPassword"
          type="password"
          placeholder="Enter new password"
          autocomplete="new-password"
          name="newPassword"
          :error="!!getError('newPassword')"
        />
        <p
          v-if="getError('newPassword')"
          class="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {{ getError('newPassword') }}
        </p>
        <p
          v-else
          class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          Choose a strong password with at least 8 characters
        </p>
      </div>

      <div>
        <label
          for="confirmPassword"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Confirm New Password
        </label>
        <UInput
          id="confirmPassword"
          v-model="passwordState.confirmPassword"
          type="password"
          placeholder="Confirm new password"
          autocomplete="new-password"
          name="confirmPassword"
          :error="!!getError('confirmPassword')"
        />
        <p
          v-if="getError('confirmPassword')"
          class="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {{ getError('confirmPassword') }}
        </p>
        <p
          v-else
          class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          Re-enter your new password to confirm
        </p>
      </div>

      <div class="flex justify-end pt-2">
        <UButton
          type="submit"
          :loading="savingPassword"
          :disabled="savingPassword || !isFormValid"
        >
          Update Password
        </UButton>
      </div>
    </form>
  </UCard>
</template>
