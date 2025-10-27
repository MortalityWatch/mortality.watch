import { isRef, type Ref } from 'vue'
import type { LocationQuery } from 'vue-router'
import { loadCountryMetadata } from '@/lib/data'
import { decompress, base64ToArrayBuffer } from '@/lib/compression/compress.browser'
import { showToast } from '@/toast'
import { decodeBool, decodeString } from '@/model/serializable'
import type { Country } from '@/model'

/**
 * Handles state serialization/deserialization from URL
 */
export class StateSerialization {
  allCountries!: Record<string, Country>
  countries!: string[]

  /**
   * Generic setter that works with both refs and regular properties
   */
  async setValue(prop: string, val: unknown) {
    // @ts-expect-error - Dynamic property access
    if (isRef(this[prop])) {
      // @ts-expect-error - Dynamic property access
      (this[prop] as Ref).value = val
    } else {
      // @ts-expect-error - Dynamic property access
      this[prop] = val
    }
  }

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
      decodeBool(encodedState.e as string)
      ?? encodedState.t?.includes('_excess')
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
}
