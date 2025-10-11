/**
 * Rack Database Service
 * Handles caching and retrieval of parsed racks from Cosmos DB
 */

import { type ParsedRack, type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { getRacksContainer } from '@/lib/database/cosmos';
import logger from '@/lib/logger';
import { extractRackId } from '@/lib/scraper/modulargrid';

interface CachedRack {
  id: string; // ModularGrid rack ID (e.g., "2383104")
  partitionKey: string; // "public" for shared racks
  url: string;
  parsedData: ParsedRack;
  capabilities?: RackCapabilities;
  analysis?: RackAnalysis;
  cachedAt: Date;
  useCount: number;
  lastUsedAt: Date;
}

// Cache expiration time: 30 days
const CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Save a rack to the cache
 */
export async function saveRack(
  rack: ParsedRack,
  capabilities?: RackCapabilities,
  analysis?: RackAnalysis
): Promise<CachedRack> {
  try {
    const container = await getRacksContainer();

    // Extract rack ID from URL
    const rackId = extractRackId(rack.url);
    if (!rackId) {
      throw new Error('Invalid rack URL - cannot extract rack ID');
    }

    // Check if rack already exists
    const existingRack = await getRack(rackId);

    const cachedRack: CachedRack = {
      id: rackId,
      partitionKey: 'public', // All cached racks use 'public' partition
      url: rack.url,
      parsedData: rack,
      capabilities,
      analysis,
      cachedAt: existingRack?.cachedAt || new Date(),
      useCount: existingRack?.useCount || 0,
      lastUsedAt: new Date(),
    };

    const { resource } = await container.items.upsert(cachedRack);

    if (!resource) {
      throw new Error('Failed to save rack - no resource returned from database');
    }

    logger.info('Rack saved to cache', {
      rackId,
      url: rack.url,
      moduleCount: rack.modules.length,
      useCount: cachedRack.useCount,
      isUpdate: !!existingRack,
    });

    return resource as unknown as CachedRack;
  } catch (error) {
    logger.error('Failed to save rack', {
      url: rack.url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a rack from the cache by ID
 */
export async function getRack(rackId: string): Promise<CachedRack | null> {
  try {
    const container = await getRacksContainer();

    const { resource } = await container.item(rackId, 'public').read<CachedRack>();

    if (!resource) {
      logger.debug('Rack not found in cache', { rackId });
      return null;
    }

    // Check if cache is stale (older than 30 days)
    const cacheAge = Date.now() - new Date(resource.cachedAt).getTime();
    if (cacheAge > CACHE_EXPIRATION_MS) {
      logger.debug('Rack cache is stale', {
        rackId,
        cacheAge: `${Math.floor(cacheAge / (24 * 60 * 60 * 1000))} days`,
      });
      return null;
    }

    logger.debug('Rack retrieved from cache', {
      rackId,
      useCount: resource.useCount,
      cacheAge: `${Math.floor(cacheAge / (24 * 60 * 60 * 1000))} days`,
    });

    return resource;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      logger.debug('Rack not found in cache (404)', { rackId });
      return null;
    }

    logger.error('Failed to get rack', {
      rackId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a rack by URL
 */
export async function getRackByUrl(url: string): Promise<CachedRack | null> {
  const rackId = extractRackId(url);
  if (!rackId) {
    logger.warn('Invalid rack URL', { url });
    return null;
  }

  return getRack(rackId);
}

/**
 * List recent racks for random selection
 */
export async function listRecentRacks(limit: number = 100): Promise<CachedRack[]> {
  try {
    const container = await getRacksContainer();

    const query = `
      SELECT * FROM c
      WHERE c.partitionKey = "public"
      ORDER BY c.lastUsedAt DESC
      OFFSET 0 LIMIT @limit
    `;

    const { resources } = await container.items
      .query<CachedRack>({
        query,
        parameters: [{ name: '@limit', value: limit }],
      })
      .fetchAll();

    logger.debug('Recent racks retrieved', {
      count: resources.length,
      limit,
    });

    return resources;
  } catch (error) {
    logger.error('Failed to list recent racks', {
      limit,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * List popular racks by use count
 */
export async function listPopularRacks(limit: number = 50): Promise<CachedRack[]> {
  try {
    const container = await getRacksContainer();

    const query = `
      SELECT * FROM c
      WHERE c.partitionKey = "public"
      ORDER BY c.useCount DESC
      OFFSET 0 LIMIT @limit
    `;

    const { resources } = await container.items
      .query<CachedRack>({
        query,
        parameters: [{ name: '@limit', value: limit }],
      })
      .fetchAll();

    logger.debug('Popular racks retrieved', {
      count: resources.length,
      limit,
    });

    return resources;
  } catch (error) {
    logger.error('Failed to list popular racks', {
      limit,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Increment use count for a rack
 */
export async function incrementUseCount(rackId: string): Promise<void> {
  try {
    const container = await getRacksContainer();

    const rack = await getRack(rackId);
    if (!rack) {
      logger.warn('Cannot increment use count - rack not found', { rackId });
      return;
    }

    // Increment use count and update last used time
    rack.useCount += 1;
    rack.lastUsedAt = new Date();

    await container.items.upsert(rack);

    logger.debug('Rack use count incremented', {
      rackId,
      useCount: rack.useCount,
    });
  } catch (error) {
    logger.error('Failed to increment use count', {
      rackId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - this is not critical
  }
}

/**
 * Delete a rack from cache
 */
export async function deleteRack(rackId: string): Promise<void> {
  try {
    const container = await getRacksContainer();

    await container.item(rackId, 'public').delete();

    logger.info('Rack deleted from cache', { rackId });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      logger.debug('Rack not found for deletion (404)', { rackId });
      return;
    }

    logger.error('Failed to delete rack', {
      rackId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(): Promise<{
  totalRacks: number;
  totalUseCount: number;
  averageUseCount: number;
  mostPopular: { rackId: string; useCount: number; url: string }[];
}> {
  try {
    const container = await getRacksContainer();

    const query = 'SELECT * FROM c WHERE c.partitionKey = "public"';

    const { resources } = await container.items.query<CachedRack>({ query }).fetchAll();

    const totalUseCount = resources.reduce((sum, rack) => sum + rack.useCount, 0);
    const averageUseCount = resources.length > 0 ? totalUseCount / resources.length : 0;

    const mostPopular = resources
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 10)
      .map((rack) => ({
        rackId: rack.id,
        useCount: rack.useCount,
        url: rack.url,
      }));

    const stats = {
      totalRacks: resources.length,
      totalUseCount,
      averageUseCount: Math.round(averageUseCount * 100) / 100,
      mostPopular,
    };

    logger.debug('Cache statistics calculated', stats);

    return stats;
  } catch (error) {
    logger.error('Failed to get cache statistics', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Clean up stale cache entries
 */
export async function cleanupStaleCache(): Promise<number> {
  try {
    const container = await getRacksContainer();

    const query = 'SELECT * FROM c WHERE c.partitionKey = "public"';

    const { resources } = await container.items.query<CachedRack>({ query }).fetchAll();

    const now = Date.now();
    let deletedCount = 0;

    for (const rack of resources) {
      const cacheAge = now - new Date(rack.cachedAt).getTime();
      if (cacheAge > CACHE_EXPIRATION_MS) {
        await container.item(rack.id, 'public').delete();
        deletedCount++;
      }
    }

    logger.info('Stale cache cleanup completed', {
      totalRacks: resources.length,
      deletedCount,
    });

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup stale cache', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
