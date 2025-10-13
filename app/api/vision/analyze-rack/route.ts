/**
 * Vision-Based Rack Analysis Endpoint
 * POST /api/vision/analyze-rack
 * Accepts: multipart/form-data with image file
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  analyzeRackImage,
  isVisionConfigured,
  getVisionModelInfo,
} from '@/lib/vision/rack-analyzer';
import { enrichModules } from '@/lib/modules/enrichment';
import logger from '@/lib/logger';

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

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let imageType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
    let enrichData = false;
    let userId: string | null = null;

    // Handle both JSON (base64) and FormData
    if (contentType.includes('application/json')) {
      // JSON with base64 image data
      const body = await request.json();

      if (!body.imageData) {
        return NextResponse.json(
          {
            error: 'No image data provided',
            message: 'Please provide base64 image data in the "imageData" field',
          },
          { status: 400 }
        );
      }

      // Decode base64 to buffer
      buffer = Buffer.from(body.imageData, 'base64');
      imageType = body.imageType || 'image/jpeg';
      enrichData = body.enrich === true;
      userId = body.userId || null;

      logger.info('📸 Analyzing rack image (base64)', {
        imageType,
        bufferSize: buffer.length,
        enrich: enrichData,
        userId,
      });
    } else {
      // FormData with file upload
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;
      enrichData = formData.get('enrich') === 'true';
      userId = (formData.get('userId') as string) || null;

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

      logger.info('📸 Analyzing rack image (file upload)', {
        fileName: imageFile.name,
        fileType: imageFile.type,
        fileSize: imageFile.size,
        enrich: enrichData,
        userId,
      });

      // Convert file to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      // Determine image type
      if (imageFile.type === 'image/png') imageType = 'image/png';
      if (imageFile.type === 'image/webp') imageType = 'image/webp';
    }

    // Step 1: Vision analysis
    const startTime = Date.now();
    const visionAnalysis = await analyzeRackImage(buffer, imageType);
    const visionTime = Date.now() - startTime;

    logger.info('✅ Vision analysis complete', {
      moduleCount: visionAnalysis.modules.length,
      duration: visionTime,
    });

    // Step 2: Optional enrichment
    let enrichedModules = null;
    let enrichmentTime = 0;

    if (enrichData && visionAnalysis.modules.length > 0) {
      logger.info('🔎 Enriching modules', {
        moduleCount: visionAnalysis.modules.length,
      });

      const enrichStart = Date.now();
      enrichedModules = await enrichModules(
        visionAnalysis.modules.map((m) => ({
          name: m.name,
          manufacturer: m.manufacturer,
        }))
      );
      enrichmentTime = Date.now() - enrichStart;

      logger.info('✅ Enrichment complete', {
        enrichedCount: enrichedModules?.length || 0,
        duration: enrichmentTime,
      });
    }

    return NextResponse.json({
      success: true,
      analysis: visionAnalysis, // For wizard compatibility
      visionAnalysis, // Keep for backward compatibility
      timing: {
        visionAnalysis: `${(visionTime / 1000).toFixed(2)}s`,
        enrichment: enrichData ? `${(enrichmentTime / 1000).toFixed(2)}s` : 'skipped',
        total: `${((visionTime + enrichmentTime) / 1000).toFixed(2)}s`,
      },
      modelInfo: getVisionModelInfo(),
      enrichedModules,
      summary: {
        modulesDetected: visionAnalysis.modules.length,
        highConfidence: visionAnalysis.modules.filter((m) => m.confidence > 0.8).length,
        mediumConfidence: visionAnalysis.modules.filter(
          (m) => m.confidence >= 0.5 && m.confidence <= 0.8
        ).length,
        lowConfidence: visionAnalysis.modules.filter((m) => m.confidence < 0.5).length,
        enriched: enrichData ? enrichedModules?.length || 0 : 0,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Vision analysis failed', {
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: 'Vision analysis failed',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

// Allow public access for testing
export const runtime = 'nodejs';
