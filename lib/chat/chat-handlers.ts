/**
 * Chat Intent Handlers
 * Handler functions for different chat intents (rack analysis, patch generation, etc.)
 */

import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRackCapabilities, analyzeRack } from '@/lib/scraper/analyzer';
import { generatePatch } from '@/lib/ai/claude';
import { savePatch } from '@/lib/database/patch-service';
import logger from '@/lib/logger';
import { type ChatSession, updateSession } from './session-state';
import { type Patch } from '@/types/patch';

/**
 * Stream controller type for sending updates to client
 */
export interface StreamController {
  enqueue: (chunk: Uint8Array) => void;
}

/**
 * Text encoder for streaming
 */
const encoder = new TextEncoder();

/**
 * Helper to send SSE messages
 */
function sendSSE(controller: StreamController, type: string, data: unknown) {
  const message = JSON.stringify({ type, ...data });
  controller.enqueue(encoder.encode(`data: ${message}\n\n`));
}

/**
 * Handle rack analysis intent
 * Scrapes ModularGrid URL, analyzes capabilities, updates session
 *
 * @param rackUrl - ModularGrid rack URL to analyze
 * @param session - Current chat session
 * @param controller - Stream controller for updates
 * @param userId - Optional user ID for saving data
 */
export async function handleRackAnalysis(
  rackUrl: string,
  session: ChatSession,
  controller: StreamController,
  userId?: string | null
): Promise<void> {
  try {
    logger.info('🕷️ Starting rack analysis', { rackUrl, sessionId: session.sessionId });

    // Send initial progress
    sendSSE(controller, 'content', { content: '🕷️ Analyzing your rack...\n' });

    // Scrape rack data
    const rackData = await scrapeModularGridRack(rackUrl);
    sendSSE(controller, 'content', {
      content: `✅ Found ${rackData.modules.length} modules\n`,
    });

    // Analyze capabilities
    const capabilities = analyzeRackCapabilities(rackData);
    const analysis = analyzeRack(capabilities, rackData);

    sendSSE(controller, 'content', {
      content: `🎸 Analyzing capabilities...\n`,
    });

    // Update session with rack data
    await updateSession(session.sessionId, {
      rackData,
      capabilities,
      analysis,
    });

    // Send completion message
    sendSSE(controller, 'content', {
      content: `\n✨ Analysis complete! Your rack has:\n`,
    });

    sendSSE(controller, 'content', {
      content: `- ${rackData.modules.length} modules\n`,
    });

    if (capabilities.vcos.length > 0) {
      sendSSE(controller, 'content', {
        content: `- ${capabilities.vcos.length} oscillators\n`,
      });
    }

    if (capabilities.vcfs.length > 0) {
      sendSSE(controller, 'content', {
        content: `- ${capabilities.vcfs.length} filters\n`,
      });
    }

    if (capabilities.vcas.length > 0) {
      sendSSE(controller, 'content', {
        content: `- ${capabilities.vcas.length} amplifiers\n`,
      });
    }

    sendSSE(controller, 'content', {
      content: `\n💡 What kind of sound would you like to create?\n`,
    });

    logger.info('✅ Rack analysis complete', {
      sessionId: session.sessionId,
      moduleCount: rackData.modules.length,
    });
  } catch (error) {
    logger.error('❌ Rack analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      rackUrl,
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to analyze rack. Please check the URL and try again.',
    });
  }
}

/**
 * Handle patch generation intent
 * Generates patch from session context, saves to database
 *
 * @param session - Current chat session (must have rackData)
 * @param userIntent - What the user wants to create
 * @param controller - Stream controller for updates
 * @param userId - Optional user ID for saving patch
 */
