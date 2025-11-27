/**
 * Chart dataset builders
 *
 * This module generates Chart.js datasets for mortality visualizations.
 *
 * ## Rendering Architecture
 *
 * The app uses two different approaches for rendering reference data:
 *
 * ### 1. Dataset Fill (baseline/prediction intervals)
 * Used for: Baseline curves and their prediction interval bands
 * Why: Baseline values vary per data point (it's a curve, not a flat line).
 * Chart.js `fill` property with relative offset (e.g., '-1') fills between
 * the PI bound dataset and the baseline dataset.
 *
 * Example keys: deaths_baseline, deaths_baseline_lower, deaths_baseline_upper
 *
 * ### 2. Annotation Plugin (z-score reference lines)
 * Used for: Fixed horizontal reference lines (0σ, ±2σ, +4σ)
 * Why: Z-score thresholds are fixed values that don't change with x-axis position.
 * The chartjs-plugin-annotation creates horizontal line/box annotations.
 *
 * See: app/lib/chart/chartViews/zscore.ts for reference line configuration
 *
 * This architectural difference is intentional - each approach is optimized
 * for its specific use case.
 */

import type { ChartDataset, ChartType, DefaultDataPoint } from 'chart.js'
import type { DataTransformationConfig } from './types'
import {
  getKeyForType,
  type DatasetReturn,
  type Dataset
} from '~/model'
import { getCamelCase } from '~/utils'
import { isBl, isPredictionIntervalKey } from './predicates'
import { DataTransformationPipeline } from './strategies/DataTransformationPipeline'
import { DATA_CONFIG } from '@/lib/config/constants'

const SUBREGION_SEPERATOR = DATA_CONFIG.SUBREGION_SEPARATOR

// Create a singleton pipeline instance
const transformPipeline = new DataTransformationPipeline()

const getLabel = (key: string, country: string, ageGroup: string) => {
  if (isBl(key) || isPredictionIntervalKey(key)) return ''
  const idx = country.indexOf(SUBREGION_SEPERATOR)
  if (idx > -1) return `${country.substring(idx + 3)}${ageGroup}`
  return `${country}${ageGroup}`
}

const getPointBackgroundColor = (key: string, color: string) => {
  if (isBl(key) || isPredictionIntervalKey(key)) return color + '00'
  return color
}

const getBackgroundColor = (key: string, color: string) => {
  if (isPredictionIntervalKey(key)) return color + '55'
  return color + 'ff'
}

const getBorderDash = (key: string) => {
  if (key.endsWith('_baseline')) return [2, 2]
  if (key.endsWith('_prediction')) return [6, 4]
  return undefined
}

const getBorderWidth = (key: string, isBarChartStyle: boolean) => {
  if (isPredictionIntervalKey(key)) return 0
  if (
    isBarChartStyle
    && !key.endsWith('_baseline')
    && !isPredictionIntervalKey(key)
  )
    return 0
  return 1.2
}

const getPointRadius = (chartType: string, key: string) => {
  if (isBl(key) && !['yearly', 'fluseason', 'midyear'].includes(chartType))
    return 0
  if (chartType.includes('quarterly')) return 2
  if (chartType.includes('monthly')) return 1.5
  if (chartType.includes('weekly')) return 1
  return 3
}

const getType = (key: string, isBarChartStyle: boolean, isExcess: boolean) => {
  if (isBarChartStyle && isExcess) return 'barWithErrorBars'
  else return isBarChartStyle && !key.includes('_baseline') ? 'bar' : 'line'
}

const getSource = (ds: Record<string, unknown[]>, key: string) => {
  if (key.startsWith('asmr') && ds['source_asmr']) {
    return ds.source_asmr
  } else {
    return ds.source
  }
}

/**
 * Calculate fill target for prediction interval datasets
 *
 * For baseline PI: _baseline_lower and _baseline_upper should fill toward _baseline
 * For excess PI: _excess_lower and _excess_upper should fill toward _excess (main data)
 *
 * Uses relative string format (e.g., '-1', '-2') for Chart.js fill
 *
 * @param key - Current dataset key (e.g., 'deaths_baseline_lower')
 * @param keys - All keys for current country (e.g., ['deaths', 'deaths_baseline', ...])
 * @param keyIndex - Index of current key in keys array
 * @returns Fill target string (e.g., '-1') or undefined if not a PI key
 */
const getFillTarget = (
  key: string,
  keys: string[],
  keyIndex: number
): string | undefined => {
  if (!isPredictionIntervalKey(key)) return undefined

  // For baseline PI (_baseline_lower, _baseline_upper), fill toward _baseline
  if (key.includes('_baseline_lower') || key.includes('_baseline_upper')) {
    // Find the index of the corresponding _baseline key
    const baselineKey = key.replace('_lower', '').replace('_upper', '')
    const baselineIndex = keys.indexOf(baselineKey)
    if (baselineIndex >= 0) {
      // Return relative offset (negative = previous dataset)
      return String(baselineIndex - keyIndex)
    }
  }

  // For excess PI (_excess_lower, _excess_upper), fill toward _excess (main data)
  if (key.includes('_excess_lower') || key.includes('_excess_upper')) {
    // Find the index of the corresponding _excess key
    const excessKey = key.replace('_lower', '').replace('_upper', '')
    const excessIndex = keys.indexOf(excessKey)
    if (excessIndex >= 0) {
      return String(excessIndex - keyIndex)
    }
  }

  return undefined
}

