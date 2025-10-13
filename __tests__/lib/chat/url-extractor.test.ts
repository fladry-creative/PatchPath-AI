/**
 * Unit tests for URL extraction and gibberish detection
 */

import {
  extractModularGridUrl,
  isValidModularGridUrl,
  isLikelyGibberish,
  analyzeUserInput,
  extractRackId,
} from '@/lib/chat/url-extractor';

describe('URL Extraction', () => {
  describe('extractModularGridUrl', () => {
    it('should extract URL from beginning of text', () => {
      const text = 'https://modulargrid.net/e/racks/view/2383104 is my rack';
      const url = extractModularGridUrl(text);
      expect(url).toBe('https://modulargrid.net/e/racks/view/2383104');
    });

    it('should extract URL from middle of text', () => {
      const text = 'Check out my rack: https://modulargrid.net/e/racks/view/2383104 amazing!';
      const url = extractModularGridUrl(text);
      expect(url).toBe('https://modulargrid.net/e/racks/view/2383104');
    });

    it('should extract URL from end of text', () => {
      const text = 'My modular setup: https://modulargrid.net/e/racks/view/2383104';
      const url = extractModularGridUrl(text);
      expect(url).toBe('https://modulargrid.net/e/racks/view/2383104');
    });

    it('should extract URL with www prefix', () => {
      const text = 'https://www.modulargrid.net/e/racks/view/2383104';
      const url = extractModularGridUrl(text);
      expect(url).toBe('https://www.modulargrid.net/e/racks/view/2383104');
    });

    it('should extract http URL (not https)', () => {
      const text = 'http://modulargrid.net/e/racks/view/2383104';
      const url = extractModularGridUrl(text);
      expect(url).toBe('http://modulargrid.net/e/racks/view/2383104');
    });

    it('should return first URL when multiple URLs present', () => {
      const text =
        'https://modulargrid.net/e/racks/view/111 and https://modulargrid.net/e/racks/view/222';
      const url = extractModularGridUrl(text);
      expect(url).toBe('https://modulargrid.net/e/racks/view/111');
    });

    it('should return null for non-ModularGrid URLs', () => {
      const text = 'Check out https://google.com';
      const url = extractModularGridUrl(text);
      expect(url).toBeNull();
    });

    it('should return null for empty string', () => {
      const url = extractModularGridUrl('');
      expect(url).toBeNull();
    });

    it('should return null for text without URLs', () => {
      const text = 'Just some normal text about modular synths';
      const url = extractModularGridUrl(text);
      expect(url).toBeNull();
    });

    it('should handle malformed ModularGrid URLs', () => {
      const text = 'https://modulargrid.net/wrong/path/123';
      const url = extractModularGridUrl(text);
      expect(url).toBeNull();
    });
  });

  describe('isValidModularGridUrl', () => {
    it('should validate correct ModularGrid URLs', () => {
      expect(isValidModularGridUrl('https://modulargrid.net/e/racks/view/2383104')).toBe(true);
      expect(isValidModularGridUrl('http://modulargrid.net/e/racks/view/123456')).toBe(true);
      expect(isValidModularGridUrl('https://www.modulargrid.net/e/racks/view/789')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidModularGridUrl('https://google.com')).toBe(false);
      expect(isValidModularGridUrl('https://modulargrid.net')).toBe(false);
      expect(isValidModularGridUrl('https://modulargrid.net/wrong/path')).toBe(false);
      expect(isValidModularGridUrl('not a url')).toBe(false);
      expect(isValidModularGridUrl('')).toBe(false);
    });
  });

  describe('extractRackId', () => {
    it('should extract rack ID from URL', () => {
      const url = 'https://modulargrid.net/e/racks/view/2383104';
      expect(extractRackId(url)).toBe('2383104');
    });

    it('should extract different rack IDs', () => {
      expect(extractRackId('https://modulargrid.net/e/racks/view/123')).toBe('123');
      expect(extractRackId('https://modulargrid.net/e/racks/view/999999')).toBe('999999');
    });

    it('should return null for invalid URLs', () => {
      expect(extractRackId('https://google.com')).toBeNull();
      expect(extractRackId('not a url')).toBeNull();
      expect(extractRackId('')).toBeNull();
    });
  });
});

