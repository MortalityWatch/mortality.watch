<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">
        About Mortality Watch
      </h1>

      <div class="space-y-4">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Mortality Watch is a comprehensive web application for visualizing and
          analyzing global mortality data, with a particular focus on excess
          mortality during COVID-19 and other significant health events. We provide
          interactive charts and data exploration tools for mortality statistics
          across different regions, time periods, and demographics.
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Our platform offers the most extensive publicly available mortality
          dataset, featuring daily updates from official sources worldwide. All
          visualizations support multiple chart types (line, bar, matrix), time
          series analysis with moving averages, and comparative analysis between
          regions. The application is fully open source on GitHub.
        </p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Key Features & Capabilities
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            Our platform provides comprehensive mortality analysis tools:
          </p>
          <div class="flex justify-center">
            <ul class="list-disc pl-6 text-left space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Interactive Visualizations:</strong> Line charts, bar
                charts, and matrix heatmaps
              </li>
              <li>
                <strong>Geographic Coverage:</strong> Countries, US states,
                Canadian provinces, EU regions
              </li>
              <li>
                <strong>Time Series Analysis:</strong> Weekly, monthly, quarterly,
                and yearly data
              </li>
              <li>
                <strong>Age Group Analysis:</strong> All ages and age-specific
                mortality rates
              </li>
              <li>
                <strong>Multiple Metrics:</strong> Deaths, CMR, ASMR, life
                expectancy, and population data
              </li>
              <li>
                <strong>Excess Mortality:</strong> Compare observed vs expected
                deaths with various baselines
              </li>
              <li>
                <strong>Data Export:</strong> Download charts and underlying data
                for further analysis
              </li>
              <li>
                <strong>Dark/Light Theme:</strong> Comfortable viewing in any
                lighting condition
              </li>
            </ul>
          </div>
          <div class="text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Mortality Metrics Explained:</strong></p>
            <p>• <strong>CMR (Crude Mortality Rate):</strong> Deaths per 100,000 residents</p>
            <p>• <strong>ASMR (Age-Standardized Mortality Rate):</strong> Adjusted for population age structure using WHO2015, ESP2013, US2000 standards, or country-specific 2020 age tables</p>
            <p>• <strong>Life Expectancy:</strong> Calculated from ASMR using WHO methodology</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Data Sources
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            We aggregate mortality data from official government sources worldwide:
          </p>
          <div class="flex justify-center">
            <ul class="list-disc pl-6 text-left space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>World Mortality Database:</strong> Primary international
                mortality data source
              </li>
              <li>
                <strong>Eurostat:</strong> European Union mortality statistics
              </li>
              <li>
                <strong>CDC:</strong> United States mortality data with
                suppression handling
              </li>
              <li>
                <strong>Statistics Canada:</strong> Canadian provincial mortality
                data
              </li>
              <li><strong>Destatis:</strong> German federal statistics office</li>
              <li>
                <strong>Human Mortality Database:</strong> Short-term mortality
                fluctuations (STMF)
              </li>
              <li>
                <strong>UN Population Division:</strong> Global population data
                for rate calculations
              </li>
            </ul>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            All data is updated daily from these official sources, ensuring the
            most current and reliable mortality statistics available.
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Excess Death Baseline Models
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            The default baseline is a simple 3-year pre-pandemic average
            (2017–2019). While this approach is straightforward, it may not
            account for underlying trends and can over- or under-estimate excess
            deaths. As noted by Levitt et al.: "Changes in mortality rates may
            differ markedly year to year and across age and gender groups. During
            major events such as pandemics, wars, or natural disasters, estimates
            may diverge from observed deaths proportionally to the event's impact.
            Importantly, there's no certainty mortality rates will continue to
            decline over time, even absent major disruptions."
          </p>

          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            title="Caution"
            description="Excess Death estimates are derived from baseline models using historical data and assumptions. These projections may not fully reflect actual mortality patterns."
          />

          <p class="text-gray-700 dark:text-gray-300">
            Users can select from several baseline methods:
          </p>
          <div class="flex justify-center">
            <ul class="list-disc pl-6 text-left space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Last Value:
                <ULink
                  to="https://fable.tidyverts.org/reference/RW.html"
                  target="_blank"
                  active-class="text-primary"
                  inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                >
                  fable::NAIVE
                </ULink>
              </li>
              <li>
                Average:
                <ULink
                  to="https://fable.tidyverts.org/reference/TSLM.html"
                  target="_blank"
                  active-class="text-primary"
                  inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                >
                  fable::TSLM
                </ULink>
              </li>
              <li>
                Linear Regression:
                <ULink
                  to="https://fable.tidyverts.org/reference/TSLM.html"
                  target="_blank"
                  active-class="text-primary"
                  inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                >
                  fable::TSLM
                </ULink>
                + trend()
              </li>
              <li>
                Last Value with Smoothing:
                <ULink
                  to="https://fable.tidyverts.org/reference/ETS.html"
                  target="_blank"
                  active-class="text-primary"
                  inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
                >
                  fable::ETS
                </ULink>
                + error() + trend()
              </li>
            </ul>
          </div>
          <p class="text-gray-700 dark:text-gray-300">
            Seasonal adjustments are applied for sub-annual data resolutions.
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Contact
          </h2>
        </template>

        <p class="text-gray-700 dark:text-gray-300">
          Feedback or questions? Reach us via
          <ULink
            to="mailto:mortalitywatch@proton.me"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            E-Mail
          </ULink>
          or on
          <ULink
            to="https://twitter.com/mortalitywatch"
            target="_blank"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            @MortalityWatch on X
          </ULink>.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            More
          </h2>
        </template>

        <p class="text-gray-700 dark:text-gray-300">
          Discover more:
          <ULink
            to="/charts/list.html"
            target="_blank"
            title="More Charts"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Charts
          </ULink>
          ·
          <ULink
            to="/data/index.html"
            target="_blank"
            title="Chart Data"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Data
          </ULink>
          ·
          <ULink
            to="https://github.com/MortalityWatch/"
            target="_blank"
            title="Open Source Code"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            GitHub
          </ULink>
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'About'
})

// SEO metadata
useSeoMeta({
  title: 'About',
  description: 'Learn about Mortality Watch, a comprehensive web application for visualizing and analyzing global mortality data with a focus on excess mortality during significant health events.',
  ogTitle: 'About - Mortality Watch',
  ogDescription: 'Comprehensive mortality data visualization and analysis platform with interactive charts and data exploration tools.',
  ogImage: '/og-image.png',
  twitterTitle: 'About - Mortality Watch',
  twitterDescription: 'Comprehensive mortality data visualization and analysis platform.',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
