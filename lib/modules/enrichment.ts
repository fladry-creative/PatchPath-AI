/**
 * Module Enrichment Service
 * Searches for module specifications and builds our database
 */

import Anthropic from '@anthropic-ai/sdk';
import { type Module, type ModuleType } from '@/types/module';
import logger from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ModuleSearchResult {
  module: Partial<Module>;
  sources: string[];
  confidence: number;
  needsReview: boolean;
}

/**
 * Search for module specifications using web search and AI
 */
export async function enrichModuleData(
  moduleName: string,
  manufacturer?: string
): Promise<ModuleSearchResult> {
  const searchQuery = manufacturer
    ? `${manufacturer} ${moduleName} eurorack specifications`
    : `${moduleName} eurorack specifications`;

  logger.info('🔎 Searching for module specifications', {
    moduleName,
    manufacturer,
    searchQuery
  });

  // Use Claude with search capability to find module specs
  const systemPrompt = `You are an expert in Eurorack modular synthesizers.

Given a module name and manufacturer, search for and extract the following specifications:

REQUIRED:
- Module name (official)
- Manufacturer
- Module type (VCO, VCF, VCA, LFO, EG, Sequencer, Utility, Effect, Mixer, MIDI, Clock, Logic, Random, Video, Other)
- HP (width in Eurorack units)

DESIRED:
- Depth (mm)
- Power consumption (+12V mA, -12V mA, +5V mA)
- Number and types of inputs (CV, Audio, Gate)
- Number and types of outputs (CV, Audio, Gate)
- Description
- ModularGrid URL
- Manufacturer URL

Return as JSON:
{
  "name": "Official module name",
  "manufacturer": "Manufacturer name",
  "type": "VCO|VCF|VCA|etc",
  "hp": 12,
  "depth": 25,
  "power": {
    "positive12V": 60,
    "negative12V": 5,
    "positive5V": 0
  },
  "inputs": [
    {"name": "V/Oct", "type": "CV"},
    {"name": "Audio In", "type": "Audio"}
  ],
  "outputs": [
    {"name": "Out", "type": "Audio"}
  ],
  "description": "Brief description",
  "moduleGridUrl": "https://modulargrid.net/e/modules/...",
  "manufacturerUrl": "https://...",
  "sources": ["URL1", "URL2"],
  "confidence": 0.95,
  "needsReview": false
}

If you cannot find reliable information, set confidence low and needsReview to true.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Find specifications for: ${searchQuery}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    interface ModuleResponse {
      name: string;
      manufacturer: string;
      type: ModuleType;
      hp: number;
      depth?: number;
      power?: {
        positive12V?: number;
        negative12V?: number;
        positive5V?: number;
      };
      inputs?: Array<{ name: string; type: string }>;
      outputs?: Array<{ name: string; type: string }>;
      description?: string;
      moduleGridUrl?: string;
      manufacturerUrl?: string;
      sources?: string[];
      confidence?: number;
      needsReview?: boolean;
    }

    const data: ModuleResponse = JSON.parse(jsonText);

    // Build Module object
    const moduleData: Partial<Module> = {
      name: data.name,
      manufacturer: data.manufacturer,
      type: data.type as ModuleType,
      hp: data.hp,
      depth: data.depth,
      power: data.power,
      inputs:
        data.inputs?.map((input, idx: number) => ({
          id: `in-${idx}`,
          name: input.name,
          type: input.type.toLowerCase() as 'audio' | 'cv' | 'gate' | 'clock' | 'video',
        })) || [],
      outputs:
        data.outputs?.map((output, idx: number) => ({
          id: `out-${idx}`,
          name: output.name,
          type: output.type.toLowerCase() as 'audio' | 'cv' | 'gate' | 'clock' | 'video',
        })) || [],
      description: data.description,
      moduleGridUrl: data.moduleGridUrl,
    };

    logger.info('✅ Module specifications found', {
      moduleName: moduleData.name,
      manufacturer: moduleData.manufacturer,
      confidence: data.confidence,
      type: moduleData.type
    });

    return {
      module: moduleData,
      sources: data.sources || [],
      confidence: data.confidence || 0.5,
      needsReview: data.needsReview || false,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Failed to enrich module', {
      moduleName,
      manufacturer,
      error: errorMessage,
      stack: errorStack
    });

    // Return partial data
    return {
      module: {
        name: moduleName,
        manufacturer: manufacturer || 'Unknown',
        type: 'Other',
        hp: 0,
        inputs: [],
        outputs: [],
      },
      sources: [],
      confidence: 0.1,
      needsReview: true,
    };
  }
}

/**
 * Batch enrich multiple modules
 */
export async function enrichModules(
  modules: Array<{ name: string; manufacturer?: string }>
): Promise<ModuleSearchResult[]> {
  logger.info('📦 Starting batch module enrichment', {
    moduleCount: modules.length
  });

  // Process in parallel with rate limiting
  const results: ModuleSearchResult[] = [];

  for (const moduleInfo of modules) {
    try {
      const result = await enrichModuleData(moduleInfo.name, moduleInfo.manufacturer);
      results.push(result);

      // Rate limit: wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to enrich module in batch', {
        moduleName: moduleInfo.name,
        manufacturer: moduleInfo.manufacturer,
        error: errorMessage
      });

      results.push({
        module: {
          name: moduleInfo.name,
          manufacturer: moduleInfo.manufacturer || 'Unknown',
          type: 'Other',
          hp: 0,
          inputs: [],
          outputs: [],
        },
        sources: [],
        confidence: 0.1,
        needsReview: true,
      });
    }
  }

  logger.info('✅ Batch enrichment complete', {
    totalProcessed: results.length,
    successCount: results.filter(r => r.confidence > 0.5).length,
    needsReview: results.filter(r => r.needsReview).length
  });

  return results;
}
