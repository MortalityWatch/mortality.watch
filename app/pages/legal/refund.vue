<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4 text-center">
        Donation Refund Policy
      </h1>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
        Last Updated: December 12, 2025
      </p>

      <LegalRefund />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Donation Refund Policy'
})

useSeoMeta({
  title: 'Donation Refund Policy',
  description: 'Donation refund policy for Mortality Watch.',
  ogTitle: 'Donation Refund Policy - Mortality Watch',
  ogDescription: 'How to contact Mortality Watch about donation payment issues.',
  ogImage: '/og-image.png',
  twitterTitle: 'Donation Refund Policy - Mortality Watch',
  twitterDescription: 'Donation refund policy for Mortality Watch.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
