import chroma from 'chroma-js'
import type { DatasetRaw } from './model'
import { isDarkTheme } from './composables/darkTheme'

export const isLightColor = (color: string) =>
  hexToHsl(color)[2] >= (!isDarkTheme.value ? 0.3 : 0.7)

export const getColorPalette = (count: number) =>
  chroma
    .scale((!isDarkTheme.value ? colors : colors_dark).slice(0, count))
    .mode('rgb')
    .colors(count)

// do not pass in dataset
export const getColorsForDataset = (dataset: DatasetRaw): string[] => {
  const ags = Object.keys(dataset)
  const totalCombinations = ags.reduce(
    (acc, ag) => acc + Object.keys(dataset[ag]).length,
    0
  )
  return getColorPalette(totalCombinations)
}

export const backgroundColor = () =>
  !isDarkTheme.value ? '#ffffff' : '#202020'
export const textColor = (light = !isDarkTheme.value) =>
  light ? '#25304a' : '#dddfe6'
export const textSoftColor = () => (!isDarkTheme.value ? '#434a5d' : '#b9bbc3')
export const textStrongColor = () =>
  !isDarkTheme.value ? '#4a4a4a' : '#bbbbbb'
export const borderColor = () => (!isDarkTheme.value ? '#e0e6fb' : '#2a3041')
export const grayColor = () => (!isDarkTheme.value ? '#f8f9fe' : '#22242b')

export const specialColor = () => (!isDarkTheme.value ? '#1a82fb' : '#5189ec')
export const greenColor = () => (!isDarkTheme.value ? '#44781d' : '#5f8b3e')

export const colors = [
  '#ff5393',
  '#5dac20',
  '#5992fc',
  '#ffa243',
  '#ff56f5',
  '#23b9d3',
  '#bad31f'
]
export const colors_dark = [
  '#d4206e',
  '#3b641b',
  '#226ed3',
  '#895219',
  '#882283',
  '#257787',
  '#5a641c'
]

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
const color_scale_dark = [
  '#230f09',
  '#39110d',
  '#4f1310',
  '#651514',
  '#7c1818',
  '#921a1b',
  '#a81c1f',
  '#be1e22',
  '#d42026'
]
export const color_scale = () =>
  !isDarkTheme.value ? color_scale_light : color_scale_dark

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

const color_scale_diverging_dark = [
  '#226ed3',
  '#1e58a6',
  '#1a427a',
  '#152b4d',
  '#111520',
  '#4f1310',
  '#7c1818',
  '#a81c1f',
  '#d42026'
]
export const color_scale_diverging = () =>
  !isDarkTheme.value ? color_scale_diverging_light : color_scale_diverging_dark

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
