/**
 * AI-Powered Intent Detection
 * 100% Claude-powered intent classification - NO keyword matching
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { type ChatSession } from './session-state';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Use Haiku for fast, cheap intent classification
const INTENT_MODEL = 'claude-3-5-haiku-20241022';

/**
 * User intent types
 */
export enum Intent {
  UPLOAD_RACK_IMAGE = 'upload_rack_image', // User wants to upload rack image
  ANALYZE_RACK = 'analyze_rack', // Vision analysis in progress
  GENERATE_PATCH = 'generate_patch', // Generate new patch
  REFINE_PATCH = 'refine_patch', // Iterate on existing patch
  SAVE_PATCH = 'save_patch', // Save patch to database
  SHOW_VARIATIONS = 'show_variations', // Generate patch variations
  EXPLAIN_TECHNIQUE = 'explain_technique', // Educational Q&A
  DEMO_REQUEST = 'demo_request', // Anonymous wants demo
  CHAT = 'chat', // General conversation
}

/**
 * Intent detection result
 */
export interface IntentResult {
  intent: Intent;
  confidence: number; // 0.0 to 1.0
  reasoning: string; // Why this intent was chosen
}

/**
 * System prompt for intent classification
 */
const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a modular synthesizer patch assistant.

Your job is to analyze conversation context and classify the user's intent.

AVAILABLE INTENTS:

1. **upload_rack_image**: User wants to share their rack photo for analysis
   - Examples: "here's my rack", "can you analyze this", "check out my setup"

2. **analyze_rack**: Vision analysis is being performed (system-level)
   - Usually system-initiated, not user-requested directly

3. **generate_patch**: User wants a new patch created
   - Examples: "create an ambient patch", "generate something melodic", "I want a drone sound"
   - Can be explicit ("generate") or implicit ("I want something dark")

4. **refine_patch**: User wants to modify existing patch
   - Examples: "make it darker", "add more reverb", "less aggressive"
   - REQUIRES existing patch in session

5. **save_patch**: User wants to save current patch
   - Examples: "save this", "I love it", "bookmark this patch"
   - REQUIRES existing patch in session

6. **show_variations**: User wants alternative approaches
   - Examples: "show me variations", "other options?", "what else?"
   - Usually after generating a patch

7. **explain_technique**: User asking educational questions
   - Examples: "what is FM synthesis?", "how does Maths work?", "explain waveshaping"

8. **demo_request**: Anonymous user wants to try demo
   - Examples: "random rack", "surprise me", "show me an example"
   - OR gibberish/nonsense input

9. **chat**: General conversation, not fitting above categories
   - Examples: "hello", "thanks", "that's cool"

CONTEXT IS CRITICAL:
- Same phrase means different things based on session state
- "make it darker" with NO patch = generate_patch (new dark patch)
- "make it darker" WITH patch = refine_patch (modify existing)
- Consider conversation history, rack presence, patch presence

GIBBERISH DETECTION:
- Random keyboard mashing = demo_request
- Very short input (<3 chars) without context = demo_request
- All caps nonsense = demo_request

Return JSON:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you chose this intent"
}`;

/**
 * Detect user intent using AI (Claude Haiku)
 */
export async function detectIntent(
  userMessage: string,
  session: ChatSession
): Promise<IntentResult> {
  logger.info('🤖 Detecting intent with Claude Haiku', {
    messageLength: userMessage.length,
    hasRack: !!session.rackData,
    hasPatch: !!session.currentPatch,
    messageCount: session.messages.length,
  });

  try {
    // Build context for AI
    const contextInfo = buildContextInfo(session);

    // Call Claude Haiku for intent classification
    const response = await anthropic.messages.create({
      model: INTENT_MODEL,
      max_tokens: 500,
      system: INTENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `USER MESSAGE: "${userMessage}"

CONVERSATION CONTEXT:
${contextInfo}

