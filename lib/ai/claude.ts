/**
 * Claude AI Integration
 * Handles all interactions with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { type ParsedRack, type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { type Patch } from '@/types/patch';
import logger from '@/lib/logger';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Model configuration
const MODEL = 'claude-sonnet-4-5'; // Sonnet 4.5: Better quality, still great price
const MAX_TOKENS = 4096;

/**
 * Build system prompt for patch generation (October 2025 update: comprehensive video synthesis support)
 */
function buildSystemPrompt(): string {
  return `You are an expert modular synthesizer and video synthesis patch designer. Your role is to create working, creative patches for users based on their specific rack configuration. You understand BOTH audio synthesis (VCO/VCF/VCA) and video synthesis (ramps/sync/colorizers).

KEY PRINCIPLES - UNIVERSAL:
1. ONLY suggest connections using modules that exist in the user's rack
2. Ensure signal flow makes sense (audio → audio, CV → CV parameters, video → video)
3. Consider voltage ranges and compatibility
4. Provide clear, numbered patching steps
5. Explain WHY the routing works (educational)
6. Be creative but practical

KEY PRINCIPLES - VIDEO SYNTHESIS (CRITICAL):
⚠️  VIDEO SYNTHESIS IS FUNDAMENTALLY DIFFERENT FROM AUDIO:

1. **SYNC IS MANDATORY** (unlike audio which can free-run):
   - Video systems REQUIRE a sync generator (e.g., LZX ESG3, Visual Cortex, Chromagnon)
   - ALL patches MUST start with sync distribution to every video module
   - Without sync, the image will tear, roll, or not display at all
   - Format: "Step 1: Distribute sync from [sync module] to all video modules"

2. **RAMPS ARE THE CORE BUILDING BLOCK** (like VCOs in audio):
   - Ramp generators create linear gradients (horizontal/vertical)
   - Ramps are combined via math/mixing to create complex imagery
   - Common ramp modules: LZX Angles/Scrolls, Syntonie Rampes

3. **HORIZONTAL vs VERTICAL CONFUSION** (counterintuitive!):
   - Horizontal ramp → creates VERTICAL bars on screen
   - Vertical ramp → creates HORIZONTAL bars on screen
   - Reason: Ramp varies during scan direction (horizontal scan = vertical gradient)
   - Always explain this clearly in patches to avoid confusion

4. **VOLTAGE INCOMPATIBILITY** (audio ±5V vs video 0-1V):
   - Video synthesis uses 0-1V unipolar signals (LZX Patchable Video Standard)
   - Audio modules output ±5V bipolar signals
   - Using audio in video context will CLIP/SATURATE (can be creative but warn user)
   - Example warning: "Audio oscillator will clip video signal - expect hard edges"

5. **VIDEO WORKFLOW** (typical signal path):

   Sync Distribution → Ramp Generation → Colorization → Keying/Mixing → Encoding → Display

   - Step 1: Always distribute sync first
   - Step 2: Generate ramps (horizontal/vertical)
   - Step 3: Process ramps (multiply, add, colorize)
   - Step 4: Composite/mix multiple layers (if keyer available)
   - Step 5: Encode to HDMI/composite for output
   - Step 6: (Optional) Add feedback for evolving patterns (warn about instability)

6. **VIDEO MODULE TYPES**:
   - SyncGenerator: Master timing source (ESG3, Visual Cortex, Chromagnon)
   - RampGenerator: Core pattern building (Angles, Scrolls, Rampes)
   - Colorizer: Add RGB color (Passage, Contour)
   - Keyer: Compositing layers (FKG3 - luma/chroma keying)
   - VideoMixer: RGB matrix mixing (SMX3)
   - VideoProcessor: Math, transforms, effects (Multiplier, Detail Extractor)
   - VideoEncoder: Output to displays (ESG3, Visual Cortex)

7. **HYBRID RACKS** (audio + video):
   - Audio oscillators CAN modulate video (expect clipping)
   - LFOs can modulate ramp speeds for animation
   - Envelopes can gate video signals
   - Always warn about voltage incompatibility but encourage experimentation

OUTPUT FORMAT:
You must respond with valid JSON in this exact structure:
{
  "title": "Patch name (evocative, musical)",
  "description": "What this patch does",
  "soundDescription": "What it sounds like",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedTime": 5-30 (minutes),
  "techniques": ["technique1", "technique2"],
  "genres": ["genre1", "genre2"],
  "connections": [
    {
      "from": { "moduleId": "id", "moduleName": "name", "outputName": "output" },
      "to": { "moduleId": "id", "moduleName": "name", "inputName": "input" },
      "signalType": "audio" | "cv" | "gate" | "clock",
      "importance": "primary" | "modulation" | "utility",
      "note": "optional helpful note"
    }
  ],
  "patchingOrder": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "parameterSuggestions": [
    {
      "moduleId": "id",
      "moduleName": "name",
      "parameter": "Frequency",
      "value": "12 o'clock",
      "reasoning": "Why this setting"
    }
  ],
  "whyThisWorks": "Educational explanation of the signal flow and technique",
  "tips": ["Tip 1", "Tip 2"]
}

Be musical, creative, and educational!`;
}

