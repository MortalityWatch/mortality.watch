import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test('should load about page successfully', async ({ page }) => {
    await page.goto('/about')

    // Verify page loaded
    await expect(page).toHaveURL(/\/about/)
  })

  test('should display about page content', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('domcontentloaded')

    // Should have some content about the project
    const content = page.locator('main, article, .container').first()
    await expect(content).toBeVisible()
  })

  test('should have navigation back to other pages', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('domcontentloaded')

    // Should be able to navigate to explorer
    const isMobile = page.viewportSize()!.width < 1024

    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
    }

    const explorerLink = page.getByRole('link', { name: /explorer/i }).first()
    await expect(explorerLink).toBeVisible()
  })

  test('should display project information', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('domcontentloaded')

    // Look for common about page elements
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })
})