describe('Gibberish Detection', () => {
  describe('isLikelyGibberish', () => {
    it('should detect keyboard mashing (all caps)', () => {
      expect(isLikelyGibberish('DLXJFLDJLD')).toBe(true);
      expect(isLikelyGibberish('QWERTYUIOP')).toBe(true);
      expect(isLikelyGibberish('ASDFGHJKL')).toBe(true);
    });

    it('should detect very short input', () => {
      expect(isLikelyGibberish('ab')).toBe(true);
      expect(isLikelyGibberish('x')).toBe(true);
      expect(isLikelyGibberish('')).toBe(true);
    });

    it('should detect consonant-only strings', () => {
      expect(isLikelyGibberish('BCDFGHJK')).toBe(true);
      expect(isLikelyGibberish('qwrtpsdfg')).toBe(true);
    });

    it('should detect repeating characters', () => {
      expect(isLikelyGibberish('aaaaaaaa')).toBe(true);
      expect(isLikelyGibberish('llllllll')).toBe(true);
      expect(isLikelyGibberish('1111111')).toBe(true);
    });

    it('should detect keyboard patterns', () => {
      expect(isLikelyGibberish('qwertyasdfgh')).toBe(true);
      expect(isLikelyGibberish('asdfghjkl')).toBe(true);
      expect(isLikelyGibberish('zxcvbnm')).toBe(true);
      expect(isLikelyGibberish('123456789')).toBe(true);
    });

    it('should detect low vowel ratio', () => {
      expect(isLikelyGibberish('bcdfghjklmnpqrst')).toBe(true);
    });

    it('should detect random case mixing', () => {
      expect(isLikelyGibberish('RaNdOmCaSeMiXiNgWiThNoSpAcEs')).toBe(true);
    });

    it('should NOT flag normal conversational text', () => {
      expect(isLikelyGibberish('create an ambient patch')).toBe(false);
      expect(isLikelyGibberish('I want something dark and moody')).toBe(false);
      expect(isLikelyGibberish('make a techno bassline')).toBe(false);
      expect(isLikelyGibberish('can you generate a drone sound')).toBe(false);
    });

    it('should NOT flag short but valid words', () => {
      // Note: 3+ chars required, so "ok" would be gibberish but "yes" is not
      expect(isLikelyGibberish('yes')).toBe(false);
      expect(isLikelyGibberish('help')).toBe(false);
      expect(isLikelyGibberish('random')).toBe(false);
    });

    it('should NOT flag technical terms', () => {
      expect(isLikelyGibberish('VCO')).toBe(false);
      expect(isLikelyGibberish('FM synthesis')).toBe(false);
      expect(isLikelyGibberish('waveshaping')).toBe(false);
    });
  });
});

describe('Text Analysis', () => {
  describe('analyzeUserInput', () => {
    it('should identify URL-containing text', () => {
      const text = 'My rack: https://modulargrid.net/e/racks/view/2383104';
      const analysis = analyzeUserInput(text);

      expect(analysis.hasUrl).toBe(true);
      expect(analysis.url).toBe('https://modulargrid.net/e/racks/view/2383104');
      expect(analysis.isGibberish).toBe(false);
      expect(analysis.isConversational).toBe(false);
    });

    it('should identify gibberish text', () => {
      const text = 'DLXJFLDJLD';
      const analysis = analyzeUserInput(text);

      expect(analysis.hasUrl).toBe(false);
      expect(analysis.url).toBeNull();
      expect(analysis.isGibberish).toBe(true);
      expect(analysis.isConversational).toBe(false);
    });

    it('should identify conversational text', () => {
      const text = 'create an ambient patch with reverb';
      const analysis = analyzeUserInput(text);

      expect(analysis.hasUrl).toBe(false);
      expect(analysis.url).toBeNull();
      expect(analysis.isGibberish).toBe(false);
      expect(analysis.isConversational).toBe(true);
    });

    it('should include original text in analysis', () => {
      const text = 'test input';
      const analysis = analyzeUserInput(text);

      expect(analysis.originalText).toBe(text);
    });

    it('should handle empty strings', () => {
      const analysis = analyzeUserInput('');

      expect(analysis.hasUrl).toBe(false);
      expect(analysis.url).toBeNull();
      expect(analysis.isGibberish).toBe(true); // Empty is gibberish
      expect(analysis.isConversational).toBe(false);
    });

    it('should prioritize URL detection over gibberish', () => {
      // Even if text looks weird, URL is extracted
      const text = 'AJLKFDJLKFD https://modulargrid.net/e/racks/view/123 LKJLKJDF';
      const analysis = analyzeUserInput(text);

      expect(analysis.hasUrl).toBe(true);
      expect(analysis.url).toBe('https://modulargrid.net/e/racks/view/123');
      expect(analysis.isGibberish).toBe(false); // URL takes precedence
    });
  });
});
