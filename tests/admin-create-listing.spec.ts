// @ts-nocheck
import { test, expect } from '@playwright/test'

// E2E mock test for Admin Create Listing page
// Requires NEXT_PUBLIC_E2E=1 (set in playwright.config.ts webServer.env)

const LONG_TEXT = 'Excelente propiedad con acabados de primera, ubicación céntrica y amenidades completas. '.repeat(2)

test.describe('Admin Create Listing (E2E mock)', () => {
  test('creates listing with mocked upload and submission', async ({ page }) => {
    // Bypass protection via ?e2e=1 (ProtectedClient honors this in E2E mode)
    await page.goto('/admin/properties/create?e2e=1')

    // Form heading
    await expect(page.getByTestId('create-heading')).toBeVisible()

    // Fill minimal required fields
    await page.getByTestId('create-title').fill('Apartamento de prueba E2E')
    await page.getByTestId('create-price').fill('250000')
    await page.getByTestId('create-area').fill('120')
    await page.getByTestId('create-bedrooms').fill('3')
    await page.getByTestId('create-bathrooms').fill('2')
    await page.getByTestId('create-location').fill('Av. Churchill, Piantini')
    await page.getByTestId('create-public-remarks').fill(LONG_TEXT)

    // Upload (mocked in E2E mode)
    await page.getByTestId('create-upload').click()

    // Submit
    await page.getByTestId('create-submit').click()

    // Expect redirect to properties list
    await page.waitForURL('**/admin/properties*', { timeout: 10000 })
  })
})
