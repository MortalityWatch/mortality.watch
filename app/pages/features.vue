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
    <UPricingGrid class="mb-12">
      <!-- Public Tier -->
      <UPricingCard
        title="Public"
        description="Explore without registration"
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
          color: 'neutral',
          variant: 'outline'
        }"
        :class="tier === 0 ? 'ring-2 ring-primary' : ''"
      />

      <!-- Registered Tier -->
      <UPricingCard
        title="Registered"
        description="Full-featured, forever free"
        price="Free"
        :features="[
          { label: 'All Public features, plus:', class: 'font-semibold' },
          { label: 'Save charts to My Charts', icon: 'i-lucide-save' },
          { label: 'Custom color schemes', icon: 'i-lucide-palette' },
          { label: 'All baseline methods', icon: 'i-lucide-chart-line' },
          { label: 'Export data (CSV/JSON)', icon: 'i-lucide-download' },
          { label: 'Full date range access', icon: 'i-lucide-calendar' },
          { label: 'Publish and share charts', icon: 'i-lucide-share-2' }
        ]"
        :button="{
          label: 'Sign Up Free',
          to: '/signup',
          color: 'primary'
        }"
        :class="tier === 1 ? 'ring-2 ring-primary' : ''"
        highlight
      />

      <!-- Pro Tier -->
      <UPricingCard
        title="Pro"
        description="Professional features"
        price="$9.99"
        billing-cycle="/month"
        cycle="or $99/year"
        :features="[
          { label: 'All Registered features, plus:', class: 'font-semibold' },
          { label: 'Remove watermarks', icon: 'i-lucide-image-off' },
          { label: 'Remove QR codes', icon: 'i-lucide-scan-line' },
          { label: 'Single age group LE', icon: 'i-lucide-activity' },
          { label: 'Age standardized deaths', icon: 'i-lucide-trending-up' },
          { label: 'Z-score calculations', icon: 'i-lucide-calculator' },
          { label: 'Priority email support', icon: 'i-lucide-headphones' }
        ]"
        :button="{
          label: 'Upgrade to Pro',
          to: '/subscribe',
          color: 'primary'
        }"
        :class="tier === 2 ? 'ring-2 ring-primary' : ''"
      />
    </UPricingGrid>

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
