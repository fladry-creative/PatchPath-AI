# Testing Guide

**Frameworks**: Jest (Unit) + Playwright (E2E)
**Date**: 2025-10-11

## Test Architecture

PatchPath AI uses a dual testing strategy:

1. **Jest** - Unit and integration tests for components and libraries
2. **Playwright** - End-to-end browser tests for user flows

## Unit Tests (Jest)

### Running Tests

```bash
# Run all unit tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
__tests__/
├── lib/
│   ├── module-service.test.ts    # Database operations
│   └── ai-client.test.ts         # AI client tests
└── components/
    └── (component tests here)
```

### Writing Unit Tests

```typescript
// __tests__/lib/example.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something specific', () => {
    const result = yourFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    expect(() => yourFunction(badInput)).toThrow('Expected error');
  });
});
```

### Coverage Thresholds

Minimum coverage requirements (enforced in CI/CD):

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI (visual mode)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Test Structure

```
e2e/
├── home.spec.ts           # Landing page tests
├── auth.spec.ts           # Authentication flows
├── accessibility.spec.ts  # A11y compliance tests
└── (feature tests here)
```

### Writing E2E Tests

```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    await page.goto('/feature');

    // Interact with page
    await page.click('button[data-testid="submit"]');

    // Assert result
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Accessibility Testing

Every page should pass basic accessibility checks:

```typescript
// e2e/accessibility.spec.ts
test('page is accessible', async ({ page }) => {
  await page.goto('/your-page');

  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  expect(imagesWithoutAlt).toBe(0);

  // Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Check keyboard navigation
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBeTruthy();
});
```

## Test Best Practices

### 1. **Test Behavior, Not Implementation**

✅ **Good**: Test user-visible behavior

```typescript
test('user can submit form', async ({ page }) => {
  await page.fill('[name="email"]', 'user@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

❌ **Bad**: Test internal implementation

```typescript
test('form calls handleSubmit', () => {
  expect(mockHandleSubmit).toHaveBeenCalled(); // Too coupled to implementation
});
```

### 2. **Use Data Test IDs**

For stable selectors, use `data-testid`:

```tsx
// Component
<button data-testid="submit-button">Submit</button>;

// Test
await page.click('[data-testid="submit-button"]');
```

### 3. **Test Error States**

```typescript
test('shows error for invalid input', async ({ page }) => {
  await page.fill('[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toContainText('Invalid email');
});
```

### 4. **Test Loading States**

```typescript
test('shows loading indicator during upload', async ({ page }) => {
  const uploadPromise = page.click('button[data-testid="upload"]');

  // Check loading state appears
  await expect(page.locator('.loading')).toBeVisible();

  await uploadPromise;

  // Check loading state disappears
  await expect(page.locator('.loading')).not.toBeVisible();
});
```

### 5. **Clean Up After Tests**

```typescript
import { test } from '@playwright/test';

test.afterEach(async ({ page }) => {
  // Clear cookies, local storage, etc.
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
});
```

## Mock Data

### API Mocking (Playwright)

```typescript
test('shows modules from API', async ({ page }) => {
  // Mock API response
  await page.route('**/api/modules', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        modules: [{ id: '1', name: 'Maths', manufacturer: 'Make Noise' }],
      }),
    });
  });

  await page.goto('/modules');

  await expect(page.locator('.module-card')).toHaveCount(1);
  await expect(page.locator('.module-name')).toContainText('Maths');
});
```

### Component Mocking (Jest)

```typescript
// __tests__/components/example.test.tsx
jest.mock('@/lib/api', () => ({
  fetchModules: jest.fn().mockResolvedValue([{ id: '1', name: 'Maths' }]),
}));
```

## Continuous Integration

Tests run automatically on every PR:

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm test -- --coverage

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Tests run before commits (configured in `.husky/pre-commit`):

```bash
# Only run tests for changed files
npm test -- --findRelatedTests $(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx)$')
```

## Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test -- module-service.test.ts

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Add breakpoints and use "Jest: Debug" from command palette
```

### Playwright Debugging

```bash
# Debug mode (step through)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# Generate test code (record actions)
npx playwright codegen http://localhost:3000
```

### Playwright Inspector

```typescript
// Add breakpoint in test
await page.pause(); // Opens Playwright Inspector
```

### Screenshot on Failure

Playwright automatically captures screenshots and videos on failure:

```
playwright-report/
├── screenshots/
│   └── test-name-failed.png
└── videos/
    └── test-name-failed.webm
```

## Performance Testing

### Measure Page Load Time

```typescript
test('page loads within 3 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000);
});
```

### Check Bundle Size

```typescript
test('critical resources load quickly', async ({ page }) => {
  const [response] = await Promise.all([
    page.waitForResponse((resp) => resp.url().includes('/_next/static')),
    page.goto('/'),
  ]);

  const timing = await page.evaluate(() => JSON.parse(JSON.stringify(performance.timing)));

  const loadTime = timing.loadEventEnd - timing.navigationStart;
  expect(loadTime).toBeLessThan(5000); // 5 seconds
});
```

## Accessibility Testing

### Required Checks

Every page must pass:

1. ✅ All images have alt text
2. ✅ Single H1 per page
3. ✅ Proper heading hierarchy (H1 → H2 → H3)
4. ✅ Form inputs have labels
5. ✅ Keyboard navigation works
6. ✅ ARIA landmarks present (main, nav)
7. ✅ Color contrast meets WCAG AA (4.5:1)
8. ✅ Touch targets ≥44px (mobile)

### Automated A11y Checks

```typescript
// e2e/accessibility.spec.ts includes automated checks
npm run test:e2e -- accessibility.spec.ts
```

## Visual Regression Testing

Playwright supports screenshot comparison:

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/');

  // Take screenshot and compare to baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
  });
});
```

Update baseline:

```bash
npm run test:e2e -- --update-snapshots
```

## Test Coverage Goals

### Current Coverage

```bash
npm run test:coverage
```

### Coverage Goals by Phase

| Phase      | Unit Coverage | E2E Coverage    |
| ---------- | ------------- | --------------- |
| MVP (Now)  | 70%           | Critical flows  |
| Beta       | 80%           | All user flows  |
| Production | 85%           | Full regression |

## Troubleshooting

### Tests Fail Locally But Pass in CI

- **Timing issues**: Add `await page.waitForLoadState('networkidle')`
- **Screen size**: Set viewport in test: `test.use({ viewport: { width: 1920, height: 1080 } })`

### Flaky Tests

- Add explicit waits: `await expect(locator).toBeVisible({ timeout: 10000 })`
- Use `test.fail()` to mark known flaky tests
- Increase retries in CI: `retries: process.env.CI ? 2 : 0`

### Slow Tests

- Use `test.slow()` for tests that need more time
- Run in parallel: `fullyParallel: true` in config
- Mock slow API calls instead of real requests

---

**Last Updated**: 2025-10-11
**Status**: Comprehensive testing framework with Jest + Playwright
