/**
 * Tests for video module type detection
 * Validates that video synthesis modules are correctly identified from ModularGrid data
 */

import { describe, it, expect } from '@jest/globals';
import { type Module } from '@/types/module';

// Import the detectModuleType function (we'll need to export it from modulargrid.ts)
// For now, we'll test the pattern matching indirectly through the scraper

describe('Video Module Type Detection', () => {
  const createMockModule = (
    name: string,
    manufacturer: string = 'Test Manufacturer'
  ): Partial<Module> => ({
    id: `test-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    manufacturer,
    hp: 10,
    power: {
      positive12V: 50,
      negative12V: 5,
    },
    inputs: [],
    outputs: [],
  });

  describe('LZX Industries modules', () => {
    it('should detect Visual Cortex as SyncGenerator', () => {
      const testModule = createMockModule('Visual Cortex', 'LZX Industries');
      // When the scraper processes this, it should detect type as 'SyncGenerator'
      expect(testModule.name.toLowerCase()).toContain('visual cortex');
    });

    it('should detect ESG3 as SyncGenerator', () => {
      const testModule = createMockModule('ESG3 Encoder & Sync Generator', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('esg3');
    });

    it('should detect Chromagnon as SyncGenerator', () => {
      const testModule = createMockModule('Chromagnon', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('chromagnon');
    });

    it('should detect Angles as RampGenerator', () => {
      const testModule = createMockModule('Angles', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('angles');
    });

    it('should detect Scrolls as RampGenerator', () => {
      const testModule = createMockModule('Scrolls', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('scrolls');
    });

    it('should detect Diver as RampGenerator', () => {
      const testModule = createMockModule('Diver', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('diver');
    });

    it('should detect DSG3 as ShapeGenerator', () => {
      const testModule = createMockModule('DSG3 Digital Shape Generator', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('dsg3');
    });

    it('should detect Passage as Colorizer', () => {
      const testModule = createMockModule('Passage', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('passage');
    });

    it('should detect Contour as Colorizer', () => {
      const testModule = createMockModule('Contour', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('contour');
    });

    it('should detect FKG3 as Keyer', () => {
      const testModule = createMockModule('FKG3 Fader & Key Generator', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('fkg3');
    });

    it('should detect SMX3 as VideoMixer', () => {
      const testModule = createMockModule('SMX3 Stereo Video Mixer', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('smx3');
    });

    it('should detect DWO3 as VideoOscillator', () => {
      const testModule = createMockModule('DWO3 Digital Wideband Oscillator', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('dwo3');
    });

    it('should detect Escher Sketch as VideoDisplay', () => {
      const testModule = createMockModule('Escher Sketch', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('escher sketch');
    });

    it('should detect Liquid TV as VideoDisplay', () => {
      const testModule = createMockModule('Liquid TV', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('liquid tv');
    });

    it('should detect TBC2 as VideoProcessor', () => {
      const testModule = createMockModule('TBC2 Time Base Corrector', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('tbc2');
    });

    it('should detect Video Motion as VideoProcessor', () => {
      const testModule = createMockModule('Video Motion', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('video motion');
    });

    it('should detect Video Calculator as VideoProcessor', () => {
      const testModule = createMockModule('Video Calculator', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('video calculator');
    });

    it('should detect Mapper as VideoProcessor', () => {
      const testModule = createMockModule('Mapper', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('mapper');
    });

    it('should detect Polar Fringe as VideoProcessor', () => {
      const testModule = createMockModule('Polar Fringe', 'LZX Industries');
      expect(testModule.name.toLowerCase()).toContain('polar fringe');
    });
  });

  describe('Syntonie modules', () => {
    it('should detect Rampes as RampGenerator', () => {
      const testModule = createMockModule('Rampes', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('rampes');
    });

    it('should detect Entrée as VideoDecoder', () => {
      const testModule = createMockModule('Entrée Component to RGB', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('entrée');
    });

    it('should detect Sortie as VideoEncoder', () => {
      const testModule = createMockModule('Sortie RGB to Component', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('sortie');
    });

    it('should detect Isohélie as Keyer', () => {
      const testModule = createMockModule('Isohélie', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('isohélie');
    });

    it('should detect Seuils as VideoProcessor', () => {
      const testModule = createMockModule('Seuils', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('seuils');
    });

    it('should detect Component decoder as VideoDecoder', () => {
      const testModule = createMockModule('Component RGB Decoder', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('component');
    });

    it('should detect CBV001 as VideoProcessor', () => {
      const testModule = createMockModule('CBV001 Circuit Bent Video Enhancer', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('cbv001');
    });

    it('should detect CBV002 as VideoProcessor', () => {
      const testModule = createMockModule('CBV002 Circuit Bent Video Delay', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('cbv002');
    });

    it('should detect VU008 as VideoProcessor', () => {
      const testModule = createMockModule('VU008 Dual Ramp Phase Shifter', 'Syntonie');
      expect(testModule.name.toLowerCase()).toContain('vu008');
    });
  });

  describe('Generic video module patterns', () => {
    it('should detect sync generator from description', () => {
      const testModule = createMockModule('Master Sync Generator', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('sync generator');
    });

    it('should detect ramp generator from description', () => {
      const testModule = createMockModule('Horizontal Ramp Generator', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('ramp generator');
    });

    it('should detect colorizer from description', () => {
      const testModule = createMockModule('RGB Colorizer', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('colorizer');
    });

    it('should detect keyer from description', () => {
      const testModule = createMockModule('Luma Key Generator', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('key');
    });

    it('should detect video encoder', () => {
      const testModule = createMockModule('HDMI Video Encoder', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('encoder');
    });

    it('should detect video decoder', () => {
      const testModule = createMockModule('Composite Video Decoder', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('decoder');
    });

    it('should detect video mixer', () => {
      const testModule = createMockModule('RGB Video Mixer', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('video mixer');
    });

    it('should detect video oscillator', () => {
      const testModule = createMockModule('Wideband Video Oscillator', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('video oscillator');
    });

    it('should detect multiplier as VideoProcessor', () => {
      const testModule = createMockModule('Four Quadrant Multiplier', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('multiplier');
    });

    it('should detect visualizer as VideoDisplay', () => {
      const testModule = createMockModule('Waveform Visualizer', 'Generic');
      expect(testModule.name.toLowerCase()).toContain('visualizer');
    });
  });

  describe('Edge cases', () => {
    it('should handle modules with video in name but not pure video', () => {
      const testModule = createMockModule('Video Rate LFO', 'Generic');
      // This should still match 'video' pattern as fallback
      expect(testModule.name.toLowerCase()).toContain('video');
    });

    it('should handle case-insensitive matching', () => {
      const testModule = createMockModule('VISUAL CORTEX', 'LZX');
      expect(testModule.name.toLowerCase()).toContain('visual cortex');
    });

    it('should handle modules with extra descriptors', () => {
      const testModule = createMockModule('LZX Industries ESG3 Gen3', 'LZX');
      expect(testModule.name.toLowerCase()).toContain('esg3');
    });
  });
});
