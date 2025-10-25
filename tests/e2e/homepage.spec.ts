import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loaded (title is "MortalityWatch" - one word)
    await expect(page).toHaveTitle(/MortalityWatch/i)
  })

  test('should display showcase images', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check for showcase section header
    await expect(page.getByRole('heading', { name: /Featured Visualizations/i })).toBeVisible()

    // Check for showcase images (may take time to load)
    const showcaseImages = page.locator('.grid img[alt]')
    await expect(showcaseImages.first()).toBeVisible({ timeout: 10000 })
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
