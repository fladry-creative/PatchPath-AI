/**
 * ModularGrid Scraper
 * Extracts rack and module data from ModularGrid URLs using Puppeteer
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import { type Module, type ModuleType } from '@/types/module';
import { type ParsedRack, type RackRow } from '@/types/rack';
import logger from '@/lib/logger';

// Module type detection patterns (October 2025 update: comprehensive video synthesis support)
const MODULE_TYPE_PATTERNS: Record<string, ModuleType> = {
  // Audio synthesis modules
  oscillator: 'VCO',
  vco: 'VCO',
  filter: 'VCF',
  vcf: 'VCF',
  amplifier: 'VCA',
  vca: 'VCA',
  lfo: 'LFO',
  envelope: 'EG',
  eg: 'EG',
  adsr: 'EG',
  sequencer: 'Sequencer',
  utility: 'Utility',
  mult: 'Utility',
  mixer: 'Mixer',
  effect: 'Effect',
  delay: 'Effect',
  reverb: 'Effect',
  midi: 'MIDI',
  clock: 'Clock',
  logic: 'Logic',
  random: 'Random',

  // Video synthesis modules - Generic patterns
  'sync generator': 'SyncGenerator',
  'sync gen': 'SyncGenerator',
  synchronizer: 'SyncGenerator',
  'ramp generator': 'RampGenerator',
  'ramp gen': 'RampGenerator',
  ramp: 'RampGenerator',
  'shape generator': 'ShapeGenerator',
  'shape gen': 'ShapeGenerator',
  colorizer: 'Colorizer',
  coloriser: 'Colorizer', // British spelling
  keyer: 'Keyer',
  'key generator': 'Keyer',
  'video encoder': 'VideoEncoder',
  encoder: 'VideoEncoder',
  'video decoder': 'VideoDecoder',
  decoder: 'VideoDecoder',
  'video mixer': 'VideoMixer',
  'rgb mixer': 'VideoMixer',
  'rgb mix': 'VideoMixer',
  'video oscillator': 'VideoOscillator',
  'wideband oscillator': 'VideoOscillator',
  multiplier: 'VideoProcessor',
  'detail extractor': 'VideoProcessor',
  'video processor': 'VideoProcessor',
  'video display': 'VideoDisplay',
  visualizer: 'VideoDisplay',
  monitor: 'VideoDisplay',

  // LZX Industries specific modules (primary video synthesis manufacturer)
  'visual cortex': 'SyncGenerator', // Master sync + I/O
  chromagnon: 'SyncGenerator', // Advanced sync + processing
  esg3: 'SyncGenerator', // Encoder & Sync Generator (Gen3)
  angles: 'RampGenerator', // Horizontal ramp generator
  scrolls: 'RampGenerator', // Vertical ramp generator
  diver: 'RampGenerator', // Multifunction ramp generator
  dsg3: 'ShapeGenerator', // Digital Shape Generator
  passage: 'Colorizer', // Primary colorizer module
  contour: 'Colorizer', // Contour colorizer
  fkg3: 'Keyer', // Fader & Key Generator
  smx3: 'VideoMixer', // Stereo Video Mixer (RGB matrix)
  dwo3: 'VideoOscillator', // Digital Wideband Oscillator
  'escher sketch': 'VideoDisplay', // Display with integrated screen
  'liquid tv': 'VideoDisplay', // Confidence monitor
  tbc2: 'VideoProcessor', // Time Base Corrector
  'video motion': 'VideoProcessor', // Motion processing
  'video calculator': 'VideoProcessor', // Math operations
  mapper: 'VideoProcessor', // Coordinate mapping
  'polar fringe': 'VideoProcessor', // Polar coordinate processor
  staircase: 'VideoUtility', // Signal distribution
  switcher: 'VideoUtility', // Signal routing
  pab: 'VideoUtility', // Precision Adder Bank
  pgo: 'VideoUtility', // Precision Gate Output
  mlt: 'VideoUtility', // Multiple
  lnk: 'VideoUtility', // Link module

  // Syntonie (European DIY video synthesis manufacturer)
  rampes: 'RampGenerator', // Ramp and shape generator
  entree: 'VideoDecoder', // Component to RGB decoder (French: entrée)
  sortie: 'VideoEncoder', // RGB to component encoder (French: sortie)
  isohelie: 'Keyer', // Posterization/keying effect
  seuils: 'VideoProcessor', // Comparator/phase shifter
  component: 'VideoDecoder', // Component video decoder
  cbv001: 'VideoProcessor', // Circuit Bent Video Enhancer
  cbv002: 'VideoProcessor', // Circuit Bent Video Delay
  vu008: 'VideoProcessor', // Dual Ramp Phase Shifter

  // Generic video fallback (if none of the above match)
  video: 'Video',
};

/**
 * Detect module type from name and description
 */
