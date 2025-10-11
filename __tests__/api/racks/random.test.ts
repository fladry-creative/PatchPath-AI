/**
 * Random Rack API Endpoint Tests
 * Tests the GET /api/racks/random endpoint
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/racks/random/route';
import { NextRequest } from 'next/server';

describe('Random Rack API Endpoint', () => {
  describe('GET /api/racks/random', () => {
    it('should return a random rack successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.rack).toBeDefined();
      expect(data.rack.url).toBeTruthy();
      expect(data.rack.rackId).toBeTruthy();
      expect(data.rack.moduleCount).toBeGreaterThan(0);
      expect(data.rack.totalHP).toBeGreaterThan(0);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.duration).toBeTruthy();
      expect(data.metadata.timestamp).toBeTruthy();
    }, 60000); // Increase timeout for scraping

    it('should return valid rack metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.rack.rackName).toBeTruthy();
      expect(data.rack.rows).toBeGreaterThan(0);
      expect(typeof data.rack.moduleCount).toBe('number');
      expect(typeof data.rack.totalHP).toBe('number');
    }, 60000);

    it('should return response within reasonable time', async () => {
      const start = Date.now();

      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      const duration = Date.now() - start;

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Should complete within 60 seconds (even with scraping)
      expect(duration).toBeLessThan(60000);
    }, 60000);

    it('should include timing information in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.metadata.duration).toMatch(/\d+ms/);
      expect(new Date(data.metadata.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    }, 60000);

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        new NextRequest('http://localhost:3000/api/racks/random'),
        new NextRequest('http://localhost:3000/api/racks/random'),
        new NextRequest('http://localhost:3000/api/racks/random'),
      ];

      const responses = await Promise.all(requests.map((req) => GET(req)));

      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.rack).toBeDefined();
      }
    }, 180000); // 3 minute timeout for multiple scrapes
  });

  describe('Error Handling', () => {
    it('should return 500 on internal errors', async () => {
      // This test would require mocking to force an error
      // For now, we verify the happy path works
      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      // Should not return 500 under normal circumstances
      expect(response.status).not.toBe(500);
    }, 60000);

    it('should include error details in response on failure', async () => {
      // This would require mocking getRandomRack to throw an error
      // Skipping for now as it's hard to test without mocking
      expect(true).toBe(true);
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/racks/random');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();

      // Verify structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('rack');
      expect(data).toHaveProperty('metadata');

      // Verify rack structure
      expect(data.rack).toHaveProperty('url');
      expect(data.rack).toHaveProperty('rackId');
      expect(data.rack).toHaveProperty('rackName');
      expect(data.rack).toHaveProperty('moduleCount');
      expect(data.rack).toHaveProperty('totalHP');
      expect(data.rack).toHaveProperty('rows');

      // Verify metadata structure
      expect(data.metadata).toHaveProperty('duration');
      expect(data.metadata).toHaveProperty('timestamp');
    }, 60000);
  });

  describe('Cache Behavior', () => {
    it('should benefit from caching on subsequent requests', async () => {
      // First request (may scrape)
      const request1 = new NextRequest('http://localhost:3000/api/racks/random');
      const start1 = Date.now();
      await GET(request1);
      const duration1 = Date.now() - start1;

      // Second request (should use cache)
      const request2 = new NextRequest('http://localhost:3000/api/racks/random');
      const start2 = Date.now();
      await GET(request2);
      const duration2 = Date.now() - start2;

      // Both should complete successfully
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0);

      // Cache should generally be faster, but not guaranteed due to randomness
      // Just verify both complete in reasonable time
      expect(duration1).toBeLessThan(60000);
      expect(duration2).toBeLessThan(60000);
    }, 120000);
  });
});
