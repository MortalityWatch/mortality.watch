/**
 * Core type definitions for datasets
 */

import type { CountryData } from './country'

export type DatasetRaw = Record<string, Record<string, CountryData[]>>

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

export const datasetEntryKeys = [...stringKeys, ...numberKeys] as const
export type DatasetEntry = StringEntryFields & NumberEntryFields
export type Dataset = Record<string, Record<string, DatasetEntry>>

export interface Notes {
  noData?: Record<string, Set<string>>
  noAsmr?: Set<string>
  disaggregatedData?: Record<string, number[]>
}
