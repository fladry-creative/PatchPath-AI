/**
 * Test Scraper Endpoint (Development Only)
 * GET /api/test-scraper?url=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities, generateRackSummary } from '@/lib/scraper/analyzer';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required. Example: /api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing scraper with URL: ${url}`);

    // Scrape and analyze
    const parsedRack = await scrapeModularGridRack(url);
    const capabilities = analyzeRackCapabilities(parsedRack.modules);
    const analysis = analyzeRack(parsedRack);
    const summary = generateRackSummary(parsedRack, analysis);

    return NextResponse.json({
      success: true,
      rack: {
        id: parsedRack.metadata.rackId,
        name: parsedRack.metadata.rackName,
        url: parsedRack.url,
        moduleCount: parsedRack.modules.length,
        rows: parsedRack.rows.length,
      },
      modules: parsedRack.modules,
      capabilities,
      analysis,
      summary,
      rawData: parsedRack, // Include full data for debugging
    });

  } catch (error: any) {
    console.error('❌ Test scraper failed:', error);

    return NextResponse.json(
      {
        error: 'Scraper test failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
