import { computed, type Ref } from 'vue'
import { getChartColors, getColorScale } from '@/lib/chart/chartColors'

/**
 * Explorer Colors Composable
 *
 * Color management for the explorer page
 *
 * Manages chart color selection with:
 * - Theme-aware default colors
 * - User custom colors support
 * - Automatic color scale generation for many countries/age groups
 */
export function useExplorerColors(
  countries: Ref<string[]>,
  userColors: Ref<string[] | undefined>,
  colorMode: { value: string },
  ageGroups?: Ref<string[]>
) {
  // Color picker should only show colors for selected jurisdictions
  const displayColors = computed(() => {
    // Add colorMode.value as dependency to make this reactive to theme changes
    const _theme = colorMode.value

    const numCountries = countries.value.length
    const numAgeGroups = ageGroups?.value?.length ?? 1
    // Need one color per country * ageGroup combination
    const numSeries = numCountries * numAgeGroups
    if (numSeries === 0) return []

    // If user has custom colors, use them (extending if needed)
    if (userColors.value) {
      if (userColors.value.length >= numSeries) {
        return userColors.value.slice(0, numSeries)
      }
      // If user colors are fewer than series, extend using color scale
      return getColorScale(userColors.value, numSeries)
    }

    // Use default colors (theme-aware)
    const themeColors = getChartColors()
    if (themeColors.length >= numSeries) {
      // We have enough colors, just slice
      return themeColors.slice(0, numSeries)
    }

    // Need more colors than we have, use chroma to generate
    return getColorScale(themeColors, numSeries)
  })

  return {
    displayColors
  }
}
