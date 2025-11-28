/**
 * Centralized Chart Configuration System
 *
 * This file defines all UI behavior rules based on metric type, period type,
 * chart style, and excess mode. Instead of scattered if-statements throughout
 * components, all configuration logic is centralized here.
 */

import type { ChartStyle } from '@/lib/chart/chartTypes'

// ============================================================================
// 1. BASE CONFIGURATIONS (individual entities)
// ============================================================================

export interface MetricConfig {
  value: string
  name: string
  // Data Requirements
  requiresAgeStratified: boolean
  showAgeGroups: boolean

  // UI Elements
  showStandardPopulation: boolean

  // Features
  supportsExcess: boolean
  supportsBaseline: boolean
  supportsLogarithmic: boolean
  supportsMaximize: boolean

  // Chart Styles
  supportedChartStyles: ChartStyle[]
  defaultChartStyle: ChartStyle
}

export interface PeriodConfig {
  value: string
  name: string
  granularity: 'high' | 'medium' | 'low' // weekly/monthly = high, quarterly = medium, yearly = low

  // Features
  supportsCumulative: boolean
  supportsMatrix: boolean

  // Baseline Methods
  supportedBaselineMethods: string[] // Some periods might not support all methods
  defaultBaselineMethod: string

  // Special Behaviors
  requiresMinBaselineSpan?: number // e.g., yearly might need 3+ years
}

export interface ChartStyleConfig {
  value: ChartStyle
  name: string

  // Disables
  disablesMaximize: boolean
  disablesBaseline: boolean
  disablesPredictionInterval: boolean
  disablesLogarithmic: boolean

  // Enables (when other conditions met)
  enablesShowTotal: boolean // for bar + excess
}

export interface ExcessModeConfig {
  // What excess mode enables
  showsCumulativeOption: boolean
  showsPercentageOption: boolean
  showsTotalOption: boolean // only if bar chart

  // What it disables
  hidesBaseline: boolean
  hidesLogarithmic: boolean
}

// ============================================================================
// 2. CONFIGURATION DATA
// ============================================================================

export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  cmr: {
    value: 'cmr',
    name: 'Crude Mortality Rate',
    requiresAgeStratified: false,
    showAgeGroups: true,
    showStandardPopulation: false,
    supportsExcess: true,
    supportsBaseline: true,
    supportsLogarithmic: true,
    supportsMaximize: true,
    supportedChartStyles: ['line', 'bar', 'matrix'],
    defaultChartStyle: 'line'
  },
  asmr: {
    value: 'asmr',
    name: 'Age-Standardized Mortality Rate',
    requiresAgeStratified: true,
    showAgeGroups: false,
    showStandardPopulation: true, // ✅ ONLY ASMR
    supportsExcess: true,
    supportsBaseline: true,
    supportsLogarithmic: true,
    supportsMaximize: true,
    supportedChartStyles: ['line', 'bar', 'matrix'],
    defaultChartStyle: 'line'
  },
  le: {
    value: 'le',
    name: 'Life Expectancy',
    requiresAgeStratified: true,
    showAgeGroups: false,
    showStandardPopulation: false, // ❌ NOT for LE
    supportsExcess: false,
    supportsBaseline: true,
    supportsLogarithmic: false,
    supportsMaximize: true,
    supportedChartStyles: ['line'],
    defaultChartStyle: 'line'
  },
  deaths: {
    value: 'deaths',
    name: 'Deaths',
    requiresAgeStratified: false,
    showAgeGroups: true,
    showStandardPopulation: false,
    supportsExcess: true,
    supportsBaseline: true,
    supportsLogarithmic: true,
    supportsMaximize: true,
    supportedChartStyles: ['line', 'bar'],
    defaultChartStyle: 'line'
  },
  population: {
    value: 'population',
    name: 'Population',
    requiresAgeStratified: false,
    showAgeGroups: true,
    showStandardPopulation: false,
    supportsExcess: false,
    supportsBaseline: false,
    supportsLogarithmic: true,
    supportsMaximize: true,
    supportedChartStyles: ['line', 'bar'],
    defaultChartStyle: 'line'
  }
}

