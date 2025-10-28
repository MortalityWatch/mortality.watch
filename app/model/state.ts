import {
  getAllChartLabels,
  getSourceDescription,
  getStartIndex,
  loadCountryMetadata, getAllChartData, updateDataset
} from '@/lib/data'
import { getFilteredChartData } from '@/lib/chart'
import { getCamelCase, isMobile } from '@/utils'
import { reactive, ref, toRaw, unref } from 'vue'
import type { Serializable } from './serializable'
import type {
  DatasetRaw,
  NumberEntryFields,
  AllChartData,
  Country,
  ListType
} from '@/model'
import { getChartTypeFromOrdinal, getKeyForType } from '@/model'
import type { LocationQuery } from 'vue-router'
import { getSeasonString, defaultBaselineFromDate, defaultBaselineToDate } from './baseline'
import { getColorsForDataset } from '@/colors'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { StateCore } from './state/StateCore'
import { StateHelpers } from './state/StateHelpers'
import { StateSerialization } from './state/StateSerialization'
import { Defaults } from '@/lib/state/stateSerializer'

export class State extends StateCore implements Serializable {
  // Use StateHelpers for all helper methods
  private _helpers = new StateHelpers()

  // Use StateSerialization for URL state management
  private _serializer = new StateSerialization()

  constructor() {
    super()
    // Setup helpers with access to state properties
    Object.defineProperty(this._helpers, 'type', { get: () => this.type })
    Object.defineProperty(this._helpers, 'chartStyle', { get: () => this.chartStyle })
    Object.defineProperty(this._helpers, 'chartType', { get: () => this.chartType })
    Object.defineProperty(this._helpers, 'isExcess', { get: () => this.isExcess })
    Object.defineProperty(this._helpers, 'cumulative', { get: () => this.cumulative })
    Object.defineProperty(this._helpers, 'baselineMethod', { get: () => this.baselineMethod })
    Object.defineProperty(this._helpers, 'showBaseline', { get: () => this.showBaseline })
    Object.defineProperty(this._helpers, 'standardPopulation', { get: () => this.standardPopulation })
  }

