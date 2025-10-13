/**
 * MCP READ TOOLS
 *
 * Tools for querying the PatchPath knowledge base.
 * AI assistants use these to ACCESS existing knowledge.
 */

import { searchModules as dbSearchModules, findModule } from '../../lib/database/module-service.js';
import { parseRackUrl } from '../../lib/scraper/url-parser.js';
import { fetchRackImage } from '../../lib/scraper/image-fetcher.js';
import { analyzeRackImage } from '../../lib/vision/rack-analyzer.js';
import { analyzeRackCapabilities } from '../../lib/scraper/analyzer.js';
import { generatePatch } from '../../lib/ai/claude.js';
import { saveRack } from '../../lib/database/rack-service.js';
import { type Module } from '../../types/module.js';
import { type ParsedRack } from '../../types/rack.js';
import logger from '../../lib/logger.js';

/**
 * Search for modules by query
 */
export async function searchModules(args: {
  query: string;
  manufacturer?: string;
  type?: string;
  limit?: number;
}) {
  const { query, manufacturer, type, limit = 20 } = args;

  logger.info('🔍 MCP: Searching modules', { query, manufacturer, type, limit });

  // Search database
  const results = await dbSearchModules(query, manufacturer);

  // Filter by type if specified
  const filtered = type
    ? results.filter((m) => m.type.toLowerCase() === type.toLowerCase())
    : results;

  // Format response
  const response = {
    query,
    filters: { manufacturer, type },
    resultCount: filtered.length,
    modules: filtered.slice(0, limit).map((m) => ({
      id: m.id,
      name: m.name,
      manufacturer: m.manufacturer,
      type: m.type,
      hp: m.hp,
      confidence: m.confidence,
      usageCount: m.usageCount || 0,
      verifiedBy: m.verifiedBy?.length || 0,
      source: m.source,
    })),
  };

  logger.info('✅ MCP: Search complete', {
    resultCount: response.resultCount,
  });

  return response;
}

/**
 * Get detailed information about a specific module
 */
export async function getModuleDetails(args: { moduleId: string }) {
  const { moduleId } = args;

  logger.info('🔍 MCP: Getting module details', { moduleId });

  // Parse moduleId - could be direct ID or "manufacturer_name" format
  const [manufacturer, name] = moduleId.includes('_') ? moduleId.split('_') : [undefined, moduleId];

  const foundModule = manufacturer
    ? await findModule(name, manufacturer)
    : await findModule(moduleId, '');

  if (!foundModule) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  const response = {
    id: foundModule.id,
    name: foundModule.name,
    manufacturer: foundModule.manufacturer,
    type: foundModule.type,
    hp: foundModule.hp,
    description: foundModule.description || 'No description available',
    inputs: foundModule.inputs || [],
    outputs: foundModule.outputs || [],
    confidence: foundModule.confidence,
    source: foundModule.source,
    usageCount: foundModule.usageCount || 0,
    verifiedBy: foundModule.verifiedBy || [],
    createdAt: foundModule.createdAt,
    updatedAt: foundModule.updatedAt,
  };

  logger.info('✅ MCP: Module details retrieved', {
    moduleId,
    name: foundModule.name,
  });

  return response;
}

/**
 * Analyze a rack from URL
 */
export async function analyzeRackFromUrl(args: { url: string }) {
  const { url } = args;

  logger.info('🔍 MCP: Analyzing rack', { url });

  // Parse URL
  const rackInput = parseRackUrl(url);

  // Fetch image from CDN
  const imageResult = await fetchRackImage(rackInput.cdnUrl);

  // Vision analysis
  const visionResult = await analyzeRackImage(imageResult.buffer, 'image/jpeg');

  // Convert VisionModule to Module type
  const modules: Module[] = visionResult.modules.map((vm) => ({
    id: vm.id || `${vm.manufacturer}_${vm.name}`,
    name: vm.name,
    manufacturer: vm.manufacturer || 'Unknown',
    type: vm.type || 'Other',
    hp: vm.hp || 0,
    position: vm.position?.x || 0,
    row: vm.position?.row || 0,
    inputs: [],
    outputs: [],
    confidence: vm.confidence,
    source: 'vision',
  }));

  // Analyze capabilities
  const capabilities = analyzeRackCapabilities(modules);

  // Generate summary
  const summary = `Rack contains ${modules.length} modules. ${capabilities.isVideoRack ? 'Video synthesis rack detected.' : 'Audio synthesis rack.'}`;

  // Save to cache
  await saveRack(
    {
      url: rackInput.pageUrl || rackInput.cdnUrl,
      modules,
      metadata: {
        rackId: rackInput.rackId,
        rackName: `Rack ${rackInput.rackId}`,
      },
      rows: [],
    },
    capabilities
  );

  const response = {
    rackId: rackInput.rackId,
    url: rackInput.pageUrl,
    cdnUrl: rackInput.cdnUrl,
    moduleCount: visionResult.modules.length,
    modules: visionResult.modules,
    capabilities,
    summary,
    isVideoRack: capabilities.isVideoRack,
    isHybridRack: capabilities.isHybridRack,
  };

  logger.info('✅ MCP: Rack analysis complete', {
    rackId: rackInput.rackId,
    moduleCount: response.moduleCount,
    isVideo: response.isVideoRack,
    isHybrid: response.isHybridRack,
  });

  return response;
}

/**
 * Generate a patch for a rack
 */
export async function generatePatchForRack(args: {
  rackUrl: string;
  intent: string;
  genre?: string;
  technique?: string;
}) {
  const { rackUrl, intent, genre, technique } = args;

  logger.info('🎸 MCP: Generating patch', { rackUrl, intent, genre, technique });

  // First, analyze the rack
  const rackAnalysis = await analyzeRackFromUrl({ url: rackUrl });

  // Build ParsedRack and RackAnalysis for generatePatch
  const parsedRack: ParsedRack = {
    url: rackAnalysis.url || rackUrl,
    modules: rackAnalysis.modules as Module[],
    rows: [],
    metadata: { rackId: rackAnalysis.rackId, rackName: `Rack ${rackAnalysis.rackId}` },
  };

  const analysis = {
    hasVCO: rackAnalysis.capabilities.hasVCO,
    hasVCF: rackAnalysis.capabilities.hasVCF,
    hasVCA: rackAnalysis.capabilities.hasVCA,
    missingFundamentals: [],
    totalHP: 0,
    powerDraw: { positive12V: 0, negative12V: 0, positive5V: 0 },
    warnings: [],
  };

  // Generate patch
  const patch = await generatePatch(parsedRack, rackAnalysis.capabilities, analysis, intent, {
    technique,
    genre,
  });

  const response = {
    rack: {
      id: rackAnalysis.rackId,
      moduleCount: rackAnalysis.moduleCount,
      isVideoRack: rackAnalysis.isVideoRack,
      isHybridRack: rackAnalysis.isHybridRack,
    },
    intent,
    genre,
    technique,
    patch: {
      title: patch.metadata.title,
      description: patch.metadata.description,
      difficulty: patch.metadata.difficulty,
      connections: patch.connections,
      patchingOrder: patch.patchingOrder,
      parameterSuggestions: patch.parameterSuggestions,
      tips: patch.tips,
      whyThisWorks: patch.whyThisWorks,
    },
  };

  logger.info('✅ MCP: Patch generated', {
    rackId: rackAnalysis.rackId,
    patchTitle: patch.metadata.title,
    difficulty: patch.metadata.difficulty,
  });

  return response;
}
