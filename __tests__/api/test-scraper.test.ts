/**
 * Integration Tests: GET /api/test-scraper
 * Tests development scraper endpoint
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock scraper modules
jest.mock('@/lib/scraper/modulargrid', () => ({
  scrapeModularGridRack: jest.fn().mockResolvedValue({
    url: 'https://modulargrid.net/e/racks/view/2383104',
    metadata: {
      rackId: '2383104',
      rackName: 'Test Development Rack',
      author: 'devuser',
      hp: 208,
      rows: 2,
    },
    modules: [
      {
        id: 'module-1',
        name: 'Maths',
        manufacturer: 'Make Noise',
        hp: 20,
        type: 'utility',
        row: 0,
        position: 0,
      },
      {
        id: 'module-2',
        name: 'Plaits',
        manufacturer: 'Mutable Instruments',
        hp: 12,
        type: 'vco',
        row: 0,
        position: 20,
      },
    ],
    rows: [
      {
        rowNumber: 0,
        hp: 104,
        modules: [],
      },
      {
        rowNumber: 1,
        hp: 104,
        modules: [],
      },
    ],
  }),
}));

jest.mock('@/lib/scraper/analyzer', () => ({
  analyzeRackCapabilities: jest.fn().mockReturnValue({
    hasVCO: true,
    hasVCF: false,
    hasVCA: false,
    hasEnvelope: true,
    hasLFO: true,
    hasSequencer: false,
    totalHP: 208,
    moduleCount: 2,
    possibleTechniques: ['FM', 'subtractive'],
  }),
  analyzeRack: jest.fn().mockReturnValue({
    missingFundamentals: ['vcf', 'vca'],
    powerDraw: { positive12V: 200, negative12V: 100, positive5V: 0 },
    warnings: ['Missing VCF', 'Missing VCA'],
  }),
  generateRackSummary: jest.fn().mockReturnValue(
    'This rack has 2 modules. Missing: VCF, VCA.'
  ),
}));

// Import after mocks
import { GET } from '@/app/api/test-scraper/route';

describe('GET /api/test-scraper', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Environment Restrictions', () => {
    it('should return 403 in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('This endpoint is only available in development');
    });

    it('should work in development environment', async () => {
      process.env.NODE_ENV = 'development';

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when url parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-scraper');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('URL parameter is required');
      expect(data.error).toContain('Example:');
    });

    it('should accept valid url parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Successful Scraping', () => {
    it('should scrape and analyze rack successfully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rack).toBeDefined();
      expect(data.modules).toBeDefined();
      expect(data.capabilities).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.rawData).toBeDefined();
    });

    it('should return correct rack metadata', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.rack.id).toBe('2383104');
      expect(data.rack.name).toBe('Test Development Rack');
      expect(data.rack.moduleCount).toBe(2);
      expect(data.rack.rows).toBe(2);
    });

    it('should return complete module list', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.modules).toBeInstanceOf(Array);
      expect(data.modules).toHaveLength(2);
      expect(data.modules[0].name).toBe('Maths');
      expect(data.modules[0].manufacturer).toBe('Make Noise');
      expect(data.modules[1].name).toBe('Plaits');
    });

    it('should return capabilities analysis', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.capabilities.hasVCO).toBe(true);
      expect(data.capabilities.hasVCF).toBe(false);
      expect(data.capabilities.totalHP).toBe(208);
      expect(data.capabilities.possibleTechniques).toContain('FM');
    });

    it('should return analysis with warnings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.analysis.missingFundamentals).toBeInstanceOf(Array);
      expect(data.analysis.missingFundamentals).toContain('vcf');
      expect(data.analysis.warnings).toBeInstanceOf(Array);
      expect(data.analysis.powerDraw).toBeDefined();
    });

    it('should return summary text', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.summary).toBe('string');
      expect(data.summary).toContain('modules');
    });

    it('should include raw data for debugging', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.rawData).toBeDefined();
      expect(data.rawData.metadata).toBeDefined();
      expect(data.rawData.modules).toBeDefined();
      expect(data.rawData.rows).toBeDefined();
    });
  });

  describe('Different Rack URLs', () => {
    it('should handle different rack IDs', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockResolvedValueOnce({
        url: 'https://modulargrid.net/e/racks/view/9999999',
        metadata: {
          rackId: '9999999',
          rackName: 'Different Rack',
          author: 'otheruser',
          hp: 84,
          rows: 1,
        },
        modules: [],
        rows: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/9999999'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rack.id).toBe('9999999');
      expect(data.rack.name).toBe('Different Rack');
    });

    it('should handle racks with no modules', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockResolvedValueOnce({
        url: 'https://modulargrid.net/e/racks/view/1111111',
        metadata: {
          rackId: '1111111',
          rackName: 'Empty Rack',
          author: 'user',
          hp: 104,
          rows: 1,
        },
        modules: [],
        rows: [{ rowNumber: 0, hp: 104, modules: [] }],
      });

      const { analyzeRackCapabilities } = require('@/lib/scraper/analyzer');
      (analyzeRackCapabilities as jest.Mock).mockReturnValueOnce({
        hasVCO: false,
        hasVCF: false,
        hasVCA: false,
        hasEnvelope: false,
        hasLFO: false,
        hasSequencer: false,
        totalHP: 104,
        moduleCount: 0,
        possibleTechniques: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/1111111'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.modules).toHaveLength(0);
      expect(data.capabilities.moduleCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle scraper errors gracefully', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch rack page')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Scraper test failed');
      expect(data.message).toContain('Failed to fetch rack page');
      expect(data.stack).toBeDefined(); // Development mode shows stack
    });

    it('should handle network timeouts', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Request timeout');
    });

    it('should handle analyzer errors', async () => {
      const { analyzeRackCapabilities } = require('@/lib/scraper/analyzer');
      (analyzeRackCapabilities as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Analysis error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Scraper test failed');
    });

    it('should handle invalid URL format', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(new Error('Invalid URL format'));

      const request = new NextRequest(
        'http://localhost:3000/api/test-scraper?url=invalid-url'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Invalid URL format');
    });
  });

  describe('URL Parameter Formats', () => {
    it('should accept URL-encoded parameters', async () => {
      const encodedUrl = encodeURIComponent('https://modulargrid.net/e/racks/view/2383104');
      const request = new NextRequest(`http://localhost:3000/api/test-scraper?url=${encodedUrl}`);

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle URLs with special characters', async () => {
      const specialUrl = 'https://modulargrid.net/e/racks/view/2383104?shared=true';
      const request = new NextRequest(
        `http://localhost:3000/api/test-scraper?url=${encodeURIComponent(specialUrl)}`
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });
});