export const PERIOD_CONFIGS: Record<string, PeriodConfig> = {
  weekly: {
    value: 'weekly',
    name: 'Weekly',
    granularity: 'high',
    supportsCumulative: true,
    supportsMatrix: true,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  },
  monthly: {
    value: 'monthly',
    name: 'Monthly',
    granularity: 'high',
    supportsCumulative: true,
    supportsMatrix: true,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  },
  quarterly: {
    value: 'quarterly',
    name: 'Quarterly',
    granularity: 'medium',
    supportsCumulative: true,
    supportsMatrix: false,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  },
  yearly: {
    value: 'yearly',
    name: 'Yearly',
    granularity: 'low',
    supportsCumulative: true,
    supportsMatrix: false,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg', 'exp'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  },
  fluseason: {
    value: 'fluseason',
    name: 'Flu Season',
    granularity: 'low',
    supportsCumulative: true,
    supportsMatrix: false,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg', 'exp'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  },
  midyear: {
    value: 'midyear',
    name: 'Midyear',
    granularity: 'low',
    supportsCumulative: true,
    supportsMatrix: false,
    supportedBaselineMethods: ['naive', 'mean', 'median', 'lin_reg', 'exp'],
    defaultBaselineMethod: 'mean',
    requiresMinBaselineSpan: 3
  }
}

export const CHART_STYLE_CONFIGS: Record<ChartStyle, ChartStyleConfig> = {
  line: {
    value: 'line',
    name: 'Line',
    disablesMaximize: false,
    disablesBaseline: false,
    disablesPredictionInterval: false,
    disablesLogarithmic: false,
    enablesShowTotal: false
  },
  bar: {
    value: 'bar',
    name: 'Bar',
    disablesMaximize: false,
    disablesBaseline: false,
    disablesPredictionInterval: false,
    disablesLogarithmic: false,
    enablesShowTotal: true // only when excess mode
  },
  matrix: {
    value: 'matrix',
    name: 'Matrix',
    disablesMaximize: true,
    disablesBaseline: true,
    disablesPredictionInterval: true,
    disablesLogarithmic: true,
    enablesShowTotal: false
  }
}

export const EXCESS_MODE_CONFIG: ExcessModeConfig = {
  showsCumulativeOption: true,
  showsPercentageOption: true,
  showsTotalOption: true, // only if bar chart
  hidesBaseline: true,
  hidesLogarithmic: true
}

// ============================================================================
// 3. DERIVED CONFIGURATION (computed from combinations)
// ============================================================================

export interface ChartUIState {
  // Visibility
  showStandardPopulation: boolean
  showAgeGroups: boolean
  showBaselineOption: boolean
  showBaselineMethodSelector: boolean
  showPredictionIntervalOption: boolean
  showMaximizeOption: boolean
  showLogarithmicOption: boolean
  showCumulativeOption: boolean
  showPercentageOption: boolean
  showTotalOption: boolean
  showLabelsOption: boolean

  // Disabled States
  maximizeDisabled: boolean
  predictionIntervalDisabled: boolean
  totalDisabled: boolean

  // Other
  maxCountriesAllowed: number | undefined
  availableBaselineMethods: string[]
  availableChartStyles: ChartStyle[]
}

export function computeChartUIState(
  type: string,
  chartType: string,
  chartStyle: ChartStyle,
  isExcess: boolean,
  standardPopulation: string,
  countriesCount: number,
  showBaseline: boolean,
  cumulative: boolean,
  baselineMethod: string,
  isYearlyType: boolean
): ChartUIState {
  const metricConfig = METRIC_CONFIGS[type] ?? METRIC_CONFIGS.cmr!
  const periodConfig = PERIOD_CONFIGS[chartType] ?? PERIOD_CONFIGS.yearly!
  const styleConfig = CHART_STYLE_CONFIGS[chartStyle] ?? CHART_STYLE_CONFIGS.line!

  const isPopulationType = type === 'population'
  const isMatrixStyle = chartStyle === 'matrix'
  const isBarStyle = chartStyle === 'bar'
  const isLineStyle = chartStyle === 'line'

  // Compute cumulative prediction interval support
  const showCumPi = cumulative
    && isYearlyType
    && ['lin_reg', 'mean'].includes(baselineMethod)

  return {
    // Visibility
    showStandardPopulation: metricConfig.showStandardPopulation,
    showAgeGroups: metricConfig.showAgeGroups && !metricConfig.requiresAgeStratified,

    showBaselineOption: !isPopulationType && !isExcess && !isMatrixStyle,
    showBaselineMethodSelector: showBaseline && metricConfig.supportsBaseline,

    showPredictionIntervalOption:
      (metricConfig.supportsBaseline && !isExcess && !isMatrixStyle)
      || (isExcess && !isMatrixStyle),

    showMaximizeOption:
      metricConfig.supportsMaximize
      && !styleConfig.disablesMaximize
      && !(isExcess && isLineStyle),

    showLogarithmicOption:
      metricConfig.supportsLogarithmic
      && !styleConfig.disablesLogarithmic
      && !isMatrixStyle,

    showCumulativeOption: isExcess && metricConfig.supportsExcess,
    showPercentageOption: isExcess && metricConfig.supportsExcess,
    showTotalOption: isExcess && isBarStyle && styleConfig.enablesShowTotal,
    showLabelsOption: true, // Always available

    // Disabled States
    maximizeDisabled:
      !metricConfig.supportsLogarithmic // logarithmic disables maximize
      || (isExcess && !isBarStyle), // excess line chart disables maximize

    predictionIntervalDisabled:
      (!isExcess && !showBaseline)
      || (cumulative && !showCumPi),

    totalDisabled: !cumulative,

    // Other
    maxCountriesAllowed:
      type.includes('asmr')
      && standardPopulation === 'country'
      && countriesCount > 1
        ? 1
        : undefined,

    availableBaselineMethods: periodConfig.supportedBaselineMethods,
    availableChartStyles: metricConfig.supportedChartStyles
  }
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

export function getMetricConfig(type: string): MetricConfig {
  return METRIC_CONFIGS[type] ?? METRIC_CONFIGS.cmr!
}

export function getPeriodConfig(chartType: string): PeriodConfig {
  return PERIOD_CONFIGS[chartType] ?? PERIOD_CONFIGS.yearly!
}

export function getChartStyleConfig(chartStyle: ChartStyle): ChartStyleConfig {
  return CHART_STYLE_CONFIGS[chartStyle] ?? CHART_STYLE_CONFIGS.line!
}
