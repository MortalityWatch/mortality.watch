import type {
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  DefaultDataPoint
} from 'chart.js'
import { maybeTransformFluSeason } from './utils'

export type DatasetRaw = Record<string, Record<string, CountryData[]>>

// Dataset Types
export type StringArray = (string | undefined)[]
export type NumberArray = (number | undefined)[]
export type DataVector = StringArray & NumberArray
export type StringEntryFields = {
  iso3c: StringArray
  age_group: StringArray
  date: StringArray
  type: StringArray
  source: StringArray
  source_asmr: StringArray
}
export const stringKeys = [
  'iso3c',
  'age_group',
  'date',
  'type',
  'source',
  'source_asmr'
] as const
export type NumberEntryFields = {
  population: NumberArray
  deaths: NumberArray
  deaths_baseline: NumberArray
  deaths_baseline_lower: NumberArray
  deaths_baseline_upper: NumberArray
  deaths_excess: NumberArray
  deaths_excess_lower: NumberArray
  deaths_excess_upper: NumberArray
  cmr: NumberArray
  cmr_baseline: NumberArray
  cmr_baseline_lower: NumberArray
  cmr_baseline_upper: NumberArray
  cmr_excess: NumberArray
  cmr_excess_lower: NumberArray
  cmr_excess_upper: NumberArray
  asmr_who: NumberArray
  asmr_who_baseline: NumberArray
  asmr_who_baseline_lower: NumberArray
  asmr_who_baseline_upper: NumberArray
  asmr_who_excess: NumberArray
  asmr_who_excess_lower: NumberArray
  asmr_who_excess_upper: NumberArray
  asmr_esp: NumberArray
  asmr_esp_baseline: NumberArray
  asmr_esp_baseline_lower: NumberArray
  asmr_esp_baseline_upper: NumberArray
  asmr_esp_excess: NumberArray
  asmr_esp_excess_lower: NumberArray
  asmr_esp_excess_upper: NumberArray
  asmr_usa: NumberArray
  asmr_usa_baseline: NumberArray
  asmr_usa_baseline_lower: NumberArray
  asmr_usa_baseline_upper: NumberArray
  asmr_usa_excess: NumberArray
  asmr_usa_excess_lower: NumberArray
  asmr_usa_excess_upper: NumberArray
  asmr_country: NumberArray
  asmr_country_baseline: NumberArray
  asmr_country_baseline_lower: NumberArray
  asmr_country_baseline_upper: NumberArray
  asmr_country_excess: NumberArray
  asmr_country_excess_lower: NumberArray
  asmr_country_excess_upper: NumberArray
  le: NumberArray
  le_baseline: NumberArray
  le_baseline_lower: NumberArray
  le_baseline_upper: NumberArray
  le_excess: NumberArray
  le_excess_lower: NumberArray
  le_excess_upper: NumberArray
}
export const numberKeys = [
  'population',
  'deaths',
  'deaths_baseline',
  'deaths_baseline_lower',
  'deaths_baseline_upper',
  'deaths_excess',
  'deaths_excess_lower',
  'deaths_excess_upper',
  'cmr',
  'cmr_baseline',
  'cmr_baseline_lower',
  'cmr_baseline_upper',
  'cmr_excess',
  'cmr_excess_lower',
  'cmr_excess_upper',
  'asmr_who',
  'asmr_who_baseline',
  'asmr_who_baseline_lower',
  'asmr_who_baseline_upper',
  'asmr_who_excess',
  'asmr_who_excess_lower',
  'asmr_who_excess_upper',
  'asmr_esp',
  'asmr_esp_baseline',
  'asmr_esp_baseline_lower',
  'asmr_esp_baseline_upper',
  'asmr_esp_excess',
  'asmr_esp_excess_lower',
  'asmr_esp_excess_upper',
  'asmr_usa',
  'asmr_usa_baseline',
  'asmr_usa_baseline_lower',
  'asmr_usa_baseline_upper',
  'asmr_usa_excess',
  'asmr_usa_excess_lower',
  'asmr_usa_excess_upper',
  'asmr_country',
  'asmr_country_baseline',
  'asmr_country_baseline_lower',
  'asmr_country_baseline_upper',
  'asmr_country_excess',
  'asmr_country_excess_lower',
  'asmr_country_excess_upper',
  'le',
  'le_baseline',
  'le_baseline_lower',
  'le_baseline_upper',
  'le_excess',
  'le_excess_lower',
  'le_excess_upper'
] as const
export const datasetEntryKeys = [...stringKeys, ...numberKeys]
export type DatasetEntry = StringEntryFields & NumberEntryFields
export type Dataset = Record<string, Record<string, DatasetEntry>>

