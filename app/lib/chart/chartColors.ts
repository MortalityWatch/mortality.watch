import chroma from 'chroma-js'
import { toDarkTheme, parseToHsl } from '../colorTransform'
import { getIsDark } from '@/composables/useTheme'
import { THEME_COLORS } from '../config/constants'

/**
 * Resolve dark mode from optional override or current theme
 * Reduces duplication of `isDark !== undefined ? isDark : getIsDark()` pattern
 */
const resolveDarkMode = (isDarkOverride?: boolean): boolean =>
  isDarkOverride !== undefined ? isDarkOverride : getIsDark()

export const textColor = (isDark?: boolean) => {
  return resolveDarkMode(isDark) ? '#ffffff' : '#25304a'
}

export const textSoftColor = (isDark?: boolean) => {
  return resolveDarkMode(isDark) ? '#9ca3af' : '#6b7280' // light gray in dark mode, dark gray in light mode
}

export const textStrongColor = (isDark?: boolean) => {
  return resolveDarkMode(isDark) ? '#ffffff' : '#000000'
}

export const isLightColor = (color: string) => {
  const hsl = parseToHsl(color)
  return hsl.lightness >= (!getIsDark() ? 0.3 : 0.7)
}

export const borderColor = (isDark?: boolean) => {
  return resolveDarkMode(isDark) ? '#2a3041' : '#e0e6fb'
}

export const backgroundColor = (isDark?: boolean) => {
  return resolveDarkMode(isDark) ? THEME_COLORS.BG_DARK : THEME_COLORS.BG_LIGHT
}

export const getColorPalette = (
  isPopulationType: boolean,
  isLifeExpectancyType: boolean,
  isExcess: boolean,
  isDark?: boolean
) => {
  if (isPopulationType) return color_scale_pop(isDark)
  if (isLifeExpectancyType) return color_scale_bad_good(isDark)
  if (isExcess) return color_scale_diverging(isDark)
  else return color_scale(isDark)
}

export const getGradientColor = (
  palette: string[],
  percent: number
): string => {
  const index = Math.round(percent * (palette.length - 1))
  return palette[index] || palette[0] || ''
}

// Population type scale (blue sequential)
const color_scale_pop_light = [
  '#ebefff',
  '#d9e3ff',
  '#c7d8fe',
  '#b4ccfe',
  '#a2c1fe',
  '#90b5fd',
  '#7ea9fd',
  '#6b9efc',
  '#5992fc'
]
export const color_scale_pop = (isDarkOverride?: boolean) => {
  return resolveDarkMode(isDarkOverride) ? color_scale_pop_light.map(toDarkTheme) : color_scale_pop_light
}

export const getColorScale = (colors: string[], count: number) =>
  chroma.scale(colors).mode('rgb').colors(count)

// Life expectancy scale (bad red to good green)
const color_scale_bad_good_light = getColorScale(['#ff5393', '#5dac20'], 9)

export const color_scale_bad_good = (isDarkOverride?: boolean) => {
  return resolveDarkMode(isDarkOverride) ? color_scale_bad_good_light.map(toDarkTheme) : color_scale_bad_good_light
}

// Diverging blue-to-red scale (for excess mortality)
const color_scale_diverging_light = [
  '#5992fc',
  '#81adfd',
  '#a9c8fe',
  '#d1e3fe',
  '#f9fdff',
  '#ffc5c1',
  '#ffa19c',
  '#ff7c78',
  '#ff5853'
]
export const color_scale_diverging = (isDarkOverride?: boolean) => {
  return resolveDarkMode(isDarkOverride) ? color_scale_diverging_light.map(toDarkTheme) : color_scale_diverging_light
}

// Sequential red scale (for general heatmaps)
const color_scale_light = [
  '#fff7f3',
  '#ffe3df',
  '#ffd0cb',
  '#ffbcb7',
  '#ffa8a3',
  '#ff948f',
  '#ff807b',
  '#ff6c67',
  '#ff5853'
]
export const color_scale = (isDarkOverride?: boolean) => {
  return resolveDarkMode(isDarkOverride) ? color_scale_light.map(toDarkTheme) : color_scale_light
}

// ============================================================================
// Chart Line/Bar Colors (from colors.ts)
// ============================================================================

// Main chart colors for line/bar charts (light theme)
export const chartLineColors = [
  '#ff5393',
  '#5dac20',
  '#5992fc',
  '#ffa243',
  '#ff56f5',
  '#23b9d3',
  '#bad31f'
]

// Get chart line colors based on current theme
export const getChartColors = (isDarkOverride?: boolean) => {
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return isDark ? chartLineColors.map(toDarkTheme) : chartLineColors
}

// Get interpolated color palette for a specific count of items
export const getChartColorPalette = (count: number, isDarkOverride?: boolean) =>
  chroma
    .scale(getChartColors(isDarkOverride).slice(0, count))
    .mode('rgb')
    .colors(count)

/**
 * Compute display colors for chart series.
 * Pure function - same logic as useExplorerColors.displayColors.
 * Used by both SSR and client to ensure identical color assignment.
 *
 * @param numSeries - Number of series (countries * ageGroups)
 * @param userColors - Optional user-defined colors
 * @param isDark - Dark mode flag
 * @returns Array of colors for each series
 */