export async function handlePatchGeneration(
  session: ChatSession,
  userIntent: string,
  controller: StreamController,
  userId?: string | null
): Promise<Patch | null> {
  try {
    // Validate session has rack data
    if (!session.rackData || !session.capabilities || !session.analysis) {
      logger.warn('⚠️ Patch generation attempted without rack data', {
        sessionId: session.sessionId,
      });

      sendSSE(controller, 'content', {
        content: '⚠️ I need to analyze your rack first. Please share your ModularGrid URL.\n',
      });

      return null;
    }

    logger.info('🎨 Starting patch generation', {
      sessionId: session.sessionId,
      userIntent,
    });

    sendSSE(controller, 'content', {
      content: '🎨 Designing your patch...\n',
    });

    // Generate patch using AI
    const patch = await generatePatch(
      session.rackData,
      session.capabilities,
      session.analysis,
      userIntent,
      {
        difficulty: 'intermediate',
      }
    );

    sendSSE(controller, 'content', {
      content: `\n🎉 Created: **${patch.metadata.title}**\n\n`,
    });

    // Save patch to database if user is authenticated
    if (userId) {
      patch.userId = userId;
      const savedPatch = await savePatch(patch);

      sendSSE(controller, 'patch', { patch: savedPatch });

      logger.info('✅ Patch generated and saved', {
        sessionId: session.sessionId,
        patchId: savedPatch.id,
      });

      // Update session with current patch
      await updateSession(session.sessionId, {
        currentPatch: savedPatch,
        patchHistory: [...session.patchHistory, savedPatch],
      });

      return savedPatch;
    } else {
      // Anonymous user - just return patch without saving
      sendSSE(controller, 'patch', { patch });

      logger.info('✅ Patch generated (anonymous)', {
        sessionId: session.sessionId,
      });

      // Update session with current patch
      await updateSession(session.sessionId, {
        currentPatch: patch,
        patchHistory: [...session.patchHistory, patch],
      });

      return patch;
    }
  } catch (error) {
    logger.error('❌ Patch generation failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to generate patch. Please try again.',
    });

    return null;
  }
}

/**
 * Handle random rack intent
 * Selects random rack, sends humorous message, triggers analysis
 *
 * @param session - Current chat session
 * @param controller - Stream controller for updates
 * @param isGibberish - Whether this was triggered by gibberish
 */
export async function handleRandomRack(
  session: ChatSession,
  controller: StreamController,
  isGibberish: boolean = false
): Promise<void> {
  try {
    logger.info('🎲 Random rack request', {
      sessionId: session.sessionId,
      isGibberish,
    });

    // Import handlers dynamically to avoid circular dependencies
    const { handleGibberishInput, handleRandomRequest } = await import('./random-rack-handler');

    // Get random rack with appropriate message
    const result = isGibberish
      ? await handleGibberishInput(session.messages[session.messages.length - 1]?.content || '')
      : await handleRandomRequest();

    // Send humorous/encouraging message
    sendSSE(controller, 'content', {
      content: `${result.message}\n\n`,
    });

    // Trigger rack analysis with the random URL
    await handleRackAnalysis(result.rackUrl, session, controller);

    logger.info('✅ Random rack handled', {
      sessionId: session.sessionId,
      rackUrl: result.rackUrl,
    });
  } catch (error) {
    logger.error('❌ Random rack failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to load random rack. Please try again.',
    });
  }
}

/**
 * Handle conversational chat (no specific action)
 * Streams Claude response for general questions
 *
 * @param session - Current chat session
 * @param controller - Stream controller for updates
 */
export async function handleConversationalChat(
  session: ChatSession,
  controller: StreamController
): Promise<void> {
  try {
    logger.info('💬 Conversational chat', {
      sessionId: session.sessionId,
      messageCount: session.messages.length,
    });

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    const systemPrompt = `You are a friendly, knowledgeable modular synthesizer patch design assistant. Your goal is to help users create amazing patches through natural conversation.

CONVERSATION STYLE:
- Be warm, enthusiastic, and encouraging
- Ask clarifying questions if needed
- Explain technical concepts in accessible ways
- Use emojis occasionally for personality (🎸 🎛️ 🔊 ✨)
- Keep responses concise but informative

CAPABILITIES:
1. You can help users describe what they want to create
2. You can analyze their ModularGrid rack (if provided)
3. You can generate detailed patch instructions
4. You can explain synthesis techniques
5. You can suggest creative ideas

IMPORTANT:
- You are powered by AI-native intent detection - no keywords needed!
- When users share ModularGrid URLs, the system auto-analyzes them
- When users describe sounds, patches are generated automatically
- Focus on understanding what the user wants and guiding them

Be helpful, creative, and fun! 🎸`;

    // Stream Claude response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        sendSSE(controller, 'content', { content: chunk.delta.text });
      }
    }

    logger.info('✅ Conversational response complete', {
      sessionId: session.sessionId,
    });
  } catch (error) {
    logger.error('❌ Conversational chat failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to generate response. Please try again.',
    });
  }
}