export type ListType = { name: string, value: string }

export const types: ListType[] = [
  { name: 'Life Expectancy (LE)', value: 'le' },
  { name: 'Age Std. Mortality Rate (ASMR)', value: 'asmr' },
  { name: 'Crude Mortality Rate (CMR)', value: 'cmr' },
  { name: 'Deaths', value: 'deaths' },
  { name: 'Population', value: 'population' }
]

export const chartTypes: ListType[] = [
  { name: 'Week', value: 'weekly' },
  { name: 'Month', value: 'monthly' },
  { name: 'Quarter', value: 'quarterly' },
  { name: 'Year (Jan-Dec)', value: 'yearly' },
  { name: 'Year (Jul-Jun)', value: 'midyear' },
  { name: 'Year (Oct-Sep)', value: 'fluseason' },
  { name: 'Week (13W SMA)', value: 'weekly_13w_sma' },
  { name: 'Week (26W SMA)', value: 'weekly_26w_sma' },
  { name: 'Week (52W SMA)', value: 'weekly_52w_sma' },
  { name: 'Week (104W SMA)', value: 'weekly_104w_sma' }
]

export const getChartTypeOrdinal = (chartType: string): number => {
  if (['yearly', 'midyear', 'fluseason'].includes(chartType)) return 1
  if (chartType.startsWith('weekly')) return 3
  return 2
}

export const getChartTypeFromOrdinal = (ordinal: number): string =>
  ['yearly', 'monthly', 'weekly'][ordinal - 1] || 'yearly'

export const chartStyles: ListType[] = [
  { name: 'Line', value: 'line' },
  { name: 'Bar', value: 'bar' },
  { name: 'Matrix', value: 'matrix' }
]

export const standardPopulations: ListType[] = [
  { name: 'ESP2013', value: 'esp' },
  { name: 'WHO2015', value: 'who' },
  { name: 'US2000', value: 'usa' },
  { name: '2020', value: 'country' }
]

export const jurisdictionTypes: ListType[] = [
  { name: 'Countries', value: 'countries' },
  { name: 'Countries & States ', value: 'countries_states' },
  { name: 'U.S. States', value: 'usa' },
  { name: 'Canadian Provinces', value: 'can' },
  { name: 'EU27 Countries', value: 'eu27' },
  { name: 'German States', value: 'deu' },
  { name: 'Africa', value: 'af' },
  { name: 'Asia', value: 'as' },
  { name: 'Europe', value: 'eu' },
  { name: 'North America', value: 'na' },
  { name: 'Oceania', value: 'oc' },
  { name: 'South America', value: 'sa' }
]

export const baselineMethods: ListType[] = [
  { name: 'Last Value', value: 'naive' },
  { name: 'Average', value: 'mean' },
  { name: 'Median', value: 'median' },
  { name: 'Linear Regression', value: 'lin_reg' },
  { name: 'Exponential Smoothing (ETS)', value: 'exp' }
]

export const decimalPrecisions: ListType[] = [
  { name: '0', value: '0' },
  { name: '1', value: '1' },
  { name: '2', value: '2' },
  { name: '3', value: '3' }
]

// Transformed arrays for UI components (with label property for USelectMenu)
export const standardPopulationItems = standardPopulations
  .filter(x => x.value !== 'country')
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const baselineMethodItems = baselineMethods
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const decimalPrecisionItems = decimalPrecisions
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const settingsModel = {
  chartStyle: chartStyles.map(v => v.value),
  chartType: chartTypes.map(v => v.value),
  type: types.map(v => v.value)
}

