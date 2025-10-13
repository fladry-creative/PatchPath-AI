import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRackCapabilities, analyzeRack } from '@/lib/scraper/analyzer';
import { generatePatch } from '@/lib/ai/claude';
import logger from '@/lib/logger';
import { auth } from '@clerk/nextjs/server';
import { savePatch } from '@/lib/database/patch-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-5';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Streaming chat endpoint for conversational patch generation
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let sessionUserId: string | null = null;

  try {
    // Get authenticated user
    const { userId } = await auth();
    sessionUserId = userId;

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, rackUrl } = (await request.json()) as {
      messages: ChatMessage[];
      rackUrl?: string;
    };

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    logger.info('💬 Chat session started', {
      userId,
      messageCount: messages.length,
      hasRackUrl: !!rackUrl,
    });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build system prompt for conversational assistant
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

PATCH GENERATION WORKFLOW:
When a user is ready to generate a patch:
1. Confirm you have their rack URL (if not, ask for it)
2. Confirm you understand what they want to create
3. Respond with: "Let me generate that patch for you!" followed by [GENERATE_PATCH]
4. The system will then create the actual patch

IMPORTANT:
- You are the conversational interface, not the patch generator itself
- When ready to generate, use the [GENERATE_PATCH] marker
- Don't try to list cable connections yourself - let the patch generation system handle that

Be helpful, creative, and fun! 🎸`;

          // Detect if we should generate a patch
          const lastUserMessage = messages[messages.length - 1];
          const shouldGeneratePatch =
            lastUserMessage.role === 'user' &&
            rackUrl &&
            (lastUserMessage.content.toLowerCase().includes('generate') ||
              lastUserMessage.content.toLowerCase().includes('create') ||
              lastUserMessage.content.toLowerCase().includes('make') ||
              lastUserMessage.content.toLowerCase().includes('build'));

          // If we should generate a patch, do it!
          if (shouldGeneratePatch) {
            logger.info('🎨 Detected patch generation intent', { userId, rackUrl });

            // Send thinking message
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'content', content: 'Great! Let me design that patch for you...\n\n🎛️ Analyzing your rack...\n' })}\n\n`
              )
            );

            try {
              // Scrape and analyze rack
              const rackData = await scrapeModularGridRack(rackUrl);
              const capabilities = analyzeRackCapabilities(rackData);
              const analysis = analyzeRack(capabilities, rackData);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content: `✅ Found ${rackData.modules.length} modules\n🎸 Generating your patch...\n\n` })}\n\n`
                )
              );

              // Generate patch using AI
              const patch = await generatePatch(
                rackData,
                capabilities,
                analysis,
                lastUserMessage.content,
                {
                  difficulty: 'intermediate',
                }
              );

              // Save patch to database
              patch.userId = userId;
              const savedPatch = await savePatch(patch);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content: `🎉 Patch created: **${savedPatch.metadata.title}**\n\n${savedPatch.metadata.description}\n\nCheck out the full patch below!` })}\n\n`
                )
              );

              // Send patch data
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'patch', patch: savedPatch })}\n\n`)
              );

              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            } catch (patchError) {
              logger.error('❌ Patch generation failed in chat', {
                error: patchError instanceof Error ? patchError.message : 'Unknown',
                userId,
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate patch. Please check your rack URL and try again.' })}\n\n`
                )
              );
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            }
          }

          // Regular conversation - stream Claude response
          const stream = await anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });

          // Stream the response
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;

              // Send text chunk to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', content: text })}\n\n`)
              );
            }
          }

          // Done
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

          logger.info('✅ Chat response sent', { userId, messageCount: messages.length });
        } catch (error) {
          logger.error('❌ Chat stream error', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId: sessionUserId,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Something went wrong. Please try again.' })}\n\n`
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
