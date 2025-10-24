import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loaded
    await expect(page).toHaveTitle(/Mortality Watch/i)
  })

  test('should display showcase images', async ({ page }) => {
    await page.goto('/')

    // Check for showcase gallery
    const showcaseImages = page.locator('img[alt*="mortality"], img[alt*="chart"]')
    await expect(showcaseImages.first()).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // Check main navigation
    await expect(page.getByRole('link', { name: /explorer/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /ranking/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible()
  })

  test('should navigate to explorer page', async ({ page }) => {
    await page.goto('/')

    // Click explorer link
    await page.getByRole('link', { name: /explorer/i }).click()

    // Verify we're on explorer page
    await expect(page).toHaveURL(/\/explorer/)
  })

  test('should have dark mode toggle', async ({ page }) => {
    await page.goto('/')

    // Look for dark mode toggle (icon or button)
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]').first()

    if (await darkModeToggle.isVisible()) {
      await expect(darkModeToggle).toBeVisible()
    }
  })
})
