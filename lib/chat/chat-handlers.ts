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
import { refinePatch, handleSaveIntent, handleStartFreshIntent, handleVariationsIntent, checkSpecialIntents } from './patch-refinement';
import { detectSaveIntent } from './save-detector';

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

/**
 * Handle patch refinement intent
 * Refines existing patch based on user feedback
 *
 * @param session - Current chat session (must have currentPatch)
 * @param userFeedback - What the user wants to change
 * @param controller - Stream controller for updates
 * @param userId - Optional user ID for saving patch
 */
export async function handlePatchRefinement(
  session: ChatSession,
  userFeedback: string,
  controller: StreamController,
  userId?: string | null
): Promise<void> {
  try {
    // Validate session has current patch
    if (!session.currentPatch || !session.rackData) {
      logger.warn('⚠️ Patch refinement attempted without current patch', {
        sessionId: session.sessionId,
      });

      sendSSE(controller, 'content', {
        content: '⚠️ I need a patch to refine first. Let me generate one for you!\n',
      });

      // Fallback to patch generation
      await handlePatchGeneration(session, userFeedback, controller, userId);
      return;
    }

    logger.info('🔧 Starting patch refinement', {
      sessionId: session.sessionId,
      patchTitle: session.currentPatch.metadata.title,
      userFeedback,
    });

    sendSSE(controller, 'content', {
      content: '🔧 Refining your patch...\n',
    });

    // Refine the patch
    const result = await refinePatch(session.currentPatch, userFeedback, session.rackData);

    if (!result.success) {
      sendSSE(controller, 'content', {
        content: `❌ ${result.message}\n`,
      });
      return;
    }

    // Update session with refined patch
    if (result.updatedPatch) {
      // Save previous patch to history for undo
      const previousPatch = session.currentPatch;
      
      // Update session
      await updateSession(session.sessionId, {
        currentPatch: result.updatedPatch,
        patchHistory: [...session.patchHistory, previousPatch],
        modifications: [...session.modifications, result.modification!],
      });

      // Send update message
      sendSSE(controller, 'content', {
        content: `${result.message}\n\n`,
      });

      // Send updated patch
      sendSSE(controller, 'patch', { patch: result.updatedPatch });

      // Ask for next feedback
      sendSSE(controller, 'content', {
        content: 'How does that sound? Want to make any other changes?\n',
      });

      logger.info('✅ Patch refinement complete', {
        sessionId: session.sessionId,
        patchTitle: result.updatedPatch.metadata.title,
      });
    }

  } catch (error) {
    logger.error('❌ Patch refinement failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to refine patch. Please try again.',
    });
  }
}

/**
 * Handle save patch intent
 * Saves current patch to user's cookbook
 *
 * @param session - Current chat session (must have currentPatch)
 * @param controller - Stream controller for updates
 * @param userId - User ID for saving patch
 */
export async function handlePatchSave(
  session: ChatSession,
  controller: StreamController,
  userId: string
): Promise<void> {
  try {
    // Validate session has current patch
    if (!session.currentPatch) {
      logger.warn('⚠️ Patch save attempted without current patch', {
        sessionId: session.sessionId,
      });

      sendSSE(controller, 'content', {
        content: '⚠️ No patch to save yet! Let me generate one for you.\n',
      });
      return;
    }

    logger.info('💾 Starting patch save', {
      sessionId: session.sessionId,
      patchTitle: session.currentPatch.metadata.title,
      userId,
    });

    sendSSE(controller, 'content', {
      content: '💾 Saving your patch...\n',
    });

    // Handle save intent
    const saveResult = handleSaveIntent(
      session.currentPatch,
      session.modifications,
      session.messages.map(m => m.content)
    );

    if (!saveResult.shouldSave) {
      sendSSE(controller, 'content', {
        content: '❌ Could not save patch. Please try again.\n',
      });
      return;
    }

    // Update patch with new name
    const updatedPatch = {
      ...session.currentPatch,
      metadata: {
        ...session.currentPatch.metadata,
        title: saveResult.patchName!,
      },
      userId,
      saved: true,
    };

    // Save to database
    const savedPatch = await savePatch(updatedPatch);

    // Update session
    await updateSession(session.sessionId, {
      currentPatch: savedPatch,
    });

    // Send confirmation
    sendSSE(controller, 'content', {
      content: `${saveResult.confirmationMessage}\n`,
    });

    logger.info('✅ Patch saved successfully', {
      sessionId: session.sessionId,
      patchId: savedPatch.id,
      patchName: saveResult.patchName,
    });

  } catch (error) {
    logger.error('❌ Patch save failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to save patch. Please try again.',
    });
  }
}

