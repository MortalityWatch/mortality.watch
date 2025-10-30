<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Simple, Transparent Pricing
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Choose the plan that's right for you. Start free, upgrade anytime.
      </p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
      <!-- Free Tier -->
      <UCard
        :class="[
          'relative',
          tier === 0 ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''
        ]"
      >
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-bold mb-2">
              Public
            </h2>
            <div class="text-4xl font-bold text-primary mb-2">
              Free
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              For casual users
            </p>
          </div>
        </template>

        <ul class="space-y-3 mb-6">
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">View mortality charts</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Basic controls and filters</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Share URLs</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">View ranking page</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Conservative baseline only</span>
          </li>
        </ul>

        <template #footer>
          <UButton
            to="/explorer"
            color="neutral"
            variant="outline"
            block
            size="lg"
          >
            Start Exploring
          </UButton>
        </template>
      </UCard>

      <!-- Registered Tier (Free) -->
      <UCard
        :class="[
          'relative',
          tier === 1 ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''
        ]"
      >
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-bold mb-2">
              Registered
            </h2>
            <div class="text-4xl font-bold text-primary mb-2">
              Free
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              For power users
            </p>
          </div>
        </template>

        <ul class="space-y-3 mb-6">
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm font-semibold">All Public features, plus:</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-save"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Save charts to "My Charts"</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-palette"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Custom color schemes</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-chart-line"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">All baseline methods</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-download"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Export data (CSV/JSON)</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-calendar"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Extended time periods</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-share-2"
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Publish and share charts</span>
          </li>
        </ul>

        <template #footer>
          <UButton
            to="/signup"
            color="primary"
            block
            size="lg"
          >
            Sign Up Free
          </UButton>
        </template>
      </UCard>

      <!-- Pro Tier -->
      <UCard
        :class="[
          'relative',
          tier === 2 ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''
        ]"
      >
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-bold mb-2">
              Pro
            </h2>
            <div class="text-4xl font-bold text-primary mb-2">
              $9.99
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              per month
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
              or $99/year (save $20)
            </p>
          </div>
        </template>

        <ul class="space-y-3 mb-6">
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-check"
              class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
            />
            <span class="text-sm font-semibold">All Registered features, plus:</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-image-off"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Remove watermarks</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-scan-line"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Remove QR codes</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-activity"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Single age group LE</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-trending-up"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Age standardized deaths</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-calculator"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Z-score calculations</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon
              name="i-lucide-headphones"
              class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            />
            <span class="text-sm">Priority email support</span>
          </li>
        </ul>

        <template #footer>
          <UButton
            to="/subscribe"
            color="primary"
            variant="outline"
            block
            size="lg"
          >
            Upgrade to Pro
          </UButton>
        </template>
      </UCard>
    </div>

    <!-- FAQ Section -->
    <div class="max-w-3xl mx-auto">
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
    <div class="text-center mt-12">
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
  </div>
</template>

<script setup lang="ts">
// Auth composable for user tier detection
const { tier } = useAuth()

// Page meta
definePageMeta({
  title: 'Pricing'
})

// SEO metadata
useSeoMeta({
  title: 'Pricing - MortalityWatch',
  description: 'Simple, transparent pricing for mortality data visualization. Start free, upgrade to Pro for advanced features at $9.99/month.',
  ogTitle: 'MortalityWatch Pricing',
  ogDescription: 'Free registration with Pro upgrade available'
})
</script>
