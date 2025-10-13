/**
 * URL Extraction & Validation Utilities
 * Detects ModularGrid URLs and identifies gibberish input for intelligent fallbacks
 */

import logger from '@/lib/logger';

/**
 * Regular expression for ModularGrid rack URLs
 * Matches: https://modulargrid.net/e/racks/view/123456
 */
const MODULARGRID_URL_REGEX = /https?:\/\/(?:www\.)?modulargrid\.net\/e\/racks\/view\/\d+/gi;

/**
 * Extract ModularGrid URL from text
 * Searches for ModularGrid rack URLs in any position of the text
 *
 * @param text - Text to search for URLs
 * @returns First found ModularGrid URL or null if none found
 *
 * @example
 * extractModularGridUrl("Check out my rack: https://modulargrid.net/e/racks/view/2383104")
 * // Returns: "https://modulargrid.net/e/racks/view/2383104"
 */
export function extractModularGridUrl(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const matches = text.match(MODULARGRID_URL_REGEX);

  if (matches && matches.length > 0) {
    const url = matches[0];
    logger.debug('🔍 Extracted ModularGrid URL', { url, originalText: text });
    return url;
  }

  return null;
}

/**
 * Validate if a URL is a valid ModularGrid rack URL
 *
 * @param url - URL to validate
 * @returns True if valid ModularGrid rack URL
 *
 * @example
 * isValidModularGridUrl("https://modulargrid.net/e/racks/view/2383104") // true
 * isValidModularGridUrl("https://google.com") // false
 */
export function isValidModularGridUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Create a new regex without global flag for validation (avoids stateful behavior)
  const validationRegex = /https?:\/\/(?:www\.)?modulargrid\.net\/e\/racks\/view\/\d+/i;
  return validationRegex.test(url);
}

/**
 * Gibberish detection heuristics
 * Identifies keyboard mashing, random input, or nonsense text
 *
 * @param text - Text to analyze
 * @returns True if text appears to be gibberish
 *
 * @example
 * isLikelyGibberish("DLXJFLDJLD") // true
 * isLikelyGibberish("create an ambient patch") // false
 */
export function isLikelyGibberish(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return true; // Empty input is gibberish
  }

  const trimmed = text.trim();

  // Too short (less than 3 characters)
  if (trimmed.length < 3) {
    logger.debug('🔍 Gibberish detected: too short', { text: trimmed });
    return true;
  }

  // All uppercase with 8+ characters (keyboard mashing)
  if (/^[A-Z]{8,}$/.test(trimmed)) {
    logger.debug('🔍 Gibberish detected: all caps keyboard mashing', { text: trimmed });
    return true;
  }

  // Random consonants without vowels (8+ chars)
  const consonantOnly = /^[BCDFGHJKLMNPQRSTVWXYZ]{8,}$/i.test(trimmed);
  if (consonantOnly) {
    logger.debug('🔍 Gibberish detected: consonants only', { text: trimmed });
    return true;
  }

  // Repeating characters (same character 5+ times)
  if (/(.)\1{4,}/.test(trimmed)) {
    logger.debug('🔍 Gibberish detected: repeating characters', { text: trimmed });
    return true;
  }

  // Known keyboard patterns
  const keyboardPatterns = [/qwerty/i, /asdfgh/i, /zxcvbn/i, /123456/, /qazwsx/i, /poiuyt/i];

  for (const pattern of keyboardPatterns) {
    if (pattern.test(trimmed)) {
      logger.debug('🔍 Gibberish detected: keyboard pattern', { text: trimmed, pattern });
      return true;
    }
  }

  // Very low vowel ratio (< 10% vowels in 10+ char strings)
  if (trimmed.length >= 10) {
    const vowelCount = (trimmed.match(/[aeiou]/gi) || []).length;
    const vowelRatio = vowelCount / trimmed.length;

    if (vowelRatio < 0.1) {
      logger.debug('🔍 Gibberish detected: low vowel ratio', {
        text: trimmed,
        vowelRatio,
      });
      return true;
    }
  }

  // No spaces and mixed case randomly (likely keyboard mashing)
  if (trimmed.length >= 15 && !trimmed.includes(' ')) {
    const hasUpperCase = /[A-Z]/.test(trimmed);
    const hasLowerCase = /[a-z]/.test(trimmed);
    const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
    const lowerCount = (trimmed.match(/[a-z]/g) || []).length;

    // Random mix of cases (not all lowercase or all uppercase)
    if (hasUpperCase && hasLowerCase && upperCount > 3 && lowerCount > 3) {
      const caseChanges = trimmed.split('').filter((char, i) => {
        if (i === 0) return false;
        const prev = trimmed[i - 1];
        const prevIsUpper = /[A-Z]/.test(prev);
        const currIsUpper = /[A-Z]/.test(char);
        return prevIsUpper !== currIsUpper;
      }).length;

      // Too many case changes suggests mashing
      if (caseChanges > 5) {
        logger.debug('🔍 Gibberish detected: random case mixing', {
          text: trimmed,
          caseChanges,
        });
        return true;
      }
    }
  }

  logger.debug('✅ Text appears valid (not gibberish)', { text: trimmed });
  return false;
}

/**
 * Analyze text for chat routing
 * Determines if text contains URL, is gibberish, or is conversational
 *
 * @param text - User input text
 * @returns Analysis result with routing hints
 *
 * @example
 * analyzeUserInput("https://modulargrid.net/e/racks/view/123")
 * // { hasUrl: true, url: "...", isGibberish: false, isConversational: false }
 *
 * analyzeUserInput("DLXJFLDJLD")
 * // { hasUrl: false, url: null, isGibberish: true, isConversational: false }
 *
 * analyzeUserInput("create an ambient patch")
 * // { hasUrl: false, url: null, isGibberish: false, isConversational: true }
 */
export interface TextAnalysis {
  hasUrl: boolean;
  url: string | null;
  isGibberish: boolean;
  isConversational: boolean;
  originalText: string;
}

export function analyzeUserInput(text: string): TextAnalysis {
  const url = extractModularGridUrl(text);
  const hasUrl = url !== null;
  const isGibberish = !hasUrl && isLikelyGibberish(text);
  const isConversational = !hasUrl && !isGibberish;

  const analysis: TextAnalysis = {
    hasUrl,
    url,
    isGibberish,
    isConversational,
    originalText: text,
  };

  logger.debug('🔍 Text analysis complete', analysis);

  return analysis;
}

/**
 * Extract rack ID from ModularGrid URL
 *
 * @param url - ModularGrid URL
 * @returns Rack ID or null if not found
 *
 * @example
 * extractRackId("https://modulargrid.net/e/racks/view/2383104") // "2383104"
 */
export function extractRackId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(/\/view\/(\d+)/);
  return match ? match[1] : null;
}
