# Observability Guide

**Framework**: Custom Metrics + Winston Logging
**Future**: Datadog, Prometheus, or New Relic
**Date**: 2025-10-11

## Overview

PatchPath AI uses a lightweight observability framework that can be extended to integrate with enterprise monitoring platforms when needed.

**Current Stack:**

- **Logging**: Winston (structured logs)
- **Metrics**: Custom metrics collector (extensible)
- **Future**: Datadog, Prometheus, or New Relic integration

## Metrics Collection

### Quick Start

```typescript
import {
  recordAIRequestDuration,
  recordCacheHit,
  recordCacheMiss,
} from '@/lib/observability/metrics';

// Record AI request timing
const start = Date.now();
const result = await aiClient.analyze(image);
recordAIRequestDuration('claude-sonnet-4-5', 'vision-analysis', Date.now() - start);

// Record cache performance
if (cached) {
  recordCacheHit(moduleId, 'cosmos');
} else {
  recordCacheMiss(moduleId, 'cosmos');
}
```

### Available Metrics

#### AI Operations

```typescript
import {
  recordAIRequestDuration,
  recordAITokenUsage,
  recordAICost,
} from '@/lib/observability/metrics';

// Request duration
recordAIRequestDuration('claude-sonnet-4-5', 'vision-analysis', 1250);

// Token usage
recordAITokenUsage('claude-sonnet-4-5', 1500, 800, 2300);

// Cost tracking
const cost = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;
recordAICost('claude-sonnet-4-5', cost);
```

#### Database Operations

```typescript
import { recordDatabaseQuery } from '@/lib/observability/metrics';

const start = Date.now();
const result = await container.items.query(query).fetchAll();
recordDatabaseQuery('query', Date.now() - start, 'modules');
```

#### Cache Performance

```typescript
import { recordCacheHit, recordCacheMiss, recordCacheHitRate } from '@/lib/observability/metrics';

// Individual operations
recordCacheHit(moduleId, 'cosmos');
recordCacheMiss(moduleId, 'cosmos');

// Aggregate metrics
const hitRate = (hits / (hits + misses)) * 100;
recordCacheHitRate(hitRate, 'cosmos');
```

#### API Endpoints

```typescript
import { recordAPIRequest, recordAPIError } from '@/lib/observability/metrics';

// Request timing
const start = Date.now();
const response = await handleRequest(request);
recordAPIRequest('/api/analyze', 'POST', Date.now() - start);

// Error tracking
if (response.status >= 400) {
  recordAPIError('/api/analyze', 'POST', response.status);
}
```

#### File Uploads

```typescript
import { recordUploadSize } from '@/lib/observability/metrics';

const imageBuffer = await request.arrayBuffer();
recordUploadSize(imageBuffer.byteLength);
```

## Custom Metrics

### Recording Custom Metrics

```typescript
import metrics from '@/lib/observability/metrics';

// Timing metric
metrics.recordTiming('custom.operation', 500, {
  userId: 'user_123',
  feature: 'patch-generation',
});

// Count metric
metrics.recordCount('custom.events', 1, {
  eventType: 'module_favorited',
});

// Size metric (bytes)
metrics.recordSize('custom.data', 1024 * 1024, {
  dataType: 'rack_image',
});

// Percentage metric
metrics.recordPercent('custom.score', 95.5, {
  scoreType: 'confidence',
});
```

## Querying Metrics

### Get Metrics Data

```typescript
import metrics from '@/lib/observability/metrics';

// Get all metrics
const allMetrics = metrics.getMetrics();

// Get specific metric
const aiTimings = metrics.getMetricsByName('ai.request.duration');

// Get average
const avgDuration = metrics.getAverage('ai.request.duration');
console.log(`Average AI request duration: ${avgDuration}ms`);

// Get 95th percentile
const p95 = metrics.getP95('ai.request.duration');
console.log(`P95 AI request duration: ${p95}ms`);
```

### Export Metrics

```typescript
// Export as JSON
const json = metrics.export();
console.log(json);

// Clear metrics
metrics.clear();
```

## Monitoring Dashboard (Future)

### Datadog Integration

```typescript
// lib/observability/datadog.ts (future implementation)
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD({
  apiKey: process.env.DATADOG_API_KEY,
  appKey: process.env.DATADOG_APP_KEY,
});

export function sendToDatadog(metric: Metric) {
  dogstatsd.gauge(metric.name, metric.value, metric.tags);
}
```

### Prometheus Integration

```typescript
// lib/observability/prometheus.ts (future implementation)
import { register, Histogram, Counter, Gauge } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
});

export function recordPrometheusMetric(duration: number, labels: Record<string, string>) {
  httpRequestDuration.observe(labels, duration);
}
```

## Key Metrics to Track

### AI Performance

| Metric                    | Target        | Alert Threshold |
| ------------------------- | ------------- | --------------- |
| AI request duration (P95) | < 3000ms      | > 5000ms        |
| AI token usage (avg)      | < 5000 tokens | > 10000 tokens  |
| AI cost per request       | < $0.05       | > $0.10         |
| AI error rate             | < 1%          | > 5%            |

