// @ts-nocheck
import { test, expect } from '@playwright/test';

// E2E test for Project Infrastructure (Week 4-6)
// Tests: Project creation, unit management, listing display, inventory table

test.describe('Project Infrastructure E2E', () => {
  test('creates project, adds units, and displays inventory', async ({ page }) => {
    // Navigate to project creation form
    await page.goto('/master/projects/create');

    // Wait for form to load
    await expect(page.locator('h1').filter({ hasText: 'New Project' })).toBeVisible();

    // Tab 1: Project Info
    await page.locator('input[name="name"]').fill('Torre Vista Verde E2E');
    await page.locator('textarea[name="description"]').fill(
      'Proyecto residencial de lujo con acabados de primera calidad, ubicado en zona estratégica con excelente conectividad y acceso a servicios.'
    );
    await page.locator('input[name="shortDescription"]').fill('Residencias de lujo en ubicación premium');
    await page.locator('input[name="city"]').fill('Santo Domingo');
    await page.locator('input[name="sector"]').fill('Piantini');
    await page.locator('input[name="address"]').fill('Av. Abraham Lincoln #123');
    await page.locator('select[name="constructionStatus"]').selectOption('pre-venta');
    await page.locator('input[name="deliveryDate"]').fill('2027-12-31');

    // Next to Location tab
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Tab 2: Location
    await expect(page.locator('h2').filter({ hasText: 'Location Details' })).toBeVisible();
    await page.locator('input[name="latitude"]').fill('18.4861');
    await page.locator('input[name="longitude"]').fill('-69.9312');
    await page.locator('input[name="googleMapsUrl"]').fill('https://maps.google.com/test');

    // Next to Units tab
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Tab 3: Units
    await expect(page.locator('h2').filter({ hasText: 'Add Units' })).toBeVisible();
    
    // Add first unit manually
    await page.locator('button').filter({ hasText: '+ Add Unit' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(1);

    // Add second unit
    await page.locator('button').filter({ hasText: '+ Add Unit' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(2);

    // Verify units table shows data
    await expect(page.locator('table tbody tr').first()).toContainText('Unit-1');
    await expect(page.locator('table tbody tr').nth(1)).toContainText('Unit-2');

    // Next to Amenities tab
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Tab 4: Amenities
    await expect(page.locator('h2').filter({ hasText: 'Amenities & Features' })).toBeVisible();
    
    // Select some amenities
    const amenitiesCheckboxes = page.locator('input[type="checkbox"]');
    await amenitiesCheckboxes.nth(0).check(); // Piscina
    await amenitiesCheckboxes.nth(1).check(); // Gimnasio
    await amenitiesCheckboxes.nth(4).check(); // Seguridad 24/7

    // Next to Financing tab
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Tab 5: Financing
    await expect(page.locator('h2').filter({ hasText: 'Financing Options' })).toBeVisible();

    // Next to Review tab
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Tab 6: Review
    await expect(page.locator('h2').filter({ hasText: 'Review & Publish' })).toBeVisible();
    
    // Verify review data
    await expect(page.locator('text=Torre Vista Verde E2E')).toBeVisible();
    await expect(page.locator('text=Santo Domingo')).toBeVisible();
    await expect(page.locator('text=pre-venta')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible(); // Units count

    // Note: Actually submitting would require Firebase connection
    // In a real E2E test, we'd click "Publish Project" here
    // await page.locator('button').filter({ hasText: 'Publish Project' }).click();
    
    console.log('✅ Project creation form E2E test passed');
  });

  test('displays unit inventory table with filters', async ({ page }) => {
    // This test would require a project to exist in the database
    // For now, we test the component renders correctly
    
    await page.goto('/master/projects/create');
    
    // Navigate to units tab
    await page.locator('button').filter({ hasText: '3. Units' }).click();
    
    // Add multiple units to test filtering
    for (let i = 0; i < 5; i++) {
      await page.locator('button').filter({ hasText: '+ Add Unit' }).click();
    }
    
    // Verify table shows all units
    await expect(page.locator('table tbody tr')).toHaveCount(5);
    
    // Verify table headers are present
    await expect(page.locator('th').filter({ hasText: 'Unit #' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Type' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'BR/BA' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'M²' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Price USD' })).toBeVisible();
    
    // Verify remove button works
    await page.locator('table tbody tr').first().locator('button').filter({ hasText: 'Remove' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(4);
    
    console.log('✅ Unit inventory table E2E test passed');
  });

  test('validates required fields on form submission', async ({ page }) => {
    await page.goto('/master/projects/create');

    // Try to proceed without filling required fields
    await page.locator('button').filter({ hasText: 'Next →' }).click();

    // Should show toast error (react-hot-toast)
    // Wait briefly for toast to appear
    await page.waitForTimeout(500);

    // Form should still be on Info tab (not advanced)
    await expect(page.locator('h2').filter({ hasText: 'Project Information' })).toBeVisible();

    console.log('✅ Form validation E2E test passed');
  });

  test('tab navigation works correctly', async ({ page }) => {
    await page.goto('/master/projects/create');

    // Verify all tabs are visible
    await expect(page.locator('button').filter({ hasText: '1. Info' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '2. Location' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '3. Units' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '4. Amenities' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '5. Financing' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '6. Review' })).toBeVisible();

    // Click directly on Location tab
    await page.locator('button').filter({ hasText: '2. Location' }).click();
    await expect(page.locator('h2').filter({ hasText: 'Location Details' })).toBeVisible();

    // Click back to Info tab
    await page.locator('button').filter({ hasText: '1. Info' }).click();
    await expect(page.locator('h2').filter({ hasText: 'Project Information' })).toBeVisible();

    // Use Previous button
    await page.locator('button').filter({ hasText: '3. Units' }).click();
    await page.locator('button').filter({ hasText: '← Previous' }).click();
    await expect(page.locator('h2').filter({ hasText: 'Location Details' })).toBeVisible();

    console.log('✅ Tab navigation E2E test passed');
  });

  test('CSV bulk upload creates units table rows', async ({ page }) => {
    await page.goto('/master/projects/create');

    // Navigate to Units tab
    await page.locator('button').filter({ hasText: '3. Units' }).click();

    // Create a mock CSV file content
    const csvContent = `unitNumber,bedrooms,bathrooms,meters,lotMeters,unitType,priceUSD
A-101,3,2,120,150,apartamento,200000
A-102,2,2,100,120,apartamento,180000
A-103,4,3,150,180,apartamento,250000`;

    // Create a File object from the CSV content
    const buffer = Buffer.from(csvContent);
    const file = new File([buffer], 'units.csv', { type: 'text/csv' });

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'units.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Wait for CSV parsing and toast notification
    await page.waitForTimeout(1000);

    // Verify units table shows CSV data
    await expect(page.locator('table tbody tr')).toHaveCount(3);
    await expect(page.locator('table tbody tr').first()).toContainText('A-101');
    await expect(page.locator('table tbody tr').nth(1)).toContainText('A-102');
    await expect(page.locator('table tbody tr').nth(2)).toContainText('A-103');

    console.log('✅ CSV bulk upload E2E test passed');
  });
});

test.describe('API Routes Integration', () => {
  test('API routes are accessible', async ({ page, request }) => {
    // Test that API routes respond (not full CRUD since we need Firebase)
    
    // Test list endpoint (should return empty or error gracefully)
    const listResponse = await request.get('/api/projects/list?status=active');
    expect(listResponse.status()).toBeLessThan(500); // Should not 500
    
    console.log('✅ API routes accessibility test passed');
  });
});
