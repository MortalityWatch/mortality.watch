<script setup lang="ts">
import type { User } from '#db/schema'

type AuthUser = Omit<User, 'passwordHash'>

const props = defineProps<{
  user: AuthUser
  loading: boolean
}>()

const emit = defineEmits<{
  'update:profile': [profile: { firstName: string, lastName: string, displayName: string }]
}>()

const profileState = reactive({
  firstName: '',
  lastName: '',
  displayName: ''
})

// Initialize profile form with user data
watch(() => props.user, (newUser) => {
  if (newUser) {
    profileState.firstName = newUser.firstName || ''
    profileState.lastName = newUser.lastName || ''
    profileState.displayName = newUser.displayName || ''
  }
}, { immediate: true })

function handleSubmit() {
  emit('update:profile', {
    firstName: profileState.firstName,
    lastName: profileState.lastName,
    displayName: profileState.displayName
  })
}
</script>

<template>
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
      @submit.prevent="handleSubmit"
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
          :loading="loading"
          :disabled="loading"
        >
          Save Changes
        </UButton>
      </div>
    </form>
  </UCard>
</template>
