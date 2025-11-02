import type { TabsItem } from '@nuxt/ui'

export const tabs = [
  {
    label: 'Mortality Data',
    value: 'mortality' as const,
    slot: 'mortality' as const
  },
  {
    label: 'Population Data',
    value: 'population' as const,
    slot: 'population' as const
  },
  {
    label: 'Standard Populations',
    value: 'standard' as const,
    slot: 'standard' as const
  }
] satisfies TabsItem[]

export const mortalityColumns = [
  { key: 'country', label: 'COUNTRY' },
  { key: 'min_date', label: 'FROM' },
  { key: 'max_date', label: 'UNTIL' },
  { key: 'type', label: 'TYPE' },
  { key: 'age_groups', label: 'AGES' },
  { key: 'source', label: 'SOURCE' }
]

export const populationColumns = [
  { key: 'country', label: 'COUNTRY' },
  { key: 'source', label: 'SOURCE' }
]

export const standardColumns = [
  { key: 'source', label: 'SOURCE' }
]

export const standardSources = [
  {
    source: '<a href="https://seer.cancer.gov/stdpopulations/stdpop.19ages.html" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">SEER</a>'
  }
]

export const populationSources = [
  {
    country: 'USA',
    source: '<a href="https://www2.census.gov/programs-surveys/popest/datasets/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Census.gov</a>'
  },
  {
    country: 'Canada',
    source: '<a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000501" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Statistics Canada</a>'
  },
  {
    country: 'DEU (2000-2022)',
    source: 'Statistisches Bundesamt: <a href="https://www-genesis.destatis.de/genesis//online?operation=table&code=12411-0005&bypass=true&levelindex=1&levelid=1686002630001#abreadcrumb" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">1</a> | <a href="https://www-genesis.destatis.de/genesis//online?operation=table&code=12411-0012&bypass=true&levelindex=1&levelid=1686002711178#abreadcrumb" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">2</a>'
  },
  {
    country: 'Countries from Eurostat',
    source: '<a href="https://ec.europa.eu/eurostat/databrowser/view/DEMO_PJAN/default/table?lang=en" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Eurostat</a>'
  },
  {
    country: 'Countries from "Human Mortality Database (STMF)"',
    source: 'Data provided in dataset.'
  },
  {
    country: 'All other countries',
    source: '<a href="https://population.un.org/wpp/Download/Standard/MostUsed/" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">UN World Population Prospects 2022</a>'
  }
]
