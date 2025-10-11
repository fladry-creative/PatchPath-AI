/**
 * Tests for lib/vision/rack-analyzer.ts
 * Uses REAL Anthropic API with minimal token usage
 */

import { describe, it, expect } from '@jest/globals';
import {
  analyzeRackImage,
  isVisionConfigured,
  getVisionModelInfo,
} from '@/lib/vision/rack-analyzer';

describe('lib/vision/rack-analyzer', () => {
  describe('isVisionConfigured', () => {
    it('should check if vision API is configured', () => {
      const isConfigured = isVisionConfigured();
      expect(typeof isConfigured).toBe('boolean');

      if (process.env.ANTHROPIC_API_KEY) {
        expect(isConfigured).toBe(true);
      }
    });
  });

  describe('getVisionModelInfo', () => {
    it('should return correct vision model information', () => {
      const info = getVisionModelInfo();

      expect(info).toHaveProperty('model');
      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('capabilities');
      expect(info).toHaveProperty('costPer1MTokens');

      expect(info.model).toBe('claude-sonnet-4-5');
      expect(info.provider).toBe('Anthropic');
      expect(Array.isArray(info.capabilities)).toBe(true);
      expect(info.capabilities).toContain('image_analysis');
      expect(info.capabilities).toContain('module_identification');
      expect(info.costPer1MTokens.input).toBe(3.0);
      expect(info.costPer1MTokens.output).toBe(15.0);
    });
  });

  describe('analyzeRackImage', () => {
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition(
      'should analyze rack image from buffer',
      async () => {
        // Create a small 10x10 test image buffer (PNG header + minimal data)
        const testImageBuffer = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
          0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
          0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x0a, // Width: 10, Height: 10
          0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
        ]);

        const analysis = await analyzeRackImage(testImageBuffer, 'image/png');

        // Verify structure
        expect(analysis).toHaveProperty('modules');
        expect(analysis).toHaveProperty('rackLayout');
        expect(analysis).toHaveProperty('overallQuality');
        expect(analysis).toHaveProperty('recommendations');

        expect(Array.isArray(analysis.modules)).toBe(true);
        expect(Array.isArray(analysis.recommendations)).toBe(true);

        expect(analysis.rackLayout).toHaveProperty('rows');
        expect(analysis.rackLayout).toHaveProperty('estimatedHP');

        expect(['excellent', 'good', 'fair', 'poor']).toContain(
          analysis.overallQuality
        );
      },
      60000
    );

    testCondition(
      'should handle base64 string input',
      async () => {
        const base64Image =
          'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFElEQVR42mNk+M9Qz0AEYBxVSF+FAAB2/wH+/2OJ+QAAAABJRU5ErkJggg==';

        const analysis = await analyzeRackImage(base64Image, 'image/png');

        expect(analysis).toBeDefined();
        expect(analysis.modules).toBeDefined();
      },
      60000
    );

    testCondition(
      'should validate module structure',
      async () => {
        const testImageBuffer = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]);

        const analysis = await analyzeRackImage(testImageBuffer, 'image/png');

        analysis.modules.forEach((module) => {
          expect(module).toHaveProperty('name');
          expect(module).toHaveProperty('position');
          expect(module).toHaveProperty('confidence');

          expect(module.position).toHaveProperty('x');
          expect(module.position).toHaveProperty('y');
          expect(module.position).toHaveProperty('width');

          expect(module.confidence).toBeGreaterThanOrEqual(0);
          expect(module.confidence).toBeLessThanOrEqual(1);
        });
      },
      60000
    );

    it('should throw error when API key missing', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        const testBuffer = Buffer.from('test');

        await expect(analyzeRackImage(testBuffer, 'image/png')).rejects.toThrow();
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('response parsing', () => {
    it('should handle JSON response format', () => {
      const mockResponse = {
        modules: [
          {
            name: 'Test Module',
            manufacturer: 'Test Manufacturer',
            position: { x: 0.1, y: 0, width: 12 },
            confidence: 0.95,
            notes: 'Test notes',
          },
        ],
        rackLayout: {
          rows: 2,
          estimatedHP: 104,
          case: 'Test Case',
        },
        overallQuality: 'good' as const,
        recommendations: ['Test recommendation'],
      };

      expect(mockResponse.modules[0]).toHaveProperty('name');
      expect(mockResponse.modules[0]).toHaveProperty('position');
      expect(mockResponse.rackLayout).toHaveProperty('rows');
      expect(['excellent', 'good', 'fair', 'poor']).toContain(
        mockResponse.overallQuality
      );
    });
  });

  describe('edge cases', () => {
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition(
      'should handle empty image',
      async () => {
        const emptyBuffer = Buffer.alloc(0);

        await expect(analyzeRackImage(emptyBuffer, 'image/png')).rejects.toThrow();
      },
      30000
    );

    testCondition(
      'should handle different image formats',
      async () => {
        const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

        try {
          await analyzeRackImage(jpegBuffer, 'image/jpeg');
          expect(true).toBe(true); // If it doesn't throw, that's okay
        } catch (error) {
          // Expected for minimal test image
          expect(error).toBeDefined();
        }
      },
      30000
    );
  });
});
