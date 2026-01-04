<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Support Mortality Watch"
        description="Mortality Watch is sustained by Pro subscriptions. If you'd like to support our work beyond upgrading to Pro, we gratefully accept donations."
        max-width="md"
      />

      <!-- Primary CTA: Upgrade to Pro -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <UButton
          to="/features"
          color="primary"
          size="xl"
        >
          <Icon
            name="i-lucide-crown"
            class="w-5 h-5"
          />
          View Features & Pricing
        </UButton>
        <UButton
          to="/subscribe"
          variant="outline"
          size="xl"
        >
          Upgrade to Pro
          <Icon
            name="i-lucide-arrow-right"
            class="w-5 h-5"
          />
        </UButton>
      </div>

      <!-- Separator -->
      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">
            OR
          </span>
        </div>
      </div>

      <!-- Donation Options -->
      <div class="text-center mb-8">
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Prefer to make a one-time contribution?
        </p>
      </div>

      <!-- Simplified donation grid -->
      <div class="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
        <!-- Stripe Donation Button -->
        <UCard class="overflow-hidden">
          <template #header>
            <h3 class="text-lg font-semibold text-center">
              One-Time Donation
            </h3>
          </template>
          <div class="flex justify-center min-h-[200px]">
            <stripe-buy-button
              buy-button-id="buy_btn_1NygzuJMSX51I7jFrhjbBxmG"
              publishable-key="pk_live_51LhzHJJMSX51I7jFt5Kxulksr11u69VQ1k3u76NCjbniUNfzDbMrdbtWNMr1sFgWx4PU6GHvP8N4jiFUEBTCZnRA00MJ1XjoxT"
            />
          </div>
        </UCard>

        <!-- Other Payment Options -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-center">
              Other Options
            </h3>
          </template>
          <div class="space-y-4">
            <!-- PayPal -->
            <UButton
              to="https://www.paypal.me/usmortality"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              block
            >
              <Icon
                name="i-simple-icons-paypal"
                class="w-5 h-5"
              />
              PayPal
            </UButton>

            <!-- Bitcoin -->
            <UButton
              variant="outline"
              block
              @click="copyBitcoinAddress"
            >
              <Icon
                name="i-simple-icons-bitcoin"
                class="w-5 h-5"
              />
              Bitcoin
            </UButton>
            <p
              v-if="showBitcoinAddress"
              class="text-xs font-mono text-gray-600 dark:text-gray-400 break-all"
            >
              {{ config.public.bitcoinAddress }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Footer note -->
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
        All funds support infrastructure costs and feature development.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const showBitcoinAddress = ref(false)
const toast = useToast()
const config = useRuntimeConfig()

// Load Stripe Buy Button script
onMounted(() => {
  ['https://js.stripe.com/v3/buy-button.js'].forEach((script) => {
    const tag = document.createElement('script')
    tag.setAttribute('src', script)
    document.head.appendChild(tag)
  })
})

// Copy Bitcoin address to clipboard
async function copyBitcoinAddress() {
  const address = config.public.bitcoinAddress
  try {
    await navigator.clipboard.writeText(address)
    showBitcoinAddress.value = true
    toast.add({
      title: 'Bitcoin address copied!',
      color: 'success'
    })
  } catch {
    // Fallback: just show the address
    showBitcoinAddress.value = true
  }
}

// Page metadata
definePageMeta({
  title: 'Donate'
})

// SEO metadata
useSeoMeta({
  title: 'Support Mortality Watch',
  description: 'Mortality Watch is sustained by Pro subscriptions. Support our work with a one-time donation or upgrade to Pro for advanced features.',
  ogTitle: 'Support Mortality Watch',
  ogDescription: 'Support mortality data infrastructure and feature development.',
  ogImage: '/og-image.png'
})
</script>
