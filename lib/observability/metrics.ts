/**
 * Observability Metrics
 *
 * Simple metrics collection for monitoring application performance.
 * Can be extended to send to Datadog, Prometheus, or other monitoring platforms.
 */

export interface Metric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a metric
   */
  record(name: string, value: number, unit: Metric['unit'], tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      unit,
      tags,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics in memory
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log metric for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 Metric: ${name} = ${value}${unit} ${tags ? JSON.stringify(tags) : ''}`);
    }

    // TODO: Send to monitoring platform (Datadog, Prometheus, etc.)
    // this.sendToDatadog(metric);
  }

  /**
   * Record execution time of an operation
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>) {
    this.record(name, duration, 'ms', tags);
  }

  /**
   * Record a count metric
   */
  recordCount(name: string, count: number, tags?: Record<string, string>) {
    this.record(name, count, 'count', tags);
  }

  /**
   * Record a percentage metric
   */
  recordPercent(name: string, percent: number, tags?: Record<string, string>) {
    this.record(name, percent, 'percent', tags);
  }

  /**
   * Record a size metric (bytes)
   */
  recordSize(name: string, bytes: number, tags?: Record<string, string>) {
    this.record(name, bytes, 'bytes', tags);
  }

  /**
   * Get all metrics (for debugging/export)
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Calculate average for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get p95 (95th percentile) for a metric
   */
  getP95(name: string): number {
    const metrics = this.getMetricsByName(name).map((m) => m.value);
    if (metrics.length === 0) return 0;

    metrics.sort((a, b) => a - b);
    const index = Math.floor(metrics.length * 0.95);
    return metrics[index];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Export metrics for external monitoring
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Send metrics to Datadog (placeholder)
   */
  private sendToDatadog(metric: Metric) {
    if (!process.env.DATADOG_API_KEY) return;

    // TODO: Implement Datadog integration
    // const dogstatsd = require('datadog-metrics');
    // dogstatsd.gauge(metric.name, metric.value, metric.tags);
  }
}

// Singleton instance
const metrics = new MetricsCollector();

// Helper functions for common metrics

export function recordAIRequestDuration(model: string, operation: string, duration: number) {
  metrics.recordTiming('ai.request.duration', duration, {
    model,
    operation,
  });
}

export function recordAITokenUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  totalTokens: number
) {
  metrics.recordCount('ai.tokens.input', inputTokens, { model });
  metrics.recordCount('ai.tokens.output', outputTokens, { model });
  metrics.recordCount('ai.tokens.total', totalTokens, { model });
}

export function recordAICost(model: string, cost: number) {
  metrics.recordSize('ai.cost.usd', cost, { model });
}

export function recordDatabaseQuery(operation: string, duration: number, collection?: string) {
  metrics.recordTiming('database.query.duration', duration, {
    operation,
    collection: collection || 'unknown',
  });
}

export function recordCacheHit(key: string, source: string = 'cosmos') {
  metrics.recordCount('cache.hit', 1, { key, source });
}

export function recordCacheMiss(key: string, source: string = 'cosmos') {
  metrics.recordCount('cache.miss', 1, { key, source });
}

export function recordCacheHitRate(hitRate: number, source: string = 'cosmos') {
  metrics.recordPercent('cache.hit_rate', hitRate, { source });
}

export function recordAPIRequest(endpoint: string, method: string, duration: number) {
  metrics.recordTiming('api.request.duration', duration, {
    endpoint,
    method,
  });
}

export function recordAPIError(endpoint: string, method: string, statusCode: number) {
  metrics.recordCount('api.error', 1, {
    endpoint,
    method,
    status: statusCode.toString(),
  });
}

export function recordUploadSize(bytes: number) {
  metrics.recordSize('upload.size', bytes);
}

export function recordModuleEnrichment(moduleId: string, duration: number, source: string) {
  metrics.recordTiming('module.enrichment.duration', duration, {
    moduleId,
    source,
  });
}

// Export singleton
export default metrics;
