import { test, expect } from '@playwright/test'

test.describe('Sources Page', () => {
  test('should load sources page successfully', async ({ page }) => {
    await page.goto('/sources')

    // Verify page loaded
    await expect(page).toHaveURL(/\/sources/)

    // Check for main heading
    await expect(page.getByRole('heading', { name: /Data Sources/i })).toBeVisible()
  })

  test('should display tabs for different source types', async ({ page }) => {
    await page.goto('/sources')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // Give tabs time to render

    // Should have mortality tab (default) - match full label text
    const mortalityTab = page.getByRole('tab', { name: /Mortality Data/i })
    await expect(mortalityTab).toBeVisible()

    // Should have population tab
    const populationTab = page.getByRole('tab', { name: /Population Data/i })
    await expect(populationTab).toBeVisible()

    // Should have standard tab
    const standardTab = page.getByRole('tab', { name: /Standard Populations/i })
    await expect(standardTab).toBeVisible()
  })

  test('should display data table on mortality tab', async ({ page }) => {
    await page.goto('/sources')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Should show table with data
    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })
  })

  test('should support pagination', async ({ page }) => {
    await page.goto('/sources')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Should show pagination info (e.g., "Showing 1 to 10 of X entries")
    const paginationInfo = page.getByText(/Showing \d+ to \d+ of \d+ entries/i)
    await expect(paginationInfo).toBeVisible({ timeout: 10000 })
  })

  test('should update URL when switching tabs', async ({ page }) => {
    await page.goto('/sources')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // Give tabs time to render

    // Click population tab - use full label text
    const populationTab = page.getByRole('tab', { name: /Population Data/i })
    await populationTab.click()
    await page.waitForTimeout(500)

    // URL should update with tab parameter
    expect(page.url()).toContain('tab=population')

    // Click standard tab
    const standardTab = page.getByRole('tab', { name: /Standard Populations/i })
    await standardTab.click()
    await page.waitForTimeout(500)

    // URL should update
    expect(page.url()).toContain('tab=standard')
  })

  test('should update sources page on browser back/forward navigation', async ({ page }) => {
    // Start on mortality tab (default)
    await page.goto('/sources')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const initialUrl = page.url()

    // Navigate to population tab via URL
    await page.goto('/sources?tab=population')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const secondUrl = page.url()
    expect(secondUrl).toContain('tab=population')

    // Verify population tab is active
    const populationTab = page.getByRole('tab', { name: /Population Data/i })
    await expect(populationTab).toHaveAttribute('aria-selected', 'true')

    // Navigate to standard tab with pagination
    await page.goto('/sources?tab=standard&page=2&limit=20')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const thirdUrl = page.url()
    expect(thirdUrl).toContain('tab=standard')
    expect(thirdUrl).toContain('page=2')

    // Go back using browser navigation (should go to population tab)
    await page.goBack()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Should be back on population tab
    expect(page.url()).toBe(secondUrl)
    expect(page.url()).toContain('tab=population')
    await expect(populationTab).toHaveAttribute('aria-selected', 'true')

    // Go back again (should go to mortality tab)
    await page.goBack()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Should be back to initial state
    expect(page.url()).toBe(initialUrl)
    const mortalityTab = page.getByRole('tab', { name: /Mortality Data/i })
    await expect(mortalityTab).toHaveAttribute('aria-selected', 'true')

    // Go forward (should go to population)
    await page.goForward()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    expect(page.url()).toBe(secondUrl)
    await expect(populationTab).toHaveAttribute('aria-selected', 'true')

    // Go forward again (should go to standard with page 2)
    await page.goForward()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    expect(page.url()).toBe(thirdUrl)
    expect(page.url()).toContain('tab=standard')
  })
})
