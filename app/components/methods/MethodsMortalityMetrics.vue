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

      <!-- Life Expectancy -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Life Expectancy
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          Life Expectancy (LE) is defined as the average remaining years of life
          expected by a hypothetical cohort of individuals who would be subject
          to the mortality rates of the year of interest over the course of their
          remaining life. We provide both period LE at birth (all ages) as well
          as remaining LE at specific ages.
        </p>
        <p class="text-gray-700 dark:text-gray-300">
          LE is calculated using Chiang's abridged life table methodology.
        </p>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm space-y-1">
          <div class="font-semibold">
            Method: Chiang's abridged life table
          </div>
          <div class="mt-2">
            n<sub>a</sub>x (avg. years lived by decedents):
          </div>
          <div>• Age 0: Coale-Demeny coefficients (mortality-dependent)</div>
          <div>• Ages 1-4: 1.5 years</div>
          <div>• Ages 5+: n/2 (midpoint assumption)</div>
          <div>• Open-ended (85+): 1/M<sub>x</sub> (Keyfitz)</div>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mt-3 space-y-3">
          <h4 class="font-semibold text-gray-800 dark:text-gray-200">
            Sub-yearly Life Expectancy: Raw vs Seasonally Adjusted
          </h4>
          <p class="text-gray-700 dark:text-gray-300">
            For weekly, monthly, and quarterly data, Pro users can toggle between two display modes:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Raw Values:</strong> The directly calculated LE values. These show
              apparent "seasonal" variation (e.g., lower values in winter), but this is
              a <em>calculation artifact</em> from short-term mortality fluctuations—not
              real LE changes. A person's expected lifespan doesn't actually vary week
              to week.
            </li>
            <li>
              <strong>Seasonally Adjusted (STL):</strong> We apply STL decomposition
              (Seasonal and Trend decomposition using Loess) and remove only the
              <em>seasonal</em> component, keeping both trend and remainder. This
              eliminates the artificial seasonal pattern while preserving the true
              underlying life expectancy signal and any real short-term variations.
            </li>
          </ul>
          <p class="text-sm text-gray-600 dark:text-gray-400 italic">
            The adjusted values are displayed by default and are recommended for most
            analyses. Raw values are useful for understanding the calculation artifacts
            or for research purposes.
          </p>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 italic mt-3">
          Pro users can view remaining life expectancy at specific ages
          (e.g., LE at age 40 shows expected remaining years for someone aged 40)
        </p>
      </div>
    </div>
  </UCard>
</template>
