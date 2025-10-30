<template>
  <UContainer>
    <!-- Header -->
    <div class="text-center mb-12 mt-8">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Features & Plans
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Powerful mortality data analysis for everyone. Start free, upgrade anytime.
      </p>
    </div>

    <!-- Pricing Plans -->
    <UPricingPlans class="mb-12">
      <!-- Public Tier -->
      <UPricingPlan
        title="Public"
        description="Explore without registration"
        :badge="tier === 0 ? 'Current Plan' : undefined"
        price="Free"
        :features="[
          'View mortality charts',
          'Basic controls and filters',
          'Share URLs',
          'View ranking page',
          'Conservative baseline only'
        ]"
        :button="{
          label: 'Start Exploring',
          to: '/explorer',
          color: 'neutral'
        }"
        class="border-2 border-gray-900 dark:border-gray-100"
      />

      <!-- Registered Tier -->
      <UPricingPlan
        title="Registered"
        description="Full-featured, forever free"
        price="Free"
        :features="[
          { title: 'All Public features, plus:' },
          { title: 'Save charts to My Charts', icon: 'i-lucide-save' },
          { title: 'Custom color schemes', icon: 'i-lucide-palette' },
          { title: 'All baseline methods', icon: 'i-lucide-chart-line' },
          { title: 'Export data (CSV/JSON)', icon: 'i-lucide-download' },
          { title: 'Full historical data access', icon: 'i-lucide-calendar' },
          { title: 'Publish and share charts', icon: 'i-lucide-share-2' }
        ]"
        :button="tier >= 1
          ? { label: 'Current Plan', disabled: true, color: 'neutral' }
          : { label: 'Sign Up Free', to: '/signup', color: 'primary' }"
        class="border-2 border-blue-500 dark:border-blue-400"
      />

      <!-- Pro Tier -->
      <UPricingPlan
        title="Pro"
        description="Professional features"
        price="$9.99"
        billing-cycle="/month"
        tagline="or $99/year"
        :features="[
          { title: 'All Registered features, plus:' },
          { title: 'Remove watermarks', icon: 'i-lucide-image-off' },
          { title: 'Remove QR codes', icon: 'i-lucide-scan-line' },
          { title: 'Single age group LE (Coming Soon)', icon: 'i-lucide-activity' },
          { title: 'Age standardized deaths (Coming Soon)', icon: 'i-lucide-trending-up' },
          { title: 'Z-score calculations (Coming Soon)', icon: 'i-lucide-calculator' },
          { title: 'Priority email support', icon: 'i-lucide-headphones' }
        ]"
        :button="tier === 2
          ? { label: 'Current Plan', disabled: true, color: 'neutral' }
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
            Yes! Please contact us at support@mortality.watch with proof of your academic
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
        to="/about"
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
const { tier } = useAuth()

// Page meta
definePageMeta({
  title: 'Features'
})

// SEO metadata
useSeoMeta({
  title: 'Features & Pricing - MortalityWatch',
  description: 'Explore MortalityWatch features across all tiers. Free registration includes chart saving, custom colors, and data exports. Upgrade to Pro for advanced analytics at $9.99/month.',
  ogTitle: 'MortalityWatch Features & Pricing',
  ogDescription: 'Free registration with powerful features. Upgrade to Pro for advanced mortality analysis tools.'
})
</script>
