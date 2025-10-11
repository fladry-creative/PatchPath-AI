/**
 * Module Database Service
 * CRUD operations for module catalog with smart caching and duplicate detection
 */

import { type Module } from '@/types/module';
import { getModulesContainer, isCosmosConfigured } from './cosmos';

export interface ModuleDocument extends Module {
  id: string; // Cosmos DB unique identifier
  partitionKey: string; // manufacturer for partitioning
  createdAt: string;
  updatedAt: string;
  source: 'vision' | 'manual' | 'enrichment' | 'community';
  confidence: number;
  verifiedBy?: string[]; // User IDs who verified this module
  usageCount: number; // How many times this module appears in racks
}

/**
 * Generate module ID from name and manufacturer
 * Removes illegal Cosmos DB characters: / \ # ?
 */
function generateModuleId(name: string, manufacturer: string): string {
  const cleanManufacturer = manufacturer
    .toLowerCase()
    .replace(/[\\/# ?]/g, '-') // Replace illegal chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/-+/g, '-'); // Collapse multiple dashes

  const cleanName = name
    .toLowerCase()
    .replace(/[\\/# ?]/g, '-') // Replace illegal chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/-+/g, '-'); // Collapse multiple dashes

  return `${cleanManufacturer}_${cleanName}`;
}

/**
 * Create or update module in database
 */
export async function upsertModule(
  module: Partial<Module>,
  source: ModuleDocument['source'] = 'vision',
  confidence: number = 0.8
): Promise<ModuleDocument> {
  if (!isCosmosConfigured()) {
    throw new Error('Cosmos DB not configured');
  }

  const container = await getModulesContainer();

  const moduleId = generateModuleId(module.name!, module.manufacturer!);
  const now = new Date().toISOString();

  // Destructure to exclude id if present in module
  const { id: _id, ...moduleData } = module as Module;

  const moduleDoc: ModuleDocument = {
    ...moduleData,
    id: moduleId,
    partitionKey: module.manufacturer!,
    createdAt: now,
    updatedAt: now,
    source,
    confidence,
    usageCount: 1,
  };

  const { resource } = await container.items.upsert(moduleDoc);

  if (!resource) {
    throw new Error('Failed to upsert module: no resource returned');
  }

  return resource as unknown as ModuleDocument;
}

/**
 * Find module by name and manufacturer (exact match)
 */
export async function findModule(
  name: string,
  manufacturer: string
): Promise<ModuleDocument | null> {
  if (!isCosmosConfigured()) {
    return null;
  }

  const container = await getModulesContainer();
  const moduleId = generateModuleId(name, manufacturer);

  try {
    const { resource } = await container.item(moduleId, manufacturer).read<ModuleDocument>();
    return resource || null;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fuzzy search for modules (handles slight variations)
 */
export async function searchModules(
  query: string,
  manufacturer?: string
): Promise<ModuleDocument[]> {
  if (!isCosmosConfigured()) {
    return [];
  }

  const container = await getModulesContainer();

  const querySpec = {
    query: manufacturer
      ? `SELECT * FROM c WHERE CONTAINS(LOWER(c.name), LOWER(@query)) AND LOWER(c.manufacturer) = LOWER(@manufacturer)`
      : `SELECT * FROM c WHERE CONTAINS(LOWER(c.name), LOWER(@query))`,
    parameters: manufacturer
      ? [
          { name: '@query', value: query },
          { name: '@manufacturer', value: manufacturer },
        ]
      : [{ name: '@query', value: query }],
  };

  const { resources } = await container.items.query<ModuleDocument>(querySpec).fetchAll();
  return resources;
}

/**
 * Get popular modules (most used in racks)
 */
export async function getPopularModules(limit: number = 50): Promise<ModuleDocument[]> {
  if (!isCosmosConfigured()) {
    return [];
  }

  const container = await getModulesContainer();

  const querySpec = {
    query: `SELECT TOP @limit * FROM c ORDER BY c.usageCount DESC`,
    parameters: [{ name: '@limit', value: limit }],
  };

  const { resources } = await container.items.query<ModuleDocument>(querySpec).fetchAll();
  return resources;
}

/**
 * Increment module usage count
 */
export async function incrementModuleUsage(moduleId: string, manufacturer: string): Promise<void> {
  if (!isCosmosConfigured()) {
    return;
  }

  const container = await getModulesContainer();

  try {
    const { resource: moduleData } = await container
      .item(moduleId, manufacturer)
      .read<ModuleDocument>();
    if (moduleData) {
      moduleData.usageCount = (moduleData.usageCount || 0) + 1;
      moduleData.updatedAt = new Date().toISOString();
      await container.item(moduleId, manufacturer).replace(moduleData);
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 404) {
      throw error;
    }
  }
}

/**
 * Batch upsert modules (for initial seeding or bulk imports)
 */
export async function batchUpsertModules(
  modules: Partial<Module>[],
  source: ModuleDocument['source'] = 'vision'
): Promise<ModuleDocument[]> {
  if (!isCosmosConfigured()) {
    throw new Error('Cosmos DB not configured');
  }

  const results: ModuleDocument[] = [];

  // Process in parallel with rate limiting
  const chunks = [];
  for (let i = 0; i < modules.length; i += 10) {
    chunks.push(modules.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const promises = chunk.map((module) => upsertModule(module, source, 0.8));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);

    // Rate limit: wait 100ms between chunks
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get module statistics
 */
export async function getModuleStats(): Promise<{
  totalModules: number;
  byManufacturer: Record<string, number>;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  avgConfidence: number;
}> {
  if (!isCosmosConfigured()) {
    return {
      totalModules: 0,
      byManufacturer: {},
      byType: {},
      bySource: {},
      avgConfidence: 0,
    };
  }

  const container = await getModulesContainer();

  const { resources: modules } = await container.items
    .query<ModuleDocument>('SELECT * FROM c')
    .fetchAll();

  const stats = {
    totalModules: modules.length,
    byManufacturer: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    avgConfidence: 0,
  };

  let totalConfidence = 0;

  for (const moduleData of modules) {
    // Manufacturer stats
    stats.byManufacturer[moduleData.manufacturer] =
      (stats.byManufacturer[moduleData.manufacturer] || 0) + 1;

    // Type stats
    stats.byType[moduleData.type] = (stats.byType[moduleData.type] || 0) + 1;

    // Source stats
    stats.bySource[moduleData.source] = (stats.bySource[moduleData.source] || 0) + 1;

    // Confidence
    totalConfidence += moduleData.confidence || 0;
  }

  stats.avgConfidence = modules.length > 0 ? totalConfidence / modules.length : 0;

  return stats;
}

/**
 * Verify module (community validation)
 */
export async function verifyModule(
  moduleId: string,
  manufacturer: string,
  userId: string
): Promise<ModuleDocument | null> {
  if (!isCosmosConfigured()) {
    return null;
  }

  const container = await getModulesContainer();

  try {
    const { resource: moduleData } = await container
      .item(moduleId, manufacturer)
      .read<ModuleDocument>();
    if (moduleData) {
      moduleData.verifiedBy = moduleData.verifiedBy || [];
      if (!moduleData.verifiedBy.includes(userId)) {
        moduleData.verifiedBy.push(userId);
        moduleData.confidence = Math.min(1.0, moduleData.confidence + 0.05); // Boost confidence with verification
        moduleData.updatedAt = new Date().toISOString();

        const { resource: updated } = await container
          .item(moduleId, manufacturer)
          .replace(moduleData);
        return updated as ModuleDocument;
      }
      return moduleData;
    }
    return null;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      return null;
    }
    throw error;
  }
}
