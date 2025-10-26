<script setup lang="ts">
definePageMeta({
  layout: false
})

const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await signIn(state.email, state.password)
    toast.add({
      title: 'Welcome back!',
      description: 'Signed in successfully',
      color: 'green'
    })
    // Redirect to where they came from or home
    const redirect = route.query.redirect as string || '/'
    await router.push(redirect)
  } catch (error: unknown) {
    toast.add({
      title: 'Sign in failed',
      description: error.data?.message || 'Invalid email or password',
      color: 'red'
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
            Sign In
          </h1>
          <UButton
            to="/"
            variant="ghost"
            color="gray"
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
            autocomplete="current-password"
            required
          />
        </UFormGroup>

        <div class="flex items-center justify-end">
          <UButton
            to="/auth/forgot-password"
            variant="link"
            :padded="false"
            size="sm"
          >
            Forgot password?
          </UButton>
        </div>

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="loading"
        >
          Sign In
        </UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <UButton
            to="/auth/register"
            variant="link"
            :padded="false"
          >
            Create one
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