export interface CountryRaw {
  iso3c: string
  jurisdiction: string
  min_date: string
  max_date: string
  type: string
  age_groups: string
  source: string
}

export interface CountryDataRaw {
  iso3c: string
  population: string
  date: string
  type: string
  source: string
  source_asmr: string
  deaths: string
  cmr: string
  asmr_who: string
  asmr_esp: string
  asmr_usa: string
  asmr_country: string
}

class CountryMetaData {
  age_groups: Set<string>
  type: string
  source: string
  min_date: string
  max_date: string
  constructor(obj: CountryRaw) {
    this.age_groups = new Set(obj.age_groups.split(', '))
    this.type = ['yearly', 'monthly', 'weekly'][parseInt(obj.type, 10) - 1] || 'yearly'
    this.source = obj.source
    this.min_date = obj.min_date
    this.max_date = obj.max_date
  }
}

export class Country {
  iso3c: string
  jurisdiction: string
  data_source: CountryMetaData[]
  constructor(obj: CountryRaw) {
    this.iso3c = obj.iso3c
    this.jurisdiction = obj.jurisdiction
    this.data_source = [new CountryMetaData(obj)]
  }

  has_asmr(): boolean {
    for (const ds of this.data_source) if (ds.age_groups.size > 1) return true
    return false
  }

  age_groups(): Set<string> {
    const result = new Set<string>()
    for (const ds of this.data_source)
      ds.age_groups.forEach(ag => result.add(ag))
    return result
  }
}

export class CountryData {
  iso3c: string
  age_group: string
  population: number | undefined
  date: string
  type: string
  source: string
  source_asmr: string
  deaths: number | undefined
  deaths_baseline: number | undefined
  deaths_baseline_lower: number | undefined
  deaths_baseline_upper: number | undefined
  deaths_excess: number | undefined
  deaths_excess_lower: number | undefined
  deaths_excess_upper: number | undefined
  cmr: number | undefined
  cmr_baseline: number | undefined
  cmr_baseline_lower: number | undefined
  cmr_baseline_upper: number | undefined
  cmr_excess: number | undefined
  cmr_excess_lower: number | undefined
  cmr_excess_upper: number | undefined
  asmr_who: number | undefined
  asmr_who_baseline: number | undefined
  asmr_who_baseline_lower: number | undefined
  asmr_who_baseline_upper: number | undefined
  asmr_who_excess: number | undefined
  asmr_who_excess_lower: number | undefined
  asmr_who_excess_upper: number | undefined
  asmr_esp: number | undefined
  asmr_esp_baseline: number | undefined
  asmr_esp_baseline_lower: number | undefined
  asmr_esp_baseline_upper: number | undefined
  asmr_esp_excess: number | undefined
  asmr_esp_excess_lower: number | undefined
  asmr_esp_excess_upper: number | undefined
  asmr_usa: number | undefined
  asmr_usa_baseline: number | undefined
  asmr_usa_baseline_lower: number | undefined
  asmr_usa_baseline_upper: number | undefined
  asmr_usa_excess: number | undefined
  asmr_usa_excess_lower: number | undefined
  asmr_usa_excess_upper: number | undefined
  asmr_country: number | undefined
  asmr_country_baseline: number | undefined
  asmr_country_baseline_lower: number | undefined
  asmr_country_baseline_upper: number | undefined
  asmr_country_excess: number | undefined
  asmr_country_excess_lower: number | undefined
  asmr_country_excess_upper: number | undefined
  le: number | undefined
  le_baseline: number | undefined
  le_baseline_lower: number | undefined
  le_baseline_upper: number | undefined
  le_excess: number | undefined
  le_excess_lower: number | undefined
  le_excess_upper: number | undefined

