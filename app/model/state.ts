import {
  getAllChartLabels,
  getSourceDescription,
  getStartIndex,
  loadCountryMetadata
} from './../data'
import { getFilteredChartData } from '@/chart'
import { getAllChartData, updateDataset } from '@/data'
import { getCamelCase, isMobile } from '@/utils'
import { compress, decompress } from '../lib/compression/compress.browser'
import { showToast } from '../toast'
import { isRef, reactive, ref, toRaw, unref, type Ref } from 'vue'
import {
  decodeBool,
  decodeString,
  encodeBool,
  encodeString,
  type Serializable
} from './serializable'
import {
  getChartTypeFromOrdinal,
  type Country,
  type ListType,
  baselineMethods,
  getKeyForType,
  DatasetRaw,
  NumberEntryFields,
  AllChartData
} from '@/model'
import type { LocationQuery } from 'vue-router'
import {
  defaultBaselineFromDate,
  defaultBaselineToDate,
  getSeasonString
} from './baseline'
import { getColorsForDataset } from '@/colors'
import { MortalityChartData } from '@/lib/chart/chartTypes.ts'

export class State implements Serializable {
  // Core Settings
  _countries = ref<string[]>()
  _chartType = ref<string>()
  _isExcess = ref<boolean>()
  _type = ref<string>()
  _chartStyle = ref<string>()
  _dateFrom = ref<string>()
  _dateTo = ref<string>()
  _baselineDateFrom = ref<string>()
  _baselineDateTo = ref<string>()

  // Optional Settings
  _ageGroups = ref<string[]>()
  _standardPopulation = ref<string>()
  _showBaseline = ref<boolean>()
  _baselineMethod = ref<string>()
  _cumulative = ref<boolean>()
  _showTotal = ref<boolean>()
  _maximize = ref<boolean>()
  _showPredictionInterval = ref<boolean>()
  _showLabels = ref<boolean>()
  _showPercentage = ref<boolean>()
  _isLogarithmic = ref<boolean>()
  _sliderStart = ref<string>()
  _userColors = ref<string[]>()

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
    if (!this.allCountries) this.allCountries = await loadCountryMetadata()

    let encodedState: LocationQuery | undefined = locationQuery

    // QR Code
    if (locationQuery.qr && typeof locationQuery.qr === 'string') {
      const decoded = base64ToArrayBuffer(locationQuery.qr)
      const decompressed = await decompress(decoded)
      try {
        encodedState = JSON.parse(decompressed)
      } catch (e) {
        console.log(e)
        showToast('Your browser lacks state decompression support.')
        encodedState = undefined
      }
    } else if (locationQuery.q && typeof locationQuery.q === 'string') {
      try {
        encodedState = JSON.parse(decodeURIComponent(locationQuery.q))
      } catch (e) {
        console.log(e)
        try {
          encodedState = JSON.parse(
            decodeURIComponent(decodeURIComponent(locationQuery.q))
          )
        } catch (e) {
          console.log(e)
          throw new Error('Failed to decode state!')
        }
      }
    }

    if (!encodedState || Object.keys(encodedState).length === 0) return

    // Countries; Validate before assignment
    const countries = (
      Array.isArray(encodedState.c) || !encodedState.c
        ? encodedState.c
        : [encodedState.c]
    ) as string[]
    if (countries && countries.length) {
      const validCountryCodes = Object.keys(this.allCountries)
      let validCountries = countries.filter((x) =>
        validCountryCodes.includes(x)
      )
      if (!validCountries || !validCountries.length)
        validCountries = ['USA', 'SWE']
      this.setValue('_countries', validCountries)
    }

    // Age Groups; Validate before assignment
    const ageGroups = (
      Array.isArray(encodedState.ag) || !encodedState.ag
        ? encodedState.ag
        : [encodedState.ag]
    ) as string[]
    if (ageGroups && ageGroups.length) {
      const validAgeGroups = []
      for (const iso3c of this.countries) {
        for (const ds of this.allCountries[iso3c].data_source) {
          validAgeGroups.push(
            ...Array.from(ds.age_groups).filter((value) =>
              ageGroups.includes(value)
            )
          )
        }
      }
      this.setValue(
        '_ageGroups',
        !validAgeGroups.length ? ['all'] : validAgeGroups
      )
    }

