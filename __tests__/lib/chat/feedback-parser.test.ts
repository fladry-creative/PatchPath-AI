/**
 * Tests for feedback parser
 */

import { parseFeedback, needsClarification, isImpossibleRequest, generateClarificationQuestion } from '@/lib/chat/feedback-parser';
import { type Patch } from '@/types/patch';
import { type ParsedRack } from '@/types/rack';

// Mock patch for testing
const mockPatch: Patch = {
  id: 'test-patch-1',
  userId: 'test-user',
  rackId: 'test-rack',
  metadata: {
    title: 'Dark Ambient Drone',
    description: 'A dark, atmospheric patch with reverb and slow modulation',
    difficulty: 'intermediate',
    estimatedTime: 15,
    techniques: ['reverb', 'modulation'],
    genres: ['ambient', 'drone'],
  },
  connections: [],
  patchingOrder: [],
  parameterSuggestions: [],
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

describe('Feedback Parser', () => {
  describe('parseFeedback', () => {
    it('should parse "darker" feedback correctly', async () => {
      const result = await parseFeedback('darker', mockPatch, mockRack);
      
      expect(result.intent).toBe('adjust');
      expect(result.target).toContain('filter');
      expect(result.direction).toBe('decrease');
      expect(result.specificity).toBe('vague');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should parse "add reverb" feedback correctly', async () => {
      const result = await parseFeedback('add reverb', mockPatch, mockRack);
      
      expect(result.intent).toBe('add');
      expect(result.target).toContain('reverb');
      expect(result.specificity).toBe('vague');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should parse specific feedback correctly', async () => {
      const result = await parseFeedback('set reverb decay to 5 seconds', mockPatch, mockRack);
      
      expect(result.intent).toBe('adjust');
      expect(result.target).toContain('reverb');
      expect(result.specificity).toBe('specific');
      expect(result.value).toBe('5s');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle vague feedback with low confidence', async () => {
      const result = await parseFeedback('make it better', mockPatch, mockRack);
      
      expect(result.intent).toBe('clarify');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should fallback gracefully on parsing error', async () => {
      // Mock a parsing error by providing invalid input
      const result = await parseFeedback('', mockPatch, mockRack);
      
      expect(result.intent).toBe('adjust');
      expect(result.target).toBe('general');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('needsClarification', () => {
    it('should return true for clarify intent', () => {
      const feedback = {
        intent: 'clarify' as const,
        target: 'general',
        specificity: 'vague' as const,
        confidence: 0.3,
        reasoning: 'Need clarification',
      };
      
      expect(needsClarification(feedback)).toBe(true);
    });

    it('should return true for low confidence', () => {
      const feedback = {
        intent: 'adjust' as const,
        target: 'filter',
        specificity: 'vague' as const,
        confidence: 0.3,
        reasoning: 'Low confidence',
      };
      
      expect(needsClarification(feedback)).toBe(true);
    });

    it('should return false for high confidence', () => {
      const feedback = {
        intent: 'adjust' as const,
        target: 'filter',
        specificity: 'specific' as const,
        confidence: 0.9,
        reasoning: 'High confidence',
      };
      
      expect(needsClarification(feedback)).toBe(false);
    });
  });

  describe('isImpossibleRequest', () => {
    it('should detect impossible reverb request', () => {
      const rackWithoutReverb: ParsedRack = {
        ...mockRack,
        modules: mockRack.modules.filter(m => m.type !== 'Effect'),
      };

      const feedback = {
        intent: 'add' as const,
        target: 'reverb',
        specificity: 'vague' as const,
        confidence: 0.9,
        reasoning: 'Add reverb',
      };

      const result = isImpossibleRequest(feedback, rackWithoutReverb);
      
      expect(result.impossible).toBe(true);
      expect(result.reason).toContain('reverb');
    });

    it('should allow possible reverb request', () => {
      const feedback = {
        intent: 'add' as const,
        target: 'reverb',
        specificity: 'vague' as const,
        confidence: 0.9,
        reasoning: 'Add reverb',
      };

      const result = isImpossibleRequest(feedback, mockRack);
      
      expect(result.impossible).toBe(false);
    });

    it('should detect impossible delay request', () => {
      const rackWithoutDelay: ParsedRack = {
        ...mockRack,
        modules: mockRack.modules.filter(m => !m.name.toLowerCase().includes('delay')),
      };

      const feedback = {
        intent: 'add' as const,
        target: 'delay',
        specificity: 'vague' as const,
        confidence: 0.9,
        reasoning: 'Add delay',
      };

      const result = isImpossibleRequest(feedback, rackWithoutDelay);
      
      expect(result.impossible).toBe(true);
      expect(result.reason).toContain('delay');
    });
  });

  describe('generateClarificationQuestion', () => {
    it('should generate question for "better" feedback', () => {
      const question = generateClarificationQuestion('make it better');
      
      expect(question).toContain('more specific');
      expect(question).toContain('darker');
      expect(question).toContain('brighter');
    });

    it('should generate question for "fix" feedback', () => {
      const question = generateClarificationQuestion('fix it');
      
      expect(question).toContain('more specific');
      expect(question).toContain('too dark');
      expect(question).toContain('too bright');
    });

    it('should generate generic question for other feedback', () => {
      const question = generateClarificationQuestion('something');
      
      expect(question).toContain('more about what you\'d like to change');
      expect(question).toContain('darker/brighter');
    });
  });
});