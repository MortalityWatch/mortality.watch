/**
 * Discovery Feature Constants
 *
 * Labels, descriptions, icons, and tab definitions for the discovery feature.
 */

import type { TabsItem } from '@nuxt/ui'
import type { Metric, ChartType, View } from './presets'

/**
 * Metric metadata for display
 */
export const metricInfo: Record<Metric, {
  label: string
  shortLabel: string
  description: string
  icon: string
}> = {
  le: {
    label: 'Life Expectancy',
    shortLabel: 'LE',
    description: 'Period life expectancy at birth',
    icon: 'i-lucide-heart-pulse'
  },
  asd: {
    label: 'Age-Standardized Deaths',
    shortLabel: 'ASD',
    description: 'Death counts adjusted for population age structure',
    icon: 'i-lucide-scale'
  },
  asmr: {
    label: 'Age-Standardized Mortality Rate',
    shortLabel: 'ASMR',
    description: 'Deaths per 100,000 population, age-adjusted',
    icon: 'i-lucide-bar-chart-3'
  },
  cmr: {
    label: 'Crude Mortality Rate',
    shortLabel: 'CMR',
    description: 'Deaths per 100,000 population, unadjusted',
    icon: 'i-lucide-percent'
  },
  deaths: {
    label: 'Deaths',
    shortLabel: 'Deaths',
    description: 'Total death counts',
    icon: 'i-lucide-skull'
  },
  population: {
    label: 'Population',
    shortLabel: 'Pop',
    description: 'Population counts by age group',
    icon: 'i-lucide-users'
  }
}

/**
 * Chart type labels
 */
export const chartTypeLabels: Record<ChartType, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  midyear: 'Mid-Year',
  fluseason: 'Flu Season'
}

/**
 * View labels (matches explorer terminology)
 */
export const viewLabels: Record<View, string> = {
  normal: 'Raw Values',
  excess: 'Excess',
  zscore: 'Z-Score'
}

/**
 * View descriptions
 */
export const viewDescriptions: Record<View, string> = {
  normal: 'Observed values without adjustments or transformations',
  excess: 'Difference from expected baseline (observed - expected)',
  zscore: 'How many standard deviations from baseline (±2 = significant)'
}

/**
 * View icons
 */
export const viewIcons: Record<View, string> = {
  normal: 'i-lucide-eye',
  excess: 'i-lucide-diff',
  zscore: 'i-lucide-sigma'
}

/**
 * Re-export metrics from presets (single source of truth)
 */
export { metrics } from './presets'

/**
 * Generate metric tabs for country view
 */
export function getMetricTabs(): TabsItem[] {
  return metrics.map(metric => ({
    label: metricInfo[metric].label,
    value: metric,
    slot: metric,
    icon: metricInfo[metric].icon
  })) satisfies TabsItem[]
}

/**
 * Popular countries for quick selection
 */
export const popularCountries = [
  'USA',
  'GBR',
  'DEU',
  'FRA',
  'ITA',
  'ESP',
  'SWE',
  'NLD'
]

/**
 * Region definitions for filtering
 */
export const regionFilters = [
  { label: 'All', value: 'all' },
  { label: 'EU27', value: 'eu27' },
  { label: 'Europe', value: 'eu' },
  { label: 'U.S. States', value: 'usa' },
  { label: 'German States', value: 'deu' },
  { label: 'Canadian Provinces', value: 'can' },
  { label: 'Asia', value: 'as' },
  { label: 'North America', value: 'na' },
  { label: 'South America', value: 'sa' },
  { label: 'Oceania', value: 'oc' },
  { label: 'Africa', value: 'af' }
]

/**
 * Format preset label for display
 */
export function formatPresetLabel(chartType: ChartType, view: View): string {
  return `${chartTypeLabels[chartType]} ${viewLabels[view]}`
}

/**
 * Get full preset description
 */
export function getPresetDescription(metric: Metric, chartType: ChartType, view: View): string {
  const metricLabel = metricInfo[metric].label
  const chartLabel = chartTypeLabels[chartType]

  if (view === 'normal') {
    return `${metricLabel} - ${chartLabel} data`
  }
  if (view === 'excess') {
    return `${metricLabel} - ${chartLabel} excess vs 2017-2019 baseline`
  }
  return `${metricLabel} - ${chartLabel} z-score analysis`
}
