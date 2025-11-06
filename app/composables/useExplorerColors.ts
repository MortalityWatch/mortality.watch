import { computed, type Ref } from 'vue'
import { getChartColors } from '@/colors'
import { getColorScale } from '@/lib/chart/chartColors'

/**
 * Explorer Colors Composable
 *
 * Color management for the explorer page
 *
 * Manages chart color selection with:
 * - Theme-aware default colors
 * - User custom colors support
 * - Automatic color scale generation for many countries
 */
export function useExplorerColors(
  countries: Ref<string[]>,
  userColors: Ref<string[] | undefined>,
  colorMode: { value: string }
) {
  // Color picker should only show colors for selected jurisdictions
  const displayColors = computed(() => {
    // Add colorMode.value as dependency to make this reactive to theme changes
    const _theme = colorMode.value

    const numCountries = countries.value.length
    if (numCountries === 0) return []

    // If user has custom colors, use them (extending if needed)
    if (userColors.value) {
      if (userColors.value.length >= numCountries) {
        return userColors.value.slice(0, numCountries)
      }
      // If user colors are fewer than countries, extend using color scale
      return getColorScale(userColors.value, numCountries)
    }

    // Use default colors (theme-aware)
    const themeColors = getChartColors()
    if (themeColors.length >= numCountries) {
      // We have enough colors, just slice
      return themeColors.slice(0, numCountries)
    }

    // Need more colors than we have, use chroma to generate
    return getColorScale(themeColors, numCountries)
  })

  return {
    displayColors
  }
}
