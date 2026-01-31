<script setup lang="ts">
const colorMode = useColorMode()
const { isIncognito } = useIncognitoMode()
const route = useRoute()
const config = useRuntimeConfig()

const siteUrl = config.public.siteUrl || 'https://www.mortality.watch'
const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

// Canonical URL - strips query params for clean canonical
const canonicalUrl = computed(() => {
  const path = route.path === '/' ? '' : route.path
  return `${siteUrl}${path}`
})

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.svg' },
    { rel: 'canonical', href: canonicalUrl }
  ],
  htmlAttrs: {
    lang: 'en'
  },
  bodyAttrs: {
    class: isIncognito ? 'incognito-mode' : ''
  },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${siteUrl}/#organization`,
            'name': 'Mortality Watch',
            'url': siteUrl,
            'logo': {
              '@type': 'ImageObject',
              'url': `${siteUrl}/favicon.svg`
            },
            'sameAs': [
              'https://twitter.com/mortalitywatch',
              'https://github.com/MortalityWatch'
            ]
          },
          {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            'url': siteUrl,
            'name': 'Mortality Watch',
            'description': 'Comprehensive global mortality database with 300+ regions. Track excess deaths, life expectancy, and mortality trends with daily updates from official sources.',
            'publisher': {
              '@id': `${siteUrl}/#organization`
            }
          }
        ]
      })
    }
  ]
})

useSeoMeta({
  titleTemplate: '%s - Mortality Watch',
  ogImage: `${siteUrl}/og-image.png`,
  twitterImage: `${siteUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  ogType: 'website',
  ogSiteName: 'Mortality Watch',
  ogUrl: canonicalUrl
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Toast notifications are handled by useToast() composable in Nuxt UI v4 -->
  </UApp>
</template>
