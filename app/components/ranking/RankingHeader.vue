<script setup lang="ts">
/**
 * RankingHeader Component
 *
 * Displays the page title and description for the ranking page.
 * Extracted from ranking.vue as part of Phase 5b refactoring.
 */
</script>

<template>
  <div class="flex flex-col gap-6 text-center mx-auto">
    <h1 class="text-4xl font-bold mb-6">
      Excess Mortality Ranking
    </h1>

    <div class="space-y-4">
      <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
        Compare excess mortality across all available countries and regions.
        Countries are ranked by total excess mortality for the selected period.
      </p>
      <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
        Click on a country name to jump directly to the
        <NuxtLink
          to="/explorer"
          class="text-primary hover:underline"
        >Explorer</NuxtLink>
        for detailed time-series analysis and visualization.
      </p>
    </div>
  </div>
</template>
