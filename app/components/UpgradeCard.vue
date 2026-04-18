<template>
  <UCard class="max-w-5xl mx-auto">
    <div class="text-center py-8 px-4">
      <div v-if="!user">
        <div class="mb-6">
          <Icon
            name="i-lucide-sparkles"
            class="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4"
          />
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Sign Up Free for Full Access
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Create an account to unlock every charting, export, and analysis feature.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 text-left">
          <div class="flex gap-3">
            <Icon
              name="i-lucide-save"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Save Charts
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Keep your chart setups and rankings in your account.
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-image-off"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Clean Exports
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Remove watermarks and QR codes from your charts.
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-calculator"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Advanced Analytics
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Use ASD, z-scores, and the full analysis toolset.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            :to="signupUrl"
            color="primary"
            size="xl"
          >
            <Icon
              name="i-lucide-user-plus"
              class="w-5 h-5"
            />
            Sign Up Free
          </UButton>
          <UButton
            to="/features"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            View Full Access
            <Icon
              name="i-lucide-arrow-right"
              class="w-5 h-5"
            />
          </UButton>
        </div>
      </div>

      <div v-else>
        <div class="mb-6">
          <Icon
            name="i-lucide-badge-check"
            class="w-16 h-16 mx-auto text-emerald-500 mb-4"
          />
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Full Access Enabled
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            Your account already includes the complete Mortality Watch feature set.
          </p>
        </div>

        <div class="flex items-center justify-center gap-4">
          <UButton
            to="/explorer"
            color="primary"
            size="lg"
          >
            <Icon
              name="i-lucide-line-chart"
              class="w-5 h-5"
            />
            Open Explorer
          </UButton>
          <UButton
            to="/profile"
            color="neutral"
            variant="outline"
            size="lg"
          >
            <Icon
              name="i-lucide-user"
              class="w-5 h-5"
            />
            Open Profile
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { signupUrl } = useAuthRedirect()
</script>
