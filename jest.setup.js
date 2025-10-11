// Jest setup file for configuring test environment
// Polyfill text encoding APIs
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill ReadableStream
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

// Polyfill fetch APIs before anything else
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers, FormData, fetch } = require('undici');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
  global.FormData = FormData;
  global.fetch = fetch;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom');

if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    append(key, value, filename) {
      this.data.set(key, filename ? { value, filename } : value);
    }
    get(key) {
      return this.data.get(key);
    }
    has(key) {
      return this.data.has(key);
    }
  };
}

if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts || [];
      this.type = options?.type || '';
      this.size = parts ? parts.reduce((acc, part) => acc + (part.length || 0), 0) : 0;
    }
  };
}

if (typeof global.File === 'undefined') {
  global.File = class File extends global.Blob {
    constructor(parts, name, options) {
      super(parts, options);
      this.name = name;
      this.lastModified = Date.now();
    }
  };
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock logger to avoid console spam in tests (but keep functionality)
jest.mock('@/lib/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
    logAIRequest: jest.fn(),
    logAIResponse: jest.fn(),
    logDatabaseOperation: jest.fn(),
    logCacheHit: jest.fn(),
    logCacheMiss: jest.fn(),
    logError: jest.fn(),
  };
});

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
