import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between all main pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/')
    await expect(page).toHaveURL('/')

    // On mobile, navigation is in hamburger menu
    const isMobile = page.viewportSize()!.width < 1024

    const clickLink = async (name: RegExp) => {
      if (isMobile) {
        await page.getByRole('button', { name: /open menu/i }).click()
      }
      await page.getByRole('link', { name }).first().click()
    }

    // Navigate to About
    await clickLink(/about/i)
    await expect(page).toHaveURL(/\/about/)

    // Navigate to Sources
    await clickLink(/sources/i)
    await expect(page).toHaveURL(/\/sources/)

    // Navigate to Ranking
    await clickLink(/ranking/i)
    await expect(page).toHaveURL(/\/ranking/)

    // Go back to homepage (click logo or home link)
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })

  test('should preserve URL state when navigating', async ({ page }) => {
    // Navigate to explorer with some state
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

    // On mobile, navigation is in hamburger menu
    const isMobile = page.viewportSize()!.width < 1024

    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
    }

    // Navigate away
    await page.getByRole('link', { name: /about/i }).first().click()
    await expect(page).toHaveURL(/\/about/)

    // Go back
    await page.goBack()
    await page.waitForLoadState('networkidle')

    // Should be back on explorer page
    await expect(page).toHaveURL(/\/explorer/)
  })

  test('should have working footer links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for footer links
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Verify at least some footer links exist
    const footerLinks = footer.getByRole('link')
    await expect(footerLinks.first()).toBeVisible()
  })
})
