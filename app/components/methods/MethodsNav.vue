<template>
  <UCard id="toc">
    <template #header>
      <h2 class="text-xl font-semibold">
        Quick Navigation
      </h2>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div>
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Core Concepts
        </h3>
        <div class="space-y-2">
          <a
            href="#mortality-metrics"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Mortality Metrics
          </a>
          <a
            href="#life-expectancy"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Life Expectancy
          </a>
          <a
            href="#time-aggregations"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Time Aggregations
          </a>
          <a
            href="#excess-mortality"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Excess Mortality Calculations
          </a>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Technical Details
        </h3>
        <div class="space-y-2">
          <a
            href="#standard-populations"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Standard Populations
          </a>
          <a
            href="#data-processing"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Data Processing & Quality
          </a>
          <a
            href="#technical-references"
            class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            → Technical References
          </a>
        </div>
      </div>
    </div>
  </UCard>
</template>
