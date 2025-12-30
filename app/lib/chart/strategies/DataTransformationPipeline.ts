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
 * Note: null values create gaps in Chart.js (undefined is converted to 0)
 */
function makeErrorBarData(
  row: (number | null)[],
  lowerRow: (number | null | undefined)[],
  upperRow: (number | null | undefined)[]
): ChartErrorDataPoint[] {
  const result: ChartErrorDataPoint[] = []
  for (let i = 0; i < row.length; i++) {
    const y = row[i]
    result.push({
      x: i,
      y: y ?? null, // null values create gaps in Chart.js
      yMin: lowerRow[i] ?? null,
      yMax: upperRow[i] ?? null,
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
 * Get the last non-null value from an array.
 * Used for cumulative data where the last value is the total.
 */
function getLastValue(arr: (number | null | undefined)[]): number[] {
  for (let i = arr.length - 1; i >= 0; i--) {
    const val = arr[i]
    if (val !== null && val !== undefined && !isNaN(val)) {
      return [val]
    }
  }
  return [0]
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
        // When showCumPi is true, data is already cumulative from /cum endpoint
        if (config.showCumPi) {
          return this.percentageStrategy.transform(dataRow, blDataRow)
        }
        return this.percentageStrategy.transform(
          this.cumulativeStrategy.transform(dataRow),
          this.cumulativeStrategy.transform(blDataRow)
        )
      }

      // Cumulative total percentage
      // When showCumPi is true, data is already cumulative - use last value as total
      // When showCumPi is false, sum all values to get total
      const getTotalFn = config.showCumPi ? getLastValue : this.totalStrategy.transform.bind(this.totalStrategy)
      const totalData = getTotalFn(dataRow)
      const totalBl = getTotalFn(blDataRow)
      return this.percentageStrategy.transform(
        totalData,
        totalBl
      )
    } else {
      if (!config.cumulative) {
        // Absolute
        return dataRow
      }

      if (!config.showTotal) {
        // Cumulative
        // When showCumPi is true, data is already cumulative from /cum endpoint
        if (config.showCumPi) {
          return dataRow
        }
        return this.cumulativeStrategy.transform(dataRow)
      }

      // Cumulative total
      // When showCumPi is true, data is already cumulative - use last value as total
      // When showCumPi is false, sum all values to get total
      if (config.showCumPi) {
        return getLastValue(dataRow)
      }
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

    if (!config.cumulative) {
      // Absolute percentage
      // Use transformPreservingUndefined for error bars to hide PI in baseline period
      return makeErrorBarData(
        this.percentageStrategy.transform(data, blDataRow),
        this.percentageStrategy.transformPreservingUndefined(dataL, blDataRow),
        this.percentageStrategy.transformPreservingUndefined(dataU, blDataRow)
      )
    }

    if (!config.showTotal) {
      return this.transformCumulativePercentageErrorBar(
        config,
        data,
        dataL,
        dataU,
        blDataRow
      )
    }

    // Cumulative total percentage
    return this.transformTotalPercentageErrorBar(
      config,
      data,
      dataL,
      dataU,
      blDataRow
    )
  }

  /**
   * Transform cumulative percentage error bar data
   *
   * Note: Error bar bounds (dataL/dataU) are divided by the baseline center (blDataRow),
   * not the baseline bounds. This is correct because:
   * - dataL/dataU represent the prediction interval around the excess value
   * - The percentage should show "excess as % of baseline" for both center and bounds
   * - Using baseline bounds would incorrectly mix two different uncertainty measures
   *
   * When showCumPi is true, data is already cumulative from /cum endpoint,
   * so we skip the cumulative transformation to avoid double-cumulation.
   */
  private transformCumulativePercentageErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[],
    blDataRow: number[]
  ): ChartErrorDataPoint[] {
    if (config.showCumPi) {
      // Data is already cumulative from /cum endpoint - use as-is
      // blDataRow is also already cumulative (baseline from /cum)
      return makeErrorBarData(
        this.percentageStrategy.transform(data, blDataRow),
        this.percentageStrategy.transformPreservingUndefined(dataL, blDataRow),
        this.percentageStrategy.transformPreservingUndefined(dataU, blDataRow)
      )
    }

    // Regular cumulative mode - apply cumsum transformation
    const cumData = this.cumulativeStrategy.transform(data)
    const cumBl = this.cumulativeStrategy.transform(blDataRow)

    return makeErrorBarData(
      this.percentageStrategy.transform(cumData, cumBl),
      repeat(null, data.length),
      repeat(null, data.length)
    )
  }

  /**
   * Transform total percentage error bar data
   *
   * Note: Error bar bounds use baseline center (see transformCumulativePercentageErrorBar)
   *
   * When showCumPi is true, data is already cumulative from /cum endpoint.
   * The last value IS the cumulative total, so we use getLastValue instead of summing.
   */
  private transformTotalPercentageErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[],
    blDataRow: number[]
  ): ChartErrorDataPoint[] {
    // When showCumPi is true, data is already cumulative - use last value as total
    // When showCumPi is false, sum all values to get total
    const getTotalFn = config.showCumPi
      ? getLastValue
      : this.totalStrategy.transform.bind(this.totalStrategy)

    const totalData = getTotalFn(data)
    const totalBl = getTotalFn(blDataRow)

    if (config.showCumPi) {
      // Use transformPreservingUndefined to hide PI if any data is undefined
      return makeErrorBarData(
        this.percentageStrategy.transform(totalData, totalBl),
        this.percentageStrategy.transformPreservingUndefined(
          getLastValue(dataL),
          totalBl
        ),
        this.percentageStrategy.transformPreservingUndefined(
          getLastValue(dataU),
          totalBl
        )
      )
    }

    return makeErrorBarData(
      this.percentageStrategy.transform(totalData, totalBl),
      [null],
      [null]
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
   *
   * When showCumPi is true, data is already cumulative from /cum endpoint,
   * so we skip the cumulative transformation to avoid double-cumulation.
   */
  private transformCumulativeAbsoluteErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    if (config.showCumPi) {
      // Data is already cumulative from /cum endpoint - use as-is
      return makeErrorBarData(data, dataL, dataU)
    }

    // Regular cumulative mode - apply cumsum transformation
    return makeErrorBarData(
      this.cumulativeStrategy.transform(data),
      repeat(null, data.length),
      repeat(null, data.length)
    )
  }

  /**
   * Transform total absolute error bar data
   *
   * When showCumPi is true, data is already cumulative from /cum endpoint.
   * The last value IS the cumulative total, so we use getLastValue instead of summing.
   */
  private transformTotalAbsoluteErrorBar(
    config: TransformConfig,
    data: number[],
    dataL: number[],
    dataU: number[]
  ): ChartErrorDataPoint[] {
    if (config.showCumPi) {
      // Data is already cumulative - use last value as total
      return makeErrorBarData(
        getLastValue(data),
        getLastValue(dataL),
        getLastValue(dataU)
      )
    }

    return makeErrorBarData(
      this.totalStrategy.transform(data),
      [null],
      [null]
    )
  }
}