  constructor(obj: CountryDataRaw, age_group: string, chartType: string) {
    this.iso3c = obj.iso3c
    this.age_group = age_group
    this.population
      = obj.population === '' ? undefined : parseInt(obj.population)
    this.date = maybeTransformFluSeason(obj.date)
    this.type = obj.type
    this.source = obj.source
    this.source_asmr = obj.source_asmr
    this.deaths = obj.deaths === '' ? undefined : parseInt(obj.deaths)
    this.deaths_baseline = undefined
    this.deaths_baseline_lower = undefined
    this.deaths_baseline_upper = undefined
    this.deaths_excess = undefined
    this.deaths_excess_lower = undefined
    this.deaths_excess_upper = undefined
    this.cmr = obj.cmr === '' ? undefined : parseFloat(obj.cmr)
    this.cmr_baseline = undefined
    this.cmr_baseline_lower = undefined
    this.cmr_baseline_upper = undefined
    this.cmr_excess = undefined
    this.cmr_excess_lower = undefined
    this.cmr_excess_upper = undefined
    this.asmr_who = obj.asmr_who === '' ? undefined : parseFloat(obj.asmr_who)
    this.asmr_who_baseline = undefined
    this.asmr_who_baseline_lower = undefined
    this.asmr_who_baseline_upper = undefined
    this.asmr_who_excess = undefined
    this.asmr_who_excess_lower = undefined
    this.asmr_who_excess_upper = undefined
    this.asmr_esp = obj.asmr_esp === '' ? undefined : parseFloat(obj.asmr_esp)
    this.asmr_esp_baseline = undefined
    this.asmr_esp_baseline_lower = undefined
    this.asmr_esp_baseline_upper = undefined
    this.asmr_esp_excess = undefined
    this.asmr_esp_excess_lower = undefined
    this.asmr_esp_excess_upper = undefined
    this.asmr_usa = obj.asmr_usa === '' ? undefined : parseFloat(obj.asmr_usa)
    this.asmr_usa_baseline = undefined
    this.asmr_usa_baseline_lower = undefined
    this.asmr_usa_baseline_upper = undefined
    this.asmr_usa_excess = undefined
    this.asmr_usa_excess_lower = undefined
    this.asmr_usa_excess_upper = undefined
    this.asmr_country
      = obj.asmr_country === '' ? undefined : parseFloat(obj.asmr_country)
    this.asmr_country_baseline = undefined
    this.asmr_country_baseline_lower = undefined
    this.asmr_country_baseline_upper = undefined
    this.asmr_country_excess = undefined
    this.asmr_country_excess_lower = undefined
    this.asmr_country_excess_upper = undefined
    this.le
      = obj.asmr_who === ''
        ? undefined
        : calculateLeWho(parseFloat(obj.asmr_who), chartType)
    this.le_baseline = undefined
    this.le_baseline_lower = undefined
    this.le_baseline_upper = undefined
    this.le_excess = undefined
    this.le_excess_lower = undefined
    this.le_excess_upper = undefined
  }
}

const calculateLeWho = (asmr: number, chartType: string) =>
  90.96 - (((2.24 * asmr) / 100) * 365) / daysForChartType(chartType)

const daysForChartType = (chartType: string) => {
  switch (chartType) {
    case 'monthly':
      return 365 / 12
    case 'quarterly':
      return 365 / 4
    default:
      if (chartType.startsWith('weekly')) return 7
      return 365
  }
}

export interface Notes {
  noData?: Record<string, Set<string>>
  noAsmr?: Set<string>
  disaggregatedData?: Record<string, number[]>
}

export interface ChartDataRaw {
  data: Record<string, Record<string, Record<string, (number | string)[]>>>
  labels: string[]
  notes?: Notes
}

export interface FilteredChartData {
  data: Dataset
  labels: string[]
  notes?: Notes
}

export type ChartLabels = {
  title: string[]
  subtitle: string
  xtitle: string
  ytitle: string
}

export const eu27 = [
  'AUT',
  'BEL',
  'BGR',
  'HRV',
  'CYP',
  'CZE',
  'DNK',
  'EST',
  'FIN',
  'FRA',
  'DEU',
  'GRC',
  'HUN',
  'IRL',
  'ITA',
  'LVA',
  'LTU',
  'LUX',
  'MLT',
  'NLD',
  'POL',
  'PRT',
  'ROU',
  'SVK',
  'SVN',
  'ESP',
  'SWE'
]

