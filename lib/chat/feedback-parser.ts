/**
 * Natural Language Feedback Parser
 * Converts user feedback into structured refinement requests
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { type Patch } from '@/types/patch';
import { type ParsedRack } from '@/types/rack';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Parsed feedback from user input
 */
export interface ParsedFeedback {
  intent: 'adjust' | 'add' | 'remove' | 'replace' | 'clarify';
  target: string; // What to change (reverb, filter, tempo, etc.)
  direction?: 'increase' | 'decrease'; // For adjustments
  specificity: 'vague' | 'specific'; // "darker" vs "set cutoff to 2kHz"
  value?: number | string; // If specific
  confidence: number; // 0.0 to 1.0
  reasoning: string; // Why this interpretation was chosen
}

/**
 * System prompt for feedback parsing
 */
const FEEDBACK_PARSER_SYSTEM_PROMPT = `You are a modular synthesizer feedback interpreter. Your job is to understand what users want to change about their patches.

CURRENT PATCH CONTEXT:
- Title: "{{PATCH_TITLE}}"
- Description: "{{PATCH_DESCRIPTION}}"
- Techniques: {{TECHNIQUES}}
- Available modules: {{MODULE_NAMES}}

COMMON FEEDBACK PATTERNS:

**Adjustment Requests:**
- "darker" → adjust filter cutoff down, add distortion
- "brighter" → adjust filter cutoff up, increase resonance
- "more reverb" → increase reverb send/feedback/decay
- "less reverb" → decrease reverb parameters
- "faster" → increase tempo, shorten envelope times
- "slower" → decrease tempo, lengthen envelope times
- "louder" → increase VCA levels, mixer channels
- "softer" → decrease VCA levels
- "more aggressive" → add distortion, increase resonance, faster envelopes
- "smoother" → reduce resonance, add smoothing, slower envelopes

**Addition Requests:**
- "add delay" → include delay in signal path
- "add distortion" → add saturation/overdrive
- "add modulation" → add LFO/envelope modulation
- "add reverb" → add reverb to signal path

**Removal Requests:**
- "remove delay" → take out delay connections
- "remove reverb" → remove reverb from signal path
- "simplify" → remove complex modulation, reduce connections

**Specific Requests:**
- "set cutoff to 2kHz" → specific parameter value
- "increase decay to 5 seconds" → specific timing
- "make it 120 BPM" → specific tempo

**Clarification Needed:**
- "make it better" → too vague, need clarification
- "fix it" → unclear what's wrong
- "change something" → too general

RETURN JSON FORMAT:
{
  "intent": "adjust|add|remove|replace|clarify",
  "target": "what_to_change",
  "direction": "increase|decrease" (for adjustments only),
  "specificity": "vague|specific",
  "value": "specific_value_if_given",
  "confidence": 0.0-1.0,
  "reasoning": "why_this_interpretation"
}

EXAMPLES:
- "darker" → {"intent": "adjust", "target": "filter_cutoff", "direction": "decrease", "specificity": "vague", "confidence": 0.9, "reasoning": "User wants darker sound, typically achieved by lowering filter cutoff"}
- "add delay" → {"intent": "add", "target": "delay", "specificity": "vague", "confidence": 0.95, "reasoning": "User wants to add delay effect to the patch"}
- "set reverb decay to 5 seconds" → {"intent": "adjust", "target": "reverb_decay", "value": "5s", "specificity": "specific", "confidence": 0.98, "reasoning": "User specified exact reverb decay time"}`;

/**
 * Parse user feedback into structured refinement request
 */
