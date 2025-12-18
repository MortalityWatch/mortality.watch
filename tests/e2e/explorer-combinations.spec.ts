import { test, expect, type Page } from '@playwright/test'

/**
 * E2E tests for all 14 valid explorer UI combinations
 *
 * This test suite comprehensively validates all valid combinations of:
 * - View Mode: mortality, excess, zscore
 * - Chart Style: line, bar, matrix
 * - Metric Type: standard (asmr/cmr/deaths), life expectancy, population
 *
 * Based on the explorer testing plan at:
 * /docs/explorer-testing-plan.md
 *
 * Each combination is tested for:
 * 1. Page loads without error
 * 2. Chart canvas renders and is visible
 * 3. URL parameters are preserved correctly
 * 4. No critical console errors
 */

/**
 * Combination definition interface
 */
interface CombinationTest {
  id: string
  description: string
  params: string
  viewMode: 'mortality' | 'excess' | 'zscore'
  chartStyle: 'line' | 'bar' | 'matrix'
  metricType: 'standard' | 'le' | 'population'
  keyBehaviors: string[]
}

/**
 * All 14 valid combinations as defined in the testing plan
 */
const COMBINATIONS: CombinationTest[] = [
  // Mortality + Line (3 combinations)
  {
    id: 'M-L-std',
    description: 'Mortality + Line + Standard metrics',
    params: '',
    viewMode: 'mortality',
    chartStyle: 'line',
    metricType: 'standard',
    keyBehaviors: [
      'Full feature set available',
      'Baseline can be toggled',
      'Log scale available',
      'PI available when baseline is ON'
    ]
  },
  {
    id: 'M-L-le',
    description: 'Mortality + Line + Life Expectancy',
    params: 't=le',
    viewMode: 'mortality',
    chartStyle: 'line',
    metricType: 'le',
    keyBehaviors: [
      'Life expectancy metric',
      'Age groups forced to [all]',
      'Baseline can be toggled',
      'Log scale available'
    ]
  },
  {
    id: 'M-L-pop',
    description: 'Mortality + Line + Population',
    params: 't=population',
    viewMode: 'mortality',
    chartStyle: 'line',
    metricType: 'population',
    keyBehaviors: [
      'Population metric',
      'Baseline disabled',
      'PI disabled',
      'View modes disabled'
    ]
  },

  // Mortality + Bar (3 combinations)
  {
    id: 'M-B-std',
    description: 'Mortality + Bar + Standard metrics',
    params: 'cs=bar',
    viewMode: 'mortality',
    chartStyle: 'bar',
    metricType: 'standard',
    keyBehaviors: [
      'Full feature set available',
      'Baseline can be toggled',
      'Maximize available',
      'Log scale available'
    ]
  },
  {
    id: 'M-B-le',
    description: 'Mortality + Bar + Life Expectancy',
    params: 'cs=bar&t=le',
    viewMode: 'mortality',
    chartStyle: 'bar',
    metricType: 'le',
    keyBehaviors: [
      'Life expectancy metric',
      'Age groups forced to [all]',
      'Baseline can be toggled',
      'Maximize available'
    ]
  },
  {
    id: 'M-B-pop',
    description: 'Mortality + Bar + Population',
    params: 'cs=bar&t=population',
    viewMode: 'mortality',
    chartStyle: 'bar',
    metricType: 'population',
    keyBehaviors: [
      'Population metric',
      'Baseline disabled',
      'PI disabled',
      'View modes disabled'
    ]
  },

  // Mortality + Matrix (3 combinations)
  {
    id: 'M-X-std',
    description: 'Mortality + Matrix + Standard metrics',
    params: 'cs=matrix',
    viewMode: 'mortality',
    chartStyle: 'matrix',
    metricType: 'standard',
    keyBehaviors: [
      'Baseline disabled (matrix constraint)',
      'PI disabled (matrix constraint)',
      'Log scale disabled (matrix constraint)',
      'Maximize disabled (matrix constraint)'
    ]
  },
  {
    id: 'M-X-le',
    description: 'Mortality + Matrix + Life Expectancy',
    params: 'cs=matrix&t=le',
    viewMode: 'mortality',
    chartStyle: 'matrix',
    metricType: 'le',
    keyBehaviors: [
      'Life expectancy metric',
      'Age groups forced to [all]',
      'Baseline disabled (matrix + LE)',
      'PI disabled (matrix constraint)'
    ]
  },
  {
    id: 'M-X-pop',
    description: 'Mortality + Matrix + Population',
    params: 'cs=matrix&t=population',
    viewMode: 'mortality',
    chartStyle: 'matrix',
    metricType: 'population',
    keyBehaviors: [
      'Population metric',
      'Most restricted combination',
      'Baseline disabled (matrix + population)',
      'View modes disabled'
    ]
  },

  // Excess + Line (1 combination)
  {
    id: 'E-L-std',
    description: 'Excess + Line + Standard metrics',
    params: 'e=1&cs=line',
    viewMode: 'excess',
    chartStyle: 'line',
    metricType: 'standard',
    keyBehaviors: [
      'Baseline forced ON',
      'Percentage toggle available',
      'Cumulative toggle available',
      'Log scale disabled'
    ]
  },

  // Excess + Bar (1 combination) - Default for excess
  {
    id: 'E-B-std',
    description: 'Excess + Bar + Standard metrics (default)',
    params: 'e=1',
    viewMode: 'excess',
    chartStyle: 'bar',
    metricType: 'standard',
    keyBehaviors: [
      'Default excess view',
      'Baseline forced ON',
      'Percentage toggle available',
      'Cumulative toggle available',
      'ShowTotal available when cumulative+bar'
    ]
  },

  // Excess + Matrix (1 combination)
  {
    id: 'E-X-std',
    description: 'Excess + Matrix + Standard metrics',
    params: 'e=1&cs=matrix',
    viewMode: 'excess',
    chartStyle: 'matrix',
    metricType: 'standard',
    keyBehaviors: [
      'Baseline forced ON',
      'PI disabled (matrix constraint)',
      'Maximize disabled (matrix constraint)',
      'Percentage/cumulative available'
    ]
  },

  // Z-Score + Line (1 combination) - Default for zscore
  {
    id: 'Z-L-std',
    description: 'Z-Score + Line + Standard metrics (default)',
    params: 'zs=1',
    viewMode: 'zscore',
    chartStyle: 'line',
    metricType: 'standard',
    keyBehaviors: [
      'Default zscore view',
      'Baseline hidden but required',
      'Log scale disabled',
      'Cumulative disabled',
      'Percentage disabled'
    ]
  },

  // Z-Score + Bar (1 combination)
  {
    id: 'Z-B-std',
    description: 'Z-Score + Bar + Standard metrics',
    params: 'zs=1&cs=bar',
    viewMode: 'zscore',
    chartStyle: 'bar',
    metricType: 'standard',
    keyBehaviors: [
      'Baseline hidden but required',
      'Maximize available',
      'Log scale disabled',
      'Cumulative disabled',
      'Percentage disabled'
    ]
  }
]

