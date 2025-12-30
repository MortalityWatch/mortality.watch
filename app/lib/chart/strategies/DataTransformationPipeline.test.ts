/**
 * Tests for DataTransformationPipeline
 */

import { describe, it, expect } from 'vitest'
import { DataTransformationPipeline } from './DataTransformationPipeline'

describe('DataTransformationPipeline', () => {
  const pipeline = new DataTransformationPipeline()

  describe('transformData', () => {
    it('should return data as-is for absolute non-percentage', () => {
      const data = { key1: [10, 20, 30] }
      const config = {
        showPercentage: false,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      expect(result).toEqual([10, 20, 30])
    })

    it('should calculate cumulative sums', () => {
      const data = { key1: [10, 20, 30] }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      expect(result).toEqual([10, 30, 60])
    })

    it('should calculate total sum (showCumPi=false)', () => {
      const data = { key1: [10, 20, 30] }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: true,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // Sum all values: 10+20+30=60
      expect(result).toEqual([60])
    })

    it('should use last value as total when showCumPi=true (data already cumulative)', () => {
      // When showCumPi=true, data is already cumulative from /cum endpoint
      // The last value IS the cumulative total
      const data = { key1: [10, 30, 60] } // Already cumulative
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: true,
        showCumPi: true,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // Last value used as total (not sum)
      expect(result).toEqual([60])
    })

    it('should use last value for total percentage when showCumPi=true', () => {
      // This tests the fix for the 400% excess bug
      // When data is already cumulative, we use last values (not sums) for percentage
      const data = {
        key1: [10, 30, 60], // Already cumulative excess
        key1_baseline: [100, 200, 300] // Already cumulative baseline
      }
      const config = {
        showPercentage: true,
        cumulative: true,
        showTotal: true,
        showCumPi: true,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // Last value / last baseline: 60/300 = 0.2 (20%)
      // NOT: sum(10+30+60) / sum(100+200+300) = 100/600 = 0.167 (wrong!)
      expect(result).toEqual([0.2])
    })

    it('should sum values for total percentage when showCumPi=false', () => {
      const data = {
        key1: [10, 20, 30],
        key1_baseline: [100, 100, 100]
      }
      const config = {
        showPercentage: true,
        cumulative: true,
        showTotal: true,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // Sum all values for total: (10+20+30) / (100+100+100) = 60/300 = 0.2
      expect(result).toEqual([0.2])
    })

    it('should calculate percentage relative to baseline', () => {
      const data = {
        key1: [10, 20, 30],
        key1_baseline: [5, 10, 15]
      }
      const config = {
        showPercentage: true,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      expect(result).toEqual([2, 2, 2])
    })

    it('should calculate cumulative percentage', () => {
      const data = {
        key1: [10, 20, 30],
        key1_baseline: [5, 10, 15]
      }
      const config = {
        showPercentage: true,
        cumulative: true,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // cumulative: [10, 30, 60] / [5, 15, 30] = [2, 2, 2]
      expect(result).toEqual([2, 2, 2])
    })

    it('should calculate total percentage', () => {
      const data = {
        key1: [10, 20, 30],
        key1_baseline: [5, 10, 15]
      }
      const config = {
        showPercentage: true,
        cumulative: true,
        showTotal: true,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      // total: 60 / 30 = 2
      expect(result).toEqual([2])
    })

    it('should handle ASMR baseline keys correctly', () => {
      const data = {
        asmr_who_key1: [10, 20, 30],
        asmr_who_baseline: [5, 10, 15]
      }
      const config = {
        showPercentage: true,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: true
      }

      const result = pipeline.transformData(config, data, 'asmr_who_key1')

      expect(result).toEqual([2, 2, 2])
    })

    it('should calculate excess percentage relative to baseline', () => {
      // Simulates excess view: key is deaths_excess, baseline is deaths_baseline
      const data = {
        deaths_excess: [50, 100, 150], // excess deaths = actual - baseline
        deaths_baseline: [1000, 1000, 1000] // baseline
      }
      const config = {
        showPercentage: true,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'deaths_excess')

      // excess / baseline: [50/1000, 100/1000, 150/1000] = [0.05, 0.1, 0.15]
      expect(result).toEqual([0.05, 0.1, 0.15])
    })

    it('should handle missing baseline by dividing by 1', () => {
      // Documents the current behavior when baseline data is missing.
      // In normal operation, useExplorerHelpers.getBaseKeysForFetch() ensures
      // baseline is always fetched, so this edge case shouldn't occur in practice.
      // If it does occur (e.g., due to a data loading race condition), the
      // fallback to dividing by 1 produces visually incorrect percentages.
      const data = {
        deaths_excess: [500, 1000, 1500] // excess deaths
        // deaths_baseline missing!
      }
      const config = {
        showPercentage: true,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'deaths_excess')

      // When baseline is empty, divides by 1 (fallback), returning raw excess values
      // In the UI, these would display as 50000%, 100000%, 150000%
      expect(result).toEqual([500, 1000, 1500])
    })
  })

  describe('transformErrorBarData', () => {
    it('should transform absolute error bar data', () => {
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32]
      }
      const config = {
        showPercentage: false,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ x: 0, y: 10, yMin: 8, yMax: 12 })
      expect(result[1]).toMatchObject({ x: 1, y: 20, yMin: 18, yMax: 22 })
      expect(result[2]).toMatchObject({ x: 2, y: 30, yMin: 28, yMax: 32 })
    })

    it('should transform cumulative error bar data (showCumPi=true, data already cumulative)', () => {
      // When showCumPi is true, data is already cumulative from /cum endpoint
      // so no additional cumulative transformation is applied
      const data = {
        key1: [10, 30, 60], // Already cumulative
        key1_lower: [8, 26, 54], // Already cumulative
        key1_upper: [12, 34, 66] // Already cumulative
      }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: false,
        showCumPi: true,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(3)
      // Data returned as-is (already cumulative from backend)
      expect(result[0]).toMatchObject({ x: 0, y: 10, yMin: 8, yMax: 12 })
      expect(result[1]).toMatchObject({ x: 1, y: 30, yMin: 26, yMax: 34 })
      expect(result[2]).toMatchObject({ x: 2, y: 60, yMin: 54, yMax: 66 })
    })

    it('should hide confidence intervals when showCumPi is false', () => {
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32]
      }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ x: 0, y: 10, yMin: null, yMax: null })
      expect(result[1]).toMatchObject({ x: 1, y: 30, yMin: null, yMax: null })
      expect(result[2]).toMatchObject({ x: 2, y: 60, yMin: null, yMax: null })
    })

    it('should transform total error bar data (showCumPi=true, data already cumulative)', () => {
      // When showCumPi=true, data is already cumulative from /cum endpoint
      // The last value IS the total, so we use it directly instead of summing
      const data = {
        key1: [10, 30, 60], // Already cumulative
        key1_lower: [8, 26, 54], // Already cumulative
        key1_upper: [12, 34, 66] // Already cumulative
      }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: true,
        showCumPi: true,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(1)
      // Last value used as total (data is already cumulative)
      expect(result[0]).toMatchObject({ x: 0, y: 60, yMin: 54, yMax: 66 })
    })

    it('should transform total error bar data (showCumPi=false, sum all values)', () => {
      // When showCumPi=false, data is not cumulative, so sum all values for total
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32]
      }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: true,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(1)
      // Total by summing: 10+20+30=60, lower/upper are null when showCumPi=false
      expect(result[0]).toMatchObject({ x: 0, y: 60, yMin: null, yMax: null })
    })

    it('should transform percentage error bar data', () => {
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32],
        key1_baseline: [5, 10, 15],
        key1_lower_baseline: [4, 9, 14],
        key1_upper_baseline: [6, 11, 16]
      }
      const config = {
        showPercentage: true,
        cumulative: false,
        showTotal: false,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformErrorBarData(config, data, 'key1')

      expect(result).toHaveLength(3)
      // [10, 20, 30] / [5, 10, 15] = [2, 2, 2]
      // [8, 18, 28] / [5, 10, 15] = [1.6, 1.8, 1.867]
      // [12, 22, 32] / [5, 10, 15] = [2.4, 2.2, 2.133]
      expect(result[0]).toMatchObject({ x: 0, y: 2, yMin: 1.6, yMax: 2.4 })
      expect(result[1]).toMatchObject({ x: 1, y: 2, yMin: 1.8, yMax: 2.2 })
      expect(result[2]?.x).toBe(2)
      expect(result[2]?.y).toBe(2)
      expect(result[2]?.yMin).toBeCloseTo(1.867, 2)
      expect(result[2]?.yMax).toBeCloseTo(2.133, 2)
    })
  })
})
