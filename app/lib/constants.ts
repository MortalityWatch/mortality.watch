/**
 * Application-wide constants
 */

import { getWindow } from './utils/dom'

/**
 * Default baseline year for mortality data comparisons
 * For yearly charts: 2017, 2018, 2019
 * For fluseason/midyear charts: 2016/17, 2017/18, 2018/19 (starts at 2016)
 */
export const DEFAULT_BASELINE_YEAR = 2017

/**
 * Get baseline year based on chart type
 * Returns the appropriate baseline start year for different chart types
 */
export function getBaselineYear(chartType: string): number {
  // Fluseason and midyear use split-year periods (e.g., 2016/17)
  // To get pre-pandemic baseline (avoiding 2019/20, 2020/21), start at 2016
  if (chartType === 'fluseason' || chartType === 'midyear') {
    return 2016
  }
  // Yearly and all other types use 2017
  return DEFAULT_BASELINE_YEAR
}

/**
 * Viewport breakpoints for responsive design
 * Matches Tailwind CSS breakpoints
 */
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  XL: 1280
} as const

/**
 * Check if current viewport is mobile
 */
export const isMobile = () => {
  const win = getWindow()
  if (!win) return false
  return win.innerWidth < BREAKPOINTS.MOBILE
}

/**
 * Check if current viewport is tablet or larger
 */
export const isTablet = () => {
  const win = getWindow()
  if (!win) return false
  return win.innerWidth >= BREAKPOINTS.TABLET
}

/**
 * Check if current viewport is desktop or larger
 */
export const isDesktop = () => {
  const win = getWindow()
  if (!win) return false
  return win.innerWidth >= BREAKPOINTS.DESKTOP
}

/**
 * Chart resizing configuration
 */
export const CHART_RESIZE = {
  MIN_WIDTH: 400,
  MIN_HEIGHT: 300,
  SIZE_LABEL_TIMEOUT: 2000
} as const

/**
 * Preset chart sizes for snap-to-size feature
 */
export interface ChartPreset {
  name: string
  width: number
  height: number
  category: string
}

export const CHART_PRESETS: ChartPreset[] = [
  // Default - Responsive sizing
  { name: 'Auto', width: 0, height: 0, category: 'Default' },

  // Custom - User-resizable
  { name: 'Custom', width: -1, height: -1, category: 'Default' },

  // Standard Chart Sizes
  { name: 'Small (800×600)', width: 800, height: 600, category: 'Standard' },
  { name: 'Medium (1000×625)', width: 1000, height: 625, category: 'Standard' },
  { name: 'Large (1280×720)', width: 1280, height: 720, category: 'Standard' },
  { name: 'X-Large (1920×1080)', width: 1920, height: 1080, category: 'Standard' },

  // Social Media (output dimensions - displayed scaled by devicePixelRatio)
  { name: 'Twitter/X', width: 1200, height: 675, category: 'Social Media' },
  { name: 'Facebook', width: 1200, height: 630, category: 'Social Media' },
  { name: 'Instagram Square', width: 1080, height: 1080, category: 'Social Media' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social Media' },
  { name: 'LinkedIn', width: 1200, height: 628, category: 'Social Media' },

  // Presentation
  { name: 'Slide 16:9 (1600×900)', width: 1600, height: 900, category: 'Presentation' },
  { name: 'Slide 4:3 (1024×768)', width: 1024, height: 768, category: 'Presentation' },

  // Specialized
  { name: 'Wide Banner (1400×600)', width: 1400, height: 600, category: 'Specialized' },
  { name: 'Compact (600×400)', width: 600, height: 400, category: 'Specialized' },
  { name: 'Square (800×800)', width: 800, height: 800, category: 'Specialized' },
  { name: 'Portrait (800×1200)', width: 800, height: 1200, category: 'Specialized' }
]
