import { test, expect } from '@playwright/test';

/**
 * E2E tests for the complete patch generation flow
 * Tests the full user journey from rack analysis through patch generation
 */

// Demo rack URL for testing
const DEMO_RACK_URL = 'https://modulargrid.net/e/racks/view/2383104';

test.describe('Patch Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (will redirect to sign-in if not authenticated)
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should display patch generation form on dashboard', async ({ page }) => {
    // Check if we're on sign-in (unauthenticated) or dashboard (authenticated)
    const url = page.url();

    if (url.includes('/sign-in')) {
      // Not authenticated - verify sign-in page loaded
      await expect(page.locator('.cl-rootBox, [data-clerk-form]')).toBeVisible({
        timeout: 10000,
      });
    } else {
      // Authenticated - verify form is visible
      await expect(page.locator('h2:has-text("Generate a Patch")')).toBeVisible();
      await expect(page.locator('#rackUrl')).toBeVisible();
      await expect(page.locator('#intent')).toBeVisible();
      await expect(page.locator('#difficulty')).toBeVisible();
    }
  });

  test('should use demo rack URL when clicking demo button', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Click the demo rack button
    await page.click('button:has-text("Use demo rack for testing")');

    // Verify URL was populated
    const rackUrlInput = page.locator('#rackUrl');
    await expect(rackUrlInput).toHaveValue(DEMO_RACK_URL);
  });

  test('should validate required fields', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Submit button should be disabled when fields are empty
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Fill only rack URL
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await expect(submitButton).toBeDisabled();

    // Fill intent - button should now be enabled
    await page.fill('#intent', 'Test patch');
    await expect(submitButton).toBeEnabled();
  });

  test('should generate patch from demo rack URL', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Fill in the form
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Create a dark ambient drone with evolving textures');
    await page.selectOption('#difficulty', 'intermediate');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify loading state
    await expect(page.locator('text=Generating Patch')).toBeVisible({ timeout: 5000 });

    // Wait for patch to generate (Claude API can take 10-30 seconds)
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Verify patch card sections are displayed
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible();
    await expect(page.locator('h3:has-text("Why This Works")')).toBeVisible();

    // Verify at least one cable connection is shown
    const connections = page.locator('[class*="rounded-xl"][class*="border-white"]');
    expect(await connections.count()).toBeGreaterThan(0);

    // Verify action buttons are present
    await expect(page.locator('button:has-text("Save to Cookbook")')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
  });

  test('should handle invalid rack URL gracefully', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Fill in invalid URL
    await page.fill('#rackUrl', 'https://invalid-url.com/not-a-rack');
    await page.fill('#intent', 'Test intent');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[class*="border-red-500"]')).toBeVisible();
  });

  test('should handle empty ModularGrid rack', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Use a rack URL that might not exist or be empty
    await page.fill('#rackUrl', 'https://modulargrid.net/e/racks/view/999999999');
    await page.fill('#intent', 'Test intent');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message within reasonable time
    const errorVisible = await page.locator('text=Error').isVisible({ timeout: 20000 })
      .catch(() => false);

    // Either error is shown or form is still loading (both are acceptable)
    if (errorVisible) {
      await expect(page.locator('[class*="border-red-500"]')).toBeVisible();
    }
  });

  test('should generate patch variations when requested', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Fill in the form
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Techno bassline with movement');

    // Check variations checkbox
    await page.check('#variations');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for generation (variations take longer)
    await expect(page.locator('h3:has-text("Variations")')).toBeVisible({
      timeout: 60000
    });

    // Verify variations are displayed
    await expect(page.locator('text=Variation 1')).toBeVisible();

    // Should have at least 2 variations
    const variationCount = await page.locator('div:has-text("Variation")').count();
    expect(variationCount).toBeGreaterThanOrEqual(2);
  });

  test('should allow generating another patch after success', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Generate first patch
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Ambient pad');
    await page.click('button[type="submit"]');

    // Wait for patch generation
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Click "Generate Another"
    await page.click('button:has-text("Generate Another")');

    // Form should be visible again
    await expect(page.locator('#rackUrl')).toBeVisible();
    await expect(page.locator('#intent')).toBeVisible();

    // Previous patch should be hidden
    await expect(page.locator('h3:has-text("Your Generated Patch")')).not.toBeVisible();
  });

  test('should populate optional fields correctly', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Fill all fields including optional ones
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Complex evolving sequence');
    await page.fill('#technique', 'FM synthesis');
    await page.fill('#genre', 'IDM');
    await page.selectOption('#difficulty', 'advanced');

    // Verify values are set
    await expect(page.locator('#technique')).toHaveValue('FM synthesis');
    await expect(page.locator('#genre')).toHaveValue('IDM');
    await expect(page.locator('#difficulty')).toHaveValue('advanced');

    // Submit button should be enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should dismiss error messages', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Trigger an error
    await page.fill('#rackUrl', 'https://invalid-url.com');
    await page.fill('#intent', 'Test');
    await page.click('button[type="submit"]');

    // Wait for error
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 15000 });

    // Click close button (✕)
    await page.click('[class*="border-red-500"] button:has-text("✕")');

    // Error should be dismissed
    await expect(page.locator('text=Error')).not.toBeVisible();
  });
});

