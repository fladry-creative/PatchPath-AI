/**
 * Tests for lib/logger.ts
 * Note: Logger is mocked in jest.setup.js to avoid console spam
 */

import { describe, it, expect } from '@jest/globals';
import logger, {
  logAIRequest,
  logAIResponse,
  logDatabaseOperation,
  logCacheHit,
  logCacheMiss,
  logError,
} from '@/lib/logger';

describe('lib/logger', () => {
  describe('logger instance', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should have proper log methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('logAIRequest', () => {
    it('should not throw with valid inputs', () => {
      expect(() => {
        logAIRequest('claude-sonnet-4-5', 'generatePatch', {
          userIntent: 'test patch',
        });
      }).not.toThrow();
    });

    it('should handle missing metadata', () => {
      expect(() => {
        logAIRequest('claude-sonnet-4-5', 'generatePatch');
      }).not.toThrow();
    });
  });

  describe('logAIResponse', () => {
    it('should not throw with valid inputs', () => {
      expect(() => {
        logAIResponse('claude-sonnet-4-5', 'generatePatch', 1500, {
          responseLength: 1000,
        });
      }).not.toThrow();
    });
  });

  describe('logDatabaseOperation', () => {
    it('should not throw with valid inputs', () => {
      expect(() => {
        logDatabaseOperation('query', 'modules', { itemCount: 5 });
      }).not.toThrow();
    });

    it('should handle missing metadata', () => {
      expect(() => {
        logDatabaseOperation('insert', 'racks');
      }).not.toThrow();
    });
  });

  describe('logCacheHit', () => {
    it('should not throw with valid inputs', () => {
      expect(() => {
        logCacheHit('module-plaits', { source: 'cosmos' });
      }).not.toThrow();
    });
  });

  describe('logCacheMiss', () => {
    it('should not throw with valid inputs', () => {
      expect(() => {
        logCacheMiss('module-unknown', { source: 'cosmos' });
      }).not.toThrow();
    });
  });

  describe('logError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');

      expect(() => {
        logError(error, 'test context');
      }).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      expect(() => {
        logError('string error', 'test context');
      }).not.toThrow();
    });

    it('should handle missing context', () => {
      const error = new Error('Test');

      expect(() => {
        logError(error);
      }).not.toThrow();
    });
  });

  describe('metadata handling', () => {
    it('should handle complex metadata objects', () => {
      expect(() => {
        logAIRequest('model', 'operation', {
          nested: {
            object: {
              with: 'data',
            },
          },
          array: [1, 2, 3],
          number: 42,
          boolean: true,
        });
      }).not.toThrow();
    });

    it('should handle null metadata', () => {
      expect(() => {
        logAIRequest('model', 'operation', null as unknown as Record<string, unknown>);
      }).not.toThrow();
    });
  });
});
