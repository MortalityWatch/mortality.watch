/**
 * View Configurations
 *
 * Defines all available view types and their UI/constraint configurations
 */

import type { ViewConfig, ViewType, UIElement } from './viewTypes'

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

const conditional = (when: UIElement['visibility'] extends { type: 'conditional'; when: infer W } ? W : never): UIElement => ({
  visibility: { type: 'conditional', when }
})

/**
 * View Definitions
 */
export const VIEWS: Record<ViewType, ViewConfig> = {
  /**
   * Mortality View (Default)
   * Standard mortality analysis with optional baseline
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
      showTotal: hidden(),
    },

    defaults: {
      chartStyle: 'line',
      showBaseline: false,
      isLogarithmic: false,
    },

    constraints: [
      // Baseline OFF disables PI
      {
        when: (s) => s.showBaseline === false,
        apply: { showPredictionInterval: false },
        reason: 'Prediction intervals require baseline',
        allowUserOverride: false,
        priority: 1
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'le', 'deaths'],
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
      }),
    },

    defaults: {
      chartStyle: 'bar',
      showBaseline: true, // forced
      showPredictionInterval: false,
      showPercentage: true,
      cumulative: false,
      isLogarithmic: false,
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
        apply: { isLogarithmic: false },
        reason: 'Logarithmic scale not available in excess mode',
        allowUserOverride: false,
        priority: 2
      },
      // Cumulative OFF disables showTotal
      {
        when: (s) => s.cumulative === false,
        apply: { showTotal: false },
        reason: 'Show total requires cumulative mode',
        allowUserOverride: false,
        priority: 1
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'deaths'], // no LE, no population
  },

  /**
   * Z-Score View
   * Statistical z-score analysis with matrix visualization
   */
  zscore: {
    id: 'zscore',
    label: 'Z-Score Analysis',
    urlParam: 'zs', // URL: ?zs=1

    ui: {
      baseline: hidden(), // doesn't make sense
      predictionInterval: hidden(),
      logarithmic: hidden(),
      maximize: hidden(),
      labels: toggleable(),
      cumulative: hidden(),
      percentage: hidden(),
      showTotal: hidden(),
      zScoreThreshold: toggleable(),
      significanceLevel: toggleable(),
    },

    defaults: {
      chartStyle: 'matrix', // force heatmap
      zScoreThreshold: 2.0,
      significanceLevel: 0.05,
    },

    constraints: [
      // Force matrix chart style (priority 2 - hard constraint)
      {
        when: () => true,
        apply: { chartStyle: 'matrix' },
        reason: 'Z-score analysis uses matrix visualization',
        allowUserOverride: false,
        priority: 2
      }
    ],

    compatibleMetrics: ['cmr'], // maybe only crude
    compatibleChartStyles: ['matrix'],
  },
}
