/**
 * Tests for Label Visibility Logic
 */

import { describe, it, expect } from 'vitest'
import {
  shouldShowLabels,
  getDataPointCount,
  calculateLabelVisibility
} from './labelVisibility'

describe('labelVisibility', () => {
  describe('shouldShowLabels', () => {
    it('should show labels when data points are below threshold', () => {
      // 10 points < (800 / 20 = 40)
      expect(shouldShowLabels(10, 800)).toBe(true)
    })

    it('should hide labels when data points exceed threshold', () => {
      // 50 points > (800 / 20 = 40)
      expect(shouldShowLabels(50, 800)).toBe(false)
    })

    it('should show labels when data points equal threshold', () => {
      // 40 points = (800 / 20 = 40)
      expect(shouldShowLabels(40, 800)).toBe(true)
    })

    it('should adjust threshold based on chart width', () => {
      // With wider chart: 50 points = (1000 / 20 = 50)
      expect(shouldShowLabels(50, 1000)).toBe(true)
      // With narrower chart: 30 points > (500 / 20 = 25)
      expect(shouldShowLabels(30, 500)).toBe(false)
    })

    it('should respect user override to show labels', () => {
      // Even with many data points, show if user wants
      expect(shouldShowLabels(100, 800, true)).toBe(true)
    })

    it('should respect user override to hide labels', () => {
      // Even with few data points, hide if user wants
      expect(shouldShowLabels(5, 800, false)).toBe(false)
    })

    it('should use default width when not provided', () => {
      // 10 points < (800 / 20 = 40) - default width
      expect(shouldShowLabels(10)).toBe(true)
      // 50 points > (800 / 20 = 40) - default width
      expect(shouldShowLabels(50)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(shouldShowLabels(0, 800)).toBe(true)
      expect(shouldShowLabels(1, 800)).toBe(true)
      expect(shouldShowLabels(100, 2000)).toBe(true) // 100 = 2000/20
      expect(shouldShowLabels(101, 2000)).toBe(false) // 101 > 2000/20
    })
  })

  describe('getDataPointCount', () => {
    it('should return correct count for array of labels', () => {
      expect(getDataPointCount(['2020', '2021', '2022'])).toBe(3)
      expect(getDataPointCount(['Jan', 'Feb', 'Mar', 'Apr', 'May'])).toBe(5)
    })

    it('should return 0 for empty array', () => {
      expect(getDataPointCount([])).toBe(0)
    })

    it('should handle large arrays', () => {
      const labels = Array.from({ length: 100 }, (_, i) => `Label${i}`)
      expect(getDataPointCount(labels)).toBe(100)
    })
  })

  describe('calculateLabelVisibility', () => {
    it('should calculate based on data density when no user preference', () => {
      const fewLabels = ['2020', '2021', '2022', '2023', '2024']
      expect(calculateLabelVisibility(fewLabels, undefined, 800)).toBe(true)

      const manyLabels = Array.from({ length: 50 }, (_, i) => `${2000 + i}`)
      expect(calculateLabelVisibility(manyLabels, undefined, 800)).toBe(false)
    })

    it('should respect user preference over auto-calculation', () => {
      const manyLabels = Array.from({ length: 50 }, (_, i) => `${2000 + i}`)

      // User wants labels shown despite many data points
      expect(calculateLabelVisibility(manyLabels, true, 800)).toBe(true)

      // User wants labels hidden despite few data points
      const fewLabels = ['2020', '2021', '2022']
      expect(calculateLabelVisibility(fewLabels, false, 800)).toBe(false)
    })

    it('should use provided chart width', () => {
      const labels = Array.from({ length: 45 }, (_, i) => `${2000 + i}`)

      // 45 > (800 / 20 = 40)
      expect(calculateLabelVisibility(labels, undefined, 800)).toBe(false)

      // 45 < (1000 / 20 = 50)
      expect(calculateLabelVisibility(labels, undefined, 1000)).toBe(true)
    })

    it('should handle various realistic scenarios', () => {
      // Weekly data for 1 year (52 points) on default chart
      const weeklyYear = Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`)
      expect(calculateLabelVisibility(weeklyYear, undefined, 800)).toBe(false)

      // Monthly data for 3 years (36 points) on default chart
      const monthly3Years = Array.from({ length: 36 }, (_, i) => `Month ${i + 1}`)
      expect(calculateLabelVisibility(monthly3Years, undefined, 800)).toBe(true)

      // Daily data for 3 months (~90 points) on default chart
      const daily3Months = Array.from({ length: 90 }, (_, i) => `Day ${i + 1}`)
      expect(calculateLabelVisibility(daily3Months, undefined, 800)).toBe(false)

      // Yearly data for 20 years on default chart
      const yearly20 = Array.from({ length: 20 }, (_, i) => `${2000 + i}`)
      expect(calculateLabelVisibility(yearly20, undefined, 800)).toBe(true)
    })
  })
})
