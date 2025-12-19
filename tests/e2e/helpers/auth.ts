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
  await page.goto('/login', { waitUntil: 'domcontentloaded' })

  // Wait for form to be ready and fully hydrated
  await page.waitForSelector('input[placeholder="Enter your email"]', { state: 'visible', timeout: 10000 })

  // Wait for Nuxt/Vue hydration to complete by checking for interactive elements
  // The form needs to be hydrated before we can interact with it properly
  await page.waitForFunction(() => {
    // Check if Vue has hydrated by looking for the __vue__ property or event handlers
    const form = document.querySelector('form')
    // When hydrated, the form should have Vue's event handlers attached
    return (form && (form as HTMLElement & { __vue_app__?: unknown }).__vue_app__ !== undefined) || document.readyState === 'complete'
  }, { timeout: 10000 })

  // Additional safety wait for all Vue components to be mounted
  await page.waitForTimeout(2000)

  // Use locator's type method which properly handles Vue's v-model
  const emailInput = page.locator('input[placeholder="Enter your email"]').first()
  const passwordInput = page.locator('input[placeholder="Enter your password"]').first()

  // Use pressSequentially which simulates real key presses
  await emailInput.click()
  await emailInput.pressSequentially(email, { delay: 30 })

  await passwordInput.click()
  await passwordInput.pressSequentially(password, { delay: 30 })

  if (rememberMe) {
    await page.getByRole('checkbox', { name: 'Remember me' }).click()
  }

  await page.getByRole('button', { name: 'Continue' }).click()

  // Wait for redirect to home page
  await page.waitForURL('/', { timeout: 15000 })
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
