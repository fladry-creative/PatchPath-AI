/**
 * AI-Native Chat API Route
 * Streaming chat endpoint with intelligent intent detection
 * NO KEYWORD MATCHING - Pure AI-powered conversation routing
 */

import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import logger from '@/lib/logger';
import { getOrCreateSession, addMessage, type ChatSession } from '@/lib/chat/session-state';
import { detectIntent, Intent } from '@/lib/chat/intent-detector';
import { extractModularGridUrl, analyzeUserInput } from '@/lib/chat/url-extractor';
import {
  handleRackAnalysis,
  handlePatchGeneration,
  handleRandomRack,
  handleConversationalChat,
} from '@/lib/chat/chat-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string; // Frontend provides this
  rackUrl?: string; // Legacy support (will be auto-extracted)
}

/**
 * POST /api/chat/patches
 * AI-native streaming chat with automatic intent detection
 */
export async function POST(request: NextRequest) {
  let sessionUserId: string | null = null;
  let session: ChatSession | null = null;

  try {
    // Get authenticated user (allow anonymous for demo mode)
    const { userId } = await auth();
    sessionUserId = userId;

    // Parse request
    const body = (await request.json()) as ChatRequest;
    const { messages, sessionId: clientSessionId } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    logger.info('💬 Chat request received', {
      userId: userId || 'anonymous',
      messageCount: messages.length,
      sessionId: clientSessionId,
    });

    // Get or create session
    const sessionIdToUse =
      clientSessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    session = await getOrCreateSession(sessionIdToUse, userId);

    if (!session) {
      throw new Error('Failed to create session');
    }

    // Add user message to session history
    await addMessage(session.sessionId, {
      role: 'user',
      content: lastUserMessage.content,
      timestamp: new Date(),
    });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. ANALYZE USER INPUT - Extract URL, detect gibberish
          const textAnalysis = analyzeUserInput(lastUserMessage.content);

          logger.debug('🔍 Text analysis', {
            sessionId: session!.sessionId,
            analysis: textAnalysis,
          });

          // 2. AUTO-EXTRACT URL AND TRIGGER ANALYSIS
          if (textAnalysis.hasUrl && textAnalysis.url) {
            // User shared a ModularGrid URL - analyze it immediately!
            const newUrl = textAnalysis.url;

            // Only analyze if it's a new URL
            if (session!.rackData?.rackUrl !== newUrl) {
              await handleRackAnalysis(newUrl, session!, controller, userId);

              // Done with this request
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            }
          }

          // 3. DETECT INTENT USING AI
          const intentResult = await detectIntent(lastUserMessage.content, session!);

          logger.info('🎯 Intent detected', {
            sessionId: session!.sessionId,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
          });

          // 4. ROUTE BASED ON INTENT (NO KEYWORDS!)
          switch (intentResult.intent) {
            case Intent.GENERATE_PATCH:
              // User wants to generate a patch
              await handlePatchGeneration(session!, lastUserMessage.content, controller, userId);
              break;

            case Intent.DEMO_REQUEST:
            case Intent.UNKNOWN:
              // User sent gibberish OR explicitly wants demo/random rack
              await handleRandomRack(session!, controller, textAnalysis.isGibberish);
              break;

            case Intent.CHAT:
            case Intent.EXPLAIN_TECHNIQUE:
            default:
              // General conversation or questions
              await handleConversationalChat(session!, controller);
              break;
          }

          // Done
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

          logger.info('✅ Chat response complete', {
            sessionId: session!.sessionId,
            intent: intentResult.intent,
          });
        } catch (streamError) {
          logger.error('❌ Stream error', {
            error: streamError instanceof Error ? streamError.message : 'Unknown',
            sessionId: session?.sessionId,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: 'Something went wrong. Please try again.',
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('❌ Chat API error', {
      error: error instanceof Error ? error.message : 'Unknown',
      userId: sessionUserId,
      sessionId: session?.sessionId,
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
