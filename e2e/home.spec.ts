import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/PatchPath/i);

    // Check hero section
    const hero = page.locator('h1');
    await expect(hero).toBeVisible();
  });

  test('should navigate to dashboard when clicking Get Started', async ({ page }) => {
    await page.goto('/');

    // Click Get Started button
    const getStartedButton = page.getByRole('link', { name: /get started/i });
    await getStartedButton.click();

    // Should redirect to auth or dashboard
    await expect(page).toHaveURL(/\/(dashboard|sign-in)/);
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');

    // Check nav is visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
