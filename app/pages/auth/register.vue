<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signUp } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  name: '',
  email: '',
  password: ''
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await signUp(state.email, state.password, state.name)
    toast.add({
      title: 'Account created!',
      description: 'Welcome to Mortality Watch',
      color: 'success'
    })
    await router.push('/')
  } catch (error: unknown) {
    toast.add({
      title: 'Registration failed',
      description: (error instanceof Error ? error.message : (error as { data?: { message?: string } })?.data?.message) || 'An error occurred',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            Create Account
          </h1>
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            icon="i-lucide-x"
            size="sm"
          />
        </div>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormGroup
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            required
          />
        </UFormGroup>

        <UFormGroup
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </UFormGroup>

        <UFormGroup
          label="Password"
          name="password"
          required
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <template #hint>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 8 characters
            </p>
          </template>
        </UFormGroup>

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="loading"
        >
          Create Account
        </UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <UButton
            to="/auth/signin"
            variant="link"
            :padded="false"
          >
            Sign in
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
