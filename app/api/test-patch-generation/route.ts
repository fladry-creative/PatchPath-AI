/**
 * Test Patch Generation Endpoint (Development Only)
 * GET /api/test-patch-generation?url=...&intent=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities } from '@/lib/scraper/analyzer';
import { generatePatch, isClaudeConfigured, getModelInfo } from '@/lib/ai/claude';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Check Claude configuration
    if (!isClaudeConfigured()) {
      return NextResponse.json(
        {
          error: 'Claude API not configured',
          message: 'Please add ANTHROPIC_API_KEY to your .env.local file',
          modelInfo: getModelInfo(),
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const intent = searchParams.get('intent') || 'Create an ambient, evolving soundscape';
    const technique = searchParams.get('technique') || undefined;
    const genre = searchParams.get('genre') || undefined;

    if (!url) {
      return NextResponse.json(
        {
          error: 'URL parameter is required',
          example: '/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&intent=dark+ambient+drone',
          modelInfo: getModelInfo(),
        },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing patch generation...`);
    console.log(`   Rack: ${url}`);
    console.log(`   Intent: ${intent}`);

    // Step 1: Analyze rack
    const parsedRack = await scrapeModularGridRack(url);
    const capabilities = analyzeRackCapabilities(parsedRack.modules);
    const analysis = analyzeRack(parsedRack);

    // Step 2: Generate patch
    const startTime = Date.now();
    const patch = await generatePatch(
      parsedRack,
      capabilities,
      analysis,
      intent,
      { technique, genre }
    );
    const generationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      generationTime: `${(generationTime / 1000).toFixed(2)}s`,
      modelInfo: getModelInfo(),
      rack: {
        id: parsedRack.metadata.rackId,
        name: parsedRack.metadata.rackName,
        moduleCount: parsedRack.modules.length,
      },
      capabilities,
      analysis,
      patch: {
        ...patch,
        // Add some helpful formatting
        _summary: {
          title: patch.metadata.title,
          difficulty: patch.metadata.difficulty,
          estimatedTime: `${patch.metadata.estimatedTime} minutes`,
          techniques: patch.metadata.techniques,
          genres: patch.metadata.genres,
          connectionCount: patch.connections.length,
          stepCount: patch.patchingOrder.length,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Test patch generation failed:', error);

    return NextResponse.json(
      {
        error: 'Patch generation test failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
