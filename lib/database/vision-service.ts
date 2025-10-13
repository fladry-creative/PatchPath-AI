/**
 * Database service for vision analyses and module corrections
 */

import { CosmosClient, type Container } from '@azure/cosmos';
import { type RackVisionAnalysis, type VisionModule } from '@/lib/vision/rack-analyzer';
import logger from '@/lib/logger';

const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseName = process.env.COSMOS_DATABASE || 'patchpath';

let client: CosmosClient | null = null;
let visionAnalysesContainer: Container | null = null;
let moduleCorrectionsContainer: Container | null = null;

/**
 * Initialize Cosmos DB client and containers
 */
function initializeClient() {
  if (!client) {
    if (!endpoint || !key) {
      logger.warn('⚠️ Cosmos DB not configured - vision database features disabled');
      return null;
    }

    client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseName);

    visionAnalysesContainer = database.container('vision_analyses');
    moduleCorrectionsContainer = database.container('module_corrections');

    logger.info('✅ Vision database service initialized');
  }
  return client;
}

/**
 * Vision Analysis Document
 */
export interface VisionAnalysisDocument {
  id: string;
  partitionKey: string; // userId
  userId: string;
  analysisDate: string;
  imageMetadata: {
    size: number;
    type: string;
  };
  analysis: RackVisionAnalysis;
  modules: VisionModule[];
  corrections: number; // Number of corrections made
  createdAt: string;
  updatedAt: string;
}

/**
 * Module Correction Document
 */
export interface ModuleCorrectionDocument {
  id: string;
  partitionKey: string; // userId
  userId: string;
  analysisId: string;
  moduleIndex: number;
  originalModule: VisionModule;
  correctedModule: VisionModule;
  correctionType: 'edit' | 'delete' | 'add';
  createdAt: string;
}

/**
 * Save vision analysis to database
 */
export async function saveVisionAnalysis(
  userId: string,
  analysis: RackVisionAnalysis,
  imageMetadata: { size: number; type: string }
): Promise<string> {
  try {
    initializeClient();

    if (!visionAnalysesContainer) {
      logger.warn('⚠️ Vision analyses container not available');
      return '';
    }

    const id = `vision_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const document: VisionAnalysisDocument = {
      id,
      partitionKey: userId,
      userId,
      analysisDate: new Date().toISOString(),
      imageMetadata,
      analysis,
      modules: analysis.modules,
      corrections: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await visionAnalysesContainer.items.create(document);

    logger.info('💾 Vision analysis saved', {
      analysisId: id,
      userId,
      moduleCount: analysis.modules.length,
    });

    return id;
  } catch (error) {
    logger.error('❌ Failed to save vision analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return '';
  }
}

/**
 * Get vision analysis by ID
 */
export async function getVisionAnalysis(
  analysisId: string,
  userId: string
): Promise<VisionAnalysisDocument | null> {
  try {
    initializeClient();

    if (!visionAnalysesContainer) {
      return null;
    }

    const { resource } = await visionAnalysesContainer.item(analysisId, userId).read();
    return resource || null;
  } catch (error) {
    logger.error('❌ Failed to get vision analysis', {
      analysisId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * List user's vision analyses
 */
export async function listUserVisionAnalyses(
  userId: string,
  limit: number = 20
): Promise<VisionAnalysisDocument[]> {
  try {
    initializeClient();

    if (!visionAnalysesContainer) {
      return [];
    }

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: userId }],
    };

    const { resources } = await visionAnalysesContainer.items
      .query(querySpec, { maxItemCount: limit })
      .fetchAll();

    return resources;
  } catch (error) {
    logger.error('❌ Failed to list vision analyses', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Save module correction
 */
export async function saveModuleCorrection(
  userId: string,
  analysisId: string,
  moduleIndex: number,
  originalModule: VisionModule,
  correctedModule: VisionModule,
  correctionType: 'edit' | 'delete' | 'add'
): Promise<boolean> {
  try {
    initializeClient();

    if (!moduleCorrectionsContainer || !visionAnalysesContainer) {
      logger.warn('⚠️ Module corrections container not available');
      return false;
    }

    const id = `correction_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const document: ModuleCorrectionDocument = {
      id,
      partitionKey: userId,
      userId,
      analysisId,
      moduleIndex,
      originalModule,
      correctedModule,
      correctionType,
      createdAt: new Date().toISOString(),
    };

    await moduleCorrectionsContainer.items.create(document);

    // Update correction count in analysis
    const analysis = await getVisionAnalysis(analysisId, userId);
    if (analysis) {
      analysis.corrections += 1;
      analysis.updatedAt = new Date().toISOString();
      await visionAnalysesContainer.item(analysisId, userId).replace(analysis);
    }

    logger.info('✅ Module correction saved', {
      correctionId: id,
      analysisId,
      correctionType,
    });

    return true;
  } catch (error) {
    logger.error('❌ Failed to save module correction', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get corrections for an analysis
 */
export async function getAnalysisCorrections(
  analysisId: string,
  userId: string
): Promise<ModuleCorrectionDocument[]> {
  try {
    initializeClient();

    if (!moduleCorrectionsContainer) {
      return [];
    }

    const querySpec = {
      query:
        'SELECT * FROM c WHERE c.analysisId = @analysisId AND c.userId = @userId ORDER BY c.createdAt ASC',
      parameters: [
        { name: '@analysisId', value: analysisId },
        { name: '@userId', value: userId },
      ],
    };

    const { resources } = await moduleCorrectionsContainer.items.query(querySpec).fetchAll();

    return resources;
  } catch (error) {
    logger.error('❌ Failed to get analysis corrections', {
      analysisId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Get correction statistics for improving ML
 */
export async function getCorrectionStatistics(): Promise<{
  totalCorrections: number;
  correctionsByType: Record<string, number>;
  mostCorrectedModules: Array<{ name: string; count: number }>;
}> {
  try {
    initializeClient();

    if (!moduleCorrectionsContainer) {
      return {
        totalCorrections: 0,
        correctionsByType: {},
        mostCorrectedModules: [],
      };
    }

    const { resources } = await moduleCorrectionsContainer.items
      .query('SELECT * FROM c')
      .fetchAll();

    const totalCorrections = resources.length;
    const correctionsByType: Record<string, number> = {};
    const moduleCounts: Record<string, number> = {};

    resources.forEach((correction: ModuleCorrectionDocument) => {
      // Count by type
      correctionsByType[correction.correctionType] =
        (correctionsByType[correction.correctionType] || 0) + 1;

      // Count by module
      const moduleName = correction.originalModule.name;
      moduleCounts[moduleName] = (moduleCounts[moduleName] || 0) + 1;
    });

    // Get top 10 most corrected modules
    const mostCorrectedModules = Object.entries(moduleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCorrections,
      correctionsByType,
      mostCorrectedModules,
    };
  } catch (error) {
    logger.error('❌ Failed to get correction statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      totalCorrections: 0,
      correctionsByType: {},
      mostCorrectedModules: [],
    };
  }
}

/**
 * Check if vision database is configured
 */
export function isVisionDatabaseConfigured(): boolean {
  return !!(endpoint && key);
}
