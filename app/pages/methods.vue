<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Methods'
})

// SEO metadata
useSeoMeta({
  title: 'Methodology - Mortality Watch',
  description: 'Detailed technical documentation of statistical methods, calculations, and data processing used for mortality analysis including CMR, ASMR, excess mortality, and baseline models.',
  ogTitle: 'Methodology - Mortality Watch',
  ogDescription: 'Technical documentation of mortality metrics, age-standardization, excess mortality calculations, and baseline forecasting methods.',
  ogImage: '/og-image.png',
  twitterTitle: 'Methodology - Mortality Watch',
  twitterDescription: 'Comprehensive methodology documentation for mortality data analysis.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">
        Methodology
      </h1>

      <div class="space-y-4">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          This page provides detailed technical documentation of the statistical
          methods, calculations, and data processing techniques used throughout
          Mortality Watch. Understanding these methodologies is essential for
          correctly interpreting the visualizations and analyses.
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Mortality Watch is fully
          <ULink
            to="https://github.com/MortalityWatch/"
            target="_blank"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            open source on GitHub
          </ULink>. All statistical methods, baseline calculations, and data
          processing pipelines are implemented in R and available for review,
          replication, and contribution.
        </p>
      </div>

      <!-- Quick Navigation -->
      <MethodsNav />

      <!-- Methodology Sections -->
      <MethodsMortalityMetrics />
      <MethodsTimeAggregations />
      <MethodsExcessMortality />
      <MethodsStandardPopulations />
      <MethodsDataProcessing />
      <MethodsReferences />

      <!-- Questions -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Questions?
          </h2>
        </template>

        <p class="text-gray-700 dark:text-gray-300">
          If you have questions about our methodology or need clarification on
          any calculations, please contact us via
          <ULink
            to="mailto:mortalitywatch@proton.me"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            email
          </ULink>
          or on
          <ULink
            to="https://twitter.com/mortalitywatch"
            target="_blank"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            @MortalityWatch
          </ULink>.
        </p>
      </UCard>
    </div>

    <!-- Scroll to top button -->
    <ScrollToTop />
  </div>
</template>
