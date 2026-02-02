/**
 * Tests for unified chart state resolution
 *
 * These tests verify that resolveChartStateForRendering produces
 * the same results as the explorer's StateResolver + useDateRangeCalculations.
 */

import { describe, it, expect } from 'vitest'
import { resolveChartStateForRendering, isYearlyChartType, computeShowCumPi } from './resolveChartState'
import { computeEffectiveDateRange, getDefaultPeriods, getVisibleLabels } from './effectiveDefaults'
import { getDefaultSliderStart } from '@/lib/config/constants'

// Generate test labels for different chart types
function generateLabels(chartType: string, startYear: number, endYear: number): string[] {
  const labels: string[] = []

  if (chartType === 'yearly') {
    for (let y = startYear; y <= endYear; y++) {
      labels.push(y.toString())
    }
  } else if (chartType === 'fluseason') {
    for (let y = startYear; y < endYear; y++) {
      labels.push(`${y}/${(y + 1).toString().slice(-2)}`)
    }
  } else if (chartType === 'monthly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let y = startYear; y <= endYear; y++) {
      for (const m of months) {
        labels.push(`${y} ${m}`)
      }
    }
  } else if (chartType === 'weekly') {
    for (let y = startYear; y <= endYear; y++) {
      for (let w = 1; w <= 52; w++) {
        labels.push(`${y}-W${w.toString().padStart(2, '0')}`)
      }
    }
  }

  return labels
}

