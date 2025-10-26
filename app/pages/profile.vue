<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, updateProfile, signOut, loading } = useAuth()
const toast = useToast()

const profileState = reactive({
  name: ''
})

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const savingProfile = ref(false)
const savingPassword = ref(false)

// Initialize profile form with user data
watch(user, (newUser) => {
  if (newUser) {
    profileState.name = newUser.name || ''
  }
}, { immediate: true })

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateProfile({ name: profileState.name })
    toast.add({
      title: 'Profile updated',
      description: 'Your profile has been saved',
      color: 'green'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: error.data?.message || 'Failed to update profile',
      color: 'red'
    })
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (passwordState.newPassword !== passwordState.confirmPassword) {
    toast.add({
      title: 'Passwords do not match',
      description: 'Please make sure both passwords are identical',
      color: 'red'
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
      color: 'green'
    })
    // Clear password fields
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch (error: unknown) {
    toast.add({
      title: 'Password change failed',
      description: error.data?.message || 'Failed to change password',
      color: 'red'
    })
  } finally {
    savingPassword.value = false
  }
}

const tierBadgeColor = computed(() => {
  if (!user.value) return 'gray'
  switch (user.value.tier) {
    case 2:
      return 'yellow'
    case 1:
      return 'blue'
    default:
      return 'gray'
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
            <h2 class="text-xl font-semibold">
              Account Information
            </h2>
            <UBadge
              :color="tierBadgeColor"
              variant="subtle"
            >
              {{ tierLabel }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <p class="text-gray-900 dark:text-gray-100 mt-1">
              {{ user.email }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <p class="text-gray-900 dark:text-gray-100 mt-1">
              {{ user.role === 'admin' ? 'Administrator' : 'User' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
            <p class="text-gray-900 dark:text-gray-100 mt-1">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Profile Form -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Profile
          </h2>
        </template>

        <form
          class="space-y-4"
          @submit.prevent="saveProfile"
        >
          <UFormGroup
            label="Name"
            name="name"
          >
            <UInput
              v-model="profileState.name"
              type="text"
              placeholder="Your name"
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
          <h2 class="text-xl font-semibold">
            Change Password
          </h2>
        </template>

        <form
          class="space-y-4"
          @submit.prevent="changePassword"
        >
          <UFormGroup
            label="Current Password"
            name="currentPassword"
          >
            <UInput
              v-model="passwordState.currentPassword"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </UFormGroup>

          <UFormGroup
            label="New Password"
            name="newPassword"
          >
            <UInput
              v-model="passwordState.newPassword"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
            />
            <template #hint>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 8 characters
              </p>
            </template>
          </UFormGroup>

          <UFormGroup
            label="Confirm New Password"
            name="confirmPassword"
          >
            <UInput
              v-model="passwordState.confirmPassword"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </UFormGroup>

          <div class="flex justify-end">
            <UButton
              type="submit"
              color="primary"
              :loading="savingPassword"
              :disabled="savingPassword || loading"
            >
              Change Password
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Danger Zone -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </template>

        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">
              Sign Out
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Sign out of your account on this device.
            </p>
            <UButton
              color="red"
              variant="soft"
              @click="signOut"
            >
              Sign Out
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
  </div>
</template>
