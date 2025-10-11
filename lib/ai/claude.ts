/**
 * Claude AI Integration
 * Handles all interactions with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { ParsedRack, RackCapabilities, RackAnalysis } from '@/types/rack';
import { Patch, PatchMetadata, Connection, ParameterSuggestion } from '@/types/patch';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Model configuration
const MODEL = 'claude-3-haiku-20240307'; // Cheap & fast for MVP!
const MAX_TOKENS = 4096;

/**
 * Build system prompt for patch generation
 */
function buildSystemPrompt(): string {
  return `You are an expert modular synthesizer patch designer. Your role is to create working, creative patches for users based on their specific rack configuration.

KEY PRINCIPLES:
1. ONLY suggest connections using modules that exist in the user's rack
2. Ensure signal flow makes sense (audio → audio, CV → CV parameters)
3. Consider voltage ranges and compatibility
4. Provide clear, numbered patching steps
5. Explain WHY the routing works (educational)
6. Be creative but practical

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
    .map(m => `- ${m.name} by ${m.manufacturer} (${m.type}, ${m.hp}HP)`)
    .join('\n');

  // Build capabilities summary
  const capabilitiesSummary = `
Capabilities:
- VCO: ${capabilities.hasVCO ? 'Yes' : 'No'}
- VCF: ${capabilities.hasVCF ? 'Yes' : 'No'}
- VCA: ${capabilities.hasVCA ? 'Yes' : 'No'}
- LFO: ${capabilities.hasLFO ? 'Yes' : 'No'}
- Envelope: ${capabilities.hasEnvelope ? 'Yes' : 'No'}
- Sequencer: ${capabilities.hasSequencer ? 'Yes' : 'No'}
- Effects: ${capabilities.hasEffects ? 'Yes' : 'No'}

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
${analysis.warnings.map(w => `- ${w}`).join('\n')}`;
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
    console.log(`🤖 Generating patch with Claude...`);
    console.log(`   Intent: ${userIntent}`);
    if (options?.technique) console.log(`   Technique: ${options.technique}`);
    if (options?.genre) console.log(`   Genre: ${options.genre}`);

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
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log(`✅ Claude response received (${responseText.length} chars)`);

    // Parse JSON (Claude might wrap in ```json blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const patchData = JSON.parse(jsonText);

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
      },
      connections: patchData.connections.map((c: any) => ({
        id: `conn-${Date.now()}-${Math.random()}`,
        from: c.from,
        to: c.to,
        signalType: c.signalType,
        importance: c.importance,
        note: c.note,
      })),
      patchingOrder: patchData.patchingOrder,
      parameterSuggestions: patchData.parameterSuggestions,
      whyThisWorks: patchData.whyThisWorks,
      tips: patchData.tips,
      createdAt: new Date(),
      updatedAt: new Date(),
      saved: false,
      tags: [],
    };

    console.log(`🎸 Generated patch: "${patch.metadata.title}"`);
    console.log(`   Connections: ${patch.connections.length}`);
    console.log(`   Steps: ${patch.patchingOrder.length}`);

    return patch;

  } catch (error: any) {
    console.error('❌ Claude API error:', error);

    if (error.message?.includes('JSON')) {
      throw new Error('Failed to parse Claude response as JSON. The AI may have returned invalid format.');
    }

    throw new Error(`Failed to generate patch: ${error.message}`);
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
    console.log(`🔄 Generating ${count} variations of "${basePatch.metadata.title}"...`);

    const systemPrompt = buildSystemPrompt();

    const userPrompt = `I have this existing patch:

PATCH: ${basePatch.metadata.title}
Description: ${basePatch.metadata.description}

CONNECTIONS:
${basePatch.connections.map(c =>
  `${c.from.moduleName} ${c.from.outputName} → ${c.to.moduleName} ${c.to.inputName}`
).join('\n')}

AVAILABLE MODULES:
${rack.modules.map(m => `- ${m.name} (${m.type})`).join('\n')}

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

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON array
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const variationsData = JSON.parse(jsonText);
    const variations: Patch[] = [];

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
        },
        connections: patchData.connections.map((c: any) => ({
          id: `conn-${Date.now()}-${Math.random()}`,
          from: c.from,
          to: c.to,
          signalType: c.signalType,
          importance: c.importance,
          note: c.note,
        })),
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

    console.log(`✅ Generated ${variations.length} variations`);

    return variations;

  } catch (error: any) {
    console.error('❌ Variation generation error:', error);
    throw new Error(`Failed to generate variations: ${error.message}`);
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
      input: 0.25,  // $0.25 per million input tokens
      output: 1.25, // $1.25 per million output tokens
    },
  };
}
