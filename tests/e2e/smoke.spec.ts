import { expect, test } from '@playwright/test'

test.describe('Smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /track global mortality/i })).toBeVisible()
  })

  test('about page renders current heading', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole('heading', { level: 1, name: /about mortality watch/i })).toBeVisible()
  })

  test('login page exposes auth entry points', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: /welcome back/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^sign up$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
  })

  test('signup page renders current CTA', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { level: 1, name: /create an account/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('forgot password page renders reset flow', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password$/)
    await expect(page.getByText(/forgot password/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })
})