function detectModuleType(name: string, description?: string): ModuleType {
  const searchText = `${name} ${description || ''}`.toLowerCase();

  for (const [pattern, type] of Object.entries(MODULE_TYPE_PATTERNS)) {
    if (searchText.includes(pattern)) {
      return type;
    }
  }

  return 'Other';
}

/**
 * Extract rack data from ModularGrid page
 */
export async function scrapeModularGridRack(url: string): Promise<ParsedRack> {
  let browser: Browser | null = null;

  try {
    // Validate URL (be lenient with different formats)
    const normalizedUrl = url.trim();

    // Check if it's a valid ModularGrid rack URL
    if (!normalizedUrl.includes('modulargrid.net') || !normalizedUrl.includes('/racks/view/')) {
      throw new Error(
        'Invalid ModularGrid rack URL. Expected format: https://modulargrid.net/e/racks/view/[ID]'
      );
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page: Page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    logger.info('🕷️  Scraping ModularGrid rack', { url: normalizedUrl });

    // Navigate to page
    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Give page time to render (ModularGrid uses client-side rendering)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract embedded JSON data from page
    const rackData = await page.evaluate(() => {
      // ModularGrid embeds rack data in JavaScript variables
      const scripts = Array.from(document.querySelectorAll('script'));

      for (const script of scripts) {
        const content = script.textContent || '';

        // Look for rack data JSON
        if (content.includes('var rack = ') || content.includes('"modules"')) {
          // Try to extract JSON object
          const rackMatch = content.match(/var rack = ({.*?});/s);
          if (rackMatch) {
            try {
              return JSON.parse(rackMatch[1]);
            } catch (e) {
              logger.error('Failed to parse rack JSON', {
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }

          // Alternative: look for modules array
          const modulesMatch = content.match(/"modules":\s*(\[.*?\])/s);
          if (modulesMatch) {
            try {
              return { modules: JSON.parse(modulesMatch[1]) };
            } catch (e) {
              logger.error('Failed to parse modules JSON', {
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }
        }
      }

      interface DOMModuleData {
        id: string;
        name: string;
        manufacturer: string;
      }

      // Fallback: extract from DOM
      const modules: DOMModuleData[] = [];
      const moduleElements = document.querySelectorAll('.module-item, [data-module-id]');

      moduleElements.forEach((el) => {
        const moduleId = el.getAttribute('data-module-id');
        const moduleName = el.querySelector('.module-name')?.textContent?.trim();
        const manufacturer = el.querySelector('.module-manufacturer')?.textContent?.trim();

        if (moduleId && moduleName) {
          modules.push({
            id: moduleId,
            name: moduleName,
            manufacturer: manufacturer || 'Unknown',
          });
        }
      });

      return { modules };
    });

    logger.info('✅ Modules extracted from page', {
      moduleCount: rackData?.modules?.length || 0,
    });

    interface RawModuleData {
      id?: string;
      name?: string;
      moduleName?: string;
      manufacturer?: string;
      brand?: string;
      description?: string;
      hp?: string | number;
      size?: string | number;
      depth?: string | number;
      power?: {
        positive12V?: number;
        negative12V?: number;
        positive5V?: number;
      };
      mAPositive12V?: number;
      mANegative12V?: number;
      mA5V?: number;
      url?: string;
      position?: { row: number; column: number };
      row?: number;
      column?: number;
    }

    // Parse modules into our format
    const modules: Module[] = (rackData?.modules || []).map((m: RawModuleData, index: number) => {
      const moduleData: Module = {
        id: m.id || `module-${index}`,
        name: m.name || m.moduleName || 'Unknown Module',
        manufacturer: m.manufacturer || m.brand || 'Unknown',
        type: detectModuleType(m.name || '', m.description),
        hp: parseInt(String(m.hp || m.size || '0'), 10),
        depth: m.depth ? parseInt(String(m.depth), 10) : undefined,
        power: {
          positive12V: m.power?.positive12V || m.mAPositive12V || undefined,
          negative12V: m.power?.negative12V || m.mANegative12V || undefined,
          positive5V: m.power?.positive5V || m.mA5V || undefined,
        },
        // Note: Module I/O parsing not implemented
        // ModularGrid doesn't expose structured I/O data in the embedded JSON
        // Would require scraping individual module detail pages (rate limit concerns + brittle selectors)
        // Current approach: Empty arrays, enrichment services can add I/O data later from ModularGrid API
        inputs: [],
        outputs: [],
        description: m.description,
        moduleGridUrl: m.url,
        position: m.position || { row: m.row || 0, column: m.column || 0 },
      };

      return moduleData;
    });

    // Extract rack metadata
    const rackId = normalizedUrl.match(/\/view\/(\d+)/)?.[1] || 'unknown';
    const rackName = await page.evaluate(() => {
      return document.querySelector('.rack-name, h1')?.textContent?.trim() || 'Untitled Rack';
    });

    // Organize modules by row
    const rows: RackRow[] = [];
    const modulesByRow = modules.reduce(
      (acc, module) => {
        const row = module.position?.row || 0;
        if (!acc[row]) acc[row] = [];
        acc[row].push(module);
        return acc;
      },
      {} as Record<number, Module[]>
    );

    Object.entries(modulesByRow).forEach(([rowNum, rowModules]) => {
      const totalHP = rowModules.reduce((sum, m) => sum + m.hp, 0);
      rows.push({
        rowNumber: parseInt(rowNum),
        modules: rowModules,
        totalHP,
        maxHP: 168, // Standard Eurorack case (2x84HP)
      });
    });

    const parsedRack: ParsedRack = {
      url: normalizedUrl,
      rows,
      modules,
      metadata: {
        rackId,
        rackName,
      },
    };

    logger.info('🎸 Successfully scraped rack', {
      rackId,
      rackName,
      moduleCount: modules.length,
      rowCount: rows.length,
    });

    return parsedRack;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ Scraping failed', {
      url: url || 'unknown',
      error: errorMessage,
      stack: errorStack,
    });

    throw new Error(`Failed to scrape ModularGrid rack: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get module details from ModularGrid API (if available)
 * This is a placeholder for future API integration
 *
 * Note: No official ModularGrid API available
 * ModularGrid does not provide a public API for rack or module data
 * Current approach: Respectful web scraping with rate limiting and caching
 * Future: If ModularGrid releases an API, switch to API-first with scraping fallback
 * See: https://www.modulargrid.net/forum (monitor for API announcements)
 */
export async function getModuleDetails(_moduleId: string): Promise<Module | null> {
  // No API available - rely on scraping from rack page
  // If API becomes available: implement proper authentication, rate limiting, and error handling
  return null;
}

/**
 * Validate a ModularGrid URL
 */
export function isValidModularGridUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('modulargrid.net') && urlObj.pathname.includes('/e/racks/view/')
    );
  } catch {
    return false;
  }
}

/**
 * Extract rack ID from URL
 */
export function extractRackId(url: string): string | null {
  const match = url.match(/\/view\/(\d+)/);
  return match ? match[1] : null;
}
