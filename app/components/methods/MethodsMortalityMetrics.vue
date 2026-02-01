<template>
  <UCard
    id="mortality-metrics"
    class="scroll-mt-24"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Mortality Metrics
      </h2>
    </template>

    <div class="space-y-6">
      <!-- Deaths -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Deaths (Raw Counts)
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          The absolute number of deaths reported for a given time period and
          population. This is the most direct measure but doesn't account for
          population size or age structure, making comparisons between
          regions difficult.
        </p>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
          Deaths = Total number of deaths in period
        </div>
      </div>

      <!-- CMR -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          CMR (Crude Mortality Rate)
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          Deaths per 100,000 population. This standardizes mortality by
          population size, allowing comparison between differently-sized
          populations. However, it doesn't account for differences in age
          structure.
        </p>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
          CMR = (Deaths / Population) × 100,000
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 italic">
          Example: 1,000 deaths in a population of 500,000 = 200 deaths per
          100,000 population
        </p>
      </div>

      <!-- ASMR -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          ASMR (Age-Standardized Mortality Rate)
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          A mortality rate adjusted for differences in age structure between
          populations. This is crucial because mortality rates increase
          dramatically with age. Without age-standardization, comparisons
          between countries with different age structures (e.g., Japan vs.
          Nigeria) would be meaningless.
        </p>
        <p class="text-gray-700 dark:text-gray-300">
          ASMR applies a weighted average of age-specific mortality rates,
          where the weights are taken from a "standard population" (see
          Standard Populations section below).
        </p>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
          ASMR = Σ(Age-specific rate × Standard population weight)
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 italic">
          We support WHO2015, ESP2013, US2000, and country-specific 2020
          standard populations
        </p>
      </div>

      <!-- ASD -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          ASD (Age-Standardized Deaths)
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          Age-Standardized Deaths (ASD) is an alternative approach to account
          for population aging when calculating excess mortality. Unlike ASMR
          which standardizes rates, ASD works directly with death counts by
          applying baseline mortality rates to current population age structures.
        </p>
        <p class="text-gray-700 dark:text-gray-300">
          The ASD method (based on
          <ULink
            to="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0253175"
            target="_blank"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >Levitt et al.</ULink>)
          calculates expected deaths by:
        </p>
        <ol class="list-decimal pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>Calculate baseline mortality rates per age group during the reference period</li>
          <li>Apply these baseline rates to the current population age structure</li>
          <li>Sum across all age groups to get total expected deaths</li>
        </ol>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm space-y-1">
          <div>For each age group a:</div>
          <div class="ml-4">
            baseline_rate<sub>a</sub> = mean(deaths<sub>a</sub> / population<sub>a</sub>) during baseline period
          </div>
          <div class="mt-2">
            Expected Deaths = Σ(baseline_rate<sub>a</sub> × current_population<sub>a</sub>)
          </div>
          <div class="mt-2">
            Excess ASD = Observed Deaths - Expected Deaths
          </div>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mt-3">
          <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            When to use ASD vs ASMR
          </h4>
          <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>ASMR</strong> answers: "If this population had the same age structure
              as the standard, what would the mortality rate be?"
            </li>
            <li>
              <strong>ASD</strong> answers: "Given how this population has aged, how many
              deaths would we expect if mortality rates stayed at baseline levels?"
            </li>
          </ul>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
            ASD is particularly useful for understanding excess deaths in aging populations,
            as it separates the effect of population aging from changes in mortality rates.
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
