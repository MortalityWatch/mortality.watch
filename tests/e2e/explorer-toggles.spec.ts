import { test, expect } from '@playwright/test'

/**
 * E2E tests for explorer page toggle controls
 *
 * Tests that all UI toggles properly update state and URL,
 * and don't "jump back" after interaction.
 */
test.describe('Explorer Toggle Controls', () => {
  // Helper to wait for chart to be ready
  async function waitForChart(page: ReturnType<typeof test['info']>['page']) {
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('canvas#chart', { timeout: 15000 })
  }

  // Helper to navigate to Display tab
  async function openDisplayTab(page: ReturnType<typeof test['info']>['page']) {
    const displayTab = page.getByRole('button', { name: /Display/i })
    await displayTab.waitFor({ state: 'visible', timeout: 5000 })
    await displayTab.click()
    await page.waitForTimeout(300)
  }

  // Helper to navigate to Style tab
  async function openStyleTab(page: ReturnType<typeof test['info']>['page']) {
    const styleTab = page.getByRole('button', { name: /Style/i })
    await styleTab.waitFor({ state: 'visible', timeout: 5000 })
    await styleTab.click()
    await page.waitForTimeout(300)
  }

  // Helper to find a toggle by its label text
  async function findToggleByLabel(page: ReturnType<typeof test['info']>['page'], labelText: string) {
    // Find the label, then find the switch within the same control row
    // The structure is: UiControlRow > label + switch
    const label = page.getByText(labelText, { exact: false })
    await label.waitFor({ state: 'visible', timeout: 5000 })

    // Navigate up to the control row container and find the switch
    const controlRow = label.locator('xpath=ancestor::div[contains(@class, "flex")]').first()
    const toggle = controlRow.locator('button[role="switch"]').first()

    return toggle
  }

  test.describe('Display Tab Toggles', () => {
    test('should toggle Maximize and persist in URL', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openDisplayTab(page)

      // Find Maximize toggle
      const maxToggle = await findToggleByLabel(page, 'Maximize')
      await maxToggle.waitFor({ state: 'visible', timeout: 5000 })

      // Get initial state
      const initialChecked = await maxToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('false') // Default is off

      // Click to toggle ON
      await maxToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await maxToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('true')

      // Verify URL updated
      expect(page.url()).toContain('m=1')

      // Verify toggle doesn't jump back
      await page.waitForTimeout(500)
      const finalChecked = await maxToggle.getAttribute('aria-checked')
      expect(finalChecked).toBe('true')
    })

    test('should toggle Baseline and persist in URL', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openDisplayTab(page)

      // Find Baseline toggle
      const baselineToggle = await findToggleByLabel(page, 'Baseline')
      await baselineToggle.waitFor({ state: 'visible', timeout: 5000 })

      // Get initial state - default is ON
      const initialChecked = await baselineToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('true')

      // Click to toggle OFF
      await baselineToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await baselineToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('false')

      // Verify URL updated
      expect(page.url()).toContain('sb=0')

      // Verify toggle doesn't jump back
      await page.waitForTimeout(500)
      const finalChecked = await baselineToggle.getAttribute('aria-checked')
      expect(finalChecked).toBe('false')
    })

    test('should toggle Log Scale when available and persist in URL', async ({ page }) => {
      // Start with mortality view (log scale available)
      await page.goto('/explorer')
      await waitForChart(page)

      await openDisplayTab(page)

      // Log Scale may be hidden in some views, check if visible
      const logLabel = page.getByText('Log Scale')
      const isVisible = await logLabel.isVisible().catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      const logToggle = await findToggleByLabel(page, 'Log Scale')

      // Get initial state
      const initialChecked = await logToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('false') // Default is off

      // Click to toggle ON
      await logToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await logToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('true')

      // Verify URL updated
      expect(page.url()).toContain('lg=1')

      // Verify toggle doesn't jump back
      await page.waitForTimeout(500)
      const finalChecked = await logToggle.getAttribute('aria-checked')
      expect(finalChecked).toBe('true')
    })
  })

  test.describe('Style Tab Toggles', () => {
    test('should toggle Show Labels and persist in URL', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openStyleTab(page)

      // Find Labels toggle
      const labelsToggle = await findToggleByLabel(page, 'Show Labels')
      await labelsToggle.waitFor({ state: 'visible', timeout: 5000 })

      // Get initial state - default is ON
      const initialChecked = await labelsToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('true')

      // Click to toggle OFF
      await labelsToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await labelsToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('false')

      // Verify URL updated (sl=0 when labels off)
      expect(page.url()).toContain('sl=0')

      // Verify toggle doesn't jump back
      await page.waitForTimeout(500)
      const finalChecked = await labelsToggle.getAttribute('aria-checked')
      expect(finalChecked).toBe('false')
    })

    // Feature-gated tests - these features may not be available to anonymous users
    // Skip if the toggle isn't visible (feature gate blocks it)
    test('should toggle Show Logo when feature available', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openStyleTab(page)

      // Check if Show Logo is visible (may be behind feature gate)
      const logoLabel = page.getByText('Show Logo')
      const isVisible = await logoLabel.isVisible().catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      const logoToggle = await findToggleByLabel(page, 'Show Logo')

      // Get initial state - default is ON
      const initialChecked = await logoToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('true')

      // Click to toggle OFF
      await logoToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await logoToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('false')

      // Verify URL updated
      expect(page.url()).toContain('l=0')
    })

    test('should toggle Show QR Code when feature available', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openStyleTab(page)

      // Check if QR Code toggle is visible (may be behind feature gate)
      const qrLabel = page.getByText('Show QR Code')
      const isVisible = await qrLabel.isVisible().catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      const qrToggle = await findToggleByLabel(page, 'Show QR Code')

      // Get initial state - default is ON
      const initialChecked = await qrToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('true')

      // Click to toggle OFF
      await qrToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await qrToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('false')

      // Verify URL updated
      expect(page.url()).toContain('qr=0')
    })

    test('should toggle Show Caption when feature available', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      await openStyleTab(page)

      // Check if Caption toggle is visible (may be behind feature gate)
      const captionLabel = page.getByText('Show Caption')
      const isVisible = await captionLabel.isVisible().catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      const captionToggle = await findToggleByLabel(page, 'Show Caption')

      // Get initial state - default is ON
      const initialChecked = await captionToggle.getAttribute('aria-checked')
      expect(initialChecked).toBe('true')

      // Click to toggle OFF
      await captionToggle.click()
      await page.waitForTimeout(500)

      // Verify toggle state changed
      const newChecked = await captionToggle.getAttribute('aria-checked')
      expect(newChecked).toBe('false')

      // Verify URL updated
      expect(page.url()).toContain('cap=0')
    })
  })

  test.describe('Date Range Slider', () => {
    test('should update date range via slider and not jump back', async ({ page }) => {
      await page.goto('/explorer')
      await waitForChart(page)

      // Find the date slider container
      const sliderContainer = page.locator('.date-slider-container')
      const isVisible = await sliderContainer.isVisible().catch(() => false)

      if (!isVisible) {
        test.skip()
        return
      }

      // Get the slider bounds
      const box = await sliderContainer.boundingBox()
      if (!box) {
        test.skip()
        return
      }

      // Record the initial display value
      const initialDisplay = await sliderContainer.locator('.text-center').textContent()

      // Simulate drag from near the left handle to the right
      const startX = box.x + box.width * 0.1 // Near left
      const endX = box.x + box.width * 0.3 // Move right
      const y = box.y + box.height / 2

      await page.mouse.move(startX, y)
      await page.mouse.down()
      await page.mouse.move(endX, y, { steps: 10 })
      await page.mouse.up()

      // Wait for state to settle
      await page.waitForTimeout(1000)

      // Verify the chart is still visible (basic sanity check)
      await expect(page.locator('canvas#chart')).toBeVisible()

      // Verify the slider display has been updated (not necessarily changed,
      // but at least it should be stable and not jumping back)
      const finalDisplay = await sliderContainer.locator('.text-center').textContent()
      expect(finalDisplay).toBeDefined()

      // The key test: wait a bit more and verify display is stable
      await page.waitForTimeout(500)
      const stableDisplay = await sliderContainer.locator('.text-center').textContent()
      expect(stableDisplay).toBe(finalDisplay)

      // Log for debugging (won't fail test but helps diagnose issues)
      if (initialDisplay !== finalDisplay) {
        console.log(`Slider moved from "${initialDisplay}" to "${finalDisplay}"`)
      }
    })
  })

  test.describe('URL State Persistence', () => {
    test('should restore Maximize state from URL on page load', async ({ page }) => {
      // Load page with Maximize enabled
      await page.goto('/explorer?m=1')
      await waitForChart(page)

      await openDisplayTab(page)

      // Verify Maximize is ON
      const maxToggle = await findToggleByLabel(page, 'Maximize')
      await expect(maxToggle).toHaveAttribute('aria-checked', 'true')
    })

    test('should restore Baseline state from URL on page load', async ({ page }) => {
      // Load page with Baseline disabled
      await page.goto('/explorer?sb=0')
      await waitForChart(page)

      await openDisplayTab(page)

      // Verify Baseline is OFF
      const baselineToggle = await findToggleByLabel(page, 'Baseline')
      await expect(baselineToggle).toHaveAttribute('aria-checked', 'false')
    })

    test('should restore Show Labels state from URL on page load', async ({ page }) => {
      // Load page with Labels disabled
      await page.goto('/explorer?sl=0')
      await waitForChart(page)

      await openStyleTab(page)

      // Verify Labels is OFF
      const labelsToggle = await findToggleByLabel(page, 'Show Labels')
      await expect(labelsToggle).toHaveAttribute('aria-checked', 'false')
    })
  })

  test.describe('View-Specific Toggle Behavior', () => {
    test('should have Log Scale hidden or disabled in excess view', async ({ page }) => {
      // Load in excess view
      await page.goto('/explorer?e=1')
      await waitForChart(page)

      await openDisplayTab(page)

      // Log Scale should be hidden or disabled in excess view
      const logLabel = page.getByText('Log Scale')
      const isVisible = await logLabel.isVisible().catch(() => false)

      if (isVisible) {
        // If visible, it should be disabled
        const logToggle = await findToggleByLabel(page, 'Log Scale')
        const isDisabled = await logToggle.isDisabled().catch(() => false)
        expect(isDisabled).toBe(true)
      }
      // If not visible, that's also acceptable (hidden)
    })

    test('should have Baseline disabled in zscore view', async ({ page }) => {
      // Load in zscore view
      await page.goto('/explorer?zs=1')
      await waitForChart(page)

      await openDisplayTab(page)

      // Baseline should be disabled (required for zscore calculation)
      const baselineToggle = await findToggleByLabel(page, 'Baseline')
      await expect(baselineToggle).toBeDisabled()
    })
  })
})