export function computeDisplayColors(
  numSeries: number,
  userColors: string[] | undefined,
  isDark: boolean
): string[] {
  if (numSeries === 0) return []

  // If user has custom colors, use them (extending if needed)
  if (userColors && userColors.length > 0) {
    if (userColors.length >= numSeries) {
      return userColors.slice(0, numSeries)
    }
    // If user colors are fewer than series, extend using color scale
    return getColorScale(userColors, numSeries)
  }

  // Use default colors (theme-aware)
  const themeColors = getChartColors(isDark)
  if (themeColors.length >= numSeries) {
    // We have enough colors, just slice
    return themeColors.slice(0, numSeries)
  }

  // Need more colors than we have, use chroma to generate
  return getColorScale(themeColors, numSeries)
}

// ============================================================================
// UI Colors (from colors.ts)
// ============================================================================

// Special UI accent color (blue)
export const specialColor = (isDarkOverride?: boolean) => {
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return !isDark ? '#1a82fb' : '#5189ec'
}

// Green accent color (for positive indicators)
export const greenColor = (isDarkOverride?: boolean) => {
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return !isDark ? '#44781d' : '#5f8b3e'
}

// CSS class names for diverging color scale (used in ranking table - excess mode)
export const color_scale_diverging_css = () => [
  'color-scale-1',
  'color-scale-2',
  'color-scale-3',
  'color-scale-4',
  'color-scale-5',
  'color-scale-6',
  'color-scale-7',
  'color-scale-8',
  'color-scale-9'
]

// CSS class names for Life Expectancy scale (high = good/green, low = bad/red)
export const color_scale_le_css = () => [
  'color-scale-le-1',
  'color-scale-le-2',
  'color-scale-le-3',
  'color-scale-le-4',
  'color-scale-le-5',
  'color-scale-le-6',
  'color-scale-le-7',
  'color-scale-le-8',
  'color-scale-le-9'
]

// CSS class names for mortality rate scale (high = bad/red, low = good/light)
export const color_scale_mr_css = () => [
  'color-scale-mr-1',
  'color-scale-mr-2',
  'color-scale-mr-3',
  'color-scale-mr-4',
  'color-scale-mr-5',
  'color-scale-mr-6',
  'color-scale-mr-7',
  'color-scale-mr-8',
  'color-scale-mr-9'
]

// ============================================================================
// Continuous Color Scales for Ranking Table (using chroma.js + ColorBrewer)
// ============================================================================

/**
 * ColorBrewer palettes for ranking table coloring.
 * These are perceptually uniform and colorblind-friendly.
 *
 * See: https://colorbrewer2.org/
 */
const BREWER_PALETTES = {
  // Diverging: Blue (negative) → White → Red (positive) for excess mortality
  RdBu: chroma.brewer.RdBu,
  // Sequential: Orange-Red for mortality rates (higher = worse)
  OrRd: chroma.brewer.OrRd,
  // Sequential: Red-Yellow-Green for life expectancy (higher = better)
  RdYlGn: chroma.brewer.RdYlGn
}

/**
 * Creates a continuous color scale function for ranking table cells.
 * Uses ColorBrewer palettes for perceptual uniformity.
 * Returns both background color and appropriate text color for contrast.
 *
 * Scale types:
 * - Relative mode: RdBu diverging (blue=negative, white=zero, red=positive)
 * - Absolute LE: RdYlGn (red=low/bad, green=high/good)
 * - Absolute CMR/ASMR: OrRd (light=low/good, red=high/bad)
 */
export function createRankingColorScale(
  values: number[],
  displayMode: 'absolute' | 'relative',
  metricType: 'cmr' | 'asmr' | 'le',
  isDark?: boolean
): (value: number) => { bg: string, text: string } {
  // Filter out invalid values
  const validValues = values.filter(v =>
    v !== undefined
    && v !== null
    && !isNaN(v)
    && v !== Number.MIN_SAFE_INTEGER
  )

  const darkMode = resolveDarkMode(isDark)

  if (validValues.length === 0) {
    return () => ({ bg: 'transparent', text: darkMode ? '#ffffff' : '#111111' })
  }

  // Determine palette and domain based on display mode and metric type
  let palette: string[]
  let domain: number[]

  if (displayMode === 'relative') {
    // Diverging scale centered on 0: RdBu (reversed so blue=negative, red=positive)
    palette = [...BREWER_PALETTES.RdBu].reverse()
    const maxAbs = Math.max(...validValues.map(Math.abs))
    // Ensure some spread even if all values are near 0
    const spread = maxAbs || 1
    domain = [-spread, 0, spread]
  } else if (metricType === 'le') {
    // Life expectancy: higher is better - RdYlGn (red=low, green=high)
    palette = BREWER_PALETTES.RdYlGn
    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    domain = [min, max]
  } else {
    // CMR/ASMR: higher is worse - OrRd (light=low, red=high)
    palette = BREWER_PALETTES.OrRd
    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    domain = [min, max]
  }

  // Create chroma scale with LAB interpolation for perceptual uniformity
  const scale = chroma.scale(palette).domain(domain).mode('lab')

  return (value: number) => {
    if (value === undefined || value === null || isNaN(value) || value === Number.MIN_SAFE_INTEGER) {
      return { bg: 'transparent', text: darkMode ? '#ffffff' : '#111111' }
    }

    let bgColor = scale(value).hex()

    // Adjust for dark mode using the same logic as toDarkTheme
    if (darkMode) {
      bgColor = toDarkTheme(bgColor)
    }

    // Determine text color based on background luminance for readability
    const luminance = chroma(bgColor).luminance()
    const textColor = luminance > 0.35 ? '#111111' : '#ffffff'

    return { bg: bgColor, text: textColor }
  }
}
