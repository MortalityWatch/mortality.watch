import chroma from 'chroma-js'
import { toDarkTheme, parseToHsl } from '../colorTransform'
import { getIsDark } from '@/composables/useTheme'

export const textColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDark()
  return dark ? '#ffffff' : '#25304a'
}

export const textSoftColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDark()
  return dark ? '#9ca3af' : '#6b7280' // light gray in dark mode, dark gray in light mode
}

export const textStrongColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDark()
  return dark ? '#ffffff' : '#000000'
}

export const isLightColor = (color: string) => {
  const hsl = parseToHsl(color)
  return hsl.lightness >= (!getIsDark() ? 0.3 : 0.7)
}

export const borderColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDark()
  return dark ? '#2a3041' : '#e0e6fb'
}

export const backgroundColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDark()
  // Dark mode: #111827 (gray-900, must match SSR chartRenderer.ts and useExplorerChartActions.ts)
  return dark ? '#111827' : '#ffffff'
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
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return isDark ? color_scale_pop_light.map(toDarkTheme) : color_scale_pop_light
}

export const getColorScale = (colors: string[], count: number) =>
  chroma.scale(colors).mode('rgb').colors(count)

// Life expectancy scale (bad red to good green)
const color_scale_bad_good_light = getColorScale(['#ff5393', '#5dac20'], 9)

export const color_scale_bad_good = (isDarkOverride?: boolean) => {
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return isDark ? color_scale_bad_good_light.map(toDarkTheme) : color_scale_bad_good_light
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
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return isDark ? color_scale_diverging_light.map(toDarkTheme) : color_scale_diverging_light
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
  const isDark = isDarkOverride !== undefined ? isDarkOverride : getIsDark()
  return isDark ? color_scale_light.map(toDarkTheme) : color_scale_light
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

// CSS class names for diverging color scale (used in ranking table)
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
