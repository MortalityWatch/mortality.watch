<template>
  <UCard
    id="standard-populations"
    class="scroll-mt-24"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Standard Populations for Age-Standardization
      </h2>
    </template>

    <div class="space-y-6">
      <p class="text-gray-700 dark:text-gray-300 text-left">
        Age-standardization requires a reference age distribution (standard
        population). Different standard populations are used in different
        contexts:
      </p>

      <div class="text-left space-y-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            WHO2015 (World Health Organization 2015)
          </h3>
          <p class="text-gray-700 dark:text-gray-300">
            The WHO's standard population based on global age distribution.
            This is the default choice for international comparisons as it
            represents a global average age structure. Recommended for
            comparing countries worldwide.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            ESP2013 (European Standard Population 2013)
          </h3>
          <p class="text-gray-700 dark:text-gray-300">
            Eurostat's European standard population, reflecting the age
            structure of the European Union. Use this for comparing European
            countries or when working with Eurostat data.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            US2000 (United States 2000 Census)
          </h3>
          <p class="text-gray-700 dark:text-gray-300">
            The standard population used by the CDC and US health agencies,
            based on the 2000 US Census. Essential for comparisons with
            official US statistics or when analyzing US states.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            2020 (Country-Specific)
          </h3>
          <p class="text-gray-700 dark:text-gray-300">
            Uses each country's own 2020 population age distribution as the
            standard. This shows internal trends over time without external
            age-structure assumptions, but makes international comparisons
            less meaningful.
          </p>
        </div>
      </div>

      <p class="text-gray-700 dark:text-gray-300 text-left">
        <strong>Which to choose?</strong> For international comparisons, use
        WHO2015 or ESP2013 (for Europe). For US-specific analysis, use
        US2000. For country-level time trends, use 2020. The choice affects
        the absolute values but usually not the trends or patterns.
      </p>
    </div>
  </UCard>
</template>
