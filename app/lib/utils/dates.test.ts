import { describe, it, expect } from 'vitest'
import {
  getISOWeek,
  getISOWeekFromUTC,
  isoDateToPeriod,
  months,
  getYear,
  getMonth,
  maybeTransformFluSeason
} from './dates'

describe('dates', () => {
  describe('getISOWeekFromUTC', () => {
    it('should calculate correct week for first week of year', () => {
      // 2025-01-01 is a Wednesday, Week 1
      const date = new Date(Date.UTC(2025, 0, 1))
      expect(getISOWeekFromUTC(date)).toEqual({ year: 2025, week: 1 })
    })

    it('should calculate correct week for last week of year', () => {
      // 2025-12-29 is a Monday, Week 1 of 2026
      const date = new Date(Date.UTC(2025, 11, 29))
      expect(getISOWeekFromUTC(date)).toEqual({ year: 2026, week: 1 })
    })

    it('should handle week 52/53 boundary correctly', () => {
      // 2025-12-28 is a Sunday, Week 52 of 2025
      const date = new Date(Date.UTC(2025, 11, 28))
      expect(getISOWeekFromUTC(date)).toEqual({ year: 2025, week: 52 })
    })

    it('should calculate week 50 correctly', () => {
      // 2025-12-08 is a Monday, Week 50
      const date = new Date(Date.UTC(2025, 11, 8))
      expect(getISOWeekFromUTC(date)).toEqual({ year: 2025, week: 50 })

      // 2025-12-14 is a Sunday, still Week 50
      const date2 = new Date(Date.UTC(2025, 11, 14))
      expect(getISOWeekFromUTC(date2)).toEqual({ year: 2025, week: 50 })
    })

    it('should calculate week 49 correctly', () => {
      // 2025-12-01 is a Monday, Week 49
      const date = new Date(Date.UTC(2025, 11, 1))
      expect(getISOWeekFromUTC(date)).toEqual({ year: 2025, week: 49 })

      // 2025-12-07 is a Sunday, still Week 49
      const date2 = new Date(Date.UTC(2025, 11, 7))
      expect(getISOWeekFromUTC(date2)).toEqual({ year: 2025, week: 49 })
    })

    it('should not mutate the input date', () => {
      const original = new Date(Date.UTC(2025, 11, 8))
      const originalTime = original.getTime()
      getISOWeekFromUTC(original)
      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('isoDateToPeriod', () => {
    describe('weekly chart types', () => {
      const weeklyTypes = ['weekly', 'weekly_13w_sma', 'weekly_26w_sma', 'weekly_52w_sma', 'weekly_104w_sma']

      it.each(weeklyTypes)('should convert dates correctly for %s', (chartType) => {
        // Week 49 boundary
        expect(isoDateToPeriod('2025-12-01', chartType)).toBe('2025 W49')
        expect(isoDateToPeriod('2025-12-07', chartType)).toBe('2025 W49')

        // Week 50 boundary
        expect(isoDateToPeriod('2025-12-08', chartType)).toBe('2025 W50')
        expect(isoDateToPeriod('2025-12-14', chartType)).toBe('2025 W50')

        // Week 51 boundary
        expect(isoDateToPeriod('2025-12-15', chartType)).toBe('2025 W51')
      })

      it('should handle year transitions correctly', () => {
        // 2025-12-29 is Week 1 of 2026
        expect(isoDateToPeriod('2025-12-29', 'weekly')).toBe('2026 W01')

        // 2024-12-30 is Week 1 of 2025
        expect(isoDateToPeriod('2024-12-30', 'weekly')).toBe('2025 W01')
      })

      it('should pad week numbers correctly', () => {
        expect(isoDateToPeriod('2025-01-06', 'weekly')).toBe('2025 W02')
        expect(isoDateToPeriod('2025-02-24', 'weekly')).toBe('2025 W09')
      })

      it('should handle timezone edge cases consistently', () => {
        // These dates are at week boundaries and could be affected by timezone bugs
        // The fix ensures they always produce correct results regardless of local timezone
        const edgeCases = [
          { date: '2025-12-08', expected: '2025 W50' }, // Monday of W50
          { date: '2025-12-01', expected: '2025 W49' }, // Monday of W49
          { date: '2025-12-15', expected: '2025 W51' } // Monday of W51
        ]

        for (const { date, expected } of edgeCases) {
          expect(isoDateToPeriod(date, 'weekly')).toBe(expected)
        }
      })
    })

    describe('monthly chart type', () => {
      it('should convert dates to month format', () => {
        expect(isoDateToPeriod('2025-01-15', 'monthly')).toBe('2025 Jan')
        expect(isoDateToPeriod('2025-06-01', 'monthly')).toBe('2025 Jun')
        expect(isoDateToPeriod('2025-12-31', 'monthly')).toBe('2025 Dec')
      })
    })

    describe('quarterly chart type', () => {
      it('should convert dates to quarter format', () => {
        expect(isoDateToPeriod('2025-01-01', 'quarterly')).toBe('2025 Q1')
        expect(isoDateToPeriod('2025-03-31', 'quarterly')).toBe('2025 Q1')
        expect(isoDateToPeriod('2025-04-01', 'quarterly')).toBe('2025 Q2')
        expect(isoDateToPeriod('2025-07-01', 'quarterly')).toBe('2025 Q3')
        expect(isoDateToPeriod('2025-10-01', 'quarterly')).toBe('2025 Q4')
        expect(isoDateToPeriod('2025-12-31', 'quarterly')).toBe('2025 Q4')
      })
    })

    describe('yearly chart type', () => {
      it('should return just the year', () => {
        expect(isoDateToPeriod('2025-01-01', 'yearly')).toBe('2025')
        expect(isoDateToPeriod('2025-12-31', 'yearly')).toBe('2025')
      })
    })
  })

  describe('getISOWeek', () => {
    it('should calculate correct week from local Date', () => {
      // This function uses local time, so behavior may vary by timezone
      // Test with a mid-week date that's less likely to have timezone issues
      const date = new Date(2025, 0, 2) // Jan 2, 2025 - Thursday, Week 1
      const result = getISOWeek(date)
      expect(result.year).toBe(2025)
      expect(result.week).toBe(1)
    })
  })

  describe('helper functions', () => {
    it('months array should have 12 months', () => {
      expect(months).toHaveLength(12)
      expect(months[0]).toBe('Jan')
      expect(months[11]).toBe('Dec')
    })

    it('getYear should extract year from date string', () => {
      expect(getYear('2025 W50')).toBe(2025)
      expect(getYear('2025 Jan')).toBe(2025)
      expect(getYear('2025/26')).toBe(2025)
    })

    it('getMonth should extract month index from date string', () => {
      expect(getMonth('2025 Jan')).toBe(0)
      expect(getMonth('2025 Dec')).toBe(11)
      expect(getMonth('2025 Jun')).toBe(5)
    })

    it('maybeTransformFluSeason should convert YYYY-YYYY to YYYY/YY format', () => {
      expect(maybeTransformFluSeason('2024-2025')).toBe('2024/25')
      expect(maybeTransformFluSeason('2019-2020')).toBe('2019/20')
    })

    it('maybeTransformFluSeason should pass through other formats', () => {
      expect(maybeTransformFluSeason('2024/25')).toBe('2024/25')
      expect(maybeTransformFluSeason('2025 W50')).toBe('2025 W50')
      expect(maybeTransformFluSeason('2025')).toBe('2025')
    })
  })
})