    if (encodedState.t) {
      this.setValue('_type', (encodedState.t as string).replace('_excess', ''))
    }
    if (encodedState.ct !== 'ytd') {
      // YTD not supported anymore, use default.
      this.setValue('_chartType', encodedState.ct)
    }
    this.setValue(
      '_isExcess',
      decodeBool(encodedState.e as string) ??
        encodedState.t?.includes('_excess')
    )
    this.setValue('_chartStyle', encodedState.cs)
    this.setValue('_dateFrom', decodeString(encodedState.df as string))
    this.setValue('_dateTo', decodeString(encodedState.dt as string))
    this.setValue('_sliderStart', encodedState.ss)
    this.setValue('_baselineDateFrom', decodeString(encodedState.bf as string))
    this.setValue('_baselineDateTo', decodeString(encodedState.bt as string))
    this.setValue('_standardPopulation', encodedState.sp)
    this.setValue('_showBaseline', decodeBool(encodedState.sb as string))
    this.setValue('_baselineMethod', encodedState.bm)
    this.setValue('_cumulative', decodeBool(encodedState.ce as string))
    this.setValue('_showTotal', decodeBool(encodedState.st as string))
    this.setValue('_maximize', decodeBool(encodedState.m as string))
    this.setValue(
      '_showPredictionInterval',
      decodeBool(encodedState.pi as string)
    )
    this.setValue('_showLabels', decodeBool(encodedState.sl as string))
    this.setValue('_showPercentage', decodeBool(encodedState.p as string))
    this.setValue('_isLogarithmic', decodeBool(encodedState.lg as string))

