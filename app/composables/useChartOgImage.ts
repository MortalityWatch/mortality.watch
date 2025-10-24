/**
 * Composable for generating dynamic OG images for charts
 */

import { computed, unref, type MaybeRef } from 'vue'
import { chartStateToQueryString, type ChartState } from '@/lib/chartState'

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
    const countries = currentState.countries?.join(', ') || 'Multiple Countries'
    const typeLabel = currentState.type || 'Mortality'
    const chartTypeLabel = currentState.chartType || 'Data'

    return `${typeLabel} - ${countries} (${chartTypeLabel})`
  })

  const ogDescription = computed(() => {
    const currentState = unref(state)
    const countries = currentState.countries?.join(', ') || 'multiple countries'
    const excess = currentState.isExcess ? 'Excess' : ''
    const type = currentState.type || 'mortality'

    return `${excess} ${type} data for ${countries}. Interactive charts and analysis from MortalityWatch.`
  })

  return {
    ogImageUrl,
    ogTitle,
    ogDescription
  }
}
