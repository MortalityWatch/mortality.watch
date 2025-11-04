<template>
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
</template>
