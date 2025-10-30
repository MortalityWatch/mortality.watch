import { describe, it, expect, beforeEach } from 'vitest'
import { StateData } from './StateData'
import { StateEffects } from './StateEffects'
import { StateHelpers } from './StateHelpers'
import { createStateProperties } from './stateProperties'

describe('StateEffects', () => {
  let stateData: StateData
  let props: ReturnType<typeof createStateProperties>
  let stateHelpers: StateHelpers
  let stateEffects: StateEffects

  beforeEach(() => {
    stateData = new StateData()
    props = createStateProperties()
    stateHelpers = new StateHelpers(props)
    stateEffects = new StateEffects(stateData, stateHelpers)
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

  describe('onTypeChange', () => {
    it('should reset age groups for ASMR types', () => {
      stateData.ageGroups = ['0-14', '15-64', '65+']
      stateEffects.onTypeChange('asmr')
      expect(stateData.ageGroups).toEqual(['all'])
    })

    it('should reset age groups for LE types', () => {
      stateData.ageGroups = ['0-14', '15-64']
      stateEffects.onTypeChange('le')
      expect(stateData.ageGroups).toEqual(['all'])
    })

    it('should not reset age groups for deaths type', () => {
      stateData.ageGroups = ['0-14', '15-64']
      stateEffects.onTypeChange('deaths')
      expect(stateData.ageGroups).toEqual(['0-14', '15-64'])
    })

    it('should disable excess for population type', () => {
      stateData.isExcess = true
      stateEffects.onTypeChange('population')
      expect(stateData.isExcess).toBe(false)
    })

    it('should reset baseline method for population type', () => {
      stateData.baselineMethod = 'lin_reg'
      stateEffects.onTypeChange('population')
      expect(stateData.baselineMethod).toBe('auto')
    })

    it('should not affect excess for non-population types', () => {
      stateData.isExcess = true
      stateEffects.onTypeChange('deaths')
      expect(stateData.isExcess).toBe(true)
    })
  })

  describe('onCountriesChange', () => {
    it('should reset age groups when no countries selected', () => {
      stateData.ageGroups = ['0-14', '15-64']
      stateEffects.onCountriesChange([])
      expect(stateData.ageGroups).toEqual(['all'])
    })

    it('should not reset age groups when countries selected', () => {
      stateData.ageGroups = ['0-14', '15-64']
      stateEffects.onCountriesChange(['USA', 'GBR'])
      expect(stateData.ageGroups).toEqual(['0-14', '15-64'])
    })
  })

  describe('onIsExcessChange', () => {
    it('should reset cumulative when disabling excess', () => {
      stateData.cumulative = true
      stateData.showPercentage = true
      stateEffects.onIsExcessChange(false)
      expect(stateData.cumulative).toBe(false)
      expect(stateData.showPercentage).toBe(false)
    })

    it('should not reset values when enabling excess', () => {
      stateData.cumulative = false
      stateData.showPercentage = false
      stateEffects.onIsExcessChange(true)
      // Values remain as they were
      expect(stateData.cumulative).toBe(false)
      expect(stateData.showPercentage).toBe(false)
    })
  })

  describe('onCumulativeChange', () => {
    it('should hide total when disabling cumulative', () => {
      stateData.showTotal = true
      stateEffects.onCumulativeChange(false)
      expect(stateData.showTotal).toBe(false)
    })

    it('should not affect total when enabling cumulative', () => {
      stateData.showTotal = false
      stateEffects.onCumulativeChange(true)
      expect(stateData.showTotal).toBe(false)
    })
  })

  describe('configureChartOptions', () => {
    beforeEach(() => {
      // Setup basic state
      stateData.chartStyle = 'line'
      stateData.type = 'deaths'
      stateData.isExcess = false
    })

    it('should configure show total option for excess bar charts', () => {
      stateData.isExcess = true
      stateData.chartStyle = 'bar'
      stateData.cumulative = true
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showTotalOption).toBe(true)
      expect(stateData.chartOptions.showTotalOptionDisabled).toBe(false)
    })

    it('should disable show total option when not cumulative', () => {
      stateData.isExcess = true
      stateData.chartStyle = 'bar'
      stateData.cumulative = false
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showTotalOption).toBe(true)
      expect(stateData.chartOptions.showTotalOptionDisabled).toBe(true)
    })

    it('should hide show total option for line charts', () => {
      stateData.isExcess = true
      stateData.chartStyle = 'line'
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showTotalOption).toBe(false)
    })

    it('should configure maximize option', () => {
      stateData.chartStyle = 'line'
      stateData.isExcess = false
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showMaximizeOption).toBe(true)
    })

    it('should hide maximize option for matrix charts', () => {
      stateData.chartStyle = 'matrix'
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showMaximizeOption).toBe(false)
    })

    it('should disable maximize when logarithmic', () => {
      stateData.isLogarithmic = true
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showMaximizeOptionDisabled).toBe(true)
    })

    it('should show baseline option for non-population types', () => {
      stateData.type = 'deaths'
      stateData.isExcess = false
      stateData.chartStyle = 'line'
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showBaselineOption).toBe(true)
    })

    it('should hide baseline option for matrix charts', () => {
      stateData.type = 'deaths'
      stateData.chartStyle = 'matrix'
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showBaselineOption).toBe(false)
    })

    it('should show cumulative option for excess mode', () => {
      stateData.isExcess = true
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showCumulativeOption).toBe(true)
      expect(stateData.chartOptions.showPercentageOption).toBe(true)
    })

    it('should hide cumulative option for non-excess mode', () => {
      stateData.isExcess = false
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showCumulativeOption).toBe(false)
      expect(stateData.chartOptions.showPercentageOption).toBe(false)
    })

    it('should show logarithmic option for non-matrix, non-excess charts', () => {
      stateData.chartStyle = 'line'
      stateData.isExcess = false
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showLogarithmicOption).toBe(true)
    })

    it('should hide logarithmic option for excess mode', () => {
      stateData.isExcess = true
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showLogarithmicOption).toBe(false)
    })

    it('should hide logarithmic option for matrix charts', () => {
      stateData.chartStyle = 'matrix'
      syncPropsFromData()
      stateEffects.configureChartOptions()
      expect(stateData.chartOptions.showLogarithmicOption).toBe(false)
    })
  })

  describe('shouldDownloadDataset', () => {
    it('should return true for countries change', () => {
      expect(stateEffects.shouldDownloadDataset('countries')).toBe(true)
    })

    it('should return true for type change', () => {
      expect(stateEffects.shouldDownloadDataset('type')).toBe(true)
    })

    it('should return true for chartType change', () => {
      expect(stateEffects.shouldDownloadDataset('chartType')).toBe(true)
    })

    it('should return true for ageGroups change', () => {
      expect(stateEffects.shouldDownloadDataset('ageGroups')).toBe(true)
    })

    it('should return false for other properties', () => {
      expect(stateEffects.shouldDownloadDataset('chartStyle')).toBe(false)
      expect(stateEffects.shouldDownloadDataset('isExcess')).toBe(false)
    })
  })

  describe('shouldUpdateDataset', () => {
    it('should return true for baselineMethod change', () => {
      expect(stateEffects.shouldUpdateDataset('baselineMethod')).toBe(true)
    })

    it('should return true for standardPopulation change', () => {
      expect(stateEffects.shouldUpdateDataset('standardPopulation')).toBe(true)
    })

    it('should return true for baselineDateFrom change', () => {
      expect(stateEffects.shouldUpdateDataset('baselineDateFrom')).toBe(true)
    })

    it('should return true for baselineDateTo change', () => {
      expect(stateEffects.shouldUpdateDataset('baselineDateTo')).toBe(true)
    })

    it('should return true for sliderStart change', () => {
      expect(stateEffects.shouldUpdateDataset('sliderStart')).toBe(true)
    })

    it('should return true for cumulative change with non-auto baseline', () => {
      stateData.baselineMethod = 'lin_reg'
      expect(stateEffects.shouldUpdateDataset('cumulative')).toBe(true)
    })

    it('should return false for cumulative change with auto baseline', () => {
      stateData.baselineMethod = 'auto'
      expect(stateEffects.shouldUpdateDataset('cumulative')).toBe(false)
    })

    it('should return false for other properties', () => {
      expect(stateEffects.shouldUpdateDataset('chartStyle')).toBe(false)
      expect(stateEffects.shouldUpdateDataset('isExcess')).toBe(false)
    })
  })

  describe('onMaximizeChange', () => {
    it('should update chartData when it exists', () => {
      stateData.chartData = { isMaximized: false } as unknown as typeof stateData.chartData
      stateEffects.onMaximizeChange(true)
      expect(stateData.chartData.isMaximized).toBe(true)
    })

    it('should not error when chartData does not exist', () => {
      stateData.chartData = undefined as unknown as typeof stateData.chartData
      expect(() => stateEffects.onMaximizeChange(true)).not.toThrow()
    })
  })

  describe('onShowLabelsChange', () => {
    it('should update chartData when it exists', () => {
      stateData.chartData = { showLabels: false } as unknown as typeof stateData.chartData
      stateEffects.onShowLabelsChange(true)
      expect(stateData.chartData.showLabels).toBe(true)
    })

    it('should not error when chartData does not exist', () => {
      stateData.chartData = undefined as unknown as typeof stateData.chartData
      expect(() => stateEffects.onShowLabelsChange(true)).not.toThrow()
    })
  })

  describe('getEffectHandlers', () => {
    it('should return a map of effect handlers', () => {
      const handlers = stateEffects.getEffectHandlers()
      expect(handlers).toBeInstanceOf(Map)
      expect(handlers.size).toBeGreaterThan(0)
    })

    it('should include handler for type changes', () => {
      const handlers = stateEffects.getEffectHandlers()
      expect(handlers.has('type')).toBe(true)
    })

    it('should include handler for countries changes', () => {
      const handlers = stateEffects.getEffectHandlers()
      expect(handlers.has('countries')).toBe(true)
    })

    it('should include handler for isExcess changes', () => {
      const handlers = stateEffects.getEffectHandlers()
      expect(handlers.has('isExcess')).toBe(true)
    })

    it('should have functional handlers', () => {
      const handlers = stateEffects.getEffectHandlers()
      const typeHandler = handlers.get('type')!

      stateData.ageGroups = ['0-14', '15-64']
      typeHandler('asmr')
      expect(stateData.ageGroups).toEqual(['all'])
    })
  })

  describe('applyBatchChanges', () => {
    it('should apply multiple changes at once', () => {
      const changes = {
        countries: ['USA', 'GBR'],
        chartType: 'monthly',
        isExcess: true
      }
      stateEffects.applyBatchChanges(changes as unknown as Partial<StateData>)
      expect(stateData.countries).toEqual(['USA', 'GBR'])
      expect(stateData.chartType).toBe('monthly')
      expect(stateData.isExcess).toBe(true)
    })

    it('should configure chart options after batch changes', () => {
      const changes = {
        isExcess: true,
        chartStyle: 'bar'
      }
      stateEffects.applyBatchChanges(changes as unknown as Partial<StateData>)
      expect(stateData.chartOptions.showCumulativeOption).toBe(true)
    })
  })
})
