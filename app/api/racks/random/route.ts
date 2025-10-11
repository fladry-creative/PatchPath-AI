/**
 * Random Rack API Endpoint
 * GET /api/racks/random - Returns a random rack from cache or scrapes a new one
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getRandomRack } from '@/lib/scraper/random-rack';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('Random rack API request received', {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    const rack = await getRandomRack();

    const duration = Date.now() - startTime;

    logger.info('Random rack API request successful', {
      url: rack.url,
      rackId: rack.metadata.rackId,
      moduleCount: rack.modules.length,
      totalHP: rack.metadata.hp || rack.modules.reduce((sum, m) => sum + m.hp, 0),
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: true,
        rack: {
          url: rack.url,
          rackId: rack.metadata.rackId,
          rackName: rack.metadata.rackName,
          moduleCount: rack.modules.length,
          totalHP: rack.modules.reduce((sum, m) => sum + m.hp, 0),
          rows: rack.rows.length,
        },
        metadata: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Random rack API request failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch random rack',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
