import chroma from 'chroma-js'
import type { DatasetRaw } from './model'
import { toDarkTheme } from './lib/colorTransform'
import { getIsDark } from './composables/useTheme'

// Helper function to safely get dark theme state
const getIsDarkTheme = () => getIsDark()

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

export const getColorPalette = (count: number) =>
  chroma
    .scale(getChartColors().slice(0, count))
    .mode('rgb')
    .colors(count)

export const getColorsForDataset = (dataset: DatasetRaw): string[] => {
  const ags = Object.keys(dataset)
  const totalCombinations = ags.reduce(
    (acc, ag) => acc + Object.keys(dataset[ag] || {}).length,
    0
  )
  return getColorPalette(totalCombinations)
}

// Special UI colors
export const specialColor = () => (!getIsDarkTheme() ? '#1a82fb' : '#5189ec')
export const greenColor = () => (!getIsDarkTheme() ? '#44781d' : '#5f8b3e')

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
