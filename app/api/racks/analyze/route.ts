/**
 * API Route: Analyze ModularGrid Rack
 * POST /api/racks/analyze
 *
 * VISION-FIRST ARCHITECTURE (October 2025):
 * - Supports both rack page URLs and CDN image URLs
 * - Fetches images directly from CDN (no scraping!)
 * - Uses Claude Vision for module identification
 * - Automatically builds module database
 * - 10x faster than previous scraping approach
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseRackUrl, type RackImageInput } from '@/lib/scraper/url-parser';
import { fetchRackImage } from '@/lib/scraper/image-fetcher';
import { analyzeRackImage } from '@/lib/vision/rack-analyzer';
import { analyzeRackCapabilities, analyzeRack, generateRackSummary } from '@/lib/scraper/analyzer';
import { upsertModule } from '@/lib/database/module-service';
import logger from '@/lib/logger';
import { saveRack } from '@/lib/database/rack-service';
import { type Module } from '@/types/module';

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

    // Parse URL (supports both rack page and CDN URLs)
    let rackInput: RackImageInput;
    try {
      rackInput = parseRackUrl(url);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid URL format',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    logger.info('🔍 Analyzing rack (vision-first)', {
      userId,
      inputType: rackInput.type,
      rackId: rackInput.rackId,
    });

    // Fetch image from CDN (fast, no scraping!)
    const imageResult = await fetchRackImage(rackInput.cdnUrl);

    logger.info('🖼️  Image fetched', {
      sizeKB: (imageResult.sizeBytes / 1024).toFixed(2),
      fetchTimeMs: imageResult.fetchTimeMs,
    });

    // Vision analysis with Claude Sonnet 4.5
    const visionAnalysis = await analyzeRackImage(imageResult.buffer, 'image/jpeg');

    logger.info('👁️  Vision analysis complete', {
      modulesIdentified: visionAnalysis.modules.length,
      rows: visionAnalysis.rackLayout.rows,
      estimatedHP: visionAnalysis.rackLayout.estimatedHP,
      quality: visionAnalysis.overallQuality,
    });

    // Convert vision modules to our Module type
    const modules: Module[] = visionAnalysis.modules.map((vm) => ({
      id: `${vm.manufacturer?.toLowerCase().replace(/\s+/g, '-')}_${vm.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: vm.name,
      manufacturer: vm.manufacturer || 'Unknown',
      type: 'Other', // Will be enhanced by analyzer
      hp: vm.position.width,
      power: {}, // Vision analysis doesn't provide power consumption data
      inputs: [],
      outputs: [],
      position: {
        row: Math.floor(vm.position.y * visionAnalysis.rackLayout.rows),
        column: Math.floor(vm.position.x * 100), // Approximate column
      },
      description: vm.notes,
    }));

    // Save high-confidence modules to database (automatic growth!)
    let savedModuleCount = 0;
    for (const visionModule of visionAnalysis.modules) {
      if (visionModule.confidence > 0.7) {
        try {
          await upsertModule(
            {
              name: visionModule.name,
              manufacturer: visionModule.manufacturer || 'Unknown',
              type: 'Other',
              hp: visionModule.position.width,
              inputs: [],
              outputs: [],
            },
            'vision',
            visionModule.confidence
          );
          savedModuleCount++;
        } catch (error) {
          // Log but don't fail the whole request
          logger.warn('⚠️  Failed to save module to database', {
            module: visionModule.name,
            error: error instanceof Error ? error.message : 'Unknown',
          });
        }
      }
    }

    logger.info('💾 Modules saved to database', {
      saved: savedModuleCount,
      total: visionAnalysis.modules.length,
    });

    // Create parsed rack structure for compatibility
    const parsedRack = {
      url: rackInput.pageUrl || rackInput.cdnUrl,
      modules,
      rows: [],
      metadata: {
        rackId: rackInput.rackId,
        rackName: `Rack ${rackInput.rackId}`, // No name from vision-only
      },
    };

    // Analyze capabilities and generate full analysis
    const capabilities = analyzeRackCapabilities(modules);
    const analysis = analyzeRack(parsedRack);
    const summary = generateRackSummary(parsedRack, analysis);

    // Save rack to database cache (graceful degradation if DB unavailable)
    try {
      await saveRack(parsedRack, capabilities, analysis);
      logger.info('💾 Rack saved to database cache', {
        rackId: parsedRack.metadata.rackId,
        url: parsedRack.url,
      });
    } catch (error) {
      logger.error('⚠️  Failed to save rack to database cache', {
        rackId: parsedRack.metadata.rackId,
        url: parsedRack.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue - rack analysis succeeded even if save failed
    }

    // Return analysis with vision metrics
    return NextResponse.json({
      success: true,
      method: 'vision-first', // NEW: Indicates we used vision analysis
      inputType: rackInput.type, // rack_page_url or cdn_image_url
      rack: {
        id: parsedRack.metadata.rackId,
        name: parsedRack.metadata.rackName,
        url: parsedRack.url,
        cdnUrl: rackInput.cdnUrl,
        pageUrl: rackInput.pageUrl,
        moduleCount: parsedRack.modules.length,
        rows: visionAnalysis.rackLayout.rows,
        totalHP: visionAnalysis.rackLayout.estimatedHP,
      },
      modules: parsedRack.modules,
      capabilities,
      analysis,
      summary,
      visionMetrics: {
        quality: visionAnalysis.overallQuality,
        avgConfidence:
          visionAnalysis.modules.reduce((sum, m) => sum + m.confidence, 0) /
          visionAnalysis.modules.length,
        highConfidenceCount: visionAnalysis.modules.filter((m) => m.confidence > 0.8).length,
        savedToDatabase: savedModuleCount,
        fetchTimeMs: imageResult.fetchTimeMs,
      },
      recommendations: visionAnalysis.recommendations,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Rack analysis failed', {
      error: errorMessage,
      stack: errorStack,
    });

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