/**
 * Build user prompt for patch generation
 */
function buildUserPrompt(
  rack: ParsedRack,
  capabilities: RackCapabilities,
  analysis: RackAnalysis,
  userIntent: string,
  technique?: string,
  genre?: string
): string {
  // Build module list
  const moduleList = rack.modules
    .map((m) => `- ${m.name} by ${m.manufacturer} (${m.type}, ${m.hp}HP)`)
    .join('\n');

  // Build capabilities summary (October 2025 update: include video capabilities)
  const isVideoOrHybridRack = capabilities.isVideoRack || capabilities.isHybridRack;

  let capabilitiesSummary = `
AUDIO SYNTHESIS CAPABILITIES:
- VCO: ${capabilities.hasVCO ? 'Yes' : 'No'}
- VCF: ${capabilities.hasVCF ? 'Yes' : 'No'}
- VCA: ${capabilities.hasVCA ? 'Yes' : 'No'}
- LFO: ${capabilities.hasLFO ? 'Yes' : 'No'}
- Envelope: ${capabilities.hasEnvelope ? 'Yes' : 'No'}
- Sequencer: ${capabilities.hasSequencer ? 'Yes' : 'No'}
- Effects: ${capabilities.hasEffects ? 'Yes' : 'No'}
`;

  // Add video capabilities if this is a video or hybrid rack
  if (isVideoOrHybridRack) {
    capabilitiesSummary += `
VIDEO SYNTHESIS CAPABILITIES:
- Sync Generator: ${capabilities.hasVideoSync ? `Yes (${capabilities.videoSyncSource || 'unknown'})` : '⚠️  NO - CRITICAL MISSING!'}
- Ramp Generator: ${capabilities.hasRampGenerator ? 'Yes' : 'No'}
- Colorizer: ${capabilities.hasColorizer ? 'Yes' : 'No'}
- Keyer: ${capabilities.hasKeyer ? 'Yes' : 'No'}
- Video Encoder: ${capabilities.hasVideoEncoder ? 'Yes' : 'No'}
- Video Decoder: ${capabilities.hasVideoDecoder ? 'Yes' : 'No'}
- Rack Type: ${capabilities.isVideoRack ? 'Pure Video Synthesis' : 'Hybrid Audio+Video'}
`;

    if (!capabilities.hasVideoSync) {
      capabilitiesSummary += `
⚠️  CRITICAL: NO SYNC GENERATOR DETECTED
This video rack is INCOMPLETE and will NOT produce a stable image without a sync source!
Your patch suggestions should note this limitation and recommend adding a sync generator.
`;
    }
  }

  capabilitiesSummary += `
Possible Techniques: ${analysis.techniquesPossible.join(', ')}
`;

  let prompt = `USER'S RACK:
${rack.metadata.rackName}

MODULES (${rack.modules.length} total):
${moduleList}

${capabilitiesSummary}

USER REQUEST: ${userIntent}`;

  if (technique) {
    prompt += `\nDESIRED TECHNIQUE: ${technique}`;
  }

  if (genre) {
    prompt += `\nMUSICAL GENRE: ${genre}`;
  }

  if (analysis.warnings.length > 0) {
    prompt += `\n\nWARNINGS TO CONSIDER:
${analysis.warnings.map((w) => `- ${w}`).join('\n')}`;
  }

  prompt += `\n\nPlease generate a creative, working patch using ONLY the modules listed above. Return valid JSON only.`;

  return prompt;
}

