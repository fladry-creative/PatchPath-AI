/**
 * Gemini 2.5 Flash Image Client
 * AI-generated patch diagrams for visual learning and social sharing
 * October 2025 - Production-ready implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '@/lib/logger';
import { type Patch } from '@/types/patch';
import { type Module } from '@/types/module';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Supported aspect ratios for social media optimization
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

/**
 * Diagram generation cost tracking
 */
const COST_PER_DIAGRAM = 0.039; // $0.039 per image (Oct 2025 pricing)

interface DiagramGenerationParams {
  patch: Patch;
  modules: Module[];
  aspectRatio?: AspectRatio;
}

interface DiagramResult {
  imageData: string; // base64 encoded PNG
  aspectRatio: AspectRatio;
  generationTime: number; // milliseconds
  cost: number; // USD
}

/**
 * Build detailed prompt for Gemini image generation
 * Focuses on color-coded cables and professional technical schematic style
 */
function buildDiagramPrompt(params: DiagramGenerationParams): string {
  const { patch, modules } = params;
  const { metadata, connections, patchingOrder } = patch;

  // Determine rack type for styling
  const rackType = metadata.rackType || 'audio';
  const isVideoRack = rackType === 'video' || rackType === 'hybrid';

  // Build module list
  const moduleList = modules.map((m) => `- ${m.name} (${m.manufacturer || 'Unknown'})`).join('\n');

  // Build connection list with color coding
  const connectionList = connections
    .map((conn, idx) => {
      let color = '🟠 ORANGE'; // Default audio
      if (conn.signalType === 'cv') color = '🔵 BLUE';
      else if (conn.signalType === 'gate') color = '🟢 GREEN';
      else if (conn.signalType === 'clock') color = '🟣 PURPLE';
      else if (isVideoRack) {
        // Video-specific colors
        if (conn.signalType === 'video_sync') color = '🟠 ORANGE';
        else if (conn.signalType === 'video_rgb') color = '🔴 RED/🟢 GREEN/🔵 BLUE';
        else if (conn.signalType === 'video_luminance') color = '⚪ WHITE';
      }

      return `${idx + 1}. ${conn.from.moduleName} [${conn.from.outputName}] → ${conn.to.moduleName} [${conn.to.inputName}] (${color} cable)${conn.note ? ` - ${conn.note}` : ''}`;
    })
    .join('\n');

  // Build patching order steps
  const patchingSteps =
    patchingOrder && patchingOrder.length > 0
      ? patchingOrder.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
      : 'No specific order required';

  const prompt = `Create a professional, technical schematic diagram for a ${rackType === 'video' ? 'VIDEO SYNTHESIS' : 'MODULAR SYNTHESIZER'} patch.

PATCH TITLE: ${metadata.title}
DESCRIPTION: ${metadata.description}
DIFFICULTY: ${metadata.difficulty.toUpperCase()}
${metadata.soundDescription ? `EXPECTED RESULT: ${metadata.soundDescription}` : ''}

MODULES PRESENT:
${moduleList}

CABLE CONNECTIONS:
${connectionList}

PATCHING ORDER:
${patchingSteps}

WHY THIS WORKS:
${patch.whyThisWorks}

${
  isVideoRack
    ? `
VIDEO SYNTHESIS SPECIFIC REQUIREMENTS:
- Show sync distribution PROMINENTLY (sync is CRITICAL in video)
- Use warm colors (orange/red) for video signals
- Show ramp generators clearly (core building block)
- Emphasize signal flow: Sync → Ramps → Colorization → Mixing → Output
- Include sync connections to ALL video modules
`
    : ''
}

STYLE REQUIREMENTS:
- Professional technical schematic (like service manual diagrams)
- Clean, modern design with light gray/white background
- Module blocks: Rectangular with clear, bold labels
- Module arrangement: Logical signal flow (left to right OR top to bottom)
- Cable routing:
  * Use smooth, curved Bézier paths (no sharp angles)
  * Color-coded according to signal type (see connection list above)
  * Cables should NOT overlap excessively
  * Show cable routing clearly from output to input
  * Include small arrows on cables showing signal direction
- Connection points:
  * Clearly labeled (e.g., "SAW OUT", "CUTOFF IN", "GATE", "CV")
  * Small circles or squares at connection points
  * Distinguish inputs vs outputs visually
- Typography:
  * Module names: Bold, large (14-16pt equivalent)
  * Connection labels: Smaller, clear (10-12pt equivalent)
  * Use clean sans-serif font (Helvetica-like)
- Annotations:
  * Add brief labels explaining KEY connections (not all)
  * Include small notes about critical settings if relevant
  * Keep annotations minimal and elegant
- Professional quality:
  * Suitable for sharing on Instagram, Reddit, ModWiggler
  * Print-quality resolution
  * Visually balanced composition
  * Educational but not cluttered

OUTPUT FORMAT:
A single, complete technical diagram showing ALL modules and connections described above.
The diagram should be self-contained and immediately understandable to modular synth enthusiasts.
${isVideoRack ? 'Emphasize that this is a VIDEO SYNTHESIS patch with sync distribution.' : ''}
`;

  return prompt.trim();
}

