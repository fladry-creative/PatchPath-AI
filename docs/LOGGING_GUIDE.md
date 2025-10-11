# Logging Guide

**Library**: Winston
**Date**: 2025-10-11

## Overview

PatchPath AI uses [Winston](https://github.com/winstonjs/winston) for structured logging with support for multiple transports, log levels, and beautiful colored console output.

## Quick Start

```typescript
import logger, { logAIRequest, logAIResponse, logError } from '@/lib/logger';

// Basic logging
logger.info('Server started');
logger.warn('Rate limit approaching');
logger.error('Database connection failed');

// AI operation logging
logAIRequest('claude-sonnet-4-5', 'vision-analysis', { imageSize: '2MB' });
const start = Date.now();
// ... AI operation ...
logAIResponse('claude-sonnet-4-5', 'vision-analysis', Date.now() - start, {
  modulesFound: 26,
});

// Error logging with context
try {
  await riskyOperation();
} catch (error) {
  logError(error, 'riskyOperation');
}
```

## Log Levels

Winston supports multiple log levels (in order of priority):

| Level   | Priority | Usage                                      |
| ------- | -------- | ------------------------------------------ |
| `error` | 0        | Errors that require immediate attention    |
| `warn`  | 1        | Warning conditions that should be reviewed |
| `info`  | 2        | General informational messages             |
| `http`  | 3        | HTTP request/response logs                 |
| `debug` | 4        | Detailed debug information                 |

### Environment-Based Levels

- **Development**: `debug` (all logs)
- **Production**: `info` (excludes debug logs)
- **Custom**: Set `LOG_LEVEL` environment variable

```bash
# .env.local
LOG_LEVEL=debug  # Options: error, warn, info, http, debug
```

## Log Transports

### Development (Console Only)

- Colored output for easy reading
- All logs to console
- No file logging

### Production (Console + Files)

- Console output (for container logs)
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Uncolorized for file storage

## Helper Functions

### AI Operations

```typescript
import { logAIRequest, logAIResponse } from '@/lib/logger';

// Before AI call
logAIRequest('claude-sonnet-4-5', 'module-enrichment', {
  moduleCount: 10,
  cacheEnabled: true,
});

// After AI call
const start = Date.now();
const result = await enrichModule(data);
logAIResponse('claude-sonnet-4-5', 'module-enrichment', Date.now() - start, {
  tokensUsed: result.usage.total_tokens,
  cost: calculateCost(result.usage),
});
```

### Database Operations

```typescript
import { logDatabaseOperation } from '@/lib/logger';

logDatabaseOperation('query', 'modules', {
  filter: { manufacturer: 'Make Noise' },
  count: 15,
});

logDatabaseOperation('insert', 'modules', {
  id: 'make-noise_maths',
  cached: true,
});
```

### Caching

```typescript
import { logCacheHit, logCacheMiss } from '@/lib/logger';

const cached = await getFromCache(moduleId);
if (cached) {
  logCacheHit(moduleId, { source: 'cosmos' });
} else {
  logCacheMiss(moduleId, { willFetch: true });
}
```

### Error Handling

```typescript
import { logError } from '@/lib/logger';

try {
  await complexOperation();
} catch (error) {
  logError(error, 'complexOperation');
  throw error; // Re-throw after logging
}

// Error with additional context
try {
  await processModule(moduleData);
} catch (error) {
  logError(error, `processModule:${moduleData.id}`);
}
```

## Custom Logging

### Basic Logger

```typescript
import logger from '@/lib/logger';

logger.info('Custom message', { key: 'value', count: 42 });
logger.warn('Something unusual', { userId: '123', action: 'upload' });
logger.error('Critical error', { stack: error.stack });
```

### With Metadata

```typescript
logger.info('User action', {
  userId: 'user_123',
  action: 'upload',
  fileName: 'rack.jpg',
  fileSize: '2.5MB',
  timestamp: new Date().toISOString(),
});
```

## Log Format

### Console (Development)

Colored output with timestamp:

```
2025-10-11 02:15:30:123 [info]: AI Request {
  "model": "claude-sonnet-4-5",
  "operation": "vision-analysis",
  "imageSize": "2MB"
}
```

### File (Production)

Uncolorized structured format:

```
2025-10-11 02:15:30:123 [info]: AI Request {"model":"claude-sonnet-4-5","operation":"vision-analysis","imageSize":"2MB"}
```

## Integration Examples

### API Route Logging

```typescript
// app/api/analyze/route.ts
import logger, { logAIRequest, logAIResponse, logError } from '@/lib/logger';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  logger.http('API Request', {
    requestId,
    path: '/api/analyze',
    method: 'POST',
  });

  try {
    const start = Date.now();
    logAIRequest('claude-sonnet-4-5', 'vision-analysis', { requestId });

    const result = await analyzeRackImage(imageBuffer);

    logAIResponse('claude-sonnet-4-5', 'vision-analysis', Date.now() - start, {
      requestId,
      modulesFound: result.modules.length,
    });

    logger.http('API Response', {
      requestId,
      status: 200,
      duration: `${Date.now() - start}ms`,
    });

    return Response.json(result);
  } catch (error) {
    logError(error, `API:/api/analyze:${requestId}`);
    return Response.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

### Database Service Logging

```typescript
// lib/database/module-service.ts
import { logDatabaseOperation, logCacheHit, logCacheMiss } from '@/lib/logger';

export async function getModuleFromCache(moduleId: string) {
  logDatabaseOperation('read', 'modules', { moduleId });

  const { resource } = await container.item(moduleId, moduleId).read();

  if (resource) {
    logCacheHit(moduleId, { lastUpdated: resource.lastUpdated });
    return resource;
  }

  logCacheMiss(moduleId);
  return null;
}

export async function saveModuleToCache(moduleData: ModuleData) {
  logDatabaseOperation('upsert', 'modules', {
    id: moduleData.id,
    manufacturer: moduleData.manufacturer,
    name: moduleData.name,
  });

  const { resource } = await container.items.upsert(moduleData);
  return resource;
}
```

### Module Enrichment Logging

```typescript
// lib/modules/enrichment.ts
import { logAIRequest, logAIResponse, logCacheHit, logCacheMiss } from '@/lib/logger';

export async function enrichModule(moduleData: VisionModule) {
  const moduleId = generateModuleId(moduleData.name, moduleData.manufacturer);

  // Check cache
  const cached = await getModuleFromCache(moduleId);
  if (cached) {
    logCacheHit(moduleId, { source: 'cosmos', age: getAge(cached.lastUpdated) });
    return cached;
  }

  logCacheMiss(moduleId, { willScrape: true });

  // Scrape data
  const start = Date.now();
  logAIRequest('gemini-2.0-flash', 'module-scraping', {
    moduleId,
    manufacturer: moduleData.manufacturer,
  });

  const enrichedData = await scrapeModuleData(moduleData);

  logAIResponse('gemini-2.0-flash', 'module-scraping', Date.now() - start, {
    moduleId,
    fieldsEnriched: Object.keys(enrichedData).length,
  });

  return enrichedData;
}
```

## Observability Integration

Winston logs can be easily integrated with observability platforms:

### Datadog

```typescript
// lib/logger.ts
import { datadogTransport } from 'datadog-winston';

if (process.env.DATADOG_API_KEY) {
  transports.push(
    datadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'patchpath-ai',
      ddsource: 'nodejs',
      ddtags: `env:${process.env.NODE_ENV}`,
    })
  );
}
```

### Prometheus (Log Metrics)

```typescript
// lib/logger.ts
import { register, Counter } from 'prom-client';

