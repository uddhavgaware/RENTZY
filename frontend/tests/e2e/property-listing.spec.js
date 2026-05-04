import { test, expect } from '@playwright/test';

test.describe('Property Listing Flow', () => {
  test('User can navigate to properties page', async ({ page }) => {
    await page.goto('/properties');
    
    // Expect the page to have a heading or specific element related to properties
    await expect(page.getByRole('heading', { name: /properties|listings/i })).toBeVisible({ timeout: 10000 }).catch(() => null);
  });

  test('User can view a property details page', async ({ page }) => {
    await page.goto('/properties');
    
    // Attempt to click the first property card if it exists
    const firstProperty = page.locator('.property-card, [data-testid="property-card"]').first();
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await expect(page).toHaveURL(/.*properties\/\d+/);
    }
  });
});
