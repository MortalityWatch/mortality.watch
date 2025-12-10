import { describe, it, expect } from 'vitest'
import {
  validateBaselinePeriod,
  clampBaselinePeriod
} from './calculateBaselineRange'

describe('validateBaselinePeriod', () => {
  // Generate weekly labels for testing (e.g., "2010 W01", "2010 W02", ...)
  const generateWeeklyLabels = (startYear: number, years: number): string[] => {
    const labels: string[] = []
    for (let year = startYear; year < startYear + years; year++) {
      for (let week = 1; week <= 52; week++) {
        labels.push(`${year} W${week.toString().padStart(2, '0')}`)
      }
    }
    return labels
  }

  // Generate yearly labels for testing
  const generateYearlyLabels = (startYear: number, years: number): string[] => {
    const labels: string[] = []
    for (let year = startYear; year < startYear + years; year++) {
      labels.push(year.toString())
    }
    return labels
  }

  // Generate monthly labels for testing
  const generateMonthlyLabels = (startYear: number, years: number): string[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const labels: string[] = []
    for (let year = startYear; year < startYear + years; year++) {
      for (const month of months) {
        labels.push(`${year} ${month}`)
      }
    }
    return labels
  }

  describe('weekly chart type', () => {
    const weeklyLabels = generateWeeklyLabels(2000, 25) // 25 years of weekly data

    it('validates short baseline period as valid', () => {
      const result = validateBaselinePeriod(
        'weekly',
        weeklyLabels,
        '2015 W01',
        '2017 W52' // ~3 years = 156 weeks
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(156)
    })

    it('validates 10-year baseline as valid', () => {
      const result = validateBaselinePeriod(
        'weekly',
        weeklyLabels,
        '2005 W01',
        '2014 W52' // 10 years = 520 weeks
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(520)
      expect(result.maxPeriod).toBe(520)
    })

    it('rejects baseline exceeding 10 years', () => {
      const result = validateBaselinePeriod(
        'weekly',
        weeklyLabels,
        '2000 W01',
        '2015 W52' // ~16 years = 832 weeks
      )
      expect(result.isValid).toBe(false)
      expect(result.periodLength).toBe(832)
      expect(result.exceededBy).toBe(312) // 832 - 520
    })

    it('applies to weekly SMA variants', () => {
      const result = validateBaselinePeriod(
        'weekly_52w_sma',
        weeklyLabels,
        '2000 W01',
        '2015 W52'
      )
      expect(result.isValid).toBe(false)
      expect(result.maxPeriod).toBe(520)
    })
  })

  describe('yearly chart type', () => {
    const yearlyLabels = generateYearlyLabels(1990, 50) // 50 years

    it('validates 10-year baseline as valid', () => {
      const result = validateBaselinePeriod(
        'yearly',
        yearlyLabels,
        '2000',
        '2009'
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(10)
    })

    it('validates 30-year baseline as valid', () => {
      const result = validateBaselinePeriod(
        'yearly',
        yearlyLabels,
        '1990',
        '2019'
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(30)
      expect(result.maxPeriod).toBe(30)
    })

    it('rejects baseline exceeding 30 years', () => {
      const result = validateBaselinePeriod(
        'yearly',
        yearlyLabels,
        '1990',
        '2025'
      )
      expect(result.isValid).toBe(false)
      expect(result.periodLength).toBe(36)
      expect(result.exceededBy).toBe(6)
    })
  })

  describe('monthly chart type', () => {
    const monthlyLabels = generateMonthlyLabels(2000, 20) // 20 years

    it('validates 5-year baseline as valid', () => {
      const result = validateBaselinePeriod(
        'monthly',
        monthlyLabels,
        '2010 Jan',
        '2014 Dec' // 5 years = 60 months
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(60)
    })

    it('validates 15-year baseline as valid', () => {
      const result = validateBaselinePeriod(
        'monthly',
        monthlyLabels,
        '2000 Jan',
        '2014 Dec' // 15 years = 180 months
      )
      expect(result.isValid).toBe(true)
      expect(result.periodLength).toBe(180)
      expect(result.maxPeriod).toBe(180)
    })

    it('rejects baseline exceeding 15 years', () => {
      const result = validateBaselinePeriod(
        'monthly',
        monthlyLabels,
        '2000 Jan',
        '2019 Dec' // 20 years = 240 months
      )
      expect(result.isValid).toBe(false)
      expect(result.periodLength).toBe(240)
      expect(result.exceededBy).toBe(60)
    })
  })

  describe('edge cases', () => {
    it('handles dates not in labels', () => {
      const result = validateBaselinePeriod(
        'yearly',
        ['2000', '2001', '2002'],
        '1999',
        '2001'
      )
      expect(result.isValid).toBe(false)
      expect(result.periodLength).toBe(0)
    })

    it('handles empty labels', () => {
      const result = validateBaselinePeriod(
        'yearly',
        [],
        '2000',
        '2001'
      )
      expect(result.isValid).toBe(false)
    })
  })
})

describe('clampBaselinePeriod', () => {
  const generateWeeklyLabels = (startYear: number, years: number): string[] => {
    const labels: string[] = []
    for (let year = startYear; year < startYear + years; year++) {
      for (let week = 1; week <= 52; week++) {
        labels.push(`${year} W${week.toString().padStart(2, '0')}`)
      }
    }
    return labels
  }

  it('returns unchanged period when within limits', () => {
    const weeklyLabels = generateWeeklyLabels(2010, 10)
    const result = clampBaselinePeriod(
      'weekly',
      weeklyLabels,
      '2015 W01',
      '2017 W52'
    )
    expect(result.from).toBe('2015 W01')
    expect(result.to).toBe('2017 W52')
  })

  it('clamps end date when period exceeds limit', () => {
    const weeklyLabels = generateWeeklyLabels(2000, 25)
    const result = clampBaselinePeriod(
      'weekly',
      weeklyLabels,
      '2000 W01',
      '2020 W52' // 21 years - way over limit
    )
    expect(result.from).toBe('2000 W01')
    // Should clamp to 10 years (520 weeks) from start
    // 2000 W01 + 519 indices = 2009 W52
    expect(result.to).toBe('2009 W52')
  })

  it('handles from date not in labels', () => {
    const weeklyLabels = generateWeeklyLabels(2010, 10)
    const result = clampBaselinePeriod(
      'weekly',
      weeklyLabels,
      '1990 W01', // Not in labels
      '2015 W52'
    )
    // Returns unchanged when from not found
    expect(result.from).toBe('1990 W01')
    expect(result.to).toBe('2015 W52')
  })
})
