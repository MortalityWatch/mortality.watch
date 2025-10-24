import { describe, it, expect } from 'vitest'
import {
  getSeasonString,
  defaultBaselineFromDate,
  defaultBaselineToDate
} from './baseline'

describe('baseline', () => {
  describe('getSeasonString', () => {
    describe('weekly chart types', () => {
      const weeklyTypes = ['weekly', 'weekly_104w_sma', 'weekly_52w_sma', 'weekly_26w_sma', 'weekly_13w_sma']

      weeklyTypes.forEach((chartType) => {
        it(`should return week format for ${chartType}`, () => {
          expect(getSeasonString(chartType, 2020)).toBe('2020 W01')
          expect(getSeasonString(chartType, 2015)).toBe('2015 W01')
        })
      })
    })

    it('should return month format for monthly', () => {
      expect(getSeasonString('monthly', 2020)).toBe('2020 Jan')
      expect(getSeasonString('monthly', 2015)).toBe('2015 Jan')
    })

    it('should return quarter format for quarterly', () => {
      expect(getSeasonString('quarterly', 2020)).toBe('2020 Q1')
      expect(getSeasonString('quarterly', 2015)).toBe('2015 Q1')
    })

    it('should return flu season format for midyear', () => {
      expect(getSeasonString('midyear', 2020)).toBe('2019/20')
      expect(getSeasonString('midyear', 2015)).toBe('2014/15')
    })

    it('should return flu season format for fluseason', () => {
      expect(getSeasonString('fluseason', 2020)).toBe('2019/20')
      expect(getSeasonString('fluseason', 2015)).toBe('2014/15')
    })

    it('should return year for yearly (default)', () => {
      expect(getSeasonString('yearly', 2020)).toBe('2020')
      expect(getSeasonString('yearly', 2015)).toBe('2015')
    })

    it('should return year for unknown chart types', () => {
      expect(getSeasonString('unknown', 2020)).toBe('2020')
    })
  })

  describe('defaultBaselineFromDate', () => {
    describe('with naive baseline method', () => {
      it('should return 2015 W01 for weekly', () => {
        const labels = ['2010 W01', '2015 W01', '2020 W01']
        expect(defaultBaselineFromDate('weekly', labels, 'naive')).toBe('2015 W01')
      })

      it('should return first label if 2015 format not in labels', () => {
        const labels = ['2010 W01', '2011 W01']
        expect(defaultBaselineFromDate('weekly', labels, 'naive')).toBe('2010 W01')
      })
    })

    describe('with mean baseline method', () => {
      it('should return 2017 Jan for monthly', () => {
        const labels = ['2010 Jan', '2017 Jan', '2020 Jan']
        expect(defaultBaselineFromDate('monthly', labels, 'mean')).toBe('2017 Jan')
      })

      it('should return first label if 2017 format not in labels', () => {
        const labels = ['2010 Jan', '2012 Jan']
        expect(defaultBaselineFromDate('monthly', labels, 'mean')).toBe('2010 Jan')
      })
    })

    describe('with lin_reg baseline method', () => {
      it('should return 2010 Q1 for quarterly', () => {
        const labels = ['2010 Q1', '2015 Q1', '2020 Q1']
        expect(defaultBaselineFromDate('quarterly', labels, 'lin_reg')).toBe('2010 Q1')
      })
    })

    describe('with exp baseline method', () => {
      it('should use first label year if >= 2000', () => {
        const labels = ['2015', '2016', '2017']
        expect(defaultBaselineFromDate('yearly', labels, 'exp')).toBe('2015')
      })

      it('should use 2000 if first label year < 2000', () => {
        const labels = ['1998', '1999', '2000']
        expect(defaultBaselineFromDate('yearly', labels, 'exp')).toBe('2000')
      })

      it('should return undefined for empty labels', () => {
        expect(defaultBaselineFromDate('yearly', [], 'exp')).toBeUndefined()
      })
    })

    describe('with unknown baseline method', () => {
      it('should use first label year', () => {
        const labels = ['2012', '2013', '2014']
        expect(defaultBaselineFromDate('yearly', labels, 'unknown')).toBe('2012')
      })

      it('should return undefined if labels empty', () => {
        expect(defaultBaselineFromDate('yearly', [], 'unknown')).toBeUndefined()
      })
    })

    describe('chart type specific formats', () => {
      it('should handle weekly charts', () => {
        const labels = ['2017 W01', '2017 W02']
        expect(defaultBaselineFromDate('weekly', labels, 'mean')).toBe('2017 W01')
      })

      it('should handle monthly charts', () => {
        const labels = ['2017 Jan', '2017 Feb']
        expect(defaultBaselineFromDate('monthly', labels, 'mean')).toBe('2017 Jan')
      })

      it('should handle quarterly charts', () => {
        const labels = ['2010 Q1', '2010 Q2']
        expect(defaultBaselineFromDate('quarterly', labels, 'lin_reg')).toBe('2010 Q1')
      })

      it('should handle midyear charts', () => {
        const labels = ['2014/15', '2015/16', '2016/17']
        expect(defaultBaselineFromDate('midyear', labels, 'mean')).toBe('2016/17')
      })

      it('should handle fluseason charts', () => {
        const labels = ['2014/15', '2015/16', '2016/17']
        expect(defaultBaselineFromDate('fluseason', labels, 'mean')).toBe('2016/17')
      })
    })
  })

  describe('defaultBaselineToDate', () => {
    describe('weekly chart types', () => {
      const weeklyTypes = ['weekly', 'weekly_104w_sma', 'weekly_52w_sma', 'weekly_26w_sma', 'weekly_13w_sma']

      weeklyTypes.forEach((chartType) => {
        it(`should return 2019 W52 for ${chartType}`, () => {
          expect(defaultBaselineToDate(chartType)).toBe('2019 W52')
        })
      })
    })

    it('should return 2019 Dec for monthly', () => {
      expect(defaultBaselineToDate('monthly')).toBe('2019 Dec')
    })

    it('should return 2019 Q4 for quarterly', () => {
      expect(defaultBaselineToDate('quarterly')).toBe('2019 Q4')
    })

    it('should return 2018/19 for midyear', () => {
      expect(defaultBaselineToDate('midyear')).toBe('2018/19')
    })

    it('should return 2018/19 for fluseason', () => {
      expect(defaultBaselineToDate('fluseason')).toBe('2018/19')
    })

    it('should return 2019 for yearly (default)', () => {
      expect(defaultBaselineToDate('yearly')).toBe('2019')
    })

    it('should return 2019 for unknown chart types', () => {
      expect(defaultBaselineToDate('unknown')).toBe('2019')
    })
  })

  describe('edge cases', () => {
    it('should return undefined for empty label arrays', () => {
      expect(defaultBaselineFromDate('weekly', [], 'naive')).toBeUndefined()
      expect(defaultBaselineFromDate('monthly', [], 'mean')).toBeUndefined()
      expect(defaultBaselineFromDate('yearly', [], 'lin_reg')).toBeUndefined()
    })

    it('should return first label when calculated baseline not in labels', () => {
      const labels = ['invalid', 'data']
      const result = defaultBaselineFromDate('yearly', labels, 'exp')
      expect(result).toBe('invalid') // Returns first label when '2000' not in array
    })

    it('should return first label when baseline year not in labels', () => {
      const labels = ['2020 W01']
      expect(defaultBaselineFromDate('weekly', labels, 'naive')).toBe('2020 W01')
    })

    it('should return calculated baseline when it exists in labels', () => {
      const labels = ['2010 W01', '2015 W01', '2020 W01']
      expect(defaultBaselineFromDate('weekly', labels, 'naive')).toBe('2015 W01')
    })
  })
})