describe('resolveChartStateForRendering', () => {
  describe('view detection', () => {
    it('should detect mortality view by default', () => {
      const state = resolveChartStateForRendering({ c: 'USA' }, [])
      expect(state.view).toBe('mortality')
      expect(state.isExcess).toBe(false)
      expect(state.isZScore).toBe(false)
    })

    it('should detect excess view when e=1', () => {
      const state = resolveChartStateForRendering({ c: 'USA', e: '1' }, [])
      expect(state.view).toBe('excess')
      expect(state.isExcess).toBe(true)
      expect(state.isZScore).toBe(false)
    })

    it('should detect zscore view when zs=1', () => {
      const state = resolveChartStateForRendering({ c: 'USA', zs: '1' }, [])
      expect(state.view).toBe('zscore')
      expect(state.isExcess).toBe(false)
      expect(state.isZScore).toBe(true)
    })

    it('should prioritize zs over e', () => {
      const state = resolveChartStateForRendering({ c: 'USA', e: '1', zs: '1' }, [])
      expect(state.view).toBe('zscore')
    })
  })

  describe('view defaults', () => {
    it('should apply mortality defaults', () => {
      const state = resolveChartStateForRendering({ c: 'USA' }, [])
      expect(state.chartStyle).toBe('line')
      expect(state.showPercentage).toBe(false)
    })

    it('should apply excess defaults', () => {
      const state = resolveChartStateForRendering({ c: 'USA', e: '1' }, [])
      expect(state.chartStyle).toBe('bar') // excess default
      expect(state.showPercentage).toBe(true) // excess default
    })

    it('should apply zscore defaults', () => {
      const state = resolveChartStateForRendering({ c: 'USA', zs: '1' }, [])
      expect(state.chartStyle).toBe('line')
      expect(state.showBaseline).toBe(true) // required for zscore
    })
  })

  describe('constraint enforcement', () => {
    it('should enforce showBaseline=true in excess view', () => {
      // Even if user tries to disable baseline
      const state = resolveChartStateForRendering({ c: 'USA', e: '1', sb: '0' }, [])
      expect(state.showBaseline).toBe(true) // constraint forces it on
    })

    it('should enforce showLogarithmic=false in excess view', () => {
      const state = resolveChartStateForRendering({ c: 'USA', e: '1', lg: '1' }, [])
      expect(state.showLogarithmic).toBe(false) // constraint forces it off
    })

    it('should enforce showBaseline=true in zscore view', () => {
      const state = resolveChartStateForRendering({ c: 'USA', zs: '1', sb: '0' }, [])
      expect(state.showBaseline).toBe(true)
    })

    it('should enforce cumulative=false in zscore view', () => {
      const state = resolveChartStateForRendering({ c: 'USA', zs: '1', cum: '1' }, [])
      expect(state.cumulative).toBe(false)
    })

    it('should enforce ageGroups=["all"] for ASMR type', () => {
      const state = resolveChartStateForRendering({ c: 'USA', t: 'asmr', ag: ['0-14', '15-64'] }, [])
      expect(state.ageGroups).toEqual(['all'])
    })

    it('should enforce showBaseline=false for population type', () => {
      const state = resolveChartStateForRendering({ c: 'USA', t: 'population', sb: '1' }, [])
      expect(state.showBaseline).toBe(false)
    })

    it('should enforce showBaseline=false for matrix style', () => {
      const state = resolveChartStateForRendering({ c: 'USA', cs: 'matrix', sb: '1' }, [])
      expect(state.showBaseline).toBe(false)
    })
  })

  describe('date range computation', () => {
    const yearlyLabels = generateLabels('yearly', 2000, 2024) // 25 years
    const monthlyLabels = generateLabels('monthly', 2015, 2024) // 10 years * 12 = 120 months
    const _weeklyLabels = generateLabels('weekly', 2015, 2024) // 10 years * 52 = 520 weeks (reserved for future tests)

    it('should use last 10 years for yearly chart by default', () => {
      const state = resolveChartStateForRendering({ c: 'USA', ct: 'yearly' }, yearlyLabels)
      // Default: last 10 periods
      expect(state.dateFrom).toBe('2015') // 2024 - 10 + 1 = 2015
      expect(state.dateTo).toBe('2024')
    })

    it('should use last 120 months for monthly chart by default', () => {
      // With 120 months of data, should use all of it
      const state = resolveChartStateForRendering({ c: 'USA', ct: 'monthly' }, monthlyLabels)
      expect(state.dateFrom).toBe('2015 Jan')
      expect(state.dateTo).toBe('2024 Dec')
    })

    it('should respect user-provided dateFrom/dateTo', () => {
      const state = resolveChartStateForRendering(
        { c: 'USA', ct: 'yearly', df: '2020', dt: '2023' },
        yearlyLabels
      )
      expect(state.dateFrom).toBe('2020')
      expect(state.dateTo).toBe('2023')
    })

    it('should apply sliderStart filter', () => {
      // sliderStart=2015 means only show 2015 onwards
      const state = resolveChartStateForRendering(
        { c: 'USA', ct: 'yearly', ss: '2015' },
        yearlyLabels
      )
      // With sliderStart=2015, visible labels are 2015-2024 (10 labels)
      // Default periods for yearly is 10, so should use all visible
      expect(state.dateFrom).toBe('2015')
      expect(state.dateTo).toBe('2024')
    })

    it('should use default sliderStart of 20 years back', () => {
      const state = resolveChartStateForRendering({ c: 'USA', ct: 'yearly' }, yearlyLabels)
      expect(state.sliderStart).toBe(getDefaultSliderStart())
    })
  })

  describe('baseline date computation', () => {
    const labels = generateLabels('yearly', 2010, 2024)

    it('should use calculateBaselineRange default when not specified', () => {
      const state = resolveChartStateForRendering({ c: 'USA', ct: 'yearly' }, labels)
      // Baseline uses calculateBaselineRange which defaults to 2017 for yearly charts
      // (2016 for fluseason/midyear, 2017 for others)
      expect(state.baselineDateFrom).toBe('2017')
      expect(state.baselineDateTo).toBe('2019')
    })

    it('should respect user-provided baseline dates', () => {
      const state = resolveChartStateForRendering(
        { c: 'USA', ct: 'yearly', bf: '2015', bt: '2019' }, // bf/bt are the URL keys
        labels
      )
      expect(state.baselineDateFrom).toBe('2015')
      expect(state.baselineDateTo).toBe('2019')
    })
  })

  describe('URL param override with non-constrained fields', () => {
    it('should allow chartStyle override in excess view', () => {
      // chartStyle is not constrained, just has a default
      const state = resolveChartStateForRendering({ c: 'USA', e: '1', cs: 'line' }, [])
      expect(state.chartStyle).toBe('line') // user override works
    })

    it('should allow country override', () => {
      const state = resolveChartStateForRendering({ c: ['GBR', 'DEU'] }, [])
      expect(state.countries).toEqual(['GBR', 'DEU'])
    })
  })
})

