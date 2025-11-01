/**
 * Tests for patch refinement engine
 */

import {
  refinePatch,
  handleSaveIntent,
  handleStartFreshIntent,
  handleVariationsIntent,
  checkSpecialIntents,
  RefinementHistory,
} from '@/lib/chat/patch-refinement';
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
      id: 'filter-1',
      name: 'Ripples',
      type: 'VCF',
      hp: 8,
      power: 40,
      inputs: [],
      outputs: [],
    },
  ],
  rows: [],
  totalHp: 8,
  totalPower: 40,
};

describe('Patch Refinement Engine', () => {
  describe('refinePatch', () => {
    it('should successfully refine a patch', async () => {
      const result = await refinePatch(mockPatch, 'make it darker', mockRack);

      expect(result.success).toBe(true);
      expect(result.updatedPatch).toBeDefined();
      expect(result.modification).toBeDefined();
      expect(result.message).toContain('✨');
    });

    it('should handle impossible requests', async () => {
      const result = await refinePatch(mockPatch, 'add reverb', mockRack);

      expect(result.success).toBe(false);
      expect(result.impossibleRequest).toBe(true);
      expect(result.impossibleReason).toContain('reverb');
    });

    it('should handle clarification requests', async () => {
      const result = await refinePatch(mockPatch, 'make it better', mockRack);

      expect(result.success).toBe(false);
      expect(result.needsClarification).toBe(true);
      expect(result.message).toContain('specific');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error by providing invalid input
      const result = await refinePatch(mockPatch, '', mockRack);

      expect(result.success).toBe(false);
      expect(result.message).toContain('trouble understanding');
    });
  });

  describe('handleSaveIntent', () => {
    const mockModifications = [
      {
        description: 'Lowered filter cutoff by 30%',
        changes: { parametersChanged: [] },
        confidence: 0.9,
      },
    ];

    const conversationContext = ['I want something dark', 'Make it darker'];

    it('should handle save intent with modifications', () => {
      const result = handleSaveIntent(mockPatch, mockModifications, conversationContext);

      expect(result.shouldSave).toBe(true);
      expect(result.patchName).toContain('Test Patch');
      expect(result.patchName).toContain('Darker');
      expect(result.confirmationMessage).toContain('Saved as');
      expect(result.confirmationMessage).toContain('refinements');
    });

    it('should handle save intent without modifications', () => {
      const result = handleSaveIntent(mockPatch, [], []);

      expect(result.shouldSave).toBe(true);
      expect(result.patchName).toBe('Test Patch');
      expect(result.confirmationMessage).toContain('Saved as "Test Patch"');
    });
  });

  describe('handleStartFreshIntent', () => {
    it('should return start fresh message', () => {
      const result = handleStartFreshIntent();

      expect(result.shouldStartFresh).toBe(true);
      expect(result.message).toContain('Starting fresh');
      expect(result.message).toContain('What kind of sound');
    });
  });

  describe('handleVariationsIntent', () => {
    it('should return variations message', () => {
      const result = handleVariationsIntent();

      expect(result.shouldShowVariations).toBe(true);
      expect(result.message).toContain('variations');
    });
  });

  describe('checkSpecialIntents', () => {
    it('should detect save intent', () => {
      const result = checkSpecialIntents('save this');

      expect(result.saveIntent).toBe(true);
      expect(result.startFreshIntent).toBe(false);
      expect(result.variationsIntent).toBe(false);
    });

    it('should detect start fresh intent', () => {
      const result = checkSpecialIntents('start fresh');

      expect(result.saveIntent).toBe(false);
      expect(result.startFreshIntent).toBe(true);
      expect(result.variationsIntent).toBe(false);
    });

    it('should detect variations intent', () => {
      const result = checkSpecialIntents('show variations');

      expect(result.saveIntent).toBe(false);
      expect(result.startFreshIntent).toBe(false);
      expect(result.variationsIntent).toBe(true);
    });

    it('should detect multiple intents', () => {
      const result = checkSpecialIntents('save this and show variations');

      expect(result.saveIntent).toBe(true);
      expect(result.startFreshIntent).toBe(false);
      expect(result.variationsIntent).toBe(true);
    });

    it('should not detect any intents', () => {
      const result = checkSpecialIntents('make it darker');

      expect(result.saveIntent).toBe(false);
      expect(result.startFreshIntent).toBe(false);
      expect(result.variationsIntent).toBe(false);
    });
  });

  describe('RefinementHistory', () => {
    let history: RefinementHistory;

    beforeEach(() => {
      history = new RefinementHistory(mockPatch);
    });

    it('should initialize with current patch', () => {
      expect(history.getCurrentPatch()).toEqual(mockPatch);
      expect(history.canUndo()).toBe(false);
    });

    it('should add patches to history', () => {
      const newPatch = { ...mockPatch, id: 'patch-2' };
      history.addPatch(newPatch);

      expect(history.getCurrentPatch()).toEqual(newPatch);
      expect(history.canUndo()).toBe(true);
      expect(history.getPreviousPatch()).toEqual(mockPatch);
    });

    it('should limit history to max patches', () => {
      // Add more than maxHistory patches
      for (let i = 0; i < 10; i++) {
        const patch = { ...mockPatch, id: `patch-${i}` };
        history.addPatch(patch);
      }

      expect(history.getHistory()).toHaveLength(5); // maxHistory = 5
      expect(history.getCurrentPatch()?.id).toBe('patch-9');
    });

    it('should undo patches', () => {
      const patch2 = { ...mockPatch, id: 'patch-2' };
      const patch3 = { ...mockPatch, id: 'patch-3' };

      history.addPatch(patch2);
      history.addPatch(patch3);

      expect(history.getCurrentPatch()?.id).toBe('patch-3');

      const undonePatch = history.undo();
      expect(undonePatch?.id).toBe('patch-2');
      expect(history.getCurrentPatch()?.id).toBe('patch-2');
    });

    it('should not undo when no history', () => {
      const undonePatch = history.undo();
      expect(undonePatch).toBeNull();
    });

    it('should clear history', () => {
      history.addPatch({ ...mockPatch, id: 'patch-2' });
      expect(history.getHistory()).toHaveLength(2);

      history.clear();
      expect(history.getHistory()).toHaveLength(0);
      expect(history.getCurrentPatch()).toBeNull();
    });

    it('should track history correctly', () => {
      const patch2 = { ...mockPatch, id: 'patch-2' };
      const patch3 = { ...mockPatch, id: 'patch-3' };

      history.addPatch(patch2);
      history.addPatch(patch3);

      const historyList = history.getHistory();
      expect(historyList).toHaveLength(3);
      expect(historyList[0].id).toBe('test-patch-1');
      expect(historyList[1].id).toBe('patch-2');
      expect(historyList[2].id).toBe('patch-3');
    });
  });
});