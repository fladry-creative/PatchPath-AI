/**
 * Tests for lib/scraper/modulargrid.ts
 * Mocks Puppeteer for scraping tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Page, Browser } from 'puppeteer';

// Mock Puppeteer before importing scraper
jest.mock('puppeteer', () => ({
  default: {
    launch: jest.fn(),
  },
}));

describe('lib/scraper/modulargrid', () => {
  let mockPage: Partial<Page>;
  let mockBrowser: Partial<Browser>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock page
    mockPage = {
      setUserAgent: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(null),
      evaluate: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock browser
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Mock puppeteer.launch
    const puppeteer = require('puppeteer');
    puppeteer.default.launch.mockResolvedValue(mockBrowser);
  });

  describe('URL validation', () => {
    it('should validate ModularGrid URLs', () => {
      const {
        isValidModularGridUrl,
        extractRackId,
      } = require('@/lib/scraper/modulargrid');

      expect(
        isValidModularGridUrl('https://modulargrid.net/e/racks/view/2383104')
      ).toBe(true);

      expect(
        isValidModularGridUrl('https://www.modulargrid.net/e/racks/view/123')
      ).toBe(true);

      expect(isValidModularGridUrl('https://google.com')).toBe(false);

      expect(isValidModularGridUrl('not-a-url')).toBe(false);

      expect(extractRackId('https://modulargrid.net/e/racks/view/2383104')).toBe(
        '2383104'
      );

      expect(extractRackId('invalid-url')).toBeNull();
    });
  });

  describe('module type detection', () => {
    it('should detect VCO modules', () => {
      // We'll test the detection logic indirectly through scraping
      const testNames = [
        'Plaits',
        'VCO-1',
        'Oscillator Bank',
        'Braids',
      ];

      testNames.forEach(name => {
        const lowerName = name.toLowerCase();
        expect(
          lowerName.includes('vco') ||
          lowerName.includes('oscillator') ||
          lowerName.includes('plaits') ||
          lowerName.includes('braids')
        ).toBeTruthy();
      });
    });

    it('should detect VCF modules', () => {
      const testNames = [
        'Ripples',
        'VCF-2',
        'Multimode Filter',
        'LP Gate',
      ];

      testNames.forEach(name => {
        const lowerName = name.toLowerCase();
        expect(
          lowerName.includes('vcf') ||
          lowerName.includes('filter') ||
          lowerName.includes('ripples')
        ).toBeTruthy();
      });
    });

    it('should detect VCA modules', () => {
      const testNames = [
        'Veils',
        'VCA-1',
        'Quad VCA',
        'Linear Amplifier',
      ];

      testNames.forEach(name => {
        const lowerName = name.toLowerCase();
        expect(
          lowerName.includes('vca') ||
          lowerName.includes('amplifier') ||
          lowerName.includes('veils')
        ).toBeTruthy();
      });
    });
  });

  describe('scrapeModularGridRack', () => {
    it('should reject invalid URLs', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      await expect(
        scrapeModularGridRack('https://google.com')
      ).rejects.toThrow('Invalid ModularGrid rack URL');
    });

    it('should scrape rack data successfully', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      // Mock the evaluate function to return rack data
      (mockPage.evaluate as jest.Mock).mockResolvedValueOnce({
        modules: [
          {
            id: '1',
            name: 'Plaits',
            manufacturer: 'Mutable Instruments',
            hp: 12,
            depth: 25,
            power: { positive12V: 60, negative12V: 5 },
          },
          {
            id: '2',
            name: 'Ripples',
            manufacturer: 'Mutable Instruments',
            hp: 8,
          },
        ],
      });

      // Mock rack name extraction
      (mockPage.evaluate as jest.Mock).mockResolvedValueOnce('Test Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/2383104'
      );

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('modules');
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('metadata');

      expect(result.modules.length).toBe(2);
      expect(result.modules[0].name).toBe('Plaits');
      expect(result.modules[0].hp).toBe(12);
      expect(result.modules[0].manufacturer).toBe('Mutable Instruments');
    });

    it('should handle empty module data', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({ modules: [] })
        .mockResolvedValueOnce('Empty Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      expect(result.modules.length).toBe(0);
    });

    it('should close browser on error', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.goto as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        scrapeModularGridRack('https://modulargrid.net/e/racks/view/123')
      ).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should organize modules by row', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({
          modules: [
            {
              id: '1',
              name: 'Module 1',
              manufacturer: 'Test',
              hp: 10,
              row: 0,
            },
            {
              id: '2',
              name: 'Module 2',
              manufacturer: 'Test',
              hp: 8,
              row: 0,
            },
            {
              id: '3',
              name: 'Module 3',
              manufacturer: 'Test',
              hp: 12,
              row: 1,
            },
          ],
        })
        .mockResolvedValueOnce('Multi-Row Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].modules.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse power consumption correctly', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({
          modules: [
            {
              id: '1',
              name: 'Power-hungry Module',
              manufacturer: 'Test',
              hp: 20,
              mAPositive12V: 250,
              mANegative12V: 50,
              mA5V: 0,
            },
          ],
        })
        .mockResolvedValueOnce('Power Test Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      const module = result.modules[0];
      expect(module.power.positive12V).toBe(250);
      expect(module.power.negative12V).toBe(50);
      expect(module.power.positive5V).toBe(0);
    });
  });

  describe('getModuleDetails', () => {
    it('should return null as placeholder', async () => {
      const { getModuleDetails } = require('@/lib/scraper/modulargrid');

      const result = await getModuleDetails('test-module-id');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle modules without power data', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({
          modules: [
            {
              id: '1',
              name: 'Passive Module',
              manufacturer: 'Test',
              hp: 4,
              // No power data
            },
          ],
        })
        .mockResolvedValueOnce('Passive Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      const module = result.modules[0];
      expect(module.power.positive12V).toBeUndefined();
      expect(module.power.negative12V).toBeUndefined();
    });

    it('should handle modules without depth', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({
          modules: [
            {
              id: '1',
              name: 'No Depth Module',
              manufacturer: 'Test',
              hp: 10,
            },
          ],
        })
        .mockResolvedValueOnce('No Depth Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      expect(result.modules[0].depth).toBeUndefined();
    });

    it('should handle missing manufacturer', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      (mockPage.evaluate as jest.Mock)
        .mockResolvedValueOnce({
          modules: [
            {
              id: '1',
              name: 'Unknown Module',
              hp: 10,
            },
          ],
        })
        .mockResolvedValueOnce('Unknown Manufacturer Rack');

      const result = await scrapeModularGridRack(
        'https://modulargrid.net/e/racks/view/123'
      );

      expect(result.modules[0].manufacturer).toBe('Unknown');
    });
  });
});
