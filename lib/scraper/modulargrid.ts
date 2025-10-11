/**
 * ModularGrid Scraper
 * Extracts rack and module data from ModularGrid URLs using Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { Module, ModuleType } from '@/types/module';
import { ParsedRack, RackRow } from '@/types/rack';

// Module type detection patterns
const MODULE_TYPE_PATTERNS: Record<string, ModuleType> = {
  'oscillator': 'VCO',
  'vco': 'VCO',
  'filter': 'VCF',
  'vcf': 'VCF',
  'amplifier': 'VCA',
  'vca': 'VCA',
  'lfo': 'LFO',
  'envelope': 'EG',
  'eg': 'EG',
  'adsr': 'EG',
  'sequencer': 'Sequencer',
  'utility': 'Utility',
  'mult': 'Utility',
  'mixer': 'Mixer',
  'effect': 'Effect',
  'delay': 'Effect',
  'reverb': 'Effect',
  'midi': 'MIDI',
  'clock': 'Clock',
  'logic': 'Logic',
  'random': 'Random',
  'video': 'Video',
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
    // Validate URL
    if (!url.includes('modulargrid.net/e/racks/view/')) {
      throw new Error('Invalid ModularGrid rack URL');
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page: Page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    );

    console.log(`🕷️  Scraping: ${url}`);

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Give page time to render (ModularGrid uses client-side rendering)
    await new Promise(resolve => setTimeout(resolve, 2000));

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
              console.error('Failed to parse rack JSON:', e);
            }
          }

          // Alternative: look for modules array
          const modulesMatch = content.match(/"modules":\s*(\[.*?\])/s);
          if (modulesMatch) {
            try {
              return { modules: JSON.parse(modulesMatch[1]) };
            } catch (e) {
              console.error('Failed to parse modules JSON:', e);
            }
          }
        }
      }

      // Fallback: extract from DOM
      const modules: any[] = [];
      const moduleElements = document.querySelectorAll('.module-item, [data-module-id]');

      moduleElements.forEach(el => {
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

    console.log(`✅ Found ${rackData?.modules?.length || 0} modules`);

    // Parse modules into our format
    const modules: Module[] = (rackData?.modules || []).map((m: any, index: number) => {
      const module: Module = {
        id: m.id || `module-${index}`,
        name: m.name || m.moduleName || 'Unknown Module',
        manufacturer: m.manufacturer || m.brand || 'Unknown',
        type: detectModuleType(m.name || '', m.description),
        hp: parseInt(m.hp || m.size || '0', 10),
        depth: m.depth ? parseInt(m.depth, 10) : undefined,
        power: {
          positive12V: m.power?.positive12V || m.mAPositive12V || undefined,
          negative12V: m.power?.negative12V || m.mANegative12V || undefined,
          positive5V: m.power?.positive5V || m.mA5V || undefined,
        },
        inputs: [], // TODO: Parse from module details
        outputs: [], // TODO: Parse from module details
        description: m.description,
        moduleGridUrl: m.url,
        position: m.position || { row: m.row || 0, column: m.column || 0 },
      };

      return module;
    });

    // Extract rack metadata
    const rackId = url.match(/\/view\/(\d+)/)?.[1] || 'unknown';
    const rackName = await page.evaluate(() => {
      return document.querySelector('.rack-name, h1')?.textContent?.trim() || 'Untitled Rack';
    });

    // Organize modules by row
    const rows: RackRow[] = [];
    const modulesByRow = modules.reduce((acc, module) => {
      const row = module.position?.row || 0;
      if (!acc[row]) acc[row] = [];
      acc[row].push(module);
      return acc;
    }, {} as Record<number, Module[]>);

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
      url,
      rows,
      modules,
      metadata: {
        rackId,
        rackName,
      },
    };

    console.log(`🎸 Successfully scraped rack: ${rackName} (${modules.length} modules)`);

    return parsedRack;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw new Error(`Failed to scrape ModularGrid rack: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get module details from ModularGrid API (if available)
 * This is a placeholder for future API integration
 */
export async function getModuleDetails(moduleId: string): Promise<Module | null> {
  // TODO: Implement ModularGrid API call if/when available
  // For now, rely on scraping from rack page
  return null;
}

/**
 * Validate a ModularGrid URL
 */
export function isValidModularGridUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('modulargrid.net') &&
      urlObj.pathname.includes('/e/racks/view/')
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
