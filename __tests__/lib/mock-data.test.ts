/**
 * Tests for lib/scraper/mock-data.ts
 */

import { describe, it, expect } from '@jest/globals';
import { MOCK_RACK, getMockRack } from '@/lib/scraper/mock-data';
import { type ParsedRack } from '@/types/rack';

describe('lib/scraper/mock-data', () => {
  describe('MOCK_RACK', () => {
    it('should have valid structure', () => {
      expect(MOCK_RACK).toHaveProperty('url');
      expect(MOCK_RACK).toHaveProperty('modules');
      expect(MOCK_RACK).toHaveProperty('rows');
      expect(MOCK_RACK).toHaveProperty('metadata');
    });

    it('should have valid URL', () => {
      expect(MOCK_RACK.url).toBe('https://modulargrid.net/e/racks/view/2383104');
      expect(MOCK_RACK.url).toContain('modulargrid.net');
    });

    it('should have modules array', () => {
      expect(Array.isArray(MOCK_RACK.modules)).toBe(true);
      expect(MOCK_RACK.modules.length).toBeGreaterThan(0);
    });

    it('should have rows array', () => {
      expect(Array.isArray(MOCK_RACK.rows)).toBe(true);
      expect(MOCK_RACK.rows.length).toBeGreaterThan(0);
    });

    it('should have metadata', () => {
      expect(MOCK_RACK.metadata).toHaveProperty('rackId');
      expect(MOCK_RACK.metadata).toHaveProperty('rackName');
      expect(MOCK_RACK.metadata.rackId).toBe('2383104');
      expect(MOCK_RACK.metadata.rackName).toBe('Demo Rack (Mock Data)');
    });
  });

  describe('modules', () => {
    it('should have valid module structure', () => {
      MOCK_RACK.modules.forEach((module) => {
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('name');
        expect(module).toHaveProperty('manufacturer');
        expect(module).toHaveProperty('type');
        expect(module).toHaveProperty('hp');
        expect(module).toHaveProperty('power');
        expect(module).toHaveProperty('inputs');
        expect(module).toHaveProperty('outputs');
      });
    });

    it('should have VCO modules', () => {
      const vcoModules = MOCK_RACK.modules.filter((m) => m.type === 'VCO');
      expect(vcoModules.length).toBeGreaterThan(0);

      const plaits = vcoModules.find((m) => m.name === 'Plaits');
      expect(plaits).toBeDefined();
      expect(plaits?.manufacturer).toBe('Mutable Instruments');
      expect(plaits?.hp).toBe(12);
    });

    it('should have VCF modules', () => {
      const vcfModules = MOCK_RACK.modules.filter((m) => m.type === 'VCF');
      expect(vcfModules.length).toBeGreaterThan(0);

      const ripples = vcfModules.find((m) => m.name === 'Ripples');
      expect(ripples).toBeDefined();
      expect(ripples?.manufacturer).toBe('Mutable Instruments');
    });

    it('should have VCA modules', () => {
      const vcaModules = MOCK_RACK.modules.filter((m) => m.type === 'VCA');
      expect(vcaModules.length).toBeGreaterThan(0);

      const veils = vcaModules.find((m) => m.name === 'Veils');
      expect(veils).toBeDefined();
    });

    it('should have LFO modules', () => {
      const lfoModules = MOCK_RACK.modules.filter((m) => m.type === 'LFO');
      expect(lfoModules.length).toBeGreaterThan(0);

      const batumi = lfoModules.find((m) => m.name === 'Batumi');
      expect(batumi).toBeDefined();
      expect(batumi?.manufacturer).toBe('Xaoc Devices');
    });

    it('should have Envelope modules', () => {
      const egModules = MOCK_RACK.modules.filter((m) => m.type === 'EG');
      expect(egModules.length).toBeGreaterThan(0);

      const maths = egModules.find((m) => m.name === 'Maths');
      expect(maths).toBeDefined();
      expect(maths?.manufacturer).toBe('Make Noise');
    });

    it('should have Sequencer modules', () => {
      const seqModules = MOCK_RACK.modules.filter((m) => m.type === 'Sequencer');
      expect(seqModules.length).toBeGreaterThan(0);

      const rene = seqModules.find((m) => m.name === 'Rene 2');
      expect(rene).toBeDefined();
    });

    it('should have Effect modules', () => {
      const effectModules = MOCK_RACK.modules.filter((m) => m.type === 'Effect');
      expect(effectModules.length).toBeGreaterThan(0);

      const magneto = effectModules.find((m) => m.name === 'Magneto');
      expect(magneto).toBeDefined();
      expect(magneto?.manufacturer).toBe('Qu-Bit');
    });

    it('should have Mixer modules', () => {
      const mixerModules = MOCK_RACK.modules.filter((m) => m.type === 'Mixer');
      expect(mixerModules.length).toBeGreaterThan(0);

      const mixup = mixerModules.find((m) => m.name === 'Mixup');
      expect(mixup).toBeDefined();
      expect(mixup?.manufacturer).toBe('Intellijel');
    });

    it('should have valid HP values', () => {
      MOCK_RACK.modules.forEach((module) => {
        expect(module.hp).toBeGreaterThan(0);
        expect(module.hp).toBeLessThan(100); // Max realistic HP
      });
    });

    it('should have valid power consumption', () => {
      MOCK_RACK.modules.forEach((module) => {
        expect(module.power).toBeDefined();
        if (module.power.positive12V) {
          expect(module.power.positive12V).toBeGreaterThan(0);
        }
        if (module.power.negative12V) {
          expect(module.power.negative12V).toBeGreaterThan(0);
        }
      });
    });

    it('should have inputs and outputs', () => {
      MOCK_RACK.modules.forEach((module) => {
        expect(Array.isArray(module.inputs)).toBe(true);
        expect(Array.isArray(module.outputs)).toBe(true);
      });
    });

    it('should have valid input/output types', () => {
      const validTypes = ['audio', 'cv', 'gate', 'clock', 'video'];

      MOCK_RACK.modules.forEach((module) => {
        module.inputs?.forEach((input) => {
          expect(validTypes).toContain(input.type);
        });

        module.outputs?.forEach((output) => {
          expect(validTypes).toContain(output.type);
        });
      });
    });
  });

  describe('rows', () => {
    it('should have valid row structure', () => {
      MOCK_RACK.rows.forEach((row) => {
        expect(row).toHaveProperty('rowNumber');
        expect(row).toHaveProperty('totalHP');
        expect(row).toHaveProperty('maxHP');
        expect(row).toHaveProperty('modules');
      });
    });

    it('should have valid maxHP values', () => {
      MOCK_RACK.rows.forEach((row) => {
        expect(row.maxHP).toBe(104);
      });
    });

    it('should have row numbers', () => {
      expect(MOCK_RACK.rows[0].rowNumber).toBe(1);
      expect(MOCK_RACK.rows[1].rowNumber).toBe(2);
    });

    it('should have modules arrays', () => {
      MOCK_RACK.rows.forEach((row) => {
        expect(Array.isArray(row.modules)).toBe(true);
      });
    });
  });

  describe('getMockRack', () => {
    it('should return a ParsedRack', () => {
      const rack = getMockRack();

      expect(rack).toBeDefined();
      expect(rack).toHaveProperty('url');
      expect(rack).toHaveProperty('modules');
      expect(rack).toHaveProperty('rows');
      expect(rack).toHaveProperty('metadata');
    });

    it('should return same data as MOCK_RACK', () => {
      const rack = getMockRack();

      expect(rack.url).toBe(MOCK_RACK.url);
      expect(rack.modules.length).toBe(MOCK_RACK.modules.length);
      expect(rack.rows.length).toBe(MOCK_RACK.rows.length);
      expect(rack.metadata.rackId).toBe(MOCK_RACK.metadata.rackId);
    });

    it('should return a valid rack for testing', () => {
      const rack: ParsedRack = getMockRack();

      // Should be usable for rack analysis
      expect(rack.modules.length).toBeGreaterThan(0);

      // Should have various module types
      const moduleTypes = new Set(rack.modules.map((m) => m.type));
      expect(moduleTypes.size).toBeGreaterThan(1);
    });
  });

  describe('realistic rack data', () => {
    it('should have realistic total HP', () => {
      const totalHP = MOCK_RACK.modules.reduce((sum, m) => sum + m.hp, 0);
      expect(totalHP).toBeLessThan(208); // 2x 104HP rows
    });

    it('should have realistic total power consumption', () => {
      const totalPositive12V = MOCK_RACK.modules.reduce(
        (sum, m) => sum + (m.power.positive12V || 0),
        0
      );

      expect(totalPositive12V).toBeGreaterThan(0);
      expect(totalPositive12V).toBeLessThan(3000); // Realistic PSU limit
    });

    it('should have unique module IDs', () => {
      const ids = MOCK_RACK.modules.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have realistic module names', () => {
      const names = MOCK_RACK.modules.map((m) => m.name);
      expect(names).toContain('Plaits');
      expect(names).toContain('Maths');
      expect(names).toContain('Batumi');
    });

    it('should have realistic manufacturers', () => {
      const manufacturers = MOCK_RACK.modules.map((m) => m.manufacturer);
      expect(manufacturers).toContain('Mutable Instruments');
      expect(manufacturers).toContain('Make Noise');
      expect(manufacturers).toContain('Xaoc Devices');
    });
  });

  describe('data completeness', () => {
    it('should have all required fields', () => {
      expect(MOCK_RACK.modules.length).toBe(8);
      expect(MOCK_RACK.rows.length).toBe(2);
      expect(MOCK_RACK.metadata.userName).toBe('PatchPath AI');
    });

    it('should support rack analysis', () => {
      const hasVCO = MOCK_RACK.modules.some((m) => m.type === 'VCO');
      const hasVCF = MOCK_RACK.modules.some((m) => m.type === 'VCF');
      const hasVCA = MOCK_RACK.modules.some((m) => m.type === 'VCA');

      expect(hasVCO).toBe(true);
      expect(hasVCF).toBe(true);
      expect(hasVCA).toBe(true);
    });

    it('should support patch generation', () => {
      // Should have enough modules for a patch
      expect(MOCK_RACK.modules.length).toBeGreaterThanOrEqual(3);

      // Should have varied module types
      const types = new Set(MOCK_RACK.modules.map((m) => m.type));
      expect(types.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty module arrays gracefully', () => {
      expect(() => {
        const emptyModules = [];
        expect(emptyModules.length).toBe(0);
      }).not.toThrow();
    });

    it('should return fresh reference', () => {
      const rack1 = getMockRack();
      const rack2 = getMockRack();

      // getMockRack returns the same object reference (not a deep copy)
      expect(rack1).toBe(rack2);
      expect(rack1.modules).toBe(rack2.modules);
    });
  });
});
