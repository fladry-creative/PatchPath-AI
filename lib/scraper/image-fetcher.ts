/**
 * ModularGrid CDN Image Fetcher
 * Fast, ethical alternative to web scraping
 *
 * Fetches rack images directly from ModularGrid's CDN:
 * - No HTML parsing required
 * - ~200ms vs 2-3s scraping
 * - Respects ModularGrid's anti-scraping policy
 * - Works for public and unlisted racks
 */

import logger from '@/lib/logger';

export interface ImageFetchResult {
  buffer: Buffer;
  sizeBytes: number;
  fetchTimeMs: number;
  cdnUrl: string;
}

/**
 * Fetch rack image from ModularGrid CDN
 *
 * @param cdnUrl - Full CDN URL (e.g., https://cdn.modulargrid.net/img/racks/modulargrid_123.jpg)
 * @returns Image buffer and metadata
 * @throws Error if fetch fails or rack doesn't exist
 */
export async function fetchRackImage(cdnUrl: string): Promise<ImageFetchResult> {
  logger.info('🖼️  Fetching rack image from CDN', { cdnUrl });

  const startTime = Date.now();

  try {
    const response = await fetch(cdnUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PatchPath-AI/1.0 (+https://patchpath.ai)', // Identify ourselves
        Accept: 'image/jpeg,image/png,image/webp,image/*',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const fetchTime = Date.now() - startTime;

    // Handle different error cases
    if (!response.ok) {
      if (response.status === 404) {
        logger.warn('⚠️  Rack image not found (404)', { cdnUrl });
        throw new Error(
          'Rack image not found. This rack may not exist, may be deleted, or may be private.\n\n' +
            'Tips:\n' +
            '  • Check that the rack ID is correct\n' +
            '  • Verify the rack is public on ModularGrid\n' +
            '  • Try accessing the rack page directly first'
        );
      }

      if (response.status === 403) {
        logger.warn('⚠️  Access forbidden (403)', { cdnUrl });
        throw new Error(
          'Access to rack image was denied. This rack may be private or access restricted.'
        );
      }

      if (response.status >= 500) {
        logger.error('❌ ModularGrid CDN error', { status: response.status, cdnUrl });
        throw new Error(
          `ModularGrid CDN error (${response.status}). The service may be temporarily unavailable.`
        );
      }

      throw new Error(`Failed to fetch rack image: ${response.status} ${response.statusText}`);
    }

    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate it's actually an image
    if (buffer.length === 0) {
      throw new Error('Rack image is empty (0 bytes)');
    }

    // Check for minimum reasonable size (1KB = likely error page)
    if (buffer.length < 1024) {
      logger.warn('⚠️  Suspiciously small image', { size: buffer.length, cdnUrl });
      throw new Error('Rack image is unusually small. This may not be a valid rack image.');
    }

    logger.info('✅ Rack image fetched successfully', {
      cdnUrl,
      sizeKB: (buffer.length / 1024).toFixed(2),
      fetchTimeMs: fetchTime,
    });

    return {
      buffer,
      sizeBytes: buffer.length,
      fetchTimeMs: fetchTime,
      cdnUrl,
    };
  } catch (error) {
    const fetchTime = Date.now() - startTime;

    // Handle timeout
    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.error('❌ CDN fetch timeout', { cdnUrl, fetchTime });
      throw new Error(
        'Request timed out while fetching rack image. Please try again or check your connection.'
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error('❌ Network error fetching image', { cdnUrl, error: error.message });
      throw new Error(
        'Network error while fetching rack image. Please check your internet connection.'
      );
    }

    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes('Rack image')) {
      throw error;
    }

    // Unknown error
    logger.error('❌ Unexpected error fetching image', {
      cdnUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new Error(
      `Unexpected error fetching rack image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetch multiple rack images in parallel
 * Useful for batch processing
 *
 * @param cdnUrls - Array of CDN URLs to fetch
 * @param options - Batch options
 * @returns Array of results (successful fetches + errors)
 */
export async function fetchRackImageBatch(
  cdnUrls: string[],
  options: {
    maxConcurrent?: number; // Max parallel requests (default: 5)
    continueOnError?: boolean; // Keep going if some fail (default: true)
  } = {}
): Promise<Array<ImageFetchResult | Error>> {
  const { maxConcurrent = 5, continueOnError = true } = options;

  logger.info('📦 Batch fetching rack images', {
    count: cdnUrls.length,
    maxConcurrent,
  });

  const results: Array<ImageFetchResult | Error> = [];

  // Process in chunks to limit concurrency
  for (let i = 0; i < cdnUrls.length; i += maxConcurrent) {
    const chunk = cdnUrls.slice(i, i + maxConcurrent);

    const chunkResults = await Promise.allSettled(chunk.map((url) => fetchRackImage(url)));

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const error = result.reason instanceof Error ? result.reason : new Error('Unknown error');
        results.push(error);

        if (!continueOnError) {
          throw error;
        }
      }
    }

    // Small delay between chunks to be respectful to CDN
    if (i + maxConcurrent < cdnUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const successCount = results.filter((r) => !(r instanceof Error)).length;
  const errorCount = results.filter((r) => r instanceof Error).length;

  logger.info('✅ Batch fetch complete', {
    total: cdnUrls.length,
    success: successCount,
    errors: errorCount,
  });

  return results;
}

/**
 * Check if a CDN URL is accessible without downloading the full image
 * Useful for validation
 *
 * @param cdnUrl - CDN URL to check
 * @returns True if image exists and is accessible
 */
export async function checkRackImageExists(cdnUrl: string): Promise<boolean> {
  try {
    const response = await fetch(cdnUrl, {
      method: 'HEAD', // Only fetch headers, not body
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}
