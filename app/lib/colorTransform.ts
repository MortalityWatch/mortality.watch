import { parseToRgb, rgb, parseToHsl, hsl } from 'polished'

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
      return rgb(255 - red, 255 - green, 255 - blue)
    }

    // For other grays, ensure good contrast
    if (red > 128) {
      return rgb(
        Math.max(64, 255 - red),
        Math.max(64, 255 - red),
        Math.max(64, 255 - red)
      )
    }
    return rgb(
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

  return hsl(hue, saturation, newLightness)
}
