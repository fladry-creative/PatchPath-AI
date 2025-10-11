/**
 * Tests for lib/scraper/analyzer.ts
 * Tests rack analysis capabilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  analyzeRackCapabilities,
  analyzeRack,
  generateRackSummary,
} from '@/lib/scraper/analyzer';
import { type Module } from '@/types/module';
import { type ParsedRack } from '@/types/rack';
import { MOCK_RACK } from '@/lib/scraper/mock-data';

describe('lib/scraper/analyzer', () => {
  const createMockModule = (
    type: Module['type'],
    hp: number = 10
  ): Module => ({
    id: `test-${type}-${Math.random()}`,
    name: `Test ${type}`,
    manufacturer: 'Test Manufacturer',
    type,
    hp,
    power: {
      positive12V: 50,
      negative12V: 5,
    },
    inputs: [],
    outputs: [],
  });

  describe('analyzeRackCapabilities', () => {
    it('should detect VCO presence', () => {
      const modules = [createMockModule('VCO')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVCO).toBe(true);
      expect(capabilities.hasVCF).toBe(false);
      expect(capabilities.hasVCA).toBe(false);
    });

    it('should detect VCF presence', () => {
      const modules = [createMockModule('VCF')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVCF).toBe(true);
      expect(capabilities.hasVCO).toBe(false);
    });

    it('should detect VCA presence', () => {
      const modules = [createMockModule('VCA')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVCA).toBe(true);
    });

    it('should detect LFO presence', () => {
      const modules = [createMockModule('LFO')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasLFO).toBe(true);
    });

    it('should detect Envelope presence', () => {
      const modules = [createMockModule('EG')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasEnvelope).toBe(true);
    });

    it('should detect Sequencer presence', () => {
      const modules = [createMockModule('Sequencer')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasSequencer).toBe(true);
    });

    it('should detect Effects presence', () => {
      const modules = [createMockModule('Effect')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasEffects).toBe(true);
    });

    it('should calculate total HP correctly', () => {
      const modules = [
        createMockModule('VCO', 12),
        createMockModule('VCF', 8),
        createMockModule('VCA', 10),
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.totalHP).toBe(30);
    });

    it('should calculate total power draw', () => {
      const modules = [
        {
          ...createMockModule('VCO'),
          power: { positive12V: 60, negative12V: 5, positive5V: 0 },
        },
        {
          ...createMockModule('VCF'),
          power: { positive12V: 40, negative12V: 10, positive5V: 5 },
        },
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.totalPowerDraw.positive12V).toBe(100);
      expect(capabilities.totalPowerDraw.negative12V).toBe(15);
      expect(capabilities.totalPowerDraw.positive5V).toBe(5);
    });

    it('should list all module types', () => {
      const modules = [
        createMockModule('VCO'),
        createMockModule('VCF'),
        createMockModule('VCA'),
        createMockModule('LFO'),
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.moduleTypes).toContain('VCO');
      expect(capabilities.moduleTypes).toContain('VCF');
      expect(capabilities.moduleTypes).toContain('VCA');
      expect(capabilities.moduleTypes).toContain('LFO');
      expect(capabilities.moduleTypes.length).toBe(4);
    });

    it('should handle empty module array', () => {
      const capabilities = analyzeRackCapabilities([]);

      expect(capabilities.hasVCO).toBe(false);
      expect(capabilities.hasVCF).toBe(false);
      expect(capabilities.totalHP).toBe(0);
      expect(capabilities.totalPowerDraw.positive12V).toBe(0);
      expect(capabilities.moduleTypes.length).toBe(0);
    });

    it('should handle modules without power data', () => {
      const modules = [
        {
          ...createMockModule('VCO'),
          power: {},
        },
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.totalPowerDraw.positive12V).toBe(0);
      expect(capabilities.totalPowerDraw.negative12V).toBe(0);
    });
  });

  describe('analyzeRack', () => {
    const createMockRack = (modules: Module[]): ParsedRack => ({
      url: 'https://modulargrid.net/e/racks/view/test',
      modules,
      rows: [],
      metadata: {
        rackId: 'test',
        rackName: 'Test Rack',
      },
    });

    it('should identify missing fundamentals', () => {
      const rack = createMockRack([createMockModule('LFO')]);
      const analysis = analyzeRack(rack);

      expect(analysis.missingFundamentals).toContain('VCO');
      expect(analysis.missingFundamentals).toContain('VCF');
      expect(analysis.missingFundamentals).toContain('VCA');
      expect(analysis.missingFundamentals).toContain('EG');
    });

    it('should suggest adding missing modules', () => {
      const rack = createMockRack([createMockModule('VCO')]);
      const analysis = analyzeRack(rack);

      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(
        analysis.suggestions.some(s => s.includes('VCF') || s.includes('filter'))
      ).toBe(true);
    });

    it('should identify possible techniques with basic voice', () => {
      const rack = createMockRack([
        createMockModule('VCO'),
        createMockModule('VCF'),
        createMockModule('VCA'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible).toContain('Classic voice architecture');
      expect(analysis.techniquesPossible).toContain('Subtractive synthesis');
    });

    it('should identify FM synthesis with multiple VCOs', () => {
      const rack = createMockRack([
        createMockModule('VCO'),
        createMockModule('VCO'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible).toContain('FM synthesis');
      expect(analysis.techniquesPossible).toContain('Cross-modulation');
    });

    it('should identify modulation techniques with LFO', () => {
      const rack = createMockRack([
        createMockModule('VCO'),
        createMockModule('LFO'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible).toContain('Modulation effects');
      expect(analysis.techniquesPossible).toContain('Tremolo & vibrato');
    });

    it('should identify sequencer capabilities', () => {
      const rack = createMockRack([createMockModule('Sequencer')]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible).toContain('Generative sequences');
      expect(analysis.techniquesPossible).toContain('Melodic patterns');
    });

    it('should identify generative patching with random', () => {
      const rack = createMockRack([createMockModule('Random')]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible).toContain('Generative patching');
      expect(analysis.techniquesPossible).toContain('Chaotic systems');
    });

    it('should warn about high power draw', () => {
      const modules = Array(10)
        .fill(null)
        .map(() => ({
          ...createMockModule('VCO'),
          power: { positive12V: 250, negative12V: 50 },
        }));

      const rack = createMockRack(modules);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(
        analysis.warnings.some(w => w.includes('power') || w.includes('mA'))
      ).toBe(true);
    });

    it('should warn about exceeding standard case size', () => {
      const modules = Array(20)
        .fill(null)
        .map(() => createMockModule('VCO', 20));

      const rack = createMockRack(modules);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.warnings.some(w => w.includes('HP'))).toBe(true);
    });

    it('should warn about missing VCA', () => {
      const rack = createMockRack([
        createMockModule('VCO'),
        createMockModule('VCF'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.some(w => w.includes('VCA'))).toBe(true);
    });

    it('should handle complete rack with no warnings', () => {
      const rack = createMockRack([
        createMockModule('VCO', 12),
        createMockModule('VCF', 8),
        createMockModule('VCA', 10),
        createMockModule('EG', 8),
        createMockModule('LFO', 10),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.missingFundamentals.length).toBe(0);
      expect(analysis.techniquesPossible.length).toBeGreaterThan(0);
    });
  });

  describe('generateRackSummary', () => {
    it('should generate summary for complete rack', () => {
      const rack = MOCK_RACK;
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('modules');
    });

    it('should include module breakdown', () => {
      const rack = MOCK_RACK;
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('Module Breakdown');
    });

    it('should include possible techniques', () => {
      const modules = [
        createMockModule('VCO'),
        createMockModule('VCF'),
        createMockModule('VCA'),
      ];
      const rack: ParsedRack = {
        url: 'test',
        modules,
        rows: [],
        metadata: { rackId: 'test', rackName: 'Test' },
      };
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('Possible Techniques');
    });

    it('should include warnings when present', () => {
      const modules = Array(30)
        .fill(null)
        .map(() => createMockModule('VCO', 20));
      const rack: ParsedRack = {
        url: 'test',
        modules,
        rows: [],
        metadata: { rackId: 'test', rackName: 'Large Test' },
      };
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('Warnings');
    });

    it('should include suggestions when present', () => {
      const modules = [createMockModule('LFO')];
      const rack: ParsedRack = {
        url: 'test',
        modules,
        rows: [],
        metadata: { rackId: 'test', rackName: 'Incomplete Test' },
      };
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('Suggestions');
    });

    it('should handle empty rack', () => {
      const rack: ParsedRack = {
        url: 'test',
        modules: [],
        rows: [],
        metadata: { rackId: 'test', rackName: 'Empty Rack' },
      };
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('0 modules');
    });

    it('should display row count correctly', () => {
      const rack: ParsedRack = {
        url: 'test',
        modules: [createMockModule('VCO')],
        rows: [
          { rowNumber: 1, modules: [createMockModule('VCO')], totalHP: 12, maxHP: 104 },
          { rowNumber: 2, modules: [], totalHP: 0, maxHP: 104 },
        ],
        metadata: { rackId: 'test', rackName: 'Multi-row Rack' },
      };
      const analysis = analyzeRack(rack);
      const summary = generateRackSummary(rack, analysis);

      expect(summary).toContain('2 row');
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined power values', () => {
      const modules: Module[] = [
        {
          ...createMockModule('VCO'),
          power: {
            positive12V: undefined,
            negative12V: undefined,
          },
        },
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.totalPowerDraw.positive12V).toBe(0);
      expect(capabilities.totalPowerDraw.negative12V).toBe(0);
    });

    it('should handle very large rack', () => {
      const modules = Array(100)
        .fill(null)
        .map((_, i) => createMockModule('VCO', 10));

      const rack: ParsedRack = {
        url: 'test',
        modules,
        rows: [],
        metadata: { rackId: 'test', rackName: 'Huge Rack' },
      };

      const analysis = analyzeRack(rack);

      expect(analysis).toBeDefined();
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it('should handle rack with only utilities', () => {
      const modules = [
        createMockModule('Utility'),
        createMockModule('Mixer'),
      ];

      const rack: ParsedRack = {
        url: 'test',
        modules,
        rows: [],
        metadata: { rackId: 'test', rackName: 'Utility Rack' },
      };

      const analysis = analyzeRack(rack);

      expect(analysis.missingFundamentals.length).toBeGreaterThan(0);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});