export const africa = [
  'DZA',
  'AGO',
  'BEN',
  'BWA',
  'BFA',
  'BDI',
  'CPV',
  'CMR',
  'CAF',
  'TCD',
  'COM',
  'COG',
  'COD',
  'DJI',
  'EGY',
  'GNQ',
  'ERI',
  'ETH',
  'GAB',
  'GMB',
  'GHA',
  'GIN',
  'GNB',
  'CIV',
  'KEN',
  'LSO',
  'LBR',
  'LBY',
  'MDG',
  'MWI',
  'MLI',
  'MRT',
  'MUS',
  'MAR',
  'MOZ',
  'NAM',
  'NER',
  'NGA',
  'REU',
  'RWA',
  'SHN',
  'STP',
  'SEN',
  'SYC',
  'SLE',
  'SOM',
  'ZAF',
  'SSD',
  'SDN',
  'SWZ',
  'TZA',
  'TGO',
  'TUN',
  'UGA',
  'ESH',
  'ZMB',
  'ZWE'
]

export const asia = [
  'AFG',
  'ARE',
  'ARM',
  'AZE',
  'BGD',
  'BHR',
  'BRN',
  'BTN',
  'CCK',
  'CHN',
  'CYP',
  'GEO',
  'HKG',
  'IND',
  'IDN',
  'IRN',
  'IRQ',
  'ISR',
  'JPN',
  'JOR',
  'KAZ',
  'KGZ',
  'KHM',
  'KOR',
  'KWT',
  'LAO',
  'LBN',
  'LKA',
  'MAC',
  'MDV',
  'MNG',
  'MMR',
  'MYS',
  'NPL',
  'OMN',
  'PAK',
  'PHL',
  'PRK',
  'PSE',
  'QAT',
  'RUS',
  'SAU',
  'SGP',
  'SYR',
  'THA',
  'TJK',
  'TKM',
  'TLS',
  'TUR',
  'TWN',
  'UZB',
  'VNM',
  'YEM'
]

export const europe = [
  'ALB',
  'AND',
  'AUT',
  'BEL',
  'BGR',
  'BIH',
  'BLR',
  'CHE',
  'CZE',
  'DEU',
  'DNK',
  'ESP',
  'EST',
  'FIN',
  'FRA',
  'FRO',
  'GBR',
  'GIB',
  'GRC',
  'HRV',
  'HUN',
  'IMN',
  'IRL',
  'ISL',
  'ITA',
  'KOS',
  'LIE',
  'LTU',
  'LUX',
  'LVA',
  'MCO',
  'MDA',
  'MKD',
  'MLT',
  'MNE',
  'NLD',
  'NOR',
  'POL',
  'PRT',
  'ROU',
  'RUS',
  'SMR',
  'SRB',
  'SVK',
  'SVN',
  'SWE',
  'UKR',
  'VAT'
]

export const northAmerica = [
  'AIA',
  'ATG',
  'BHS',
  'BLZ',
  'BMU',
  'BRB',
  'CAN',
  'CYM',
  'CUB',
  'DMA',
  'DOM',
  'GRD',
  'GRL',
  'GLP',
  'GTM',
  'HTI',
  'HND',
  'JAM',
  'KNA',
  'LCA',
  'MAF',
  'MEX',
  'MSR',
  'MTQ',
  'NIC',
  'PAN',
  'PRI',
  'SLV',
  'SPM',
  'SVG',
  'TCA',
  'TTO',
  'USA',
  'VCT',
  'VGB',
  'VIR'
]

export const oceania = [
  'ASM',
  'AUS',
  'COK',
  'FJI',
  'FSM',
  'GUM',
  'KIR',
  'MHL',
  'MNP',
  'NCL',
  'NFK',
  'NIU',
  'NRU',
  'NZL',
  'PLW',
  'PNG',
  'PYF',
  'SLB',
  'TKL',
  'TON',
  'TUV',
  'UMI',
  'VUT',
  'WLF'
]