    const userColors = (
      Array.isArray(encodedState.uc) || !encodedState.uc
        ? encodedState.uc
        : [encodedState.uc]
    ) as string[]
    if (userColors && userColors.length)
      this.setValue('_userColors', userColors)
  }

  setValue = async (prop: keyof State, val: unknown) => {
    if (isRef(this[prop])) (this[prop] as Ref).value = val
    // @ts-expect-error - TypeScript can't guarantee this is safe but we know it is
    else this[prop] = val
  }

  private configureOptions = () => {
    this.chartOptions.showTotalOption = this.isExcess && this.isBarChartStyle()
    this.chartOptions.showTotalOptionDisabled = !this.cumulative
    this.chartOptions.showMaximizeOption =
      !(this.isExcess && this.isLineChartStyle()) && !this.isMatrixChartStyle()
    this.chartOptions.showMaximizeOptionDisabled =
      this.isLogarithmic ||
      (this.isExcess && !this.chartOptions.showTotalOption)
    this.chartOptions.showBaselineOption =
      this.hasBaseline() && !this.isMatrixChartStyle()
    this.chartOptions.showPredictionIntervalOption =
      this.chartOptions.showBaselineOption ||
      (this.isExcess && !this.isMatrixChartStyle())
    this.chartOptions.showPredictionIntervalOptionDisabled =
      (!this.isExcess && !this.showBaseline) ||
      (this.cumulative && !this.showCumPi())
    this.chartOptions.showCumulativeOption = this.isExcess
    this.chartOptions.showPercentageOption = this.isExcess
    this.chartOptions.showLogarithmicOption =
      !this.isMatrixChartStyle() && !this.isExcess
  }

  set countries(val: string[]) {
    this.setValue('_countries', val)
  }

  get countries(): string[] {
    return unref(this._countries) ?? Defaults.countries
  }

  set chartStyle(val: string) {
    this.setValue('_chartStyle', val)
  }

  get chartStyle(): string {
    return unref(this._chartStyle) ?? (this.isExcess ? 'bar' : 'line')
  }

  set chartType(val: string) {
    this.setValue('_chartType', val)
  }

  get chartType(): string {
    return unref(this._chartType) ?? Defaults.chartType
  }

  set type(val: string) {
    if (val.startsWith('asmr') || val.startsWith('le'))
      this.setValue('_ageGroups', undefined)
    if (val === 'population') {
      this.setValue('_isExcess', undefined)
      this.setValue('_baselineMethod', undefined)
    }
    this.setValue('_type', val)
  }

  get type(): string {
    return unref(this._type) ?? Defaults.type
  }

  set isExcess(val: boolean) {
    this.setValue('_isExcess', val)
  }

  get isExcess(): boolean {
    return unref(this._isExcess) ?? Defaults.isExcess
  }

  set dateFrom(val: string | undefined) {
    this.setValue('_dateFrom', val)
  }

  get dateFrom(): string {
    return unref(this._dateFrom) ?? this._defaultFromDate()
  }

  set dateTo(val: string | undefined) {
    this.setValue('_dateTo', val)
  }

  get dateTo(): string {
    return unref(this._dateTo) ?? this._defaultToDate()
  }

  set sliderStart(val: string | undefined) {
    this.setValue('_sliderStart', val)
  }

  get sliderStart(): string {
    return unref(this._sliderStart) ?? this._defaultSliderStart()
  }

  sliderStartPeriod = () =>
    getSeasonString(this.chartType, Number(this.sliderStart))

  set ageGroups(val: string[]) {
    this.setValue('_ageGroups', val)
  }

  get ageGroups(): string[] {
    if (this.isAsmrType()) return ['all']
    return unref(this._ageGroups) ?? Defaults.ageGroups
  }

  set standardPopulation(val: string) {
    this.setValue('_standardPopulation', val)
  }

  get standardPopulation(): string {
    return (
      unref(this._standardPopulation) ??
      (this.countries.length > 1 ? Defaults.standardPopulation : 'country')
    )
  }

  set showBaseline(on: boolean) {
    this.setValue('_showBaseline', on)
  }

  get showBaseline(): boolean {
    return unref(this._showBaseline) ?? Defaults.showBaseline
  }

  set cumulative(on: boolean) {
    this.setValue('_cumulative', on)
  }

  get cumulative(): boolean {
    if (!this.isExcess) return false
    return unref(this._cumulative) ?? Defaults.cumulative
  }

  set showTotal(on: boolean) {
    this.setValue('_showTotal', on)
  }

  get showTotal(): boolean {
    if (!this.isBarChartStyle() || !this.cumulative) return false
    return unref(this._showTotal) ?? Defaults.showTotal
  }

  set maximize(on: boolean) {
    this.setValue('_maximize', on)
  }

  get maximize(): boolean {
    if (this.isLogarithmic) return false
    return unref(this._maximize) ?? Defaults.maximize
  }

  set showPredictionInterval(on: boolean) {
    this.setValue('_showPredictionInterval', on)
  }

  get showPredictionInterval(): boolean {
    if (
      (!this.isExcess && !this.showBaseline) ||
      this.isMatrixChartStyle() ||
      (this.cumulative && !this.showCumPi())
    )
      return false

    const val = unref(this._showPredictionInterval)
    if (val !== undefined) return val
    return this.isExcess
      ? !Defaults.showPredictionInterval
      : Defaults.showPredictionInterval
  }

  set showLabels(on: boolean) {
    this.setValue('_showLabels', on)
  }

  get showLabels(): boolean {
    const val = unref(this._showLabels)

    const result =
      val ??
      (Defaults.showLabels &&
        this.allChartData &&
        this.dateToIndex() - this.dateFromIndex() + 1 <= (isMobile() ? 20 : 60))
    return result
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

  get showPercentage(): boolean {
    if (!this.isExcess) return false
    return unref(this._showPercentage) ?? (this.isExcess && !this.cumulative)
  }

  set showPercentage(on: boolean) {
    this.setValue('_showPercentage', on)
  }

  get isLogarithmic(): boolean {
    if (this.isMatrixChartStyle() || this.isExcess) return false
    return unref(this._isLogarithmic) ?? Defaults.isLogarithmic
  }

  set isLogarithmic(on: boolean) {
    this.setValue('_isLogarithmic', on)
  }

  set baselineDateFrom(val: string | undefined) {
    this.setValue('_baselineDateFrom', val)
  }

  get baselineDateFrom(): string {
    if (this._baselineDateFrom) {
      const df = unref(this._baselineDateFrom)
      if (df) return df
    }
    const labels = unref(this.allChartLabels)!
    return defaultBaselineFromDate(this.chartType, labels, this.baselineMethod)
  }

  set baselineDateTo(val: string | undefined) {
    this.setValue('_baselineDateTo', val)
  }

  get baselineDateTo(): string {
    return unref(this._baselineDateTo) ?? defaultBaselineToDate(this.chartType)
  }

  set baselineMethod(val: string) {
    this.setValue('_baselineMethod', val)
  }

  get baselineMethod(): string {
    let method = unref(this._baselineMethod)
    if (method) return method
    switch (this.type) {
      case 'cmr':
      case 'deaths':
        method = 'lin_reg'
        break
      default:
        method = Defaults.baselineMethod
    }
    return method
  }

  set userColors(val: string[] | undefined) {
    this.setValue('_userColors', val)
  }

  get userColors(): string[] | undefined {
    return unref(this._userColors) ?? Defaults.userColors
  }

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

  baselineMethodEntry = (): ListType =>
    baselineMethods.filter((v) => v.value === this.baselineMethod)[0]

  // Helper Functions
  isAsmrType = () => this.type.includes('asmr')

  isPopulationType = () => this.type === 'population'

  isLifeExpectancyType = () => this.type === 'le'

  isDeathsType = () => this.type.includes('deaths')

  isErrorBarType = () => this.isBarChartStyle() && this.isExcess

  hasBaseline = () => !this.isPopulationType() && !this.isExcess

  isLineChartStyle = () => this.chartStyle === 'line'

  isBarChartStyle = () => this.chartStyle === 'bar'

  isMatrixChartStyle = () => this.chartStyle === 'matrix'

  isWeeklyChartType = () => this.chartType.includes('weekly')

  isMonthlyChartType = () => this.chartType.includes('monthly')

  isYearlyChartType = () =>
    this.chartType.includes('year') ||
    this.chartType.includes('fluseason') ||
    this.chartType.includes('midyear')

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
    getKeyForType(this.type, this.showBaseline, this.standardPopulation, false)

  getMaxDateType() {
    if (this.type.includes('deaths') || this.type.includes('cmr')) return 'cmr'
    return 'asmr'
  }

  periodMultiplicatorForType = () => {
    switch (this.chartType) {
      case 'weekly':
      case 'weekly_104w_sma':
      case 'weekly_52w_sma':
      case 'weekly_26w_sma':
      case 'weekly_13w_sma':
        return 52.1429
      case 'monthly':
        return 12
      case 'quarterly':
        return 4
      default:
        return 1
    }
  }

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

  // Backwards compatability
  isIsoKey = (str: string) => {
    return (
      str === str.toUpperCase() &&
      (str.length === 3 ||
        /^(USA-\w{2})$/.test(str) ||
        /^(DEU-\w{2})$/.test(str) ||
        /^(GBR\w{4})$/.test(str))
    )
  }

  showCumPi = (): boolean =>
    this.cumulative &&
    this.isYearlyChartType() &&
    ['lin_reg', 'mean'].includes(this.baselineMethod)

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
        this.allYearlyChartLabelsUnique.value =
          this.allChartLabels.value.filter((x) => parseInt(x) <= 2017)
      } else {
        this.allYearlyChartLabels.value = Array.from(
          this.allChartLabels.value.map((v) => v.substring(0, 4))
        )
        this.allYearlyChartLabelsUnique.value = Array.from(
          new Set(this.allYearlyChartLabels.value)
        ).filter((x) => parseInt(x) <= 2017)
      }
    }

    if (shouldDownloadDataset || shouldUpdateDataset) {
      this.resetBaselineDates()

      // Update all chart specific data
      const newData = await getAllChartData(
        getKeyForType(this.type, this.showBaseline, this.standardPopulation)[0],
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
    if (this.chartData) {
      Object.assign(this.chartData, await this.updateFilteredData())
    } else this.chartData = reactive(await this.updateFilteredData())

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
      await this.makeUrl(),
      this.isLogarithmic,
      this.isPopulationType(),
      this.isDeathsType(),
      this.allChartData.labels!,
      this.allChartData.data!
    )

  handleUpdate = async (key: string) => {
    console.log('Handle state updates: ' + key)
    if (this.countries.length) {
      await this.updateData(
        ['_countries', '_type', '_chartType', '_ageGroups'].includes(key),
        [
          '_baselineMethod',
          '_standardPopulation',
          '_baselineDateFrom',
          '_baselineDateTo',
          '_sliderStart'
        ].includes(key) ||
          (this.baselineMethod !== 'auto' && key == '_cumulative')
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
        result.push(
          `${this.allCountries[iso3c].jurisdiction}: No data for age groups: ${Array.from(
            ags
          ).join(', ')}`
        )
      }
    }

    // No ASMR
    if (notes?.noAsmr) {
      for (const iso3c of notes.noAsmr) {
        result.push(
          `${this.allCountries[iso3c].jurisdiction}: No ASMR data available. Please consider using CMR instead.`
        )
      }
    }
    // Disaggregated
    if (notes?.disaggregatedData) {
      for (const iso3c in notes.disaggregatedData) {
        const types: string[] = []
        for (const ord of notes.disaggregatedData[iso3c])
          types.push(getChartTypeFromOrdinal(ord))
        result.push(
          `${this.allCountries[iso3c].jurisdiction}: Data may be disaggregated from ${types.join(
            ', '
          )} resolution.`
        )
      }
    }

    return result.sort()
  }

  getChartDataRaw = () => toRaw(this.chartData)
}
