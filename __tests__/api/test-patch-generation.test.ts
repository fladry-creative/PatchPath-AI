/**
 * Integration Tests: GET /api/test-patch-generation
 * Tests development patch generation endpoint
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Claude AI
jest.mock('@/lib/ai/claude', () => ({
  isClaudeConfigured: jest.fn().mockReturnValue(true),
  getModelInfo: jest.fn().mockReturnValue({
    model: 'claude-sonnet-4-5',
    provider: 'Anthropic',
    pricing: {
      input: '$3/1M tokens',
      output: '$15/1M tokens',
    },
  }),
  generatePatch: jest.fn().mockResolvedValue({
    id: 'test-patch-dev-123',
    metadata: {
      title: 'Ambient Evolving Soundscape',
      description: 'A generative patch for ambient music',
      difficulty: 'intermediate',
      estimatedTime: 20,
      techniques: ['FM', 'generative'],
      genres: ['ambient', 'experimental'],
      tags: ['evolving', 'modular'],
    },
    connections: [
      {
        from: { module: 'Maths', output: 'CH1' },
        to: { module: 'Plaits', input: 'V/OCT' },
        cable: 'patch',
        purpose: 'Modulate pitch',
      },
      {
        from: { module: 'Plaits', output: 'OUT' },
        to: { module: 'Veils', input: 'IN1' },
        cable: 'patch',
        purpose: 'Route audio',
      },
    ],
    patchingOrder: [
      {
        step: 1,
        action: 'Connect Maths CH1 to Plaits V/OCT',
        explanation: 'This modulates the oscillator pitch',
      },
      {
        step: 2,
        action: 'Connect Plaits OUT to Veils IN1',
        explanation: 'Route audio through VCA',
      },
    ],
    parameters: [
      {
        module: 'Maths',
        parameter: 'Rise',
        setting: '2 o\'clock',
        description: 'Slow rise time for evolving modulation',
      },
      {
        module: 'Plaits',
        parameter: 'Model',
        setting: 'Wavetable',
        description: 'Use wavetable synthesis',
      },
    ],
    tips: ['Start with slow modulation', 'Experiment with different Plaits models'],
    whyThisWorks:
      'This patch creates evolving soundscapes by using Maths to modulate Plaits pitch.',
    variations: ['Try different Maths channels', 'Add reverb for depth'],
  }),
}));

// Mock scraper
jest.mock('@/lib/scraper/modulargrid', () => ({
  scrapeModularGridRack: jest.fn().mockResolvedValue({
    url: 'https://modulargrid.net/e/racks/view/2383104',
    metadata: {
      rackId: '2383104',
      rackName: 'Test Rack',
      author: 'testuser',
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
      },
      {
        id: 'module-2',
        name: 'Plaits',
        manufacturer: 'Mutable Instruments',
        hp: 12,
        type: 'vco',
      },
      {
        id: 'module-3',
        name: 'Veils',
        manufacturer: 'Mutable Instruments',
        hp: 10,
        type: 'vca',
      },
    ],
    rows: [],
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
    possibleTechniques: ['FM', 'subtractive', 'generative'],
  }),
  analyzeRack: jest.fn().mockReturnValue({
    missingFundamentals: ['vcf'],
    powerDraw: { positive12V: 300, negative12V: 150, positive5V: 0 },
    warnings: ['Consider adding a filter'],
  }),
}));

// Mock data
jest.mock('@/lib/scraper/mock-data', () => ({
  getMockRack: jest.fn().mockReturnValue({
    url: 'mock://rack',
    metadata: {
      rackId: 'mock-001',
      rackName: 'Mock Development Rack',
      author: 'mock-user',
      hp: 104,
      rows: 1,
    },
    modules: [
      {
        id: 'mock-1',
        name: 'Maths',
        manufacturer: 'Make Noise',
        hp: 20,
        type: 'utility',
      },
      {
        id: 'mock-2',
        name: 'Plaits',
        manufacturer: 'Mutable Instruments',
        hp: 12,
        type: 'vco',
      },
    ],
    rows: [],
  }),
}));

// Import after mocks
import { GET } from '@/app/api/test-patch-generation/route';

describe('GET /api/test-patch-generation', () => {
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
        'http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('This endpoint is only available in development');
    });

    it('should work in development environment', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Configuration Checks', () => {
    it('should return 500 when Claude is not configured', async () => {
      const { isClaudeConfigured } = require('@/lib/ai/claude');
      (isClaudeConfigured as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Claude API not configured');
      expect(data.message).toContain('ANTHROPIC_API_KEY');
      expect(data.modelInfo).toBeDefined();
    });

    it('should proceed when Claude is configured', async () => {
      const { isClaudeConfigured } = require('@/lib/ai/claude');
      (isClaudeConfigured as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Mock Data Mode', () => {
    it('should use mock data when mock=true', async () => {
      const { getMockRack } = require('@/lib/scraper/mock-data');
      const mockRack = getMockRack();

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?mock=true'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(getMockRack).toHaveBeenCalled();
      expect(data.rack.id).toBe('mock-001');
      expect(data.rack.name).toBe('Mock Development Rack');
    });

    it('should use mock data when url is "mock"', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?url=mock'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rack.id).toBe('mock-001');
    });

    it('should use mock data when no url parameter provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rack.id).toBe('mock-001');
    });
  });

  describe('Real Rack Scraping Mode', () => {
    it('should scrape real rack when valid url provided', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(scrapeModularGridRack).toHaveBeenCalled();
      expect(data.rack.id).toBe('2383104');
    });

    it('should accept mock=false to force real scraping', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&mock=false'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(scrapeModularGridRack).toHaveBeenCalled();
    });
  });

  describe('Intent Parameter', () => {
    it('should use default intent when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept custom intent', async () => {
      const { generatePatch } = require('@/lib/ai/claude');

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?intent=Create+techno+bassline'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(generatePatch).toHaveBeenCalled();
    });

    it('should pass technique parameter', async () => {
      const { generatePatch } = require('@/lib/ai/claude');

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?technique=FM'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(generatePatch).toHaveBeenCalled();
      const callArgs = (generatePatch as jest.Mock).mock.calls[0];
      expect(callArgs[4]).toHaveProperty('technique', 'FM');
    });

    it('should pass genre parameter', async () => {
      const { generatePatch } = require('@/lib/ai/claude');

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?genre=techno'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(generatePatch).toHaveBeenCalled();
      const callArgs = (generatePatch as jest.Mock).mock.calls[0];
      expect(callArgs[4]).toHaveProperty('genre', 'techno');
    });
  });

  describe('Successful Patch Generation', () => {
    it('should generate patch and return complete data', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.generationTime).toBeDefined();
      expect(data.modelInfo).toBeDefined();
      expect(data.rack).toBeDefined();
      expect(data.capabilities).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(data.patch).toBeDefined();
    });

    it('should return timing information', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.generationTime).toMatch(/\d+\.\d{2}s/);
    });

    it('should return model information', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.modelInfo.model).toBe('claude-sonnet-4-5');
      expect(data.modelInfo.provider).toBe('Anthropic');
    });

    it('should return patch with all required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.patch.id).toBeDefined();
      expect(data.patch.metadata).toBeDefined();
      expect(data.patch.connections).toBeInstanceOf(Array);
      expect(data.patch.patchingOrder).toBeInstanceOf(Array);
      expect(data.patch.parameters).toBeInstanceOf(Array);
      expect(data.patch.tips).toBeInstanceOf(Array);
      expect(data.patch.whyThisWorks).toBeDefined();
    });

    it('should include helpful summary', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.patch._summary).toBeDefined();
      expect(data.patch._summary.title).toBe('Ambient Evolving Soundscape');
      expect(data.patch._summary.difficulty).toBe('intermediate');
      expect(data.patch._summary.estimatedTime).toContain('minutes');
      expect(data.patch._summary.connectionCount).toBe(2);
      expect(data.patch._summary.stepCount).toBe(2);
    });

    it('should return rack information', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.rack.id).toBeDefined();
      expect(data.rack.name).toBeDefined();
      expect(data.rack.moduleCount).toBeGreaterThan(0);
    });

    it('should return capabilities and analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(data.capabilities.hasVCO).toBeDefined();
      expect(data.capabilities.possibleTechniques).toBeInstanceOf(Array);
      expect(data.analysis.missingFundamentals).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle scraper errors', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch rack')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Patch generation test failed');
      expect(data.message).toContain('Failed to fetch rack');
      expect(data.stack).toBeDefined(); // Development mode
    });

    it('should handle AI generation errors', async () => {
      const { generatePatch } = require('@/lib/ai/claude');
      (generatePatch as jest.Mock).mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Patch generation test failed');
      expect(data.message).toContain('API rate limit exceeded');
    });

    it('should handle analyzer errors', async () => {
      const { analyzeRackCapabilities } = require('@/lib/scraper/analyzer');
      (analyzeRackCapabilities as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Analysis failed');
      });

      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Analysis failed');
    });
  });

  describe('URL Encoding', () => {
    it('should handle URL-encoded intent', async () => {
      const intent = 'Create dark ambient drone sounds';
      const encodedIntent = encodeURIComponent(intent);

      const request = new NextRequest(
        `http://localhost:3000/api/test-patch-generation?intent=${encodedIntent}`
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle URL-encoded technique and genre', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test-patch-generation?technique=West%20Coast&genre=experimental%20techno'
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Performance Metrics', () => {
    it('should measure generation time', async () => {
      const { generatePatch } = require('@/lib/ai/claude');
      (generatePatch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 'perf-test',
                  metadata: {
                    title: 'Test',
                    difficulty: 'beginner',
                    estimatedTime: 10,
                    techniques: [],
                    genres: [],
                    tags: [],
                  },
                  connections: [],
                  patchingOrder: [],
                  parameters: [],
                  tips: [],
                  whyThisWorks: 'Test',
                  variations: [],
                }),
              100
            )
          )
      );

      const request = new NextRequest('http://localhost:3000/api/test-patch-generation');

      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.generationTime).toBeDefined();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