/**
 * Handle start fresh intent
 * Clears current patch and starts new generation
 *
 * @param session - Current chat session
 * @param controller - Stream controller for updates
 * @param userId - Optional user ID
 */
export async function handleStartFresh(
  session: ChatSession,
  controller: StreamController,
  userId?: string | null
): Promise<void> {
  try {
    logger.info('🔄 Starting fresh', {
      sessionId: session.sessionId,
    });

    // Clear current patch and modifications
    await updateSession(session.sessionId, {
      currentPatch: undefined,
      modifications: [],
    });

    // Send message
    const result = handleStartFreshIntent();
    sendSSE(controller, 'content', {
      content: `${result.message}\n`,
    });

    logger.info('✅ Started fresh', {
      sessionId: session.sessionId,
    });

  } catch (error) {
    logger.error('❌ Start fresh failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to start fresh. Please try again.',
    });
  }
}

/**
 * Handle variations intent
 * Generates variations of current patch
 *
 * @param session - Current chat session (must have currentPatch)
 * @param controller - Stream controller for updates
 * @param userId - Optional user ID
 */
export async function handlePatchVariations(
  session: ChatSession,
  controller: StreamController,
  userId?: string | null
): Promise<void> {
  try {
    // Validate session has current patch and rack data
    if (!session.currentPatch || !session.rackData || !session.capabilities || !session.analysis) {
      logger.warn('⚠️ Patch variations attempted without current patch or rack data', {
        sessionId: session.sessionId,
      });

      sendSSE(controller, 'content', {
        content: '⚠️ I need a patch and rack to generate variations. Let me help you get started!\n',
      });
      return;
    }

    logger.info('🎨 Starting patch variations', {
      sessionId: session.sessionId,
      patchTitle: session.currentPatch.metadata.title,
    });

    sendSSE(controller, 'content', {
      content: '🎨 Generating variations...\n',
    });

    // Generate variations using existing patch generation
    const variations: Patch[] = [];
    const variationIntents = [
      'Make it darker and more atmospheric',
      'Add more rhythmic elements and movement',
      'Create a brighter, more melodic version',
      'Make it more experimental and chaotic',
      'Simplify it for a cleaner sound',
    ];

    for (const intent of variationIntents) {
      try {
        const variation = await generatePatch(
          session.rackData,
          session.capabilities,
          session.analysis,
          intent,
          { difficulty: 'intermediate' }
        );
        variations.push(variation);
      } catch (error) {
        logger.warn('⚠️ Failed to generate variation', {
          intent,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    if (variations.length === 0) {
      sendSSE(controller, 'content', {
        content: '❌ Could not generate variations. Please try again.\n',
      });
      return;
    }

    // Send variations
    const result = handleVariationsIntent();
    sendSSE(controller, 'content', {
      content: `${result.message}\n`,
    });

    // Send each variation
    for (const variation of variations) {
      sendSSE(controller, 'patch', { patch: variation });
    }

    // Ask which one they like
    sendSSE(controller, 'content', {
      content: '\nWhich variation interests you most? You can say "make it darker" or "I like the second one" to refine any of them!\n',
    });

    logger.info('✅ Patch variations complete', {
      sessionId: session.sessionId,
      variationCount: variations.length,
    });

  } catch (error) {
    logger.error('❌ Patch variations failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      sessionId: session.sessionId,
    });

    sendSSE(controller, 'error', {
      error: 'Failed to generate variations. Please try again.',
    });
  }
}
