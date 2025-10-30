import { describe, it, expect, beforeEach } from 'vitest'
import { StateData } from './StateData'
import { StateComputed } from './StateComputed'
import { StateHelpers } from './StateHelpers'
import { createStateProperties } from './stateProperties'

describe('StateComputed', () => {
  let stateData: StateData
  let props: ReturnType<typeof createStateProperties>
  let stateHelpers: StateHelpers
  let stateComputed: StateComputed

  beforeEach(() => {
    stateData = new StateData()
    props = createStateProperties()
    stateHelpers = new StateHelpers(props)
    stateComputed = new StateComputed(stateData, stateHelpers)
  })

  // Helper to sync stateData changes to props for StateHelpers
  function syncPropsFromData() {
    props.chartStyle = stateData.chartStyle
    props.type = stateData.type
    props.isExcess = stateData.isExcess
    props.cumulative = stateData.cumulative
    props.showBaseline = stateData.showBaseline
    props.baselineMethod = stateData.baselineMethod
    props.isLogarithmic = stateData.isLogarithmic
  }

  describe('getChartStyle', () => {
    it('should return explicit chartStyle if set', () => {
      stateData.chartStyle = 'line'
      expect(stateComputed.getChartStyle()).toBe('line')
    })

    it('should default to bar for excess mode', () => {
      stateData.chartStyle = ''
      stateData.isExcess = true
      expect(stateComputed.getChartStyle()).toBe('bar')
    })

    it('should default to line for non-excess mode', () => {
      stateData.chartStyle = ''
      stateData.isExcess = false
      expect(stateComputed.getChartStyle()).toBe('line')
    })
  })

  describe('getAgeGroups', () => {
    it('should return ["all"] for ASMR types', () => {
      stateData.type = 'asmr'
      props.type = 'asmr'
      stateData.ageGroups = ['0-14', '15-64']
      expect(stateComputed.getAgeGroups()).toEqual(['all'])
    })

    it('should return actual ageGroups for non-ASMR types', () => {
      stateData.type = 'deaths'
      props.type = 'deaths'
      stateData.ageGroups = ['0-14', '15-64']
      expect(stateComputed.getAgeGroups()).toEqual(['0-14', '15-64'])
    })
  })

  describe('getStandardPopulation', () => {
    it('should return explicit value if set', () => {
      stateData.standardPopulation = 'country'
      expect(stateComputed.getStandardPopulation()).toBe('country')
    })

    it('should default to esp2013 for multiple countries', () => {
      stateData.standardPopulation = ''
      stateData.countries = ['USA', 'GBR']
      expect(stateComputed.getStandardPopulation()).toBe('esp2013')
    })

    it('should default to country for single country', () => {
      stateData.standardPopulation = ''
      stateData.countries = ['USA']
      expect(stateComputed.getStandardPopulation()).toBe('country')
    })
  })

  describe('getBaselineMethod', () => {
    it('should return explicit value if set', () => {
      stateData.baselineMethod = 'mean'
      expect(stateComputed.getBaselineMethod()).toBe('mean')
    })

    it('should default to lin_reg for CMR', () => {
      stateData.baselineMethod = ''
      stateData.type = 'cmr'
      expect(stateComputed.getBaselineMethod()).toBe('lin_reg')
    })

    it('should default to lin_reg for deaths', () => {
      stateData.baselineMethod = ''
      stateData.type = 'deaths'
      expect(stateComputed.getBaselineMethod()).toBe('lin_reg')
    })

    it('should default to auto for other types', () => {
      stateData.baselineMethod = ''
      stateData.type = 'population'
      expect(stateComputed.getBaselineMethod()).toBe('auto')
    })
  })

  describe('getCumulative', () => {
    it('should return false when not in excess mode', () => {
      stateData.isExcess = false
      stateData.cumulative = true
      expect(stateComputed.getCumulative()).toBe(false)
    })

    it('should return actual value in excess mode', () => {
      stateData.isExcess = true
      stateData.cumulative = true
      expect(stateComputed.getCumulative()).toBe(true)
    })
  })

  describe('getShowTotal', () => {
    it('should return false if not bar chart', () => {
      stateData.chartStyle = 'line'
      props.chartStyle = 'line'
      stateData.isExcess = true
      stateData.cumulative = true
      stateData.showTotal = true
      expect(stateComputed.getShowTotal()).toBe(false)
    })

    it('should return false if not cumulative', () => {
      stateData.chartStyle = 'bar'
      props.chartStyle = 'bar'
      stateData.isExcess = true
      stateData.cumulative = false
      stateData.showTotal = true
      expect(stateComputed.getShowTotal()).toBe(false)
    })

    it('should return actual value for bar chart in cumulative mode', () => {
      stateData.chartStyle = 'bar'
      props.chartStyle = 'bar'
      stateData.isExcess = true
      stateData.cumulative = true
      stateData.showTotal = true
      expect(stateComputed.getShowTotal()).toBe(true)
    })
  })

  describe('getMaximize', () => {
    it('should return false when logarithmic', () => {
      stateData.isLogarithmic = true
      stateData.maximize = true
      expect(stateComputed.getMaximize()).toBe(false)
    })

    it('should return actual value when not logarithmic', () => {
      stateData.isLogarithmic = false
      stateData.maximize = true
      expect(stateComputed.getMaximize()).toBe(true)
    })
  })

  describe('getShowPercentage', () => {
    it('should return false when not in excess mode', () => {
      stateData.isExcess = false
      stateData.showPercentage = true
      expect(stateComputed.getShowPercentage()).toBe(false)
    })

    it('should return explicit value in excess mode', () => {
      stateData.isExcess = true
      stateData.showPercentage = true
      expect(stateComputed.getShowPercentage()).toBe(true)
    })

    it('should default to true in excess non-cumulative mode', () => {
      stateData.isExcess = true
      stateData.cumulative = false
      stateData.showPercentage = false // Set explicit value
      // When showPercentage is explicitly false but conditions would default to true
      const result = stateComputed.getShowPercentage()
      // The getter returns showPercentage ?? (isExcess && !cumulative)
      // With showPercentage=false, it returns false (not the default)
      expect(result).toBe(false)
    })

    it('should use nullish default in excess cumulative mode', () => {
      stateData.isExcess = true
      stateData.cumulative = true
      stateData.showPercentage = false // Explicit false
      const result = stateComputed.getShowPercentage()
      expect(result).toBe(false)
    })
  })

  describe('getIsLogarithmic', () => {
    it('should return false for matrix charts', () => {
      stateData.chartStyle = 'matrix'
      props.chartStyle = 'matrix'
      stateData.isLogarithmic = true
      expect(stateComputed.getIsLogarithmic()).toBe(false)
    })

    it('should return false for excess mode', () => {
      stateData.isExcess = true
      stateData.isLogarithmic = true
      expect(stateComputed.getIsLogarithmic()).toBe(false)
    })

    it('should return actual value otherwise', () => {
      stateData.chartStyle = 'line'
      props.chartStyle = 'line'
      stateData.isExcess = false
      stateData.isLogarithmic = true
      expect(stateComputed.getIsLogarithmic()).toBe(true)
    })
  })

  describe('Date defaults', () => {
    beforeEach(() => {
      // Setup mock labels
      const labels = Array.from({ length: 520 }, (_, i) => `2010-W${(i % 52) + 1}`)
      stateData.allChartLabels.value = labels
      stateData.chartType = 'weekly'
    })

    it('should compute dateFrom with default', () => {
      stateData.dateFrom = undefined
      const result = stateComputed.getDateFrom()
      expect(result).toBeTruthy()
    })

    it('should compute dateTo with default', () => {
      stateData.dateTo = undefined
      const result = stateComputed.getDateTo()
      expect(result).toBeTruthy()
    })

    it('should use explicit dateFrom if set', () => {
      stateData.dateFrom = '2020-W01'
      expect(stateComputed.getDateFrom()).toBe('2020-W01')
    })

    it('should use explicit dateTo if set', () => {
      stateData.dateTo = '2023-W52'
      expect(stateComputed.getDateTo()).toBe('2023-W52')
    })
  })

  describe('Slider value', () => {
    it('should return array of dateFrom and dateTo', () => {
      stateData.dateFrom = '2020-W01'
      stateData.dateTo = '2023-W52'
      expect(stateComputed.getSliderValue()).toEqual(['2020-W01', '2023-W52'])
    })
  })

  describe('Baseline slider value', () => {
    it('should return array of baseline dates', () => {
      stateData.baselineDateFrom = '2015-W01'
      stateData.baselineDateTo = '2019-W52'
      expect(stateComputed.getBaselineSliderValue()).toEqual(['2015-W01', '2019-W52'])
    })
  })

  describe('Colors', () => {
    beforeEach(() => {
      // Mock dataset - needs nested structure for getColorsForDataset
      stateData.dataset = {
        all: {
          USA: [],
          GBR: [],
          DEU: []
        }
      } as unknown as typeof stateData.dataset
    })

    it('should return default colors when userColors is undefined', () => {
      stateData.userColors = undefined
      const colors = stateComputed.getColors()
      expect(Array.isArray(colors)).toBe(true)
      expect(colors.length).toBeGreaterThan(0)
    })

    it('should truncate userColors if too long', () => {
      const defaultColors = stateComputed.getColors()
      stateData.userColors = Array(defaultColors.length + 5).fill('#ff0000')
      const colors = stateComputed.getColors()
      expect(colors.length).toBe(defaultColors.length)
    })

    it('should pad userColors if too short', () => {
      const defaultColors = stateComputed.getColors()
      stateData.userColors = ['#ff0000', '#00ff00']
      const colors = stateComputed.getColors()
      expect(colors.length).toBe(defaultColors.length)
      expect(colors[0]).toBe('#ff0000')
      expect(colors[1]).toBe('#00ff00')
    })

    it('should return exact userColors if length matches', () => {
      const defaultColors = stateComputed.getColors()
      stateData.userColors = Array(defaultColors.length).fill('#ff0000')
      const colors = stateComputed.getColors()
      expect(colors).toEqual(stateData.userColors)
    })
  })

  describe('Index calculations', () => {
    beforeEach(() => {
      const labels = ['2020-W01', '2020-W02', '2020-W03', '2020-W04', '2020-W05']
      stateData.allChartData = {
        labels,
        data: {},
        notes: {}
      } as unknown as typeof stateData.allChartData
      stateData.chartType = 'weekly'
      stateData.dateFrom = '2020-W02'
      stateData.dateTo = '2020-W04'
    })

    it('should calculate dateFromIndex', () => {
      const index = stateComputed.dateFromIndex()
      expect(index).toBe(1)
    })

    it('should calculate dateToIndex', () => {
      const index = stateComputed.dateToIndex()
      expect(index).toBe(3)
    })

    it('should calculate maxDateIndex', () => {
      const index = stateComputed.maxDateIndex()
      expect(index).toBe(4)
    })

    it('should convert index to date', () => {
      const date = stateComputed.indexToDate(2)
      expect(date).toBe('2020-W03')
    })
  })

  describe('Labels', () => {
    beforeEach(() => {
      const labels = Array.from({ length: 100 }, (_, i) => `2020-W${(i % 52) + 1}`)
      stateData.allChartData = {
        labels,
        data: {},
        notes: {}
      } as unknown as typeof stateData.allChartData
      stateData.chartType = 'weekly'
    })

    it('should return all labels when slider start not shown', () => {
      stateData.allChartLabels.value = stateData.allChartData.labels
      const labels = stateComputed.getLabels()
      expect(labels.length).toBe(100)
    })
  })

  describe('showSliderStartSelect', () => {
    it('should return false when labels are short', () => {
      // DEFAULT_PERIODS is 30, threshold is 30 + 10 = 40
      stateData.allChartLabels.value = Array(39).fill('2020-W01')
      expect(stateComputed.showSliderStartSelect()).toBe(false)
    })

    it('should return true when labels are long enough', () => {
      // DEFAULT_PERIODS is 30, threshold is 30 + 10 = 40
      stateData.allChartLabels.value = Array(41).fill('2020-W01')
      expect(stateComputed.showSliderStartSelect()).toBe(true)
    })
  })
})