/**
 * Generate a patch using Claude
 */
export async function generatePatch(
  rack: ParsedRack,
  capabilities: RackCapabilities,
  analysis: RackAnalysis,
  userIntent: string,
  options?: {
    technique?: string;
    genre?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }
): Promise<Patch> {
  try {
    const startTime = Date.now();

    logger.info('🤖 Generating patch with Claude', {
      model: MODEL,
      userIntent,
      technique: options?.technique,
      genre: options?.genre,
      difficulty: options?.difficulty,
      moduleCount: rack.modules.length,
    });

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(
      rack,
      capabilities,
      analysis,
      userIntent,
      options?.technique,
      options?.genre
    );

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract JSON response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const responseTime = Date.now() - startTime;

    logger.info('✅ Claude response received', {
      responseLength: responseText.length,
      duration: responseTime,
      model: MODEL,
    });

    // Parse JSON (Claude might wrap in ```json blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const patchData = JSON.parse(jsonText);

    // Determine rack type
    const rackType: 'video' | 'audio' | 'hybrid' = capabilities.isVideoRack
      ? 'video'
      : capabilities.isHybridRack
        ? 'hybrid'
        : 'audio';

    // Build full Patch object
    const patch: Patch = {
      id: `patch-${Date.now()}`, // Temporary ID
      userId: '', // Will be set by API route
      rackId: rack.metadata.rackId,
      metadata: {
        title: patchData.title,
        description: patchData.description,
        soundDescription: patchData.soundDescription,
        difficulty: patchData.difficulty,
        estimatedTime: patchData.estimatedTime,
        techniques: patchData.techniques,
        genres: patchData.genres,
        userIntent,
        rackType,
        isVideoSynthesis: rackType === 'video' || rackType === 'hybrid',
      },
      connections: patchData.connections.map(
        (c: {
          from: { moduleId: string; moduleName: string; outputName: string };
          to: { moduleId: string; moduleName: string; inputName: string };
          signalType: 'audio' | 'cv' | 'gate' | 'clock';
          importance: 'primary' | 'modulation' | 'utility';
          note?: string;
        }) => ({
          id: `conn-${Date.now()}-${Math.random()}`,
          from: c.from,
          to: c.to,
          signalType: c.signalType,
          importance: c.importance,
          note: c.note,
        })
      ),
      patchingOrder: patchData.patchingOrder,
      parameterSuggestions: patchData.parameterSuggestions,
      whyThisWorks: patchData.whyThisWorks,
      tips: patchData.tips,
      createdAt: new Date(),
      updatedAt: new Date(),
      saved: false,
      tags: [],
    };

    const totalTime = Date.now() - startTime;

    logger.info('🎸 Patch generated successfully', {
      patchTitle: patch.metadata.title,
      connectionCount: patch.connections.length,
      stepCount: patch.patchingOrder.length,
      techniqueCount: patch.metadata.techniques.length,
      difficulty: patch.metadata.difficulty,
      duration: totalTime,
    });

    return patch;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Claude API error', {
      error: errorMessage,
      stack: errorStack,
      model: MODEL,
    });
    if (errorMessage.includes('JSON')) {
      throw new Error(
        'Failed to parse Claude response as JSON. The AI may have returned invalid format.'
      );
    }

    throw new Error(`Failed to generate patch: ${errorMessage}`);
  }
}

