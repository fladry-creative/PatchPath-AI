/**
 * Tests for Gemini 2.5 Flash Image Integration
 */

import { isGeminiConfigured } from '@/lib/ai/gemini';

describe('Gemini Integration', () => {
  describe('isGeminiConfigured', () => {
    const originalEnv = process.env.GEMINI_API_KEY;

    afterEach(() => {
      // Restore original env
      if (originalEnv) {
        process.env.GEMINI_API_KEY = originalEnv;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it('returns true when GEMINI_API_KEY is set', () => {
      process.env.GEMINI_API_KEY = 'test-key';
      expect(isGeminiConfigured()).toBe(true);
    });

    it('returns false when GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;
      expect(isGeminiConfigured()).toBe(false);
    });

    it('returns false when GEMINI_API_KEY is empty string', () => {
      process.env.GEMINI_API_KEY = '';
      expect(isGeminiConfigured()).toBe(false);
    });
  });

  // Note: Actual diagram generation tests require a valid API key
  // and would make real API calls, so they're in integration tests
  describe('generatePatchDiagram', () => {
    it.skip('generates diagram with valid patch data', async () => {
      // This test requires a real API key and makes real API calls
      // Run integration tests instead:
      // npm test -- gemini-integration.test.ts
    });
  });
});
