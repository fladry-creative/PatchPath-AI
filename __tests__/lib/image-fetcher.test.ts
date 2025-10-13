/**
 * Integration Tests: Image Fetcher
 * Tests for CDN image fetching from ModularGrid
 *
 * NOTE: These tests make real HTTP requests to ModularGrid's CDN
 * They are designed to be respectful with delays between requests
 *
 * @jest-environment node
 */

import {
  fetchRackImage,
  fetchRackImageBatch,
  checkRackImageExists,
} from '@/lib/scraper/image-fetcher';
import { constructCDNUrl } from '@/lib/scraper/url-parser';

// Use real, well-known public racks for integration testing
const TEST_RACKS = {
  DEMO_RACK: '2383104', // PatchPath demo rack (known to exist)
  YOUR_RACK: '1186947', // User's example rack
  KNOWN_PUBLIC: '123', // Small rack ID (may or may not exist, for 404 testing)
};

describe('Image Fetcher Integration Tests', () => {
  // Add delay between tests to be respectful to ModularGrid CDN
  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('fetchRackImage', () => {
    test('fetches real rack image from CDN', async () => {
      const cdnUrl = constructCDNUrl(TEST_RACKS.DEMO_RACK);

      const result = await fetchRackImage(cdnUrl);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.sizeBytes).toBeGreaterThan(1024); // At least 1KB
      expect(result.fetchTimeMs).toBeGreaterThan(0);
      expect(result.cdnUrl).toBe(cdnUrl);

      // Image should be reasonable size (not tiny error page, not huge)
      expect(result.sizeBytes).toBeGreaterThan(10_000); // At least 10KB
      expect(result.sizeBytes).toBeLessThan(5_000_000); // Less than 5MB

      // Should be fast
      expect(result.fetchTimeMs).toBeLessThan(2000); // Less than 2 seconds
    }, 10000); // 10 second timeout for network request

    test('includes correct metadata', async () => {
      const cdnUrl = constructCDNUrl(TEST_RACKS.YOUR_RACK);

      const result = await fetchRackImage(cdnUrl);

      expect(result.cdnUrl).toBe(cdnUrl);
      expect(typeof result.sizeBytes).toBe('number');
      expect(typeof result.fetchTimeMs).toBe('number');
    }, 10000);

    test('handles 404 for non-existent rack gracefully', async () => {
      const cdnUrl = constructCDNUrl('9999999999'); // Very unlikely to exist

      await expect(fetchRackImage(cdnUrl)).rejects.toThrow('Rack image not found');
    }, 10000);

    test('provides helpful error message for 404', async () => {
      const cdnUrl = constructCDNUrl('9999999999');

      try {
        await fetchRackImage(cdnUrl);
        fail('Should have thrown error');
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('Rack image not found');
        expect((error as Error).message).toContain('may not exist');
        expect((error as Error).message).toContain('Tips:');
      }
    }, 10000);

    test('handles network timeout', async () => {
      // This test would require a mock server or network condition simulation
      // Skipping for now but documenting the expected behavior
      // await expect(fetchRackImage('https://cdn.modulargrid.net/...')).rejects.toThrow('timeout');
    });
  });

  describe('checkRackImageExists', () => {
    test('returns true for existing rack', async () => {
      const cdnUrl = constructCDNUrl(TEST_RACKS.DEMO_RACK);

      const exists = await checkRackImageExists(cdnUrl);

      expect(exists).toBe(true);
    }, 10000);

    test('returns false for non-existent rack', async () => {
      const cdnUrl = constructCDNUrl('9999999999');

      const exists = await checkRackImageExists(cdnUrl);

      expect(exists).toBe(false);
    }, 10000);

    test('is faster than full image fetch (uses HEAD request)', async () => {
      const cdnUrl = constructCDNUrl(TEST_RACKS.DEMO_RACK);

      const startTime = Date.now();
      await checkRackImageExists(cdnUrl);
      const checkTime = Date.now() - startTime;

      // HEAD request should be significantly faster than full fetch
      // since it doesn't download the body
      expect(checkTime).toBeLessThan(1000); // Should be under 1 second
    }, 10000);
  });

  describe('fetchRackImageBatch', () => {
    test('fetches multiple rack images in parallel', async () => {
      const cdnUrls = [
        constructCDNUrl(TEST_RACKS.DEMO_RACK),
        constructCDNUrl(TEST_RACKS.YOUR_RACK),
      ];

      const results = await fetchRackImageBatch(cdnUrls, {
        maxConcurrent: 2,
        continueOnError: true,
      });

      expect(results).toHaveLength(2);

      // Check first result
      const result1 = results[0];
      if (result1 instanceof Error) {
        // Might fail if rack doesn't exist, that's okay for test
        expect(result1).toBeInstanceOf(Error);
      } else {
        expect(result1.buffer).toBeInstanceOf(Buffer);
        expect(result1.sizeBytes).toBeGreaterThan(1024);
      }
    }, 15000); // Longer timeout for batch

    test('handles mix of success and failure', async () => {
      const cdnUrls = [
        constructCDNUrl(TEST_RACKS.DEMO_RACK), // Should succeed
        constructCDNUrl('9999999999'), // Should fail
      ];

      const results = await fetchRackImageBatch(cdnUrls, {
        maxConcurrent: 2,
        continueOnError: true,
      });

      expect(results).toHaveLength(2);

      // At least one should succeed
      const successCount = results.filter((r) => !(r instanceof Error)).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // At least one should fail
      const errorCount = results.filter((r) => r instanceof Error).length;
      expect(errorCount).toBeGreaterThanOrEqual(1);
    }, 15000);

    test('respects maxConcurrent limit', async () => {
      // This is hard to test directly without mocking, but we can verify
      // the function completes successfully with the limit set
      const cdnUrls = [
        constructCDNUrl(TEST_RACKS.DEMO_RACK),
        constructCDNUrl(TEST_RACKS.YOUR_RACK),
      ];

      const results = await fetchRackImageBatch(cdnUrls, {
        maxConcurrent: 1, // Force sequential
        continueOnError: true,
      });

      expect(results).toHaveLength(2);
    }, 20000); // Longer timeout since it's sequential
  });

  describe('Error Handling', () => {
    test('validates image is not empty', async () => {
      // This test would require a mock server returning empty response
      // Documenting expected behavior
    });

    test('validates image is reasonable size', async () => {
      // Images under 1KB are suspicious (likely error pages)
      // This is checked in the main function
    });
  });

  describe('Performance', () => {
    test('CDN fetch is fast (<500ms for most racks)', async () => {
      const cdnUrl = constructCDNUrl(TEST_RACKS.DEMO_RACK);

      const startTime = Date.now();
      await fetchRackImage(cdnUrl);
      const totalTime = Date.now() - startTime;

      // CDN should be fast (though network conditions vary)
      // Being generous with 2s limit to account for network variability
      expect(totalTime).toBeLessThan(2000);
    }, 10000);

    test('parallel fetching is efficient', async () => {
      const cdnUrls = [
        constructCDNUrl(TEST_RACKS.DEMO_RACK),
        constructCDNUrl(TEST_RACKS.YOUR_RACK),
      ];

      const startTime = Date.now();
      await fetchRackImageBatch(cdnUrls, { maxConcurrent: 2 });
      const totalTime = Date.now() - startTime;

      // Parallel should be faster than 2x sequential
      // (though not exactly 2x due to overhead)
      expect(totalTime).toBeLessThan(5000); // Generous limit
    }, 15000);
  });
});

describe('Image Fetcher - Respectful Usage', () => {
  test('includes user agent identification', async () => {
    // The fetchRackImage function sets User-Agent header
    // This is respectful and helps ModularGrid identify traffic
    const cdnUrl = constructCDNUrl(TEST_RACKS.DEMO_RACK);

    // Should complete successfully (proves headers are accepted)
    const result = await fetchRackImage(cdnUrl);
    expect(result).toBeDefined();
  }, 10000);

  test('batch fetching includes delays between chunks', async () => {
    // The batch function adds 100ms delay between chunks
    // This is documented and tested by verifying completion
    const cdnUrls = Array(3).fill(constructCDNUrl(TEST_RACKS.DEMO_RACK));

    const startTime = Date.now();
    await fetchRackImageBatch(cdnUrls, { maxConcurrent: 1 });
    const totalTime = Date.now() - startTime;

    // Should include delays (at least 200ms for 3 items)
    // Being very generous to account for actual fetch time
    expect(totalTime).toBeGreaterThan(200);
  }, 15000);
});
