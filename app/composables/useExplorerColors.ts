import { computed, type Ref } from 'vue'
import { computeDisplayColors } from '@/lib/chart/chartColors'
import { getIsDark } from '@/composables/useTheme'

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

    // Use shared computeDisplayColors - same logic as SSR
    return computeDisplayColors(numSeries, userColors.value, getIsDark())
  })

  return {
    displayColors
  }
}
