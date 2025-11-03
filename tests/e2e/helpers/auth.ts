import type { Page } from '@playwright/test'

export const TEST_USER = {
  email: 'pro@mortality.watch',
  password: 'Password1!'
}

/**
 * Helper function to login a user
 *
 * @param page - Playwright page object
 * @param email - User email (defaults to test user)
 * @param password - User password (defaults to test user)
 * @param rememberMe - Whether to check "Remember me" checkbox
 */
export async function login(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password,
  rememberMe: boolean = false
) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  await page.getByRole('textbox', { name: 'Email*' }).fill(email)
  await page.getByRole('textbox', { name: 'Password*' }).fill(password)

  if (rememberMe) {
    await page.getByRole('checkbox', { name: 'Remember me' }).click()
  }

  await page.getByRole('button', { name: 'Continue' }).click()

  // Wait for redirect to home page
  await page.waitForURL('/')
}

/**
 * Helper function to logout a user
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // The user menu button shows displayName, firstName, or defaults to 'Account'
  // Use a flexible regex to match any of these possibilities
  await page.getByRole('button', { name: /account|test user|pro/i }).click()
  await page.getByRole('menuitem', { name: 'Sign Out' }).click()

  // Wait for redirect to home
  await page.waitForURL('/')
}
