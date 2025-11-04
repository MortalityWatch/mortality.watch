<template>
  <UCard
    id="data-processing"
    class="scroll-mt-24"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Data Processing & Quality
      </h2>
    </template>

    <div class="space-y-6">
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Data Sources & Updates
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          All data is sourced from official statistical agencies and
          international organizations (see the
          <ULink
            to="/sources"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Sources
          </ULink>
          page for details). Data is updated daily and processed through a
          validation pipeline to ensure consistency and accuracy.
        </p>
      </div>

      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Data Limitations
        </h3>
        <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Reporting Delays:</strong> Recent data may be incomplete
            or subject to revision as official sources update their records
          </li>
          <li>
            <strong>Suppression:</strong> Some jurisdictions suppress data
            when death counts are low to protect privacy (common in US CDC
            data)
          </li>
          <li>
            <strong>Age Group Availability:</strong> Not all countries report
            mortality by age group, limiting ASMR calculations
          </li>
          <li>
            <strong>Definition Changes:</strong> Occasional changes in
            geographic boundaries or reporting methodologies can create
            discontinuities
          </li>
          <li>
            <strong>Population Estimates:</strong> Population denominators are
            estimates and may not perfectly align with the census cycle
          </li>
        </ul>
      </div>

      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Missing Data Handling
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          When data is missing or suppressed, we do not impute or estimate
          values. Gaps in the visualizations indicate missing data. For excess
          mortality calculations, baseline models are fitted only to available
          historical data.
        </p>
      </div>
    </div>
  </UCard>
</template>
