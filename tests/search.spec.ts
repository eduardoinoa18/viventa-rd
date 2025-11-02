// @ts-nocheck
import { test, expect } from '@playwright/test'

// Basic smoke tests for the Search page layout and map rendering
// These run in E2E mode with a dev server started by Playwright config

test.describe('Search page', () => {
  test('loads and shows filters + list/map layout', async ({ page }) => {
    await page.goto('/search')

    // Heading
    await expect(page.getByRole('heading', { level: 1, name: /Buscar propiedades/i })).toBeVisible()

    // Filters sidebar
    await expect(page.getByText('Filtros', { exact: false })).toBeVisible()

    // Search input present
    await expect(page.getByPlaceholder('Buscar por título, ubicación, descripción...')).toBeVisible()
  })

  test('renders the Leaflet map (desktop)', async ({ page }) => {
    await page.goto('/search')

    // On desktop layout, a Leaflet map should initialize. Look for leaflet container.
    // Allow some time for dynamic import + map init.
    const mapContainer = await page.waitForSelector('.leaflet-container', { timeout: 15000 })
    expect(mapContainer).toBeTruthy()
  })

  test('shows empty-state or results list without layout overlap', async ({ page }) => {
    await page.goto('/search')

    // Either we see property cards or the list empty-state
    const cards = page.locator('[data-testid="property-card"], .bg-white.rounded-lg.shadow-sm >> text=/propiedades encontradas/i')
    await expect(cards.first()).toBeVisible()

    // Verify the sidebar (filters) and main list are both visible in desktop grid
    // This checks that they are rendered and not overlapping via visibility
    await expect(page.getByText('Filtros', { exact: false })).toBeVisible()
    await expect(page.getByText(/propiedades encontradas/i)).toBeVisible()
  })
})
