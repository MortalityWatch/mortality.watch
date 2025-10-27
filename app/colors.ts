import chroma from 'chroma-js'
import type { DatasetRaw } from './model'
import { toDarkTheme } from './lib/colorTransform'
import { getIsDark } from './composables/useTheme'

// Helper function to safely get dark theme state
// Returns boolean value for use in non-reactive contexts
const getIsDarkTheme = () => {
  const value = getIsDark()
  console.log('[colors.ts] getIsDarkTheme():', value)
  return value
}

export const isLightColor = (color: string) => {
  const hsl = hexToHsl(color)
  return (hsl[2] || 0) >= (!getIsDarkTheme() ? 0.3 : 0.7)
}

export const getColorPalette = (count: number) =>
  chroma
    .scale((!getIsDarkTheme() ? colors : colors_dark).slice(0, count))
    .mode('rgb')
    .colors(count)

// do not pass in dataset
export const getColorsForDataset = (dataset: DatasetRaw): string[] => {
  const ags = Object.keys(dataset)
  const totalCombinations = ags.reduce(
    (acc, ag) => acc + Object.keys(dataset[ag] || {}).length,
    0
  )
  return getColorPalette(totalCombinations)
}

export const backgroundColor = () =>
  !getIsDarkTheme() ? '#ffffff' : '#202020'
export const textColor = (light = !getIsDarkTheme()) =>
  light ? '#25304a' : '#ffffff'
export const textSoftColor = () => (!getIsDarkTheme() ? '#434a5d' : '#ffffff')
export const textStrongColor = () =>
  !getIsDarkTheme() ? '#4a4a4a' : '#ffffff'
export const borderColor = () => (!getIsDarkTheme() ? '#e0e6fb' : '#2a3041')
export const grayColor = () => (!getIsDarkTheme() ? '#f8f9fe' : '#22242b')

export const specialColor = () => (!getIsDarkTheme() ? '#1a82fb' : '#5189ec')
export const greenColor = () => (!getIsDarkTheme() ? '#44781d' : '#5f8b3e')

// Main chart colors (light theme - defined manually)
export const colors = [
  '#ff5393',
  '#5dac20',
  '#5992fc',
  '#ffa243',
  '#ff56f5',
  '#23b9d3',
  '#bad31f'
]

// Function to get colors based on current theme
// Dark colors are computed on-demand to ensure reactivity
export const getChartColors = () => {
  const isDark = getIsDarkTheme()
  return isDark ? colors.map(toDarkTheme) : colors
}

// Legacy export for backwards compatibility (not reactive)
export const colors_dark = colors.map(toDarkTheme)

// Sequential red scale (for heatmaps)
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

// Diverging blue-to-red scale (for heatmaps with positive/negative values)
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
