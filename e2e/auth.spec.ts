import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show sign-in page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should have sign-in form elements', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for Clerk sign-in widget (might be iframe or shadow DOM)
    // Adjust selectors based on your actual Clerk implementation
    await expect(page.locator('.cl-rootBox, [data-clerk-form]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to sign-up from sign-in', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for sign-up link (Clerk provides this by default)
    const signUpLink = page.getByRole('link', { name: /sign up/i });
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/\/sign-up/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('dashboard requires authentication', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('analyze page requires authentication', async ({ page }) => {
    await page.goto('/analyze');
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
