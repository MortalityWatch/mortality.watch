<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center max-w-6xl mx-auto">
      <PageHeader
        title="About Mortality Watch"
        max-width="lg"
      />

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
          regions. The application is fully
          <ULink
            to="https://github.com/MortalityWatch/"
            target="_blank"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            open source on GitHub
          </ULink>.
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
          <p class="text-gray-600 dark:text-gray-400">
            For detailed explanations of our statistical methods, calculations, and
            metrics, please see our
            <ULink
              to="/methods"
              active-class="text-primary"
              inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
            >
              Methodology
            </ULink>
            page.
          </p>
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
            Open Source & Contributing
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            Mortality Watch is fully open source and available on GitHub. Our
            codebase includes the web application (TypeScript/Nuxt), data
            processing pipelines (R), and all statistical models used for baseline
            calculations.
          </p>
          <div class="flex justify-center">
            <UButton
              label="View on GitHub"
              icon="i-simple-icons-github"
              size="lg"
              color="neutral"
              variant="outline"
              to="https://github.com/MortalityWatch/"
              target="_blank"
              trailing
            />
          </div>
          <div class="text-left space-y-3">
            <p class="text-gray-700 dark:text-gray-300">
              <strong>How to contribute:</strong>
            </p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Report issues:</strong> Found a bug or have a feature
                request? Open an issue on GitHub
              </li>
              <li>
                <strong>Improve documentation:</strong> Help us make the
                methodology and code more accessible
              </li>
              <li>
                <strong>Add data sources:</strong> Know of reliable mortality data
                we're missing? Let us know
              </li>
              <li>
                <strong>Code contributions:</strong> Submit pull requests for bug
                fixes, features, or improvements
              </li>
              <li>
                <strong>Share feedback:</strong> Tell us how you're using the
                platform and what would make it better
              </li>
            </ul>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            All contributions are welcome, whether you're a developer, researcher,
            data scientist, or just interested in mortality statistics. Check our
            GitHub repositories for contribution guidelines and current issues.
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
            to="https://www.mortality.watch/charts/list.html"
            target="_blank"
            title="More Charts"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Charts
          </ULink>
          ·
          <ULink
            to="https://www.mortality.watch/data/index.html"
            target="_blank"
            title="Chart Data"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Data
          </ULink>
          ·
          <ULink
            to="/methods"
            title="Statistical Methodology"
            active-class="text-primary"
            inactive-class="text-primary hover:text-primary-600 dark:hover:text-primary-400"
          >
            Methods
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
