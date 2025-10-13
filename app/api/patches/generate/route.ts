/**
 * API Route: Generate Patch
 * POST /api/patches/generate
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities } from '@/lib/scraper/analyzer';
import { generatePatch, generatePatchVariations, isClaudeConfigured } from '@/lib/ai/claude';
import { generatePatchDiagram, isGeminiConfigured } from '@/lib/ai/gemini';
import { type Patch } from '@/types/patch';
import logger from '@/lib/logger';
import { savePatch } from '@/lib/database/patch-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Claude configuration
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        {
          error:
            'Claude API is not configured. Please add ANTHROPIC_API_KEY to environment variables.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { rackUrl, intent, technique, genre, difficulty, generateVariations } = body;

    if (!rackUrl) {
      return NextResponse.json({ error: 'Rack URL is required' }, { status: 400 });
    }

    if (!intent) {
      return NextResponse.json(
        { error: 'User intent is required (e.g., "I want dark ambient sounds")' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    logger.info('🎨 Patch generation request received', {
      userId,
      rackUrl,
      intent,
      technique,
      genre,
      difficulty,
      generateVariations,
    });

    // Step 1: Scrape rack
    logger.info('📥 Step 1: Analyzing rack');
    const parsedRack = await scrapeModularGridRack(rackUrl);
    const capabilities = analyzeRackCapabilities(parsedRack.modules);
    const analysis = analyzeRack(parsedRack);

    // Step 2: Generate patch with Claude
    logger.info('🤖 Step 2: Generating patch with AI');
    const patch = await generatePatch(parsedRack, capabilities, analysis, intent, {
      technique,
      genre,
      difficulty,
    });

    // Set user ID
    patch.userId = userId;

    // Step 3: Generate AI diagram (graceful degradation if unavailable)
    if (isGeminiConfigured()) {
      try {
        logger.info('🎨 Step 3: Generating AI diagram with Gemini');
        const diagramResult = await generatePatchDiagram({
          patch,
          modules: parsedRack.modules,
          aspectRatio: '1:1', // Default to Instagram-friendly square
        });

        // Attach diagram data to patch
        patch.diagramData = diagramResult.imageData;
        patch.diagramAspectRatio = diagramResult.aspectRatio;
        patch.diagramGeneratedAt = new Date();
        patch.diagramCost = diagramResult.cost;

        logger.info('✅ AI diagram generated successfully', {
          patchId: patch.id,
          generationTime: diagramResult.generationTime,
          cost: diagramResult.cost,
        });
      } catch (error) {
        logger.warn('⚠️  Diagram generation failed, continuing without diagram', {
          patchId: patch.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue without diagram - patch is still valid
      }
    } else {
      logger.info('⏭️  Skipping diagram generation - Gemini not configured');
    }

    // Step 4: Generate variations if requested
    let variations: Patch[] = [];
    if (generateVariations) {
      logger.info('🔄 Step 4: Generating variations');
      variations = await generatePatchVariations(patch, parsedRack, capabilities, 3);
    }

    // Step 5: Save patch to database (graceful degradation if DB unavailable)
    try {
      await savePatch(patch);
      logger.info('💾 Patch saved to database', {
        patchId: patch.id,
        userId: patch.userId,
      });
    } catch (error) {
      logger.error('⚠️  Failed to save patch to database', {
        patchId: patch.id,
        userId: patch.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue - patch generation succeeded even if save failed
    }

    const duration = Date.now() - startTime;
    logger.info('✅ Patch generated successfully', {
      patchId: patch.id,
      rackId: parsedRack.metadata.rackId,
      userId,
      connectionCount: patch.connections.length,
      techniqueCount: patch.metadata.techniques.length,
      variationCount: variations.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      patch,
      variations: variations.length > 0 ? variations : undefined,
      rack: {
        id: parsedRack.metadata.rackId,
        name: parsedRack.metadata.rackName,
        moduleCount: parsedRack.modules.length,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Patch generation failed', {
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: 'Failed to generate patch',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
