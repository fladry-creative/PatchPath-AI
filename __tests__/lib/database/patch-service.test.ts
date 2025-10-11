/**
 * Patch Service Tests
 * Tests CRUD operations for patches in Cosmos DB
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  savePatch,
  getPatch,
  listUserPatches,
  updatePatch,
  deletePatch,
  toggleFavorite,
  searchPatches,
  getPatchesByRack,
  updatePatchRating,
  getPatchStatistics,
} from '@/lib/database/patch-service';
import { type Patch } from '@/types/patch';
import { v4 as uuidv4 } from 'uuid';

// Test data
const TEST_USER_ID = `test-user-${  uuidv4()}`;
const TEST_RACK_ID = 'test-rack-123';

function createTestPatch(overrides?: Partial<Patch>): Patch {
  return {
    id: uuidv4(),
    userId: TEST_USER_ID,
    rackId: TEST_RACK_ID,
    metadata: {
      title: 'Test Patch',
      description: 'A test patch for unit testing',
      difficulty: 'intermediate',
      estimatedTime: 15,
      techniques: ['FM', 'subtractive'],
      genres: ['ambient', 'experimental'],
      userIntent: 'Create ambient soundscape',
    },
    connections: [
      {
        id: 'conn-1',
        from: {
          moduleId: 'mod-1',
          moduleName: 'VCO',
          outputName: 'Out',
        },
        to: {
          moduleId: 'mod-2',
          moduleName: 'VCF',
          inputName: 'In',
        },
        signalType: 'audio',
        importance: 'primary',
      },
    ],
    patchingOrder: ['conn-1'],
    parameterSuggestions: [
      {
        moduleId: 'mod-1',
        moduleName: 'VCO',
        parameter: 'Frequency',
        value: '12 o\'clock',
        reasoning: 'Start at middle frequency',
      },
    ],
    whyThisWorks: 'This creates a classic subtractive synthesis voice',
    tips: ['Start with the VCO tuned to concert pitch', 'Adjust filter cutoff slowly'],
    createdAt: new Date(),
    updatedAt: new Date(),
    saved: false,
    tags: ['test', 'ambient'],
    ...overrides,
  };
}

describe('Patch Service', () => {
  let testPatches: Patch[] = [];

  beforeEach(() => {
    testPatches = [];
  });

  afterAll(async () => {
    // Cleanup: Delete all test patches
    console.log('Cleaning up test patches...');
    for (const patch of testPatches) {
      try {
        await deletePatch(patch.id, patch.userId, true);
      } catch (error) {
        console.warn('Failed to delete test patch:', patch.id);
      }
    }
  });

  describe('savePatch', () => {
    it('should save a new patch to the database', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      expect(saved.id).toBe(patch.id);
      expect(saved.userId).toBe(patch.userId);
      expect(saved.metadata.title).toBe(patch.metadata.title);
      expect(saved.connections).toHaveLength(1);
    });

    it('should update an existing patch with upsert', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      // Update the patch
      const updated = await savePatch({
        ...saved,
        metadata: {
          ...saved.metadata,
          title: 'Updated Test Patch',
        },
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.metadata.title).toBe('Updated Test Patch');
    });

    it('should set timestamps correctly', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPatch', () => {
    it('should retrieve a patch by ID', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const retrieved = await getPatch(saved.id, TEST_USER_ID);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(saved.id);
      expect(retrieved?.metadata.title).toBe(saved.metadata.title);
    });

    it('should return null for non-existent patch', async () => {
      const retrieved = await getPatch('non-existent-id', TEST_USER_ID);
      expect(retrieved).toBeNull();
    });

    it('should return null for patch with wrong userId', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const retrieved = await getPatch(saved.id, 'wrong-user-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('listUserPatches', () => {
    beforeAll(async () => {
      // Create multiple test patches
      const patches = [
        createTestPatch({ metadata: { ...createTestPatch().metadata, title: 'Patch 1' } }),
        createTestPatch({
          metadata: { ...createTestPatch().metadata, title: 'Patch 2' },
          saved: true,
        }),
        createTestPatch({ metadata: { ...createTestPatch().metadata, title: 'Patch 3' } }),
      ];

      for (const patch of patches) {
        const saved = await savePatch(patch);
        testPatches.push(saved);
      }
    });

    it('should list all patches for a user', async () => {
      const patches = await listUserPatches(TEST_USER_ID);
      expect(patches.length).toBeGreaterThanOrEqual(3);
    });

    it('should respect pagination limit', async () => {
      const patches = await listUserPatches(TEST_USER_ID, { limit: 2 });
      expect(patches.length).toBeLessThanOrEqual(2);
    });

    it('should filter saved patches only', async () => {
      const patches = await listUserPatches(TEST_USER_ID, { savedOnly: true });
      expect(patches.every((p) => p.saved)).toBe(true);
    });
  });

  describe('updatePatch', () => {
    it('should update patch fields', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await updatePatch(saved.id, TEST_USER_ID, {
        metadata: {
          ...saved.metadata,
          title: 'Updated Title',
        },
        tags: ['updated', 'test'],
      });

      expect(updated.metadata.title).toBe('Updated Title');
      expect(updated.tags).toContain('updated');
    });

    it('should throw error for non-existent patch', async () => {
      await expect(
        updatePatch('non-existent-id', TEST_USER_ID, { tags: ['test'] })
      ).rejects.toThrow();
    });

    it('should preserve ID and userId', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await updatePatch(saved.id, TEST_USER_ID, {
        metadata: {
          ...saved.metadata,
          title: 'New Title',
        },
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.userId).toBe(TEST_USER_ID);
    });
  });

  describe('deletePatch', () => {
    it('should soft delete a patch', async () => {
      const patch = createTestPatch({ saved: true });
      const saved = await savePatch(patch);
      testPatches.push(saved);

      await deletePatch(saved.id, TEST_USER_ID, false);

      const retrieved = await getPatch(saved.id, TEST_USER_ID);
      expect(retrieved?.saved).toBe(false);
    });

    it('should hard delete a patch', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);

      await deletePatch(saved.id, TEST_USER_ID, true);

      const retrieved = await getPatch(saved.id, TEST_USER_ID);
      expect(retrieved).toBeNull();
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle saved status to true', async () => {
      const patch = createTestPatch({ saved: false });
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await toggleFavorite(saved.id, TEST_USER_ID, true);
      expect(updated.saved).toBe(true);
    });

    it('should toggle saved status to false', async () => {
      const patch = createTestPatch({ saved: true });
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await toggleFavorite(saved.id, TEST_USER_ID, false);
      expect(updated.saved).toBe(false);
    });
  });

  describe('searchPatches', () => {
    beforeAll(async () => {
      const patches = [
        createTestPatch({
          metadata: {
            ...createTestPatch().metadata,
            title: 'Ambient Drone Patch',
            techniques: ['drone', 'ambient'],
          },
        }),
        createTestPatch({
          metadata: {
            ...createTestPatch().metadata,
            title: 'Techno Bassline',
            genres: ['techno'],
          },
        }),
      ];

      for (const patch of patches) {
        const saved = await savePatch(patch);
        testPatches.push(saved);
      }
    });

    it('should search by title', async () => {
      const results = await searchPatches(TEST_USER_ID, 'ambient');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by technique', async () => {
      const results = await searchPatches(TEST_USER_ID, 'drone');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by genre', async () => {
      const results = await searchPatches(TEST_USER_ID, 'techno');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getPatchesByRack', () => {
    it('should get all patches for a specific rack', async () => {
      const rackId = `specific-rack-${  uuidv4()}`;
      const patches = [
        createTestPatch({ rackId }),
        createTestPatch({ rackId }),
        createTestPatch({ rackId: 'other-rack' }),
      ];

      for (const patch of patches) {
        const saved = await savePatch(patch);
        testPatches.push(saved);
      }

      const results = await getPatchesByRack(TEST_USER_ID, rackId);
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every((p) => p.rackId === rackId)).toBe(true);
    });
  });

  describe('updatePatchRating', () => {
    it('should update patch rating and notes', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await updatePatchRating(
        saved.id,
        TEST_USER_ID,
        'loved',
        'This patch is amazing!'
      );

      expect(updated.userRating).toBe('loved');
      expect(updated.userNotes).toBe('This patch is amazing!');
      expect(updated.triedAt).toBeInstanceOf(Date);
    });

    it('should update rating without notes', async () => {
      const patch = createTestPatch();
      const saved = await savePatch(patch);
      testPatches.push(saved);

      const updated = await updatePatchRating(saved.id, TEST_USER_ID, 'meh');

      expect(updated.userRating).toBe('meh');
      expect(updated.triedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPatchStatistics', () => {
    beforeAll(async () => {
      const patches = [
        createTestPatch({ saved: true, userRating: 'loved' }),
        createTestPatch({ saved: true, triedAt: new Date() }),
        createTestPatch({ saved: false }),
      ];

      for (const patch of patches) {
        const saved = await savePatch(patch);
        testPatches.push(saved);
      }
    });

    it('should calculate statistics correctly', async () => {
      const stats = await getPatchStatistics(TEST_USER_ID);

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.saved).toBeGreaterThan(0);
      expect(stats.techniques).toBeDefined();
      expect(stats.genres).toBeDefined();
    });

    it('should count techniques and genres', async () => {
      const stats = await getPatchStatistics(TEST_USER_ID);

      expect(Object.keys(stats.techniques).length).toBeGreaterThan(0);
      expect(Object.keys(stats.genres).length).toBeGreaterThan(0);
    });
  });
});