const logCounter = new Counter({
  name: 'logs_total',
  help: 'Total number of logs by level',
  labelNames: ['level'],
});

// In logger format:
winston.format.printf((info) => {
  logCounter.inc({ level: info.level });
  // ... rest of format
});
```

## Best Practices

### 1. **Log Structured Data**

✅ **Good**: Structured metadata

```typescript
logger.info('Module enriched', {
  moduleId: 'make-noise_maths',
  duration: 1250,
  source: 'cache',
});
```

❌ **Bad**: String concatenation

```typescript
logger.info('Module make-noise_maths enriched in 1250ms from cache');
```

### 2. **Include Context**

✅ **Good**: Request ID for tracing

```typescript
const requestId = crypto.randomUUID();
logger.info('Processing started', { requestId, userId: user.id });
// ... later ...
logger.info('Processing completed', { requestId, duration: elapsed });
```

❌ **Bad**: No correlation

```typescript
logger.info('Processing started');
logger.info('Processing completed');
```

### 3. **Log Levels Appropriately**

✅ **Good**: Correct severity

```typescript
logger.debug('Cache lookup', { key }); // Debug info
logger.info('Module enriched', { id }); // Success info
logger.warn('Rate limit approaching', { current, limit }); // Warning
logger.error('Database connection failed', { error }); // Error
```

❌ **Bad**: Everything is info

```typescript
logger.info('Cache lookup');
logger.info('Database connection failed');
```

### 4. **Don't Log Secrets**

✅ **Good**: Redacted sensitive data

```typescript
logger.info('API request', {
  apiKey: '***REDACTED***',
  url: 'https://api.example.com',
});
```

❌ **Bad**: Exposing secrets

```typescript
logger.info('API request', {
  apiKey: 'sk-ant-1234567890',
  url: 'https://api.example.com',
});
```

### 5. **Log Errors with Stack Traces**

✅ **Good**: Full error context

```typescript
import { logError } from '@/lib/logger';

try {
  await operation();
} catch (error) {
  logError(error, 'operation'); // Includes stack trace
}
```

❌ **Bad**: Error message only

```typescript
logger.error('Operation failed: ' + error.message);
```

## Performance Considerations

### 1. **Avoid Excessive Debug Logging**

Use debug logs liberally in development, but ensure `LOG_LEVEL=info` in production to reduce overhead.

### 2. **Don't Log in Tight Loops**

❌ **Bad**: Logging every iteration

```typescript
for (const module of modules) {
  logger.debug('Processing module', { id: module.id }); // 1000s of logs
  await process(module);
}
```

✅ **Good**: Log summary

```typescript
logger.debug('Processing modules', { count: modules.length });
for (const module of modules) {
  await process(module);
}
logger.info('Modules processed', { count: modules.length, duration: elapsed });
```

### 3. **Use Sampling for High-Volume Logs**

```typescript
// Log 1% of cache hits for monitoring
if (Math.random() < 0.01) {
  logCacheHit(moduleId);
}
```

## Troubleshooting

### No Logs Appearing

1. Check log level: `LOG_LEVEL=debug npm run dev`
2. Verify logger is imported: `import logger from '@/lib/logger'`
3. Check console for errors

### File Logs Not Created (Production)

1. Ensure `logs/` directory exists: `mkdir -p logs`
2. Check write permissions: `chmod 755 logs`
3. Verify `NODE_ENV=production`

### Too Many Logs

1. Increase log level: `LOG_LEVEL=info` or `LOG_LEVEL=warn`
2. Add sampling for high-volume operations
3. Review and remove unnecessary debug logs

---

**Last Updated**: 2025-10-11
**Status**: Production-ready structured logging with Winston
