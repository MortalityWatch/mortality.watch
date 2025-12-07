export const getFont = (
  size: number,
  weight: number | 'normal' | 'bold' | 'lighter' | 'bolder' = 'normal',
  scale: number = 1
): {
  size: number
  weight: number | 'normal' | 'bold' | 'lighter' | 'bolder'
} => ({
  size: size * scale,
  weight
})

export const getTitleFont = () => getFont(20, 'bold')
export const getSubtitleFont = () => getFont(14, 'normal')
export const getLegendFont = () => getFont(12, 'bold')
export const getTicksFont = () => getFont(12)
export const getScaleTitleFont = () => getFont(12, 'bold')
export const getDatalabelsFont = () => getFont(10, 'bold')
