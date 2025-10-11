/**
 * Vision + Database Pipeline
 * POST /api/vision/analyze-and-enrich
 *
 * Complete pipeline:
 * 1. Vision analysis (identify modules)
 * 2. Database lookup (cache hit = instant + free)
 * 3. Enrichment (cache miss = save for future)
 * 4. Return enriched results with stats
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  analyzeRackImage,
  isVisionConfigured,
  getVisionModelInfo,
} from '@/lib/vision/rack-analyzer';
import { enrichModulesBatch, calculateEnrichmentStats } from '@/lib/modules/enrichment-v2';
import { isCosmosConfigured } from '@/lib/database/cosmos';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Check configuration
    if (!isVisionConfigured()) {
      return NextResponse.json(
        {
          error: 'Vision API not configured',
          message: 'Please add ANTHROPIC_API_KEY to your .env.local file',
          modelInfo: getVisionModelInfo(),
        },
        { status: 500 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        {
          error: 'No image provided',
          message: 'Please upload an image file',
          example: 'POST with multipart/form-data and "image" field',
        },
        { status: 400 }
      );
    }

    logger.info('📸 Processing rack image', {
      fileName: imageFile.name,
      fileType: imageFile.type,
      fileSize: imageFile.size
    });

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine image type
    let imageType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
    if (imageFile.type === 'image/png') imageType = 'image/png';
    if (imageFile.type === 'image/webp') imageType = 'image/webp';

    // Step 1: Vision Analysis
    const visionStart = Date.now();
    const visionAnalysis = await analyzeRackImage(buffer, imageType);
    const visionTime = Date.now() - visionStart;

    logger.info('✅ Vision analysis complete', {
      moduleCount: visionAnalysis.modules.length,
      duration: visionTime,
      quality: visionAnalysis.overallQuality
    });

    // Step 2: Database Enrichment (if Cosmos is configured)
    let enrichmentResults = null;
    let enrichmentStats = null;
    let enrichmentTime = 0;

    if (isCosmosConfigured() && visionAnalysis.modules.length > 0) {
      logger.info('🔍 Database enrichment starting');

      const enrichStart = Date.now();
      enrichmentResults = await enrichModulesBatch(visionAnalysis.modules);
      enrichmentTime = Date.now() - enrichStart;

      enrichmentStats = calculateEnrichmentStats(enrichmentResults);

      logger.info('✅ Enrichment complete', {
        cacheHits: enrichmentStats.cacheHits,
        cacheMisses: enrichmentStats.cacheMisses,
        hitRate: enrichmentStats.hitRate,
        duration: enrichmentTime
      });
    } else if (!isCosmosConfigured()) {
      logger.warn('⚠️  Cosmos DB not configured - skipping enrichment');
    }

    // Calculate cost
    const visionCost = (visionTime / 1000) * 0.0001; // Rough estimate
    const enrichmentCost = enrichmentStats ? enrichmentStats.cacheMisses * 0.1 : 0;
    const totalCost = visionCost + enrichmentCost;

    return NextResponse.json({
      success: true,
      timing: {
        visionAnalysis: `${(visionTime / 1000).toFixed(2)}s`,
        enrichment: isCosmosConfigured()
          ? `${(enrichmentTime / 1000).toFixed(2)}s`
          : 'not configured',
        total: `${((visionTime + enrichmentTime) / 1000).toFixed(2)}s`,
      },
      costs: {
        vision: `$${visionCost.toFixed(4)}`,
        enrichment: `$${enrichmentCost.toFixed(4)}`,
        total: `$${totalCost.toFixed(4)}`,
        saved: enrichmentStats ? `$${enrichmentStats.costSaved.toFixed(2)}` : '$0.00',
      },
      modelInfo: getVisionModelInfo(),
      databaseConfigured: isCosmosConfigured(),
      visionAnalysis,
      enrichment: enrichmentResults
        ? {
            results: enrichmentResults,
            stats: enrichmentStats,
          }
        : null,
      summary: {
        modulesDetected: visionAnalysis.modules.length,
        modulesEnriched: enrichmentResults?.length || 0,
        cacheHitRate: enrichmentStats ? `${enrichmentStats.hitRate.toFixed(1)}%` : 'N/A',
        costPerModule: enrichmentResults
          ? `$${(totalCost / enrichmentResults.length).toFixed(4)}`
          : 'N/A',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Vision + enrichment pipeline failed', {
      error: errorMessage,
      stack: errorStack
    });

    return NextResponse.json(
      {
        error: 'Pipeline failed',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