  // Transitory
  chartOptions = reactive({
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

  // Data
  allCountries!: Record<string, Country>
  dataset!: DatasetRaw
  allChartLabels = ref<string[]>()
  allYearlyChartLabels = ref<string[]>()
  allYearlyChartLabelsUnique = ref<string[]>()
  allChartData!: AllChartData
  chartData!: MortalityChartData

  // Other
  isUpdating = ref(false)

  async initFromSavedState(locationQuery: LocationQuery): Promise<void> {
    // Delegate to StateSerialization module
    if (!this.allCountries) this.allCountries = await loadCountryMetadata()

    // Setup serializer with access to this instance
    this._serializer.allCountries = this.allCountries
    Object.defineProperty(this._serializer, 'countries', { get: () => this.countries })
    this._serializer.setValue = this.setValue.bind(this)

    // Use the serializer to load state
    await this._serializer.initFromSavedState(locationQuery)
  }

  override async setValue(prop: string, val: unknown) {
    const key = prop as keyof State
    if (isRef(this[key])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this[key] as any).value = val
    } else {
      // @ts-expect-error - TypeScript can't guarantee this is safe but we know it is
      this[key] = val
    }
  }

  private configureOptions = () => {
    this.chartOptions.showTotalOption = this.isExcess && this.isBarChartStyle()
    this.chartOptions.showTotalOptionDisabled = !this.cumulative
    this.chartOptions.showMaximizeOption
      = !(this.isExcess && this.isLineChartStyle()) && !this.isMatrixChartStyle()
    this.chartOptions.showMaximizeOptionDisabled
      = this.isLogarithmic
        || (this.isExcess && !this.chartOptions.showTotalOption)
    this.chartOptions.showBaselineOption
      = this.hasBaseline() && !this.isMatrixChartStyle()
    this.chartOptions.showPredictionIntervalOption
      = this.chartOptions.showBaselineOption
        || (this.isExcess && !this.isMatrixChartStyle())
    this.chartOptions.showPredictionIntervalOptionDisabled
      = (!this.isExcess && !this.showBaseline)
        || (this.cumulative && !this.showCumPi())
    this.chartOptions.showCumulativeOption = this.isExcess
    this.chartOptions.showPercentageOption = this.isExcess
    this.chartOptions.showLogarithmicOption
      = !this.isMatrixChartStyle() && !this.isExcess
  }

  // Override dateFrom/dateTo/sliderStart with custom defaults
  override set dateFrom(val: string | undefined) {
    this.setValue('_dateFrom', val)
  }

  override get dateFrom(): string {
    return unref(this._dateFrom) ?? this._defaultFromDate() ?? ''
  }

  override set dateTo(val: string | undefined) {
    this.setValue('_dateTo', val)
  }

  override get dateTo(): string {
    return unref(this._dateTo) ?? this._defaultToDate() ?? ''
  }

  override set sliderStart(val: string | undefined) {
    this.setValue('_sliderStart', val)
  }

  override get sliderStart(): string {
    return unref(this._sliderStart) ?? this._defaultSliderStart() ?? ''
  }

  sliderStartPeriod = () =>
    getSeasonString(this.chartType, Number(this.sliderStart))

  // Override showLabels with custom logic
  override get showLabels(): boolean {
    const val = unref(this._showLabels)
    return val
      ?? (Defaults.showLabels
        && this.allChartData
        && this.dateToIndex() - this.dateFromIndex() + 1 <= (isMobile() ? 20 : 60))
  }

  get sliderValue(): string[] {
    return [this.dateFrom!, this.dateTo!]
  }

  set sliderValue(sliderValue: string[]) {
    if (this.dateFrom !== sliderValue[0]) {
      this.dateFrom = sliderValue[0]
    }
    if (this.dateTo !== sliderValue[1]) {
      this.dateTo = sliderValue[1]
    }
  }

  get baselineSliderValue(): string[] {
    return [this.baselineDateFrom, this.baselineDateTo]
  }

  set baselineSliderValue(sliderValue: string[]) {
    if (this.baselineDateFrom !== sliderValue[0])
      this.baselineDateFrom = sliderValue[0]
    if (this.baselineDateTo !== sliderValue[1])
      this.baselineDateTo = sliderValue[1]
  }

  // Override baselineDateFrom with custom default
  override set baselineDateFrom(val: string | undefined) {
    this.setValue('_baselineDateFrom', val)
  }

  override get baselineDateFrom(): string {
    if (this._baselineDateFrom) {
      const df = unref(this._baselineDateFrom)
      if (df) return df
    }
    const labels = unref(this.allChartLabels)!
    return defaultBaselineFromDate(this.chartType, labels, this.baselineMethod) ?? ''
  }

  // Override baselineDateTo with custom default
  override set baselineDateTo(val: string | undefined) {
    this.setValue('_baselineDateTo', val)
  }

  override get baselineDateTo(): string {
    return unref(this._baselineDateTo) ?? defaultBaselineToDate(this.chartType)
  }

  // Custom colors getter with normalization logic
  get colors(): string[] {
    const defaultColors = getColorsForDataset(this.dataset)
    if (!this.userColors) return defaultColors
    if (this.userColors.length > defaultColors.length) {
      this._userColors.value = this.userColors.slice(0, defaultColors.length)
    }
    if (this.userColors.length < defaultColors.length) {
      this._userColors.value = [
        ...this.userColors,
        ...defaultColors.slice(this.userColors.length)
      ]
    }
    return this.userColors
  }

  // Helper Functions - delegate to StateHelpers and override protected methods
  protected override isAsmrType = () => this._helpers.isAsmrType()

  isPopulationType = () => this._helpers.isPopulationType()

  isLifeExpectancyType = () => this._helpers.isLifeExpectancyType()

  isDeathsType = () => this._helpers.isDeathsType()

  isErrorBarType = () => this._helpers.isErrorBarType()

  hasBaseline = () => this._helpers.hasBaseline()

  isLineChartStyle = () => this._helpers.isLineChartStyle()

  protected override isBarChartStyle = () => this._helpers.isBarChartStyle()

  protected override isMatrixChartStyle = () => this._helpers.isMatrixChartStyle()

  isWeeklyChartType = () => this._helpers.isWeeklyChartType()

  isMonthlyChartType = () => this._helpers.isMonthlyChartType()

  isYearlyChartType = () => this._helpers.isYearlyChartType()

  dateFromIndex = () => this.getLabels().indexOf(this.dateFrom)

  dateToIndex = () => this.getLabels().indexOf(this.dateTo)

  baselineDateFromIndex = () => this.getLabels().indexOf(this.baselineDateFrom)

  baselineDateToIndex = () => this.getLabels().indexOf(this.baselineDateTo)

  indexToDate = (index: number) => this.getLabels()[index]

  maxDateIndex = () => this.getLabels().length - 1

  getLabels = () => {
    if (!this.showSliderStartSelect()) return this.allChartData.labels

    const startIdx = this.allChartData.labels.indexOf(this.sliderStartPeriod())
    return this.allChartData.labels.slice(startIdx === -1 ? 0 : startIdx)
  }

  getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
    this._helpers.getBaseKeysForType()

  getMaxDateType = () => this._helpers.getMaxDateType()

  periodMultiplicatorForType = () => this._helpers.periodMultiplicatorForType()

  _defaultFromDate = () => {
    const labels = this.allChartLabels.value!
    const years = 10
    switch (this.chartType) {
      case 'weekly':
      case 'weekly_104w_sma':
      case 'weekly_52w_sma':
      case 'weekly_26w_sma':
      case 'weekly_13w_sma':
        return labels[Math.max(0, labels.length - years * 52 - 3)]
      case 'monthly':
        return labels[Math.max(0, labels.length - years * 12)]
      case 'quarterly':
        return labels[Math.max(0, labels.length - years * 4)]
      default:
        return labels[Math.max(0, labels.length - years)]
    }
  }

  _defaultToDate = () =>
    this.allChartLabels.value![this.allChartLabels.value!.length - 1]

  _defaultPeriods = 30

  _defaultSliderPeriods = () =>
    Math.round(this._defaultPeriods * this.periodMultiplicatorForType())

  _defaultSliderStart = () => {
    const labels = this.allYearlyChartLabels.value ?? []
    if (!this.showSliderStartSelect()) return labels[0]
    return labels[labels.length - this._defaultSliderPeriods()] ?? labels[0]
  }

  showSliderStartSelect = () =>
    (this.allChartLabels.value?.length ?? 0) > this._defaultPeriods + 10

  resetBaselineDates = () => {
    const labels = this.allChartLabels.value!.slice(
      getStartIndex(this.allYearlyChartLabels.value!, this.sliderStart)
    )
    if (!labels.includes(this.baselineDateFrom))
      this.baselineDateFrom = labels[0]
    if (!labels.includes(this.baselineDateTo)) this.baselineDateTo = labels[0]
    // Start Select
    if (!this.allYearlyChartLabelsUnique.value?.includes(this.sliderStart)) {
      this.sliderStart = undefined
    }
  }

  resetDates = () => {
    const labels = this.allChartData.labels
    // Date Slider
    const sliderStart = this.sliderStartPeriod()
    if (!labels.includes(this.dateFrom)) {
      if (labels.includes(sliderStart)) this.dateFrom = sliderStart
      this.dateFrom = labels[0]
    }
    if (!labels.includes(this.dateTo)) this.dateTo = undefined
  }

  // Backwards compatibility - delegate to StateHelpers
  isIsoKey = (str: string) => this._helpers.isIsoKey(str)

  protected override showCumPi = (): boolean => this._helpers.showCumPi()

  updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean
  ) => {
    this.isUpdating.value = true
    if (!this.allCountries) this.allCountries = await loadCountryMetadata()

    if (shouldDownloadDataset) {
      this.dataset = await updateDataset(
        this.chartType,
        this.countries,
        this.isAsmrType() ? ['all'] : this.ageGroups
      )

      // All Labels
      this.allChartLabels.value = getAllChartLabels(
        this.dataset,
        this.isAsmrType(),
        this.ageGroups,
        this.countries,
        this.chartType
      )

      if (this.chartType === 'yearly') {
        this.allYearlyChartLabels.value = this.allChartLabels.value
        this.allYearlyChartLabelsUnique.value
          = this.allChartLabels.value.filter(x => parseInt(x) <= 2017)
      } else {
        this.allYearlyChartLabels.value = Array.from(
          this.allChartLabels.value.map(v => v.substring(0, 4))
        )
        this.allYearlyChartLabelsUnique.value = Array.from(
          new Set(this.allYearlyChartLabels.value)
        ).filter(x => parseInt(x) <= 2017)
      }
    }

    if (shouldDownloadDataset || shouldUpdateDataset) {
      this.resetBaselineDates()

      // Update all chart specific data
      const newData = await getAllChartData(
        getKeyForType(this.type, this.showBaseline, this.standardPopulation)[0] ?? 'deaths',
        this.chartType,
        this.dataset,
        this.allChartLabels.value!,
        getStartIndex(this.allYearlyChartLabels.value!, this.sliderStart),
        this.showCumPi(),
        this.ageGroups,
        this.countries,
        this.baselineMethod,
        this.baselineDateFrom,
        this.baselineDateTo,
        this.getBaseKeysForType()
      )
      if (this.allChartData) Object.assign(this.allChartData, newData)
      else this.allChartData = reactive(newData)

      this.resetDates()
    }

    // Update filtered chart datasets
    const filteredData = await this.updateFilteredData()
    if (this.chartData) {
      Object.assign(this.chartData, filteredData)
    } else {
      this.chartData = filteredData
    }

    this.configureOptions()

    this.isUpdating.value = false
  }

