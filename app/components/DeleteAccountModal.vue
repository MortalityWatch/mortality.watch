<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  deleted: []
}>()

const password = ref('')
const confirmText = ref('')
const step = ref<1 | 2>(1)
const deleting = ref(false)
const toast = useToast()

// Reset state when modal is closed
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    password.value = ''
    confirmText.value = ''
    step.value = 1
    deleting.value = false
  }
})

const isConfirmValid = computed(() => {
  return confirmText.value.toLowerCase() === 'delete my account'
})

function nextStep(): void {
  if (step.value === 1 && isConfirmValid.value) {
    step.value = 2
  }
}

function previousStep(): void {
  if (step.value === 2) {
    step.value = 1
    password.value = ''
  }
}

async function confirmDeletion(): Promise<void> {
  if (!password.value) {
    toast.add({
      title: 'Password required',
      description: 'Please enter your password to confirm deletion',
      color: 'error'
    })
    return
  }

  deleting.value = true
  try {
    await $fetch('/api/user/account', {
      method: 'DELETE',
      body: {
        password: password.value
      }
    })

    toast.add({
      title: 'Account deleted',
      description: 'Your account has been permanently deleted',
      color: 'success'
    })

    emit('deleted')
  } catch (error: unknown) {
    handleError(error, 'Failed to delete account', 'confirmDeletion')
  } finally {
    deleting.value = false
  }
}

function handleClose(): void {
  if (!deleting.value) {
    emit('close')
  }
}
</script>

<template>
  <UModal
    :model-value="open"
    :prevent-close="deleting"
    @update:model-value="handleClose"
  >
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-5 h-5 text-red-600 dark:text-red-400"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Account
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Step {{ step }} of 2
            </p>
          </div>
        </div>
      </template>

      <!-- Step 1: Confirmation -->
      <div
        v-if="step === 1"
        class="space-y-4"
      >
        <div class="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <h4 class="text-base font-semibold text-red-900 dark:text-red-200 mb-3">
            Warning: This action cannot be undone
          </h4>
          <div class="text-sm text-red-800 dark:text-red-300 space-y-3">
            <p>
              Deleting your account will permanently remove:
            </p>
            <ul class="list-disc list-inside space-y-1.5 ml-2">
              <li>Your profile and personal information</li>
              <li>All saved charts and visualizations</li>
              <li>Account preferences and settings</li>
              <li>All sessions and login history</li>
            </ul>
            <p class="font-medium mt-3">
              Note: Payment records will be anonymized but retained for legal compliance.
            </p>
          </div>
        </div>

        <div>
          <label
            for="confirmText"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Type <span class="font-semibold">"delete my account"</span> to confirm
          </label>
          <UInput
            id="confirmText"
            v-model="confirmText"
            type="text"
            placeholder="delete my account"
            autocomplete="off"
            :disabled="deleting"
          />
        </div>
      </div>

      <!-- Step 2: Password Verification -->
      <div
        v-if="step === 2"
        class="space-y-4"
      >
        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            For your security, please enter your password to confirm the deletion of your account.
          </p>
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Password
          </label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            autocomplete="current-password"
            :disabled="deleting"
            @keydown.enter="confirmDeletion"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Enter your current password to verify your identity
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between gap-3">
          <UButton
            v-if="step === 2"
            color="neutral"
            variant="ghost"
            :disabled="deleting"
            @click="previousStep"
          >
            Back
          </UButton>
          <div
            v-else
            class="flex-1"
          />
          <div class="flex items-center gap-3">
            <UButton
              color="neutral"
              variant="soft"
              :disabled="deleting"
              @click="handleClose"
            >
              Cancel
            </UButton>
            <UButton
              v-if="step === 1"
              color="error"
              :disabled="!isConfirmValid || deleting"
              @click="nextStep"
            >
              Continue
            </UButton>
            <UButton
              v-else
              color="error"
              :loading="deleting"
              :disabled="!password || deleting"
              @click="confirmDeletion"
            >
              Delete Account Permanently
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
