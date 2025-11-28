/**
 * StateResolver Unit Tests
 *
 * Tests centralized state resolution system including:
 * - Initial state resolution from URL
 * - State change resolution with constraints
 * - Priority-based conflict resolution
 * - User override tracking
 * - Issue #147 fix validation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { StateResolver } from './StateResolver'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// Mock stateFieldEncoders
vi.mock('@/composables/useExplorerState', () => ({
  stateFieldEncoders: {
    countries: { key: 'c', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    type: { key: 't' },
    chartType: { key: 'ct' },
    chartStyle: { key: 'cs' },
    ageGroups: { key: 'ag', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    standardPopulation: { key: 'sp' },
    // NOTE: isExcess removed - view is determined by URL params (e, zs), not part of state
    showBaseline: { key: 'sb', decode: (v: any) => v === '1' || v === true },
    showPredictionInterval: { key: 'pi', decode: (v: any) => v === '1' || v === true },
    cumulative: { key: 'cum', decode: (v: any) => v === '1' || v === true },
    showPercentage: { key: 'pct', decode: (v: any) => v === '1' || v === true },
    showTotal: { key: 'tot', decode: (v: any) => v === '1' || v === true },
    maximize: { key: 'max', decode: (v: any) => v === '1' || v === true },
    showLogarithmic: { key: 'lg', decode: (v: any) => v === '1' || v === true },
    showLabels: { key: 'lbl', decode: (v: any) => v === '1' || v === true },
    baselineMethod: { key: 'bm' },
    baselineDateFrom: { key: 'bdf' },
    baselineDateTo: { key: 'bdt' },
    dateFrom: { key: 'df' },
    dateTo: { key: 'dt' },
    sliderStart: { key: 'ss' },
    userColors: { key: 'uc' },
    decimals: { key: 'dec' },
    showLogo: { key: 'logo', decode: (v: any) => v === '1' || v === true },
    showQrCode: { key: 'qr', decode: (v: any) => v === '1' || v === true },
    showCaption: { key: 'cap', decode: (v: any) => v === '1' || v === true },
    chartPreset: { key: 'preset' }
  }
}))

// Helper to create mock route
function createMockRoute(query: Record<string, any> = {}): RouteLocationNormalizedLoaded {
  return {
    query,
    params: {},
    path: '/explorer',
    name: 'explorer',
    matched: [],
    meta: {},
    fullPath: '/explorer',
    hash: '',
    redirectedFrom: undefined
  } as RouteLocationNormalizedLoaded
}

describe('StateResolver', () => {
  describe('resolveInitial', () => {
    it('should apply defaults when no URL params', () => {
      const route = createMockRoute({})
      const resolved = StateResolver.resolveInitial(route)

      // These should match Defaults in stateSerializer.ts (the single source of truth)
      expect(resolved.state.countries).toEqual(['USA', 'SWE'])
      expect(resolved.state.type).toBe('asmr')
      expect(resolved.state.showBaseline).toBe(true)
      expect(resolved.state.showPredictionInterval).toBe(true)
      expect(resolved.userOverrides.size).toBe(0)
    })

    it('should apply URL params as user overrides', () => {
      const route = createMockRoute({
        c: ['USA', 'SWE'],
        t: 'deaths',
        e: '1'
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.countries).toEqual(['USA', 'SWE'])
      expect(resolved.state.type).toBe('deaths')
      expect(resolved.userOverrides.has('countries')).toBe(true)
      expect(resolved.userOverrides.has('type')).toBe(true)
    })

    it('should apply constraints after URL params', () => {
      const route = createMockRoute({
        t: 'population' // population type
      })
      const resolved = StateResolver.resolveInitial(route)

      // Hard constraint: population disables baseline
      expect(resolved.state.showBaseline).toBe(false)
      // Hard constraint: population disables PI
      expect(resolved.state.showPredictionInterval).toBe(false)
    })

    it('should apply view defaults for excess view', () => {
      const route = createMockRoute({
        e: '1' // excess view
      })
      const resolved = StateResolver.resolveInitial(route)

      // View defaults from VIEWS.excess.defaults
      expect(resolved.state.view).toBe('excess')
      expect(resolved.state.chartStyle).toBe('bar') // excess default
      expect(resolved.state.showBaseline).toBe(true) // forced by constraint
      expect(resolved.state.showPercentage).toBe(true) // excess default
      expect(resolved.state.cumulative).toBe(false) // excess default
      expect(resolved.state.showLogarithmic).toBe(false) // excess default (forced)
    })

    it('should apply view defaults for zscore view', () => {
      const route = createMockRoute({
        zs: '1' // zscore view
      })
      const resolved = StateResolver.resolveInitial(route)

      // View defaults from VIEWS.zscore.defaults
      expect(resolved.state.view).toBe('zscore')
      expect(resolved.state.chartStyle).toBe('line') // zscore default
      expect(resolved.state.showBaseline).toBe(true) // forced by constraint
      expect(resolved.state.showPredictionInterval).toBe(false) // zscore default
      expect(resolved.state.showLogarithmic).toBe(false) // zscore default (forced)
    })

    it('should respect user overrides over view defaults', () => {
      const route = createMockRoute({
        e: '1', // excess view
        cs: 'line' // user explicitly sets line chart
      })
      const resolved = StateResolver.resolveInitial(route)

      // User override wins over view default
      expect(resolved.state.chartStyle).toBe('line') // user set, not 'bar'
      expect(resolved.userOverrides.has('chartStyle')).toBe(true)
    })

    it('should log view defaults in changes', () => {
      const route = createMockRoute({
        e: '1' // excess view
      })
      const resolved = StateResolver.resolveInitial(route)

      // Check that view defaults are logged
      const chartStyleChange = resolved.log.changes.find(c => c.field === 'chartStyle')
      expect(chartStyleChange).toBeDefined()
      expect(chartStyleChange?.priority).toBe('view-default')
      expect(chartStyleChange?.reason).toContain('Excess')
    })
  })
})
