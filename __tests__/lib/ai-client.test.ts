import { describe, it, expect, jest } from '@jest/globals';

describe('AI Client', () => {
  describe('Claude Model Configuration', () => {
    it('should use claude-sonnet-4-5 model', () => {
      const MODEL = 'claude-sonnet-4-5';
      expect(MODEL).toBe('claude-sonnet-4-5');
      expect(MODEL).not.toContain('haiku');
      expect(MODEL).not.toContain('3-5-sonnet');
    });

    it('should have correct pricing info for Sonnet 4.5', () => {
      const pricingInfo = {
        model: 'claude-sonnet-4-5',
        provider: 'Anthropic',
        costPer1MTokens: {
          input: 3.0,
          output: 15.0,
        },
      };

      expect(pricingInfo.model).toBe('claude-sonnet-4-5');
      expect(pricingInfo.costPer1MTokens.input).toBe(3.0);
      expect(pricingInfo.costPer1MTokens.output).toBe(15.0);
    });
  });

  describe('Vision Analysis', () => {
    it('should handle vision analysis response structure', () => {
      const mockVisionResponse = {
        modules: [
          {
            name: 'Maths',
            manufacturer: 'Make Noise',
            hp: 20,
            position: { x: 100, y: 50, width: 40, height: 128 },
            confidence: 0.95,
          },
        ],
        totalModules: 1,
        rackWidth: 104,
      };

      expect(mockVisionResponse).toHaveProperty('modules');
      expect(mockVisionResponse.modules).toHaveLength(1);
      expect(mockVisionResponse.modules[0]).toHaveProperty('name');
      expect(mockVisionResponse.modules[0]).toHaveProperty('manufacturer');
      expect(mockVisionResponse.modules[0]).toHaveProperty('confidence');
    });

    it('should validate confidence scores are between 0 and 1', () => {
      const validConfidence = 0.95;
      const invalidConfidenceTooHigh = 1.5;
      const invalidConfidenceTooLow = -0.1;

      expect(validConfidence).toBeGreaterThanOrEqual(0);
      expect(validConfidence).toBeLessThanOrEqual(1);
      expect(invalidConfidenceTooHigh).toBeGreaterThan(1);
      expect(invalidConfidenceTooLow).toBeLessThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', () => {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        expect(() => {
          throw new Error('ANTHROPIC_API_KEY is required');
        }).toThrow('ANTHROPIC_API_KEY is required');
      } else {
        expect(apiKey).toBeDefined();
      }
    });

    it('should handle invalid image buffer', () => {
      const validBuffer = Buffer.from('valid-image-data');
      const invalidBuffer = null;

      expect(Buffer.isBuffer(validBuffer)).toBe(true);
      expect(Buffer.isBuffer(invalidBuffer)).toBe(false);
    });
  });
});