Classify the user's intent and return JSON.`,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const resultText = content.text;

    // Extract JSON from response (handle code blocks)
    const jsonMatch =
      resultText.match(/```json\n([\s\S]*?)\n```/) || resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonText) as IntentResult;

    // Validate intent
    if (!Object.values(Intent).includes(result.intent)) {
      throw new Error(`Invalid intent: ${result.intent}`);
    }

    logger.info('✅ Intent detected', {
      intent: result.intent,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });

    return result;
  } catch (error) {
    logger.error('❌ Intent detection failed', {
      error: error instanceof Error ? error.message : String(error),
      userMessage,
    });

    // Fallback: return CHAT intent with low confidence
    return {
      intent: Intent.CHAT,
      confidence: 0.3,
      reasoning: 'Intent detection failed, defaulting to conversational chat',
    };
  }
}

/**
 * Build context information for AI
 */
function buildContextInfo(session: ChatSession): string {
  const parts: string[] = [];

  // Session info
  parts.push(`Session age: ${Math.floor((Date.now() - session.createdAt.getTime()) / 1000)}s`);
  parts.push(`Message count: ${session.messages.length}`);
  parts.push(`Demo mode: ${session.isDemoMode ? 'yes' : 'no'}`);

  // Rack status
  if (session.rackData) {
    parts.push(`✅ User has rack: ${session.rackData.modules.length} modules`);
    if (session.capabilities) {
      const caps = session.capabilities;
      parts.push(`Capabilities: VCO=${caps.hasVCO}, VCF=${caps.hasVCF}, VCA=${caps.hasVCA}`);
    }
  } else {
    parts.push('❌ No rack uploaded yet');
  }

  // Patch status
  if (session.currentPatch) {
    parts.push(`✅ User has current patch: "${session.currentPatch.metadata.title}"`);
    parts.push(`Patch history count: ${session.patchHistory.length}`);
  } else {
    parts.push('❌ No patch generated yet');
  }

  // Recent conversation
  if (session.messages.length > 0) {
    const recentMessages = session.messages.slice(-3);
    parts.push('\nRecent conversation:');
    for (const msg of recentMessages) {
      parts.push(
        `  ${msg.role}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`
      );
    }
  }

  return parts.join('\n');
}

/**
 * Check if message looks like gibberish (heuristic fallback)
 */
export function isLikelyGibberish(text: string): boolean {
  // Very short
  if (text.length < 3) {
    return true;
  }

  // All uppercase with no spaces (keyboard mashing)
  if (/^[A-Z]{5,}$/.test(text)) {
    return true;
  }

  // No vowels (likely random consonants)
  if (!/[aeiouAEIOU]/.test(text) && text.length > 4) {
    return true;
  }

  // Repeating characters
  if (/(.)\1{4,}/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Quick rule-based intent detection (optional fast path)
 * Returns null if no obvious match, use AI for ambiguous cases
 */
export function quickIntentCheck(userMessage: string, session: ChatSession): Intent | null {
  const lower = userMessage.toLowerCase().trim();

  // Gibberish = demo request
  if (isLikelyGibberish(userMessage)) {
    return Intent.DEMO_REQUEST;
  }

  // Very short greetings
  if (/^(hi|hey|hello|yo|sup)$/i.test(lower)) {
    return Intent.CHAT;
  }

  // Explicit save requests
  if (session.currentPatch && /^(save|keep|bookmark|favorite)$/i.test(lower)) {
    return Intent.SAVE_PATCH;
  }

  // No obvious match - use AI
  return null;
}

/**
 * Detect intent with hybrid approach:
 * 1. Check quick rules first (fast, free)
 * 2. Fall back to AI for ambiguous cases (smart, costly)
 */
export async function detectIntentHybrid(
  userMessage: string,
  session: ChatSession
): Promise<IntentResult> {
  // Try quick check first
  const quickIntent = quickIntentCheck(userMessage, session);
  if (quickIntent) {
    logger.info('⚡ Quick intent detected (rule-based)', {
      intent: quickIntent,
      message: userMessage.substring(0, 50),
    });

    return {
      intent: quickIntent,
      confidence: 0.95,
      reasoning: 'Obvious pattern matched via rule-based detection',
    };
  }

  // Fall back to AI for ambiguous cases
  return detectIntent(userMessage, session);
}
