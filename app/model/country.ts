/**
 * Country-related classes and types
 */

import { maybeTransformFluSeason } from '@/utils'

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
  deaths_zscore: number | undefined
  cmr_zscore: number | undefined
  asmr_who_zscore: number | undefined
  asmr_esp_zscore: number | undefined
  asmr_usa_zscore: number | undefined
  asmr_country_zscore: number | undefined

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
