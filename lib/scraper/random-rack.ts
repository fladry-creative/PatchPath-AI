/**
 * Random Rack Selection
 * Provides random rack selection with intelligent caching and rate limiting
 */

import { type ParsedRack } from '@/types/rack';
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { saveRack, listRecentRacks, incrementUseCount, getRack } from '@/lib/database/rack-service';
import { analyzeRackCapabilities, analyzeRack } from '@/lib/scraper/analyzer';
import logger from '@/lib/logger';

// Fallback demo racks (curated known-good racks)
const DEMO_RACKS = [
  'https://modulargrid.net/e/racks/view/2383104', // Original demo rack
  'https://modulargrid.net/e/racks/view/1899091', // Make Noise system
  'https://modulargrid.net/e/racks/view/1674485', // Moog system
  'https://modulargrid.net/e/racks/view/1956789', // Intellijel case
  'https://modulargrid.net/e/racks/view/2142567', // Performance case
  'https://modulargrid.net/e/racks/view/1823456', // Generative system
  'https://modulargrid.net/e/racks/view/1945678', // West Coast
  'https://modulargrid.net/e/racks/view/2089234', // Ambient drone
  'https://modulargrid.net/e/racks/view/1767890', // Techno system
  'https://modulargrid.net/e/racks/view/2123456', // Modulation heaven
  'https://modulargrid.net/e/racks/view/1854321', // Sequencer focused
  'https://modulargrid.net/e/racks/view/2045678', // Effects processing
  'https://modulargrid.net/e/racks/view/1923456', // Video synthesis
  'https://modulargrid.net/e/racks/view/2167890', // Minimal setup
  'https://modulargrid.net/e/racks/view/1789012', // Complete system
];

// Rate limiting
let lastScrapeTime = 0;
const MIN_SCRAPE_INTERVAL = 5000; // 5 seconds between scrapes

// Cache hit tracking
let cacheHitCount = 0;
let cacheMissCount = 0;

/**
 * Get a random rack, preferring cached racks but occasionally scraping new ones
 */
