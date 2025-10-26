<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, updateProfile, signOut, loading } = useAuth()
const toast = useToast()

const profileState = reactive({
  firstName: '',
  lastName: ''
})

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const savingProfile = ref(false)
const savingPassword = ref(false)
const deletingAccount = ref(false)

// Initialize profile form with user data
watch(user, (newUser) => {
  if (newUser) {
    profileState.firstName = newUser.firstName || ''
    profileState.lastName = newUser.lastName || ''
  }
}, { immediate: true })

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateProfile({
      firstName: profileState.firstName,
      lastName: profileState.lastName
    })
    toast.add({
      title: 'Profile updated',
      description: 'Your profile has been saved',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    savingProfile.value = false
  }
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return
  }

  deletingAccount.value = true
  try {
    await $fetch('/api/user/account', {
      method: 'DELETE'
    })
    toast.add({
      title: 'Account deleted',
      description: 'Your account has been permanently deleted',
      color: 'success'
    })
    // Sign out and redirect
    await signOut()
  } catch (error: unknown) {
    toast.add({
      title: 'Deletion failed',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    deletingAccount.value = false
  }
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
    toast.add({
      title: 'Password change failed',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    savingPassword.value = false
  }
}

const tierBadgeColor = computed(() => {
  if (!user.value) return 'neutral'
  switch (user.value.tier) {
    case 2:
      return 'warning'
    case 1:
      return 'info'
    default:
      return 'neutral'
  }
})

const tierLabel = computed(() => {
  if (!user.value) return 'Free'
  switch (user.value.tier) {
    case 2:
      return 'Pro'
    case 1:
      return 'Registered'
    default:
      return 'Free'
  }
})
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
            <UBadge
              :color="tierBadgeColor"
              variant="subtle"
              size="lg"
            >
              {{ tierLabel }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Email Address">
            <p class="text-gray-900 dark:text-gray-100">
              {{ user.email }}
            </p>
          </UFormGroup>

          <UFormGroup label="Account Type">
            <p class="text-gray-900 dark:text-gray-100">
              {{ user.role === 'admin' ? 'Administrator' : 'User' }}
            </p>
          </UFormGroup>

          <UFormGroup label="Member Since">
            <p class="text-gray-900 dark:text-gray-100">
              {{ new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </p>
          </UFormGroup>
        </div>
      </UCard>

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
          <UFormGroup
            label="First Name"
            name="firstName"
          >
            <UInput
              v-model="profileState.firstName"
              type="text"
              placeholder="Your first name"
            />
          </UFormGroup>

          <UFormGroup
            label="Last Name"
            name="lastName"
          >
            <UInput
              v-model="profileState.lastName"
              type="text"
              placeholder="Your last name"
            />
          </UFormGroup>

          <div class="flex justify-end">
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
          class="space-y-4"
          @submit.prevent="changePassword"
        >
          <UFormGroup
            label="Current Password"
            name="currentPassword"
            description="Enter your current password to verify your identity"
          >
            <UInput
              v-model="passwordState.currentPassword"
              type="password"
              placeholder="Enter current password"
              autocomplete="current-password"
            />
          </UFormGroup>

          <UDivider />

          <UFormGroup
            label="New Password"
            name="newPassword"
            description="Choose a strong password with at least 8 characters"
          >
            <UInput
              v-model="passwordState.newPassword"
              type="password"
              placeholder="Enter new password"
              autocomplete="new-password"
            />
          </UFormGroup>

          <UFormGroup
            label="Confirm New Password"
            name="confirmPassword"
            description="Re-enter your new password to confirm"
          >
            <UInput
              v-model="passwordState.confirmPassword"
              type="password"
              placeholder="Confirm new password"
              autocomplete="new-password"
            />
          </UFormGroup>

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

        <div class="space-y-6">
          <div>
            <UFormGroup
              label="Sign Out"
              description="End your current session on this device"
            >
              <UButton
                color="error"
                variant="soft"
                @click="signOut"
              >
                Sign Out
              </UButton>
            </UFormGroup>
          </div>

          <UDivider />

          <div>
            <UFormGroup
              label="Delete Account"
              description="Permanently delete your account and all associated data. This action cannot be undone and you will lose all saved charts, preferences, and account history."
            >
              <UButton
                color="error"
                :loading="deletingAccount"
                :disabled="deletingAccount"
                @click="deleteAccount"
              >
                Delete Account Permanently
              </UButton>
            </UFormGroup>
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
  </div>
</template>
