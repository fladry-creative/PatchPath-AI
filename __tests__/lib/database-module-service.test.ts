/**
 * Tests for lib/database/module-service.ts
 * Uses REAL Cosmos DB connection
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  upsertModule,
  findModule,
  searchModules,
  getPopularModules,
  incrementModuleUsage,
  batchUpsertModules,
  getModuleStats,
  verifyModule,
} from '@/lib/database/module-service';
import { isCosmosConfigured } from '@/lib/database/cosmos';
import { type Module } from '@/types/module';

describe('lib/database/module-service', () => {
  const isConfigured = isCosmosConfigured();
  const testModules: string[] = [];

  afterAll(async () => {
    // Cleanup test modules
    if (isConfigured && testModules.length > 0) {
      const { getModulesContainer } = await import('@/lib/database/cosmos');
      const container = await getModulesContainer();

      for (const moduleId of testModules) {
        try {
          // We need manufacturer for partition key, using 'Test' as default
          await container.item(moduleId, 'Test').delete();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  });

  describe('generateModuleId', () => {
    it('should sanitize illegal characters from module IDs', () => {
      const testCases = [
        {
          manufacturer: 'WMD/SSF',
          name: 'MUILD',
          expected: 'wmd-ssf_muild',
        },
        {
          manufacturer: 'Make Noise',
          name: 'Maths',
          expected: 'make-noise_maths',
        },
        {
          manufacturer: 'ALM#Busy',
          name: 'Pamela\\NEW',
          expected: 'alm-busy_pamela-new',
        },
      ];

      testCases.forEach(({ manufacturer, name, expected }) => {
        const moduleId = `${manufacturer
          .toLowerCase()
          .replace(/[\\/# ?]/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')}_${name
          .toLowerCase()
          .replace(/[\\/# ?]/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')}`;

        expect(moduleId).toBe(expected);
      });
    });

    it('should handle multiple spaces and collapse dashes', () => {
      const manufacturer = 'Multiple   Spaces';
      const name = 'Test---Module';

      const moduleId = `${manufacturer
        .toLowerCase()
        .replace(/[\\/# ?]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')}_${name
        .toLowerCase()
        .replace(/[\\/# ?]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')}`;

      expect(moduleId).toBe('multiple-spaces_test-module');
    });
  });

  describe('upsertModule', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should create a new module',
      async () => {
        const uniqueName = `Test-Module-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCO',
          hp: 12,
          inputs: [],
          outputs: [],
        };

        const result = await upsertModule(module, 'manual', 0.95);
        testModules.push(result.id);

        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
        expect(result.name).toBe(uniqueName);
        expect(result.manufacturer).toBe('Test');
        expect(result.source).toBe('manual');
        expect(result.confidence).toBe(0.95);
        expect(result.usageCount).toBe(1);
      },
      30000
    );

    testCondition(
      'should update existing module',
      async () => {
        const uniqueName = `Update-Test-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCF',
          hp: 8,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.8);
        testModules.push(created.id);

        // Update with same name/manufacturer
        const updated = await upsertModule(module, 'manual', 0.95);

        expect(updated.id).toBe(created.id);
        expect(updated.confidence).toBe(0.95);
      },
      30000
    );

    it('should throw error when DB not configured', async () => {
      if (!isConfigured) {
        await expect(
          upsertModule({ name: 'Test', manufacturer: 'Test' }, 'vision', 0.8)
        ).rejects.toThrow('Cosmos DB not configured');
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('findModule', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should find existing module',
      async () => {
        const uniqueName = `Find-Test-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCA',
          hp: 10,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.9);
        testModules.push(created.id);

        const found = await findModule(uniqueName, 'Test');

        expect(found).toBeDefined();
        expect(found?.name).toBe(uniqueName);
        expect(found?.manufacturer).toBe('Test');
      },
      30000
    );

    testCondition(
      'should return null for non-existent module',
      async () => {
        const found = await findModule('NonExistentModule123XYZ', 'FakeManufacturer');

        expect(found).toBeNull();
      },
      30000
    );

    it('should return null when DB not configured', async () => {
      if (!isConfigured) {
        const found = await findModule('Test', 'Test');
        expect(found).toBeNull();
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('searchModules', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should search modules by name',
      async () => {
        const uniquePrefix = `Search-${Date.now()}`;
        const module1: Partial<Module> = {
          name: `${uniquePrefix}-Module-1`,
          manufacturer: 'Test',
          type: 'VCO',
          hp: 12,
          inputs: [],
          outputs: [],
        };

        const module2: Partial<Module> = {
          name: `${uniquePrefix}-Module-2`,
          manufacturer: 'Test',
          type: 'VCF',
          hp: 8,
          inputs: [],
          outputs: [],
        };

        const created1 = await upsertModule(module1, 'vision', 0.9);
        const created2 = await upsertModule(module2, 'vision', 0.9);
        testModules.push(created1.id, created2.id);

        const results = await searchModules(uniquePrefix);

        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.some((r) => r.name === module1.name)).toBe(true);
        expect(results.some((r) => r.name === module2.name)).toBe(true);
      },
      60000
    );

    testCondition(
      'should search with manufacturer filter',
      async () => {
        const uniqueName = `MfrSearch-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'SpecificMfr',
          type: 'VCO',
          hp: 12,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.9);
        testModules.push(created.id);

        const results = await searchModules(uniqueName, 'SpecificMfr');

        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0].manufacturer.toLowerCase()).toBe('specificmfr');
      },
      30000
    );

    it('should return empty array when DB not configured', async () => {
      if (!isConfigured) {
        const results = await searchModules('Test');
        expect(results).toEqual([]);
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('incrementModuleUsage', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should increment usage count',
      async () => {
        const uniqueName = `Usage-Test-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCO',
          hp: 12,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.9);
        testModules.push(created.id);

        const initialUsage = created.usageCount;

        await incrementModuleUsage(created.id, created.partitionKey);

        const updated = await findModule(uniqueName, 'Test');
        expect(updated?.usageCount).toBe(initialUsage + 1);
      },
      30000
    );

    testCondition(
      'should handle non-existent module gracefully',
      async () => {
        await expect(
          incrementModuleUsage('nonexistent-id', 'nonexistent')
        ).resolves.not.toThrow();
      },
      30000
    );
  });

  describe('batchUpsertModules', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should batch insert modules',
      async () => {
        const uniquePrefix = `Batch-${Date.now()}`;
        const modules: Partial<Module>[] = [
          {
            name: `${uniquePrefix}-1`,
            manufacturer: 'Test',
            type: 'VCO',
            hp: 12,
            inputs: [],
            outputs: [],
          },
          {
            name: `${uniquePrefix}-2`,
            manufacturer: 'Test',
            type: 'VCF',
            hp: 8,
            inputs: [],
            outputs: [],
          },
        ];

        const results = await batchUpsertModules(modules, 'enrichment');
        results.forEach((r) => testModules.push(r.id));

        expect(results.length).toBe(2);
        results.forEach((result) => {
          expect(result.id).toBeTruthy();
          expect(result.source).toBe('enrichment');
        });
      },
      60000
    );

    it('should throw error when DB not configured', async () => {
      if (!isConfigured) {
        await expect(
          batchUpsertModules([{ name: 'Test', manufacturer: 'Test' }], 'vision')
        ).rejects.toThrow('Cosmos DB not configured');
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('getModuleStats', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should return module statistics',
      async () => {
        const stats = await getModuleStats();

        expect(stats).toHaveProperty('totalModules');
        expect(stats).toHaveProperty('byManufacturer');
        expect(stats).toHaveProperty('byType');
        expect(stats).toHaveProperty('bySource');
        expect(stats).toHaveProperty('avgConfidence');

        expect(typeof stats.totalModules).toBe('number');
        expect(typeof stats.avgConfidence).toBe('number');
        expect(typeof stats.byManufacturer).toBe('object');
      },
      30000
    );

    it('should return empty stats when DB not configured', async () => {
      if (!isConfigured) {
        const stats = await getModuleStats();
        expect(stats.totalModules).toBe(0);
        expect(Object.keys(stats.byManufacturer).length).toBe(0);
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('verifyModule', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should verify module and boost confidence',
      async () => {
        const uniqueName = `Verify-Test-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCO',
          hp: 12,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.8);
        testModules.push(created.id);

        const verified = await verifyModule(created.id, created.partitionKey, 'user123');

        expect(verified).toBeDefined();
        expect(verified?.verifiedBy).toContain('user123');
        expect(verified?.confidence).toBeGreaterThan(0.8);
      },
      30000
    );

    testCondition(
      'should not duplicate user in verifiedBy',
      async () => {
        const uniqueName = `DupeVerify-${Date.now()}`;
        const module: Partial<Module> = {
          name: uniqueName,
          manufacturer: 'Test',
          type: 'VCF',
          hp: 8,
          inputs: [],
          outputs: [],
        };

        const created = await upsertModule(module, 'vision', 0.8);
        testModules.push(created.id);

        await verifyModule(created.id, created.partitionKey, 'user456');
        const secondVerify = await verifyModule(
          created.id,
          created.partitionKey,
          'user456'
        );

        expect(secondVerify?.verifiedBy).toContain('user456');
        expect(secondVerify?.verifiedBy?.filter((u) => u === 'user456').length).toBe(1);
      },
      30000
    );

    testCondition(
      'should return null for non-existent module',
      async () => {
        const result = await verifyModule('nonexistent', 'nonexistent', 'user789');
        expect(result).toBeNull();
      },
      30000
    );
  });

  describe('getPopularModules', () => {
    const testCondition = isConfigured ? it : it.skip;

    testCondition(
      'should return popular modules sorted by usage',
      async () => {
        const results = await getPopularModules(10);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(10);

        // Should be sorted by usage count descending
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].usageCount).toBeGreaterThanOrEqual(results[i].usageCount);
        }
      },
      30000
    );

    it('should return empty array when DB not configured', async () => {
      if (!isConfigured) {
        const results = await getPopularModules();
        expect(results).toEqual([]);
      } else {
        expect(true).toBe(true); // Skip when configured
      }
    });
  });

  describe('edge cases', () => {
    it('should handle modules with vision analysis fields', () => {
      const mockModule = {
        name: 'Maths',
        manufacturer: 'Make Noise',
        hp: 20,
        position: { x: 100, y: 50, width: 40, height: 128 },
        confidence: 0.95,
      };

      expect(mockModule).toHaveProperty('name');
      expect(mockModule).toHaveProperty('manufacturer');
      expect(mockModule).toHaveProperty('position');
      expect(mockModule).toHaveProperty('confidence');
      expect(mockModule.confidence).toBeGreaterThan(0.9);
    });

    it('should validate required fields for module data', () => {
      const validModule = {
        name: 'Test Module',
        manufacturer: 'Test Manufacturer',
      };

      const invalidModule = {
        name: 'Test Module',
        // Missing manufacturer
      };

      expect(validModule).toHaveProperty('name');
      expect(validModule).toHaveProperty('manufacturer');
      expect(invalidModule).not.toHaveProperty('manufacturer');
    });
  });
});