  updateFilteredData = async () =>
    await getFilteredChartData(
      this.countries,
      this.standardPopulation,
      this.ageGroups,
      this.showPredictionInterval,
      this.isExcess,
      this.type,
      this.cumulative,
      this.showBaseline,
      this.baselineMethod,
      this.baselineDateFrom,
      this.baselineDateTo,
      this.showTotal,
      this.chartType,
      this.dateFrom,
      this.dateTo,
      this.isBarChartStyle(),
      this.allCountries,
      this.isErrorBarType(),
      this.colors,
      this.isMatrixChartStyle(),
      this.showPercentage,
      this.showCumPi(),
      this.isAsmrType(),
      this.maximize,
      this.showLabels,
      '', // URL generation placeholder
      this.isLogarithmic,
      this.isPopulationType(),
      this.isDeathsType(),
      this.allChartData.labels!,
      this.allChartData.data!
    )

  handleUpdate = async (key: string) => {
    if (this.countries.length) {
      await this.updateData(
        ['_countries', '_type', '_chartType', '_ageGroups'].includes(key),
        [
          '_baselineMethod',
          '_standardPopulation',
          '_baselineDateFrom',
          '_baselineDateTo',
          '_sliderStart'
        ].includes(key)
        || (this.baselineMethod !== 'auto' && key == '_cumulative')
      )
    }

    if (key === '_maximize') this.chartData.isMaximized = this.maximize
    if (key === '_showLabels') this.chartData.showLabels = this.showLabels
  }

