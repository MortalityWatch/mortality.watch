<script setup lang="ts">
import type { User } from '#db/schema'

type AuthUser = Omit<User, 'passwordHash'>

defineProps<{
  user: AuthUser
}>()

const emit = defineEmits<{
  'delete-account': []
  'sign-out': []
}>()

const { signOut } = useAuth()
const deletingAccount = ref(false)
const showDeleteModal = ref(false)

function handleSignOut() {
  signOut()
}

function openDeleteModal() {
  showDeleteModal.value = true
  emit('delete-account')
}

async function handleAccountDeleted() {
  showDeleteModal.value = false
  // Sign out and redirect will be handled by parent
  await signOut()
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Irreversible account actions
        </p>
      </div>
    </template>

    <div class="space-y-8">
      <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Sign Out
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          End your current session on this device. You'll need to sign in again to access your account.
          This does not affect your account or data.
        </p>
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-log-out"
          @click="handleSignOut"
        >
          Sign Out
        </UButton>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-800" />

      <div class="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
        <div class="flex items-start gap-3 mb-3">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
          />
          <div>
            <h3 class="text-base font-semibold text-red-900 dark:text-red-200 mb-2">
              Delete Account
            </h3>
            <div class="text-sm text-red-800 dark:text-red-300 space-y-2">
              <p>
                Permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
              </p>
              <p class="font-medium">
                You will lose:
              </p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>All saved charts and visualizations</li>
                <li>Account preferences and settings</li>
                <li>Account history and activity</li>
                <li>Sessions and login history</li>
              </ul>
              <p class="text-xs mt-2">
                Note: Payment records will be anonymized but retained for legal compliance.
              </p>
            </div>
          </div>
        </div>
        <UButton
          color="error"
          icon="i-lucide-trash-2"
          :loading="deletingAccount"
          :disabled="deletingAccount"
          @click="openDeleteModal"
        >
          Delete Account Permanently
        </UButton>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <DeleteAccountModal
      v-if="showDeleteModal"
      :open="showDeleteModal"
      @close="showDeleteModal = false"
      @deleted="handleAccountDeleted"
    />
  </UCard>
</template>
