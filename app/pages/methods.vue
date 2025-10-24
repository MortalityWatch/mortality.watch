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

      <!-- Quick Navigation / Table of Contents -->
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

      <!-- Mortality Metrics -->
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
              Estimated life expectancy at birth, calculated from age-standardized
              mortality rates using WHO methodology. This converts mortality rates
              into an intuitive measure of population health.
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              The calculation uses the relationship between ASMR and life
              expectancy based on standard life table methods. Lower mortality
              rates correspond to higher life expectancy.
            </p>
            <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
              LE ≈ f(ASMR) using WHO life table methodology
            </div>
          </div>
        </div>
      </UCard>

      <!-- Time Aggregations -->
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

      <!-- Excess Mortality -->
      <UCard
        id="excess-mortality"
        class="scroll-mt-24"
      >
        <template #header>
          <h2 class="text-xl font-semibold">
            Excess Mortality Calculations
          </h2>
        </template>

        <div class="space-y-6">
          <p class="text-gray-700 dark:text-gray-300 text-left">
            Excess mortality estimates the difference between observed deaths and
            expected deaths based on historical patterns. This is calculated by
            comparing actual mortality data to a baseline projection.
          </p>

          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            title="Important Caveat"
            description="Excess mortality estimates depend heavily on the baseline model chosen. Different baselines can produce substantially different results. These are model-based projections, not observed data."
          />

          <!-- Baseline Definition -->
          <div class="text-left space-y-2">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Baseline Models
            </h3>
            <p class="text-gray-700 dark:text-gray-300">
              The baseline represents what mortality would have been expected in
              the absence of unusual events. We calculate baselines using time
              series forecasting methods from the R
              <ULink
                to="https://fable.tidyverts.org/"
                target="_blank"
                active-class="text-primary"
                inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
              >
                fable package
              </ULink>, a professional forecasting framework that implements
              state-of-the-art statistical methods.
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              The default baseline uses a simple 3-year pre-pandemic average
              (2017–2019). While straightforward, this may not capture underlying
              trends. As noted by Levitt et al.: "Changes in mortality rates may
              differ markedly year to year and across age and gender groups.
              During major events such as pandemics, wars, or natural disasters,
              estimates may diverge from observed deaths proportionally to the
              event's impact."
            </p>
          </div>

          <!-- Baseline Methods -->
          <div class="text-left space-y-3">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Available Baseline Methods
            </h3>

            <div class="space-y-4">
              <div>
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  1. Last Value (Naive) —
                  <ULink
                    to="https://fable.tidyverts.org/reference/RW.html"
                    target="_blank"
                    active-class="text-primary"
                    inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    fable::NAIVE
                  </ULink>
                </p>
                <p class="text-gray-700 dark:text-gray-300">
                  Projects the most recent historical value forward. Assumes
                  mortality rates remain constant at their last observed level.
                  Best for stable populations with minimal trends.
                </p>
                <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  Baseline[t] = Observed[last_baseline_period]
                </div>
              </div>

              <div>
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  2. Average (Mean) —
                  <ULink
                    to="https://fable.tidyverts.org/reference/TSLM.html"
                    target="_blank"
                    active-class="text-primary"
                    inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    fable::TSLM
                  </ULink>
                </p>
                <p class="text-gray-700 dark:text-gray-300">
                  Calculates the mean of the baseline period (default 2017–2019)
                  and projects it forward. This is the default method. Smooths out
                  year-to-year fluctuations but ignores trends.
                </p>
                <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  Baseline[t] = Mean(Observed[baseline_period])
                </div>
              </div>

              <div>
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  3. Linear Regression (Trend) —
                  <ULink
                    to="https://fable.tidyverts.org/reference/TSLM.html"
                    target="_blank"
                    active-class="text-primary"
                    inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    fable::TSLM + trend()
                  </ULink>
                </p>
                <p class="text-gray-700 dark:text-gray-300">
                  Fits a linear trend to the baseline period and extrapolates it
                  forward. Accounts for long-term improvement (or decline) in
                  mortality rates. Useful when mortality has been consistently
                  improving.
                </p>
                <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  Baseline[t] = β₀ + β₁ × t (fitted from baseline period)
                </div>
              </div>

              <div>
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  4. Exponential Smoothing (ETS) —
                  <ULink
                    to="https://fable.tidyverts.org/reference/ETS.html"
                    target="_blank"
                    active-class="text-primary"
                    inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    fable::ETS + error() + trend()
                  </ULink>
                </p>
                <p class="text-gray-700 dark:text-gray-300">
                  An adaptive method that gives more weight to recent observations
                  while accounting for trends. Can capture non-linear patterns in
                  mortality improvement. Generally the most sophisticated approach.
                </p>
                <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  Adaptive smoothing with error correction and trend components
                </div>
              </div>
            </div>

            <p class="text-gray-700 dark:text-gray-300 mt-4">
              <strong>Seasonal Adjustments:</strong> For sub-annual data
              (weekly, monthly, quarterly), all baseline methods automatically
              include seasonal components to account for recurring patterns (e.g.,
              winter mortality peaks, summer troughs).
            </p>
          </div>

          <!-- Calculation -->
          <div class="text-left space-y-2">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Excess Calculation
            </h3>
            <p class="text-gray-700 dark:text-gray-300">
              Once the baseline is established, excess mortality is simply the
              difference between observed and expected values:
            </p>
            <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
              Excess Deaths = Observed Deaths - Baseline Deaths<br>
              Excess CMR = Observed CMR - Baseline CMR<br>
              Excess ASMR = Observed ASMR - Baseline ASMR<br>
              Excess LE = Observed LE - Baseline LE
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 italic">
              Positive values indicate higher-than-expected mortality; negative
              values indicate lower-than-expected mortality.
            </p>
          </div>

          <!-- Confidence Intervals -->
          <div class="text-left space-y-2">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Confidence Intervals
            </h3>
            <p class="text-gray-700 dark:text-gray-300">
              Upper and lower bounds represent statistical uncertainty in the
              baseline projection. These are calculated by the fable package based
              on the prediction error distribution of each model.
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              Confidence intervals widen further into the future, reflecting
              increasing uncertainty. When observed values fall outside the
              confidence interval, it suggests a statistically significant
              deviation from historical patterns.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Standard Populations -->
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

      <!-- Data Processing -->
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

      <!-- Technical References -->
      <UCard
        id="technical-references"
        class="scroll-mt-24"
      >
        <template #header>
          <h2 class="text-xl font-semibold">
            Technical References
          </h2>
        </template>

        <div class="space-y-4 text-left">
          <p class="text-gray-700 dark:text-gray-300">
            Our statistical methods are based on peer-reviewed research and
            established public health practices:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Forecasting methods:
              <ULink
                to="https://fable.tidyverts.org/"
                target="_blank"
                active-class="text-primary"
                inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
              >
                fable R package
              </ULink>
              by Rob Hyndman et al.
            </li>
            <li>
              WHO age-standardization:
              <ULink
                to="https://www.who.int/data/gho/indicator-metadata-registry/imr-details/78"
                target="_blank"
                active-class="text-primary"
                inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
              >
                WHO Global Health Observatory
              </ULink>
            </li>
            <li>
              European standard population:
              <ULink
                to="https://ec.europa.eu/eurostat/web/products-manuals-and-guidelines/-/ks-ra-13-028"
                target="_blank"
                active-class="text-primary"
                inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
              >
                Eurostat 2013 ESP
              </ULink>
            </li>
            <li>
              Levitt et al. on excess mortality limitations:
              <em>Understanding COVID-19 Pandemic in the Presence of Mortality
                Displacement</em>
            </li>
          </ul>
        </div>
      </UCard>

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
