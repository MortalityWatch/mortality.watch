<template>
  <UCard
    id="life-expectancy"
    class="scroll-mt-24"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Life Expectancy
      </h2>
    </template>

    <div class="space-y-4 text-left">
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
  </UCard>
</template>
