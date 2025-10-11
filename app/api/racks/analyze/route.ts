/**
 * API Route: Analyze ModularGrid Rack
 * POST /api/racks/analyze
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { scrapeModularGridRack, isValidModularGridUrl } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities, generateRackSummary } from '@/lib/scraper/analyzer';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'ModularGrid URL is required' }, { status: 400 });
    }

    // Validate URL
    if (!isValidModularGridUrl(url)) {
      return NextResponse.json(
        {
          error:
            'Invalid ModularGrid rack URL. Must be in format: https://modulargrid.net/e/racks/view/[id]',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Analyzing rack for user ${userId}: ${url}`);

    // Scrape rack data
    const parsedRack = await scrapeModularGridRack(url);

    // Analyze capabilities
    const capabilities = analyzeRackCapabilities(parsedRack.modules);
    const analysis = analyzeRack(parsedRack);
    const summary = generateRackSummary(parsedRack, analysis);

    // TODO: Save to Cosmos DB
    // await saveRackToDatabase(userId, parsedRack, capabilities, analysis);

    // Return analysis
    return NextResponse.json({
      success: true,
      rack: {
        id: parsedRack.metadata.rackId,
        name: parsedRack.metadata.rackName,
        url: parsedRack.url,
        moduleCount: parsedRack.modules.length,
        rows: parsedRack.rows.length,
        totalHP: capabilities.totalHP,
      },
      modules: parsedRack.modules,
      capabilities,
      analysis,
      summary,
    });
  } catch (error: unknown) {
    console.error('❌ Rack analysis failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to analyze rack',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
