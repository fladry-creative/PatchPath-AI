/**
 * API Route: Generate Patch
 * POST /api/patches/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities } from '@/lib/scraper/analyzer';
import { generatePatch, generatePatchVariations, isClaudeConfigured } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Claude configuration
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'Claude API is not configured. Please add ANTHROPIC_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { rackUrl, intent, technique, genre, difficulty, generateVariations } = body;

    if (!rackUrl) {
      return NextResponse.json(
        { error: 'Rack URL is required' },
        { status: 400 }
      );
    }

    if (!intent) {
      return NextResponse.json(
        { error: 'User intent is required (e.g., "I want dark ambient sounds")' },
        { status: 400 }
      );
    }

    console.log(`🎨 Patch generation request from user ${userId}`);
    console.log(`   Rack: ${rackUrl}`);
    console.log(`   Intent: ${intent}`);

    // Step 1: Scrape rack
    console.log('📥 Step 1: Analyzing rack...');
    const parsedRack = await scrapeModularGridRack(rackUrl);
    const capabilities = analyzeRackCapabilities(parsedRack.modules);
    const analysis = analyzeRack(parsedRack);

    // Step 2: Generate patch with Claude
    console.log('🤖 Step 2: Generating patch with AI...');
    const patch = await generatePatch(
      parsedRack,
      capabilities,
      analysis,
      intent,
      { technique, genre, difficulty }
    );

    // Set user ID
    patch.userId = userId;

    // Step 3: Generate variations if requested
    let variations = [];
    if (generateVariations) {
      console.log('🔄 Step 3: Generating variations...');
      variations = await generatePatchVariations(
        patch,
        parsedRack,
        capabilities,
        3
      );
    }

    // TODO: Save to Cosmos DB
    // await savePatchToDatabase(patch);

    console.log(`✅ Patch generated successfully!`);

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

  } catch (error: any) {
    console.error('❌ Patch generation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate patch',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