  asmrCountries = (): Record<string, string> => {
    const result: Record<string, string> = {}
    Object.entries(this.allCountries).map(([iso3c, country]) => {
      if (country.has_asmr()) result[iso3c] = country.jurisdiction
    })
    return result
  }

  cmrCountries = (): Record<string, string> => {
    const result: Record<string, string> = {}
    Object.entries(this.allCountries).map(
      ([iso3c, country]) => (result[iso3c] = country.jurisdiction)
    )
    return result
  }

  allAgeGroups = (): ListType[] => {
    const result: Set<string> = new Set()
    Object.values(this.allCountries).filter((c: Country) => {
      if (!this.countries.includes(c.iso3c)) return
      for (const ag of c.age_groups()) {
        result.add(JSON.stringify({ name: getCamelCase(ag), value: ag }))
      }
    })
    const final: ListType[] = []
    Array.from(result)
      .sort()
      .forEach((b) => {
        final.push(JSON.parse(b))
      })
    return final
  }

  sources = (): string[] => {
    const result: string[] = []
    for (const source of this.chartData.sources) {
      if (source) result.push(getSourceDescription(source))
    }
    return result
  }

  notes = (): string[] => {
    const notes = this.allChartData.notes

    // No data
    const result = []
    if (notes?.noData) {
      for (const iso3c in notes.noData) {
        const ags = notes.noData[iso3c]
        const country = this.allCountries[iso3c]
        if (!country) continue
        const agsSet = ags as Set<string> | undefined
        if (!agsSet) continue
        result.push(
          `${country.jurisdiction}: No data for age groups: ${Array.from(
            agsSet
          ).join(', ')}`
        )
      }
    }

    // No ASMR
    if (notes?.noAsmr) {
      for (const iso3c of notes.noAsmr) {
        const country = this.allCountries[iso3c]
        if (!country) continue
        result.push(
          `${country.jurisdiction}: No ASMR data available. Please consider using CMR instead.`
        )
      }
    }
    // Disaggregated
    if (notes?.disaggregatedData) {
      for (const iso3c in notes.disaggregatedData) {
        const types: string[] = []
        const country = this.allCountries[iso3c]
        if (!country) continue
        const disaggData = notes.disaggregatedData[iso3c]
        if (!disaggData) continue
        for (const ord of disaggData)
          types.push(getChartTypeFromOrdinal(ord))
        result.push(
          `${country.jurisdiction}: Data may be disaggregated from ${types.join(
            ', '
          )} resolution.`
        )
      }
    }

    return result.sort()
  }

  getChartDataRaw = () => toRaw(this.chartData)
}
