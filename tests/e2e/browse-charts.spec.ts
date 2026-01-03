import { test, expect } from '@playwright/test'

test.describe('Global Chart History Page (Pro Feature)', () => {
  // Note: This page requires Pro access. Without authentication,
  // users are redirected to /signup (for public users) or /subscribe (for registered users).

  test('should redirect unauthenticated users to signup page', async ({ page }) => {
    await page.goto('/charts/browse')

    // Public (unauthenticated) users should be redirected to signup page
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should have Global Chart History card on discover page', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // Check the "Global Chart History" heading exists (it's a Pro feature card)
    const chartHistoryHeading = page.getByRole('heading', { name: 'Global Chart History' })
    await expect(chartHistoryHeading).toBeVisible()
  })

  test('should show Sign Up badge for unauthenticated users on discover page', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('domcontentloaded')

    // The Global Chart History card should show a "Sign Up" badge for public users
    // (FeatureBadge shows "Sign Up" for public users, "Upgrade" for registered users)
    const signUpBadge = page.locator('text=Sign Up').first()
    await expect(signUpBadge).toBeVisible()
  })

  // Note: Tests for authenticated Pro users would require test authentication setup
  // The following tests document expected behavior for Pro users:
  // - Pro users should see /charts/browse page with "Global Chart History" heading
  // - Pro users should see sort controls (Newest, Most Viewed, Recently Accessed)
  // - Pro users should see chart grid or empty state
})