describe('effectiveDefaults helpers', () => {
  describe('getDefaultPeriods', () => {
    it('should return 10 for yearly charts', () => {
      expect(getDefaultPeriods('yearly')).toBe(10)
      expect(getDefaultPeriods('fluseason')).toBe(10)
      expect(getDefaultPeriods('midyear')).toBe(10)
    })

    it('should return 120 for monthly charts', () => {
      expect(getDefaultPeriods('monthly')).toBe(120)
    })

    it('should return 520 for weekly charts', () => {
      expect(getDefaultPeriods('weekly')).toBe(520)
      expect(getDefaultPeriods('weekly_13w_sma')).toBe(520)
    })

    it('should return 40 for quarterly charts', () => {
      expect(getDefaultPeriods('quarterly')).toBe(40)
    })
  })

  describe('getVisibleLabels', () => {
    const labels = ['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012']

    it('should return all labels when no sliderStart', () => {
      const result = getVisibleLabels(labels, undefined, 'yearly')
      expect(result).toEqual(labels)
    })

    it('should filter from sliderStart', () => {
      const result = getVisibleLabels(labels, '2010', 'yearly')
      expect(result).toEqual(['2010', '2011', '2012'])
    })

    it('should handle sliderStart not in labels', () => {
      const result = getVisibleLabels(labels, '2009', 'yearly')
      expect(result).toEqual(['2009', '2010', '2011', '2012'])
    })
  })

  describe('computeEffectiveDateRange', () => {
    const labels = generateLabels('yearly', 2000, 2024)

    it('should use user dates when both provided', () => {
      const result = computeEffectiveDateRange(labels, 'yearly', undefined, '2015', '2020')
      expect(result.effectiveDateFrom).toBe('2015')
      expect(result.effectiveDateTo).toBe('2020')
    })

    it('should compute default range when dates not provided', () => {
      const result = computeEffectiveDateRange(labels, 'yearly', undefined, undefined, undefined)
      // 25 labels, default 10 periods, so start at index 15
      expect(result.effectiveDateFrom).toBe('2015')
      expect(result.effectiveDateTo).toBe('2024')
    })

    it('should respect sliderStart in default range', () => {
      const result = computeEffectiveDateRange(labels, 'yearly', '2020', undefined, undefined)
      // sliderStart=2020 means visible labels are 2020-2024 (5 labels)
      // Default 10 periods but only 5 available, so use all
      expect(result.effectiveDateFrom).toBe('2020')
      expect(result.effectiveDateTo).toBe('2024')
    })
  })
})

describe('SSR vs Explorer parity', () => {
  /**
   * This test simulates what StateResolver.resolveInitial would produce
   * and compares it to resolveChartStateForRendering
   */

  it('should produce same view detection as StateResolver', () => {
    const queryParams = { c: 'USA', e: '1' }

    // SSR resolution
    const ssrState = resolveChartStateForRendering(queryParams, [])

    // Explorer would use StateResolver.resolveInitial
    // which also uses detectView internally
    // Both should identify excess view
    expect(ssrState.view).toBe('excess')
    expect(ssrState.isExcess).toBe(true)
  })

  it('should apply same constraints as StateResolver', () => {
    const labels = generateLabels('yearly', 2010, 2024)

    // Excess view with conflicting params
    const queryParams = {
      c: 'USA',
      e: '1',
      sb: '0', // try to disable baseline
      lg: '1' // try to enable log scale
    }

    const ssrState = resolveChartStateForRendering(queryParams, labels)

    // Both SSR and Explorer should enforce:
    expect(ssrState.showBaseline).toBe(true) // forced by excess constraint
    expect(ssrState.showLogarithmic).toBe(false) // forced by excess constraint
  })

  it('should compute same effective date range as useDateRangeCalculations', () => {
    // Generate 15 years of yearly data
    const labels = generateLabels('yearly', 2010, 2024)

    const ssrState = resolveChartStateForRendering(
      { c: 'USA', ct: 'yearly' },
      labels
    )

    // useDateRangeCalculations would:
    // 1. Apply sliderStart (default: current year - 20) - all labels visible
    // 2. Compute default range: last 10 periods
    // Result: 2015-2024

    expect(ssrState.dateFrom).toBe('2015')
    expect(ssrState.dateTo).toBe('2024')
  })
})

