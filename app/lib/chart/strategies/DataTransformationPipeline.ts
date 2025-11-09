/**
 * Pipeline for applying data transformation strategies in sequence
 * Reduces complexity of nested conditionals by using strategy pattern
 */

import type { ChartErrorDataPoint } from '../chartTypes'
import { PercentageTransformStrategy } from './PercentageTransformStrategy'
import { CumulativeTransformStrategy } from './CumulativeTransformStrategy'
import { TotalTransformStrategy } from './TotalTransformStrategy'
import { ZScoreTransformStrategy } from './ZScoreTransformStrategy'

interface TransformConfig {
  showPercentage: boolean
  cumulative: boolean
  showTotal: boolean
  showCumPi: boolean
  isAsmrType: boolean
  view?: string
}

/**
 * Helper to create error bar data points
 */
function makeErrorBarData(
  row: number[],
  lowerRow: (number | undefined)[],
  upperRow: (number | undefined)[]
): ChartErrorDataPoint[] {
  const result: ChartErrorDataPoint[] = []
  for (let i = 0; i < row.length; i++) {
    result.push({
      x: i,
      y: row[i] ?? 0,
      yMin: lowerRow[i],
      yMax: upperRow[i],
      yMinMin: undefined,
      yMaxMax: undefined
    })
  }
  return result
}

/**
 * Helper to create array of repeated values
 */
function repeat<T>(value: T, length: number): T[] {
  return new Array(length).fill(value)
}

/**
 * Pipeline that applies transformation strategies based on configuration
 * Replaces deeply nested conditionals with clear strategy application
 */
export class DataTransformationPipeline {
  private percentageStrategy = new PercentageTransformStrategy()
  private cumulativeStrategy = new CumulativeTransformStrategy()
  private totalStrategy = new TotalTransformStrategy()
  private zscoreStrategy = new ZScoreTransformStrategy()

  /**
   * Transform simple data (non-error-bar data)
   */
  transformData(
    config: TransformConfig,
    data: Record<string, number[]>,
    key: string
  ): number[] {
    const dataRow = data[key] ?? []

    // Z-scores take priority over other transformations
    // Z-scores are pre-calculated by the R stats API and stored as <metric>_zscore
    // Only apply to main data, not baseline/PI keys
    if (config.view === 'zscore' && !key.includes('baseline') && !key.includes('_lower') && !key.includes('_upper') && !key.includes('excess')) {
      const zscoreKey = this.zscoreStrategy.getZScoreKey(config.isAsmrType, key)
      const zscoreData = data[zscoreKey] ?? []
      const availableKeys = Object.keys(data)
      console.log('[pipeline] Z-Score Transform:', {
        key,
        zscoreKey,
        hasData: zscoreData.length > 0,
        dataLength: zscoreData.length,
        sample: zscoreData.slice(0, 10),
        fullData: zscoreData,
        availableKeys,
        isAsmr: config.isAsmrType,
        allData: data
      })
      if (zscoreData.length > 0) {
        console.log('[pipeline] ✅ RETURNING Z-SCORE DATA:', zscoreData)
      } else {
        console.log('[pipeline] ❌ NO Z-SCORE DATA FOUND for key:', zscoreKey)
      }
      return zscoreData
    }

    if (config.showPercentage) {
      const blKey = this.percentageStrategy.getBaselineKey(config.isAsmrType, key)
      const blDataRow = data[blKey] ?? []

      if (!config.cumulative) {
        // Absolute percentage
        return this.percentageStrategy.transform(dataRow, blDataRow)
      }

      if (!config.showTotal) {
        // Cumulative percentage
        return this.percentageStrategy.transform(
          this.cumulativeStrategy.transform(dataRow),
          this.cumulativeStrategy.transform(blDataRow)
        )
      }

      // Cumulative total percentage
      return this.percentageStrategy.transform(
        this.totalStrategy.transform(dataRow),
        this.totalStrategy.transform(blDataRow)
      )
    } else {
      if (!config.cumulative) {
        // Absolute
        return dataRow
      }

      if (!config.showTotal) {
        // Cumulative
        return this.cumulativeStrategy.transform(dataRow)
      }

      // Cumulative total
      return this.totalStrategy.transform(dataRow)
    }
  }

  /**
   * Transform error bar data (excess data with confidence intervals)
   * Reduces 5+ levels of nesting to clear pipeline steps
   */
  transformErrorBarData(
    config: TransformConfig,
    dataRaw: Record<string, number[]>,
    key: string
  ): ChartErrorDataPoint[] {
    const data = dataRaw[key] ?? []
    const dataL = dataRaw[`${key}_lower`] ?? []
    const dataU = dataRaw[`${key}_upper`] ?? []

    if (config.showPercentage) {
      return this.transformPercentageErrorBar(config, dataRaw, key, data, dataL, dataU)
    } else {
      return this.transformAbsoluteErrorBar(config, data, dataL, dataU)
    }
  }

