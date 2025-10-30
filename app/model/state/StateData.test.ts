import { describe, it, expect, beforeEach } from 'vitest'
import { StateData } from './StateData'

describe('StateData', () => {
  let stateData: StateData

  beforeEach(() => {
    stateData = new StateData()
  })

  describe('Core Settings', () => {
    it('should initialize with empty countries array', () => {
      expect(stateData.countries).toEqual([])
    })

    it('should set and get countries', () => {
      stateData.countries = ['USA', 'GBR', 'DEU']
      expect(stateData.countries).toEqual(['USA', 'GBR', 'DEU'])
    })

    it('should initialize with default chartType', () => {
      expect(stateData.chartType).toBe('weekly')
    })

    it('should set and get chartType', () => {
      stateData.chartType = 'monthly'
      expect(stateData.chartType).toBe('monthly')
    })

    it('should initialize with default type', () => {
      expect(stateData.type).toBe('deaths')
    })

    it('should set and get type', () => {
      stateData.type = 'asmr'
      expect(stateData.type).toBe('asmr')
    })

    it('should initialize with default chartStyle', () => {
      expect(stateData.chartStyle).toBe('line')
    })

    it('should set and get chartStyle', () => {
      stateData.chartStyle = 'bar'
      expect(stateData.chartStyle).toBe('bar')
    })

    it('should initialize with isExcess false', () => {
      expect(stateData.isExcess).toBe(false)
    })

    it('should set and get isExcess', () => {
      stateData.isExcess = true
      expect(stateData.isExcess).toBe(true)
    })
  })

  describe('Date Range', () => {
    it('should initialize with undefined dateFrom', () => {
      expect(stateData.dateFrom).toBeUndefined()
    })

    it('should set and get dateFrom', () => {
      stateData.dateFrom = '2020-01'
      expect(stateData.dateFrom).toBe('2020-01')
    })

    it('should initialize with undefined dateTo', () => {
      expect(stateData.dateTo).toBeUndefined()
    })

    it('should set and get dateTo', () => {
      stateData.dateTo = '2023-12'
      expect(stateData.dateTo).toBe('2023-12')
    })

    it('should initialize with undefined sliderStart', () => {
      expect(stateData.sliderStart).toBeUndefined()
    })

    it('should set and get sliderStart', () => {
      stateData.sliderStart = '2015'
      expect(stateData.sliderStart).toBe('2015')
    })
  })

  describe('Baseline', () => {
    it('should initialize with showBaseline false', () => {
      expect(stateData.showBaseline).toBe(false)
    })

    it('should set and get showBaseline', () => {
      stateData.showBaseline = true
      expect(stateData.showBaseline).toBe(true)
    })

    it('should initialize with default baselineMethod', () => {
      expect(stateData.baselineMethod).toBe('auto')
    })

    it('should set and get baselineMethod', () => {
      stateData.baselineMethod = 'lin_reg'
      expect(stateData.baselineMethod).toBe('lin_reg')
    })

    it('should initialize with undefined baselineDateFrom', () => {
      expect(stateData.baselineDateFrom).toBeUndefined()
    })

    it('should set and get baselineDateFrom', () => {
      stateData.baselineDateFrom = '2015-01'
      expect(stateData.baselineDateFrom).toBe('2015-01')
    })

    it('should initialize with undefined baselineDateTo', () => {
      expect(stateData.baselineDateTo).toBeUndefined()
    })

    it('should set and get baselineDateTo', () => {
      stateData.baselineDateTo = '2019-12'
      expect(stateData.baselineDateTo).toBe('2019-12')
    })
  })

  describe('Display Options', () => {
    it('should initialize with default ageGroups', () => {
      expect(stateData.ageGroups).toEqual(['all'])
    })

    it('should set and get ageGroups', () => {
      stateData.ageGroups = ['0-14', '15-64', '65+']
      expect(stateData.ageGroups).toEqual(['0-14', '15-64', '65+'])
    })

    it('should initialize with default standardPopulation', () => {
      expect(stateData.standardPopulation).toBe('esp2013')
    })

    it('should set and get standardPopulation', () => {
      stateData.standardPopulation = 'country'
      expect(stateData.standardPopulation).toBe('country')
    })

    it('should initialize with cumulative false', () => {
      expect(stateData.cumulative).toBe(false)
    })

    it('should set and get cumulative', () => {
      stateData.cumulative = true
      expect(stateData.cumulative).toBe(true)
    })

    it('should initialize with showTotal false', () => {
      expect(stateData.showTotal).toBe(false)
    })

    it('should set and get showTotal', () => {
      stateData.showTotal = true
      expect(stateData.showTotal).toBe(true)
    })

    it('should initialize with maximize false', () => {
      expect(stateData.maximize).toBe(false)
    })

    it('should set and get maximize', () => {
      stateData.maximize = true
      expect(stateData.maximize).toBe(true)
    })

    it('should initialize with showPredictionInterval true', () => {
      expect(stateData.showPredictionInterval).toBe(true)
    })

    it('should set and get showPredictionInterval', () => {
      stateData.showPredictionInterval = false
      expect(stateData.showPredictionInterval).toBe(false)
    })

    it('should initialize with showLabels true', () => {
      expect(stateData.showLabels).toBe(true)
    })

    it('should set and get showLabels', () => {
      stateData.showLabels = false
      expect(stateData.showLabels).toBe(false)
    })

    it('should initialize with showPercentage false', () => {
      expect(stateData.showPercentage).toBe(false)
    })

    it('should set and get showPercentage', () => {
      stateData.showPercentage = true
      expect(stateData.showPercentage).toBe(true)
    })

    it('should initialize with isLogarithmic false', () => {
      expect(stateData.isLogarithmic).toBe(false)
    })

    it('should set and get isLogarithmic', () => {
      stateData.isLogarithmic = true
      expect(stateData.isLogarithmic).toBe(true)
    })
  })

  describe('Colors', () => {
    it('should initialize with undefined userColors', () => {
      expect(stateData.userColors).toBeUndefined()
    })

    it('should set and get userColors', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff']
      stateData.userColors = colors
      expect(stateData.userColors).toEqual(colors)
    })

    it('should allow setting userColors to undefined', () => {
      stateData.userColors = ['#ff0000']
      stateData.userColors = undefined
      expect(stateData.userColors).toBeUndefined()
    })
  })

  describe('Chart Options', () => {
    it('should initialize chartOptions with defaults', () => {
      expect(stateData.chartOptions).toMatchObject({
        showMaximizeOption: true,
        showMaximizeOptionDisabled: false,
        showBaselineOption: false,
        showPredictionIntervalOption: false,
        showPredictionIntervalOptionDisabled: false,
        showCumulativeOption: false,
        showTotalOption: false,
        showTotalOptionDisabled: false,
        showPercentageOption: false,
        showLogarithmicOption: true
      })
    })

    it('should allow modifying chartOptions', () => {
      stateData.chartOptions.showMaximizeOption = false
      expect(stateData.chartOptions.showMaximizeOption).toBe(false)
    })
  })

  describe('Reactivity', () => {
    it('should have reactive chartOptions', () => {
      const initialValue = stateData.chartOptions.showMaximizeOption
      stateData.chartOptions.showMaximizeOption = !initialValue
      expect(stateData.chartOptions.showMaximizeOption).toBe(!initialValue)
    })

    it('should have reactive refs for labels', () => {
      expect(stateData.allChartLabels.value).toBeUndefined()
      expect(stateData.allYearlyChartLabels.value).toBeUndefined()
      expect(stateData.allYearlyChartLabelsUnique.value).toBeUndefined()
      expect(stateData.isUpdating.value).toBe(false)
    })
  })
})
