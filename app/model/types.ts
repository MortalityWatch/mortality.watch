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

/**
 * Template literal type generation for mortality metrics
 *
 * This approach auto-generates all field combinations from base metrics,
 * variants, and modifiers. This makes it easier to add new metrics and
 * ensures type-safe field access.
 *
 * Pattern for each metric:
 * - <metric> (base, no variant, no modifier)
 * - <metric>_baseline, <metric>_baseline_lower, <metric>_baseline_upper
 * - <metric>_excess, <metric>_excess_lower, <metric>_excess_upper
 *
 * Note: Modifiers (lower/upper) only apply WITH a variant (baseline/excess).
 * There is no deaths_lower, only deaths_baseline_lower and deaths_excess_lower.
 */

// Base mortality metrics
type Metric = 'deaths' | 'cmr' | 'asmr_who' | 'asmr_esp' | 'asmr_usa' | 'asmr_country' | 'le'

// Generate metric field combinations
// Each metric has: base + (baseline|excess) + optional (lower|upper)
type MetricField
  = | Metric // Base metric (e.g., deaths)
    | `${Metric}_baseline` // Baseline (e.g., deaths_baseline)
    | `${Metric}_baseline_lower` // Baseline lower bound
    | `${Metric}_baseline_upper` // Baseline upper bound
    | `${Metric}_excess` // Excess (e.g., deaths_excess)
    | `${Metric}_excess_lower` // Excess lower bound
    | `${Metric}_excess_upper` // Excess upper bound

// NumberEntryFields includes all auto-generated metric fields plus population
export type NumberEntryFields = {
  [K in MetricField]: NumberArray
} & {
  population: NumberArray // Special case: population doesn't follow the metric pattern
}

/**
 * Auto-generate numberKeys array from the type definition
 * This ensures the runtime array stays in sync with the type definition
 *
 * For each metric, generates:
 * - <metric>
 * - <metric>_baseline, <metric>_baseline_lower, <metric>_baseline_upper
 * - <metric>_excess, <metric>_excess_lower, <metric>_excess_upper
 */

const metrics = ['deaths', 'cmr', 'asmr_who', 'asmr_esp', 'asmr_usa', 'asmr_country', 'le'] as const

// Generate all metric field combinations following the pattern
const metricFields: MetricField[] = []
for (const metric of metrics) {
  // Base metric
  metricFields.push(metric)
  // Baseline variant + modifiers
  metricFields.push(`${metric}_baseline` as MetricField)
  metricFields.push(`${metric}_baseline_lower` as MetricField)
  metricFields.push(`${metric}_baseline_upper` as MetricField)
  // Excess variant + modifiers
  metricFields.push(`${metric}_excess` as MetricField)
  metricFields.push(`${metric}_excess_lower` as MetricField)
  metricFields.push(`${metric}_excess_upper` as MetricField)
}

// numberKeys includes population plus all auto-generated metric fields
export const numberKeys = ['population', ...metricFields] as const

export const datasetEntryKeys = [...stringKeys, ...numberKeys] as const
export type DatasetEntry = StringEntryFields & NumberEntryFields
export type Dataset = Record<string, Record<string, DatasetEntry>>

export interface Notes {
  noData?: Record<string, Set<string>>
  noAsmr?: Set<string>
  disaggregatedData?: Record<string, number[]>
}
