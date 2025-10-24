<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">
        Support Our Mission
      </h1>

      <div class="space-y-4">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Mortality Watch is a free, open-source platform providing crucial public health data
          to researchers, journalists, policymakers, and citizens worldwide. We believe
          transparent mortality data should be accessible to everyone.
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Your support helps us maintain daily data updates, develop new features, cover
          server costs, and keep this vital resource free for all. Every contribution,
          no matter the size, makes a difference.
        </p>
      </div>

      <UCard class="mx-auto mb-6 max-w-2xl">
        <template #header>
          <h2 class="text-xl font-semibold">
            How Your Donation Helps
          </h2>
        </template>
        <div class="mb-4 flex justify-center">
          <ul class="inline-block list-disc pl-6 text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Data Infrastructure:</strong> Maintain servers and data processing pipelines</li>
            <li><strong>Daily Updates:</strong> Ensure continuous data collection from global sources</li>
            <li><strong>New Features:</strong> Develop advanced analysis tools and visualizations</li>
            <li><strong>Open Access:</strong> Keep all data and tools free for public use</li>
            <li><strong>Research Support:</strong> Provide data for academic and public health research</li>
            <li><strong>Transparency:</strong> Maintain open-source code and methodology</li>
          </ul>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-center">
          As an independent, donation-funded project, we remain free from conflicts of interest
          and committed to providing unbiased mortality data analysis.
        </p>
      </UCard>

      <div class="flex flex-wrap items-start justify-center gap-4">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Scan to Gift
            </h3>
          </template>
          <div class="flex justify-center">
            <img
              width="176"
              height="211"
              src="/stripe_donate.png"
              alt="Stripe donation QR code"
            >
          </div>
        </UCard>

        <UCard class="h-[420px] w-[328px] overflow-hidden">
          <stripe-buy-button
            buy-button-id="buy_btn_1NygzuJMSX51I7jFrhjbBxmG"
            publishable-key="pk_live_51LhzHJJMSX51I7jFt5Kxulksr11u69VQ1k3u76NCjbniUNfzDbMrdbtWNMr1sFgWx4PU6GHvP8N4jiFUEBTCZnRA00MJ1XjoxT"
          />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Bitcoin
            </h3>
          </template>
          <p class="text-gray-600 dark:text-gray-400 mb-3">
            Send gifts to following BTC address:
          </p>
          <p class="font-mono text-sm">
            3DqLGmNvF8uME8wQmFcbwi9CfZPj2uGLVW
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Follow Our Work
            </h3>
          </template>
          <div class="flex items-center justify-center gap-2">
            <!-- Substack -->
            <UButton
              variant="ghost"
              size="lg"
              square
              to="https://www.usmortality.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Substack"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 18 18"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16 4H0V6H16V4Z" />
                <path d="M0 8V18L7.9993 13.534L16 18V8H0Z" />
                <path d="M16 0H0V2H16V0Z" />
              </svg>
            </UButton>

            <!-- X -->
            <UButton
              icon="i-simple-icons-x"
              variant="ghost"
              size="lg"
              square
              to="https://www.x.com/mortalitywatch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Quick Donation Options
            </h3>
          </template>
          <div class="flex items-center justify-center gap-2">
            <!-- PayPal -->
            <UButton
              icon="i-simple-icons-paypal"
              variant="ghost"
              size="lg"
              square
              to="https://www.paypal.me/usmortality"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PayPal"
            />

            <!-- Strike -->
            <UButton
              variant="ghost"
              size="lg"
              square
              to="https://strike.me/usmortality"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Strike"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.31317 8.49362C2.82011 8.30435 2.57384 7.75121 2.76311 7.25815C2.95238 6.76509 3.50552 6.51881 3.99858 6.70808L7.55779 8.07434C7.56174 8.07591 7.5657 8.07746 7.56967 8.07899L9.35521 8.76439C9.84827 8.95366 10.4014 8.70738 10.5907 8.21432C10.7799 7.72126 10.5337 7.16812 10.0406 6.97885L10.0404 6.97877C10.0405 6.97874 10.0405 6.9787 10.0406 6.97866L8.25506 6.29326C7.762 6.104 7.51572 5.55086 7.70499 5.0578C7.89426 4.56473 8.4474 4.31846 8.94046 4.50773L14.1921 6.52363C14.2046 6.52845 14.217 6.53352 14.2293 6.53881C14.2519 6.54711 14.2745 6.55559 14.2971 6.56425C16.7624 7.5106 17.9938 10.2763 17.0474 12.7416C16.1011 15.2069 13.3354 16.4383 10.8701 15.4919C10.8226 15.4737 10.7756 15.4548 10.729 15.4353C10.7065 15.4285 10.684 15.4208 10.6616 15.4122L5.51344 13.436C5.02038 13.2467 4.77411 12.6936 4.96338 12.2005C5.15265 11.7075 5.70579 11.4612 6.19885 11.6504L7.9844 12.3355C8.47746 12.5248 9.0306 12.2785 9.21987 11.7854C9.40914 11.2924 9.16287 10.7392 8.66981 10.55L7.86635 10.2414L3.31317 8.49362Z"
                  fill="currentColor"
                />
              </svg>
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Load Stripe Buy Button script
onMounted(() => {
  ['https://js.stripe.com/v3/buy-button.js'].forEach((script) => {
    const tag = document.createElement('script')
    tag.setAttribute('src', script)
    document.head.appendChild(tag)
  })
})

// Page metadata
definePageMeta({
  title: 'Donate'
})

// SEO metadata
useSeoMeta({
  title: 'Donate - Mortality Watch',
  description: 'Support Mortality Watch to help maintain daily data updates, develop new features, and keep this vital public health resource free for all.',
  ogTitle: 'Support Mortality Watch',
  ogDescription: 'Help us maintain transparent mortality data for researchers, journalists, and citizens worldwide.',
  ogImage: '/og-image.png',
  twitterTitle: 'Support Mortality Watch',
  twitterDescription: 'Help maintain transparent mortality data for public health research.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
