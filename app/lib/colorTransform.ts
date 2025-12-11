/**
 * Color transformation utilities
 * Replaces polished dependency with inline implementations
 */

// ============================================================================
// Color Parsing/Formatting (inlined from polished)
// ============================================================================

interface RgbColor {
  red: number
  green: number
  blue: number
}

export interface HslColor {
  hue: number
  saturation: number
  lightness: number
}

/**
 * Parse hex color to RGB values
 */
function parseToRgb(color: string): RgbColor {
  const hex = color.replace('#', '')
  const fullHex = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex

  return {
    red: parseInt(fullHex.substring(0, 2), 16),
    green: parseInt(fullHex.substring(2, 4), 16),
    blue: parseInt(fullHex.substring(4, 6), 16)
  }
}

/**
 * Convert RGB values to hex color string
 */
function rgbToHex(red: number, green: number, blue: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0')
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

/**
 * Parse hex color to HSL values
 */
export function parseToHsl(color: string): HslColor {
  const { red, green, blue } = parseToRgb(color)
  const r = red / 255
  const g = green / 255
  const b = blue / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2

  if (max === min) {
    return { hue: 0, saturation: 0, lightness }
  }

  const d = max - min
  const saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min)

  let hue: number
  switch (max) {
    case r:
      hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      hue = ((b - r) / d + 2) / 6
      break
    default:
      hue = ((r - g) / d + 4) / 6
  }

  return { hue, saturation, lightness }
}

/**
 * Convert HSL values to hex color string
 */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  if (saturation === 0) {
    const gray = Math.round(lightness * 255)
    return rgbToHex(gray, gray, gray)
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q

  const r = hueToRgb(p, q, hue + 1 / 3)
  const g = hueToRgb(p, q, hue)
  const b = hueToRgb(p, q, hue - 1 / 3)

  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
}

// ============================================================================
// Dark Theme Transformation
// ============================================================================

/**
 * Automatically converts a light theme color to its dark theme equivalent.
 * This preserves hue and saturation for chromatic colors while adjusting lightness
 * for optimal visibility on dark backgrounds.
 */
export const toDarkTheme = (color: string): string => {
  const { red, green, blue } = parseToRgb(color)

  // Check if grayscale (all RGB values equal)
  if (red === green && green === blue) {
    // Always invert pure black and white
    if (red === 0 || red === 255) {
      return rgbToHex(255 - red, 255 - green, 255 - blue)
    }

    // For other grays, ensure good contrast
    if (red > 128) {
      return rgbToHex(
        Math.max(64, 255 - red),
        Math.max(64, 255 - red),
        Math.max(64, 255 - red)
      )
    }
    return rgbToHex(
      Math.min(192, 255 - red),
      Math.min(192, 255 - red),
      Math.min(192, 255 - red)
    )
  }

  // For chromatic colors, adjust lightness while preserving hue and saturation
  const { hue, saturation, lightness } = parseToHsl(color)
  const newLightness
    = lightness > 0.5
      ? Math.max(0.3, 1 - lightness) // Light colors: invert but keep at least 30% lightness
      : Math.min(0.7, lightness + 0.4) // Dark colors: add 40% but cap at 70% lightness

  return hslToHex(hue, saturation, newLightness)
}