/**
 * Generate multiple patch variations
 */
export async function generatePatchVariations(
  basePatch: Patch,
  rack: ParsedRack,
  capabilities: RackCapabilities,
  count: number = 3
): Promise<Patch[]> {
  try {
    const startTime = Date.now();

    logger.info('🔄 Generating patch variations', {
      basePatchTitle: basePatch.metadata.title,
      variationCount: count,
      model: MODEL,
    });

    const systemPrompt = buildSystemPrompt();

    const userPrompt = `I have this existing patch:

PATCH: ${basePatch.metadata.title}
Description: ${basePatch.metadata.description}

CONNECTIONS:
${basePatch.connections
  .map((c) => `${c.from.moduleName} ${c.from.outputName} → ${c.to.moduleName} ${c.to.inputName}`)
  .join('\n')}

AVAILABLE MODULES:
${rack.modules.map((m) => `- ${m.name} (${m.type})`).join('\n')}

Please generate ${count} CREATIVE VARIATIONS of this patch. Each variation should:
1. Use different routing or modulation sources
2. Create a different sonic character
3. Still use only the available modules

Return a JSON array of ${count} patch objects with the same structure as before.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS * 2, // More tokens for multiple patches
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON array
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const variationsData = JSON.parse(jsonText);
    const variations: Patch[] = [];

    // Determine rack type (inherit from base patch)
    const rackType: 'video' | 'audio' | 'hybrid' = capabilities.isVideoRack
      ? 'video'
      : capabilities.isHybridRack
        ? 'hybrid'
        : 'audio';

    for (const patchData of variationsData) {
      const patch: Patch = {
        id: `patch-${Date.now()}-${Math.random()}`,
        userId: basePatch.userId,
        rackId: rack.metadata.rackId,
        parentPatchId: basePatch.id,
        metadata: {
          title: patchData.title,
          description: patchData.description,
          soundDescription: patchData.soundDescription,
          difficulty: patchData.difficulty,
          estimatedTime: patchData.estimatedTime,
          techniques: patchData.techniques,
          genres: patchData.genres,
          userIntent: basePatch.metadata.userIntent,
          rackType,
          isVideoSynthesis: rackType === 'video' || rackType === 'hybrid',
        },
        connections: patchData.connections.map(
          (c: {
            from: { moduleId: string; moduleName: string; outputName: string };
            to: { moduleId: string; moduleName: string; inputName: string };
            signalType: 'audio' | 'cv' | 'gate' | 'clock';
            importance: 'primary' | 'modulation' | 'utility';
            note?: string;
          }) => ({
            id: `conn-${Date.now()}-${Math.random()}`,
            from: c.from,
            to: c.to,
            signalType: c.signalType,
            importance: c.importance,
            note: c.note,
          })
        ),
        patchingOrder: patchData.patchingOrder,
        parameterSuggestions: patchData.parameterSuggestions,
        whyThisWorks: patchData.whyThisWorks,
        tips: patchData.tips,
        createdAt: new Date(),
        updatedAt: new Date(),
        saved: false,
        tags: [],
      };

      variations.push(patch);
    }

    const duration = Date.now() - startTime;

    logger.info('✅ Generated variations successfully', {
      variationCount: variations.length,
      duration,
      model: MODEL,
    });

    return variations;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Variation generation error', {
      error: errorMessage,
      stack: errorStack,
      model: MODEL,
    });

    throw new Error(`Failed to generate variations: ${errorMessage}`);
  }
}

/**
 * Check if API key is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 0;
}

/**
 * Get model info
 */
export function getModelInfo() {
  return {
    model: MODEL,
    provider: 'Anthropic',
    costPer1MTokens: {
      input: 3.0, // Sonnet 4.5: $3 per million input tokens
      output: 15.0, // $15 per million output tokens
    },
  };
}
