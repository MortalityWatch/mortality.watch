<template>
  <UContainer>
    <!-- Header -->
    <div class="text-center mb-12 mt-8">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Features & Plans
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Powerful mortality data analysis for everyone. Sign up and get {{ freeTrialDays }} days of Pro free.
      </p>
    </div>

    <!-- Pricing Plans -->
    <UPricingPlans class="mb-12">
      <!-- Public Tier -->
      <UPricingPlan
        title="Public"
        description="Explore without registration"
        price="Free"
        :badge="tier === 0 ? { label: 'Current Plan', color: 'neutral' } : undefined"
        :features="[
          'View mortality charts',
          'Basic controls and filters',
          'Share URLs',
          'View ranking page',
          'Conservative baseline only'
        ]"
        :button="{ label: 'Start Exploring', to: '/explorer', color: 'neutral' }"
        class="border-2 border-gray-900 dark:border-gray-100"
      />

      <!-- Free Tier -->
      <div class="relative">
        <!-- Trial banner overlay -->
        <div
          v-if="!isAuthenticated"
          class="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 rounded-full border border-purple-300 dark:border-purple-700"
        >
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-sparkles"
              class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"
            />
            <span class="text-xs font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
              {{ freeTrialDays }}-day Pro trial included
            </span>
          </div>
        </div>
        <UPricingPlan
          title="Free"
          description="Full-featured, forever free"
          price="Free"
          :badge="tier === 1 ? { label: 'Current Plan', color: 'primary' } : tier >= 2 ? { label: 'Active', color: 'primary' } : undefined"
          :features="[
            { title: 'All Public features, plus:' },
            { title: 'Save charts', icon: 'i-lucide-save' },
            { title: 'Custom colors', icon: 'i-lucide-palette' },
            { title: 'All baseline methods', icon: 'i-lucide-chart-line' },
            { title: 'Export data', icon: 'i-lucide-file-spreadsheet' },
            { title: 'Extended time periods', icon: 'i-lucide-calendar' },
            { title: 'Share charts', icon: 'i-lucide-share-2' }
          ]"
          :button="tier >= 1
            ? { label: 'Start Exploring', to: '/explorer', color: 'neutral' }
            : { label: 'Start Free Trial', to: '/signup', color: 'primary' }"
          class="border-2 border-blue-500 dark:border-blue-400"
        />
      </div>

      <!-- Pro Tier -->
      <UPricingPlan
        title="Pro"
        description="Professional features"
        price="$9.99"
        billing-cycle="/month"
        tagline="or $99/year"
        :badge="tier === 2 ? { label: 'Current Plan', color: 'primary' } : undefined"
        :features="[
          { title: 'All Free features, plus:' },
          { title: 'No watermarks', icon: 'i-lucide-image-off' },
          { title: 'No QR codes', icon: 'i-lucide-scan-line' },
          { title: 'Global chart history', icon: 'i-lucide-library' },
          { title: 'Single age group LE', icon: 'i-lucide-activity' },
          { title: 'Age standardized deaths', icon: 'i-lucide-trending-up' },
          { title: 'Z-score calculations', icon: 'i-lucide-calculator' },
          { title: 'Priority support', icon: 'i-lucide-headphones' }
        ]"
        :button="tier === 2
          ? { label: 'Start Exploring', to: '/explorer', color: 'neutral' }
          : { label: 'Upgrade to Pro', to: '/subscribe', color: 'primary', class: 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600' }"
        class="border-2 border-purple-500 dark:border-purple-400"
      />
    </UPricingPlans>

    <!-- FAQ Section -->
    <div class="max-w-3xl mx-auto mb-12">
      <h2 class="text-3xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Can I upgrade or downgrade anytime?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Yes! You can upgrade to Pro anytime. If you downgrade, you'll retain Pro features
            until the end of your current billing period.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              What payment methods do you accept?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            We accept all major credit cards (Visa, Mastercard, American Express) through
            our secure payment processor, Stripe.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Is there a refund policy?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Yes, we offer a 30-day money-back guarantee. If you're not satisfied with Pro,
            contact us within 30 days for a full refund.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Do you offer discounts for students or researchers?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Yes! Please contact us at {{ supportEmail }} with proof of your academic
            affiliation for special pricing.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              What happens to my saved charts if I cancel Pro?
            </h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Your saved charts remain accessible. However, Pro-exclusive features (like
            watermark-free exports) will no longer be available.
          </p>
        </UCard>
      </div>
    </div>

    <!-- CTA Section -->
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
// Auth composable for user tier detection
const { tier, isAuthenticated } = useAuth()
const { trackSubscriptionView } = useAnalytics()
const config = useRuntimeConfig()
const supportEmail = config.public.supportEmail
const freeTrialDays = config.public.freeTrialDays

// Track features page view as subscription view
onMounted(() => {
  trackSubscriptionView()
})

// Page meta
definePageMeta({
  title: 'Features'
})

// SEO metadata
useSeoMeta({
  title: 'Features & Pricing',
  description: 'Explore Mortality Watch features across all tiers. Free registration includes chart saving, custom colors, and data exports. Upgrade to Pro for advanced analytics at $9.99/month.',
  ogTitle: 'Mortality Watch Features & Pricing',
  ogDescription: 'Free registration with powerful features. Upgrade to Pro for advanced mortality analysis tools.',
  ogImage: '/og-image.png',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
