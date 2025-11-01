/**
 * Tests for modification mapper
 */

import { 
  mapFeedbackToModifications, 
  applyModifications, 
  validateModifications,
  type PatchModification 
} from '@/lib/chat/modification-mapper';
import { type ParsedFeedback } from '@/lib/chat/feedback-parser';
import { type Patch } from '@/types/patch';
import { type ParsedRack } from '@/types/rack';

// Mock patch for testing
const mockPatch: Patch = {
  id: 'test-patch-1',
  userId: 'test-user',
  rackId: 'test-rack',
  metadata: {
    title: 'Test Patch',
    description: 'A test patch',
    difficulty: 'intermediate',
    estimatedTime: 10,
    techniques: ['test'],
    genres: ['test'],
  },
  connections: [
    {
      id: 'conn-1',
      from: { moduleId: 'vco-1', moduleName: 'Plaits', outputName: 'output' },
      to: { moduleId: 'filter-1', moduleName: 'Ripples', inputName: 'input' },
      signalType: 'audio',
      importance: 'primary',
    },
  ],
  patchingOrder: ['conn-1'],
  parameterSuggestions: [
    {
      moduleId: 'filter-1',
      moduleName: 'Ripples',
      parameter: 'cutoff',
      value: '5kHz',
    },
  ],
  whyThisWorks: 'Test patch',
  tips: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  saved: false,
  tags: [],
};

// Mock rack for testing
const mockRack: ParsedRack = {
  id: 'test-rack',
  rackUrl: 'https://modulargrid.net/e/racks/view/123456',
  modules: [
    {
      id: 'vco-1',
      name: 'Plaits',
      type: 'VCO',
      hp: 12,
      power: 50,
      inputs: [],
      outputs: [],
    },
    {
      id: 'filter-1',
      name: 'Ripples',
      type: 'VCF',
      hp: 8,
      power: 40,
      inputs: [],
      outputs: [],
    },
    {
      id: 'reverb-1',
      name: 'Clouds',
      type: 'Effect',
      hp: 8,
      power: 30,
      inputs: [],
      outputs: [],
    },
  ],
  rows: [],
  totalHp: 28,
  totalPower: 120,
};

