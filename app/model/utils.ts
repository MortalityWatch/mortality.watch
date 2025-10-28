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

/**
 * Configuration for metric field name generation
 */
interface MetricConfig {
  baseFieldName: (standardPopulation?: string) => string
  supportsBaseline: boolean
  supportsExcess: boolean
}

/**
 * Metric configurations defining how field names are constructed
 */
const METRIC_CONFIGS: Record<string, MetricConfig> = {
  population: {
    baseFieldName: () => 'population',
    supportsBaseline: false,
    supportsExcess: false
  },
  deaths: {
    baseFieldName: () => 'deaths',
    supportsBaseline: true,
    supportsExcess: true
  },
  cmr: {
    baseFieldName: () => 'cmr',
    supportsBaseline: true,
    supportsExcess: true
  },
  asmr: {
    baseFieldName: (standardPopulation = 'who') => `asmr_${standardPopulation}`,
    supportsBaseline: true,
    supportsExcess: true
  },
  le: {
    baseFieldName: () => 'le',
    supportsBaseline: true,
    supportsExcess: true
  }
}

/**
 * Generate field names based on configuration
 */
const buildFieldKeys = (
  baseField: string,
  showBaseline: boolean,
  isExcess: boolean,
  includePi: boolean
): string[] => {
  // Population is a special case - always return just the base field
  if (baseField === 'population') {
    return [baseField]
  }

  // Excess mode (showBaseline is ignored when isExcess is true)
  if (isExcess) {
    const excessField = `${baseField}_excess`
    if (includePi) {
      return [excessField, `${excessField}_lower`, `${excessField}_upper`]
    }
    return [excessField]
  }

  // Normal mode with baseline
  if (showBaseline) {
    return [
      baseField,
      `${baseField}_baseline`,
      `${baseField}_baseline_lower`,
      `${baseField}_baseline_upper`
    ]
  }

  // Normal mode without baseline
  return [baseField]
}

export const getKeyForType = (
  type: string,
  showBaseline: boolean,
  standardPopulation: string,
  isExcess = false,
  includePi = false
): (keyof NumberEntryFields)[] => {
  const config = METRIC_CONFIGS[type]

  if (!config) {
    throw new Error('Unknown type key provided.')
  }

  // Get base field name (e.g., 'deaths', 'asmr_who', 'le')
  const baseField = config.baseFieldName(standardPopulation)

  // Build field keys based on configuration
  const keys = buildFieldKeys(baseField, showBaseline, isExcess, includePi)

  return keys as (keyof NumberEntryFields)[]
}

export const getBaseKeysForType = (
  type: string,
  showBaseline: boolean,
  standardPopulation: string
): string[] => getKeyForType(type, showBaseline, standardPopulation, false)
