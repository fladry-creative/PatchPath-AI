/**
 * POST /api/patches/generate-diagram
 * Generate AI patch diagram using Gemini 2.5 Flash Image
 * October 2025 - Modern Next.js 15 App Router implementation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generatePatchDiagram, isGeminiConfigured, type AspectRatio } from '@/lib/ai/gemini';
import { type Patch } from '@/types/patch';
import { type Module } from '@/types/module';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 30; // Gemini can take 5-10 seconds

interface DiagramRequest {
  patch: Patch;
  modules: Module[];
  aspectRatio?: AspectRatio;
}

export async function POST(req: NextRequest) {
  try {
    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      logger.warn('🎨 Gemini diagram generation skipped - API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API not configured',
          message: 'Diagram generation is not available. Please configure GEMINI_API_KEY.',
        },
        { status: 503 }
      );
    }

    const body: DiagramRequest = await req.json();

    // Validate request
    if (!body.patch) {
      return NextResponse.json(
        { success: false, error: 'Patch data is required' },
        { status: 400 }
      );
    }

    if (!body.modules || body.modules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module list is required' },
        { status: 400 }
      );
    }

    logger.info('🎨 Diagram generation request received', {
      patchId: body.patch.id,
      patchTitle: body.patch.metadata.title,
      moduleCount: body.modules.length,
      aspectRatio: body.aspectRatio || '1:1',
    });

    // Generate diagram
    const result = await generatePatchDiagram({
      patch: body.patch,
      modules: body.modules,
      aspectRatio: body.aspectRatio,
    });

    logger.info('✅ Diagram generated successfully', {
      patchId: body.patch.id,
      generationTime: result.generationTime,
      cost: result.cost,
    });

    return NextResponse.json({
      success: true,
      diagram: {
        imageData: result.imageData, // base64 PNG
        aspectRatio: result.aspectRatio,
        generationTime: result.generationTime,
        cost: result.cost,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Diagram generation failed', {
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Diagram generation failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
