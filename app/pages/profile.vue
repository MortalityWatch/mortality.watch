<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  title: 'Profile'
})

useSeoMeta({
  title: 'Profile - Mortality Watch',
  description: 'Manage your Mortality Watch account settings, personal information, and subscription.',
  ogTitle: 'Profile - Mortality Watch',
  robots: 'noindex, nofollow'
})

const { user, updateProfile, refreshSession } = useAuth()
const toast = useToast()
const route = useRoute()
const { withRetry, handleError } = useErrorRecovery()

const savingProfile = ref(false)
const savingPassword = ref(false)
const exportingData = ref(false)

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
    // Clean up the URL without triggering Vue Router navigation/middleware
    window.history.replaceState({}, '', '/profile')
  } else if (route.query.canceled === 'true') {
    toast.add({
      title: 'Checkout canceled',
      description: 'You can subscribe anytime from your profile.',
      color: 'info'
    })
    // Clean up the URL without triggering Vue Router navigation/middleware
    window.history.replaceState({}, '', '/profile')
  }
})

async function saveProfile(profile: { firstName: string, lastName: string, displayName: string }) {
  savingProfile.value = true
  try {
    await withRetry(() => updateProfile(profile), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'saveProfile'
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

async function changePassword(passwords: { currentPassword: string, newPassword: string, confirmPassword: string }) {
  if (passwords.newPassword !== passwords.confirmPassword) {
    toast.add({
      title: 'Passwords do not match',
      description: 'Please make sure both passwords are identical',
      color: 'error'
    })
    return
  }

  savingPassword.value = true
  try {
    await withRetry(() => updateProfile({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    }), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'changePassword'
    })
    toast.add({
      title: 'Password changed',
      description: 'Your password has been updated',
      color: 'success'
    })
  } catch (error: unknown) {
    handleError(error, 'Failed to change password', 'changePassword')
  } finally {
    savingPassword.value = false
  }
}

async function exportData() {
  exportingData.value = true
  try {
    const response = await withRetry(() => $fetch('/api/user/export-data', {
      method: 'GET'
    }), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'exportData'
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
      <ProfileAccountInfo :user="user" />

      <!-- Subscription -->
      <SubscriptionCard />

      <!-- Invite Code (only shown if not Pro) -->
      <InviteCodeCard />

      <!-- Personal Information -->
      <ProfilePersonalInfo
        :user="user"
        :loading="savingProfile"
        @update:profile="saveProfile"
      />

      <!-- Security -->
      <ProfileSecurity
        :user="user"
        @change-password="changePassword"
      />

      <!-- Data & Privacy -->
      <ProfileDataPrivacy
        :user="user"
        :loading="exportingData"
        @export-data="exportData"
      />

      <!-- Danger Zone -->
      <ProfileDangerZone :user="user" />
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
