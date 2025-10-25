/**
 * Model utility functions
 */

import type { NumberEntryFields } from './types'

export const getChartTypeOrdinal = (chartType: string): number => {
  if (['yearly', 'midyear', 'fluseason'].includes(chartType)) return 1
  if (chartType.startsWith('weekly')) return 3
  return 2
}

export const getChartTypeFromOrdinal = (ordinal: number): string =>
  ['yearly', 'monthly', 'weekly'][ordinal - 1] || 'yearly'

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
