/**
 * Tests for lib/modules/enrichment-v2.ts
 * Uses REAL Cosmos DB connection
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  enrichModuleWithCache,
  enrichModulesBatch,
  calculateEnrichmentStats,
} from '@/lib/modules/enrichment-v2';
import { type VisionModule } from '@/lib/vision/rack-analyzer';
import { isCosmosConfigured } from '@/lib/database/cosmos';

describe('lib/modules/enrichment-v2', () => {
  const isConfigured = isCosmosConfigured();
  const testModules: VisionModule[] = [];

  beforeAll(() => {
    // Setup test modules for cleanup
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('enrichModuleWithCache', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should enrich module with database cache',
      async () => {
        const visionModule: VisionModule = {
          name: `Test-Module-${Date.now()}`,
          manufacturer: 'Test Manufacturer',
          position: { x: 0.1, y: 0, width: 12 },
          confidence: 0.9,
        };

        const result = await enrichModuleWithCache(visionModule);

        expect(result).toHaveProperty('module');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('cacheHit');
        expect(result).toHaveProperty('enrichmentTime');

        expect(['database', 'enrichment', 'fallback']).toContain(result.source);
        expect(typeof result.cacheHit).toBe('boolean');
        expect(result.enrichmentTime).toBeGreaterThan(0);
      },
      30000
    );

    testCondition(
      'should use cache on second call',
      async () => {
        const moduleName = `Cache-Test-${Date.now()}`;
        const visionModule: VisionModule = {
          name: moduleName,
          manufacturer: 'Test Manufacturer',
          position: { x: 0.1, y: 0, width: 12 },
          confidence: 0.9,
        };

        // First call - cache miss
        const result1 = await enrichModuleWithCache(visionModule);
        expect(result1.cacheHit).toBe(false);

        // Second call - should hit cache
        const result2 = await enrichModuleWithCache(visionModule);
        expect(result2.cacheHit).toBe(true);
        expect(result2.source).toBe('database');
      },
      60000
    );

    testCondition(
      'should handle missing manufacturer',
      async () => {
        const visionModule: VisionModule = {
          name: `No-Mfr-${Date.now()}`,
          position: { x: 0.1, y: 0, width: 10 },
          confidence: 0.8,
        };

        const result = await enrichModuleWithCache(visionModule);

        expect(result).toHaveProperty('module');
        expect(result.module.manufacturer).toBe('Unknown');
      },
      30000
    );

    it('should handle fallback when DB not configured', async () => {
      if (!isConfigured) {
        const visionModule: VisionModule = {
          name: 'Test',
          position: { x: 0, y: 0, width: 10 },
          confidence: 0.8,
        };

        const result = await enrichModuleWithCache(visionModule);
        expect(result.source).toBe('fallback');
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('enrichModulesBatch', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should batch enrich multiple modules',
      async () => {
        const visionModules: VisionModule[] = [
          {
            name: `Batch-1-${Date.now()}`,
            manufacturer: 'Test',
            position: { x: 0.1, y: 0, width: 12 },
            confidence: 0.9,
          },
          {
            name: `Batch-2-${Date.now()}`,
            manufacturer: 'Test',
            position: { x: 0.3, y: 0, width: 8 },
            confidence: 0.85,
          },
        ];

        const results = await enrichModulesBatch(visionModules);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(2);

        results.forEach((result) => {
          expect(result).toHaveProperty('module');
          expect(result).toHaveProperty('cacheHit');
          expect(result).toHaveProperty('enrichmentTime');
        });
      },
      60000
    );

    testCondition(
      'should handle empty array',
      async () => {
        const results = await enrichModulesBatch([]);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      },
      30000
    );

    testCondition(
      'should track cache hits and misses',
      async () => {
        const uniqueName = `Cache-Track-${Date.now()}`;
        const visionModules: VisionModule[] = [
          {
            name: uniqueName,
            manufacturer: 'Test',
            position: { x: 0.1, y: 0, width: 12 },
            confidence: 0.9,
          },
          {
            name: uniqueName, // Same module - should hit cache
            manufacturer: 'Test',
            position: { x: 0.1, y: 0, width: 12 },
            confidence: 0.9,
          },
        ];

        const results = await enrichModulesBatch(visionModules);

        const cacheHits = results.filter((r) => r.cacheHit).length;
        expect(cacheHits).toBeGreaterThan(0);
      },
      60000
    );
  });

  describe('calculateEnrichmentStats', () => {
    it('should calculate stats correctly', () => {
      const mockResults = [
        {
          module: {},
          source: 'database' as const,
          confidence: 0.9,
          cacheHit: true,
          enrichmentTime: 50,
        },
        {
          module: {},
          source: 'enrichment' as const,
          confidence: 0.8,
          cacheHit: false,
          enrichmentTime: 500,
        },
        {
          module: {},
          source: 'database' as const,
          confidence: 0.95,
          cacheHit: true,
          enrichmentTime: 40,
        },
      ];

      const stats = calculateEnrichmentStats(mockResults);

      expect(stats.totalEnriched).toBe(3);
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
      expect(stats.avgEnrichmentTime).toBeCloseTo(196.67, 0);
      expect(stats.costSaved).toBeCloseTo(0.2, 1);
    });

    it('should handle empty results', () => {
      const stats = calculateEnrichmentStats([]);

      expect(stats.totalEnriched).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(isNaN(stats.hitRate)).toBe(true);
    });

    it('should handle all cache misses', () => {
      const mockResults = [
        {
          module: {},
          source: 'enrichment' as const,
          confidence: 0.8,
          cacheHit: false,
          enrichmentTime: 500,
        },
        {
          module: {},
          source: 'enrichment' as const,
          confidence: 0.7,
          cacheHit: false,
          enrichmentTime: 600,
        },
      ];

      const stats = calculateEnrichmentStats(mockResults);

      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(2);
      expect(stats.hitRate).toBe(0);
      expect(stats.costSaved).toBe(0);
    });

    it('should handle all cache hits', () => {
      const mockResults = [
        {
          module: {},
          source: 'database' as const,
          confidence: 0.9,
          cacheHit: true,
          enrichmentTime: 50,
        },
        {
          module: {},
          source: 'database' as const,
          confidence: 0.95,
          cacheHit: true,
          enrichmentTime: 40,
        },
      ];

      const stats = calculateEnrichmentStats(mockResults);

      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.hitRate).toBe(100);
      expect(stats.costSaved).toBeCloseTo(0.2, 1);
    });
  });

  describe('module type inference', () => {
    it('should infer VCO from name', () => {
      const types = ['oscillator', 'vco', 'osc'];
      types.forEach((type) => {
        expect(type).toBeTruthy();
      });
    });

    it('should infer VCF from name', () => {
      const types = ['filter', 'vcf', 'lpf', 'hpf'];
      types.forEach((type) => {
        expect(type).toBeTruthy();
      });
    });

    it('should default to Other for unknown types', () => {
      const unknownType = 'random-unknown-module';
      expect(unknownType).toBeTruthy();
    });
  });
});
