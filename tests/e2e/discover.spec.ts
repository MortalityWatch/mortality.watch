import { test, expect } from '@playwright/test'

test.describe('Discover Feature', () => {
  test.describe('Hub Page', () => {
    test('should load discover hub page', async ({ page }) => {
      await page.goto('/discover')
      await expect(page).toHaveURL(/\/discover/)
    })

    test('should display page heading', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('domcontentloaded')

      const heading = page.getByRole('heading', { name: 'Discover Mortality Data' })
      await expect(heading).toBeVisible()
    })

    test('should have two main navigation cards', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('domcontentloaded')

      await expect(page.getByRole('heading', { name: 'Explore by Metric' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Explore by Country' })).toBeVisible()
    })

    test('should navigate to metric page when clicking Explore by Metric', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('heading', { name: 'Explore by Metric' }).click()
      await expect(page).toHaveURL(/\/discover\/metric/)
    })

    test('should navigate to country page when clicking Explore by Country', async ({ page }) => {
      await page.goto('/discover')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('heading', { name: 'Explore by Country' }).click()
      await expect(page).toHaveURL(/\/discover\/country/)
    })
  })

  test.describe('By Metric Flow', () => {
    test('should display 6 metric cards', async ({ page }) => {
      await page.goto('/discover/metric')
      await page.waitForLoadState('domcontentloaded')

      // Check for metric labels
      await expect(page.getByText('Life Expectancy')).toBeVisible()
      await expect(page.getByText('Age-Standardized Deaths')).toBeVisible()
      await expect(page.getByText('Age-Standardized Mortality Rate')).toBeVisible()
      await expect(page.getByText('Crude Mortality Rate')).toBeVisible()
      await expect(page.getByText('Deaths', { exact: true })).toBeVisible()
      await expect(page.getByText('Population')).toBeVisible()
    })

    test('should navigate to metric detail page', async ({ page }) => {
      await page.goto('/discover/metric')
      await page.waitForLoadState('domcontentloaded')

      await page.getByText('Age-Standardized Mortality Rate').click()
      await expect(page).toHaveURL(/\/discover\/metric\/asmr/)
    })

    test('should display preset cards for metric', async ({ page }) => {
      await page.goto('/discover/metric/asmr')
      await page.waitForLoadState('domcontentloaded')

      // Check for chart type headers
      await expect(page.getByRole('heading', { name: 'Weekly' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Monthly' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Quarterly' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Yearly' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Flu Season' })).toBeVisible()

      // Check for view options
      await expect(page.getByText('Normal').first()).toBeVisible()
      await expect(page.getByText('Excess').first()).toBeVisible()
      await expect(page.getByText('Z-Score').first()).toBeVisible()
    })

    test('should navigate to country grid when clicking preset', async ({ page }) => {
      await page.goto('/discover/metric/asmr')
      await page.waitForLoadState('domcontentloaded')

      // Click first Normal card (under Weekly)
      await page.locator('a[href*="weekly-normal"]').first().click()
      await expect(page).toHaveURL(/\/discover\/metric\/asmr\/weekly-normal/)
    })

    test('should display country grid with filter', async ({ page }) => {
      await page.goto('/discover/metric/asmr/weekly-normal')
      await page.waitForLoadState('domcontentloaded')

      // Check region filter buttons exist
      await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'EU27' })).toBeVisible()

      // Should show either country cards or loading/empty state
      const cards = page.locator('[class*="grid"]')
      await expect(cards).toBeVisible()
    })

    test('should redirect invalid metric to metric list', async ({ page }) => {
      await page.goto('/discover/metric/invalid-metric')

      // Should redirect to /discover/metric
      await expect(page).toHaveURL(/\/discover\/metric\/?$/)
    })

    test('should redirect invalid preset to metric page', async ({ page }) => {
      await page.goto('/discover/metric/asmr/invalid-preset')

      // Should redirect to /discover/metric/asmr
      await expect(page).toHaveURL(/\/discover\/metric\/asmr\/?$/)
    })
  })

  test.describe('By Country Flow', () => {
    test('should display country picker', async ({ page }) => {
      await page.goto('/discover/country')
      await page.waitForLoadState('domcontentloaded')

      // Check for search input
      await expect(page.getByPlaceholder('Search countries...')).toBeVisible()

      // Check for region browse buttons
      await expect(page.getByRole('button', { name: 'Europe' })).toBeVisible()
    })

    test('should filter countries by search', async ({ page }) => {
      await page.goto('/discover/country')
      await page.waitForLoadState('networkidle')

      const searchInput = page.getByPlaceholder('Search countries...')
      await searchInput.fill('Germany')

      // Should show Germany in results
      await expect(page.getByText('Germany')).toBeVisible()
    })

    test('should navigate to country detail page', async ({ page }) => {
      await page.goto('/discover/country')
      await page.waitForLoadState('networkidle')

      // Click on a popular country (USA should be visible)
      const usaLink = page.locator('a[href="/discover/country/USA"]').first()
      await usaLink.click()

      await expect(page).toHaveURL(/\/discover\/country\/USA/)
    })

    test('should display metric tabs on country page', async ({ page }) => {
      await page.goto('/discover/country/DEU')
      await page.waitForLoadState('domcontentloaded')

      // Check for metric tabs
      await expect(page.getByRole('tab', { name: /LE/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /ASMR/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /CMR/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /Deaths/ })).toBeVisible()
      await expect(page.getByRole('tab', { name: /Population/ })).toBeVisible()
    })

    test('should switch tabs on country page', async ({ page }) => {
      await page.goto('/discover/country/DEU')
      await page.waitForLoadState('domcontentloaded')

      // Click ASMR tab
      await page.getByRole('tab', { name: /ASMR/ }).click()

      // URL should update with tab parameter
      await expect(page).toHaveURL(/tab=asmr/)
    })

    test('should redirect invalid country to country list', async ({ page }) => {
      await page.goto('/discover/country/INVALID')

      // Should redirect to /discover/country
      await expect(page).toHaveURL(/\/discover\/country\/?$/)
    })
  })

  test.describe('Navigation', () => {
    test('should have Discover link in header', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const discoverLink = page.getByRole('link', { name: 'Discover' })
      await expect(discoverLink).toBeVisible()
    })

    test('should navigate to discover from header', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      await page.getByRole('link', { name: 'Discover' }).click()
      await expect(page).toHaveURL(/\/discover/)
    })

    test('should have working breadcrumbs', async ({ page }) => {
      await page.goto('/discover/metric/asmr/weekly-normal')
      await page.waitForLoadState('domcontentloaded')

      // Click on Metric breadcrumb
      await page.getByRole('link', { name: 'Metric' }).click()
      await expect(page).toHaveURL(/\/discover\/metric\/?$/)
    })
  })
})
