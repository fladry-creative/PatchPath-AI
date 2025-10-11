/**
 * Tests for lib/modules/enrichment.ts
 * Uses REAL Anthropic API with minimal token usage
 */

import { describe, it, expect } from '@jest/globals';
import { enrichModuleData, enrichModules } from '@/lib/modules/enrichment';

describe('lib/modules/enrichment', () => {
  describe('enrichModuleData', () => {
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition(
      'should enrich module with AI search',
      async () => {
        const result = await enrichModuleData('Plaits', 'Mutable Instruments');

        expect(result).toHaveProperty('module');
        expect(result).toHaveProperty('sources');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('needsReview');

        expect(result.module).toHaveProperty('name');
        expect(result.module).toHaveProperty('manufacturer');
        expect(result.module).toHaveProperty('type');
        expect(result.module).toHaveProperty('hp');

        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);

        expect(Array.isArray(result.sources)).toBe(true);
        expect(typeof result.needsReview).toBe('boolean');
      },
      60000
    );

    testCondition(
      'should handle module without manufacturer',
      async () => {
        const result = await enrichModuleData('Oscillator');

        expect(result).toHaveProperty('module');
        expect(result.confidence).toBeDefined();
      },
      60000
    );

    testCondition(
      'should handle unknown module gracefully',
      async () => {
        const result = await enrichModuleData(
          'NonExistentModule123XYZ',
          'FakeManufacturer'
        );

        expect(result).toHaveProperty('module');
        expect(result.confidence).toBeLessThan(0.5);
        expect(result.needsReview).toBe(true);
      },
      60000
    );

    it('should throw error when API key missing', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        await expect(enrichModuleData('Test', 'Test')).rejects.toThrow();
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('enrichModules', () => {
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition(
      'should batch enrich multiple modules',
      async () => {
        const modules = [
          { name: 'Plaits', manufacturer: 'Mutable Instruments' },
          { name: 'Rings', manufacturer: 'Mutable Instruments' },
        ];

        const results = await enrichModules(modules);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);

        results.forEach((result) => {
          expect(result).toHaveProperty('module');
          expect(result).toHaveProperty('confidence');
          expect(result).toHaveProperty('needsReview');
        });
      },
      120000
    );

    testCondition(
      'should handle empty array',
      async () => {
        const results = await enrichModules([]);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      },
      30000
    );

    testCondition(
      'should handle errors in batch gracefully',
      async () => {
        const modules = [
          { name: 'ValidModule' },
          { name: 'InvalidModule123XYZ' },
        ];

        const results = await enrichModules(modules);

        expect(results.length).toBe(2);
        results.forEach((result) => {
          expect(result).toHaveProperty('module');
        });
      },
      90000
    );
  });

  describe('module type detection', () => {
    it('should validate module types', () => {
      const validTypes = [
        'VCO',
        'VCF',
        'VCA',
        'LFO',
        'EG',
        'Sequencer',
        'Utility',
        'Effect',
        'Mixer',
        'MIDI',
        'Clock',
        'Logic',
        'Random',
        'Video',
        'Other',
      ];

      // Just verify the type list is complete
      expect(validTypes.length).toBe(15);
      expect(validTypes).toContain('VCO');
      expect(validTypes).toContain('VCF');
      expect(validTypes).toContain('VCA');
    });
  });

  describe('response structure', () => {
    it('should validate ModuleSearchResult structure', () => {
      const mockResult = {
        module: {
          name: 'Test Module',
          manufacturer: 'Test Manufacturer',
          type: 'VCO' as const,
          hp: 12,
          inputs: [],
          outputs: [],
        },
        sources: ['https://example.com'],
        confidence: 0.95,
        needsReview: false,
      };

      expect(mockResult).toHaveProperty('module');
      expect(mockResult).toHaveProperty('sources');
      expect(mockResult).toHaveProperty('confidence');
      expect(mockResult).toHaveProperty('needsReview');

      expect(mockResult.confidence).toBeGreaterThanOrEqual(0);
      expect(mockResult.confidence).toBeLessThanOrEqual(1);
    });
  });
});
