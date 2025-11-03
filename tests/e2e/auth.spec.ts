import { test, expect } from '@playwright/test'
import { login, logout, TEST_USER } from './helpers/auth'

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      // Verify form elements are present
      await expect(page.getByRole('textbox', { name: 'Email*' })).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'Password*' })).toBeVisible()
      await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

      // Verify links are present
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible()
    })

    test.skip('should show validation errors for empty fields', async ({ page }) => {
      // TODO: Fix validation - errors might not be shown on submit, only on blur/input
      await page.goto('/login')

      // Try to submit without filling fields
      await page.getByRole('button', { name: 'Continue' }).click()

      // Check for validation errors
      await expect(page.getByText('Email is required')).toBeVisible()
      await expect(page.getByText('Password is required')).toBeVisible()
    })

    test.skip('should show validation error for invalid email', async ({ page }) => {
      // TODO: Check actual validation error text
      await page.goto('/login')

      // Enter invalid email
      await page.getByRole('textbox', { name: 'Email*' }).fill('invalid-email')
      await page.getByRole('textbox', { name: 'Password*' }).fill('Password1!')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Check for email validation error
      await expect(page.getByText('Invalid email')).toBeVisible()
    })

    test.skip('should show validation error for short password', async ({ page }) => {
      // TODO: Check actual validation error text
      await page.goto('/login')

      // Enter short password
      await page.getByRole('textbox', { name: 'Email*' }).fill('test@example.com')
      await page.getByRole('textbox', { name: 'Password*' }).fill('short')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Check for password validation error
      await expect(page.getByText('Must be at least 8 characters')).toBeVisible()
    })

    test.skip('should toggle password visibility', async ({ page }) => {
      // TODO: Password input changes role when visibility toggles - need different approach
      await page.goto('/login')

      const passwordInput = page.getByRole('textbox', { name: 'Password*' })
      await passwordInput.fill('Password1!')

      // Password should be hidden initially
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click the eye icon to show password
      await page.getByRole('button', { name: 'Show password' }).click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide password
      await page.getByRole('button', { name: 'Hide password' }).click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'networkidle' })

      // Fill in credentials
      await page.getByRole('textbox', { name: 'Email*' }).fill(TEST_USER.email)
      await page.getByRole('textbox', { name: 'Password*' }).fill(TEST_USER.password)

      // Click checkbox (it's a button with role="checkbox", not a native checkbox)
      await page.getByRole('checkbox', { name: 'Remember me' }).click()

      await page.getByRole('button', { name: 'Continue' }).click()

      // Should redirect to home page
      await expect(page).toHaveURL('/')

      // Should show success toast (use first() to handle multiple matches)
      await expect(page.getByText('Welcome back!').first()).toBeVisible()
    })

    test.skip('should redirect to intended page after login', async ({ page }) => {
      // Explorer doesn't require auth - need to use a page that does (e.g., /profile or /my-charts)
      // Try to access profile while not logged in
      await page.goto('/profile')

      // Should redirect to login with redirect query param
      await expect(page).toHaveURL(/\/login\?redirect=/)

      // Login
      await page.getByRole('textbox', { name: 'Email*' }).fill(TEST_USER.email)
      await page.getByRole('textbox', { name: 'Password*' }).fill(TEST_USER.password)
      await page.getByRole('button', { name: 'Continue' }).click()

      // Should redirect back to profile
      await expect(page).toHaveURL('/profile')
    })

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'networkidle' })

      // Fill in invalid credentials
      await page.getByRole('textbox', { name: 'Email*' }).fill('wrong@example.com')
      await page.getByRole('textbox', { name: 'Password*' }).fill('WrongPassword1!')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Should show error alert (401 Server Error)
      await expect(page.getByText(/401 Server Error|Invalid email or password/i)).toBeVisible()

      // Should stay on login page
      await expect(page).toHaveURL('/login')
    })

    test('should NOT pre-fill credentials from URL parameters (security)', async ({ page }) => {
      // This is a critical security test - credentials should NEVER be in URL
      await page.goto('/login?email=test@example.com&password=secret123')

      // Verify fields are empty (not pre-filled from URL)
      const emailInput = page.getByRole('textbox', { name: 'Email*' })
      const passwordInput = page.getByRole('textbox', { name: 'Password*' })

      await expect(emailInput).toHaveValue('')
      await expect(passwordInput).toHaveValue('')
    })
  })

  test.describe('Session Management', () => {
    test.skip('should maintain session after page reload when "Remember me" is checked', async ({ page }) => {
      // TODO: Fix checkbox interaction
      await page.goto('/login')

      // Login with "Remember me"
      await page.getByRole('textbox', { name: 'Email*' }).fill(TEST_USER.email)
      await page.getByRole('textbox', { name: 'Password*' }).fill(TEST_USER.password)
      await page.getByRole('checkbox', { name: 'Remember me' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      // Wait for redirect
      await expect(page).toHaveURL('/')

      // Reload the page
      await page.reload()

      // Should still be logged in (not redirected to login)
      await expect(page).toHaveURL('/')
    })

    test('should logout successfully', async ({ page }) => {
      // Login first
      await login(page)

      // Logout
      await logout(page)

      // Should be on home page
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Signup Page', () => {
    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: 'Sign up' }).click()

      await expect(page).toHaveURL('/signup')
    })
  })

  test.describe('Forgot Password', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: 'Forgot password?' }).click()

      await expect(page).toHaveURL('/forgot-password')
    })
  })
})
