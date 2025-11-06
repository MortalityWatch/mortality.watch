/**
 * Configuration Constants
 *
 * Single source of truth for all configuration values used throughout the codebase.
 */

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
  METADATA_CACHE_TTL: 24 * 60 * 60 * 1000
} as const

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
   */
  MIN_CHART_WIDTH: 400,

  /**
   * Minimum chart height (pixels)
   * Ensures charts remain readable at small sizes
   */
  MIN_CHART_HEIGHT: 300,

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
  RETRY_DELAY: 1000
} as const

/**
 * Type exports for better TypeScript support
 */
export type DataConfig = typeof DATA_CONFIG
export type CacheConfig = typeof CACHE_CONFIG
export type CssClasses = typeof CSS_CLASSES
export type UiConfig = typeof UI_CONFIG