describe('isYearlyChartType', () => {
  it('should return true for yearly chart types', () => {
    expect(isYearlyChartType('yearly')).toBe(true)
    expect(isYearlyChartType('fluseason')).toBe(true)
    expect(isYearlyChartType('midyear')).toBe(true)
  })

  it('should return false for non-yearly chart types', () => {
    expect(isYearlyChartType('monthly')).toBe(false)
    expect(isYearlyChartType('weekly')).toBe(false)
    expect(isYearlyChartType('weekly_13w_sma')).toBe(false)
    expect(isYearlyChartType('quarterly')).toBe(false)
  })
})

describe('computeShowCumPi', () => {
  it('should return true when all conditions are met', () => {
    expect(computeShowCumPi(true, 'yearly', 'lin_reg')).toBe(true)
    expect(computeShowCumPi(true, 'yearly', 'mean')).toBe(true)
    expect(computeShowCumPi(true, 'fluseason', 'lin_reg')).toBe(true)
    expect(computeShowCumPi(true, 'midyear', 'mean')).toBe(true)
  })

  it('should return false when cumulative is false', () => {
    expect(computeShowCumPi(false, 'yearly', 'lin_reg')).toBe(false)
    expect(computeShowCumPi(false, 'fluseason', 'mean')).toBe(false)
  })

  it('should return false for non-yearly chart types', () => {
    expect(computeShowCumPi(true, 'monthly', 'lin_reg')).toBe(false)
    expect(computeShowCumPi(true, 'weekly', 'mean')).toBe(false)
    expect(computeShowCumPi(true, 'quarterly', 'lin_reg')).toBe(false)
  })

  it('should return false for baseline methods that do not support cumulative PIs', () => {
    expect(computeShowCumPi(true, 'yearly', 'none')).toBe(false)
    expect(computeShowCumPi(true, 'yearly', 'median')).toBe(false)
    expect(computeShowCumPi(true, 'fluseason', 'quantile')).toBe(false)
  })
})

describe('legacy parameter migration', () => {
  it('should handle legacy bdf parameter (baseline date from)', () => {
    // bdf is the old name for bf
    const state = resolveChartStateForRendering({ c: 'USA', bdf: '2015' }, [])
    expect(state.baselineDateFrom).toBe('2015')
  })

  it('should handle legacy bdt parameter (baseline date to)', () => {
    // bdt is the old name for bt
    const state = resolveChartStateForRendering({ c: 'USA', bdt: '2019' }, [])
    expect(state.baselineDateTo).toBe('2019')
  })

  it('should handle legacy cum parameter (cumulative)', () => {
    // cum is the old name for ce
    // Note: e=1 enables excess mode where cumulative is allowed
    const state = resolveChartStateForRendering({ c: 'USA', e: '1', cum: '1' }, [])
    expect(state.cumulative).toBe(true)
  })

  it('should handle legacy pct parameter (show percentage)', () => {
    // pct is the old name for p
    const state = resolveChartStateForRendering({ c: 'USA', e: '1', pct: '1' }, [])
    expect(state.showPercentage).toBe(true)
  })

  it('should prefer current params over legacy params', () => {
    // If both bf and bdf are present, bf should be used
    const state = resolveChartStateForRendering({ c: 'USA', bf: '2020', bdf: '2015' }, [])
    expect(state.baselineDateFrom).toBe('2020')
  })

  it('should handle multiple legacy params together', () => {
    const state = resolveChartStateForRendering({
      c: 'USA',
      e: '1',
      bdf: '2015',
      bdt: '2019',
      cum: '1',
      pct: '1'
    }, [])

    expect(state.baselineDateFrom).toBe('2015')
    expect(state.baselineDateTo).toBe('2019')
    expect(state.cumulative).toBe(true)
    expect(state.showPercentage).toBe(true)
  })
})
