/**
 * Tests for save detector
 */

import {
  detectSaveIntent,
  generatePatchName,
  generateSaveConfirmation,
  detectStartFreshIntent,
  detectVariationsIntent,
} from '@/lib/chat/save-detector';
import { type PatchModification } from '@/lib/chat/modification-mapper';

describe('Save Detector', () => {
  describe('detectSaveIntent', () => {
    it('should detect direct save requests', () => {
      const result = detectSaveIntent('save this');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reasoning).toContain('save this');
    });

    it('should detect positive feedback as save intent', () => {
      const result = detectSaveIntent('perfect');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect completion indicators', () => {
      const result = detectSaveIntent('done');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect approval phrases', () => {
      const result = detectSaveIntent('yes');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should not detect negative responses', () => {
      const result = detectSaveIntent('no');
      
      expect(result.detected).toBe(false);
    });

    it('should not detect refinement requests', () => {
      const result = detectSaveIntent('make it darker');
      
      expect(result.detected).toBe(false);
    });

    it('should not detect variation requests', () => {
      const result = detectSaveIntent('show me variations');
      
      expect(result.detected).toBe(false);
    });

    it('should handle case insensitive input', () => {
      const result = detectSaveIntent('SAVE THIS');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle punctuation', () => {
      const result = detectSaveIntent('perfect!');
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('generatePatchName', () => {
    const mockModifications: PatchModification[] = [
      {
        description: 'Lowered filter cutoff by 30%',
        changes: { parametersChanged: [] },
        confidence: 0.9,
      },
      {
        description: 'Increased reverb send to 80%',
        changes: { parametersChanged: [] },
        confidence: 0.9,
      },
    ];

    it('should add descriptors from modifications', () => {
      const result = generatePatchName('Original Patch', mockModifications, []);
      
      expect(result).toContain('Original Patch');
      expect(result).toContain('Darker');
      expect(result).toContain('Reverb Heavy');
    });

    it('should handle empty modifications', () => {
      const result = generatePatchName('Original Patch', [], []);
      
      expect(result).toBe('Original Patch');
    });

    it('should limit descriptors to 3', () => {
      const manyModifications: PatchModification[] = [
        { description: 'Made it darker', changes: { parametersChanged: [] }, confidence: 0.9 },
        { description: 'Added reverb', changes: { parametersChanged: [] }, confidence: 0.9 },
        { description: 'Made it louder', changes: { parametersChanged: [] }, confidence: 0.9 },
        { description: 'Made it faster', changes: { parametersChanged: [] }, confidence: 0.9 },
        { description: 'Added distortion', changes: { parametersChanged: [] }, confidence: 0.9 },
      ];

      const result = generatePatchName('Original Patch', manyModifications, []);
      
      expect(result).toContain('Original Patch');
      // Should only have 3 descriptors max
      const descriptorCount = (result.match(/\(/g) || []).length;
      expect(descriptorCount).toBeLessThanOrEqual(1); // Only one set of parentheses
    });

    it('should extract mood from conversation context', () => {
      const conversationContext = [
        'I want something dark and atmospheric',
        'Make it more ambient',
        'That sounds perfect',
      ];

      const result = generatePatchName('Original Patch', [], conversationContext);
      
      expect(result).toContain('Original Patch');
      expect(result).toContain('Dark');
      expect(result).toContain('Ambient');
    });

    it('should truncate long names', () => {
      const longModifications: PatchModification[] = Array(10).fill(null).map((_, i) => ({
        description: `Modification ${i}`,
        changes: { parametersChanged: [] },
        confidence: 0.9,
      }));

      const result = generatePatchName('A'.repeat(100), longModifications, []);
      
      expect(result.length).toBeLessThanOrEqual(80);
      expect(result).toContain('...');
    });
  });

  describe('generateSaveConfirmation', () => {
    it('should generate basic confirmation message', () => {
      const result = generateSaveConfirmation('Test Patch', []);
      
      expect(result).toContain('Saved as "Test Patch"');
      expect(result).toContain('Cookbook');
      expect(result).toContain('Want to try another variation');
    });

    it('should include modification details', () => {
      const modifications: PatchModification[] = [
        {
          description: 'Lowered filter cutoff by 30%',
          changes: { parametersChanged: [] },
          confidence: 0.9,
        },
        {
          description: 'Increased reverb send to 80%',
          changes: { parametersChanged: [] },
          confidence: 0.9,
        },
      ];

      const result = generateSaveConfirmation('Test Patch', modifications);
      
      expect(result).toContain('2 refinements');
      expect(result).toContain('Lowered filter cutoff');
      expect(result).toContain('Increased reverb send');
    });

    it('should handle many modifications', () => {
      const modifications: PatchModification[] = Array(5).fill(null).map((_, i) => ({
        description: `Modification ${i + 1}`,
        changes: { parametersChanged: [] },
        confidence: 0.9,
      }));

      const result = generateSaveConfirmation('Test Patch', modifications);
      
      expect(result).toContain('5 refinements');
      expect(result).toContain('...and 2 more');
    });
  });

  describe('detectStartFreshIntent', () => {
    it('should detect start fresh requests', () => {
      expect(detectStartFreshIntent('start fresh')).toBe(true);
      expect(detectStartFreshIntent('start over')).toBe(true);
      expect(detectStartFreshIntent('new patch')).toBe(true);
      expect(detectStartFreshIntent('something else')).toBe(true);
      expect(detectStartFreshIntent('try again')).toBe(true);
      expect(detectStartFreshIntent('reset')).toBe(true);
      expect(detectStartFreshIntent('clear')).toBe(true);
    });

    it('should not detect other intents', () => {
      expect(detectStartFreshIntent('make it darker')).toBe(false);
      expect(detectStartFreshIntent('save this')).toBe(false);
      expect(detectStartFreshIntent('show variations')).toBe(false);
    });

    it('should handle case insensitive input', () => {
      expect(detectStartFreshIntent('START FRESH')).toBe(true);
      expect(detectStartFreshIntent('New Patch')).toBe(true);
    });
  });

  describe('detectVariationsIntent', () => {
    it('should detect variation requests', () => {
      expect(detectVariationsIntent('variations')).toBe(true);
      expect(detectVariationsIntent('variation')).toBe(true);
      expect(detectVariationsIntent('other options')).toBe(true);
      expect(detectVariationsIntent('different versions')).toBe(true);
      expect(detectVariationsIntent('alternatives')).toBe(true);
      expect(detectVariationsIntent('show me more')).toBe(true);
      expect(detectVariationsIntent('what else')).toBe(true);
      expect(detectVariationsIntent('try another')).toBe(true);
      expect(detectVariationsIntent('another one')).toBe(true);
    });

    it('should not detect other intents', () => {
      expect(detectVariationsIntent('make it darker')).toBe(false);
      expect(detectVariationsIntent('save this')).toBe(false);
      expect(detectVariationsIntent('start fresh')).toBe(false);
    });

    it('should handle case insensitive input', () => {
      expect(detectVariationsIntent('VARIATIONS')).toBe(true);
      expect(detectVariationsIntent('Other Options')).toBe(true);
    });
  });
});