/**
 * Generate chart datasets with transformed data
 * @param config - Configuration object containing display, chart, visual, and context settings
 * @param data - The dataset to process
 * @returns Dataset return object with datasets and sources
 */
export const getDatasets = (
  config: DataTransformationConfig,
  data: Dataset
): DatasetReturn => {
  let countryIndex = 0
  const datasets: ChartDataset<ChartType, DefaultDataPoint<ChartType>>[] = []
  const sources = new Set<string>()
  const ags = Object.keys(data)

  // Create transformation config for pipeline
  const transformConfig = {
    showPercentage: config.display.showPercentage,
    cumulative: config.display.cumulative,
    showTotal: config.display.showTotal,
    showCumPi: config.display.showCumPi,
    isAsmrType: config.chart.isAsmrType,
    view: config.display.view ?? 'mortality'
  }

  if (config.display.view === 'zscore') {
    const firstAg = ags[0]
    console.log('[datasets] Z-Score view active, checking data structure:', {
      transformConfig,
      firstAg,
      sampleCountryKeys: firstAg && data[firstAg] ? Object.keys(data[firstAg]).slice(0, 2) : []
    })
  }

  for (const ag of ags) {
    const agData = data[ag]
    if (!agData) continue
    for (const iso3c of Object.keys(agData)) {
      const ds = agData[iso3c]
      if (!ds) continue
      const dsRecord: Record<string, unknown[]> = ds

      if (config.display.view === 'zscore' && iso3c === Object.keys(agData)[0]) {
        const allKeys = Object.keys(dsRecord)
        const zscoreKeys = allKeys.filter(k => k.includes('zscore'))
        console.log('[datasets] First country data keys:', {
          total: allKeys.length,
          allKeys,
          zscoreKeys,
          hasZscoreData: zscoreKeys.length > 0,
          asmrWhoZscore: dsRecord.asmr_who_zscore,
          asmrWho: dsRecord.asmr_who
        })
      }
      // Z-score view: baseline required for calculation but hidden from display
      const shouldIncludeBaseline = config.display.view === 'zscore'
        ? false
        : config.display.showBaseline

      const keys = getKeyForType(
        config.chart.type,
        shouldIncludeBaseline,
        config.chart.standardPopulation,
        config.chart.isExcess,
        true
      )
      const country = config.context.allCountries[iso3c]
      if (!country) throw new Error(`No country found for iso3c ${iso3c}`)
      keys.forEach((key, keyIndex) => {
        if (
          config.chart.isErrorBarType
          && (key.endsWith('_lower') || key.endsWith('_upper'))
        )
          return
        const fillTarget = getFillTarget(key, keys, keyIndex)
        const color: string = config.visual.colors[countryIndex] ?? '#000000'
        const ag_str = ags.length === 1 ? '' : ` [${getCamelCase(ag)}]`
        const label = getLabel(
          key,
          config.chart.isMatrixChartStyle || datasets.length === 0 || config.context.countries.length > 1
            ? country.jurisdiction
            : '',
          ag_str
        )
        if (label !== '') {
          const source = getSource(dsRecord, key)
          if (source) {
            (source as string[])
              .join(', ')
              .split(', ')
              .forEach(x => sources.add(x))
          }
        }
        datasets.push({
          label,
          data:
            config.chart.isErrorBarType && config.display.showPredictionInterval
              ? transformPipeline.transformErrorBarData(
                  transformConfig,
                  dsRecord as Record<string, number[]>,
                  key
                )
              : transformPipeline.transformData(
                  transformConfig,
                  dsRecord as Record<string, number[]>,
                  key
                ),
          borderColor: config.visual.colors[countryIndex],
          backgroundColor: getBackgroundColor(key, color),
          fill: fillTarget,
          borderWidth: getBorderWidth(key, config.chart.isBarChartStyle),
          borderDash: getBorderDash(key),
          pointRadius:
            config.context.countries.length * ags.length > 5
              ? 0
              : getPointRadius(config.chart.chartType, key),
          pointBackgroundColor: getPointBackgroundColor(key, color),
          type: getType(key, config.chart.isBarChartStyle, config.chart.isExcess),
          hidden: isPredictionIntervalKey(key) && !config.display.showPredictionInterval
        })
      })
      countryIndex++
    }
  }

  if (config.display.showTotal) {
    return {
      datasets: datasets.sort(
        (a, b) => (a.data[0] as number) - (b.data[0] as number)
      ),
      sources: Array.from(sources)
    }
  }
  return { datasets, sources: Array.from(sources) } as DatasetReturn
}
