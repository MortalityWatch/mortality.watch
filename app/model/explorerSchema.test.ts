import { describe, expect, it } from 'vitest'
import { explorerStateSchema, type ExplorerState } from './explorerSchema'

describe('explorerSchema', () => {
  // Helper to create a valid base state
  const createValidState = (): ExplorerState => ({
    countries: ['USA', 'SWE'],
    ageGroups: ['all'],
    chartType: 'yearly',
    type: 'asmr',
    standardPopulation: 'who',
    chartStyle: 'line',
    dateFrom: '2020',
    dateTo: '2023',
    sliderStart: '2020',
    showBaseline: true,
    baselineMethod: 'mean',
    baselineDateFrom: '2015',
    baselineDateTo: '2019',
    isExcess: false,
    cumulative: false,
    showPredictionInterval: true,
    showTotal: false,
    showPercentage: false,
    maximize: false,
    showLabels: true,
    isLogarithmic: false,
    decimals: 'auto'
  })

  describe('base validation', () => {
    it('should accept valid state', () => {
      const state = createValidState()
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should require at least one country', () => {
      const state = createValidState()
      state.countries = []
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('At least one country')
      }
    })

    it('should reject more than 10 countries', () => {
      const state = createValidState()
      state.countries = Array(11).fill('USA')
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Maximum 10 countries')
      }
    })

    it('should require at least one age group', () => {
      const state = createValidState()
      state.ageGroups = []
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('At least one age group')
      }
    })
  })

  describe('Rule 1: ASMR requires standardPopulation', () => {
    it('should accept ASMR with standardPopulation', () => {
      const state = createValidState()
      state.type = 'asmr'
      state.standardPopulation = 'who'
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject ASMR without standardPopulation', () => {
      const state = createValidState()
      state.type = 'asmr'
      state.standardPopulation = undefined as unknown as typeof state.standardPopulation
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })

  describe('Rule 2: Excess mode requires baseline', () => {
    it('should accept excess WITH baseline', () => {
      const state = createValidState()
      state.isExcess = true
      state.showBaseline = true
      state.showPredictionInterval = false // PI can be OFF in excess mode
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept baseline without excess', () => {
      const state = createValidState()
      state.isExcess = false
      state.showBaseline = true
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject excess WITHOUT baseline', () => {
      const state = createValidState()
      state.isExcess = true
      state.showBaseline = false
      state.showPredictionInterval = false
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Excess mode requires baseline')
      }
    })
  })

  describe('Rule 3: Date format must match chart type', () => {
    describe('yearly charts', () => {
      it('should accept YYYY format', () => {
        const state = createValidState()
        state.chartType = 'yearly'
        state.dateFrom = '2020'
        state.dateTo = '2023'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY format', () => {
        const state = createValidState()
        state.chartType = 'yearly'
        state.dateFrom = '2020-01'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY for yearly')
        }
      })
    })

    describe('monthly charts', () => {
      it('should accept YYYY-MM format', () => {
        const state = createValidState()
        state.chartType = 'monthly'
        state.dateFrom = '2020-01'
        state.dateTo = '2023-12'
        state.baselineDateFrom = '2015-01'
        state.baselineDateTo = '2019-12'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY-MM format', () => {
        const state = createValidState()
        state.chartType = 'monthly'
        state.dateFrom = '2020'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY-MM for monthly')
        }
      })
    })

    describe('weekly charts', () => {
      it('should accept YYYY-WNN format', () => {
        const state = createValidState()
        state.chartType = 'weekly'
        state.dateFrom = '2020-W01'
        state.dateTo = '2023-W52'
        state.baselineDateFrom = '2015-W01'
        state.baselineDateTo = '2019-W52'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY-WNN format', () => {
        const state = createValidState()
        state.chartType = 'weekly'
        state.dateFrom = '2020'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY-WNN for weekly')
        }
      })

      it('should validate weekly SMA variants', () => {
        const state = createValidState()
        state.chartType = 'weekly_52w_sma'
        state.dateFrom = '2020-W01'
        state.dateTo = '2023-W52'
        state.baselineDateFrom = '2015-W01'
        state.baselineDateTo = '2019-W52'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })
    })

    describe('fluseason/midyear charts', () => {
      it('should accept YYYY/YY format', () => {
        const state = createValidState()
        state.chartType = 'fluseason'
        state.dateFrom = '2020/21'
        state.dateTo = '2023/24'
        state.baselineDateFrom = '2015/16'
        state.baselineDateTo = '2019/20'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY/YY format', () => {
        const state = createValidState()
        state.chartType = 'fluseason'
        state.dateFrom = '2020'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY/YY for flu season')
        }
      })

      it('should validate midyear variant', () => {
        const state = createValidState()
        state.chartType = 'midyear'
        state.dateFrom = '2020/21'
        state.dateTo = '2023/24'
        state.baselineDateFrom = '2015/16'
        state.baselineDateTo = '2019/20'
        const result = explorerStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Rule 4: dateFrom must be before or equal to dateTo', () => {
    it('should accept equal dates', () => {
      const state = createValidState()
      state.dateFrom = '2020'
      state.dateTo = '2020'
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept dateFrom before dateTo', () => {
      const state = createValidState()
      state.dateFrom = '2020'
      state.dateTo = '2023'
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject dateFrom after dateTo', () => {
      const state = createValidState()
      state.dateFrom = '2023'
      state.dateTo = '2020'
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('before or equal to end date')
      }
    })
  })

  describe('Rule 5: Baseline dates must be before data dates', () => {
    it('should accept baseline before data period', () => {
      const state = createValidState()
      state.showBaseline = true
      state.baselineDateFrom = '2015'
      state.baselineDateTo = '2019'
      state.dateFrom = '2020'
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should allow baseline overlapping data period', () => {
      const state = createValidState()
      state.showBaseline = true
      state.baselineDateFrom = '2020'
      state.baselineDateTo = '2021'
      state.dateFrom = '2020'
      const result = explorerStateSchema.safeParse(state)
      // Baseline can overlap with data period as baselines often use historical data
      expect(result.success).toBe(true)
    })
  })

  describe('Rule 6: Population type restrictions', () => {
    it('should accept population without baseline', () => {
      const state = createValidState()
      state.type = 'population'
      state.showBaseline = false
      state.isExcess = false
      state.showPredictionInterval = false // Prediction intervals require baseline
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject population with baseline', () => {
      const state = createValidState()
      state.type = 'population'
      state.showBaseline = true
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(e =>
          e.message.includes('Population metric does not support baseline')
        )).toBe(true)
      }
    })

    it('should reject population with excess', () => {
      const state = createValidState()
      state.type = 'population'
      state.showBaseline = false
      state.isExcess = true
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(e =>
          e.message.includes('Population metric does not support excess')
        )).toBe(true)
      }
    })
  })

  describe('Rule 7: Prediction intervals require baseline OR excess mode', () => {
    it('should accept prediction intervals with baseline', () => {
      const state = createValidState()
      state.showPredictionInterval = true
      state.showBaseline = true
      state.isExcess = false
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept prediction intervals in excess mode (baseline always ON)', () => {
      const state = createValidState()
      state.showPredictionInterval = true
      state.showBaseline = true // Required by Rule 2
      state.isExcess = true
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject prediction intervals without baseline (normal mode)', () => {
      const state = createValidState()
      state.showPredictionInterval = true
      state.showBaseline = false
      state.isExcess = false
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('require baseline')
      }
    })
  })

  describe('enum validation', () => {
    it('should reject invalid chart type', () => {
      const state = createValidState()
      state.chartType = 'invalid' as unknown as typeof state.chartType
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid metric type', () => {
      const state = createValidState()
      state.type = 'invalid' as unknown as typeof state.type
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid standard population', () => {
      const state = createValidState()
      state.standardPopulation = 'invalid' as unknown as typeof state.standardPopulation
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid baseline method', () => {
      const state = createValidState()
      state.baselineMethod = 'invalid' as unknown as typeof state.baselineMethod
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid chart style', () => {
      const state = createValidState()
      state.chartStyle = 'invalid' as unknown as typeof state.chartStyle
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid decimal precision', () => {
      const state = createValidState()
      state.decimals = 'invalid' as unknown as typeof state.decimals
      const result = explorerStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })
})
