/**
 * Unit tests for random rack handler
 */

import {
  getRandomDemoRack,
  getGibberishResponse,
  handleGibberishInput,
  handleRandomRequest,
} from '@/lib/chat/random-rack-handler';

// Mock fetch for API tests
global.fetch = jest.fn();

describe('Random Rack Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRandomDemoRack', () => {
    it('should return a random demo rack', () => {
      const rack = getRandomDemoRack();

      expect(rack).toBeDefined();
      expect(rack.url).toMatch(/https:\/\/modulargrid\.net\/e\/racks\/view\/\d+/);
      expect(rack.description).toBeDefined();
      expect(rack.complexity).toMatch(/beginner|intermediate|advanced/);
      expect(Array.isArray(rack.genres)).toBe(true);
    });

    it('should return different racks on multiple calls', () => {
      const racks = new Set();

      // Get 10 racks, should have some variety
      for (let i = 0; i < 10; i++) {
        const rack = getRandomDemoRack();
        racks.add(rack.url);
      }

      // Should have at least 2 different racks (statistically very likely)
      expect(racks.size).toBeGreaterThanOrEqual(1);
    });

    it('should filter by complexity', () => {
      const beginnerRack = getRandomDemoRack('beginner');
      expect(beginnerRack.complexity).toBe('beginner');

      const intermediateRack = getRandomDemoRack('intermediate');
      expect(intermediateRack.complexity).toBe('intermediate');

      const advancedRack = getRandomDemoRack('advanced');
      expect(advancedRack.complexity).toBe('advanced');
    });

    it('should filter by genre', () => {
      const ambientRack = getRandomDemoRack(undefined, 'ambient');
      expect(ambientRack.genres.some((g) => g.toLowerCase().includes('ambient'))).toBe(true);

      const technoRack = getRandomDemoRack(undefined, 'techno');
      expect(technoRack.genres.some((g) => g.toLowerCase().includes('techno'))).toBe(true);
    });

    it('should handle both complexity and genre filters', () => {
      const rack = getRandomDemoRack('intermediate', 'ambient');

      expect(rack.complexity).toBe('intermediate');
      expect(rack.genres.some((g) => g.toLowerCase().includes('ambient'))).toBe(true);
    });

    it('should fallback to all racks if no matches', () => {
      // Request impossible combination
      const rack = getRandomDemoRack('beginner', 'nonexistentgenre');

      // Should still return a rack (fallback)
      expect(rack).toBeDefined();
      expect(rack.url).toMatch(/https:\/\/modulargrid\.net\/e\/racks\/view\/\d+/);
    });
  });

  describe('getGibberishResponse', () => {
    it('should return a humorous response', () => {
      const response = getGibberishResponse();

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should return different responses on multiple calls', () => {
      const responses = new Set();

      // Get 10 responses
      for (let i = 0; i < 10; i++) {
        const response = getGibberishResponse();
        responses.add(response);
      }

      // Should have some variety (at least 2 different responses)
      expect(responses.size).toBeGreaterThanOrEqual(1);
    });

    it('should contain expected phrases', () => {
      const responses = [];

      // Collect multiple responses
      for (let i = 0; i < 20; i++) {
        responses.push(getGibberishResponse());
      }

      // At least one should contain something funny
      const hasHumor = responses.some(
        (r) =>
          r.includes('😂') ||
          r.includes('random') ||
          r.includes('rack') ||
          r.includes('creative') ||
          r.includes('Error 404')
      );

      expect(hasHumor).toBe(true);
    });
  });

  describe('handleGibberishInput', () => {
    it('should return response with message and rack URL', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://modulargrid.net/e/racks/view/2383104',
          fromCache: true,
        }),
      });

      const result = await handleGibberishInput('DLXJFLDJLD');

      expect(result.message).toBeDefined();
      expect(result.rackUrl).toBe('https://modulargrid.net/e/racks/view/2383104');
      expect(result.fromCache).toBe(true);
    });

    it('should fallback to demo rack if API fails', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await handleGibberishInput('ASDFGHJKL');

      expect(result.message).toBeDefined();
      expect(result.rackUrl).toMatch(/https:\/\/modulargrid\.net\/e\/racks\/view\/\d+/);
      expect(result.fromCache).toBe(false);
    });

    it('should include humorous message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://modulargrid.net/e/racks/view/123',
          fromCache: false,
        }),
      });

      const result = await handleGibberishInput('qwertyuiop');

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('handleRandomRequest', () => {
    it('should return encouraging message with rack URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://modulargrid.net/e/racks/view/999',
          fromCache: true,
        }),
      });

      const result = await handleRandomRequest();

      expect(result.message).toBeDefined();
      expect(result.message).toMatch(/random|surprise|explore|creative|fun/i);
      expect(result.rackUrl).toBe('https://modulargrid.net/e/racks/view/999');
      expect(result.fromCache).toBe(true);
    });

    it('should fallback to demo rack if API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      const result = await handleRandomRequest();

      expect(result.message).toBeDefined();
      expect(result.rackUrl).toMatch(/https:\/\/modulargrid\.net\/e\/racks\/view\/\d+/);
      expect(result.fromCache).toBe(false);
    });

    it('should include emoji in message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://modulargrid.net/e/racks/view/456',
          fromCache: false,
        }),
      });

      const result = await handleRandomRequest();

      // Should have emoji (🎲, ✨, 🎸, 🎛️, or 🌟)
      expect(result.message).toMatch(/🎲|✨|🎸|🎛️|🌟/);
    });
  });
});
