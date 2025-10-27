import chroma from 'chroma-js'
import { toDarkTheme } from '../colorTransform'
import { getIsDark } from '~/composables/useTheme'

// Helper function to safely get dark theme state
// Returns boolean value for use in non-reactive contexts
export const getIsDarkTheme = () => {
  const value = getIsDark()
  console.log('[chartColors.ts] getIsDarkTheme():', value)
  return value
}

export const textColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDarkTheme()
  return dark ? '#ffffff' : '#25304a'
}

export const textSoftColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDarkTheme()
  return dark ? '#9ca3af' : '#6b7280' // light gray in dark mode, dark gray in light mode
}

export const textStrongColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDarkTheme()
  return dark ? '#ffffff' : '#000000'
}

export const isLightColor = (color: string) => {
  const hsl = hexToHsl(color)
  return (hsl[2] || 0) >= (!getIsDarkTheme() ? 0.3 : 0.7)
}

export const borderColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDarkTheme()
  return dark ? '#2a3041' : '#e0e6fb'
}

export const backgroundColor = (isDark?: boolean) => {
  const dark = isDark !== undefined ? isDark : getIsDarkTheme()
  return dark ? '#111827' : '#ffffff'
}

export const getColorPalette = (
  isPopulationType: boolean,
  isLifeExpectancyType: boolean,
  isExcess: boolean
) => {
  if (isPopulationType) return color_scale_pop()
  if (isLifeExpectancyType) return color_scale_bad_good()
  if (isExcess) return color_scale_diverging()
  else return color_scale()
}

export const getGradientColor = (
  palette: string[],
  percent: number
): string => {
  const index = Math.round(percent * (palette.length - 1))
  return palette[index] || palette[0] || ''
}

const hexToHsl = (color: string): number[] => {
  let r = parseInt(color.substring(1, 2), 16)
  let g = parseInt(color.substring(3, 2), 16)
  let b = parseInt(color.substring(5, 2), 16)
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h
  let s
  const l = (max + min) / 2

  if (max == min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
      default:
        throw new Error('h undefined')
    }
    h /= 6
  }
  return [h, s, l]
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
export const color_scale_pop = () => {
  const isDark = getIsDarkTheme()
  return isDark ? color_scale_pop_light.map(toDarkTheme) : color_scale_pop_light
}

export const getColorScale = (colors: string[], count: number) =>
  chroma.scale(colors).mode('rgb').colors(count)

// Life expectancy scale (bad red to good green)
const color_scale_bad_good_light = getColorScale(['#ff5393', '#5dac20'], 9)

export const color_scale_bad_good = () => {
  const isDark = getIsDarkTheme()
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
export const color_scale_diverging = () => {
  const isDark = getIsDarkTheme()
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
export const color_scale = () => {
  const isDark = getIsDarkTheme()
  return isDark ? color_scale_light.map(toDarkTheme) : color_scale_light
}
