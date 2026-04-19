<template>
  <UContainer>
    <div class="text-center mb-12 mt-8">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Features & Access
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Mortality Watch now has two access levels: guest access for everyone, and full access with a free account.
      </p>
    </div>

    <UPricingPlans class="mb-12">
      <UPricingPlan
        title="Guest"
        description="Explore without registration"
        :badge="tier === 0 ? { label: 'Current Access', color: 'neutral' } : undefined"
        :features="[
          'View mortality charts',
          'Basic controls and filters',
          'Share URLs',
          'View ranking page',
          'Standard baseline only'
        ]"
        :button="{ label: 'Start Exploring', to: '/explorer', color: 'neutral' }"
        class="border-2 border-gray-900 dark:border-gray-100"
      />

      <UPricingPlan
        title="Registered"
        description="Full feature access with a free account"
        :badge="isAuthenticated ? { label: 'Current Access', color: 'primary' } : { label: 'Free Account', color: 'primary' }"
        :features="[
          { title: 'Everything in Guest, plus:' },
          { title: 'Save charts and rankings', icon: 'i-lucide-save' },
          { title: 'Custom colors and chart sizing', icon: 'i-lucide-palette' },
          { title: 'All baseline methods and extended date ranges', icon: 'i-lucide-chart-line' },
          { title: 'Data export and global chart history', icon: 'i-lucide-file-spreadsheet' },
          { title: 'Watermark-free and QR-free charts', icon: 'i-lucide-image-off' },
          { title: 'Advanced metrics including ASD and z-scores', icon: 'i-lucide-calculator' }
        ]"
        :button="isAuthenticated
          ? { label: 'Open Explorer', to: '/explorer', color: 'neutral' }
          : { label: 'Sign Up Free', to: '/signup', color: 'primary' }"
        class="border-2 border-blue-500 dark:border-blue-400"
      />
    </UPricingPlans>

    <div class="max-w-3xl mx-auto mb-12">
      <h2 class="text-3xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <h3 class="font-semibold">
              What do I get when I register?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Registered users get the full Mortality Watch feature set, including saved charts, exports, advanced analytics, and clean chart output.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Do I need to pay to remove watermarks or unlock advanced analysis?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            No. If you have an account, you get those features automatically.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              What can guests do without registering?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Guests can browse charts, use the core explorer, and share links. Registration is only needed for saved work and the advanced feature set.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Is account registration still free?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Yes. Registration is free.
          </p>
        </UCard>
      </div>
    </div>

    <div class="text-center mb-12">
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-4">
        Have questions? We're here to help.
      </p>
      <UButton
        to="/contact"
        color="neutral"
        variant="outline"
        size="lg"
      >
        Contact Us
      </UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { tier, isAuthenticated } = useAuth()
const { trackSubscriptionView } = useAnalytics()

onMounted(() => {
  trackSubscriptionView()
})

definePageMeta({
  title: 'Features'
})

useSeoMeta({
  title: 'Features & Access',
  description: 'Explore Mortality Watch guest and registered access. Creating a free account unlocks the full feature set.',
  ogTitle: 'Mortality Watch Features & Access',
  ogDescription: 'Guest access is open to everyone. Free registration unlocks the full feature set.',
  ogImage: '/og-image.png',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
