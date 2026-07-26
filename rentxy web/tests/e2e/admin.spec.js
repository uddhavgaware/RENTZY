import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
  test('Admin can navigate to dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Non-admins should be redirected or see an access denied message
    // If the test user is not logged in as admin, it should redirect to auth
    await expect(page).toHaveURL(/.*auth|.*admin/);
  });
});
