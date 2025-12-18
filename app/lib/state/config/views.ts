/**
 * View Configurations
 *
 * Defines all available view types and their UI/constraint configurations
 */

import type { ViewConfig, ViewType, UIElement, UICondition } from '../resolver/viewTypes'
import { getDefaultSliderStart } from '@/lib/config/constants'

/** Helper functions for common UI element patterns */
const hidden = (): UIElement => ({
  visibility: { type: 'hidden' }
})

const toggleable = (): UIElement => ({
  visibility: { type: 'visible', toggleable: true }
})

const required = (value: boolean): UIElement => ({
  visibility: { type: 'visible', toggleable: false, value }
})

const conditional = (when: UICondition): UIElement => ({
  visibility: { type: 'conditional', when }
})

/**
 * View Definitions
 */
export const VIEWS: Record<ViewType, ViewConfig> = {
  /**
   * Mortality View (Default)
   * Standard mortality analysis with optional baseline
   * Contains ALL landing page defaults - this is the single source of truth
   */
  mortality: {
    id: 'mortality',
    label: 'Mortality Analysis',
    urlParam: null, // default, no URL param needed

    ui: {
      baseline: toggleable(),
      predictionInterval: conditional({
        field: 'showBaseline',
        is: true
      }),
      logarithmic: toggleable(),
      maximize: toggleable(),
      labels: toggleable(),
      cumulative: hidden(),
      percentage: hidden(),
      showTotal: hidden()
    },

    defaults: {
      // Core settings
      countries: ['USA', 'SWE'],
      type: 'asmr',
      chartType: 'fluseason',
      chartStyle: 'line',
      ageGroups: ['all'],
      standardPopulation: 'who',
      // View indicators (false by default in mortality view)
      isExcess: false,
      isZScore: false,
      isASD: false,

      // Date range (undefined = use data availability defaults)
      dateFrom: undefined as string | undefined,
      dateTo: undefined as string | undefined,
      sliderStart: getDefaultSliderStart(),
      baselineDateFrom: undefined as string | undefined,
      baselineDateTo: undefined as string | undefined,

      // Display options
      showBaseline: true,
      baselineMethod: 'mean',
      showPredictionInterval: true,
      cumulative: false,
      showTotal: false,
      showPercentage: false,
      showLogarithmic: false,
      leAdjusted: true, // Seasonal adjustment for LE (default: ON)
      maximize: false,
      showLabels: true,

      // Chart appearance
      decimals: 'auto',
      showLogo: true,
      showQrCode: true,
      showCaption: true,
      showTitle: true,
      userColors: undefined as string[] | undefined,
      darkMode: false
    },

    constraints: [
      // Baseline OFF disables PI
      {
        when: s => s.showBaseline === false,
        apply: { showPredictionInterval: false },
        reason: 'Prediction intervals require baseline',
        allowUserOverride: false,
        priority: 1
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'le', 'deaths']
  },

  /**
   * Excess View
   * Excess mortality analysis with required baseline
   */
  excess: {
    id: 'excess',
    label: 'Excess Mortality',
    urlParam: 'e', // URL: ?e=1

    ui: {
      baseline: required(true), // forced ON
      predictionInterval: toggleable(),
      logarithmic: hidden(), // not available in excess
      maximize: conditional({
        field: 'chartStyle',
        is: 'bar'
      }),
      labels: toggleable(),
      cumulative: toggleable(),
      percentage: toggleable(),
      showTotal: conditional({
        and: [
          { field: 'chartStyle', is: 'bar' },
          { field: 'cumulative', is: true }
        ]
      })
    },

    defaults: {
      chartStyle: 'bar',
      showBaseline: true, // forced
      showPredictionInterval: false,
      showPercentage: true,
      cumulative: false,
      showLogarithmic: false
    },

    constraints: [
      // Excess REQUIRES baseline (priority 2 - hard constraint)
      {
        when: () => true, // always in excess view
        apply: { showBaseline: true },
        reason: 'Excess mortality requires baseline',
        allowUserOverride: false,
        priority: 2
      },
      // Excess disables logarithmic (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { showLogarithmic: false },
        reason: 'Logarithmic scale not available in excess mode',
        allowUserOverride: false,
        priority: 2
      },
      // Cumulative OFF disables showTotal
      {
        when: s => s.cumulative === false,
        apply: { showTotal: false },
        reason: 'Show total requires cumulative mode',
        allowUserOverride: false,
        priority: 1
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'deaths'] // no LE, no population
  },

  /**
   * Z-Score View
   * Statistical z-score analysis showing standard deviations from baseline
   */
  zscore: {
    id: 'zscore',
    label: 'Z-Score Analysis',
    urlParam: 'zs', // URL: ?zs=1

    ui: {
      baseline: hidden(), // Z-scores replace baseline display
      predictionInterval: toggleable(), // Can show PI with z-scores
      logarithmic: hidden(), // Not compatible with z-scores
      maximize: conditional({
        field: 'chartStyle',
        is: 'bar'
      }),
      labels: toggleable(),
      cumulative: hidden(), // Not available in z-score view
      percentage: hidden(),
      showTotal: hidden()
    },

    defaults: {
      chartStyle: 'line', // Line chart is default for z-scores
      showBaseline: true, // Required for z-score calculation (but hidden in UI)
      showPredictionInterval: false,
      showLogarithmic: false
    },

    constraints: [
      // Z-scores require baseline for calculation (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { showBaseline: true },
        reason: 'Z-score calculation requires baseline data',
        allowUserOverride: false,
        priority: 2
      },
      // Z-scores disable logarithmic scale (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { showLogarithmic: false },
        reason: 'Logarithmic scale not compatible with z-score analysis',
        allowUserOverride: false,
        priority: 2
      },
      // Z-scores disable cumulative and percentage (priority 2)
      {
        when: () => true,
        apply: {
          cumulative: false,
          showPercentage: false
        },
        reason: 'Z-scores show deviations, not cumulative or percentage values',
        allowUserOverride: false,
        priority: 2
      },
      // Z-scores don't support matrix chart style - force to line (priority 2)
      {
        when: s => s.chartStyle === 'matrix',
        apply: { chartStyle: 'line' },
        reason: 'Matrix chart style not supported in z-score view',
        allowUserOverride: false,
        priority: 2
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'deaths'], // All metrics that support baselines
    compatibleChartStyles: ['line', 'bar'] // No matrix for z-scores
  },

  /**
   * ASD View (Age-Standardized Deaths)
   * Analysis mode using the Levitt method for age-standardized death calculations
   */
  asd: {
    id: 'asd',
    label: 'Age-Standardized Deaths',
    urlParam: 'asd', // URL: ?asd=1

    ui: {
      baseline: required(true), // forced ON - required for ASD calculation
      predictionInterval: toggleable(),
      logarithmic: hidden(), // not available in ASD
      maximize: conditional({
        field: 'chartStyle',
        is: 'bar'
      }),
      labels: toggleable(),
      cumulative: toggleable(),
      percentage: toggleable(),
      showTotal: conditional({
        and: [
          { field: 'chartStyle', is: 'bar' },
          { field: 'cumulative', is: true }
        ]
      })
    },

    defaults: {
      chartStyle: 'line',
      showBaseline: true, // forced - required for ASD calculation
      showPredictionInterval: false,
      showPercentage: false,
      cumulative: false,
      showLogarithmic: false
    },

    constraints: [
      // ASD REQUIRES baseline for calculation (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { showBaseline: true },
        reason: 'Age-standardized deaths calculation requires baseline data',
        allowUserOverride: false,
        priority: 2
      },
      // ASD disables logarithmic (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { showLogarithmic: false },
        reason: 'Logarithmic scale not available in ASD mode',
        allowUserOverride: false,
        priority: 2
      },
      // Cumulative OFF disables showTotal
      {
        when: s => s.cumulative === false,
        apply: { showTotal: false },
        reason: 'Show total requires cumulative mode',
        allowUserOverride: false,
        priority: 1
      }
    ],

    compatibleMetrics: ['deaths'], // ASD only works with deaths data
    compatibleChartStyles: ['line', 'bar'] // Standard chart styles
  }
}
