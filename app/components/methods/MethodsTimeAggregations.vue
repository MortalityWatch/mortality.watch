<template>
  <UCard
    id="time-aggregations"
    class="scroll-mt-24"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Time Aggregations
      </h2>
    </template>

    <div class="space-y-6">
      <p class="text-gray-700 dark:text-gray-300 text-left">
        Mortality data can be aggregated across different time periods. The
        choice of aggregation affects the granularity of analysis and can
        reveal different patterns.
      </p>

      <!-- Standard Aggregations -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Standard Calendar Periods
        </h3>
        <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Weekly:</strong> ISO week numbers (W01-W53), highest
            temporal resolution
          </li>
          <li>
            <strong>Monthly:</strong> Calendar months (Jan-Dec), balances
            detail and noise reduction
          </li>
          <li>
            <strong>Quarterly:</strong> Calendar quarters (Q1-Q4), shows
            seasonal patterns
          </li>
          <li>
            <strong>Yearly:</strong> Calendar years (Jan-Dec), removes
            seasonality
          </li>
        </ul>
      </div>

      <!-- Alternative Year Definitions -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Alternative Year Definitions
        </h3>
        <div class="space-y-3">
          <div>
            <p class="font-medium text-gray-800 dark:text-gray-200">
              Flu Season (Oct-Sep)
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              A year running from October to September, aligning with
              influenza season patterns in the Northern Hemisphere. This is
              useful for analyzing mortality impacts that follow seasonal
              respiratory illness patterns, as it captures each flu season as
              a single unit rather than splitting it across calendar years.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 italic">
              Display format: "2020/21" represents Oct 2020 - Sep 2021
            </p>
          </div>
          <div>
            <p class="font-medium text-gray-800 dark:text-gray-200">
              Midyear (Jul-Jun)
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              A year running from July to June, sometimes used in Southern
              Hemisphere countries or for fiscal year analysis. This can align
              better with seasonal patterns in regions where winter mortality
              peaks occur mid-calendar-year.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 italic">
              Display format: "2020/21" represents Jul 2020 - Jun 2021
            </p>
          </div>
        </div>
      </div>

      <!-- Moving Averages -->
      <div class="text-left space-y-2">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Simple Moving Averages (SMA)
        </h3>
        <p class="text-gray-700 dark:text-gray-300">
          Weekly data smoothed using simple moving averages to reduce noise
          and reveal underlying trends. Each data point represents the average
          of the specified number of surrounding weeks.
        </p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>
            <strong>13-Week SMA:</strong> ~3 months smoothing, shows
            short-term trends
          </li>
          <li>
            <strong>26-Week SMA:</strong> ~6 months smoothing, removes most
            seasonal variation
          </li>
          <li>
            <strong>52-Week SMA:</strong> 1 year smoothing, shows annual
            trends only
          </li>
          <li>
            <strong>104-Week SMA:</strong> 2 year smoothing, reveals only
            long-term trends
          </li>
        </ul>
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
          SMA(n) = Average of n consecutive weekly values
        </div>
      </div>
    </div>
  </UCard>
</template>
