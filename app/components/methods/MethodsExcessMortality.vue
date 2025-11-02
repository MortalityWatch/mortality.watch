<template>
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
</template>
