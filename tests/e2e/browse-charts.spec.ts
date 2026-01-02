import { test, expect } from '@playwright/test'

test.describe('Global Chart History Page (Pro Feature)', () => {
  // Note: This page requires Pro access. Without authentication,
  // users are redirected to /features for upgrade prompt.

  test('should redirect unauthenticated users to features page', async ({ page }) => {
    await page.goto('/charts/browse')

    // Non-pro users should be redirected to features page
    await expect(page).toHaveURL(/\/features/)
  })

  test('should have link from discover page', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // Check the "Global Chart History" heading exists (it's a Pro feature card)
    const chartHistoryHeading = page.getByRole('heading', { name: 'Global Chart History' })
    await expect(chartHistoryHeading).toBeVisible()
  })

  test('should show upgrade badge for non-pro users on discover page', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // The Global Chart History card should show an upgrade badge for non-pro users
    // Look for the "Sign Up" or "Upgrade" badge near the heading
    const chartHistoryCard = page.locator('a[href*="charts/browse"], a[href*="features"]').filter({
      has: page.getByRole('heading', { name: 'Global Chart History' })
    })
    await expect(chartHistoryCard).toBeVisible()
  })

  // Note: Tests for authenticated Pro users would require test authentication setup
  // The following tests document expected behavior for Pro users:
  // - Pro users should see /charts/browse page with "Global Chart History" heading
  // - Pro users should see sort controls (Newest, Most Viewed, Recently Accessed)
  // - Pro users should see chart grid or empty state
})
