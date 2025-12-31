import { test, expect } from '@playwright/test'

test.describe('Browse All Charts Page', () => {
  test('should load browse page successfully', async ({ page }) => {
    await page.goto('/charts/browse')

    // Verify page loaded
    await expect(page).toHaveURL(/\/charts\/browse/)
  })

  test('should display page heading and description', async ({ page }) => {
    await page.goto('/charts/browse')
    await page.waitForLoadState('domcontentloaded')

    // Check heading
    const heading = page.getByRole('heading', { name: 'Browse All Charts' })
    await expect(heading).toBeVisible()

    // Check description
    const description = page.getByText('All charts ever created on the platform')
    await expect(description).toBeVisible()
  })

  test('should display sort controls', async ({ page }) => {
    await page.goto('/charts/browse')
    await page.waitForLoadState('domcontentloaded')

    // Check sort buttons
    await expect(page.getByRole('button', { name: 'Newest' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Most Viewed' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recently Accessed' })).toBeVisible()
  })

  test('should have link from gallery page', async ({ page }) => {
    await page.goto('/charts')
    await page.waitForLoadState('domcontentloaded')

    // Check the "Browse All Charts" button exists
    const browseLink = page.getByRole('link', { name: 'Browse All Charts' })
    await expect(browseLink).toBeVisible()

    // Click and verify navigation
    await browseLink.click()
    await expect(page).toHaveURL(/\/charts\/browse/)
  })

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/charts/browse')
    await page.waitForLoadState('domcontentloaded')

    // Either charts grid or empty state should be visible
    const chartsGrid = page.locator('.grid')
    const emptyState = page.getByText('No charts found')

    // One of these should be visible (depending on whether there are charts)
    const gridVisible = await chartsGrid.isVisible().catch(() => false)
    const emptyVisible = await emptyState.isVisible().catch(() => false)

    expect(gridVisible || emptyVisible).toBe(true)
  })
})
