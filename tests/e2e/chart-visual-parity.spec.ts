import { test, expect } from '@playwright/test'
import { compareCharts } from '../utils/chartComparison'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

/**
 * Visual Regression Tests for SSR Chart Rendering
 *
 * Compares SSR-rendered charts against saved baseline images.
 *
 * Modes:
 * - UPDATE_BASELINES=1: Capture SSR + client images and save as new baselines
 * - SAVE_DEBUG_IMAGES=1: Save debug images when tests fail
 * - Default: Compare SSR against saved baselines
 *
 * Baseline images are stored in tests/e2e/baselines/
 * Each baseline has:
 *   - {name}.png - SSR baseline (used for comparison)
 *   - {name}-client.png - Client reference (for manual verification)
 */

const SSR_TIMEOUT = 30000
const MAX_DIFF_PERCENT = 1 // Strict threshold - SSR should match baseline closely
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BASELINES_DIR = path.join(__dirname, 'baselines')

// Ensure baselines directory exists
if (!fs.existsSync(BASELINES_DIR)) {
  fs.mkdirSync(BASELINES_DIR, { recursive: true })
}

interface ChartTestCase {
  name: string
  url: string
  baselineFile: string
}

/**
 * Test cases for different chart configurations
 * Each test case has a URL and a baseline file name
 */
const chartTestCases: ChartTestCase[] = [
  {
    name: 'default chart (USA, Sweden)',
    url: '/chart.png?c=USA,SWE&t=asmr&ct=fluseason&cs=line&sb=1&bm=mean&bf=2016%2F17&bt=2018%2F19&pi=1&sl=1',
    baselineFile: 'default-usa-swe.png'
  },
  {
    name: 'bar chart with excess',
    url: '/chart.png?c=USA&t=asmr&ct=yearly&cs=bar&sb=1&bm=mean&bf=2015&bt=2019&e=1&sl=1',
    baselineFile: 'bar-excess-usa.png'
  },
  {
    name: 'matrix heatmap',
    url: '/chart.png?c=USA,SWE,DEU,FRA,GBR&t=asmr&ct=yearly&cs=matrix&sb=1&bm=mean&bf=2015&bt=2019&e=1&p=1&sl=1',
    baselineFile: 'matrix-heatmap.png'
  },
  {
    name: 'cumulative excess',
    url: '/chart.png?c=USA&t=asmr&ct=fluseason&cs=line&sb=1&bm=mean&bf=2016%2F17&bt=2018%2F19&e=1&ce=1&sl=1',
    baselineFile: 'cumulative-excess.png'
  },
  {
    name: 'dark mode',
    url: '/chart.png?c=USA,SWE&t=asmr&ct=fluseason&cs=line&sb=1&bm=mean&bf=2016%2F17&bt=2018%2F19&pi=1&sl=1&dm=1',
    baselineFile: 'dark-mode.png'
  }
]

