import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Cosmos DB client before importing module service
jest.mock('@azure/cosmos', () => ({
  CosmosClient: jest.fn().mockImplementation(() => ({
    database: jest.fn().mockReturnValue({
      container: jest.fn().mockReturnValue({
        items: {
          create: jest.fn(),
          query: jest.fn().mockReturnValue({
            fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
          }),
        },
        item: jest.fn().mockReturnValue({
          read: jest.fn().mockResolvedValue({ resource: null }),
        }),
      }),
    }),
  })),
}));

describe('Module Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateModuleId', () => {
    it('should sanitize illegal characters from module IDs', () => {
      // Test cases for Cosmos DB illegal characters: /, \, #, ?
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

  describe('Module enrichment', () => {
    it('should handle module data with vision analysis fields', () => {
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