/**
 * Generate patch diagram using Gemini 2.5 Flash Image
 * Returns base64-encoded PNG image
 */
export async function generatePatchDiagram(
  params: DiagramGenerationParams
): Promise<DiagramResult> {
  const startTime = Date.now();

  try {
    logger.info('🎨 Generating patch diagram with Gemini', {
      patchTitle: params.patch.metadata.title,
      aspectRatio: params.aspectRatio || '1:1',
      moduleCount: params.modules.length,
      connectionCount: params.patch.connections.length,
    });

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const prompt = buildDiagramPrompt(params);

    // Generate image
    const result = await model.generateContent([prompt]);
    const response = await result.response;

    // Extract image data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const parts = candidates[0].content.parts;
    let imageData: string | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data; // Already base64
        break;
      }
    }

    if (!imageData) {
      throw new Error('No image data found in Gemini response');
    }

    const generationTime = Date.now() - startTime;

    logger.info('✅ Patch diagram generated successfully', {
      patchTitle: params.patch.metadata.title,
      generationTime,
      cost: COST_PER_DIAGRAM,
      imageSizeKB: Math.round((imageData.length * 0.75) / 1024), // Approximate base64 → bytes
    });

    return {
      imageData,
      aspectRatio: params.aspectRatio || '1:1',
      generationTime,
      cost: COST_PER_DIAGRAM,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const generationTime = Date.now() - startTime;

    logger.error('❌ Patch diagram generation failed', {
      patchTitle: params.patch.metadata.title,
      error: errorMessage,
      generationTime,
    });

    throw new Error(`Failed to generate patch diagram: ${errorMessage}`);
  }
}

/**
 * Generate multiple aspect ratio diagrams for a patch
 * Useful for social media optimization
 */
export async function generateMultiAspectDiagrams(
  params: Omit<DiagramGenerationParams, 'aspectRatio'>
): Promise<Record<AspectRatio, DiagramResult>> {
  const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16'];
  const results: Partial<Record<AspectRatio, DiagramResult>> = {};

  logger.info('🎨 Generating multi-aspect diagrams', {
    patchTitle: params.patch.metadata.title,
    aspectRatios,
  });

  for (const aspectRatio of aspectRatios) {
    try {
      results[aspectRatio] = await generatePatchDiagram({
        ...params,
        aspectRatio,
      });

      // Small delay between requests to be respectful to Gemini API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      logger.warn(`⚠️ Failed to generate ${aspectRatio} diagram`, {
        patchTitle: params.patch.metadata.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with other aspect ratios even if one fails
    }
  }

  return results as Record<AspectRatio, DiagramResult>;
}
