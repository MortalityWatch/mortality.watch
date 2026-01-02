/**
 * Tests for computeDisplayColors
 *
 * Ensures SSR and client use the same color generation logic.
 */

import { describe, it, expect } from 'vitest'
import { computeDisplayColors, chartLineColors } from './chartColors'

describe('computeDisplayColors', () => {
  it('should return empty array for 0 series', () => {
    expect(computeDisplayColors(0, undefined, false)).toEqual([])
  })

  it('should return default colors when numSeries <= available colors', () => {
    const result = computeDisplayColors(3, undefined, false)
    expect(result).toHaveLength(3)
    expect(result).toEqual(chartLineColors.slice(0, 3))
  })

  it('should return all default colors when numSeries equals available colors', () => {
    const result = computeDisplayColors(chartLineColors.length, undefined, false)
    expect(result).toHaveLength(chartLineColors.length)
    expect(result).toEqual(chartLineColors)
  })

  it('should generate interpolated colors when numSeries > available colors', () => {
    const result = computeDisplayColors(11, undefined, false)
    expect(result).toHaveLength(11)
    // Should use color scale to generate more colors
    // First and last should be close to original palette extremes
  })

  it('should use user colors when provided and sufficient', () => {
    const userColors = ['#ff0000', '#00ff00', '#0000ff']
    const result = computeDisplayColors(2, userColors, false)
    expect(result).toEqual(['#ff0000', '#00ff00'])
  })

  it('should extend user colors when insufficient', () => {
    const userColors = ['#ff0000', '#00ff00']
    const result = computeDisplayColors(5, userColors, false)
    expect(result).toHaveLength(5)
    // Should interpolate between user colors
  })

  it('should apply dark mode transformation to default colors', () => {
    const lightResult = computeDisplayColors(3, undefined, false)
    const darkResult = computeDisplayColors(3, undefined, true)

    expect(lightResult).toHaveLength(3)
    expect(darkResult).toHaveLength(3)
    // Dark mode colors should be different from light mode
    expect(darkResult).not.toEqual(lightResult)
  })
})
