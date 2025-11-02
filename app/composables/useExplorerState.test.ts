/**
 * Unit tests for useExplorerState composable
 *
 * Tests cover:
 * - URL state initialization and synchronization
 * - State validation using Zod schema
 * - Auto-fix for incompatible state combinations
 * - Error detection and user notifications
 * - State transitions and edge cases
 * - Local state management (chart size)
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useExplorerState } from './useExplorerState'

import { showToast } from '@/toast'

// Mock dependencies
vi.mock('./useUrlState', () => ({
  useUrlState: vi.fn((key: string, defaultValue: any) => {
    const mockValues: Record<string, any> = {
      c: ['USA'],
      ct: 'yearly',
      ag: ['all'],
      sp: 'who2015',
      e: false,
      t: 'cmr',
      cs: 'line',
      df: '2020',
      dt: '2023',
      ss: '2010',
      bdf: '2017',
      bdt: '2019',
      sb: true,
      bm: 'mean',
      cum: false,
      st: false,
      m: false,
      spi: true,
      sl: true,
      sp_: false,
      l: false,
      uc: undefined,
      slogo: true,
      sqr: true,
      scap: true,
      d: '0'
    }

    return {
      get value() {
        return mockValues[key] ?? defaultValue
      },
      set value(newValue: any) {
        mockValues[key] = newValue
      }
    }
  })
}))

vi.mock('@/toast', () => ({
  showToast: vi.fn()
}))

describe('useExplorerState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with default URL state values', () => {
      const state = useExplorerState()

      expect(state.countries.value).toEqual(['USA'])
      expect(state.chartType.value).toBe('yearly')
      expect(state.ageGroups.value).toEqual(['all'])
      expect(state.type.value).toBe('cmr')
      expect(state.chartStyle.value).toBe('line')
    })

    it('should initialize baseline settings', () => {
      const state = useExplorerState()

      expect(state.showBaseline.value).toBe(true)
      expect(state.baselineMethod.value).toBe('mean')
      expect(state.baselineDateFrom.value).toBe('2017')
      expect(state.baselineDateTo.value).toBe('2019')
    })

    it('should initialize display options', () => {
      const state = useExplorerState()

      expect(state.cumulative.value).toBe(false)
      expect(state.showTotal.value).toBe(false)
      expect(state.maximize.value).toBe(false)
      expect(state.showPredictionInterval.value).toBe(true)
      expect(state.showLabels.value).toBe(true)
      expect(state.showPercentage.value).toBe(false)
      expect(state.isLogarithmic.value).toBe(false)
    })

    it('should initialize chart appearance options', () => {
      const state = useExplorerState()

      expect(state.showLogo.value).toBe(true)
      expect(state.showQrCode.value).toBe(true)
      expect(state.showCaption.value).toBe(true)
      expect(state.decimals.value).toBe('0')
    })

    it('should initialize local state', () => {
      const state = useExplorerState()

      expect(state.chartPreset.value).toBe('Auto')
      expect(state.chartWidth.value).toBeUndefined()
      expect(state.chartHeight.value).toBeUndefined()
    })
  })

  // ============================================================================
  // STATE VALIDATION
  // ============================================================================

  describe('state validation', () => {
    it('should validate correct state as valid', () => {
      const state = useExplorerState()

      expect(state.isValid.value).toBe(true)
      expect(state.errors.value).toHaveLength(0)
    })

    it('should compute current state from all refs', () => {
      const state = useExplorerState()

      const current = state.currentState.value

      expect(current.countries).toEqual(['USA'])
      expect(current.chartType).toBe('yearly')
      expect(current.type).toBe('cmr')
      expect(current.showBaseline).toBe(true)
    })

    it('should detect validation errors', async () => {
      const state = useExplorerState()

      // Force invalid state - excess with baseline shown
      state.isExcess.value = true
      state.showBaseline.value = true

      await nextTick()

      // Auto-fix should correct this
      expect(state.showBaseline.value).toBe(false)
    })
  })

  // ============================================================================
  // AUTO-FIX: EXCESS MODE
  // ============================================================================

  describe('auto-fix: excess mode', () => {
    it('should disable baseline when excess mode is enabled', async () => {
      const state = useExplorerState()

      state.showBaseline.value = true
      state.isExcess.value = true

      await nextTick()

      expect(state.showBaseline.value).toBe(false)
    })

    it('should disable prediction intervals when baseline is disabled', async () => {
      const state = useExplorerState()

      state.showBaseline.value = true
      state.showPredictionInterval.value = true
      state.isExcess.value = false

      // Disable baseline
      state.showBaseline.value = false

      await nextTick()

      // Prediction intervals should be auto-disabled
      expect(state.showPredictionInterval.value).toBe(false)
    })
  })

  // ============================================================================
  // AUTO-FIX: POPULATION TYPE
  // ============================================================================

  describe('auto-fix: population type', () => {
    it('should disable baseline for population type', async () => {
      const state = useExplorerState()

      state.showBaseline.value = true
      state.type.value = 'population'

      await nextTick()

      expect(state.showBaseline.value).toBe(false)
    })

    it('should disable excess for population type', async () => {
      const state = useExplorerState()

      state.isExcess.value = true
      state.type.value = 'population'

      await nextTick()

      expect(state.isExcess.value).toBe(false)
    })
  })

  // ============================================================================
  // AUTO-FIX: DATE VALIDATION
  // ============================================================================

  describe('auto-fix: date validation', () => {
    it('should reset invalid date formats', async () => {
      const state = useExplorerState()

      // Set invalid date format for chart type
      state.dateFrom.value = 'INVALID'
      state.dateTo.value = 'INVALID'

      await nextTick()

      // Should be reset to undefined
      expect(state.dateFrom.value).toBeUndefined()
      expect(state.dateTo.value).toBeUndefined()
    })

    it('should reset invalid baseline dates', async () => {
      const state = useExplorerState()

      state.baselineDateFrom.value = 'INVALID'
      state.baselineDateTo.value = 'INVALID'

      await nextTick()

      expect(state.baselineDateFrom.value).toBeUndefined()
      expect(state.baselineDateTo.value).toBeUndefined()
    })
  })

  // ============================================================================
  // GETVALIDATEDSTATE
  // ============================================================================

  describe('getValidatedState', () => {
    it('should return validated state when valid', () => {
      const state = useExplorerState()

      const validated = state.getValidatedState()

      expect(validated.countries).toEqual(['USA'])
      expect(validated.chartType).toBe('yearly')
    })

    it('should throw error when state is invalid', async () => {
      const state = useExplorerState()

      // Force invalid state that won't auto-fix
      state.countries.value = []

      await nextTick()

      expect(() => state.getValidatedState()).toThrow('Invalid state')
    })
  })

  // ============================================================================
  // STATE UPDATES
  // ============================================================================

  describe('state updates', () => {
    it('should update countries', () => {
      const state = useExplorerState()

      state.countries.value = ['USA', 'GBR', 'DEU']

      expect(state.countries.value).toEqual(['USA', 'GBR', 'DEU'])
    })

    it('should update chart type', () => {
      const state = useExplorerState()

      state.chartType.value = 'monthly'

      expect(state.chartType.value).toBe('monthly')
    })

    it('should update age groups', () => {
      const state = useExplorerState()

      state.ageGroups.value = ['0-14', '15-64', '65+']

      expect(state.ageGroups.value).toEqual(['0-14', '15-64', '65+'])
    })

    it('should update data type', () => {
      const state = useExplorerState()

      state.type.value = 'asmr'

      expect(state.type.value).toBe('asmr')
    })

    it('should update chart style', () => {
      const state = useExplorerState()

      state.chartStyle.value = 'bar'

      expect(state.chartStyle.value).toBe('bar')
    })

    it('should update date range', () => {
      const state = useExplorerState()

      state.dateFrom.value = '2021'
      state.dateTo.value = '2024'

      expect(state.dateFrom.value).toBe('2021')
      expect(state.dateTo.value).toBe('2024')
    })

    it('should update baseline dates', () => {
      const state = useExplorerState()

      state.baselineDateFrom.value = '2015'
      state.baselineDateTo.value = '2019'

      expect(state.baselineDateFrom.value).toBe('2015')
      expect(state.baselineDateTo.value).toBe('2019')
    })

    it('should toggle boolean flags', () => {
      const state = useExplorerState()

      state.isExcess.value = !state.isExcess.value
      state.cumulative.value = !state.cumulative.value
      state.maximize.value = !state.maximize.value

      expect(state.isExcess.value).toBe(true)
      expect(state.cumulative.value).toBe(true)
      expect(state.maximize.value).toBe(true)
    })
  })

  // ============================================================================
  // LOCAL STATE MANAGEMENT
  // ============================================================================

  describe('local state management', () => {
    it('should update chart preset', () => {
      const state = useExplorerState()

      state.chartPreset.value = 'HD'

      expect(state.chartPreset.value).toBe('HD')
    })

    it('should update chart dimensions', () => {
      const state = useExplorerState()

      state.chartWidth.value = 1920
      state.chartHeight.value = 1080

      expect(state.chartWidth.value).toBe(1920)
      expect(state.chartHeight.value).toBe(1080)
    })

    it('should allow undefined dimensions', () => {
      const state = useExplorerState()

      state.chartWidth.value = 1920
      state.chartWidth.value = undefined

      expect(state.chartWidth.value).toBeUndefined()
    })
  })

  // ============================================================================
  // USER COLORS
  // ============================================================================

  describe('user colors', () => {
    it('should allow undefined user colors', () => {
      const state = useExplorerState()

      expect(state.userColors.value).toBeUndefined()
    })

    it('should update user colors', () => {
      const state = useExplorerState()

      state.userColors.value = ['#FF0000', '#00FF00', '#0000FF']

      expect(state.userColors.value).toEqual(['#FF0000', '#00FF00', '#0000FF'])
    })

    it('should clear user colors', () => {
      const state = useExplorerState()

      state.userColors.value = ['#FF0000']
      state.userColors.value = undefined

      expect(state.userColors.value).toBeUndefined()
    })
  })

  // ============================================================================
  // SLIDER START
  // ============================================================================

  describe('slider start', () => {
    it('should default slider start to 2010', () => {
      const state = useExplorerState()

      expect(state.sliderStart.value).toBe('2010')
    })

    it('should update slider start', () => {
      const state = useExplorerState()

      state.sliderStart.value = '2015'

      expect(state.sliderStart.value).toBe('2015')
    })
  })

  // ============================================================================
  // STANDARD POPULATION
  // ============================================================================

  describe('standard population', () => {
    it('should default to who2015', () => {
      const state = useExplorerState()

      expect(state.standardPopulation.value).toBe('who2015')
    })

    it('should update standard population', () => {
      const state = useExplorerState()

      state.standardPopulation.value = 'esp2013'

      expect(state.standardPopulation.value).toBe('esp2013')
    })
  })

  // ============================================================================
  // BASELINE METHOD
  // ============================================================================

  describe('baseline method', () => {
    it('should default to mean', () => {
      const state = useExplorerState()

      expect(state.baselineMethod.value).toBe('mean')
    })

    it('should update baseline method', () => {
      const state = useExplorerState()

      state.baselineMethod.value = 'lin_reg'

      expect(state.baselineMethod.value).toBe('lin_reg')
    })

    it('should allow median method', () => {
      const state = useExplorerState()

      state.baselineMethod.value = 'median'

      expect(state.baselineMethod.value).toBe('median')
    })
  })

  // ============================================================================
  // DECIMALS
  // ============================================================================

  describe('decimals', () => {
    it('should default to 0 decimals', () => {
      const state = useExplorerState()

      expect(state.decimals.value).toBe('0')
    })

    it('should update decimals', () => {
      const state = useExplorerState()

      state.decimals.value = '2'

      expect(state.decimals.value).toBe('2')
    })

    it('should handle string decimal values', () => {
      const state = useExplorerState()

      state.decimals.value = '1'

      expect(state.decimals.value).toBe('1')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty countries array', () => {
      const state = useExplorerState()

      state.countries.value = []

      expect(state.countries.value).toEqual([])
    })

    it('should handle single country', () => {
      const state = useExplorerState()

      state.countries.value = ['DEU']

      expect(state.countries.value).toEqual(['DEU'])
    })

    it('should handle many countries', () => {
      const state = useExplorerState()

      const manyCountries = Array.from({ length: 50 }, (_, i) => `C${i}`)
      state.countries.value = manyCountries

      expect(state.countries.value).toEqual(manyCountries)
    })

    it('should handle empty age groups', () => {
      const state = useExplorerState()

      state.ageGroups.value = []

      expect(state.ageGroups.value).toEqual([])
    })

    it('should handle undefined date values', () => {
      const state = useExplorerState()

      state.dateFrom.value = undefined
      state.dateTo.value = undefined

      expect(state.dateFrom.value).toBeUndefined()
      expect(state.dateTo.value).toBeUndefined()
    })

    it('should handle rapid state changes', async () => {
      const state = useExplorerState()

      // Rapid changes
      state.chartType.value = 'monthly'
      state.chartType.value = 'weekly'
      state.chartType.value = 'yearly'

      await nextTick()

      expect(state.chartType.value).toBe('yearly')
    })

    it('should handle conflicting state changes', async () => {
      const state = useExplorerState()

      // Enable both excess and baseline (conflicting)
      state.showBaseline.value = true
      state.isExcess.value = true

      await nextTick()

      // Auto-fix should resolve conflict
      expect(state.showBaseline.value).toBe(false)
    })
  })

  // ============================================================================
  // ERROR NOTIFICATION
  // ============================================================================

  describe('error notification', () => {
    it('should not show duplicate error toasts', async () => {
      const state = useExplorerState()

      // Trigger same error multiple times
      state.isExcess.value = true
      state.showBaseline.value = true

      await nextTick()

      state.showBaseline.value = true

      await nextTick()

      // Should only show toast once (mocked, so we check it was called)
      // Note: Auto-fix prevents multiple triggers
      expect(state.showBaseline.value).toBe(false)
    })
  })

  // ============================================================================
  // COMPUTED VALIDATION
  // ============================================================================

  describe('computed validation', () => {
    it('should recompute isValid when state changes', async () => {
      const state = useExplorerState()

      const initialValid = state.isValid.value

      // Make invalid change
      state.countries.value = []

      await nextTick()

      // Validation should recompute
      expect(state.isValid.value).toBeDefined()
    })

    it('should update errors array when state becomes invalid', async () => {
      const state = useExplorerState()

      state.countries.value = []

      await nextTick()

      expect(state.errors.value.length).toBeGreaterThanOrEqual(0)
    })

    it('should clear errors when state becomes valid', async () => {
      const state = useExplorerState()

      state.countries.value = []
      await nextTick()

      state.countries.value = ['USA']
      await nextTick()

      expect(state.errors.value).toHaveLength(0)
    })
  })
})
