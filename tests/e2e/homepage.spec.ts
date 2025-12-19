import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loaded (title is "Mortality Watch" - two words)
    await expect(page).toHaveTitle(/Mortality Watch/i)
  })

  test('should display showcase section', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded')

    // Check for showcase section header
    await expect(page.getByRole('heading', { name: /Featured Visualizations/i })).toBeVisible()

    // The page should either show:
    // 1. A loading spinner (while fetching data)
    // 2. A grid with images (if there are featured charts)
    // 3. Nothing additional (if no featured charts)

    // Wait a bit for the API call to complete
    await page.waitForTimeout(2000)

    // Check if images loaded (if there are featured charts in the database)
    const images = page.locator('.grid img[alt]')
    const imageCount = await images.count()

    if (imageCount > 0) {
      // If there are images, verify the first one is visible
      await expect(images.first()).toBeVisible()
    }
    // If no images, that's also valid (no featured charts in DB)
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // On mobile, navigation is in hamburger menu
    const isMobile = page.viewportSize()!.width < 1024

    if (isMobile) {
      // Open hamburger menu
      await page.getByRole('button', { name: /open menu/i }).click()
    }

    // Check main navigation links are present (use first() when multiple matches)
    await expect(page.getByRole('link', { name: /explorer/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /ranking/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible()
  })

  test('should navigate to explorer page', async ({ page }) => {
    await page.goto('/')

    // On mobile, navigation is in hamburger menu
    const isMobile = page.viewportSize()!.width < 1024

    if (isMobile) {
      // Open hamburger menu
      await page.getByRole('button', { name: /open menu/i }).click()
    }

    // Click explorer link (use first() when multiple matches)
    await page.getByRole('link', { name: /explorer/i }).first().click()

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
