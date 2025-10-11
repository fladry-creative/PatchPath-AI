/**
 * Vision-Based Rack Analysis Endpoint
 * POST /api/vision/analyze-rack
 * Accepts: multipart/form-data with image file
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeRackImage, isVisionConfigured, getVisionModelInfo } from '@/lib/vision/rack-analyzer';
import { enrichModules } from '@/lib/modules/enrichment';

export async function POST(request: NextRequest) {
  try {
    // Check vision configuration
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
    const enrichData = formData.get('enrich') === 'true';

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

    console.log(`📸 Analyzing rack image: ${imageFile.name} (${imageFile.type})`);

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine image type
    let imageType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
    if (imageFile.type === 'image/png') imageType = 'image/png';
    if (imageFile.type === 'image/webp') imageType = 'image/webp';

    // Step 1: Vision analysis
    const startTime = Date.now();
    const visionAnalysis = await analyzeRackImage(buffer, imageType);
    const visionTime = Date.now() - startTime;

    console.log(`✅ Vision analysis complete in ${(visionTime / 1000).toFixed(2)}s`);

    // Step 2: Optional enrichment
    let enrichedModules = null;
    let enrichmentTime = 0;

    if (enrichData && visionAnalysis.modules.length > 0) {
      console.log(`🔎 Enriching ${visionAnalysis.modules.length} modules...`);

      const enrichStart = Date.now();
      enrichedModules = await enrichModules(
        visionAnalysis.modules.map(m => ({
          name: m.name,
          manufacturer: m.manufacturer,
        }))
      );
      enrichmentTime = Date.now() - enrichStart;

      console.log(`✅ Enrichment complete in ${(enrichmentTime / 1000).toFixed(2)}s`);
    }

    return NextResponse.json({
      success: true,
      timing: {
        visionAnalysis: `${(visionTime / 1000).toFixed(2)}s`,
        enrichment: enrichData ? `${(enrichmentTime / 1000).toFixed(2)}s` : 'skipped',
        total: `${((visionTime + enrichmentTime) / 1000).toFixed(2)}s`,
      },
      modelInfo: getVisionModelInfo(),
      visionAnalysis,
      enrichedModules,
      summary: {
        modulesDetected: visionAnalysis.modules.length,
        highConfidence: visionAnalysis.modules.filter(m => m.confidence > 0.8).length,
        mediumConfidence: visionAnalysis.modules.filter(m => m.confidence >= 0.5 && m.confidence <= 0.8).length,
        lowConfidence: visionAnalysis.modules.filter(m => m.confidence < 0.5).length,
        enriched: enrichData ? enrichedModules?.length || 0 : 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Vision analysis failed:', error);

    return NextResponse.json(
      {
        error: 'Vision analysis failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Allow public access for testing
export const runtime = 'nodejs';