describe('Modification Mapper', () => {
  describe('mapFeedbackToModifications', () => {
    it('should map "darker" feedback to filter adjustments', async () => {
      const feedback: ParsedFeedback = {
        intent: 'adjust',
        target: 'filter_cutoff',
        direction: 'decrease',
        specificity: 'vague',
        confidence: 0.9,
        reasoning: 'User wants darker sound',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('darker');
      expect(result.changes.parametersChanged).toHaveLength(1);
      expect(result.changes.parametersChanged![0].parameter).toBe('cutoff');
      expect(result.changes.parametersChanged![0].newValue).toBe('3.5kHz');
    });

    it('should map "brighter" feedback to filter adjustments', async () => {
      const feedback: ParsedFeedback = {
        intent: 'adjust',
        target: 'filter_cutoff',
        direction: 'increase',
        specificity: 'vague',
        confidence: 0.9,
        reasoning: 'User wants brighter sound',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('brighter');
      expect(result.changes.parametersChanged).toHaveLength(1);
      expect(result.changes.parametersChanged![0].parameter).toBe('cutoff');
      expect(result.changes.parametersChanged![0].newValue).toBe('6.5kHz');
    });

    it('should map "add reverb" feedback to connection additions', async () => {
      const feedback: ParsedFeedback = {
        intent: 'add',
        target: 'reverb',
        specificity: 'vague',
        confidence: 0.9,
        reasoning: 'User wants to add reverb',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('reverb');
      expect(result.changes.connectionsAdded).toHaveLength(1);
      expect(result.changes.connectionsAdded![0].to.moduleName).toContain('Clouds');
    });

    it('should map "remove reverb" feedback to connection removals', async () => {
      const feedback: ParsedFeedback = {
        intent: 'remove',
        target: 'reverb',
        specificity: 'vague',
        confidence: 0.9,
        reasoning: 'User wants to remove reverb',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('reverb');
      expect(result.changes.connectionsRemoved).toHaveLength(0); // No reverb connections in mock patch
    });

    it('should handle specific parameter values', async () => {
      const feedback: ParsedFeedback = {
        intent: 'adjust',
        target: 'reverb_decay',
        value: '8s',
        specificity: 'specific',
        confidence: 0.95,
        reasoning: 'User specified exact decay time',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('reverb');
      expect(result.changes.parametersChanged).toHaveLength(1);
      expect(result.changes.parametersChanged![0].newValue).toBe('8s');
    });

    it('should handle clarify intent', async () => {
      const feedback: ParsedFeedback = {
        intent: 'clarify',
        target: 'general',
        specificity: 'vague',
        confidence: 0.1,
        reasoning: 'Need clarification',
      };

      const result = await mapFeedbackToModifications(feedback, mockPatch, mockRack);

      expect(result.description).toContain('clarification');
      expect(result.changes.parametersChanged).toHaveLength(0);
    });
  });

  describe('applyModifications', () => {
    it('should apply parameter changes to patch', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          parametersChanged: [
            {
              moduleId: 'filter-1',
              moduleName: 'Ripples',
              parameter: 'cutoff',
              oldValue: '5kHz',
              newValue: '3kHz',
              reasoning: 'Test change',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = applyModifications(mockPatch, modification);

      expect(result.parameterSuggestions).toHaveLength(1);
      expect(result.parameterSuggestions[0].value).toBe('3kHz');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should add new parameter suggestions', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          parametersChanged: [
            {
              moduleId: 'vco-1',
              moduleName: 'Plaits',
              parameter: 'frequency',
              oldValue: '440Hz',
              newValue: '880Hz',
              reasoning: 'Test change',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = applyModifications(mockPatch, modification);

      expect(result.parameterSuggestions).toHaveLength(2);
      expect(result.parameterSuggestions[1].parameter).toBe('frequency');
      expect(result.parameterSuggestions[1].value).toBe('880Hz');
    });

    it('should add connections', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          connectionsAdded: [
            {
              id: 'conn-2',
              from: { moduleId: 'vco-1', moduleName: 'Plaits', outputName: 'output' },
              to: { moduleId: 'reverb-1', moduleName: 'Clouds', inputName: 'input' },
              signalType: 'audio',
              importance: 'primary',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = applyModifications(mockPatch, modification);

      expect(result.connections).toHaveLength(2);
      expect(result.connections[1].id).toBe('conn-2');
    });

    it('should remove connections', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          connectionsRemoved: [mockPatch.connections[0]],
        },
        confidence: 0.9,
      };

      const result = applyModifications(mockPatch, modification);

      expect(result.connections).toHaveLength(0);
    });
  });

  describe('validateModifications', () => {
    it('should validate valid modifications', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          parametersChanged: [
            {
              moduleId: 'filter-1',
              moduleName: 'Ripples',
              parameter: 'cutoff',
              oldValue: '5kHz',
              newValue: '3kHz',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = validateModifications(modification, mockPatch, mockRack);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect invalid module references', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          parametersChanged: [
            {
              moduleId: 'nonexistent-module',
              moduleName: 'Nonexistent',
              parameter: 'cutoff',
              oldValue: '5kHz',
              newValue: '3kHz',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = validateModifications(modification, mockPatch, mockRack);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Module Nonexistent not found in rack');
    });

    it('should detect invalid connection references', () => {
      const modification: PatchModification = {
        description: 'Test modification',
        changes: {
          connectionsAdded: [
            {
              id: 'conn-2',
              from: { moduleId: 'nonexistent', moduleName: 'Nonexistent', outputName: 'output' },
              to: { moduleId: 'filter-1', moduleName: 'Ripples', inputName: 'input' },
              signalType: 'audio',
              importance: 'primary',
            },
          ],
        },
        confidence: 0.9,
      };

      const result = validateModifications(modification, mockPatch, mockRack);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Source module Nonexistent not found in rack');
    });
  });
});