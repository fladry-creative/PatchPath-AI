import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { listUserPatches } from '@/lib/database/patch-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    logger.info('📚 Fetching user patches', { userId });

    // Fetch user patches from database
    const patches = await listUserPatches(userId, { limit: 100 });

    logger.info('✅ Patches fetched successfully', {
      userId,
      count: patches.length,
    });

    return NextResponse.json({
      success: true,
      patches,
      count: patches.length,
    });
  } catch (error) {
    logger.error('❌ Error fetching patches', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch patches',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
