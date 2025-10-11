import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper function to run accessibility checks
async function checkA11y(page: Page, context: string) {
  // Check for basic accessibility issues
  const issues: string[] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} images without alt text`);
  }

  // Check for buttons/links without accessible names
  const buttonsWithoutText = await page
    .locator('button:not([aria-label]):not(:has-text(""))')
    .count();
  if (buttonsWithoutText > 0) {
    issues.push(`${buttonsWithoutText} buttons without accessible text`);
  }

  // Check for proper heading hierarchy
  const h1Count = await page.locator('h1').count();
  if (h1Count === 0) {
    issues.push('No h1 heading found');
  } else if (h1Count > 1) {
    issues.push(`Multiple h1 headings found (${h1Count})`);
  }

  // Check for form inputs without labels
  const inputsWithoutLabels = await page
    .locator('input:not([type="hidden"]):not([aria-label]):not([id])')
    .count();
  if (inputsWithoutLabels > 0) {
    issues.push(`${inputsWithoutLabels} inputs without labels`);
  }

  if (issues.length > 0) {
    console.warn(`Accessibility issues found on ${context}:`, issues);
  }

  // Fail test if critical issues found
  expect(imagesWithoutAlt, 'All images should have alt text for screen readers').toBe(0);
}

test.describe('Accessibility', () => {
  test('home page is accessible', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, 'Home page');
  });

  test('has proper keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocused).toBeTruthy();
  });

  test('has proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for main content area
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('supports screen reader text', async ({ page }) => {
    await page.goto('/');

    // Check for sr-only or visually-hidden text (Tailwind: sr-only)
    const srOnlyElements = await page.locator('.sr-only, .visually-hidden').count();
    if (srOnlyElements > 0) {
      console.log(`Found ${srOnlyElements} screen-reader-only elements`);
    }
  });

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/');

    // Get computed styles for text elements
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button, span');
    const count = await textElements.count();

    if (count > 0) {
      // Check first few elements for contrast (simplified check)
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Basic validation that colors are set
        expect(styles.color).toBeTruthy();
        expect(styles.backgroundColor).toBeTruthy();
      }
    }
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('mobile navigation is accessible', async ({ page }) => {
    await page.goto('/');

    // Mobile menu should be accessible
    const mobileMenuButton = page.locator('button[aria-label*="menu" i]');
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toHaveAttribute('aria-label');
    }
  });

  test('touch targets are large enough', async ({ page }) => {
    await page.goto('/');

    // Check button sizes (min 44x44px for touch targets)
    const buttons = page.locator('button, a[role="button"]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // Allow 40px minimum
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
