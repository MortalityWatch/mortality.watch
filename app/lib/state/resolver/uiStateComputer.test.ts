/**
 * UI State Computer Tests
 */

import { describe, it, expect } from 'vitest'
import { computeUIState } from './uiStateComputer'
import type { ViewConfig, UIElement } from './viewTypes'

// Helper to create a minimal valid ViewConfig for testing
function createTestViewConfig(ui: Record<string, UIElement>): ViewConfig {
  const hidden: UIElement = { visibility: { type: 'hidden' } }
  return {
    id: 'mortality', // Use valid ViewType
    label: 'Test',
    urlParam: null,
    ui: {
      baseline: hidden,
      predictionInterval: hidden,
      logarithmic: hidden,
      maximize: hidden,
      labels: hidden,
      cumulative: hidden,
      percentage: hidden,
      showTotal: hidden,
      ...ui // Override with test-specific UI
    },
    defaults: {},
    constraints: [],
    compatibleMetrics: ['asmr']
  }
}

describe('uiStateComputer', () => {
  describe('computeUIState', () => {
    it('returns visible=true, disabled=false for toggleable elements', () => {
      const viewConfig = createTestViewConfig({
        baseline: { visibility: { type: 'visible', toggleable: true } }
      })

      const result = computeUIState(viewConfig, {})

      expect(result.baseline).toEqual({ visible: true, disabled: false })
    })

    it('returns visible=false, disabled=true for hidden elements', () => {
      const viewConfig = createTestViewConfig({
        cumulative: { visibility: { type: 'hidden' } }
      })

      const result = computeUIState(viewConfig, {})

      expect(result.cumulative).toEqual({ visible: false, disabled: true })
    })

    it('returns visible=true, disabled=true for required (non-toggleable) elements', () => {
      const viewConfig = createTestViewConfig({
        baseline: { visibility: { type: 'visible', toggleable: false, value: true } }
      })

      const result = computeUIState(viewConfig, {})

      expect(result.baseline).toEqual({ visible: true, disabled: true })
    })

    it('evaluates simple conditional visibility', () => {
      const viewConfig = createTestViewConfig({
        predictionInterval: {
          visibility: {
            type: 'conditional',
            when: { field: 'showBaseline', is: true }
          }
        }
      })

      // When condition is met
      const resultTrue = computeUIState(viewConfig, { showBaseline: true })
      expect(resultTrue.predictionInterval).toEqual({ visible: true, disabled: false })

      // When condition is not met
      const resultFalse = computeUIState(viewConfig, { showBaseline: false })
      expect(resultFalse.predictionInterval).toEqual({ visible: false, disabled: true })
    })

    it('evaluates AND conditional visibility', () => {
      const viewConfig = createTestViewConfig({
        showTotal: {
          visibility: {
            type: 'conditional',
            when: {
              and: [
                { field: 'chartStyle', is: 'bar' },
                { field: 'cumulative', is: true }
              ]
            }
          }
        }
      })

      // Both conditions met
      const resultBoth = computeUIState(viewConfig, { chartStyle: 'bar', cumulative: true })
      expect(resultBoth.showTotal).toEqual({ visible: true, disabled: false })

      // Only one condition met
      const resultOne = computeUIState(viewConfig, { chartStyle: 'bar', cumulative: false })
      expect(resultOne.showTotal).toEqual({ visible: false, disabled: true })

      // Neither condition met
      const resultNone = computeUIState(viewConfig, { chartStyle: 'line', cumulative: false })
      expect(resultNone.showTotal).toEqual({ visible: false, disabled: true })
    })

    it('evaluates OR conditional visibility', () => {
      const viewConfig = createTestViewConfig({
        percentage: {
          visibility: {
            type: 'conditional',
            when: {
              or: [
                { field: 'chartStyle', is: 'bar' },
                { field: 'chartStyle', is: 'matrix' }
              ]
            }
          }
        }
      })

      // First condition met
      const resultBar = computeUIState(viewConfig, { chartStyle: 'bar' })
      expect(resultBar.percentage).toEqual({ visible: true, disabled: false })

      // Second condition met
      const resultMatrix = computeUIState(viewConfig, { chartStyle: 'matrix' })
      expect(resultMatrix.percentage).toEqual({ visible: true, disabled: false })

      // Neither condition met
      const resultLine = computeUIState(viewConfig, { chartStyle: 'line' })
      expect(resultLine.percentage).toEqual({ visible: false, disabled: true })
    })

    it('handles multiple UI fields', () => {
      const viewConfig = createTestViewConfig({
        baseline: { visibility: { type: 'visible', toggleable: true } },
        cumulative: { visibility: { type: 'hidden' } },
        predictionInterval: {
          visibility: {
            type: 'conditional',
            when: { field: 'showBaseline', is: true }
          }
        }
      })

      const result = computeUIState(viewConfig, { showBaseline: true })

      expect(result.baseline).toEqual({ visible: true, disabled: false })
      expect(result.cumulative).toEqual({ visible: false, disabled: true })
      expect(result.predictionInterval).toEqual({ visible: true, disabled: false })
    })
  })
})
