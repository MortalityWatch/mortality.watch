import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between all main pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/')
    await expect(page).toHaveURL('/')

    // Navigate to About
    await page.getByRole('link', { name: /about/i }).first().click()
    await expect(page).toHaveURL(/\/about/)

    // Navigate to Sources
    await page.getByRole('link', { name: /sources/i }).first().click()
    await expect(page).toHaveURL(/\/sources/)

    // Navigate to Ranking
    await page.getByRole('link', { name: /ranking/i }).first().click()
    await expect(page).toHaveURL(/\/ranking/)

    // Navigate to Donate
    await page.getByRole('link', { name: /donate/i }).first().click()
    await expect(page).toHaveURL(/\/donate/)

    // Go back to homepage (click logo or home link)
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })

  test('should preserve URL state when navigating', async ({ page }) => {
    // Navigate to explorer with some state
    await page.goto('/explorer')
    await page.waitForLoadState('networkidle')

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
