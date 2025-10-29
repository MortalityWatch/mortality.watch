<template>
  <UCard class="max-w-5xl mx-auto">
    <div class="text-center py-8 px-4">
      <!-- Tier 0: Anonymous/Public Users -->
      <div v-if="!user">
        <div class="mb-6">
          <Icon
            name="i-lucide-sparkles"
            class="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4"
          />
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Sign Up FREE to Unlock More Features
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Create a free account and get instant access to powerful tools
          </p>
        </div>

        <!-- Free Features Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 text-left">
          <div class="flex gap-3">
            <Icon
              name="i-lucide-save"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Save Charts
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Save your custom charts to "My Charts" for quick access
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-palette"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Custom Colors
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Personalize your visualizations with custom color schemes
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-chart-line"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                All Baseline Methods
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Access all statistical models for baseline calculations
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-download"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Export Data
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Download chart data as CSV or JSON
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-calendar"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Extended Time Periods
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Access full historical data ranges
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-share-2"
              class="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Share Charts
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Publish and share your visualizations
              </p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            to="/signup"
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
            to="/pricing"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            View All Features
            <Icon
              name="i-lucide-arrow-right"
              class="w-5 h-5"
            />
          </UButton>
        </div>
      </div>

      <!-- Tier 1: Registered Users (Free) -->
      <div v-else-if="user.tier === 1">
        <div class="mb-6">
          <Icon
            name="i-lucide-zap"
            class="w-16 h-16 mx-auto text-amber-600 dark:text-amber-400 mb-4"
          />
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Upgrade to Pro
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Unlock advanced analytics and premium features
          </p>
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            $9.99/month or $99/year
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            Save $20 with annual billing
          </p>
        </div>

        <!-- Pro Features Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 text-left">
          <div class="flex gap-3">
            <Icon
              name="i-lucide-image-off"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                No Watermarks
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Clean charts without branding for publications
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-scan-line"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                No QR Codes
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Professional charts without QR code overlays
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-activity"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Single Age Group LE
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Advanced life expectancy calculations
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-trending-up"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Age Standardized Deaths
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Levitt method for age standardization
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-calculator"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Z-Score Calculations
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Statistical significance testing
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Icon
              name="i-lucide-headphones"
              class="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <div>
              <h3 class="font-semibold mb-1">
                Priority Support
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Get help faster with priority email support
              </p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton
            to="/subscribe"
            color="primary"
            size="xl"
          >
            <Icon
              name="i-lucide-crown"
              class="w-5 h-5"
            />
            Upgrade to Pro
          </UButton>
          <UButton
            to="/pricing"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            Compare Plans
            <Icon
              name="i-lucide-arrow-right"
              class="w-5 h-5"
            />
          </UButton>
        </div>
      </div>

      <!-- Tier 2: Pro Users (Already subscribed - thank you message) -->
      <div v-else-if="user.tier === 2">
        <div class="mb-6">
          <Icon
            name="i-lucide-crown"
            class="w-16 h-16 mx-auto text-amber-500 mb-4"
          />
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Thank You for Being a Pro Member!
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            You have access to all premium features
          </p>
        </div>

        <div class="flex items-center justify-center gap-4">
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
            Manage Subscription
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface User {
  id: number
  email: string
  tier: 0 | 1 | 2
  role: 'user' | 'admin'
}

// TODO: Get user from auth composable when auth is implemented
// For now, assume user is not logged in (Tier 0)
const user = ref<User | null>(null)

// Example: const { user } = useAuth()
</script>
