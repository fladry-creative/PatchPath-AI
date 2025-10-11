/**
 * Tests for lib/ai/claude.ts
 * Uses REAL Anthropic API with minimal token usage
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  generatePatch,
  generatePatchVariations,
  isClaudeConfigured,
  getModelInfo,
} from '@/lib/ai/claude';
import { type ParsedRack, type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { MOCK_RACK } from '@/lib/scraper/mock-data';

describe('lib/ai/claude', () => {
  let mockRack: ParsedRack;
  let mockCapabilities: RackCapabilities;
  let mockAnalysis: RackAnalysis;

  beforeAll(() => {
    // Use minimal mock rack for testing
    mockRack = {
      ...MOCK_RACK,
      modules: MOCK_RACK.modules.slice(0, 3), // Only use first 3 modules to minimize tokens
    };

    mockCapabilities = {
      hasVCO: true,
      hasVCF: true,
      hasVCA: true,
      hasLFO: false,
      hasEnvelope: false,
      hasSequencer: false,
      hasEffects: false,
      moduleTypes: ['VCO', 'VCF', 'VCA'],
      totalHP: 30,
      totalPowerDraw: {
        positive12V: 190,
        negative12V: 15,
      },
    };

    mockAnalysis = {
      missingFundamentals: [],
      suggestions: [],
      techniquesPossible: ['Subtractive synthesis', 'Classic voice architecture'],
      warnings: [],
    };
  });

  describe('isClaudeConfigured', () => {
    it('should check if Anthropic API key is configured', () => {
      const isConfigured = isClaudeConfigured();
      expect(typeof isConfigured).toBe('boolean');

      if (process.env.ANTHROPIC_API_KEY) {
        expect(isConfigured).toBe(true);
      }
    });
  });

  describe('getModelInfo', () => {
    it('should return correct model information', () => {
      const info = getModelInfo();

      expect(info).toHaveProperty('model');
      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('costPer1MTokens');

      expect(info.model).toBe('claude-sonnet-4-5');
      expect(info.provider).toBe('Anthropic');
      expect(info.costPer1MTokens.input).toBe(3.0);
      expect(info.costPer1MTokens.output).toBe(15.0);
    });
  });

  describe('generatePatch', () => {
    // Skip if no API key configured
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition('should generate a patch with real Claude API', async () => {
      const patch = await generatePatch(
        mockRack,
        mockCapabilities,
        mockAnalysis,
        'Create a simple subtractive patch'
      );

      // Verify patch structure
      expect(patch).toHaveProperty('id');
      expect(patch).toHaveProperty('userId');
      expect(patch).toHaveProperty('rackId');
      expect(patch).toHaveProperty('metadata');
      expect(patch).toHaveProperty('connections');
      expect(patch).toHaveProperty('patchingOrder');
      expect(patch).toHaveProperty('parameterSuggestions');
      expect(patch).toHaveProperty('whyThisWorks');
      expect(patch).toHaveProperty('tips');

      // Verify metadata
      expect(patch.metadata.title).toBeTruthy();
      expect(patch.metadata.description).toBeTruthy();
      expect(patch.metadata.difficulty).toMatch(/beginner|intermediate|advanced/);
      expect(patch.metadata.estimatedTime).toBeGreaterThan(0);
      expect(Array.isArray(patch.metadata.techniques)).toBe(true);
      expect(Array.isArray(patch.metadata.genres)).toBe(true);

      // Verify connections
      expect(Array.isArray(patch.connections)).toBe(true);
      expect(patch.connections.length).toBeGreaterThan(0);

      patch.connections.forEach(conn => {
        expect(conn).toHaveProperty('from');
        expect(conn).toHaveProperty('to');
        expect(conn).toHaveProperty('signalType');
        expect(conn).toHaveProperty('importance');
        expect(conn.signalType).toMatch(/audio|cv|gate|clock/);
        expect(conn.importance).toMatch(/primary|modulation|utility/);
      });

      // Verify patching order
      expect(Array.isArray(patch.patchingOrder)).toBe(true);
      expect(patch.patchingOrder.length).toBeGreaterThan(0);

      // Verify tips
      expect(Array.isArray(patch.tips)).toBe(true);
    }, 30000); // 30 second timeout for API call

    testCondition('should handle different difficulty options', async () => {
      const patch = await generatePatch(
        mockRack,
        mockCapabilities,
        mockAnalysis,
        'Basic patch',
        { difficulty: 'beginner' }
      );

      expect(patch.metadata.difficulty).toBe('beginner');
    }, 30000);

    testCondition('should throw error for invalid rack', async () => {
      const invalidRack = {
        ...mockRack,
        modules: [],
      };

      await expect(
        generatePatch(
          invalidRack,
          mockCapabilities,
          mockAnalysis,
          'Test intent'
        )
      ).rejects.toThrow();
    }, 30000);
  });

  describe('generatePatchVariations', () => {
    const testCondition = process.env.ANTHROPIC_API_KEY ? it : it.skip;

    testCondition('should generate patch variations', async () => {
      // First generate a base patch
      const basePatch = await generatePatch(
        mockRack,
        mockCapabilities,
        mockAnalysis,
        'Create a simple patch'
      );

      // Then generate variations
      const variations = await generatePatchVariations(
        basePatch,
        mockRack,
        mockCapabilities,
        2 // Only 2 variations to minimize token usage
      );

      expect(Array.isArray(variations)).toBe(true);
      expect(variations.length).toBe(2);

      variations.forEach(variation => {
        expect(variation).toHaveProperty('id');
        expect(variation).toHaveProperty('parentPatchId');
        expect(variation.parentPatchId).toBe(basePatch.id);
        expect(variation).toHaveProperty('metadata');
        expect(variation).toHaveProperty('connections');
        expect(Array.isArray(variation.connections)).toBe(true);
      });
    }, 60000); // 60 second timeout for multiple API calls

    testCondition('should handle error when variations fail', async () => {
      const invalidPatch = {
        id: 'test-patch',
        userId: 'test-user',
        rackId: 'test-rack',
        metadata: {
          title: 'Test',
          description: 'Test',
          soundDescription: 'Test',
          difficulty: 'beginner' as const,
          estimatedTime: 10,
          techniques: [],
          genres: [],
          userIntent: 'Test',
        },
        connections: [],
        patchingOrder: [],
        parameterSuggestions: [],
        whyThisWorks: 'Test',
        tips: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        saved: false,
        tags: [],
      };

      const emptyRack = {
        ...mockRack,
        modules: [],
      };

      await expect(
        generatePatchVariations(invalidPatch, emptyRack, mockCapabilities, 1)
      ).rejects.toThrow();
    }, 30000);
  });

  describe('error handling', () => {
    it('should handle missing API key gracefully', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      expect(isClaudeConfigured()).toBe(false);

      // Restore API key
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });
});
