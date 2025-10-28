import type { LocationQuery } from 'vue-router'
import { decompress, base64ToArrayBuffer } from '@/lib/compression/compress.browser'
import { showToast } from '@/toast'
import { decodeBool, decodeString } from '@/model/serializable'
import type { Country } from '@/model'
import type { StateProperties } from './stateProperties'

/**
 * Handles state serialization/deserialization from URL
 *
 * Updated in Phase 9.3 to use StateProperties directly (no more @ts-expect-error!)
 */
export class StateSerialization {
  constructor(
    private props: StateProperties,
    private allCountries: Record<string, Country>
  ) {}

  async initFromSavedState(locationQuery: LocationQuery): Promise<void> {
    let encodedState: LocationQuery | undefined = locationQuery

    // QR Code
    if (locationQuery.qr && typeof locationQuery.qr === 'string') {
      const decoded = base64ToArrayBuffer(locationQuery.qr)
      const decompressed = await decompress(decoded)
      try {
        encodedState = JSON.parse(decompressed)
      } catch (e) {
        console.error(e)
        showToast('Your browser lacks state decompression support.')
        encodedState = undefined
      }
    } else if (locationQuery.q && typeof locationQuery.q === 'string') {
      try {
        encodedState = JSON.parse(decodeURIComponent(locationQuery.q))
      } catch (e) {
        console.error(e)
        try {
          encodedState = JSON.parse(
            decodeURIComponent(decodeURIComponent(locationQuery.q))
          )
        } catch (e) {
          console.error(e)
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
      let validCountries = countries.filter(x =>
        validCountryCodes.includes(x)
      )
      if (!validCountries || !validCountries.length)
        validCountries = ['USA', 'SWE']
      this.props.countries = validCountries
    }

    // Age Groups; Validate before assignment
    const ageGroups = (
      Array.isArray(encodedState.ag) || !encodedState.ag
        ? encodedState.ag
        : [encodedState.ag]
    ) as string[]
    if (ageGroups && ageGroups.length) {
      const validAgeGroups = []
      for (const iso3c of this.props.countries) {
        const country = this.allCountries[iso3c]
        if (!country) continue
        for (const ds of country.data_source) {
          validAgeGroups.push(
            ...Array.from(ds.age_groups).filter(value =>
              ageGroups.includes(value)
            )
          )
        }
      }
      this.props.ageGroups = !validAgeGroups.length ? ['all'] : validAgeGroups
    }

    if (encodedState.t) {
      this.props.type = (encodedState.t as string).replace('_excess', '')
    }
    if (encodedState.ct !== 'ytd') {
      // YTD not supported anymore, use default.
      this.props.chartType = encodedState.ct as string
    }
    const isExcess = decodeBool(encodedState.e as string)
      ?? encodedState.t?.includes('_excess')
    if (isExcess !== undefined) {
      this.props.isExcess = isExcess
    }
    if (encodedState.cs) {
      this.props.chartStyle = encodedState.cs as string
    }
    this.props.dateFrom = decodeString(encodedState.df as string)
    this.props.dateTo = decodeString(encodedState.dt as string)
    if (encodedState.ss) {
      this.props.sliderStart = encodedState.ss as string
    }
    this.props.baselineDateFrom = decodeString(encodedState.bf as string)
    this.props.baselineDateTo = decodeString(encodedState.bt as string)
    if (encodedState.sp) {
      this.props.standardPopulation = encodedState.sp as string
    }
    const showBaseline = decodeBool(encodedState.sb as string)
    if (showBaseline !== undefined) {
      this.props.showBaseline = showBaseline
    }
    if (encodedState.bm) {
      this.props.baselineMethod = encodedState.bm as string
    }
    const cumulative = decodeBool(encodedState.ce as string)
    if (cumulative !== undefined) {
      this.props.cumulative = cumulative
    }
    const showTotal = decodeBool(encodedState.st as string)
    if (showTotal !== undefined) {
      this.props.showTotal = showTotal
    }
    const maximize = decodeBool(encodedState.m as string)
    if (maximize !== undefined) {
      this.props.maximize = maximize
    }
    const showPredictionInterval = decodeBool(encodedState.pi as string)
    if (showPredictionInterval !== undefined) {
      this.props.showPredictionInterval = showPredictionInterval
    }
    const showLabels = decodeBool(encodedState.sl as string)
    if (showLabels !== undefined) {
      this.props.showLabels = showLabels
    }
    const showPercentage = decodeBool(encodedState.p as string)
    if (showPercentage !== undefined) {
      this.props.showPercentage = showPercentage
    }
    const isLogarithmic = decodeBool(encodedState.lg as string)
    if (isLogarithmic !== undefined) {
      this.props.isLogarithmic = isLogarithmic
    }

    const userColors = (
      Array.isArray(encodedState.uc) || !encodedState.uc
        ? encodedState.uc
        : [encodedState.uc]
    ) as string[]
    if (userColors && userColors.length) {
      this.props.userColors = userColors
    }
  }
}