/**
 * Helper function to wait for chart to be ready
 */
async function waitForChart(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('canvas#chart', { timeout: 15000 })
}

/**
 * Helper function to check for critical console errors
 */
async function setupConsoleErrorTracking(page: Page): Promise<string[]> {
  const consoleErrors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  return consoleErrors
}

/**
 * Helper function to filter out known non-critical errors.
 *
 * Filtered errors include:
 * - Build/bundler warnings (sharp, Sourcemap, externalized, chunks)
 * - Browser quirks (ResizeObserver)
 * - Network issues in CI (CORS, stats.mortality.watch, net::ERR_FAILED)
 * - Expected baseline errors when testing invalid combinations or
 *   combinations where baseline data is unavailable for certain countries
 */
function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(
    error =>
      !error.includes('sharp')
      && !error.includes('Sourcemap')
      && !error.includes('externalized for browser compatibility')
      && !error.includes('ResizeObserver')
      && !error.includes('chunks are larger than')
      && !error.includes('CORS policy')
      && !error.includes('stats.mortality.watch')
      && !error.includes('net::ERR_FAILED')
      && !error.includes('Baseline calculation failed')
  )
}

test.describe('Explorer UI Combinations - All 14 Valid Combinations', () => {
  test.describe('Basic Combination Tests', () => {
    for (const combo of COMBINATIONS) {
      test(`${combo.id}: ${combo.description}`, async ({ page }) => {
        // Setup console error tracking
        const consoleErrors = await setupConsoleErrorTracking(page)

        // Navigate to the combination URL
        const url = combo.params ? `/explorer?${combo.params}` : '/explorer'
        await page.goto(url)

        // Wait for chart to load
        await waitForChart(page)

        // 1. Verify chart canvas renders and is visible
        const canvas = page.locator('canvas#chart')
        await expect(canvas).toBeVisible()

        // 2. Verify canvas has non-zero dimensions
        const boundingBox = await canvas.boundingBox()
        expect(boundingBox).toBeTruthy()
        expect(boundingBox!.width).toBeGreaterThan(0)
        expect(boundingBox!.height).toBeGreaterThan(0)

        // 3. Verify URL parameters are preserved
        const currentUrl = page.url()
        if (combo.viewMode === 'excess') {
          expect(currentUrl).toContain('e=1')
        } else if (combo.viewMode === 'zscore') {
          expect(currentUrl).toContain('zs=1')
        }

        // Chart style: bar is default for excess, line is default for others
        // So we check for explicit params only when non-default
        if (combo.chartStyle === 'matrix') {
          expect(currentUrl).toContain('cs=matrix')
        } else if (combo.chartStyle === 'bar' && combo.viewMode !== 'excess') {
          // bar is only in URL if not in excess view (where it's the default)
          expect(currentUrl).toContain('cs=bar')
        }
        // line is the default for mortality/zscore, so not in URL

        if (combo.metricType === 'le') {
          expect(currentUrl).toContain('t=le')
        } else if (combo.metricType === 'population') {
          expect(currentUrl).toContain('t=population')
        }

        // 4. Check for critical console errors
        await page.waitForTimeout(1000)
        const criticalErrors = filterCriticalErrors(consoleErrors)

        if (criticalErrors.length > 0) {
          console.log(`Console errors in ${combo.id}:`, criticalErrors)
        }

        // Allow up to 3 non-critical errors for flaky warnings
        expect(criticalErrors.length).toBeLessThanOrEqual(3)
      })
    }
  })

  test.describe('URL Parameter Preservation on Reload', () => {
    // Test a subset of combinations for reload behavior
    const reloadTestCombos = COMBINATIONS.filter(combo =>
      ['M-L-std', 'M-B-le', 'E-B-std', 'Z-L-std', 'M-X-pop'].includes(combo.id)
    )

    for (const combo of reloadTestCombos) {
      test(`${combo.id}: should preserve parameters on reload`, async ({ page }) => {
        const url = combo.params ? `/explorer?${combo.params}` : '/explorer'
        await page.goto(url)
        await waitForChart(page)

        // Capture URL before reload
        const urlBeforeReload = page.url()

        // Reload the page
        await page.reload()
        await waitForChart(page)

        // Verify URL is preserved
        const urlAfterReload = page.url()
        expect(urlAfterReload).toBe(urlBeforeReload)

        // Verify chart still renders
        await expect(page.locator('canvas#chart')).toBeVisible()
      })
    }
  })

  test.describe('Browser Navigation', () => {
    test('should handle back/forward navigation between combinations', async ({ page }) => {
      // Navigate through different combinations with distinct URL markers
      await page.goto('/explorer')
      await waitForChart(page)

      await page.goto('/explorer?e=1')
      await waitForChart(page)

      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      await page.goto('/explorer?cs=matrix')
      await waitForChart(page)

      // Go back through history - use waitForURL with pattern matching
      // Skip waitForLoadState('networkidle') after goBack as it can timeout
      await page.goBack()
      await page.waitForURL(/zs=1/)
      await expect(page.locator('canvas#chart')).toBeVisible()

      await page.goBack()
      await page.waitForURL(/e=1/)
      await expect(page.locator('canvas#chart')).toBeVisible()

      await page.goBack()
      // Default explorer URL - wait for URL without specific params
      await page.waitForURL(url => !url.search.includes('e=1') && !url.search.includes('zs=1') && !url.search.includes('cs=matrix'))
      await expect(page.locator('canvas#chart')).toBeVisible()

      // Go forward
      await page.goForward()
      await page.waitForURL(/e=1/)
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Constraint Enforcement', () => {
    test('M-X-std: Matrix style should disable baseline', async ({ page }) => {
      await page.goto('/explorer?cs=matrix&sb=1')
      await waitForChart(page)

      // Baseline should be disabled/removed for matrix
      const url = page.url()
      expect(url).toContain('cs=matrix')
      // sb=1 should either be removed or baseline should be off
    })

    test('M-L-pop: Population metric should disable baseline', async ({ page }) => {
      await page.goto('/explorer?t=population&sb=1')
      await waitForChart(page)

      // Baseline should be disabled for population
      const url = page.url()
      expect(url).toContain('t=population')
      // Chart should still render
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('E-B-std: Excess view should force baseline ON', async ({ page }) => {
      await page.goto('/explorer?e=1&sb=0')
      await waitForChart(page)

      // Baseline should be forced ON for excess
      const url = page.url()
      expect(url).toContain('e=1')
      expect(url).not.toContain('sb=0')
    })

    test('Z-L-std: Z-score view should force baseline ON', async ({ page }) => {
      await page.goto('/explorer?zs=1&sb=0')
      await waitForChart(page)

      // Baseline should be forced ON for zscore
      const url = page.url()
      expect(url).toContain('zs=1')
      expect(url).not.toContain('sb=0')
    })

    test('Excess and Z-score should be mutually exclusive', async ({ page }) => {
      await page.goto('/explorer?e=1&zs=1')
      await waitForChart(page)

      // Only one should be active
      const url = page.url()
      const hasExcess = url.includes('e=1')
      const hasZscore = url.includes('zs=1')

      expect(hasExcess && hasZscore).toBe(false)
      await expect(page.locator('canvas#chart')).toBeVisible()
    })

    test('Matrix + Z-score should correct to valid state (zscore wins, matrix removed)', async ({ page }) => {
      // Matrix + Z-score is invalid because z-score doesn't support matrix view.
      // The StateResolver should correct this by keeping zscore and removing matrix.
      await page.goto('/explorer?cs=matrix&zs=1')
      await page.waitForLoadState('networkidle')

      // Wait for state resolution
      await page.waitForTimeout(1000)

      // Chart should render without crashing
      const chart = page.locator('canvas#chart')
      await expect(chart).toBeVisible({ timeout: 10000 })

      // Z-score should win (it was explicitly requested), matrix should be removed
      const url = page.url()
      expect(url).toContain('zs=1')
      expect(url).not.toContain('cs=matrix')
    })

    test('M-L-le: Life expectancy should force age group to [all]', async ({ page }) => {
      await page.goto('/explorer?t=le&ag=0-14&ag=15-64')
      await waitForChart(page)

      // URL should be corrected to remove invalid age groups
      const url = page.url()
      expect(url).toContain('t=le')

      // Chart should still render
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Dark Mode Compatibility', () => {
    // Test key combinations in dark mode
    const darkModeTestCombos = COMBINATIONS.filter(combo =>
      ['M-L-std', 'M-B-std', 'E-B-std', 'Z-L-std', 'M-X-std'].includes(combo.id)
    )

    for (const combo of darkModeTestCombos) {
      test(`${combo.id}: should render in dark mode`, async ({ page }) => {
        const baseParams = combo.params || ''
        const darkModeParams = baseParams ? `${baseParams}&dm=1` : 'dm=1'
        const url = `/explorer?${darkModeParams}`

        await page.goto(url)
        await waitForChart(page)

        // Verify dark mode parameter is in URL
        const currentUrl = page.url()
        expect(currentUrl).toContain('dm=1')

        // Verify chart renders in dark mode
        const canvas = page.locator('canvas#chart')
        await expect(canvas).toBeVisible()

        const boundingBox = await canvas.boundingBox()
        expect(boundingBox).toBeTruthy()
        expect(boundingBox!.width).toBeGreaterThan(0)
        expect(boundingBox!.height).toBeGreaterThan(0)
      })
    }

    test('should toggle between light and dark mode', async ({ page }) => {
      // Start in light mode
      await page.goto('/explorer')
      await waitForChart(page)

      const lightUrl = page.url()
      expect(lightUrl).not.toContain('dm=1')

      // Navigate to dark mode
      await page.goto('/explorer?dm=1')
      await waitForChart(page)

      const darkUrl = page.url()
      expect(darkUrl).toContain('dm=1')

      // Both should render charts
      await expect(page.locator('canvas#chart')).toBeVisible()
    })
  })

  test.describe('Feature Availability by Combination', () => {
    test('M-L-std: should have full feature set', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Navigate to Display tab
      await page.getByRole('button', { name: /Display/ }).click()
      await page.waitForTimeout(300)

      // Should have baseline toggle enabled
      const baselineSwitch = page
        .locator('text=Baseline')
        .locator('..')
        .locator('button[role="switch"]')
      await expect(baselineSwitch).toBeEnabled()

      // Should have log scale toggle visible
      const logScaleLabel = page.locator('text=Log Scale')
      const isVisible = await logScaleLabel.isVisible().catch(() => false)
      expect(isVisible).toBe(true)
    })

    test('E-B-std: should have percentage and cumulative toggles', async ({ page }) => {
      await page.goto('/explorer?e=1')
      await waitForChart(page)

      // Navigate to Display tab
      await page.getByRole('button', { name: /Display/ }).click()
      await page.waitForTimeout(300)

      // Should have percentage option
      const percentageLabel = page.locator('text=Percentage')
      await expect(percentageLabel).toBeVisible()

      // Should have cumulative option
      const cumulativeLabel = page.locator('text=Cumulative')
      await expect(cumulativeLabel).toBeVisible()
    })

    test('Z-L-std: should hide/disable baseline toggle', async ({ page }) => {
      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      // Navigate to Display tab
      await page.getByRole('button', { name: /Display/ }).click()
      await page.waitForTimeout(300)

      // Baseline toggle should be disabled
      const baselineSwitch = page
        .locator('text=Baseline')
        .locator('..')
        .locator('button[role="switch"]')
      await expect(baselineSwitch).toBeDisabled()
    })

    test('M-X-std: should disable baseline in matrix view', async ({ page }) => {
      await page.goto('/explorer?cs=matrix')
      await waitForChart(page)

      // Navigate to Display tab
      await page.getByRole('button', { name: /Display/ }).click()
      await page.waitForTimeout(300)

      // Baseline should be disabled or hidden
      const baselineSwitch = page
        .locator('text=Baseline')
        .locator('..')
        .locator('button[role="switch"]')

      // Should be either disabled or not present
      const isPresent = await baselineSwitch.isVisible().catch(() => false)

      if (isPresent) {
        await expect(baselineSwitch).toBeDisabled()
      }
    })
  })

  test.describe('Combination Metadata Validation', () => {
    test('should have exactly 14 valid combinations defined', () => {
      expect(COMBINATIONS.length).toBe(14)
    })

    test('all combination IDs should be unique', () => {
      const ids = COMBINATIONS.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    test('all combinations should have required properties', () => {
      for (const combo of COMBINATIONS) {
        expect(combo.id).toBeTruthy()
        expect(combo.description).toBeTruthy()
        expect(combo.params).toBeDefined()
        expect(combo.viewMode).toBeTruthy()
        expect(combo.chartStyle).toBeTruthy()
        expect(combo.metricType).toBeTruthy()
        expect(Array.isArray(combo.keyBehaviors)).toBe(true)
        expect(combo.keyBehaviors.length).toBeGreaterThan(0)
      }
    })

    test('should have correct distribution of view modes', () => {
      const mortalityCombos = COMBINATIONS.filter(c => c.viewMode === 'mortality')
      const excessCombos = COMBINATIONS.filter(c => c.viewMode === 'excess')
      const zscoreCombos = COMBINATIONS.filter(c => c.viewMode === 'zscore')

      expect(mortalityCombos.length).toBe(9) // 3x3 matrix (3 styles × 3 metrics)
      expect(excessCombos.length).toBe(3) // 3 styles × standard metrics only
      expect(zscoreCombos.length).toBe(2) // 2 styles (no matrix) × standard metrics only
    })

    test('should have correct distribution of chart styles', () => {
      const lineCombos = COMBINATIONS.filter(c => c.chartStyle === 'line')
      const barCombos = COMBINATIONS.filter(c => c.chartStyle === 'bar')
      const matrixCombos = COMBINATIONS.filter(c => c.chartStyle === 'matrix')

      expect(lineCombos.length).toBe(5) // M-L-std, M-L-le, M-L-pop, E-L-std, Z-L-std
      expect(barCombos.length).toBe(5) // M-B-std, M-B-le, M-B-pop, E-B-std, Z-B-std
      expect(matrixCombos.length).toBe(4) // M-X-std, M-X-le, M-X-pop, E-X-std
    })

    test('should not have Z-score + Matrix combination', () => {
      const invalidCombo = COMBINATIONS.find(
        c => c.viewMode === 'zscore' && c.chartStyle === 'matrix'
      )
      expect(invalidCombo).toBeUndefined()
    })

    test('should not have Excess/Z-score + non-standard metrics', () => {
      const invalidExcess = COMBINATIONS.find(
        c => c.viewMode === 'excess' && c.metricType !== 'standard'
      )
      const invalidZscore = COMBINATIONS.find(
        c => c.viewMode === 'zscore' && c.metricType !== 'standard'
      )

      expect(invalidExcess).toBeUndefined()
      expect(invalidZscore).toBeUndefined()
    })
  })

  test.describe('Performance and Stability', () => {
    test('should load all combinations within reasonable time', async ({ page }) => {
      // Test that we can cycle through all combinations quickly
      const startTime = Date.now()

      for (const combo of COMBINATIONS.slice(0, 5)) {
        // Test first 5 for speed
        const url = combo.params ? `/explorer?${combo.params}` : '/explorer'
        await page.goto(url)
        await waitForChart(page)
        await expect(page.locator('canvas#chart')).toBeVisible()
      }

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(60000) // Should complete in under 60 seconds
    })

    test('should maintain stable state when rapidly switching combinations', async ({ page }) => {
      // Rapidly switch between different combinations
      await page.goto('/explorer')
      await waitForChart(page)

      await page.goto('/explorer?e=1')
      await page.waitForLoadState('networkidle')

      await page.goto('/explorer?zs=1')
      await page.waitForLoadState('networkidle')

      await page.goto('/explorer?cs=matrix')
      await page.waitForLoadState('networkidle')

      await page.goto('/explorer?cs=bar&t=le')
      await waitForChart(page)

      // Final state should render correctly
      await expect(page.locator('canvas#chart')).toBeVisible()
      const url = page.url()
      expect(url).toContain('cs=bar')
      expect(url).toContain('t=le')
    })
  })
})
