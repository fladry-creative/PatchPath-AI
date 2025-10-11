/**
 * Integration Tests: POST /api/racks/analyze
 * Tests rack analysis with authentication, validation, and scraper integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Clerk authentication
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock scraper modules
jest.mock('@/lib/scraper/modulargrid', () => ({
  scrapeModularGridRack: jest.fn().mockResolvedValue({
    url: 'https://modulargrid.net/e/racks/view/2383104',
    metadata: {
      rackId: '2383104',
      rackName: 'My Eurorack System',
      author: 'testuser',
      hp: 104,
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
      {
        id: 'module-3',
        name: 'Veils',
        manufacturer: 'Mutable Instruments',
        hp: 10,
        type: 'vca',
        row: 1,
        position: 0,
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
  isValidModularGridUrl: jest.fn((url: string) => {
    return url.includes('modulargrid.net/e/racks/view/');
  }),
}));

jest.mock('@/lib/scraper/analyzer', () => ({
  analyzeRackCapabilities: jest.fn().mockReturnValue({
    hasVCO: true,
    hasVCF: false,
    hasVCA: true,
    hasEnvelope: true,
    hasLFO: true,
    hasSequencer: false,
    totalHP: 208,
    moduleCount: 3,
    possibleTechniques: ['FM', 'subtractive', 'west-coast'],
  }),
  analyzeRack: jest.fn().mockReturnValue({
    missingFundamentals: ['vcf'],
    powerDraw: { positive12V: 250, negative12V: 150, positive5V: 0 },
    warnings: ['Consider adding a filter module'],
  }),
  generateRackSummary: jest.fn().mockReturnValue(
    'This rack has 3 modules with VCO, VCA, and utility modules. Missing: VCF.'
  ),
}));

// Import after mocks
import { POST, OPTIONS } from '@/app/api/racks/analyze/route';

describe('POST /api/racks/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept request when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should return 400 when url is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ModularGrid URL is required');
    });

    it('should return 400 when url is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://invalid-url.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid ModularGrid rack URL');
    });

    it('should accept valid ModularGrid URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Successful Rack Analysis', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should analyze rack and return complete data', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rack).toBeDefined();
      expect(data.modules).toBeDefined();
      expect(data.capabilities).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it('should return correct rack metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rack.id).toBe('2383104');
      expect(data.rack.name).toBe('My Eurorack System');
      expect(data.rack.moduleCount).toBe(3);
      expect(data.rack.rows).toBe(2);
      expect(data.rack.totalHP).toBe(208);
    });

    it('should return module list', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.modules).toBeInstanceOf(Array);
      expect(data.modules).toHaveLength(3);
      expect(data.modules[0].name).toBe('Maths');
      expect(data.modules[1].name).toBe('Plaits');
      expect(data.modules[2].name).toBe('Veils');
    });

    it('should return capabilities analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.capabilities.hasVCO).toBe(true);
      expect(data.capabilities.hasVCA).toBe(true);
      expect(data.capabilities.hasVCF).toBe(false);
      expect(data.capabilities.possibleTechniques).toBeInstanceOf(Array);
      expect(data.capabilities.totalHP).toBe(208);
    });

    it('should return analysis with warnings', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis.missingFundamentals).toBeInstanceOf(Array);
      expect(data.analysis.missingFundamentals).toContain('vcf');
      expect(data.analysis.warnings).toBeInstanceOf(Array);
      expect(data.analysis.powerDraw).toBeDefined();
    });

    it('should return human-readable summary', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.summary).toBe('string');
      expect(data.summary.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should handle scraper errors gracefully', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch rack')
      );

      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze rack');
      expect(data.message).toContain('Failed to fetch rack');
    });

    it('should handle network timeouts', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze rack');
      expect(data.message).toContain('Network timeout');
    });

    it('should handle analyzer errors', async () => {
      const { analyzeRackCapabilities } = require('@/lib/scraper/analyzer');
      (analyzeRackCapabilities as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Analysis failed');
      });

      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze rack');
    });

    it('should handle malformed JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze rack');
    });
  });

  describe('URL Validation Edge Cases', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should reject URLs without rack ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://modulargrid.net/e/racks/view/',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should reject non-ModularGrid URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/analyze', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/racks/123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('OPTIONS Method (CORS)', () => {
    it('should return 200 for OPTIONS request', async () => {
      const response = await OPTIONS();
      expect(response.status).toBe(200);
    });
  });
});
