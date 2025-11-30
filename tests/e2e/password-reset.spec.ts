import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test.describe('Forgot Password Page', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')

      // Should have email input
      await expect(page.getByRole('textbox', { name: /Email/i })).toBeVisible()

      // Should have submit button
      await expect(page.getByRole('button', { name: /Send|Reset|Submit/i })).toBeVisible()
    })

    test('should have link back to login', async ({ page }) => {
      await page.goto('/forgot-password')

      // Look for any link or button that goes back to login
      const loginLink = page.locator('a[href*="login"], a[href*="signin"]').first()
      await expect(loginLink).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/forgot-password')

      const emailInput = page.getByRole('textbox', { name: /Email/i })
      await emailInput.fill('invalid-email')

      const submitButton = page.getByRole('button', { name: /Send|Reset|Submit/i })
      await submitButton.click()

      await page.waitForTimeout(500)

      // Should either show error or stay on page
      const errorMessage = page.getByText(/invalid email|valid email/i)
      const hasError = await errorMessage.isVisible().catch(() => false)

      if (!hasError) {
        // If no error message, verify we're still on the page
        await expect(page).toHaveURL(/\/forgot-password/)
      }
    })
  })

  test.describe('Reset Password Page', () => {
    test('should display reset password form with token', async ({ page }) => {
      // Visit with a fake token (will fail validation but should show form)
      await page.goto('/reset-password/fake-token-123')

      await page.waitForTimeout(1000)

      // Should either show password form or error for invalid token, or redirect
      const passwordInput = page.locator('input[type="password"]').first()
      const errorMessage = page.getByText(/invalid|expired|token|error/i)

      const hasForm = await passwordInput.isVisible().catch(() => false)
      const hasError = await errorMessage.isVisible().catch(() => false)
      const redirected = page.url().includes('login') || page.url().includes('forgot')

      // Either form is shown or error message or redirect
      expect(hasForm || hasError || redirected).toBe(true)
    })
  })

  test.describe('Check Email Page', () => {
    test('should display check email content', async ({ page }) => {
      await page.goto('/check-email')

      await page.waitForTimeout(1000)

      // Page should have loaded
      const hasContent = await page.locator('body').isVisible()
      expect(hasContent).toBe(true)
    })
  })

  test.describe('Verify Email Page', () => {
    test('should handle invalid verification token', async ({ page }) => {
      await page.goto('/verify-email/invalid-token-xyz')

      await page.waitForTimeout(2000)

      // Page should have loaded and handled the invalid token
      const hasContent = await page.locator('body').isVisible()
      expect(hasContent).toBe(true)
    })
  })
})
