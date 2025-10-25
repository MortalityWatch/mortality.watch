/**
 * Application-wide constants
 */

/**
 * Default baseline year for mortality data comparisons
 */
export const DEFAULT_BASELINE_YEAR = 2017

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

  // Social Media Ready
  { name: 'Twitter/X (1200×675)', width: 1200, height: 675, category: 'Social Media' },
  { name: 'Facebook (1200×630)', width: 1200, height: 630, category: 'Social Media' },
  { name: 'Instagram Square (1080×1080)', width: 1080, height: 1080, category: 'Social Media' },
  { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920, category: 'Social Media' },
  { name: 'LinkedIn (1200×627)', width: 1200, height: 627, category: 'Social Media' },

  // Presentation
  { name: 'Slide 16:9 (1600×900)', width: 1600, height: 900, category: 'Presentation' },
  { name: 'Slide 4:3 (1024×768)', width: 1024, height: 768, category: 'Presentation' },

  // Specialized
  { name: 'Wide Banner (1400×600)', width: 1400, height: 600, category: 'Specialized' },
  { name: 'Compact (600×400)', width: 600, height: 400, category: 'Specialized' },
  { name: 'Square (800×800)', width: 800, height: 800, category: 'Specialized' },
  { name: 'Portrait (800×1200)', width: 800, height: 1200, category: 'Specialized' }
]
