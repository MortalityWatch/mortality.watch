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

    it('should calculate total sum', () => {
      const data = { key1: [10, 20, 30] }
      const config = {
        showPercentage: false,
        cumulative: true,
        showTotal: true,
        showCumPi: false,
        isAsmrType: false
      }

      const result = pipeline.transformData(config, data, 'key1')

      expect(result).toEqual([60])
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

    it('should transform cumulative error bar data', () => {
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32]
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
      // Cumulative: [10, 30, 60], [8, 26, 54], [12, 34, 66]
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
      expect(result[0]).toMatchObject({ x: 0, y: 10, yMin: undefined, yMax: undefined })
      expect(result[1]).toMatchObject({ x: 1, y: 30, yMin: undefined, yMax: undefined })
      expect(result[2]).toMatchObject({ x: 2, y: 60, yMin: undefined, yMax: undefined })
    })

    it('should transform total error bar data', () => {
      const data = {
        key1: [10, 20, 30],
        key1_lower: [8, 18, 28],
        key1_upper: [12, 22, 32]
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
      // Total: [60], [54], [66]
      expect(result[0]).toMatchObject({ x: 0, y: 60, yMin: 54, yMax: 66 })
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
