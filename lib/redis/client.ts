/**
 * Redis Client Singleton
 * Provides connection to Redis for session storage with automatic reconnection
 */

import Redis, { type RedisOptions } from 'ioredis';
import logger from '@/lib/logger';

let redisClient: Redis | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Redis configuration from environment variables
 */
function getRedisConfig(): RedisOptions {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisTls = process.env.REDIS_TLS === 'true';
  const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '3', 10);
  const retryDelay = parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10);
  const connectTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10);

  return {
    // Connection
    ...(redisPassword && { password: redisPassword }),
    maxRetriesPerRequest: maxRetries,
    connectTimeout,
    lazyConnect: true, // Don't auto-connect, we'll handle it manually

    // Reconnection strategy
    retryStrategy(times: number) {
      if (times > maxRetries) {
        logger.error('❌ Redis max retries exceeded', { attempts: times });
        return null; // Stop retrying
      }
      const delay = Math.min(times * retryDelay, 10000); // Max 10s delay
      logger.warn(`🔄 Redis reconnecting in ${delay}ms (attempt ${times}/${maxRetries})`);
      return delay;
    },

    // TLS configuration (for production Redis)
    ...(redisTls && {
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    }),

    // Performance optimizations
    enableOfflineQueue: true, // Queue commands while disconnected
    enableReadyCheck: true,
    keepAlive: 30000, // Keep connection alive with 30s pings
  };
}

/**
 * Get or create Redis client singleton
 */
export async function getRedisClient(): Promise<Redis | null> {
  // Return existing client if connected
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // Prevent concurrent connection attempts
  if (isConnecting) {
    logger.debug('⏳ Redis connection already in progress, waiting...');
    // Wait for connection to complete (max 15s)
    let waited = 0;
    while (isConnecting && waited < 15000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waited += 100;
    }
    return redisClient && redisClient.status === 'ready' ? redisClient : null;
  }

  // Max connection attempts reached
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    logger.error('❌ Redis connection failed after max attempts', {
      attempts: connectionAttempts,
    });
    return null;
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    logger.info('🔌 Connecting to Redis...', {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      attempt: connectionAttempts,
    });

    const config = getRedisConfig();
    redisClient = new Redis(config);

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready for commands');
      connectionAttempts = 0; // Reset on successful connection (ready state)
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Redis error', {
        error: error.message,
        code: (error as { code?: string }).code,
      });
    });

    redisClient.on('reconnecting', (delay: number) => {
      logger.warn(`🔄 Redis reconnecting in ${delay}ms`);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
    });

    redisClient.on('end', () => {
      logger.warn('⚠️ Redis connection ended');
      redisClient = null;
    });

    // Attempt connection
    await redisClient.connect();

    logger.info('✅ Redis client initialized', {
      status: redisClient.status,
      ttl: process.env.REDIS_SESSION_TTL || '86400',
    });

    return redisClient;
  } catch (error) {
    logger.error('❌ Failed to connect to Redis', {
      error: error instanceof Error ? error.message : String(error),
      attempt: connectionAttempts,
    });

    // Clean up failed connection
    if (redisClient) {
      redisClient.disconnect(false); // Don't reconnect
      redisClient = null;
    }

    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): {
  connected: boolean;
  status: string | null;
  attempts: number;
} {
  return {
    connected: isRedisAvailable(),
    status: redisClient?.status || null,
    attempts: connectionAttempts,
  };
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    // Check if client is already available (don't try to create new one)
    if (!isRedisAvailable()) {
      return { healthy: false, error: 'Redis client not available' };
    }

    const client = await getRedisClient();
    if (!client) {
      return { healthy: false, error: 'Redis client not available' };
    }

    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return { healthy: true, latency };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gracefully disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    logger.info('👋 Disconnecting from Redis...');
    await redisClient.quit();
    redisClient = null;
    connectionAttempts = 0;
    logger.info('✅ Redis disconnected');
  }
}

/**
 * Force close Redis connection (emergency only)
 */
export function forceCloseRedis(): void {
  if (redisClient) {
    logger.warn('⚠️ Force closing Redis connection');
    redisClient.disconnect(false);
    redisClient = null;
    connectionAttempts = 0;
  }
}

/**
 * Reset connection attempts (for testing or manual retry)
 */
export function resetConnectionAttempts(): void {
  connectionAttempts = 0;
  logger.debug('🔄 Redis connection attempts reset');
}

// Graceful shutdown on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    logger.info('📥 SIGTERM received, closing Redis connection...');
    await disconnectRedis();
  });

  process.on('SIGINT', async () => {
    logger.info('📥 SIGINT received, closing Redis connection...');
    await disconnectRedis();
  });
}
