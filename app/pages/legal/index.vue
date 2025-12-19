<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrowserNavigation } from '@/composables/useBrowserNavigation'

const route = useRoute()
const router = useRouter()

// Tab definitions
const tabs = [
  { label: 'Terms of Service', value: 'terms' as const, slot: 'terms' as const, icon: 'i-lucide-file-text' },
  { label: 'Privacy Policy', value: 'privacy' as const, slot: 'privacy' as const, icon: 'i-lucide-shield' },
  { label: 'Refund Policy', value: 'refund' as const, slot: 'refund' as const, icon: 'i-lucide-receipt' }
]

// URL state - default to 'terms' if no tab specified
const activeTab = ref<string>((route.query.tab as string) || 'terms')

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  if (newTab === 'terms') {
    // Default tab, remove from URL
    const { tab, ...rest } = route.query
    router.replace({ query: Object.keys(rest).length ? rest : undefined })
  } else {
    router.replace({ query: { ...route.query, tab: newTab } })
  }
})

// Handle browser back/forward navigation
useBrowserNavigation({
  queryParams: ['tab'],
  onNavigate: () => {
    activeTab.value = (route.query.tab as string) || 'terms'
  },
  isReady: computed(() => true),
  isUpdating: ref(false)
})

// Page metadata
definePageMeta({
  title: 'Legal'
})

// Dynamic SEO metadata based on active tab
const seoTitle = computed(() => {
  const tabTitles: Record<string, string> = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy'
  }
  return tabTitles[activeTab.value] || 'Legal'
})

const seoDescription = computed(() => {
  const tabDescriptions: Record<string, string> = {
    terms: 'Terms of Service for Mortality Watch, a data visualization platform for analyzing global mortality statistics.',
    privacy: 'Privacy Policy for Mortality Watch. Learn how we collect, use, and protect your personal information in compliance with GDPR and CCPA.',
    refund: 'Refund Policy for Mortality Watch Pro subscriptions. Learn about our 30-day refund window and how to request a refund.'
  }
  return tabDescriptions[activeTab.value] || 'Legal information for Mortality Watch including Terms of Service, Privacy Policy, and Refund Policy.'
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: '/og-image.png',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4 text-center">
        Legal
      </h1>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
        Last Updated: December 12, 2025
      </p>

      <UCard>
        <UTabs
          v-model="activeTab"
          :items="tabs"
        >
          <template #terms>
            <div class="p-4">
              <LegalTerms />
            </div>
          </template>

          <template #privacy>
            <div class="p-4">
              <LegalPrivacy />
            </div>
          </template>

          <template #refund>
            <div class="p-4">
              <LegalRefund />
            </div>
          </template>
        </UTabs>
      </UCard>

      <!-- Scroll to top button -->
      <ScrollToTop />
    </div>
  </div>
</template>
