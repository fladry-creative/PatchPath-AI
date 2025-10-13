/**
 * Unit Tests: URL Parser
 * Tests for ModularGrid URL parsing (rack page and CDN URLs)
 */

import {
  parseRackUrl,
  constructCDNUrl,
  constructPageUrl,
  extractRackId,
  isValidModularGridUrl,
  getUrlType,
} from '@/lib/scraper/url-parser';

describe('URL Parser', () => {
  describe('parseRackUrl', () => {
    describe('Rack Page URLs', () => {
      test('parses standard rack page URL', () => {
        const result = parseRackUrl('https://modulargrid.net/e/racks/view/1186947');

        expect(result.type).toBe('rack_page_url');
        expect(result.rackId).toBe('1186947');
        expect(result.cdnUrl).toBe('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
        expect(result.pageUrl).toBe('https://modulargrid.net/e/racks/view/1186947');
      });

      test('parses rack page URL with www prefix', () => {
        const result = parseRackUrl('https://www.modulargrid.net/e/racks/view/2383104');

        expect(result.type).toBe('rack_page_url');
        expect(result.rackId).toBe('2383104');
      });

      test('parses rack page URL with query parameters', () => {
        const result = parseRackUrl('https://modulargrid.net/e/racks/view/1186947?shared=true');

        expect(result.type).toBe('rack_page_url');
        expect(result.rackId).toBe('1186947');
      });

      test('parses rack page URL with trailing slash', () => {
        const result = parseRackUrl('https://modulargrid.net/e/racks/view/1186947/');

        expect(result.type).toBe('rack_page_url');
        expect(result.rackId).toBe('1186947');
      });

      test('parses rack page URL with whitespace', () => {
        const result = parseRackUrl('  https://modulargrid.net/e/racks/view/1186947  ');

        expect(result.type).toBe('rack_page_url');
        expect(result.rackId).toBe('1186947');
      });
    });

    describe('CDN Image URLs', () => {
      test('parses CDN image URL', () => {
        const result = parseRackUrl(
          'https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg'
        );

        expect(result.type).toBe('cdn_image_url');
        expect(result.rackId).toBe('1186947');
        expect(result.cdnUrl).toBe('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
        expect(result.pageUrl).toBe('https://modulargrid.net/e/racks/view/1186947');
      });

      test('parses CDN URL with different rack ID', () => {
        const result = parseRackUrl(
          'https://cdn.modulargrid.net/img/racks/modulargrid_2383104.jpg'
        );

        expect(result.type).toBe('cdn_image_url');
        expect(result.rackId).toBe('2383104');
      });

      test('parses CDN URL with whitespace', () => {
        const result = parseRackUrl(
          '  https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg  '
        );

        expect(result.type).toBe('cdn_image_url');
        expect(result.rackId).toBe('1186947');
      });
    });

    describe('Invalid URLs', () => {
      test('throws error for completely invalid URL', () => {
        expect(() => parseRackUrl('https://example.com')).toThrow('Invalid ModularGrid URL');
      });

      test('throws error for ModularGrid domain but wrong path', () => {
        expect(() => parseRackUrl('https://modulargrid.net/e/modules/browser')).toThrow(
          'Invalid ModularGrid URL'
        );
      });

      test('throws error for empty string', () => {
        expect(() => parseRackUrl('')).toThrow('Invalid ModularGrid URL');
      });

      test('throws error for whitespace only', () => {
        expect(() => parseRackUrl('   ')).toThrow('Invalid ModularGrid URL');
      });

      test('throws error for rack URL without ID', () => {
        expect(() => parseRackUrl('https://modulargrid.net/e/racks/view/')).toThrow(
          'Invalid ModularGrid URL'
        );
      });

      test('error message includes helpful format examples', () => {
        try {
          parseRackUrl('https://invalid.com');
        } catch (error) {
          expect(error instanceof Error).toBe(true);
          expect((error as Error).message).toContain('https://modulargrid.net/e/racks/view/[ID]');
          expect((error as Error).message).toContain('cdn.modulargrid.net/img/racks');
        }
      });
    });
  });

  describe('constructCDNUrl', () => {
    test('constructs CDN URL from rack ID', () => {
      const cdnUrl = constructCDNUrl('1186947');
      expect(cdnUrl).toBe('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
    });

    test('works with different rack IDs', () => {
      expect(constructCDNUrl('2383104')).toBe(
        'https://cdn.modulargrid.net/img/racks/modulargrid_2383104.jpg'
      );
      expect(constructCDNUrl('123')).toBe(
        'https://cdn.modulargrid.net/img/racks/modulargrid_123.jpg'
      );
    });
  });

  describe('constructPageUrl', () => {
    test('constructs page URL from rack ID', () => {
      const pageUrl = constructPageUrl('1186947');
      expect(pageUrl).toBe('https://modulargrid.net/e/racks/view/1186947');
    });

    test('works with different rack IDs', () => {
      expect(constructPageUrl('2383104')).toBe('https://modulargrid.net/e/racks/view/2383104');
      expect(constructPageUrl('123')).toBe('https://modulargrid.net/e/racks/view/123');
    });
  });

  describe('extractRackId', () => {
    test('extracts ID from rack page URL', () => {
      const id = extractRackId('https://modulargrid.net/e/racks/view/1186947');
      expect(id).toBe('1186947');
    });

    test('extracts ID from CDN URL', () => {
      const id = extractRackId('https://cdn.modulargrid.net/img/racks/modulargrid_2383104.jpg');
      expect(id).toBe('2383104');
    });

    test('returns null for invalid URL', () => {
      const id = extractRackId('https://example.com');
      expect(id).toBeNull();
    });
  });

  describe('isValidModularGridUrl', () => {
    test('returns true for valid rack page URL', () => {
      expect(isValidModularGridUrl('https://modulargrid.net/e/racks/view/1186947')).toBe(true);
    });

    test('returns true for valid CDN URL', () => {
      expect(
        isValidModularGridUrl('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg')
      ).toBe(true);
    });

    test('returns false for invalid URL', () => {
      expect(isValidModularGridUrl('https://example.com')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isValidModularGridUrl('')).toBe(false);
    });

    test('returns false for non-ModularGrid domain', () => {
      expect(isValidModularGridUrl('https://other-site.net/e/racks/view/123')).toBe(false);
    });
  });

  describe('getUrlType', () => {
    test('returns rack_page_url for rack page URL', () => {
      const type = getUrlType('https://modulargrid.net/e/racks/view/1186947');
      expect(type).toBe('rack_page_url');
    });

    test('returns cdn_image_url for CDN URL', () => {
      const type = getUrlType('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
      expect(type).toBe('cdn_image_url');
    });

    test('returns null for invalid URL', () => {
      const type = getUrlType('https://example.com');
      expect(type).toBeNull();
    });

    test('returns null for empty string', () => {
      const type = getUrlType('');
      expect(type).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long rack IDs', () => {
      const longId = '123456789012345';
      const result = parseRackUrl(`https://modulargrid.net/e/racks/view/${longId}`);
      expect(result.rackId).toBe(longId);
    });

    test('handles single digit rack IDs', () => {
      const result = parseRackUrl('https://modulargrid.net/e/racks/view/1');
      expect(result.rackId).toBe('1');
    });

    test('CDN URL constructs correct page URL for reference', () => {
      const result = parseRackUrl('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
      expect(result.pageUrl).toBe('https://modulargrid.net/e/racks/view/1186947');
    });

    test('rack page URL constructs correct CDN URL automatically', () => {
      const result = parseRackUrl('https://modulargrid.net/e/racks/view/1186947');
      expect(result.cdnUrl).toBe('https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg');
    });
  });
});
