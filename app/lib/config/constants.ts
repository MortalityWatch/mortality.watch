/**
 * Configuration Constants
 *
 * Phase 1: Centralized configuration to eliminate magic numbers and strings
 *
 * This file consolidates all hardcoded values that appear throughout the codebase
 * into a single source of truth, making them easier to maintain and modify.
 */

/**
 * Data-related configuration constants
 */
export const DATA_CONFIG = {
  /**
   * Start year for ranking data analysis
   * Used in useRankingData composable for date range calculations
   */
  RANKING_START_YEAR: 2020,

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
   * Reserved for future Phase 2 metadata caching implementation
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
 * Type exports for better TypeScript support
 */
export type DataConfig = typeof DATA_CONFIG
export type CacheConfig = typeof CACHE_CONFIG
export type CssClasses = typeof CSS_CLASSES
