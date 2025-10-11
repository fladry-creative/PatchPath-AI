/**
 * Integration Tests: POST /api/vision/analyze-rack
 * Tests vision-based rack analysis with image processing
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
      {
        name: 'Unknown Module',
        manufacturer: 'Unknown',
        hp: 8,
        position: { x: 64, y: 0, width: 16, height: 128 },
        confidence: 0.45,
      },
    ],
    totalModules: 3,
    rackWidth: 104,
    layoutAnalysis: {
      rows: 1,
      totalHP: 104,
      usedHP: 40,
    },
  }),
  isVisionConfigured: jest.fn().mockReturnValue(true),
  getVisionModelInfo: jest.fn().mockReturnValue({
    model: 'claude-sonnet-4-5',
    provider: 'Anthropic',
    features: ['vision', 'module-identification'],
  }),
}));

// Mock module enrichment
jest.mock('@/lib/modules/enrichment', () => ({
  enrichModules: jest.fn().mockResolvedValue([
    {
      name: 'Maths',
      manufacturer: 'Make Noise',
      hp: 20,
      type: 'utility',
      description: 'Function generator',
      enriched: true,
    },
    {
      name: 'Plaits',
      manufacturer: 'Mutable Instruments',
      hp: 12,
      type: 'vco',
      description: 'Macro oscillator',
      enriched: true,
    },
  ]),
}));

// Import after mocks
import { POST } from '@/app/api/vision/analyze-rack/route';

describe('POST /api/vision/analyze-rack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to create form data with image
  const createFormData = (includeImage = true, enrich = false): FormData => {
    const formData = new FormData();

    if (includeImage) {
      // Create a mock image file
      const buffer = Buffer.from('fake-image-data');
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'rack-photo.jpg');
    }

    if (enrich) {
      formData.append('enrich', 'true');
    }

    return formData;
  };

  describe('Configuration Checks', () => {
    it('should return 500 when vision API is not configured', async () => {
      const { isVisionConfigured } = require('@/lib/vision/rack-analyzer');
      (isVisionConfigured as jest.Mock).mockReturnValue(false);

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Vision API not configured');
    });

    it('should proceed when vision API is configured', async () => {
      const { isVisionConfigured } = require('@/lib/vision/rack-analyzer');
      (isVisionConfigured as jest.Mock).mockReturnValue(true);

      const formData = createFormData();
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when no image is provided', async () => {
      const formData = createFormData(false); // No image
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No image provided');
      expect(data.message).toBe('Please upload an image file');
    });

    it('should accept valid image file', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Successful Vision Analysis', () => {
    it('should analyze rack image and return results', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visionAnalysis).toBeDefined();
      expect(data.timing).toBeDefined();
      expect(data.modelInfo).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it('should return detected modules', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.visionAnalysis.modules).toBeInstanceOf(Array);
      expect(data.visionAnalysis.modules).toHaveLength(3);
      expect(data.visionAnalysis.modules[0].name).toBe('Maths');
      expect(data.visionAnalysis.modules[0].confidence).toBe(0.95);
    });

    it('should return module positions', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      const firstModule = data.visionAnalysis.modules[0];
      expect(firstModule.position).toBeDefined();
      expect(firstModule.position.x).toBeDefined();
      expect(firstModule.position.y).toBeDefined();
      expect(firstModule.position.width).toBeDefined();
      expect(firstModule.position.height).toBeDefined();
    });

    it('should categorize modules by confidence level', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.modulesDetected).toBe(3);
      expect(data.summary.highConfidence).toBe(2); // > 0.8
      expect(data.summary.mediumConfidence).toBe(0); // 0.5-0.8
      expect(data.summary.lowConfidence).toBe(1); // < 0.5
    });

    it('should include timing information', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.timing.visionAnalysis).toBeDefined();
      expect(data.timing.enrichment).toBe('skipped');
      expect(data.timing.total).toBeDefined();
    });
  });

  describe('Module Enrichment', () => {
    it('should skip enrichment when not requested', async () => {
      const formData = createFormData(true, false);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.enrichedModules).toBeNull();
      expect(data.timing.enrichment).toBe('skipped');
      expect(data.summary.enriched).toBe(0);
    });

    it('should enrich modules when requested', async () => {
      const formData = createFormData(true, true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.enrichedModules).toBeDefined();
      expect(data.enrichedModules).toBeInstanceOf(Array);
      expect(data.enrichedModules).toHaveLength(2);
      expect(data.timing.enrichment).not.toBe('skipped');
      expect(data.summary.enriched).toBe(2);
    });

    it('should include enrichment details in enriched modules', async () => {
      const formData = createFormData(true, true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      const enrichedModule = data.enrichedModules[0];
      expect(enrichedModule.type).toBe('utility');
      expect(enrichedModule.description).toBeDefined();
      expect(enrichedModule.enriched).toBe(true);
    });
  });

  describe('Image Type Support', () => {
    it('should handle JPEG images', async () => {
      const formData = new FormData();
      const buffer = Buffer.from('fake-jpeg-data');
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'rack.jpg');

      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle PNG images', async () => {
      const formData = new FormData();
      const buffer = Buffer.from('fake-png-data');
      const blob = new Blob([buffer], { type: 'image/png' });
      formData.append('image', blob, 'rack.png');

      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should handle WebP images', async () => {
      const formData = new FormData();
      const buffer = Buffer.from('fake-webp-data');
      const blob = new Blob([buffer], { type: 'image/webp' });
      formData.append('image', blob, 'rack.webp');

      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle vision analysis errors', async () => {
      const { analyzeRackImage } = require('@/lib/vision/rack-analyzer');
      (analyzeRackImage as jest.Mock).mockRejectedValueOnce(
        new Error('Vision API rate limit exceeded')
      );

      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Vision analysis failed');
      expect(data.message).toContain('Vision API rate limit exceeded');
    });

    it('should handle enrichment errors gracefully', async () => {
      const { enrichModules } = require('@/lib/modules/enrichment');
      (enrichModules as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

      const formData = createFormData(true, true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Vision analysis failed');
    });

    it('should handle invalid image buffer', async () => {
      const { analyzeRackImage } = require('@/lib/vision/rack-analyzer');
      (analyzeRackImage as jest.Mock).mockRejectedValueOnce(new Error('Invalid image format'));

      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain('Invalid image format');
    });
  });

  describe('Model Information', () => {
    it('should return model info in response', async () => {
      const formData = createFormData(true);
      const request = new NextRequest('http://localhost:3000/api/vision/analyze-rack', {
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
});
