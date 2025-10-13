/**
 * ModularGrid URL Parser
 * Supports both rack page URLs and direct CDN image URLs
 *
 * Vision-first architecture: Extract CDN URLs to avoid scraping
 */

import logger from '@/lib/logger';

export interface RackImageInput {
  type: 'rack_page_url' | 'cdn_image_url';
  rackId: string;
  cdnUrl: string;
  pageUrl?: string; // Optional, for reference back to ModularGrid
}

/**
 * Parse and validate ModularGrid rack URL (page or CDN)
 *
 * Supports:
 * - Rack page: https://modulargrid.net/e/racks/view/1186947
 * - CDN image: https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg
 *
 * @param input - URL string to parse
 * @returns Parsed rack input with CDN URL and metadata
 * @throws Error if URL format is invalid
 */
export function parseRackUrl(input: string): RackImageInput {
  const trimmed = input.trim();

  logger.debug('🔍 Parsing rack URL', { input: trimmed });

  // Try CDN URL pattern first (most direct)
  const cdnMatch = trimmed.match(/cdn\.modulargrid\.net\/img\/racks\/modulargrid_(\d+)\.jpg/);
  if (cdnMatch) {
    const rackId = cdnMatch[1];
    logger.info('✅ Parsed CDN image URL', { rackId, type: 'cdn_image_url' });

    return {
      type: 'cdn_image_url',
      rackId,
      cdnUrl: trimmed,
      pageUrl: constructPageUrl(rackId),
    };
  }

  // Try rack page URL pattern
  const pageMatch = trimmed.match(/modulargrid\.net\/e\/racks\/view\/(\d+)/);
  if (pageMatch) {
    const rackId = pageMatch[1];
    logger.info('✅ Parsed rack page URL', { rackId, type: 'rack_page_url' });

    return {
      type: 'rack_page_url',
      rackId,
      cdnUrl: constructCDNUrl(rackId),
      pageUrl: trimmed,
    };
  }

  // No match - provide helpful error
  logger.error('❌ Invalid ModularGrid URL format', { input: trimmed });

  throw new Error(
    'Invalid ModularGrid URL. Supported formats:\n' +
      '  • Rack page: https://modulargrid.net/e/racks/view/[ID]\n' +
      '  • CDN image: https://cdn.modulargrid.net/img/racks/modulargrid_[ID].jpg\n\n' +
      'Example: https://modulargrid.net/e/racks/view/2383104'
  );
}

/**
 * Construct CDN image URL from rack ID
 *
 * @param rackId - ModularGrid rack ID (numeric string)
 * @returns Full CDN URL for rack image
 */
export function constructCDNUrl(rackId: string): string {
  return `https://cdn.modulargrid.net/img/racks/modulargrid_${rackId}.jpg`;
}

/**
 * Construct rack page URL from rack ID
 *
 * @param rackId - ModularGrid rack ID (numeric string)
 * @returns Full rack page URL
 */
export function constructPageUrl(rackId: string): string {
  return `https://modulargrid.net/e/racks/view/${rackId}`;
}

/**
 * Extract rack ID from any valid ModularGrid URL
 *
 * @param url - ModularGrid URL (page or CDN)
 * @returns Rack ID or null if not found
 */
export function extractRackId(url: string): string | null {
  try {
    const parsed = parseRackUrl(url);
    return parsed.rackId;
  } catch {
    return null;
  }
}

/**
 * Validate if a string is a valid ModularGrid URL
 *
 * @param url - URL to validate
 * @returns True if valid ModularGrid URL
 */
export function isValidModularGridUrl(url: string): boolean {
  try {
    parseRackUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get URL type without throwing errors
 *
 * @param url - URL to check
 * @returns URL type or null if invalid
 */
export function getUrlType(url: string): 'rack_page_url' | 'cdn_image_url' | null {
  try {
    const parsed = parseRackUrl(url);
    return parsed.type;
  } catch {
    return null;
  }
}
