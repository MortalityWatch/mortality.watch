/**
 * Configuration Constants
 *
 * Single source of truth for all configuration values used throughout the codebase.
 */

import { getWindow } from '../utils/dom'

// =============================================================================
// BASELINE CONFIGURATION
// =============================================================================

/**
 * Decimal precision for baseline API data values
 * Prevents floating point artifacts (e.g., 82.15455999999999 -> 82.1546)
 */
export const BASELINE_DATA_PRECISION = 4

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
 * Default slider start year (20 years from current year)
 * This determines how far back the data slider extends by default.
 */
export const DEFAULT_SLIDER_START_YEARS_BACK = 20

/**
 * Get default slider start year
 * Calculated as current year minus DEFAULT_SLIDER_START_YEARS_BACK
 */
export function getDefaultSliderStart(): string {
  const currentYear = new Date().getFullYear()
  return String(currentYear - DEFAULT_SLIDER_START_YEARS_BACK)
}

/**
 * Maximum baseline period limits by seasonality type
 *
 * These limits prevent server timeouts when calculating baselines.
 * The stats API times out with excessively large baseline periods due to:
 * 1. Fitting a seasonal model (52-dummy for weekly, etc.) to many data points
 * 2. Calculating pre-baseline z-scores by forecasting backwards
 *
 * Limits are in data points (not years):
 * - Weekly (s=4): 520 weeks = ~10 years
 * - Monthly (s=3): 180 months = 15 years
 * - Quarterly (s=2): 80 quarters = 20 years
 * - Yearly (s=1): 30 years
 */
export const BASELINE_PERIOD_LIMITS = {
  weekly: 520, // ~10 years of weekly data
  monthly: 180, // 15 years of monthly data
  quarterly: 80, // 20 years of quarterly data
  yearly: 30 // 30 years
} as const

/**
 * Get maximum baseline period in data points for a chart type
 */
export function getMaxBaselinePeriod(chartType: string): number {
  if (chartType.startsWith('weekly')) {
    return BASELINE_PERIOD_LIMITS.weekly
  }
  switch (chartType) {
    case 'monthly':
      return BASELINE_PERIOD_LIMITS.monthly
    case 'quarterly':
      return BASELINE_PERIOD_LIMITS.quarterly
    default:
      return BASELINE_PERIOD_LIMITS.yearly
  }
}

/**
 * Get maximum baseline period in years for a chart type
 */
export function getMaxBaselineYears(chartType: string): number {
  if (chartType.startsWith('weekly')) {
    return 10
  }
  switch (chartType) {
    case 'monthly':
      return 15
    case 'quarterly':
      return 20
    default:
      return 30
  }
}

// =============================================================================
// VIEWPORT & RESPONSIVE DESIGN
// =============================================================================

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

// =============================================================================
// THEME COLORS
// =============================================================================

/**
 * Background colors for light/dark theme
 * Used in chart rendering (client and SSR) to ensure consistency
 */
export const THEME_COLORS = {
  /** Dark mode background color (gray-900) */
  BG_DARK: '#111827',
  /** Light mode background color */
  BG_LIGHT: '#ffffff'
} as const

// =============================================================================
// CHART CONFIGURATION
// =============================================================================

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

/**
 * Chart gallery filter options
 */
export const CHART_FILTERS = {
  /**
   * Sort options for chart galleries
   * Maps to backend API sort parameter values
   */
  SORT_OPTIONS: [
    { label: 'Featured', value: 'featured' },
    { label: 'Most Viewed', value: 'views' },
    { label: 'Newest', value: 'newest' }
  ] as const,

  /**
   * Chart type filter options
   */
  TYPE_OPTIONS: [
    { label: 'All Types', value: null },
    { label: 'Explorer', value: 'explorer' },
    { label: 'Ranking', value: 'ranking' }
  ] as const,

  /**
   * Featured status filter options
   */
  FEATURED_OPTIONS: [
    { label: 'All Charts', value: null },
    { label: 'Featured Only', value: 'true' },
    { label: 'Not Featured', value: 'false' }
  ] as const
} as const

// =============================================================================
// DATA CONFIGURATION
// =============================================================================

/**
 * Data-related configuration constants
 */
export const DATA_CONFIG = {
  /**
   * Start year for ranking data analysis
   * Used in useRankingData composable for date range calculations
   */
  RANKING_START_YEAR: 2010,

  /**
   * End year for ranking data analysis
   * Used in useRankingData composable for date range calculations
   */
  RANKING_END_YEAR: 2023,

  /**
   * Default number of periods to display in charts
   * Used in state.ts for default period selection
   */
  DEFAULT_PERIODS: 30,

  /**
   * Separator string used between country and subregion in labels
   * Format: "Country - Subregion"
   */
  SUBREGION_SEPARATOR: ' - ',

  /**
   * Key identifier for total/aggregate row in tables and datasets
   */
  TOTAL_ROW_KEY: 'TOTAL'
} as const

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * Cache configuration constants
 */
