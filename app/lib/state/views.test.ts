/**
 * View Configurations Unit Tests
 *
 * Tests view configuration definitions
 */

import { describe, it, expect } from 'vitest'
import { VIEWS } from './views'
import type { ViewType } from './viewTypes'

describe('View Configurations', () => {
  describe('VIEWS constant', () => {
    it('defines all required views', () => {
      expect(VIEWS.mortality).toBeDefined()
      expect(VIEWS.excess).toBeDefined()
      expect(VIEWS.zscore).toBeDefined()
    })

    it('all views have required properties', () => {
      const viewTypes: ViewType[] = ['mortality', 'excess', 'zscore']

      viewTypes.forEach((viewType) => {
        const config = VIEWS[viewType]
        expect(config.id).toBe(viewType)
        expect(config.label).toBeTruthy()
        expect(config.ui).toBeDefined()
        expect(config.defaults).toBeDefined()
        expect(config.constraints).toBeDefined()
        expect(Array.isArray(config.constraints)).toBe(true)
      })
    })
  })

  describe('Mortality View', () => {
    const config = VIEWS.mortality

    it('has correct basic config', () => {
      expect(config.id).toBe('mortality')
      expect(config.label).toBe('Mortality Analysis')
      expect(config.urlParam).toBeNull() // default view
    })

    it('has correct UI visibility rules', () => {
      expect(config.ui.baseline.visibility.type).toBe('visible')
      expect(config.ui.baseline.visibility.toggleable).toBe(true)

      expect(config.ui.logarithmic.visibility.type).toBe('visible')
      expect(config.ui.logarithmic.visibility.toggleable).toBe(true)

      expect(config.ui.maximize.visibility.type).toBe('visible')

      // Excess-specific options should be hidden
      expect(config.ui.cumulative.visibility.type).toBe('hidden')
      expect(config.ui.percentage.visibility.type).toBe('hidden')
      expect(config.ui.showTotal.visibility.type).toBe('hidden')
    })

    it('has correct defaults', () => {
      expect(config.defaults.chartStyle).toBe('line')
      expect(config.defaults.showBaseline).toBe(false)
      expect(config.defaults.isLogarithmic).toBe(false)
    })

    it('supports all metrics', () => {
      expect(config.compatibleMetrics).toEqual(['cmr', 'asmr', 'le', 'deaths'])
    })
  })

  describe('Excess View', () => {
    const config = VIEWS.excess

    it('has correct basic config', () => {
      expect(config.id).toBe('excess')
      expect(config.label).toBe('Excess Mortality')
      expect(config.urlParam).toBe('e')
    })

    it('requires baseline to be ON', () => {
      expect(config.ui.baseline.visibility.type).toBe('visible')
      expect(config.ui.baseline.visibility.toggleable).toBe(false)
      if (config.ui.baseline.visibility.type === 'visible' && !config.ui.baseline.visibility.toggleable) {
        expect(config.ui.baseline.visibility.value).toBe(true)
      }
    })

    it('hides logarithmic option', () => {
      expect(config.ui.logarithmic.visibility.type).toBe('hidden')
    })

    it('shows excess-specific options', () => {
      expect(config.ui.cumulative.visibility.type).toBe('visible')
      expect(config.ui.percentage.visibility.type).toBe('visible')
    })

    it('shows total option conditionally (bar + cumulative)', () => {
      expect(config.ui.showTotal.visibility.type).toBe('conditional')
      if (config.ui.showTotal.visibility.type === 'conditional') {
        expect(config.ui.showTotal.visibility.when).toBeDefined()
      }
    })

    it('has correct defaults', () => {
      expect(config.defaults.chartStyle).toBe('bar')
      expect(config.defaults.showBaseline).toBe(true)
      expect(config.defaults.showPredictionInterval).toBe(false)
      expect(config.defaults.showPercentage).toBe(true)
      expect(config.defaults.cumulative).toBe(false)
      expect(config.defaults.isLogarithmic).toBe(false)
    })

    it('excludes incompatible metrics', () => {
      expect(config.compatibleMetrics).toEqual(['cmr', 'asmr', 'deaths'])
      expect(config.compatibleMetrics).not.toContain('le')
      expect(config.compatibleMetrics).not.toContain('population')
    })

    it('has hard constraints for required fields', () => {
      expect(config.constraints.length).toBeGreaterThan(0)

      // Should have constraint for baseline = true
      const baselineConstraint = config.constraints.find(
        c => c.apply.showBaseline === true
      )
      expect(baselineConstraint).toBeDefined()
      expect(baselineConstraint?.allowUserOverride).toBe(false)
      expect(baselineConstraint?.priority).toBe(2)

      // Should have constraint for logarithmic = false
      const logarithmicConstraint = config.constraints.find(
        c => c.apply.isLogarithmic === false
      )
      expect(logarithmicConstraint).toBeDefined()
      expect(logarithmicConstraint?.allowUserOverride).toBe(false)
      expect(logarithmicConstraint?.priority).toBe(2)
    })
  })

  describe('Z-Score View', () => {
    const config = VIEWS.zscore

    it('has correct basic config', () => {
      expect(config.id).toBe('zscore')
      expect(config.label).toBe('Z-Score Analysis')
      expect(config.urlParam).toBe('zs')
    })

    it('hides standard mortality options', () => {
      expect(config.ui.baseline.visibility.type).toBe('hidden')
      expect(config.ui.predictionInterval.visibility.type).toBe('hidden')
      expect(config.ui.logarithmic.visibility.type).toBe('hidden')
      expect(config.ui.maximize.visibility.type).toBe('hidden')
      expect(config.ui.cumulative.visibility.type).toBe('hidden')
      expect(config.ui.percentage.visibility.type).toBe('hidden')
      expect(config.ui.showTotal.visibility.type).toBe('hidden')
    })

    it('shows z-score specific options', () => {
      expect(config.ui.zScoreThreshold).toBeDefined()
      expect(config.ui.zScoreThreshold?.visibility.type).toBe('visible')

      expect(config.ui.significanceLevel).toBeDefined()
      expect(config.ui.significanceLevel?.visibility.type).toBe('visible')
    })

    it('has correct defaults', () => {
      expect(config.defaults.chartStyle).toBe('matrix')
      expect(config.defaults.zScoreThreshold).toBe(2.0)
      expect(config.defaults.significanceLevel).toBe(0.05)
    })

    it('restricts to compatible metrics', () => {
      expect(config.compatibleMetrics).toEqual(['cmr'])
    })

    it('restricts to matrix chart style only', () => {
      expect(config.compatibleChartStyles).toEqual(['matrix'])
    })

    it('has constraint to force matrix chart style', () => {
      const matrixConstraint = config.constraints.find(
        c => c.apply.chartStyle === 'matrix'
      )
      expect(matrixConstraint).toBeDefined()
      expect(matrixConstraint?.allowUserOverride).toBe(false)
      expect(matrixConstraint?.priority).toBe(2)
    })
  })

  describe('View Compatibility', () => {
    it('each view has unique URL param', () => {
      const urlParams = Object.values(VIEWS)
        .map(v => v.urlParam)
        .filter(p => p !== null)

      const uniqueParams = new Set(urlParams)
      expect(urlParams.length).toBe(uniqueParams.size)
    })

    it('mortality is the only default view (null urlParam)', () => {
      const defaultViews = Object.values(VIEWS).filter(v => v.urlParam === null)
      expect(defaultViews.length).toBe(1)
      expect(defaultViews[0].id).toBe('mortality')
    })

    it('all views have at least one compatible metric', () => {
      Object.values(VIEWS).forEach((config) => {
        if (config.compatibleMetrics) {
          expect(config.compatibleMetrics.length).toBeGreaterThan(0)
        }
      })
    })
  })
})