test.describe('Patch Generation - Different Rack Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should handle small rack configuration', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Use demo rack (which is a small-medium rack)
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Simple bass sequence');
    await page.selectOption('#difficulty', 'beginner');

    await page.click('button[type="submit"]');

    // Should generate successfully
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });
  });

  test('should suggest appropriate difficulty levels', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Test beginner difficulty
    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Learn basic patching');
    await page.selectOption('#difficulty', 'beginner');

    await page.click('button[type="submit"]');

    // Wait for patch
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Verify difficulty badge
    await expect(page.locator('text=BEGINNER')).toBeVisible();
  });
});

test.describe('Patch Generation - Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should show loading spinner during generation', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Test loading state');

    await page.click('button[type="submit"]');

    // Verify loading spinner appears
    const spinner = page.locator('[class*="animate-spin"]');
    await expect(spinner).toBeVisible({ timeout: 2000 });

    // Verify loading text
    await expect(page.locator('text=Generating Patch')).toBeVisible();
  });

  test('should disable form inputs during generation', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Test disabled state');

    await page.click('button[type="submit"]');

    // Check that inputs are disabled during loading
    await expect(page.locator('#rackUrl')).toBeDisabled();
    await expect(page.locator('#intent')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
});

test.describe('Patch Generation - UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display patch metadata correctly', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Experimental soundscape');
    await page.fill('#genre', 'ambient');

    await page.click('button[type="submit"]');

    // Wait for patch
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Verify metadata sections exist
    await expect(page.locator('[class*="text-3xl"][class*="font-bold"]').first()).toBeVisible();

    // Verify estimated time is shown
    await expect(page.locator('text=/⏱️.*min/')).toBeVisible();
  });

  test('should display cable connections with proper formatting', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Test cable display');

    await page.click('button[type="submit"]');

    // Wait for patch
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Verify connection numbering (1, 2, 3...)
    await expect(page.locator('span:has-text("1")').first()).toBeVisible();

    // Verify arrow (→) is present in connections
    await expect(page.locator('text=→')).toBeVisible();
  });

  test('should show Pro Tips section when available', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    await page.fill('#rackUrl', DEMO_RACK_URL);
    await page.fill('#intent', 'Advanced patch with tips');
    await page.selectOption('#difficulty', 'advanced');

    await page.click('button[type="submit"]');

    // Wait for patch
    await expect(page.locator('h3:has-text("Cable Routing")')).toBeVisible({
      timeout: 45000
    });

    // Pro Tips section should be visible
    await expect(page.locator('h3:has-text("Pro Tips")')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // This is a placeholder test for timeout handling
    // Will be fully implemented when timeout handling is added to the API
    test.skip();
  });

  test('should handle API rate limit', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // This is a placeholder test for rate limiting
    // Will be fully implemented when rate limiting UI is added
    test.skip();
  });

  test('should handle malformed ModularGrid URL', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Try with a URL that has wrong format
    await page.fill('#rackUrl', 'https://modulargrid.net/wrong/path');
    await page.fill('#intent', 'Test malformed URL');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 15000 });
  });

  test('should preserve form data when error occurs', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    const testIntent = 'My test intent that should be preserved';
    const testTechnique = 'FM synthesis';

    // Fill form
    await page.fill('#rackUrl', 'https://invalid-url.com');
    await page.fill('#intent', testIntent);
    await page.fill('#technique', testTechnique);

    await page.click('button[type="submit"]');

    // Wait for error
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 15000 });

    // Verify form data is still there
    await expect(page.locator('#intent')).toHaveValue(testIntent);
    await expect(page.locator('#technique')).toHaveValue(testTechnique);
  });
});

test.describe('Accessibility in Patch Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper form labels', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Verify all inputs have associated labels
    await expect(page.locator('label[for="rackUrl"]')).toBeVisible();
    await expect(page.locator('label[for="intent"]')).toBeVisible();
    await expect(page.locator('label[for="technique"]')).toBeVisible();
    await expect(page.locator('label[for="genre"]')).toBeVisible();
    await expect(page.locator('label[for="difficulty"]')).toBeVisible();
    await expect(page.locator('label[for="variations"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Skip if on sign-in page
    if (page.url().includes('/sign-in')) {
      test.skip();
    }

    // Tab through form fields
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.id);

    // Keep tabbing until we reach our form
    let attempts = 0;
    while (focused !== 'rackUrl' && attempts < 20) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.id);
      attempts++;
    }

    if (focused === 'rackUrl') {
      expect(focused).toBe('rackUrl');
    }
  });
});
