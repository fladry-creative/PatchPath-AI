/**
 * Tests for video synthesis rack analysis
 * Validates that video racks are analyzed correctly with appropriate warnings and suggestions
 */

import { describe, it, expect } from '@jest/globals';
import { analyzeRackCapabilities, analyzeRack } from '@/lib/scraper/analyzer';
import { type Module } from '@/types/module';
import { type ParsedRack } from '@/types/rack';

describe('Video Synthesis Rack Analysis', () => {
  const createMockModule = (
    type: Module['type'],
    name: string = `Test ${type}`,
    hp: number = 10
  ): Module => ({
    id: `test-${type}-${Math.random()}`,
    name,
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

  const createMockRack = (modules: Module[]): ParsedRack => ({
    url: 'https://modulargrid.net/e/racks/view/test',
    modules,
    rows: [],
    metadata: {
      rackId: 'test',
      rackName: 'Test Rack',
    },
  });

  describe('Video capability detection', () => {
    it('should detect video sync presence', () => {
      const modules = [createMockModule('SyncGenerator', 'ESG3')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVideoSync).toBe(true);
      expect(capabilities.videoSyncSource).toBe('ESG3');
    });

    it('should detect ramp generator presence', () => {
      const modules = [createMockModule('RampGenerator', 'Angles')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasRampGenerator).toBe(true);
    });

    it('should detect colorizer presence', () => {
      const modules = [createMockModule('Colorizer', 'Passage')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasColorizer).toBe(true);
    });

    it('should detect keyer presence', () => {
      const modules = [createMockModule('Keyer', 'FKG3')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasKeyer).toBe(true);
    });

    it('should detect video encoder presence', () => {
      const modules = [createMockModule('VideoEncoder', 'ESG3')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVideoEncoder).toBe(true);
    });

    it('should detect video decoder presence', () => {
      const modules = [createMockModule('VideoDecoder', 'Entrée')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.hasVideoDecoder).toBe(true);
    });

    it('should collect video module types', () => {
      const modules = [
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('Colorizer', 'Passage'),
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.videoModuleTypes).toHaveLength(3);
      expect(capabilities.videoModuleTypes).toContain('SyncGenerator');
      expect(capabilities.videoModuleTypes).toContain('RampGenerator');
      expect(capabilities.videoModuleTypes).toContain('Colorizer');
    });
  });

  describe('Rack type classification', () => {
    it('should identify pure video rack (>50% video modules)', () => {
      const modules = [
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('RampGenerator', 'Scrolls'),
        createMockModule('Colorizer', 'Passage'),
        createMockModule('VideoEncoder', 'ESG3'),
        createMockModule('VCO', 'Audio Oscillator'), // Only 1 audio module out of 6
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.isVideoRack).toBe(true);
      expect(capabilities.isHybridRack).toBe(false);
    });

    it('should identify hybrid rack (≤50% video modules)', () => {
      const modules = [
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('VCO', 'Audio Oscillator'),
        createMockModule('VCF', 'Audio Filter'),
        createMockModule('VCA', 'Audio VCA'),
      ];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.isVideoRack).toBe(false);
      expect(capabilities.isHybridRack).toBe(true);
    });

    it('should not identify audio-only rack as video', () => {
      const modules = [createMockModule('VCO'), createMockModule('VCF'), createMockModule('VCA')];
      const capabilities = analyzeRackCapabilities(modules);

      expect(capabilities.isVideoRack).toBe(false);
      expect(capabilities.isHybridRack).toBe(false);
      expect(capabilities.hasVideoSync).toBe(false);
    });
  });

  describe('Video rack analysis - critical warnings', () => {
    it('should warn about missing sync generator in video rack', () => {
      const rack = createMockRack([
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('Colorizer', 'Passage'),
        createMockModule('VideoEncoder', 'Some Encoder'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.some((w) => w.includes('NO SYNC GENERATOR'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('NOT function'))).toBe(true);
      expect(analysis.missingFundamentals).toContain('SyncGenerator');
    });

    it('should suggest sync distribution when sync is present', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'Visual Cortex'),
        createMockModule('RampGenerator', 'Angles'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.suggestions.some((s) => s.includes('Sync provided by Visual Cortex'))).toBe(
        true
      );
      expect(
        analysis.suggestions.some((s) => s.includes('distribute to all video modules first'))
      ).toBe(true);
    });

    it('should warn about missing video encoder', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('Colorizer', 'Passage'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.some((w) => w.includes('No video encoder'))).toBe(true);
      expect(analysis.suggestions.some((s) => s.includes('Add a video encoder'))).toBe(true);
    });

    it('should warn about missing ramp generator', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('VideoEncoder', 'ESG3'),
        createMockModule('Colorizer', 'Passage'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.some((w) => w.includes('No ramp generator'))).toBe(true);
      expect(analysis.suggestions.some((s) => s.includes('Add ramp generators'))).toBe(true);
    });
  });

  describe('Video synthesis techniques identification', () => {
    it('should identify geometric color patterns capability', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('Colorizer', 'Passage'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible.some((t) => t.includes('Geometric color patterns'))).toBe(
        true
      );
    });

    it('should identify video compositing capability', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('Keyer', 'FKG3'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible.some((t) => t.includes('Video compositing'))).toBe(true);
    });

    it('should identify external video processing capability', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('VideoDecoder', 'Entrée'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible.some((t) => t.includes('External video processing'))).toBe(
        true
      );
    });

    it('should identify raster manipulation capability', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('VideoProcessor', 'Multiplier'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.techniquesPossible.some((t) => t.includes('Raster manipulation'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('feedback can be unstable'))).toBe(true);
    });

    it('should identify complete video workflow', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('VideoEncoder', 'ESG3'),
      ]);
      const analysis = analyzeRack(rack);

      expect(
        analysis.techniquesPossible.some((t) => t.includes('Complete video synthesis workflow'))
      ).toBe(true);
    });
  });

  describe('Hybrid rack warnings', () => {
    it('should warn about voltage incompatibility in hybrid rack', () => {
      // Hybrid rack needs ≤50% video modules, so 2 audio + 2 video = 50/50
      const rack = createMockRack([
        createMockModule('VCO', 'Audio Oscillator'),
        createMockModule('VCF', 'Audio Filter'),
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.warnings.some((w) => w.includes('HYBRID RACK'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('±5V'))).toBe(true);
      expect(analysis.warnings.some((w) => w.includes('0-1V'))).toBe(true);
    });

    it('should suggest creative cross-modulation in hybrid rack', () => {
      // Hybrid rack needs ≤50% video modules
      const rack = createMockRack([
        createMockModule('VCO', 'Audio Oscillator'),
        createMockModule('VCF', 'Audio Filter'),
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.suggestions.some((s) => s.includes('CREATIVE TIP'))).toBe(true);
      expect(analysis.suggestions.some((s) => s.includes('Audio oscillators can modulate'))).toBe(
        true
      );
      expect(
        analysis.techniquesPossible.some((t) => t.includes('Audio-visual cross-modulation'))
      ).toBe(true);
    });
  });

  describe('Educational notes', () => {
    it('should explain horizontal/vertical confusion with ramp generators', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'ESG3'),
        createMockModule('RampGenerator', 'Angles'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.suggestions.some((s) => s.includes('IMPORTANT'))).toBe(true);
      expect(
        analysis.suggestions.some((s) => s.includes('Horizontal ramp creates VERTICAL bars'))
      ).toBe(true);
      expect(
        analysis.suggestions.some((s) => s.includes('scan direction vs. pattern orientation'))
      ).toBe(true);
    });
  });

  describe('Complete video rack (no warnings)', () => {
    it('should have minimal warnings for complete video rack', () => {
      const rack = createMockRack([
        createMockModule('SyncGenerator', 'Visual Cortex'),
        createMockModule('RampGenerator', 'Angles'),
        createMockModule('RampGenerator', 'Scrolls'),
        createMockModule('Colorizer', 'Passage'),
        createMockModule('Keyer', 'FKG3'),
        createMockModule('VideoMixer', 'SMX3'),
        createMockModule('VideoEncoder', 'ESG3'),
      ]);
      const analysis = analyzeRack(rack);

      expect(analysis.missingFundamentals).toHaveLength(0);
      expect(analysis.warnings.filter((w) => w.includes('NO SYNC')).length).toBe(0);
      expect(analysis.warnings.filter((w) => w.includes('No video encoder')).length).toBe(0);
      expect(analysis.warnings.filter((w) => w.includes('No ramp generator')).length).toBe(0);
      expect(analysis.techniquesPossible.length).toBeGreaterThanOrEqual(3);
    });
  });
});
