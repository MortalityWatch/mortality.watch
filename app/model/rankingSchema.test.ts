import { describe, expect, it } from 'vitest'
import { rankingStateSchema, type RankingState } from './rankingSchema'

describe('rankingSchema', () => {
  // Helper to create a valid base state
  const createValidState = (): RankingState => ({
    periodOfTime: 'fluseason',
    jurisdictionType: 'countries',
    showASMR: true,
    showTotals: true,
    showTotalsOnly: false,
    showPercentage: true,
    showPI: false,
    cumulative: false,
    hideIncomplete: true,
    standardPopulation: 'who',
    baselineMethod: 'mean',
    decimalPrecision: '1',
    dateFrom: '2020/21',
    dateTo: '2023/24',
    baselineDateFrom: '2015/16', // Optional: Can be undefined to use computed defaults
    baselineDateTo: '2019/20' // Optional: Can be undefined to use computed defaults
  })

  describe('base validation', () => {
    it('should accept valid state', () => {
      const state = createValidState()
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept yearly period', () => {
      const state = createValidState()
      state.periodOfTime = 'yearly'
      state.dateFrom = '2020'
      state.dateTo = '2023'
      state.baselineDateFrom = '2015'
      state.baselineDateTo = '2019'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('Rule 1: ASMR requires standardPopulation', () => {
    it('should accept ASMR with standardPopulation', () => {
      const state = createValidState()
      state.showASMR = true
      state.standardPopulation = 'who'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject ASMR without standardPopulation', () => {
      const state = createValidState()
      state.showASMR = true
      state.standardPopulation = undefined as unknown as typeof state.standardPopulation
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should accept non-ASMR without standardPopulation check', () => {
      const state = createValidState()
      state.showASMR = false
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('Rule 2: showTotalsOnly requires showTotals', () => {
    it('should accept totals only when totals enabled', () => {
      const state = createValidState()
      state.showTotals = true
      state.showTotalsOnly = true
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject totals only when totals disabled', () => {
      const state = createValidState()
      state.showTotals = false
      state.showTotalsOnly = true
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('requires show totals')
      }
    })
  })

  describe('Rule 3: Prediction intervals not compatible with cumulative', () => {
    it('should accept PI without cumulative', () => {
      const state = createValidState()
      state.showPI = true
      state.cumulative = false
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject PI with cumulative', () => {
      const state = createValidState()
      state.showPI = true
      state.cumulative = true
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('cannot be shown with cumulative')
      }
    })
  })

  describe('Rule 4: Prediction intervals not compatible with totals only', () => {
    it('should accept PI without totals only', () => {
      const state = createValidState()
      state.showPI = true
      state.showTotalsOnly = false
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject PI with totals only', () => {
      const state = createValidState()
      state.showPI = true
      state.showTotalsOnly = true
      state.showTotals = true
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('cannot be shown with totals only')
      }
    })
  })

  describe('Rule 5: Date format must match period type', () => {
    describe('yearly periods', () => {
      it('should accept YYYY format', () => {
        const state = createValidState()
        state.periodOfTime = 'yearly'
        state.dateFrom = '2020'
        state.dateTo = '2023'
        state.baselineDateFrom = '2015'
        state.baselineDateTo = '2019'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY format for dateFrom', () => {
        const state = createValidState()
        state.periodOfTime = 'yearly'
        state.dateFrom = '2020/21'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY for yearly')
        }
      })

      it('should reject non-YYYY format for dateTo', () => {
        const state = createValidState()
        state.periodOfTime = 'yearly'
        state.dateFrom = '2020'
        state.dateTo = '2023/24'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY for yearly')
        }
      })
    })

    describe('fluseason/midyear/quarterly periods', () => {
      it('should accept YYYY/YY format for fluseason', () => {
        const state = createValidState()
        state.periodOfTime = 'fluseason'
        state.dateFrom = '2020/21'
        state.dateTo = '2023/24'
        state.baselineDateFrom = '2015/16'
        state.baselineDateTo = '2019/20'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should accept YYYY/YY format for midyear', () => {
        const state = createValidState()
        state.periodOfTime = 'midyear'
        state.dateFrom = '2020/21'
        state.dateTo = '2023/24'
        state.baselineDateFrom = '2015/16'
        state.baselineDateTo = '2019/20'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should accept YYYY/YY format for quarterly', () => {
        const state = createValidState()
        state.periodOfTime = 'quarterly'
        state.dateFrom = '2020/21'
        state.dateTo = '2023/24'
        state.baselineDateFrom = '2015/16'
        state.baselineDateTo = '2019/20'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })

      it('should reject non-YYYY/YY format', () => {
        const state = createValidState()
        state.periodOfTime = 'fluseason'
        state.dateFrom = '2020'
        const result = rankingStateSchema.safeParse(state)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY/YY')
        }
      })
    })
  })

  describe('Rule 6: dateFrom must be before or equal to dateTo', () => {
    it('should accept equal dates', () => {
      const state = createValidState()
      state.dateFrom = '2020/21'
      state.dateTo = '2020/21'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept dateFrom before dateTo', () => {
      const state = createValidState()
      state.dateFrom = '2020/21'
      state.dateTo = '2023/24'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject dateFrom after dateTo', () => {
      const state = createValidState()
      state.dateFrom = '2023/24'
      state.dateTo = '2020/21'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('before or equal to end date')
      }
    })
  })

  describe('Rule 7: Baseline dates must be before data dates', () => {
    it('should accept baseline before data period', () => {
      const state = createValidState()
      state.baselineDateFrom = '2015/16'
      state.baselineDateTo = '2019/20'
      state.dateFrom = '2020/21'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should allow baseline overlapping data period', () => {
      // Users are free to select any baseline range they want
      const state = createValidState()
      state.baselineDateFrom = '2020/21'
      state.baselineDateTo = '2021/22'
      state.dateFrom = '2020/21'
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('enum validation', () => {
    it('should reject invalid period type', () => {
      const state = createValidState()
      state.periodOfTime = 'invalid' as unknown as typeof state.periodOfTime
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid jurisdiction type', () => {
      const state = createValidState()
      state.jurisdictionType = 'invalid' as unknown as typeof state.jurisdictionType
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid standard population', () => {
      const state = createValidState()
      state.standardPopulation = 'invalid' as unknown as typeof state.standardPopulation
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid baseline method', () => {
      const state = createValidState()
      state.baselineMethod = 'invalid' as unknown as typeof state.baselineMethod
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject invalid decimal precision', () => {
      const state = createValidState()
      state.decimalPrecision = 'invalid' as unknown as typeof state.decimalPrecision
      const result = rankingStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })
})
