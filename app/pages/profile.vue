<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

definePageMeta({
  middleware: 'auth'
})

const { user, updateProfile, signOut, loading, refreshSession } = useAuth()
const toast = useToast()
const route = useRoute()

const profileState = reactive({
  firstName: '',
  lastName: '',
  displayName: ''
})

// Show success message after checkout
onMounted(async () => {
  if (route.query.success === 'true') {
    // Refresh user session to get updated tier from database
    await refreshSession()

    toast.add({
      title: 'Subscription activated!',
      description: 'Your payment was successful. Welcome to Pro! 🎉',
      color: 'success'
    })
    // Clean up the URL
    const router = useRouter()
    router.replace({ query: {} })
  } else if (route.query.canceled === 'true') {
    toast.add({
      title: 'Checkout canceled',
      description: 'You can subscribe anytime from your profile.',
      color: 'info'
    })
    // Clean up the URL
    const router = useRouter()
    router.replace({ query: {} })
  }
})

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const savingProfile = ref(false)
const savingPassword = ref(false)
const deletingAccount = ref(false)
const showDeleteModal = ref(false)
const exportingData = ref(false)

// Initialize profile form with user data
watch(user, (newUser) => {
  if (newUser) {
    profileState.firstName = newUser.firstName || ''
    profileState.lastName = newUser.lastName || ''
    profileState.displayName = newUser.displayName || ''
  }
}, { immediate: true })

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateProfile({
      firstName: profileState.firstName,
      lastName: profileState.lastName,
      displayName: profileState.displayName
    })
    toast.add({
      title: 'Profile updated',
      description: 'Your profile has been saved',
      color: 'success'
    })
  } catch (error: unknown) {
    handleError(error, 'Failed to update profile', 'saveProfile')
  } finally {
    savingProfile.value = false
  }
}

async function exportData() {
  exportingData.value = true
  try {
    const response = await $fetch('/api/user/export-data', {
      method: 'GET'
    })

    // Convert response to JSON blob and download
    const blob = new Blob([JSON.stringify(response, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mortality-watch-data-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.add({
      title: 'Data exported',
      description: 'Your data has been downloaded as a JSON file',
      color: 'success'
    })
  } catch (error: unknown) {
    handleError(error, 'Failed to export data', 'exportData')
  } finally {
    exportingData.value = false
  }
}

function openDeleteModal() {
  showDeleteModal.value = true
}

async function handleAccountDeleted() {
  showDeleteModal.value = false
  // Sign out and redirect
  await signOut()
}

async function changePassword() {
  if (passwordState.newPassword !== passwordState.confirmPassword) {
    toast.add({
      title: 'Passwords do not match',
      description: 'Please make sure both passwords are identical',
      color: 'error'
    })
    return
  }

  savingPassword.value = true
  try {
    await updateProfile({
      currentPassword: passwordState.currentPassword,
      newPassword: passwordState.newPassword
    })
    toast.add({
      title: 'Password changed',
      description: 'Your password has been updated',
      color: 'success'
    })
    // Clear password fields
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch (error: unknown) {
    handleError(error, 'Failed to change password', 'changePassword')
  } finally {
    savingPassword.value = false
  }
}

// Tier badge is now handled by the TierBadge component
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        Profile Settings
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Manage your account settings and preferences
      </p>
    </div>

    <div
      v-if="user"
      class="space-y-6"
    >
      <!-- Account Info -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">
                Account Information
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View your account details
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
            <div class="flex items-center gap-2">
              <p class="text-base text-gray-900 dark:text-gray-100">
                {{ user.email }}
              </p>
              <UBadge
                :color="user.emailVerified ? 'success' : 'warning'"
                variant="subtle"
                size="xs"
              >
                {{ user.emailVerified ? 'Verified' : 'Not Verified' }}
              </UBadge>
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
              {{ new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Subscription -->
      <SubscriptionCard />

      <!-- Profile Form -->
      <UCard>
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Personal Information
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update your personal details
            </p>
          </div>
        </template>

        <form
          class="space-y-4"
          @submit.prevent="saveProfile"
        >
          <div>
            <label
              for="displayName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Display Name
            </label>
            <UInput
              id="displayName"
              v-model="profileState.displayName"
              type="text"
              placeholder="Your Display Name"
              name="displayName"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              This name will be shown on charts you create. If not set, we'll use your first name.
            </p>
          </div>

          <div>
            <label
              for="firstName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              First Name
            </label>
            <UInput
              id="firstName"
              v-model="profileState.firstName"
              type="text"
              placeholder="Your first name"
              name="firstName"
            />
          </div>

          <div>
            <label
              for="lastName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Last Name
            </label>
            <UInput
              id="lastName"
              v-model="profileState.lastName"
              type="text"
              placeholder="Your last name"
              name="lastName"
            />
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              type="submit"
              :loading="savingProfile"
              :disabled="savingProfile || loading"
            >
              Save Changes
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Change Password -->
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
          @submit.prevent="changePassword"
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
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
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
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
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
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Re-enter your new password to confirm
            </p>
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              type="submit"
              :loading="savingPassword"
              :disabled="savingPassword || loading || !passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword"
            >
              Update Password
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Data & Privacy -->
      <UCard>
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">
              Data & Privacy
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your personal data and privacy
            </p>
          </div>
        </template>

        <div class="space-y-6">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="flex items-start gap-3 mb-3">
              <UIcon
                name="i-lucide-download"
                class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
              />
              <div>
                <h3 class="text-base font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Export Your Data
                </h3>
                <div class="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                  <p>
                    Download a copy of all your personal data in JSON format (GDPR Article 15).
                  </p>
                  <p>
                    This includes your profile, saved charts, and subscription history.
                  </p>
                </div>
              </div>
            </div>
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-download"
              :loading="exportingData"
              :disabled="exportingData"
              @click="exportData"
            >
              Export My Data
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Danger Zone -->
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
              @click="signOut"
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
      </UCard>
    </div>

    <div
      v-else
      class="text-center py-12"
    >
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Loading profile...
      </p>
    </div>

    <!-- Delete Account Modal -->
    <DeleteAccountModal
      :open="showDeleteModal"
      @close="showDeleteModal = false"
      @deleted="handleAccountDeleted"
    />
  </div>
</template>
