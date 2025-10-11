/**
 * Tests for lib/observability/metrics.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import metrics, {
  recordAIRequestDuration,
  recordAITokenUsage,
  recordAICost,
  recordDatabaseQuery,
  recordCacheHit,
  recordCacheMiss,
  recordCacheHitRate,
  recordAPIRequest,
  recordAPIError,
  recordUploadSize,
  recordModuleEnrichment,
} from '@/lib/observability/metrics';

describe('lib/observability/metrics', () => {
  beforeEach(() => {
    // Clear metrics before each test
    metrics.clear();
  });

  describe('MetricsCollector', () => {
    it('should record metrics', () => {
      metrics.record('test.metric', 100, 'ms', { tag1: 'value1' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('test.metric');
      expect(allMetrics[0].value).toBe(100);
      expect(allMetrics[0].unit).toBe('ms');
      expect(allMetrics[0].tags).toEqual({ tag1: 'value1' });
    });

    it('should record timing metrics', () => {
      metrics.recordTiming('test.timing', 500, { operation: 'test' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].unit).toBe('ms');
      expect(allMetrics[0].value).toBe(500);
    });

    it('should record count metrics', () => {
      metrics.recordCount('test.count', 42, { type: 'test' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].unit).toBe('count');
      expect(allMetrics[0].value).toBe(42);
    });

    it('should record percent metrics', () => {
      metrics.recordPercent('test.percent', 75.5, { metric: 'test' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].unit).toBe('percent');
      expect(allMetrics[0].value).toBe(75.5);
    });

    it('should record size metrics', () => {
      metrics.recordSize('test.size', 1024, { file: 'test.jpg' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].unit).toBe('bytes');
      expect(allMetrics[0].value).toBe(1024);
    });

    it('should limit metrics to MAX_METRICS', () => {
      // Record 1100 metrics (exceeds MAX of 1000)
      for (let i = 0; i < 1100; i++) {
        metrics.record(`test.metric.${i}`, i, 'count');
      }

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1000);
    });

    it('should get metrics by name', () => {
      metrics.record('test.metric.a', 100, 'ms');
      metrics.record('test.metric.b', 200, 'ms');
      metrics.record('test.metric.a', 150, 'ms');

      const metricsA = metrics.getMetricsByName('test.metric.a');
      expect(metricsA.length).toBe(2);
      expect(metricsA[0].value).toBe(100);
      expect(metricsA[1].value).toBe(150);
    });

    it('should calculate average', () => {
      metrics.record('test.avg', 100, 'ms');
      metrics.record('test.avg', 200, 'ms');
      metrics.record('test.avg', 300, 'ms');

      const avg = metrics.getAverage('test.avg');
      expect(avg).toBe(200);
    });

    it('should calculate p95', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.record('test.p95', i, 'ms');
      }

      const p95 = metrics.getP95('test.p95');
      expect(p95).toBeGreaterThanOrEqual(95);
      expect(p95).toBeLessThanOrEqual(96);
    });

    it('should handle empty metrics for average', () => {
      const avg = metrics.getAverage('nonexistent');
      expect(avg).toBe(0);
    });

    it('should handle empty metrics for p95', () => {
      const p95 = metrics.getP95('nonexistent');
      expect(p95).toBe(0);
    });

    it('should export metrics as JSON', () => {
      metrics.record('test.export', 100, 'ms');

      const exported = metrics.export();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('test.export');
    });

    it('should clear all metrics', () => {
      metrics.record('test.clear', 100, 'ms');
      expect(metrics.getMetrics().length).toBe(1);

      metrics.clear();
      expect(metrics.getMetrics().length).toBe(0);
    });
  });

  describe('helper functions', () => {
    it('should record AI request duration', () => {
      recordAIRequestDuration('claude-sonnet-4-5', 'generatePatch', 1500);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('ai.request.duration');
      expect(allMetrics[0].value).toBe(1500);
      expect(allMetrics[0].tags?.model).toBe('claude-sonnet-4-5');
    });

    it('should record AI token usage', () => {
      recordAITokenUsage('claude-sonnet-4-5', 1000, 500, 1500);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(3);
      expect(allMetrics[0].name).toBe('ai.tokens.input');
      expect(allMetrics[1].name).toBe('ai.tokens.output');
      expect(allMetrics[2].name).toBe('ai.tokens.total');
    });

    it('should record AI cost', () => {
      recordAICost('claude-sonnet-4-5', 0.05);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('ai.cost.usd');
      expect(allMetrics[0].value).toBe(0.05);
    });

    it('should record database query', () => {
      recordDatabaseQuery('query', 250, 'modules');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('database.query.duration');
      expect(allMetrics[0].value).toBe(250);
      expect(allMetrics[0].tags?.operation).toBe('query');
    });

    it('should record cache hit', () => {
      recordCacheHit('test-key', 'cosmos');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('cache.hit');
      expect(allMetrics[0].value).toBe(1);
    });

    it('should record cache miss', () => {
      recordCacheMiss('test-key', 'cosmos');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('cache.miss');
      expect(allMetrics[0].value).toBe(1);
    });

    it('should record cache hit rate', () => {
      recordCacheHitRate(85.5, 'cosmos');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('cache.hit_rate');
      expect(allMetrics[0].value).toBe(85.5);
      expect(allMetrics[0].unit).toBe('percent');
    });

    it('should record API request', () => {
      recordAPIRequest('/api/racks/analyze', 'POST', 1200);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('api.request.duration');
      expect(allMetrics[0].value).toBe(1200);
    });

    it('should record API error', () => {
      recordAPIError('/api/patches/generate', 'POST', 500);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('api.error');
      expect(allMetrics[0].value).toBe(1);
      expect(allMetrics[0].tags?.status).toBe('500');
    });

    it('should record upload size', () => {
      recordUploadSize(2048576); // 2MB

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('upload.size');
      expect(allMetrics[0].value).toBe(2048576);
      expect(allMetrics[0].unit).toBe('bytes');
    });

    it('should record module enrichment', () => {
      recordModuleEnrichment('plaits', 450, 'database');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBe(1);
      expect(allMetrics[0].name).toBe('module.enrichment.duration');
      expect(allMetrics[0].value).toBe(450);
    });
  });

  describe('timestamp handling', () => {
    it('should include timestamp in metrics', () => {
      const before = new Date();
      metrics.record('test.timestamp', 100, 'ms');
      const after = new Date();

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].timestamp).toBeInstanceOf(Date);
      expect(allMetrics[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(allMetrics[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('edge cases', () => {
    it('should handle negative values', () => {
      metrics.record('test.negative', -100, 'ms');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].value).toBe(-100);
    });

    it('should handle zero values', () => {
      metrics.record('test.zero', 0, 'ms');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].value).toBe(0);
    });

    it('should handle very large values', () => {
      metrics.record('test.large', 9999999999, 'bytes');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].value).toBe(9999999999);
    });

    it('should handle empty tags', () => {
      metrics.record('test.notags', 100, 'ms', {});

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].tags).toEqual({});
    });

    it('should handle missing tags', () => {
      metrics.record('test.notags', 100, 'ms');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics[0].tags).toBeUndefined();
    });
  });
});
