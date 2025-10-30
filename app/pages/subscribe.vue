<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <Icon
          name="i-lucide-crown"
          class="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4"
        />
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Upgrade to Pro
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Unlock advanced features and professional-grade mortality analytics
        </p>
      </div>

      <!-- Pricing Summary -->
      <UCard class="mb-8">
        <div class="text-center py-6">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            $9.99/month or $99/year
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            Save $20 with annual billing
          </p>
        </div>
      </UCard>

      <!-- Pro Features -->
      <UCard class="mb-8">
        <template #header>
          <h2 class="text-2xl font-semibold">
            Pro Features
          </h2>
        </template>

        <div class="grid gap-6 md:grid-cols-2">
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
                Clean charts without branding for publications and presentations
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
                Single Age Group Life Expectancy
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Advanced life expectancy calculations for specific age groups
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
                Levitt method for age standardization analysis
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
                Statistical significance testing for mortality data
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
                Priority Email Support
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Get help faster with priority email support
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Coming Soon Notice -->
      <UCard class="mb-8">
        <div class="text-center py-8">
          <Icon
            name="i-lucide-rocket"
            class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4"
          />
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Subscription Checkout Coming Soon
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            We're currently setting up our secure payment processing. Pro subscriptions will be available soon!
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            In the meantime, you can support our work through donations.
          </p>
        </div>
      </UCard>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <UButton
          to="/donate"
          color="primary"
          size="xl"
        >
          <Icon
            name="i-lucide-heart"
            class="w-5 h-5"
          />
          Support via Donation
        </UButton>
        <UButton
          to="/pricing"
          color="neutral"
          variant="outline"
          size="xl"
        >
          <Icon
            name="i-lucide-arrow-left"
            class="w-5 h-5"
          />
          Back to Pricing
        </UButton>
      </div>

      <!-- FAQ -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-center mb-6">
          Questions About Pro?
        </h2>
        <div class="space-y-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                When will Pro subscriptions be available?
              </h3>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              We're working on integrating secure payment processing with Stripe. Pro subscriptions
              will be available in the coming weeks. Sign up for a free account to be notified when
              Pro launches.
            </p>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Will there be a free trial?
              </h3>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Yes! We plan to offer a 14-day free trial of Pro features when subscriptions launch,
              so you can try before you commit.
            </p>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">
                How can I support the project now?
              </h3>
            </template>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              You can support Mortality Watch through one-time or recurring donations on our
              <NuxtLink
                to="/donate"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >
                donate page
              </NuxtLink>.
              Every contribution helps us maintain the platform and develop new features.
            </p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Subscribe to Pro'
})

// SEO metadata
useSeoMeta({
  title: 'Subscribe to Pro - Mortality Watch',
  description: 'Upgrade to Mortality Watch Pro for advanced analytics, watermark-free charts, age standardized deaths, z-score calculations, and priority support at $9.99/month.',
  ogTitle: 'Mortality Watch Pro Subscription',
  ogDescription: 'Professional-grade mortality analytics and advanced features',
  ogImage: '/og-image.png',
  twitterTitle: 'Subscribe to Mortality Watch Pro',
  twitterDescription: 'Advanced analytics and professional features for mortality data',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