test.describe('Chart Visual Regression', () => {
  // Mode: Update baselines - capture SSR + client reference images
  if (process.env.UPDATE_BASELINES === '1') {
    test('update all baselines with client references', async ({ page, request }) => {
      const { login } = await import('./helpers/auth')

      console.log('\n📸 Updating baseline images with client references...\n')

      // Login once for client screenshots
      await login(page)

      for (const testCase of chartTestCases) {
        console.log(`\n  ${testCase.name}:`)

        // 1. Capture SSR
        const ssrResponse = await request.get(testCase.url, { timeout: SSR_TIMEOUT })
        expect(ssrResponse.ok()).toBeTruthy()
        const ssrBuffer = await ssrResponse.body()

        const ssrPath = path.join(BASELINES_DIR, testCase.baselineFile)
        fs.writeFileSync(ssrPath, ssrBuffer)
        console.log(`    ✓ SSR saved: ${testCase.baselineFile}`)

        // 2. Capture client screenshot
        const explorerUrl = testCase.url.replace('/chart.png', '/explorer')
        await page.goto(explorerUrl)
        await page.waitForLoadState('domcontentloaded')
        await page.waitForSelector('canvas#chart', { state: 'visible', timeout: 30000 })
        await page.waitForTimeout(1500)

        // Dismiss tutorial if visible
        const closeButton = page.getByText('×')
        if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await closeButton.click()
          await page.waitForTimeout(300)
        }

        // Set Twitter/X size for consistent dimensions
        try {
          await page.getByRole('button', { name: 'Display' }).click()
          await page.waitForTimeout(200)
          await page.getByRole('combobox').filter({ hasText: 'Auto' }).click()
          await page.getByRole('option', { name: 'Twitter/X' }).click()
          await page.waitForTimeout(500)
        } catch {
          // Display controls may not be visible in all states
        }

        // Capture client screenshot via button
        try {
          const [clientDownload] = await Promise.all([
            page.waitForEvent('download', { timeout: 10000 }),
            page.getByRole('button', { name: 'Screenshot Capture current' }).click()
          ])

          const clientPath = await clientDownload.path()
          if (clientPath) {
            const clientBuffer = fs.readFileSync(clientPath)
            const clientBaseline = testCase.baselineFile.replace('.png', '-client.png')
            fs.writeFileSync(path.join(BASELINES_DIR, clientBaseline), clientBuffer)
            console.log(`    ✓ Client saved: ${clientBaseline}`)

            // Show diff percentage for reference
            const result = await compareCharts(ssrBuffer, clientBuffer)
            console.log(`    ℹ SSR vs Client diff: ${result.mismatchPercent.toFixed(2)}%`)
          }
        } catch (e) {
          console.log(`    ⚠ Could not capture client screenshot: ${e}`)
        }
      }

      console.log('\n✅ All baselines updated!')
      console.log('\nReview the images in tests/e2e/baselines/:')
      console.log('  - *.png = SSR baselines (used for tests)')
      console.log('  - *-client.png = Client references (for verification)')
      console.log('\nCommit both when they look correct.\n')
    })
  } else {
    // Mode: Compare against baselines
    for (const testCase of chartTestCases) {
      test(`${testCase.name}: matches baseline`, async ({ request }) => {
        const baselinePath = path.join(BASELINES_DIR, testCase.baselineFile)

        // Check if baseline exists
        if (!fs.existsSync(baselinePath)) {
          console.log(`⚠️  No baseline found for "${testCase.name}"`)
          console.log(`   Run with UPDATE_BASELINES=1 to create it`)
          test.skip()
          return
        }

        // Fetch current SSR render
        const response = await request.get(testCase.url, { timeout: SSR_TIMEOUT })
        expect(response.ok()).toBeTruthy()

        const currentBuffer = await response.body()
        const baselineBuffer = fs.readFileSync(baselinePath)

        // Compare against baseline
        const result = await compareCharts(currentBuffer, baselineBuffer)
        console.log(`${testCase.name}: ${result.mismatchPercent.toFixed(2)}% diff`)

        // Save debug images if requested or if test would fail
        if (process.env.SAVE_DEBUG_IMAGES === '1' || result.mismatchPercent >= MAX_DIFF_PERCENT) {
          const debugDir = path.join(process.cwd(), 'test-results', 'debug', testCase.baselineFile.replace('.png', ''))
          fs.mkdirSync(debugDir, { recursive: true })
          fs.writeFileSync(path.join(debugDir, 'current.png'), currentBuffer)
          fs.writeFileSync(path.join(debugDir, 'baseline.png'), baselineBuffer)
          fs.writeFileSync(path.join(debugDir, 'diff.png'), result.diffImage)

          if (result.mismatchPercent >= MAX_DIFF_PERCENT) {
            console.log(`   Debug images saved to: test-results/debug/${testCase.baselineFile.replace('.png', '')}/`)
          }
        }

        expect(result.mismatchPercent).toBeLessThan(MAX_DIFF_PERCENT)
      })
    }
  }

  // Basic SSR health check (always runs)
  test('SSR endpoint returns valid PNG', async ({ request }) => {
    const response = await request.get('/chart.png', { timeout: SSR_TIMEOUT })
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toBe('image/png')

    const buffer = await response.body()
    expect(buffer.length).toBeGreaterThan(1000)
  })
})
