import { describe, expect, it } from 'vitest'
import { ChartPeriod, DateRange } from './period'

describe('ChartPeriod', () => {
  describe('constructor', () => {
    it('should create a period with valid labels', () => {
      const labels = ['2020', '2021', '2022']
      const period = new ChartPeriod(labels, 'yearly')
      expect(period.allLabels).toEqual(labels)
      expect(period.type).toBe('yearly')
    })

    it('should throw error with empty labels', () => {
      expect(() => new ChartPeriod([], 'yearly')).toThrow()
    })
  })

  describe('indexOf', () => {
    it('should return correct index for exact match', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.indexOf('2021')).toBe(1)
    })

    it('should find closest year when exact match not found', () => {
      const period = new ChartPeriod(['2020-Jan', '2020-Feb', '2021-Jan'], 'monthly')
      const idx = period.indexOf('2020-Mar')
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(period.labelAt(idx)).toMatch(/^2020/)
    })

    it('should fallback to first label for invalid date', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.indexOf('invalid')).toBe(0)
    })
  })

  describe('labelAt', () => {
    it('should return label at valid index', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.labelAt(1)).toBe('2021')
    })

    it('should return undefined for invalid index', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.labelAt(10)).toBeUndefined()
    })
  })

  describe('findClosestDate', () => {
    it('should find exact match', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.findClosestDate('2021')).toBe('2021')
    })

    it('should find closest year for monthly labels', () => {
      const period = new ChartPeriod(['2020-Jan', '2020-Feb', '2021-Jan'], 'monthly')
      const closest = period.findClosestDate('2020-Mar')
      expect(closest).toMatch(/^2020/)
    })

    it('should find nearest year when target year not available', () => {
      const period = new ChartPeriod(['2020', '2022'], 'yearly')
      const closest = period.findClosestDate('2021')
      expect(closest).toMatch(/^202[02]/)
    })
  })

  describe('createRange', () => {
    it('should create valid date range', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      const range = period.createRange('2020', '2022')
      expect(range.from).toBe('2020')
      expect(range.to).toBe('2022')
      expect(range.length).toBe(3)
    })
  })

  describe('isValidRange', () => {
    it('should return true for valid range', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.isValidRange('2020', '2022')).toBe(true)
    })

    it('should return true even when dates do not exist (uses fallback)', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      // indexOf with fallback will find closest dates
      expect(period.isValidRange('2019', '2023')).toBe(true)
    })
  })

  describe('contains', () => {
    it('should return true for existing date', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.contains('2021')).toBe(true)
    })

    it('should return false for non-existing date', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.contains('2023')).toBe(false)
    })
  })

  describe('boundary properties', () => {
    it('should return correct first and last labels', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.firstLabel).toBe('2020')
      expect(period.lastLabel).toBe('2022')
    })

    it('should return correct length', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      expect(period.length).toBe(3)
    })
  })
})

describe('DateRange', () => {
  describe('indices', () => {
    it('should return correct fromIndex and toIndex', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.fromIndex).toBe(1)
      expect(range.toIndex).toBe(3)
    })
  })

  describe('labels', () => {
    it('should return labels in range (inclusive)', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.labels).toEqual(['2021', '2022', '2023'])
    })

    it('should return single label for same from/to', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      const range = new DateRange(period, '2021', '2021')
      expect(range.labels).toEqual(['2021'])
    })
  })

  describe('contains', () => {
    it('should return true for date within range', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.contains('2022')).toBe(true)
    })

    it('should return false for date outside range', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.contains('2020')).toBe(false)
    })

    it('should include boundary dates', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.contains('2021')).toBe(true)
      expect(range.contains('2023')).toBe(true)
    })
  })

  describe('length', () => {
    it('should return correct length', () => {
      const period = new ChartPeriod(['2020', '2021', '2022', '2023'], 'yearly')
      const range = new DateRange(period, '2021', '2023')
      expect(range.length).toBe(3)
    })

    it('should return 1 for single date range', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      const range = new DateRange(period, '2021', '2021')
      expect(range.length).toBe(1)
    })
  })

  describe('chartPeriod', () => {
    it('should return reference to period', () => {
      const period = new ChartPeriod(['2020', '2021', '2022'], 'yearly')
      const range = new DateRange(period, '2021', '2022')
      expect(range.chartPeriod).toBe(period)
    })
  })

  describe('monthly labels', () => {
    it('should work with monthly labels', () => {
      const labels = ['2020-Jan', '2020-Feb', '2020-Mar', '2021-Jan']
      const period = new ChartPeriod(labels, 'monthly')
      const range = new DateRange(period, '2020-Feb', '2020-Mar')
      expect(range.labels).toEqual(['2020-Feb', '2020-Mar'])
      expect(range.length).toBe(2)
    })
  })
})