export async function parseFeedback(
  feedback: string,
  currentPatch: Patch,
  rackData: ParsedRack
): Promise<ParsedFeedback> {
  logger.info('🔍 Parsing feedback', {
    feedback: feedback.substring(0, 50),
    patchTitle: currentPatch.metadata.title,
    moduleCount: rackData.modules.length,
  });

  try {
    // Build context for AI
    const moduleNames = rackData.modules.map((m) => m.name).join(', ');
    const techniques = currentPatch.metadata.techniques.join(', ');

    const systemPrompt = FEEDBACK_PARSER_SYSTEM_PROMPT
      .replace('{{PATCH_TITLE}}', currentPatch.metadata.title)
      .replace('{{PATCH_DESCRIPTION}}', currentPatch.metadata.description)
      .replace('{{TECHNIQUES}}', techniques)
      .replace('{{MODULE_NAMES}}', moduleNames);

    // Call Claude for feedback parsing
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cheap model for parsing
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `USER FEEDBACK: "${feedback}"

Parse this feedback into a structured refinement request.`,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const resultText = content.text;

    // Extract JSON from response
    const jsonMatch =
      resultText.match(/```json\n([\s\S]*?)\n```/) || resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonText) as ParsedFeedback;

    // Validate result
    if (!['adjust', 'add', 'remove', 'replace', 'clarify'].includes(result.intent)) {
      throw new Error(`Invalid intent: ${result.intent}`);
    }

    if (!['vague', 'specific'].includes(result.specificity)) {
      throw new Error(`Invalid specificity: ${result.specificity}`);
    }

    logger.info('✅ Feedback parsed', {
      intent: result.intent,
      target: result.target,
      specificity: result.specificity,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    logger.error('❌ Feedback parsing failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      feedback,
    });

    // Fallback: return vague adjustment
    return {
      intent: 'adjust',
      target: 'general',
      specificity: 'vague',
      confidence: 0.3,
      reasoning: 'Failed to parse feedback, defaulting to general adjustment',
    };
  }
}

/**
 * Check if feedback is asking for clarification
 */
export function needsClarification(feedback: ParsedFeedback): boolean {
  return feedback.intent === 'clarify' || feedback.confidence < 0.5;
}

/**
 * Check if feedback is impossible to fulfill
 */
export function isImpossibleRequest(
  feedback: ParsedFeedback,
  rackData: ParsedRack
): { impossible: boolean; reason?: string } {
  const { intent, target } = feedback;

  // Check if trying to add modules that don't exist
  if (intent === 'add') {
    const moduleTypes = rackData.modules.map((m) => m.type.toLowerCase());
    
    if (target.includes('reverb') && !moduleTypes.some(t => t.includes('reverb') || t.includes('effect'))) {
      return { impossible: true, reason: 'No reverb module in rack' };
    }
    
    if (target.includes('delay') && !moduleTypes.some(t => t.includes('delay') || t.includes('effect'))) {
      return { impossible: true, reason: 'No delay module in rack' };
    }
    
    if (target.includes('distortion') && !moduleTypes.some(t => t.includes('distortion') || t.includes('effect'))) {
      return { impossible: true, reason: 'No distortion module in rack' };
    }
  }

  return { impossible: false };
}

/**
 * Generate clarification question for vague feedback
 */
export function generateClarificationQuestion(feedback: string): string {
  const vaguePatterns = [
    { pattern: /better|good|nice/i, suggestions: ['darker', 'brighter', 'more reverb', 'faster'] },
    { pattern: /fix|wrong|problem/i, suggestions: ['too dark', 'too bright', 'too complex', 'too simple'] },
    { pattern: /change|different/i, suggestions: ['darker', 'brighter', 'add delay', 'remove reverb'] },
  ];

  for (const { pattern, suggestions } of vaguePatterns) {
    if (pattern.test(feedback)) {
      return `I'd love to help! Could you be more specific? For example:\n- ${suggestions.join('\n- ')}\n\nWhat exactly would you like to change?`;
    }
  }

  return `I want to make sure I understand what you're looking for. Could you tell me more about what you'd like to change? For example:\n- Make it darker/brighter\n- Add more reverb/delay\n- Make it faster/slower\n- Add/remove specific effects`;
}