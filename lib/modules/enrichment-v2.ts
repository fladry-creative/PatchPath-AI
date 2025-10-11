/**
 * Module Enrichment Service v2
 * Database-first approach with intelligent caching
 */

import { type Module, type ModuleType } from '@/types/module';
import { findModule, upsertModule, incrementModuleUsage } from '@/lib/database/module-service';
import { type VisionModule } from '@/lib/vision/rack-analyzer';
import logger from '@/lib/logger';

export interface EnrichmentResult {
  module: Partial<Module>;
  source: 'database' | 'enrichment' | 'fallback';
  confidence: number;
  cacheHit: boolean;
  enrichmentTime?: number;
}

/**
 * Enrich module with database-first lookup
 * 1. Check database (cache hit = instant + free)
 * 2. If not found, enrich and save for future
 */
export async function enrichModuleWithCache(visionModule: VisionModule): Promise<EnrichmentResult> {
  const startTime = Date.now();

  try {
    // Step 1: Check database cache
    const cached = await findModule(visionModule.name, visionModule.manufacturer || 'Unknown');

    if (cached) {
      // CACHE HIT! Increment usage and return
      await incrementModuleUsage(cached.id, cached.partitionKey);

      return {
        module: cached,
        source: 'database',
        confidence: cached.confidence,
        cacheHit: true,
        enrichmentTime: Date.now() - startTime,
      };
    }

    // Step 2: Cache miss - need to enrich
    // For MVP, we'll create a basic module from vision data
    // In Phase 2, we'll add web search enrichment here
    const basicModule: Partial<Module> = {
      name: visionModule.name,
      manufacturer: visionModule.manufacturer || 'Unknown',
      type: inferModuleType(visionModule.name, visionModule.notes),
      hp: visionModule.position.width || 0,
      inputs: [],
      outputs: [],
      description: visionModule.notes,
    };

    // Save to database for future cache hits
    const saved = await upsertModule(basicModule, 'vision', visionModule.confidence);

    return {
      module: saved,
      source: 'enrichment',
      confidence: visionModule.confidence,
      cacheHit: false,
      enrichmentTime: Date.now() - startTime,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Enrichment failed', {
      moduleName: visionModule.name,
      manufacturer: visionModule.manufacturer,
      error: errorMessage,
      stack: errorStack
    });

    // Fallback: return vision data as-is
    return {
      module: {
        name: visionModule.name,
        manufacturer: visionModule.manufacturer || 'Unknown',
        type: 'Other',
        hp: visionModule.position.width || 0,
        inputs: [],
        outputs: [],
      },
      source: 'fallback',
      confidence: 0.5,
      cacheHit: false,
      enrichmentTime: Date.now() - startTime,
    };
  }
}

/**
 * Batch enrich modules with caching
 */
export async function enrichModulesBatch(
  visionModules: VisionModule[]
): Promise<EnrichmentResult[]> {
  const startTime = Date.now();

  logger.info('📦 Starting batch enrichment', {
    moduleCount: visionModules.length
  });

  const results: EnrichmentResult[] = [];
  let cacheHits = 0;
  let cacheMisses = 0;

  // Process in parallel with rate limiting
  const chunks = [];
  for (let i = 0; i < visionModules.length; i += 5) {
    chunks.push(visionModules.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const promises = chunk.map((module) => enrichModuleWithCache(module));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);

    // Count cache performance
    chunkResults.forEach((result) => {
      if (result.cacheHit) cacheHits++;
      else cacheMisses++;
    });

    // Rate limit: wait 200ms between chunks
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const duration = Date.now() - startTime;
  const cacheHitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;

  logger.info('✅ Batch enrichment complete', {
    totalModules: results.length,
    cacheHits,
    cacheMisses,
    hitRate: cacheHitRate,
    duration
  });

  return results;
}

/**
 * Infer module type from name and notes
 */
function inferModuleType(name: string, notes?: string): ModuleType {
  const searchText = `${name} ${notes || ''}`.toLowerCase();

  const typePatterns: Record<string, ModuleType> = {
    'oscillator|vco|osc': 'VCO',
    'filter|vcf|lpf|hpf|bpf': 'VCF',
    'amplifier|vca|amp': 'VCA',
    'lfo|low frequency': 'LFO',
    'envelope|eg|adsr|ad|ar': 'EG',
    'sequencer|seq': 'Sequencer',
    'utility|mult|attenuverter|offset': 'Utility',
    'effect|delay|reverb|distortion|chorus|flanger': 'Effect',
    'mixer|mix': 'Mixer',
    'midi|usb': 'MIDI',
    'clock|tempo': 'Clock',
    'logic|gate|boolean': 'Logic',
    'random|noise|s&h': 'Random',
  };

  for (const [pattern, type] of Object.entries(typePatterns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(searchText)) {
      return type;
    }
  }

  return 'Other';
}

/**
 * Get enrichment statistics
 */
export interface EnrichmentStats {
  totalEnriched: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  avgEnrichmentTime: number;
  costSaved: number; // Dollars saved via caching
}

export function calculateEnrichmentStats(results: EnrichmentResult[]): EnrichmentStats {
  const cacheHits = results.filter((r) => r.cacheHit).length;
  const cacheMisses = results.filter((r) => !r.cacheHit).length;
  const totalTime = results.reduce((sum, r) => sum + (r.enrichmentTime || 0), 0);

  // Cost calculation
  // Cache hit: $0
  // Cache miss: ~$0.10 (web search + AI parsing in Phase 2)
  const costSaved = cacheHits * 0.1;

  return {
    totalEnriched: results.length,
    cacheHits,
    cacheMisses,
    hitRate: (cacheHits / (cacheHits + cacheMisses)) * 100,
    avgEnrichmentTime: totalTime / results.length,
    costSaved,
  };
}
