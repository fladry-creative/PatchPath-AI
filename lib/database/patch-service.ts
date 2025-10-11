/**
 * Patch Database Service
 * Handles CRUD operations for patches in Cosmos DB
 */

import { type Patch } from '@/types/patch';
import { getPatchesContainer } from '@/lib/database/cosmos';
import logger from '@/lib/logger';

interface PatchDocument extends Patch {
  partitionKey: string; // userId for efficient queries
}

/**
 * Save a patch to the database
 */
export async function savePatch(patch: Patch): Promise<Patch> {
  try {
    const container = await getPatchesContainer();

    const patchDoc: PatchDocument = {
      ...patch,
      partitionKey: patch.userId,
      createdAt: patch.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const { resource } = await container.items.upsert(patchDoc);

    if (!resource) {
      throw new Error('Failed to save patch - no resource returned from database');
    }

    logger.info('Patch saved to database', {
      patchId: patch.id,
      userId: patch.userId,
      connectionCount: patch.connections.length,
      saved: patch.saved,
    });

    // Remove internal Cosmos DB fields and return as Patch
    const { partitionKey: _partitionKey, ...savedPatch } = resource as unknown as PatchDocument;
    return savedPatch as Patch;
  } catch (error) {
    logger.error('Failed to save patch', {
      patchId: patch.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a single patch by ID
 */
export async function getPatch(id: string, userId: string): Promise<Patch | null> {
  try {
    const container = await getPatchesContainer();

    const { resource } = await container.item(id, userId).read<PatchDocument>();

    if (!resource) {
      logger.debug('Patch not found', { patchId: id, userId });
      return null;
    }

    logger.debug('Patch retrieved', { patchId: id, userId });

    // Remove internal fields
    const { partitionKey, ...patch } = resource;
    return patch as Patch;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      logger.debug('Patch not found (404)', { patchId: id, userId });
      return null;
    }

    logger.error('Failed to get patch', {
      patchId: id,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * List all patches for a user with pagination
 */
export async function listUserPatches(
  userId: string,
  options?: { limit?: number; offset?: number; savedOnly?: boolean }
): Promise<Patch[]> {
  try {
    const container = await getPatchesContainer();
    const { limit = 50, offset = 0, savedOnly = false } = options || {};

    let query = 'SELECT * FROM c WHERE c.partitionKey = @userId';

    if (savedOnly) {
      query += ' AND c.saved = true';
    }

    query += ' ORDER BY c.createdAt DESC';
    query += ` OFFSET ${offset} LIMIT ${limit}`;

    const { resources } = await container.items
      .query<PatchDocument>({
        query,
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    logger.debug('User patches retrieved', {
      userId,
      count: resources.length,
      limit,
      offset,
      savedOnly,
    });

    // Remove internal fields
    return resources.map(({ partitionKey, ...patch }) => patch as Patch);
  } catch (error) {
    logger.error('Failed to list user patches', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update a patch
 */
export async function updatePatch(
  id: string,
  userId: string,
  updates: Partial<Patch>
): Promise<Patch> {
  try {
    const container = await getPatchesContainer();

    // Get existing patch
    const existing = await getPatch(id, userId);
    if (!existing) {
      throw new Error('Patch not found');
    }

    // Merge updates
    const updatedPatch: Patch = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      userId, // Ensure userId doesn't change
      updatedAt: new Date(),
    };

    const patchDoc: PatchDocument = {
      ...updatedPatch,
      partitionKey: userId,
    };

    const { resource } = await container.items.upsert(patchDoc);

    if (!resource) {
      throw new Error('Failed to update patch - no resource returned from database');
    }

    logger.info('Patch updated', {
      patchId: id,
      userId,
      updatedFields: Object.keys(updates),
    });

    const { partitionKey: _partitionKey2, ...patch } = resource as unknown as PatchDocument;
    return patch as Patch;
  } catch (error) {
    logger.error('Failed to update patch', {
      patchId: id,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Delete a patch (soft delete by default)
 */
export async function deletePatch(
  id: string,
  userId: string,
  hardDelete: boolean = false
): Promise<void> {
  try {
    const container = await getPatchesContainer();

    if (hardDelete) {
      // Hard delete - actually remove from database
      await container.item(id, userId).delete();
      logger.info('Patch hard deleted', { patchId: id, userId });
    } else {
      // Soft delete - mark as deleted but keep in database
      await updatePatch(id, userId, {
        saved: false,
        updatedAt: new Date(),
      });
      logger.info('Patch soft deleted', { patchId: id, userId });
    }
  } catch (error) {
    logger.error('Failed to delete patch', {
      patchId: id,
      userId,
      hardDelete,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Toggle favorite/saved status
 */
export async function toggleFavorite(
  id: string,
  userId: string,
  favorite: boolean
): Promise<Patch> {
  try {
    const patch = await updatePatch(id, userId, { saved: favorite });

    logger.info('Patch favorite toggled', {
      patchId: id,
      userId,
      favorite,
    });

    return patch;
  } catch (error) {
    logger.error('Failed to toggle favorite', {
      patchId: id,
      userId,
      favorite,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Search patches by text
 */
export async function searchPatches(userId: string, searchQuery: string): Promise<Patch[]> {
  try {
    const container = await getPatchesContainer();

    // Search in title, description, techniques, genres
    const query = `
      SELECT * FROM c
      WHERE c.partitionKey = @userId
      AND (
        CONTAINS(LOWER(c.metadata.title), @query)
        OR CONTAINS(LOWER(c.metadata.description), @query)
        OR CONTAINS(LOWER(c.metadata.userIntent), @query)
        OR ARRAY_CONTAINS(c.metadata.techniques, @query, true)
        OR ARRAY_CONTAINS(c.metadata.genres, @query, true)
        OR ARRAY_CONTAINS(c.tags, @query, true)
      )
      ORDER BY c.createdAt DESC
    `;

    const { resources } = await container.items
      .query<PatchDocument>({
        query,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@query', value: searchQuery.toLowerCase() },
        ],
      })
      .fetchAll();

    logger.debug('Patches searched', {
      userId,
      query: searchQuery,
      resultCount: resources.length,
    });

    return resources.map(({ partitionKey, ...patch }) => patch as Patch);
  } catch (error) {
    logger.error('Failed to search patches', {
      userId,
      query: searchQuery,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get patches by rack ID
 */
export async function getPatchesByRack(userId: string, rackId: string): Promise<Patch[]> {
  try {
    const container = await getPatchesContainer();

    const query = `
      SELECT * FROM c
      WHERE c.partitionKey = @userId
      AND c.rackId = @rackId
      ORDER BY c.createdAt DESC
    `;

    const { resources } = await container.items
      .query<PatchDocument>({
        query,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@rackId', value: rackId },
        ],
      })
      .fetchAll();

    logger.debug('Patches by rack retrieved', {
      userId,
      rackId,
      count: resources.length,
    });

    return resources.map(({ partitionKey, ...patch }) => patch as Patch);
  } catch (error) {
    logger.error('Failed to get patches by rack', {
      userId,
      rackId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update user rating for a patch
 */
export async function updatePatchRating(
  id: string,
  userId: string,
  rating: 'loved' | 'meh' | 'disaster',
  notes?: string
): Promise<Patch> {
  try {
    const updates: Partial<Patch> = {
      userRating: rating,
      triedAt: new Date(),
    };

    if (notes) {
      updates.userNotes = notes;
    }

    const patch = await updatePatch(id, userId, updates);

    logger.info('Patch rating updated', {
      patchId: id,
      userId,
      rating,
      hasNotes: !!notes,
    });

    return patch;
  } catch (error) {
    logger.error('Failed to update patch rating', {
      patchId: id,
      userId,
      rating,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get patch statistics for a user
 */
export async function getPatchStatistics(userId: string): Promise<{
  total: number;
  saved: number;
  tried: number;
  loved: number;
  techniques: Record<string, number>;
  genres: Record<string, number>;
}> {
  try {
    const patches = await listUserPatches(userId, { limit: 1000 });

    const stats = {
      total: patches.length,
      saved: patches.filter((p) => p.saved).length,
      tried: patches.filter((p) => p.triedAt).length,
      loved: patches.filter((p) => p.userRating === 'loved').length,
      techniques: {} as Record<string, number>,
      genres: {} as Record<string, number>,
    };

    // Count techniques and genres
    patches.forEach((patch) => {
      patch.metadata.techniques.forEach((tech) => {
        stats.techniques[tech] = (stats.techniques[tech] || 0) + 1;
      });
      patch.metadata.genres.forEach((genre) => {
        stats.genres[genre] = (stats.genres[genre] || 0) + 1;
      });
    });

    logger.debug('Patch statistics calculated', { userId, ...stats });

    return stats;
  } catch (error) {
    logger.error('Failed to get patch statistics', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
