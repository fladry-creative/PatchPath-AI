/**
 * Integration Tests: POST /api/vision/analyze-and-enrich
 * Tests complete vision + database enrichment pipeline
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock vision analyzer
jest.mock('@/lib/vision/rack-analyzer', () => ({
  analyzeRackImage: jest.fn().mockResolvedValue({
    modules: [
      {
        name: 'Maths',
        manufacturer: 'Make Noise',
        hp: 20,
        position: { x: 0, y: 0, width: 40, height: 128 },
        confidence: 0.95,
      },
      {
        name: 'Plaits',
        manufacturer: 'Mutable Instruments',
        hp: 12,
        position: { x: 40, y: 0, width: 24, height: 128 },
        confidence: 0.88,
      },
    ],
    totalModules: 2,
    rackWidth: 104,
    overallQuality: 0.91,
  }),
  isVisionConfigured: jest.fn().mockReturnValue(true),
  getVisionModelInfo: jest.fn().mockReturnValue({
    model: 'claude-sonnet-4-5',
    provider: 'Anthropic',
    features: ['vision', 'module-identification'],
  }),
}));

// Mock enrichment v2
jest.mock('@/lib/modules/enrichment-v2', () => ({
  enrichModulesBatch: jest.fn().mockResolvedValue([
    {
      name: 'Maths',
      manufacturer: 'Make Noise',
      hp: 20,
      type: 'utility',
      description: 'Analog computer',
      fromCache: true,
      enrichmentTime: 5,
    },
    {
      name: 'Plaits',
      manufacturer: 'Mutable Instruments',
      hp: 12,
      type: 'vco',
      description: 'Macro oscillator',
      fromCache: false,
      enrichmentTime: 150,
    },
  ]),
  calculateEnrichmentStats: jest.fn((results) => ({
    cacheHits: results.filter((r: any) => r.fromCache).length,
    cacheMisses: results.filter((r: any) => !r.fromCache).length,
    hitRate: (results.filter((r: any) => r.fromCache).length / results.length) * 100,
    costSaved: results.filter((r: any) => r.fromCache).length * 0.1,
    totalModules: results.length,
  })),
}));

// Mock Cosmos DB configuration
jest.mock('@/lib/database/cosmos', () => ({
  isCosmosConfigured: jest.fn().mockReturnValue(true),
}));

// Import after mocks
import { POST } from '@/app/api/vision/analyze-and-enrich/route';

describe('POST /api/vision/analyze-and-enrich', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to create form data with image
  const createFormData = (includeImage = true): FormData => {
    const formData = new FormData();

    if (includeImage) {
      const buffer = Buffer.from('fake-image-data');
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'rack-photo.jpg');
    }

    return formData;
  };

  describe('Configuration Checks', () => {
    it('should return 500 when vision API is not configured', async () => {
      const { isVisionConfigured } = require('@/lib/vision/rack-analyzer');
      (isVisionConfigured as jest.Mock).mockReturnValue(false);

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Vision API not configured');
    });

    it('should proceed when vision API is configured', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should skip enrichment when Cosmos DB is not configured', async () => {
      const { isCosmosConfigured } = require('@/lib/database/cosmos');
      (isCosmosConfigured as jest.Mock).mockReturnValue(false);

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.databaseConfigured).toBe(false);
      expect(data.enrichment).toBeNull();
      expect(data.timing.enrichment).toBe('not configured');
    });

    it('should perform enrichment when Cosmos DB is configured', async () => {
      const { isCosmosConfigured } = require('@/lib/database/cosmos');
      (isCosmosConfigured as jest.Mock).mockReturnValue(true);

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.databaseConfigured).toBe(true);
      expect(data.enrichment).not.toBeNull();
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when no image is provided', async () => {
      const formData = createFormData(false);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No image provided');
    });

    it('should accept valid image file', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Complete Pipeline Execution', () => {
    it('should execute full pipeline and return comprehensive results', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visionAnalysis).toBeDefined();
      expect(data.enrichment).toBeDefined();
      expect(data.timing).toBeDefined();
      expect(data.costs).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it('should return vision analysis results', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.visionAnalysis.modules).toBeInstanceOf(Array);
      expect(data.visionAnalysis.modules).toHaveLength(2);
      expect(data.visionAnalysis.totalModules).toBe(2);
    });

    it('should return enrichment results with cache statistics', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.enrichment).not.toBeNull();
      expect(data.enrichment.results).toBeInstanceOf(Array);
      expect(data.enrichment.stats).toBeDefined();
      expect(data.enrichment.stats.cacheHits).toBe(1);
      expect(data.enrichment.stats.cacheMisses).toBe(1);
      expect(data.enrichment.stats.hitRate).toBe(50);
    });

    it('should include timing information for both steps', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.timing.visionAnalysis).toBeDefined();
      expect(data.timing.enrichment).toBeDefined();
      expect(data.timing.total).toBeDefined();
      expect(data.timing.enrichment).not.toBe('not configured');
    });

    it('should calculate cost breakdown', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.costs.vision).toBeDefined();
      expect(data.costs.enrichment).toBeDefined();
      expect(data.costs.total).toBeDefined();
      expect(data.costs.saved).toBeDefined();
      expect(data.costs.vision).toContain('$');
      expect(data.costs.total).toContain('$');
    });

    it('should include comprehensive summary', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.modulesDetected).toBe(2);
      expect(data.summary.modulesEnriched).toBe(2);
      expect(data.summary.cacheHitRate).toBe('50.0%');
      expect(data.summary.costPerModule).toBeDefined();
    });
  });

  describe('Cache Performance', () => {
    it('should report 100% cache hit rate when all modules cached', async () => {
      const { enrichModulesBatch } = require('@/lib/modules/enrichment-v2');
      (enrichModulesBatch as jest.Mock).mockResolvedValueOnce([
        {
          name: 'Maths',
          manufacturer: 'Make Noise',
          fromCache: true,
          enrichmentTime: 5,
        },
        {
          name: 'Plaits',
          manufacturer: 'Mutable Instruments',
          fromCache: true,
          enrichmentTime: 5,
        },
      ]);

      const { calculateEnrichmentStats } = require('@/lib/modules/enrichment-v2');
      (calculateEnrichmentStats as jest.Mock).mockReturnValueOnce({
        cacheHits: 2,
        cacheMisses: 0,
        hitRate: 100,
        costSaved: 0.2,
        totalModules: 2,
      });

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.enrichment.stats.hitRate).toBe(100);
      expect(data.enrichment.stats.cacheHits).toBe(2);
      expect(data.enrichment.stats.cacheMisses).toBe(0);
    });

    it('should report 0% cache hit rate when no modules cached', async () => {
      const { enrichModulesBatch } = require('@/lib/modules/enrichment-v2');
      (enrichModulesBatch as jest.Mock).mockResolvedValueOnce([
        {
          name: 'Maths',
          manufacturer: 'Make Noise',
          fromCache: false,
          enrichmentTime: 150,
        },
        {
          name: 'Plaits',
          manufacturer: 'Mutable Instruments',
          fromCache: false,
          enrichmentTime: 150,
        },
      ]);

      const { calculateEnrichmentStats } = require('@/lib/modules/enrichment-v2');
      (calculateEnrichmentStats as jest.Mock).mockReturnValueOnce({
        cacheHits: 0,
        cacheMisses: 2,
        hitRate: 0,
        costSaved: 0,
        totalModules: 2,
      });

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.enrichment.stats.hitRate).toBe(0);
      expect(data.enrichment.stats.cacheMisses).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle vision analysis errors', async () => {
      const { analyzeRackImage } = require('@/lib/vision/rack-analyzer');
      (analyzeRackImage as jest.Mock).mockRejectedValueOnce(
        new Error('Vision API rate limit exceeded')
      );

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Pipeline failed');
      expect(data.message).toContain('Vision API rate limit exceeded');
    });

    it('should handle enrichment errors', async () => {
      const { enrichModulesBatch } = require('@/lib/modules/enrichment-v2');
      (enrichModulesBatch as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection timeout')
      );

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Pipeline failed');
      expect(data.message).toContain('Database connection timeout');
    });

    it('should handle invalid image format', async () => {
      const { analyzeRackImage } = require('@/lib/vision/rack-analyzer');
      (analyzeRackImage as jest.Mock).mockRejectedValueOnce(new Error('Invalid image format'));

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Invalid image format');
    });
  });

  describe('Empty Results Handling', () => {
    it('should handle case when no modules detected', async () => {
      const { analyzeRackImage } = require('@/lib/vision/rack-analyzer');
      (analyzeRackImage as jest.Mock).mockResolvedValueOnce({
        modules: [],
        totalModules: 0,
        rackWidth: 104,
      });

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.visionAnalysis.modules).toHaveLength(0);
      expect(data.summary.modulesDetected).toBe(0);
      expect(data.summary.modulesEnriched).toBe(0);
    });
  });

  describe('Model Information', () => {
    it('should return model info in response', async () => {
      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.modelInfo).toBeDefined();
      expect(data.modelInfo.model).toBe('claude-sonnet-4-5');
      expect(data.modelInfo.provider).toBe('Anthropic');
    });
  });

  describe('Image Type Support', () => {
    it('should handle different image formats', async () => {
      const formats = ['image/jpeg', 'image/png', 'image/webp'];

      for (const format of formats) {
        const formData = new FormData();
        const buffer = Buffer.from('fake-image-data');
        const blob = new Blob([buffer], { type: format });
        formData.append('image', blob, `rack.${format.split('/')[1]}`);

        const request = new NextRequest('http://localhost:3000/api/vision/analyze-and-enrich', {
          method: 'POST',
          body: formData as any,
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });
});