  /**
   * Transform error bar data with percentage calculations
   */
  private transformPercentageErrorBar(
    config: TransformConfig,
    dataRaw: Record<string, number[]>,
    key: string,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    const blKey = this.percentageStrategy.getBaselineKey(config.isAsmrType, key)
    const blDataRow = dataRaw[blKey] ?? []
    const blDataLRow = dataRaw[this.percentageStrategy.getBaselineKey(config.isAsmrType, `${key}_lower`)] ?? []
    const blDataURow = dataRaw[this.percentageStrategy.getBaselineKey(config.isAsmrType, `${key}_upper`)] ?? []

    if (!config.cumulative) {
      // Absolute percentage
      return makeErrorBarData(
        this.percentageStrategy.transform(data, blDataRow),
        this.percentageStrategy.transform(dataL, blDataLRow),
        this.percentageStrategy.transform(dataU, blDataURow)
      )
    }

    if (!config.showTotal) {
      return this.transformCumulativePercentageErrorBar(
        config,
        data,
        dataL,
        dataU,
        blDataRow,
        blDataLRow,
        blDataURow
      )
    }

    // Cumulative total percentage
    return this.transformTotalPercentageErrorBar(
      config,
      data,
      dataL,
      dataU,
      blDataRow,
      blDataLRow,
      blDataURow
    )
  }

  /**
   * Transform cumulative percentage error bar data
   */
  private transformCumulativePercentageErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[],
    blDataRow: number[],
    blDataLRow: number[],
    blDataURow: number[]
  ): ChartErrorDataPoint[] {
    const cumData = this.cumulativeStrategy.transform(data)
    const cumBl = this.cumulativeStrategy.transform(blDataRow)

    if (config.showCumPi) {
      return makeErrorBarData(
        this.percentageStrategy.transform(cumData, cumBl),
        this.percentageStrategy.transform(
          this.cumulativeStrategy.transform(dataL),
          this.cumulativeStrategy.transform(blDataLRow)
        ),
        this.percentageStrategy.transform(
          this.cumulativeStrategy.transform(dataU),
          this.cumulativeStrategy.transform(blDataURow)
        )
      )
    }

    return makeErrorBarData(
      this.percentageStrategy.transform(cumData, cumBl),
      repeat(undefined, data.length),
      repeat(undefined, data.length)
    )
  }

  /**
   * Transform total percentage error bar data
   */
  private transformTotalPercentageErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[],
    blDataRow: number[],
    blDataLRow: number[],
    blDataURow: number[]
  ): ChartErrorDataPoint[] {
    const totalData = this.totalStrategy.transform(data)
    const totalBl = this.totalStrategy.transform(blDataRow)

    if (config.showCumPi) {
      return makeErrorBarData(
        this.percentageStrategy.transform(totalData, totalBl),
        this.percentageStrategy.transform(
          this.totalStrategy.transform(dataL),
          this.totalStrategy.transform(blDataLRow)
        ),
        this.percentageStrategy.transform(
          this.totalStrategy.transform(dataU),
          this.totalStrategy.transform(blDataURow)
        )
      )
    }

    return makeErrorBarData(
      this.percentageStrategy.transform(totalData, totalBl),
      [undefined],
      [undefined]
    )
  }

  /**
   * Transform error bar data with absolute (non-percentage) calculations
   */
  private transformAbsoluteErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    if (!config.cumulative) {
      // Absolute
      return makeErrorBarData(data, dataL, dataU)
    }

    if (!config.showTotal) {
      return this.transformCumulativeAbsoluteErrorBar(config, data, dataL, dataU)
    }

    // Cumulative total
    return this.transformTotalAbsoluteErrorBar(config, data, dataL, dataU)
  }

  /**
   * Transform cumulative absolute error bar data
   */
  private transformCumulativeAbsoluteErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    if (config.showCumPi) {
      return makeErrorBarData(
        this.cumulativeStrategy.transform(data),
        this.cumulativeStrategy.transform(dataL),
        this.cumulativeStrategy.transform(dataU)
      )
    }

    return makeErrorBarData(
      this.cumulativeStrategy.transform(data),
      repeat(undefined, data.length),
      repeat(undefined, data.length)
    )
  }

  /**
   * Transform total absolute error bar data
   */
  private transformTotalAbsoluteErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    if (config.showCumPi) {
      return makeErrorBarData(
        this.totalStrategy.transform(data),
        this.totalStrategy.transform(dataL),
        this.totalStrategy.transform(dataU)
      )
    }

    return makeErrorBarData(
      this.totalStrategy.transform(data),
      [undefined],
      [undefined]
    )
  }
}
