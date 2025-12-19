import { test, expect } from '@playwright/test'
import { login, TEST_USER } from './helpers/auth'

test.describe('Profile Page', () => {
  test.describe('Access Control', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/profile')

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/)
    })

    test('should load profile page when authenticated', async ({ page }) => {
      await login(page)
      await page.goto('/profile')

      await expect(page).toHaveURL('/profile')
      // Page should have some content
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Account Information', () => {
    test('should display user email when authenticated', async ({ page }) => {
      await login(page)
      await page.goto('/profile')
      await page.waitForLoadState('domcontentloaded')

      // The email should be displayed somewhere on the page
      await expect(page.getByText(TEST_USER.email)).toBeVisible()
    })
  })
})
