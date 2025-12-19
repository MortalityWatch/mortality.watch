/**
 * RankingStateResolver Tests
 *
 * Tests for the ranking page state resolution system.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RankingStateResolver } from './RankingStateResolver'
import type { RankingState } from './types'

// Mock route object for testing
function createMockRoute(query: Record<string, string | undefined> = {}) {
  return {
    query,
    params: {},
    path: '/ranking',
    name: 'ranking',
    fullPath: '/ranking',
    hash: '',
    matched: [],
    meta: {},
    redirectedFrom: undefined
  } as never
}

describe('RankingStateResolver', () => {
  describe('detectView', () => {
    it('returns relative when no e param', () => {
      expect(RankingStateResolver.detectView({})).toBe('relative')
    })

    it('returns relative when e=1', () => {
      expect(RankingStateResolver.detectView({ e: '1' })).toBe('relative')
    })

    it('returns absolute when e=0', () => {
      expect(RankingStateResolver.detectView({ e: '0' })).toBe('absolute')
    })
  })

  describe('resolveInitial', () => {
    it('returns default state when no query params', () => {
      const route = createMockRoute({})
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.view).toBe('relative')
      expect(resolved.state.metricType).toBe('asmr')
      expect(resolved.state.showPercentage).toBe(true)
      expect(resolved.state.showPI).toBe(false)
    })

    it('applies absolute mode when e=0', () => {
      const route = createMockRoute({ e: '0' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.view).toBe('absolute')
      expect(resolved.state.showPercentage).toBe(false) // Constraint applied
      expect(resolved.state.showPI).toBe(false) // Constraint applied
    })

    it('applies metric type from URL', () => {
      const route = createMockRoute({ m: 'le' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.metricType).toBe('le')
    })

    it('supports legacy a param for ASMR', () => {
      const route = createMockRoute({ a: '1' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.metricType).toBe('asmr')
    })

    it('supports legacy a param for CMR', () => {
      const route = createMockRoute({ a: '0' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.metricType).toBe('cmr')
    })

    it('prefers new m param over legacy a param', () => {
      const route = createMockRoute({ m: 'le', a: '1' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.state.metricType).toBe('le')
    })

    it('computes UI state for relative view', () => {
      const route = createMockRoute({})
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.ui.baselineMethod?.visible).toBe(true)
      expect(resolved.ui.percentage?.visible).toBe(true)
    })

    it('computes UI state for absolute view', () => {
      const route = createMockRoute({ e: '0' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.ui.baselineMethod?.visible).toBe(false)
      expect(resolved.ui.percentage?.visible).toBe(false)
    })
  })

  describe('resolveChange', () => {
    let defaultState: RankingState

    beforeEach(() => {
      defaultState = {
        view: 'relative',
        periodOfTime: 'fluseason',
        jurisdictionType: 'countries',
        metricType: 'asmr',
        standardPopulation: 'who',
        showTotals: true,
        showTotalsOnly: false,
        showPercentage: true,
        showPI: false,
        cumulative: false,
        hideIncomplete: true,
        decimalPrecision: '1',
        baselineMethod: 'mean'
      }
    })

    it('updates metric type', () => {
      const resolved = RankingStateResolver.resolveChange(
        { field: 'metricType', value: 'le' },
        defaultState
      )

      expect(resolved.state.metricType).toBe('le')
    })

    it('switches to absolute view and applies constraints', () => {
      const resolved = RankingStateResolver.resolveChange(
        { field: 'view', value: 'absolute' },
        defaultState
      )

      expect(resolved.state.view).toBe('absolute')
      expect(resolved.state.showPercentage).toBe(false)
      expect(resolved.state.showPI).toBe(false)
    })

    it('enables PI only when not cumulative and not totalsOnly', () => {
      const resolved = RankingStateResolver.resolveChange(
        { field: 'showPI', value: true },
        defaultState
      )

      expect(resolved.state.showPI).toBe(true)
    })

    it('disables PI when cumulative is enabled', () => {
      const stateWithCumulative = { ...defaultState, cumulative: true }
      const resolved = RankingStateResolver.resolveChange(
        { field: 'showPI', value: true },
        stateWithCumulative
      )

      expect(resolved.state.showPI).toBe(false) // Constraint applied
    })

    it('disables PI when totalsOnly is enabled', () => {
      const stateWithTotalsOnly = { ...defaultState, showTotalsOnly: true }
      const resolved = RankingStateResolver.resolveChange(
        { field: 'showPI', value: true },
        stateWithTotalsOnly
      )

      expect(resolved.state.showPI).toBe(false) // Constraint applied
    })

    it('disables totalsOnly when showTotals is disabled', () => {
      const stateWithTotalsOnly = { ...defaultState, showTotalsOnly: true }
      const resolved = RankingStateResolver.resolveChange(
        { field: 'showTotals', value: false },
        stateWithTotalsOnly
      )

      expect(resolved.state.showTotalsOnly).toBe(false) // Constraint applied
    })
  })

  describe('UI state computation', () => {
    it('shows standard population for ASMR only', () => {
      const route = createMockRoute({ m: 'asmr' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.ui.standardPopulation?.visible).toBe(true)
      expect(resolved.ui.standardPopulation?.disabled).toBe(false)
    })

    it('hides standard population for CMR', () => {
      const route = createMockRoute({ m: 'cmr' })
      const resolved = RankingStateResolver.resolveInitial(route)

      // Standard population is visible but disabled for non-ASMR
      expect(resolved.ui.standardPopulation?.visible).toBe(false)
    })

    it('hides standard population for LE', () => {
      const route = createMockRoute({ m: 'le' })
      const resolved = RankingStateResolver.resolveInitial(route)

      // Standard population is visible but disabled for non-ASMR
      expect(resolved.ui.standardPopulation?.visible).toBe(false)
    })

    it('shows totalsOnly when showTotals is true', () => {
      const route = createMockRoute({ t: '1' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.ui.totalsOnly?.visible).toBe(true)
    })

    it('hides totalsOnly when showTotals is false', () => {
      const route = createMockRoute({ t: '0' })
      const resolved = RankingStateResolver.resolveInitial(route)

      expect(resolved.ui.totalsOnly?.visible).toBe(false)
    })
  })

  describe('constraint priority', () => {
    let defaultState: RankingState

    beforeEach(() => {
      defaultState = {
        view: 'relative',
        periodOfTime: 'fluseason',
        jurisdictionType: 'countries',
        metricType: 'asmr',
        standardPopulation: 'who',
        showTotals: true,
        showTotalsOnly: false,
        showPercentage: true,
        showPI: true,
        cumulative: false,
        hideIncomplete: true,
        decimalPrecision: '1',
        baselineMethod: 'mean'
      }
    })

    it('absolute mode constraint (p2) overrides user PI preference', () => {
      // User has PI=true in state, but switching to absolute should force it off
      const resolved = RankingStateResolver.resolveChange(
        { field: 'view', value: 'absolute' },
        defaultState,
        new Set(['showPI']) // User explicitly set showPI
      )

      // Absolute mode is a priority 2 constraint that cannot be overridden
      expect(resolved.state.showPI).toBe(false)
    })

    it('cumulative constraint (p1) overrides user PI preference', () => {
      // User has PI=true, enabling cumulative should force it off
      const resolved = RankingStateResolver.resolveChange(
        { field: 'cumulative', value: true },
        defaultState,
        new Set(['showPI'])
      )

      expect(resolved.state.showPI).toBe(false)
    })
  })
})
