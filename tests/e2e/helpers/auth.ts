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
  const response = await page.request.post('/api/auth/signin', {
    data: {
      email,
      password,
      remember: rememberMe
    }
  })

  if (!response.ok()) {
    throw new Error(`Login failed with status ${response.status()}: ${await response.text()}`)
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/')
}

/**
 * Helper function to logout a user
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  const response = await page.request.post('/api/auth/signout')

  if (!response.ok()) {
    throw new Error(`Logout failed with status ${response.status()}: ${await response.text()}`)
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForURL('/')
}
