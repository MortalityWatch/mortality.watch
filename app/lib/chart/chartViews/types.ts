/**
 * Chart View Types
 *
 * Type definitions for chart view configuration system
 */

import type { ViewType } from '../../state'

/**
 * Chart state passed to title/subtitle generators
 */
export interface ChartContext {
  // Data selection
  countries: string[]
  type: string // 'deaths', 'cmr', 'asmr', etc.
  ageGroups: string[]
  standardPopulation: string

  // Display options
  cumulative: boolean
  showBaseline: boolean
  showPredictionInterval: boolean
  showTotal: boolean
  chartType: string
  leAdjusted?: boolean // LE seasonal adjustment (STL trend extraction)

  // Baseline
  baselineMethod: string
  baselineDateFrom: string
  baselineDateTo: string

  // View
  view: ViewType
}

/**
 * Annotation/Reference line configuration
 * Supports both lines and box (shaded area) annotations
 */
export interface ReferenceLineConfig {
  type?: 'line' | 'box' // Annotation type (default: 'line')
  drawTime?: 'beforeDraw' | 'beforeDatasetsDraw' | 'afterDatasetsDraw' | 'afterDraw' // When to draw
  value?: number // Y-axis value (for lines)
  yMin?: number // Min Y value (for boxes)
  yMax?: number // Max Y value (for boxes)
  label: string // Display text (e.g., '0σ', '+2σ')
  color?: string // Line/border color
  backgroundColor?: string // Fill color (for boxes)
  borderWidth?: number // Border width (for boxes, 0 = no border)
  style?: 'solid' | 'dashed' // Line style
  width?: number // Line width (default: 1)
  z?: number // Z-index for layering (-1 = behind data)
  dark?: { // Optional dark mode overrides
    color?: string
  }
}

/**
 * Chart view configuration
 * All methods are optional to support inheritance
 */
export interface ChartViewConfig {
  /**
   * Generate chart title parts
   * Returns array of title parts to be joined
   */
  getTitleParts?: (ctx: ChartContext) => string[]

  /**
   * Generate subtitle (optional)
   * Returns subtitle string or null
   */
  getSubtitle?: (ctx: ChartContext) => string | null

  /**
   * Y-axis label
   * Can be string or function for dynamic labels
   */
  yAxisLabel?: string | ((ctx: ChartContext) => string)

  /**
   * X-axis label (optional)
   * Usually determined by chart type, but can be overridden
   */
  xAxisLabel?: string | ((ctx: ChartContext) => string)

  /**
   * Reference lines / annotations
   * Function allows dynamic annotations based on data
   */
  referenceLines?: (ctx: ChartContext, isDark: boolean) => ReferenceLineConfig[]
}

/**
 * Complete chart view config with all required methods
 */
export interface CompleteChartViewConfig {
  getTitleParts: (ctx: ChartContext) => string[]
  getSubtitle: (ctx: ChartContext) => string | null
  yAxisLabel: string | ((ctx: ChartContext) => string)
  xAxisLabel?: string | ((ctx: ChartContext) => string)
  referenceLines: (ctx: ChartContext, isDark: boolean) => ReferenceLineConfig[]
}
