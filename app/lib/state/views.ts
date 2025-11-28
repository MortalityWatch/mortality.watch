/**
 * View Configurations
 *
 * Defines all available view types and their UI/constraint configurations
 */

import type { ViewConfig, ViewType, UIElement, UICondition } from './viewTypes'

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
      chartStyle: 'line',
      showBaseline: false,
      showLogarithmic: false
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
      logarithmic: toggleable(), // user can enable/disable as needed
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
      logarithmic: toggleable(), // user can enable/disable as needed
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
      }
    ],

    compatibleMetrics: ['cmr', 'asmr', 'deaths'], // All metrics that support baselines
    compatibleChartStyles: ['line', 'bar'] // No matrix for z-scores
  }
}