export const southAmerica = [
  'ARG',
  'BOL',
  'BRA',
  'CHL',
  'COL',
  'ECU',
  'FLK',
  'GUF',
  'GUY',
  'PER',
  'PRY',
  'SUR',
  'URY',
  'VEN'
]

export type DatasetReturn = {
  datasets: ChartDataset<ChartType, DefaultDataPoint<ChartType>>[]
  sources: string[]
}

export const getKeyForType = (
  type: string,
  showBaseline: boolean,
  standardPopulation: string,
  isExcess = false,
  includePi = false
): (keyof NumberEntryFields)[] => {
  switch (type) {
    case 'population':
      return ['population'] as (keyof NumberEntryFields)[]
    case 'deaths':
      if (isExcess) {
        if (includePi)
          return [
            'deaths_excess',
            'deaths_excess_lower',
            'deaths_excess_upper'
          ] as (keyof NumberEntryFields)[]
        else return ['deaths_excess'] as (keyof NumberEntryFields)[]
      } else {
        return showBaseline
          ? ([
              'deaths',
              'deaths_baseline',
              'deaths_baseline_lower',
              'deaths_baseline_upper'
            ] as (keyof NumberEntryFields)[])
          : (['deaths'] as (keyof NumberEntryFields)[])
      }
    case 'cmr':
      if (isExcess) {
        if (includePi)
          return [
            'cmr_excess',
            'cmr_excess_lower',
            'cmr_excess_upper'
          ] as (keyof NumberEntryFields)[]
        else return ['cmr_excess'] as (keyof NumberEntryFields)[]
      } else {
        return showBaseline
          ? ([
              'cmr',
              'cmr_baseline',
              'cmr_baseline_lower',
              'cmr_baseline_upper'
            ] as (keyof NumberEntryFields)[])
          : (['cmr'] as (keyof NumberEntryFields)[])
      }
    case 'asmr':
      if (isExcess) {
        if (includePi)
          return [
            `asmr_${standardPopulation}_excess`,
            `asmr_${standardPopulation}_excess_lower`,
            `asmr_${standardPopulation}_excess_upper`
          ] as (keyof NumberEntryFields)[]
        else
          return [
            `asmr_${standardPopulation}_excess`
          ] as (keyof NumberEntryFields)[]
      } else {
        if (showBaseline) {
          return [
            `asmr_${standardPopulation}`,
            `asmr_${standardPopulation}_baseline`,
            `asmr_${standardPopulation}_baseline_lower`,
            `asmr_${standardPopulation}_baseline_upper`
          ] as (keyof NumberEntryFields)[]
        } else {
          return [`asmr_${standardPopulation}`] as (keyof NumberEntryFields)[]
        }
      }
    case 'le':
      if (isExcess) {
        if (includePi)
          return [
            'le_excess',
            'le_excess_lower',
            'le_excess_upper'
          ] as (keyof NumberEntryFields)[]
        else return ['le_excess'] as (keyof NumberEntryFields)[]
      } else {
        if (showBaseline) {
          return [
            'le',
            'le_baseline',
            'le_baseline_lower',
            'le_baseline_upper'
          ] as (keyof NumberEntryFields)[]
        } else {
          return ['le'] as (keyof NumberEntryFields)[]
        }
      }

    default:
      throw new Error('Unknown type key provided.')
  }
}

export const getBaseKeysForType = (
  type: string,
  showBaseline: boolean,
  standardPopulation: string
): string[] => getKeyForType(type, showBaseline, standardPopulation, false)

export type ChartJSConfig<
  TType extends ChartType,
  TData = unknown,
  TLabel = unknown
> = {
  data: ChartData<TType, TData, TLabel>
  options: ChartOptions<TType>
}

export type AllChartData = {
  data: Dataset
  labels: string[]
  notes: {
    noData: Record<string, Set<string>> | undefined
    noAsmr: Set<string> | undefined
    disaggregatedData?: Record<string, number[]>
  }
}
