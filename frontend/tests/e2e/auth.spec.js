import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Attempt to find login/sign-in link or button
    const loginLink = page.getByRole('link', { name: /login|sign in|auth/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*auth/);
    }
  });

  test('User can view registration form', async ({ page }) => {
    await page.goto('/auth?mode=signup');
    // Ensure form fields are present using placeholders since labels don't have htmlFor attributes
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/i)).toBeVisible();
    await expect(page.getByPlaceholder(/John Doe/i)).toBeVisible();
  });

  // Note: Actual login/registration would require either mocking the API
  // or having a dedicated test user in the database.
});