### Cache Performance

| Metric          | Target | Alert Threshold |
| --------------- | ------ | --------------- |
| Cache hit rate  | > 90%  | < 70%           |
| Cache miss rate | < 10%  | > 30%           |
| Cache latency   | < 50ms | > 200ms         |

### API Performance

| Metric                  | Target   | Alert Threshold |
| ----------------------- | -------- | --------------- |
| API response time (P95) | < 1000ms | > 3000ms        |
| API error rate          | < 1%     | > 5%            |
| API throughput (req/s)  | > 10     | < 5             |

### Database Performance

| Metric                | Target  | Alert Threshold |
| --------------------- | ------- | --------------- |
| Query duration (P95)  | < 100ms | > 500ms         |
| Write latency (P95)   | < 200ms | > 1000ms        |
| Connection pool usage | < 80%   | > 95%           |

## Logging Integration

Metrics work alongside Winston logging for complete observability:

```typescript
import logger from '@/lib/logger';
import { recordAPIRequest } from '@/lib/observability/metrics';

export async function handleRequest(request: Request) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  logger.http('API Request Started', {
    requestId,
    path: request.url,
  });

  try {
    const result = await processRequest(request);
    const duration = Date.now() - start;

    // Log completion
    logger.http('API Request Completed', {
      requestId,
      duration,
      status: 200,
    });

    // Record metric
    recordAPIRequest(request.url, request.method, duration);

    return result;
  } catch (error) {
    logger.error('API Request Failed', {
      requestId,
      error: error.message,
      duration: Date.now() - start,
    });

    recordAPIError(request.url, request.method, 500);
    throw error;
  }
}
```

## Alerting Strategy

### Critical Alerts (Immediate Response)

- AI error rate > 5%
- Database unavailable
- API error rate > 5%
- Cache unavailable

### Warning Alerts (Review Within 1 Hour)

- AI request duration P95 > 5 seconds
- Cache hit rate < 70%
- API response time P95 > 3 seconds
- Database query time P95 > 500ms

### Info Alerts (Review Daily)

- AI cost per request > $0.10
- Upload size trending up
- Slow query patterns

## Monitoring Platforms Comparison

### Datadog (Recommended for Production)

**Pros:**

- AI-powered anomaly detection
- 51.82% market share
- Excellent dashboards
- APM + Logs + Metrics unified

**Cons:**

- Expensive ($15-31/host/month)
- Overkill for MVP

**Setup:**

```typescript
import { datadogLogs } from '@datadog/browser-logs';

datadogLogs.init({
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'patchpath-ai',
  env: process.env.NODE_ENV,
});
```

### Prometheus + Grafana (Open Source)

**Pros:**

- Free and open source
- Powerful query language (PromQL)
- Great for infrastructure metrics

**Cons:**

- Requires self-hosting
- More setup complexity
- No built-in AI/ML insights

**Setup:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'patchpath'
    static_configs:
      - targets: ['localhost:3000']
```

### New Relic

**Pros:**

- Good APM features
- Easy setup
- Free tier available

**Cons:**

- Less popular than Datadog
- Limited free tier

### Recommendation for PatchPath AI

**MVP Phase (Now):**

- ✅ Custom metrics collector (already implemented)
- ✅ Winston logging (already implemented)
- ✅ Manual monitoring via logs

**Beta Phase:**

- Add Datadog trial or Prometheus
- Set up basic dashboards
- Configure alerts

**Production Phase:**

- Full Datadog integration
- Comprehensive dashboards
- Advanced alerting
- APM tracing

## Implementation Roadmap

### Phase 1: MVP (Current) ✅

- [x] Custom metrics collector
- [x] Winston structured logging
- [x] Development console output

### Phase 2: Beta (Next 2-4 Weeks)

- [ ] Datadog trial or Prometheus setup
- [ ] Basic dashboard (AI costs, cache hit rate, API latency)
- [ ] Error rate alerts
- [ ] Performance monitoring

### Phase 3: Production (Launch)

- [ ] Full Datadog integration
- [ ] Comprehensive dashboards
- [ ] Advanced alerting (PagerDuty integration)
- [ ] APM distributed tracing
- [ ] Cost optimization alerts

## API Endpoint for Metrics

Create a metrics endpoint for health checks:

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import metrics from '@/lib/observability/metrics';

export async function GET() {
  const data = {
    metrics: {
      ai: {
        avgDuration: metrics.getAverage('ai.request.duration'),
        p95Duration: metrics.getP95('ai.request.duration'),
      },
      cache: {
        avgHitRate: metrics.getAverage('cache.hit_rate'),
      },
      api: {
        avgDuration: metrics.getAverage('api.request.duration'),
        p95Duration: metrics.getP95('api.request.duration'),
      },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(data);
}
```

Access at: `http://localhost:3000/api/metrics`

---

**Last Updated**: 2025-10-11
**Status**: Observability framework ready for extension to Datadog/Prometheus