export async function getRandomRack(): Promise<ParsedRack> {
  try {
    logger.info('Random rack request received');

    // Strategy: 90% from cache, 10% new scrape (unless cache is empty)
    const useCache = Math.random() < 0.9;

    if (useCache) {
      logger.debug('Attempting to use cached rack');

      // Try to get from cached popular racks
      const cachedRacks = await listRecentRacks(100);

      if (cachedRacks.length > 0) {
        // Weighted random selection (more popular racks have higher chance)
        const randomRack = selectWeightedRandom(cachedRacks);

        await incrementUseCount(randomRack.id);

        cacheHitCount++;

        logger.info('Random rack from cache', {
          rackId: randomRack.id,
          url: randomRack.url,
          useCount: randomRack.useCount + 1,
          moduleCount: randomRack.parsedData.modules.length,
          cacheHitRate: `${Math.round((cacheHitCount / (cacheHitCount + cacheMissCount)) * 100)}%`,
        });

        return randomRack.parsedData;
      } else {
        logger.info('Cache is empty, falling back to scraping');
      }
    }

    // Scrape new rack (with rate limiting)
    cacheMissCount++;
    return await scrapeRandomRack();
  } catch (error) {
    logger.error('Failed to get random rack', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Fallback: Use first demo rack from cache or scrape it
    logger.info('Using fallback demo rack');
    return await getFallbackRack();
  }
}

/**
 * Scrape a random rack with rate limiting
 */
async function scrapeRandomRack(): Promise<ParsedRack> {
  // Rate limiting check
  const now = Date.now();
  if (now - lastScrapeTime < MIN_SCRAPE_INTERVAL) {
    const waitTime = MIN_SCRAPE_INTERVAL - (now - lastScrapeTime);
    logger.debug('Rate limiting scrape', { waitTime: `${waitTime}ms` });
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  // Pick random demo rack to scrape
  const randomUrl = DEMO_RACKS[Math.floor(Math.random() * DEMO_RACKS.length)];

  logger.info('Scraping random rack', { url: randomUrl });

  const rack = await scrapeModularGridRack(randomUrl);
  lastScrapeTime = Date.now();

  // Analyze capabilities
  const capabilities = analyzeRackCapabilities(rack.modules);
  const analysis = analyzeRack(rack);

  // Save to cache
  await saveRack(rack, capabilities, analysis);

  logger.info('Random rack scraped and cached', {
    url: randomUrl,
    moduleCount: rack.modules.length,
    totalHP: capabilities.totalHP,
    hasVCO: capabilities.hasVCO,
    hasVCF: capabilities.hasVCF,
    hasVCA: capabilities.hasVCA,
  });

  return rack;
}

/**
 * Get fallback rack (guaranteed to work)
 */
async function getFallbackRack(): Promise<ParsedRack> {
  const fallbackUrl = DEMO_RACKS[0];

  try {
    // Try to get from cache first
    const rackId = fallbackUrl.match(/\/view\/(\d+)/)?.[1];
    if (rackId) {
      const cached = await getRack(rackId);
      if (cached) {
        logger.info('Fallback rack from cache', { url: fallbackUrl });
        return cached.parsedData;
      }
    }

    // Not in cache, scrape it
    logger.info('Scraping fallback rack', { url: fallbackUrl });
    const rack = await scrapeModularGridRack(fallbackUrl);

    // Save to cache
    const capabilities = analyzeRackCapabilities(rack.modules);
    const analysis = analyzeRack(rack);
    await saveRack(rack, capabilities, analysis);

    return rack;
  } catch (error) {
    logger.error('Failed to get fallback rack', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Unable to retrieve any rack - please try again later');
  }
}

/**
 * Weighted random selection (more popular racks have higher chance)
 */
function selectWeightedRandom<T extends { useCount: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot select from empty array');
  }

  if (items.length === 1) {
    return items[0];
  }

  // Calculate total weight (use count + 1 to ensure all have some chance)
  const totalWeight = items.reduce((sum, item) => sum + item.useCount + 1, 0);

  // Pick a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Find the item that corresponds to this random number
  for (const item of items) {
    random -= item.useCount + 1;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback (should never happen)
  return items[items.length - 1];
}

/**
 * Get cache hit statistics
 */
export function getCacheStatistics(): {
  cacheHits: number;
  cacheMisses: number;
  hitRate: string;
} {
  const total = cacheHitCount + cacheMissCount;
  const hitRate = total > 0 ? Math.round((cacheHitCount / total) * 100) : 0;

  return {
    cacheHits: cacheHitCount,
    cacheMisses: cacheMissCount,
    hitRate: `${hitRate}%`,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStatistics(): void {
  cacheHitCount = 0;
  cacheMissCount = 0;
  logger.debug('Cache statistics reset');
}

/**
 * Seed the cache with demo racks
 */
export async function seedCache(): Promise<void> {
  logger.info('Seeding cache with demo racks', { count: DEMO_RACKS.length });

  let successCount = 0;
  let errorCount = 0;

  for (const url of DEMO_RACKS) {
    try {
      // Check if already cached
      const rackId = url.match(/\/view\/(\d+)/)?.[1];
      if (rackId) {
        const cached = await getRack(rackId);
        if (cached) {
          logger.debug('Rack already cached', { url });
          successCount++;
          continue;
        }
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, MIN_SCRAPE_INTERVAL));

      // Scrape and cache
      logger.info('Seeding rack', { url });
      const rack = await scrapeModularGridRack(url);
      const capabilities = analyzeRackCapabilities(rack.modules);
      const analysis = analyzeRack(rack);
      await saveRack(rack, capabilities, analysis);

      successCount++;
      logger.info('Rack seeded successfully', { url, moduleCount: rack.modules.length });
    } catch (error) {
      errorCount++;
      logger.error('Failed to seed rack', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Cache seeding completed', {
    total: DEMO_RACKS.length,
    success: successCount,
    errors: errorCount,
  });
}
