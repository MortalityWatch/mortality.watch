/**
 * Composable for generating dynamic OG images for charts
 */

import { computed, unref, type MaybeRef } from 'vue'
import { chartStateToQueryString, type ChartState } from '@/lib/chartState'
import { types, chartTypes } from '@/model'
import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'

// Register English language for country name lookups
countries.registerLocale(en)

export function useChartOgImage(state: MaybeRef<Partial<ChartState>>) {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://www.mortality.watch'

  const ogImageUrl = computed(() => {
    const currentState = unref(state)
    const queryString = chartStateToQueryString(currentState)

    // Generate chart.png URL with state
    return `${siteUrl}/chart.png?${queryString}`
  })

  const ogTitle = computed(() => {
    const currentState = unref(state)

    // Convert ISO country codes to full names
    const countryNames = currentState.countries?.map(code =>
      countries.getName(code, 'en') || code
    ).join(', ') || 'Multiple Countries'

    // Map raw values to human-readable names
    const typeLabel = types.find(t => t.value === currentState.type)?.name || 'Mortality'
    const chartTypeLabel = chartTypes.find(t => t.value === currentState.chartType)?.name || 'Data'

    return `${typeLabel} - ${countryNames} · ${chartTypeLabel} · Mortality Watch`
  })

  const ogDescription = computed(() => {
    const currentState = unref(state)

    // Convert ISO country codes to full names for description
    const countryNames = currentState.countries?.map(code =>
      countries.getName(code, 'en') || code
    ).join(', ') || 'multiple countries'

    const excess = currentState.isExcess ? 'Excess' : ''
    const type = currentState.type || 'mortality'

    return `${excess} ${type} data for ${countryNames}. Interactive charts and analysis from MortalityWatch.`
  })

  return {
    ogImageUrl,
    ogTitle,
    ogDescription
  }
}
