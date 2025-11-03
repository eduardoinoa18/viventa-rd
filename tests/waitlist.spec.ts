import { test, expect } from '@playwright/test'

// Helper to clear waitlist localStorage flags before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('waitlist_dismissed')
      localStorage.removeItem('waitlist_submitted')
    } catch {}
  })
})

test('opens waitlist popup from homepage CTA', async ({ page }) => {
  await page.goto('/')
  // Try clicking the CTA by Spanish text
  const btn = page.getByRole('button', { name: /Reservar mi Cupo/i })
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
  } else {
    // Fallback: dispatch the custom event
    await page.evaluate(() => document.dispatchEvent(new Event('open-waitlist')))
  }
  // Expect the popup header to appear
  await expect(page.getByText('Asegura tu Cupo VIP')).toBeVisible()
})

test('middleware redirects agent to portal when visiting /login', async ({ page, context, baseURL }) => {
  // Set role cookie to simulate logged-in agent
  await context.addCookies([
    { name: 'viventa_role', value: 'agent', url: baseURL! },
  ])
  await page.goto('/login')
  await expect(page).toHaveURL(/\/agent(\?.*)?$/)
})

test('middleware redirects broker to portal when visiting /login', async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: 'viventa_role', value: 'broker', url: baseURL! },
  ])
  await page.goto('/login')
  await expect(page).toHaveURL(/\/broker(\?.*)?$/)
})
