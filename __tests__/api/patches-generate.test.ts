/**
 * Integration Tests: POST /api/patches/generate
 * Tests patch generation with authentication, validation, and AI integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Clerk authentication
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock AI/Claude module
jest.mock('@/lib/ai/claude', () => ({
  isClaudeConfigured: jest.fn().mockReturnValue(true),
  generatePatch: jest.fn().mockResolvedValue({
    id: 'test-patch-123',
    metadata: {
      title: 'Dark Ambient Drone',
      description: 'A deep, evolving soundscape',
      difficulty: 'intermediate',
      estimatedTime: 15,
      techniques: ['FM', 'subtractive'],
      genres: ['ambient', 'drone'],
      tags: ['dark', 'evolving'],
    },
    connections: [
      {
        from: { module: 'Maths', output: 'CH1' },
        to: { module: 'Maths', input: 'CV1' },
        cable: 'patch',
        purpose: 'Self-patching for complex modulation',
      },
    ],
    patchingOrder: [
      {
        step: 1,
        action: 'Connect Maths CH1 to Maths CV1',
        explanation: 'Creates a feedback loop',
      },
    ],
    parameters: [
      {
        module: 'Maths',
        parameter: 'Rise',
        setting: '12 o\'clock',
        description: 'Medium rise time',
      },
    ],
    tips: ['Start with low resonance', 'Experiment with modulation depth'],
    whyThisWorks: 'This patch uses feedback loops to create evolving textures.',
    variations: ['Try different FM ratios', 'Add reverb for depth'],
    userId: 'test-user-123',
  }),
  generatePatchVariations: jest.fn().mockResolvedValue([]),
}));

// Mock scraper modules
jest.mock('@/lib/scraper/modulargrid', () => ({
  scrapeModularGridRack: jest.fn().mockResolvedValue({
    url: 'https://modulargrid.net/e/racks/view/2383104',
    metadata: {
      rackId: '2383104',
      rackName: 'Test Rack',
      author: 'test-user',
      hp: 104,
      rows: 1,
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
    totalHP: 104,
    moduleCount: 2,
    possibleTechniques: ['FM', 'subtractive'],
  }),
  analyzeRack: jest.fn().mockReturnValue({
    missingFundamentals: [],
    powerDraw: { positive12V: 100, negative12V: 50, positive5V: 0 },
    warnings: [],
  }),
}));

// Import after mocks
import { POST, OPTIONS } from '@/app/api/patches/generate/route';

describe('POST /api/patches/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Dark ambient drone',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept request when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });

      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Dark ambient drone',
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

    it('should return 400 when rackUrl is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          intent: 'Dark ambient drone',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rack URL is required');
    });

    it('should return 400 when intent is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('User intent is required');
    });

    it('should accept optional parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Dark ambient drone',
          technique: 'FM',
          genre: 'ambient',
          difficulty: 'intermediate',
          generateVariations: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Successful Patch Generation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should generate patch with valid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Dark ambient drone',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patch).toBeDefined();
      expect(data.patch.id).toBe('test-patch-123');
      expect(data.patch.userId).toBe('test-user-123');
      expect(data.patch.metadata.title).toBe('Dark Ambient Drone');
    });

    it('should include rack information in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Create ambient sounds',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rack).toBeDefined();
      expect(data.rack.id).toBe('2383104');
      expect(data.rack.name).toBe('Test Rack');
      expect(data.rack.moduleCount).toBe(2);
    });

    it('should return patch structure with all required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Techno bassline',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.patch.metadata).toBeDefined();
      expect(data.patch.connections).toBeInstanceOf(Array);
      expect(data.patch.patchingOrder).toBeInstanceOf(Array);
      expect(data.patch.parameters).toBeInstanceOf(Array);
      expect(data.patch.tips).toBeInstanceOf(Array);
      expect(data.patch.whyThisWorks).toBeDefined();
      expect(data.patch.variations).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: 'test-user-123' });
    });

    it('should return 500 when Claude is not configured', async () => {
      const { isClaudeConfigured } = require('@/lib/ai/claude');
      (isClaudeConfigured as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Create sounds',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Claude API is not configured');
    });

    it('should handle scraper errors gracefully', async () => {
      const { scrapeModularGridRack } = require('@/lib/scraper/modulargrid');
      (scrapeModularGridRack as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Create patch',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate patch');
      expect(data.message).toContain('Network timeout');
    });

    it('should handle AI generation errors', async () => {
      const { generatePatch } = require('@/lib/ai/claude');
      (generatePatch as jest.Mock).mockRejectedValue(new Error('API rate limit exceeded'));

      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: JSON.stringify({
          rackUrl: 'https://modulargrid.net/e/racks/view/2383104',
          intent: 'Generate patch',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate patch');
      expect(data.message).toContain('API rate limit exceeded');
    });

    it('should handle malformed JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/patches/generate', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate patch');
    });
  });

  describe('OPTIONS Method (CORS)', () => {
    it('should return 200 for OPTIONS request', async () => {
      const response = await OPTIONS();
      expect(response.status).toBe(200);
    });
  });
});
