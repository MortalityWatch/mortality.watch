/**
 * View Helpers Unit Tests
 *
 * Tests helper functions for view UI configuration
 */

import { describe, it, expect } from 'vitest'
import {
  isVisible,
  isRequired,
  getDefaultValue,
  isDisabled,
  getDisabledReason,
  evaluateCondition,
  isMetricCompatible,
  isChartStyleCompatible,
  isChartTypeCompatible
} from './viewHelpers'
import type { UIElement, ExplorerStateValues } from './viewTypes'

describe('viewHelpers', () => {
  describe('isVisible', () => {
    it('returns false for hidden elements', () => {
      const element: UIElement = {
        visibility: { type: 'hidden' }
      }
      const state = {} as ExplorerStateValues
      expect(isVisible(element, state)).toBe(false)
    })

    it('returns true for toggleable elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true }
      }
      const state = {} as ExplorerStateValues
      expect(isVisible(element, state)).toBe(true)
    })

    it('returns true for required elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: false, value: true }
      }
      const state = {} as ExplorerStateValues
      expect(isVisible(element, state)).toBe(true)
    })

    it('evaluates conditional visibility - true condition', () => {
      const element: UIElement = {
        visibility: {
          type: 'conditional',
          when: { field: 'chartStyle', is: 'bar' }
        }
      }
      const state = { chartStyle: 'bar' } as ExplorerStateValues
      expect(isVisible(element, state)).toBe(true)
    })

    it('evaluates conditional visibility - false condition', () => {
      const element: UIElement = {
        visibility: {
          type: 'conditional',
          when: { field: 'chartStyle', is: 'bar' }
        }
      }
      const state = { chartStyle: 'line' } as ExplorerStateValues
      expect(isVisible(element, state)).toBe(false)
    })

    it('evaluates conditional visibility with isNot', () => {
      const element: UIElement = {
        visibility: {
          type: 'conditional',
          when: { field: 'chartStyle', isNot: 'matrix' }
        }
      }
      const stateBar = { chartStyle: 'bar' } as ExplorerStateValues
      const stateMatrix = { chartStyle: 'matrix' } as ExplorerStateValues

      expect(isVisible(element, stateBar)).toBe(true)
      expect(isVisible(element, stateMatrix)).toBe(false)
    })

    it('evaluates AND conditions', () => {
      const element: UIElement = {
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

      expect(isVisible(element, {
        chartStyle: 'bar',
        cumulative: true
      } as ExplorerStateValues)).toBe(true)

      expect(isVisible(element, {
        chartStyle: 'bar',
        cumulative: false
      } as ExplorerStateValues)).toBe(false)

      expect(isVisible(element, {
        chartStyle: 'line',
        cumulative: true
      } as ExplorerStateValues)).toBe(false)
    })

    it('evaluates OR conditions', () => {
      const element: UIElement = {
        visibility: {
          type: 'conditional',
          when: {
            or: [
              { field: 'chartStyle', is: 'bar' },
              { field: 'chartStyle', is: 'line' }
            ]
          }
        }
      }

      expect(isVisible(element, {
        chartStyle: 'bar'
      } as ExplorerStateValues)).toBe(true)

      expect(isVisible(element, {
        chartStyle: 'line'
      } as ExplorerStateValues)).toBe(true)

      expect(isVisible(element, {
        chartStyle: 'matrix'
      } as ExplorerStateValues)).toBe(false)
    })
  })

  describe('isRequired', () => {
    it('returns true for non-toggleable visible elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: false, value: true }
      }
      expect(isRequired(element)).toBe(true)
    })

    it('returns false for toggleable elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true }
      }
      expect(isRequired(element)).toBe(false)
    })

    it('returns false for hidden elements', () => {
      const element: UIElement = {
        visibility: { type: 'hidden' }
      }
      expect(isRequired(element)).toBe(false)
    })

    it('returns false for conditional elements', () => {
      const element: UIElement = {
        visibility: {
          type: 'conditional',
          when: { field: 'chartStyle', is: 'bar' }
        }
      }
      expect(isRequired(element)).toBe(false)
    })
  })

  describe('getDefaultValue', () => {
    it('returns value for required elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: false, value: true }
      }
      expect(getDefaultValue(element)).toBe(true)
    })

    it('returns undefined for toggleable elements', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true }
      }
      expect(getDefaultValue(element)).toBeUndefined()
    })

    it('returns undefined for hidden elements', () => {
      const element: UIElement = {
        visibility: { type: 'hidden' }
      }
      expect(getDefaultValue(element)).toBeUndefined()
    })
  })

  describe('isDisabled', () => {
    it('returns false when disabled property is not set', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true }
      }
      const state = {} as ExplorerStateValues
      expect(isDisabled(element, state)).toBe(false)
    })

    it('returns false when disabled is explicitly false', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true },
        disabled: { disabled: false }
      }
      const state = {} as ExplorerStateValues
      expect(isDisabled(element, state)).toBe(false)
    })

    it('returns true when disabled is true', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true },
        disabled: { disabled: true, reason: 'Test reason' }
      }
      const state = {} as ExplorerStateValues
      expect(isDisabled(element, state)).toBe(true)
    })

    it('evaluates conditional disabled state', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true },
        disabled: {
          disabled: 'conditional',
          when: { field: 'showBaseline', is: false }
        }
      }

      expect(isDisabled(element, {
        showBaseline: false
      } as ExplorerStateValues)).toBe(true)

      expect(isDisabled(element, {
        showBaseline: true
      } as ExplorerStateValues)).toBe(false)
    })
  })

  describe('getDisabledReason', () => {
    it('returns reason when element is disabled', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true },
        disabled: { disabled: true, reason: 'Requires baseline' }
      }
      expect(getDisabledReason(element)).toBe('Requires baseline')
    })

    it('returns null when element is not disabled', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true }
      }
      expect(getDisabledReason(element)).toBeNull()
    })

    it('returns null for conditional disabled', () => {
      const element: UIElement = {
        visibility: { type: 'visible', toggleable: true },
        disabled: {
          disabled: 'conditional',
          when: { field: 'showBaseline', is: false }
        }
      }
      expect(getDisabledReason(element)).toBeNull()
    })
  })

  describe('evaluateCondition', () => {
    it('evaluates field "is" condition', () => {
      const condition = { field: 'chartStyle' as const, is: 'bar' as const }
      expect(evaluateCondition(condition, {
        chartStyle: 'bar'
      } as ExplorerStateValues)).toBe(true)

      expect(evaluateCondition(condition, {
        chartStyle: 'line'
      } as ExplorerStateValues)).toBe(false)
    })

    it('evaluates field "isNot" condition', () => {
      const condition = { field: 'chartStyle' as const, isNot: 'matrix' as const }
      expect(evaluateCondition(condition, {
        chartStyle: 'bar'
      } as ExplorerStateValues)).toBe(true)

      expect(evaluateCondition(condition, {
        chartStyle: 'matrix'
      } as ExplorerStateValues)).toBe(false)
    })

    it('evaluates nested AND conditions', () => {
      const condition = {
        and: [
          { field: 'chartStyle' as const, is: 'bar' as const },
          { field: 'cumulative' as const, is: true }
        ]
      }

      expect(evaluateCondition(condition, {
        chartStyle: 'bar',
        cumulative: true
      } as ExplorerStateValues)).toBe(true)

      expect(evaluateCondition(condition, {
        chartStyle: 'bar',
        cumulative: false
      } as ExplorerStateValues)).toBe(false)
    })

    it('evaluates nested OR conditions', () => {
      const condition = {
        or: [
          { field: 'chartStyle' as const, is: 'bar' as const },
          { field: 'chartStyle' as const, is: 'line' as const }
        ]
      }

      expect(evaluateCondition(condition, {
        chartStyle: 'bar'
      } as ExplorerStateValues)).toBe(true)

      expect(evaluateCondition(condition, {
        chartStyle: 'matrix'
      } as ExplorerStateValues)).toBe(false)
    })
  })

  describe('isMetricCompatible', () => {
    it('returns true when view has no metric restrictions', () => {
      // Assuming mortality view has no compatibleMetrics restriction
      expect(isMetricCompatible('cmr', 'mortality')).toBe(true)
      expect(isMetricCompatible('le', 'mortality')).toBe(true)
    })

    it('returns true for compatible metrics', () => {
      expect(isMetricCompatible('cmr', 'excess')).toBe(true)
      expect(isMetricCompatible('asmr', 'excess')).toBe(true)
    })

    it('returns false for incompatible metrics', () => {
      expect(isMetricCompatible('le', 'excess')).toBe(false)
      expect(isMetricCompatible('population', 'excess')).toBe(false)
    })
  })

  describe('isChartStyleCompatible', () => {
    it('returns true when view has no chart style restrictions', () => {
      expect(isChartStyleCompatible('line', 'mortality')).toBe(true)
      expect(isChartStyleCompatible('bar', 'mortality')).toBe(true)
    })

    it('returns true for compatible chart styles', () => {
      expect(isChartStyleCompatible('line', 'zscore')).toBe(true)
      expect(isChartStyleCompatible('bar', 'zscore')).toBe(true)
    })

    it('returns false for incompatible chart styles', () => {
      expect(isChartStyleCompatible('matrix', 'zscore')).toBe(false)
    })
  })

  describe('isChartTypeCompatible', () => {
    it('returns true when view has no chart type restrictions', () => {
      expect(isChartTypeCompatible('yearly', 'mortality')).toBe(true)
      expect(isChartTypeCompatible('weekly', 'mortality')).toBe(true)
      expect(isChartTypeCompatible('monthly', 'mortality')).toBe(true)
    })

    it('returns true for compatible chart types', () => {
      expect(isChartTypeCompatible('yearly', 'zscore')).toBe(true)
      expect(isChartTypeCompatible('fluseason', 'zscore')).toBe(true)
      expect(isChartTypeCompatible('midyear', 'zscore')).toBe(true)
    })

    it('returns false for incompatible chart types', () => {
      expect(isChartTypeCompatible('weekly', 'zscore')).toBe(false)
      expect(isChartTypeCompatible('monthly', 'zscore')).toBe(false)
      expect(isChartTypeCompatible('quarterly', 'zscore')).toBe(false)
    })
  })
})
