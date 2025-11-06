<script setup lang="ts">
/**
 * RankingHeader Component
 *
 * Displays the page title and description for the ranking page.
 */
</script>

<template>
  <PageHeader
    title="Excess Mortality Ranking"
    max-width="lg"
  >
    <p>
      Compare excess mortality across all available countries and regions.
      Countries are ranked by total excess mortality for the selected period.
    </p>
    <p>
      Click on a country name to jump directly to the
      <NuxtLink
        to="/explorer"
        class="text-primary hover:underline"
      >
        Explorer
      </NuxtLink>
      for detailed time-series analysis and visualization.
    </p>
  </PageHeader>
</template>
