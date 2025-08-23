import chroma from 'chroma-js'

let currentThemeIsDark = false

export const setDarkTheme = (value: boolean) => {
  currentThemeIsDark = value
}

export const textColor = (light = !currentThemeIsDark) =>
  light ? '#25304a' : '#dddfe6'

export const textSoftColor = () => (!currentThemeIsDark ? '#434a5d' : '#b9bbc3')

export const textStrongColor = () =>
  !currentThemeIsDark ? '#4a4a4a' : '#bbbbbb'

export const isLightColor = (color: string) =>
  hexToHsl(color)[2] >= (!currentThemeIsDark ? 0.3 : 0.7)

export const borderColor = () => (!currentThemeIsDark ? '#e0e6fb' : '#2a3041')

export const backgroundColor = () =>
  !currentThemeIsDark ? '#ffffff' : '#202020'

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
  return palette[index]
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
const color_scale_pop_dark = [
  '#111520',
  '#132036',
  '#152b4d',
  '#173663',
  '#1a427a',
  '#1c4d90',
  '#1e58a6',
  '#2063bd',
  '#226ed3'
]
export const color_scale_pop = () =>
  !currentThemeIsDark ? color_scale_pop_light : color_scale_pop_dark

export const getColorScale = (colors: string[], count: number) =>
  chroma.scale(colors).mode('rgb').colors(count)

export const color_scale_bad_good = () =>
  !currentThemeIsDark ? color_scale_bad_good_light : color_scale_bad_good_dark

const color_scale_bad_good_light = getColorScale(['#ff5393', '#5dac20'], 9)
const color_scale_bad_good_dark = getColorScale(['#d4206e', '#3b641b'], 9)

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
  !currentThemeIsDark ? color_scale_diverging_light : color_scale_diverging_dark

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
  !currentThemeIsDark ? color_scale_light : color_scale_dark