export const CACHE_CONFIG = {
  /**
   * Time-to-live for chart image cache (7 days in milliseconds)
   * Used in server/utils/chartCache.ts
   */
  CHART_CACHE_TTL: 7 * 24 * 60 * 60 * 1000,

  /**
   * Time-to-live for metadata cache (1 day in milliseconds)
   */
  METADATA_CACHE_TTL: 24 * 60 * 60 * 1000,

  /**
   * Default directory for cached mortality data
   * Used by data loader and download scripts
   */
  MORTALITY_DATA_DIR: '.data/cache/mortality'
} as const

// =============================================================================
// EXTERNAL SERVICES
// =============================================================================

/**
 * External service URLs
 */
export const EXTERNAL_SERVICES = {
  /**
   * Statistics API URL for baseline calculations
   * Used by client and server baseline computation
   */
  STATS_API_URL: 'https://stats.mortality.watch/',

  /**
   * Maximum concurrent requests to the stats API
   * Prevents overwhelming the R stats server when many countries are selected
   * Can be overridden via NUXT_BASELINE_MAX_CONCURRENT_REQUESTS env var
   */
  BASELINE_MAX_CONCURRENT_REQUESTS: 10,

  /**
   * Timeout for stats API requests in milliseconds
   * Prevents hanging requests from blocking queue slots forever
   */
  BASELINE_REQUEST_TIMEOUT_MS: 30000
} as const

// =============================================================================
// UI CONFIGURATION
// =============================================================================

/**
 * CSS class name constants
 */
export const CSS_CLASSES = {
  /**
   * CSS class applied to table cells with no available data
   * Used in color scale calculations for N/A values
   */
  COLOR_SCALE_NA: 'color-scale-na'
} as const

/**
 * UI-related configuration constants
 */
export const UI_CONFIG = {
  /**
   * Delay before showing loading overlay (milliseconds)
   * Prevents flashing for quick operations
   * Used in useExplorerDataOrchestration composable
   */
  LOADING_OVERLAY_DELAY: 500,

  /**
   * Delay for input debouncing (milliseconds)
   * Used for search inputs and other real-time interactions
   */
  DEBOUNCE_DELAY: 300,

  /**
   * Duration for toast notifications (milliseconds)
   * How long toast messages are displayed before auto-dismissing
   */
  TOAST_DURATION: 5000,

  /**
   * Default number of items per page in paginated tables
   */
  PAGINATION_DEFAULT: 25,

  /**
   * Available options for items per page in pagination
   */
  PAGINATION_OPTIONS: [10, 25, 50, 100] as const,

  /**
   * Maximum number of countries that can be viewed in explorer
   * Prevents performance issues with too many simultaneous selections
   * Used in useRankingData composable for "View in Explorer" links
   */
  MAX_EXPLORER_COUNTRIES: 20,

  /**
   * Maximum length for chart titles (characters)
   * Ensures titles display properly without overflow
   */
  MAX_CHART_TITLE_LENGTH: 100,

  /**
   * Maximum number of saved charts per user
   * Prevents database bloat and ensures reasonable storage usage
   */
  MAX_SAVED_CHARTS: 100,

  /**
   * Default chart width (pixels)
   * Used for exports and initial rendering
   */
  DEFAULT_CHART_WIDTH: 800,

  /**
   * Default chart height (pixels)
   * Used for exports and initial rendering
   */
  DEFAULT_CHART_HEIGHT: 600,

  /**
   * Minimum chart width (pixels)
   * Ensures charts remain readable at small sizes
   * Note: Same as CHART_RESIZE.MIN_WIDTH for consistency
   */
  MIN_CHART_WIDTH: CHART_RESIZE.MIN_WIDTH,

  /**
   * Minimum chart height (pixels)
   * Ensures charts remain readable at small sizes
   * Note: Same as CHART_RESIZE.MIN_HEIGHT for consistency
   */
  MIN_CHART_HEIGHT: CHART_RESIZE.MIN_HEIGHT,

  /**
   * Duration for UI transitions (milliseconds)
   * CSS transition timing for smooth animations
   */
  TRANSITION_DURATION: 300,

  /**
   * Maximum number of retry attempts for failed operations
   * Used in data fetching and network operations
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Delay between retry attempts (milliseconds)
   * Exponential backoff may apply on top of this base delay
   */
  RETRY_DELAY: 1000,

  /**
   * Number of charts to display per page in gallery/my-charts
   */
  CHARTS_PER_PAGE: 12,

  /**
   * Number of items per page in discover country grids
   */
  DISCOVER_ITEMS_PER_PAGE: 12
} as const

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DataConfig = typeof DATA_CONFIG
export type CacheConfig = typeof CACHE_CONFIG
export type CssClasses = typeof CSS_CLASSES
export type UiConfig = typeof UI_CONFIG
export type ChartFilters = typeof CHART_FILTERS
