/**
 * Discovery Feature Constants
 *
 * Labels, descriptions, icons, and tab definitions for the discovery feature.
 */

import type { TabsItem } from '@nuxt/ui'
import type { Metric, ChartType, View } from './presets'
import { getPresetCountByMetric } from './presets'

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
    description: 'Age-standardized death counts (Levitt method)',
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
  fluseason: 'Flu Season'
}

/**
 * View labels
 */
export const viewLabels: Record<View, string> = {
  normal: 'Normal',
  excess: 'Excess',
  zscore: 'Z-Score'
}

/**
 * View descriptions
 */
export const viewDescriptions: Record<View, string> = {
  normal: 'Actual values over time',
  excess: 'Difference from baseline (2017-2019 mean)',
  zscore: 'Standard deviations from baseline'
}

/**
 * Generate metric tabs for country view
 */
export function getMetricTabs(): TabsItem[] {
  return [
    {
      label: `LE (${getPresetCountByMetric('le')})`,
      value: 'le' as const,
      slot: 'le' as const
    },
    {
      label: `ASD (${getPresetCountByMetric('asd')})`,
      value: 'asd' as const,
      slot: 'asd' as const
    },
    {
      label: `ASMR (${getPresetCountByMetric('asmr')})`,
      value: 'asmr' as const,
      slot: 'asmr' as const
    },
    {
      label: `CMR (${getPresetCountByMetric('cmr')})`,
      value: 'cmr' as const,
      slot: 'cmr' as const
    },
    {
      label: `Deaths (${getPresetCountByMetric('deaths')})`,
      value: 'deaths' as const,
      slot: 'deaths' as const
    },
    {
      label: `Population (${getPresetCountByMetric('population')})`,
      value: 'population' as const,
      slot: 'population' as const
    }
  ] satisfies TabsItem[]
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
