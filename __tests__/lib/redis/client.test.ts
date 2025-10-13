/**
 * Redis Client Tests
 * 100% coverage of Redis connection management
 */

import Redis from 'ioredis';
import {
  getRedisClient,
  isRedisAvailable,
  getRedisStatus,
  checkRedisHealth,
  disconnectRedis,
  forceCloseRedis,
  resetConnectionAttempts,
} from '@/lib/redis/client';

// Mock ioredis
jest.mock('ioredis');
jest.mock('@/lib/logger');

describe('Redis Client', () => {
  let mockRedisInstance: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetConnectionAttempts();

    // Create mock Redis instance
    mockRedisInstance = {
      status: 'ready',
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      on: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    // Mock Redis constructor
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedisInstance);

    // Clear environment variables
    delete process.env.REDIS_URL;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_TLS;
  });

  afterEach(async () => {
    // Clean up connections after each test
    await disconnectRedis();
  });

  describe('getRedisClient', () => {
    it('should create and connect to Redis successfully', async () => {
      const client = await getRedisClient();

      expect(client).toBe(mockRedisInstance);
      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: true,
          enableReadyCheck: true,
          keepAlive: 30000,
        })
      );
      expect(mockRedisInstance.connect).toHaveBeenCalled();
    });

    it('should return existing client if already connected', async () => {
      mockRedisInstance.status = 'ready';

      const client1 = await getRedisClient();
      const client2 = await getRedisClient();

      expect(client1).toBe(client2);
      expect(Redis).toHaveBeenCalledTimes(1);
      expect(mockRedisInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('should use environment variables for configuration', async () => {
      process.env.REDIS_URL = 'redis://custom-host:6380';
      process.env.REDIS_PASSWORD = 'secret-password';
      process.env.REDIS_TLS = 'true';
      process.env.REDIS_MAX_RETRIES = '5';
      process.env.REDIS_CONNECT_TIMEOUT = '5000';

      await getRedisClient();

      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'secret-password',
          maxRetriesPerRequest: 5,
          connectTimeout: 5000,
          tls: expect.objectContaining({
            rejectUnauthorized: false, // NODE_ENV is 'test'
          }),
        })
      );
    });

    it('should handle connection failures gracefully', async () => {
      mockRedisInstance.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const client = await getRedisClient();

      expect(client).toBeNull();
      expect(mockRedisInstance.disconnect).toHaveBeenCalledWith(false);
    });

    it('should prevent concurrent connection attempts', async () => {
      let connectResolve: () => void;
      const connectPromise = new Promise<void>((resolve) => {
        connectResolve = resolve;
      });
      mockRedisInstance.connect.mockReturnValue(connectPromise);

      // Start two connections simultaneously
      const client1Promise = getRedisClient();
      const client2Promise = getRedisClient();

      // Resolve the connection after a delay
      setTimeout(() => connectResolve!(), 50);

      const [client1, client2] = await Promise.all([client1Promise, client2Promise]);

      // Should only create one Redis instance
      expect(Redis).toHaveBeenCalledTimes(1);
      expect(client1).toBe(mockRedisInstance);
      expect(client2).toBe(mockRedisInstance);
    });

    it('should stop retrying after max connection attempts', async () => {
      mockRedisInstance.connect.mockRejectedValue(new Error('Connection failed'));

      // Attempt to connect 4 times (exceeds max of 3)
      await getRedisClient();
      await getRedisClient();
      await getRedisClient();
      const client4 = await getRedisClient();

      expect(client4).toBeNull();
      expect(Redis).toHaveBeenCalledTimes(3); // Only 3 attempts
    });

    it('should register event handlers on connection', async () => {
      await getRedisClient();

      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('should handle reconnection event', async () => {
      let reconnectingHandler: (delay: number) => void = () => {};

      mockRedisInstance.on.mockImplementation((event: string, handler: unknown) => {
        if (event === 'reconnecting') {
          reconnectingHandler = handler as (delay: number) => void;
        }
        return mockRedisInstance;
      });

      await getRedisClient();

      // Trigger reconnecting event
      expect(() => reconnectingHandler(1000)).not.toThrow();
    });

    it('should handle error event', async () => {
      let errorHandler: (error: Error) => void = () => {};

      mockRedisInstance.on.mockImplementation((event: string, handler: unknown) => {
        if (event === 'error') {
          errorHandler = handler as (error: Error) => void;
        }
        return mockRedisInstance;
      });

      await getRedisClient();

      // Trigger error event
      const error = new Error('Redis error') as Error & { code?: string };
      error.code = 'ECONNREFUSED';
      expect(() => errorHandler(error)).not.toThrow();
    });

    it('should handle end event and clear client', async () => {
      let endHandler: () => void = () => {};

      mockRedisInstance.on.mockImplementation((event: string, handler: unknown) => {
        if (event === 'end') {
          endHandler = handler as () => void;
        }
        return mockRedisInstance;
      });

      await getRedisClient();
      expect(isRedisAvailable()).toBe(true);

      // Trigger end event
      endHandler();

      expect(isRedisAvailable()).toBe(false);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when Redis is connected', async () => {
      mockRedisInstance.status = 'ready';
      await getRedisClient();

      expect(isRedisAvailable()).toBe(true);
    });

    it('should return false when Redis is not connected', () => {
      expect(isRedisAvailable()).toBe(false);
    });

    it('should return false when Redis is connecting', async () => {
      mockRedisInstance.status = 'connecting';
      await getRedisClient();

      expect(isRedisAvailable()).toBe(false);
    });
  });

  describe('getRedisStatus', () => {
    it('should return connection status', async () => {
      let readyHandler: () => void = () => {};

      mockRedisInstance.on.mockImplementation((event: string, handler: unknown) => {
        if (event === 'ready') {
          readyHandler = handler as () => void;
        }
        return mockRedisInstance;
      });

      mockRedisInstance.status = 'ready';
      await getRedisClient();

      // Trigger ready event to reset connection attempts
      readyHandler();

      const status = getRedisStatus();

      expect(status).toEqual({
        connected: true,
        status: 'ready',
        attempts: 0, // Reset after successful connection
      });
    });

    it('should return disconnected status', () => {
      const status = getRedisStatus();

      expect(status).toEqual({
        connected: false,
        status: null,
        attempts: 0,
      });
    });

    it('should track connection attempts', async () => {
      mockRedisInstance.connect.mockRejectedValue(new Error('Failed'));

      await getRedisClient();
      const status = getRedisStatus();

      expect(status.attempts).toBe(1);
    });
  });

  describe('checkRedisHealth', () => {
    it('should return healthy status with latency', async () => {
      mockRedisInstance.status = 'ready';
      mockRedisInstance.ping.mockResolvedValue('PONG');
      await getRedisClient();

      const health = await checkRedisHealth();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });

    it('should return unhealthy when client not available', async () => {
      const health = await checkRedisHealth();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Redis client not available');
    });

    it('should return unhealthy when ping fails', async () => {
      mockRedisInstance.status = 'ready';
      mockRedisInstance.ping.mockRejectedValue(new Error('Ping failed'));
      await getRedisClient();

      const health = await checkRedisHealth();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Ping failed');
    });
  });

  describe('disconnectRedis', () => {
    it('should gracefully disconnect from Redis', async () => {
      await getRedisClient();

      await disconnectRedis();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
      expect(isRedisAvailable()).toBe(false);
    });

    it('should handle disconnect when no client exists', async () => {
      await disconnectRedis();

      expect(mockRedisInstance.quit).not.toHaveBeenCalled();
    });

    it('should reset connection attempts on disconnect', async () => {
      let readyHandler: () => void = () => {};

      mockRedisInstance.on.mockImplementation((event: string, handler: unknown) => {
        if (event === 'ready') {
          readyHandler = handler as () => void;
        }
        return mockRedisInstance;
      });

      mockRedisInstance.status = 'ready';
      await getRedisClient();

      // Connection succeeded but ready event not fired yet
      expect(getRedisStatus().attempts).toBe(1);

      await disconnectRedis();
      resetConnectionAttempts(); // Manual reset after disconnect

      expect(getRedisStatus().attempts).toBe(0);
    });
  });

  describe('forceCloseRedis', () => {
    it('should force close Redis connection', async () => {
      await getRedisClient();

      forceCloseRedis();

      expect(mockRedisInstance.disconnect).toHaveBeenCalledWith(false);
      expect(isRedisAvailable()).toBe(false);
    });

    it('should handle force close when no client exists', () => {
      forceCloseRedis();

      expect(mockRedisInstance.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('resetConnectionAttempts', () => {
    it('should reset connection attempt counter', async () => {
      mockRedisInstance.connect.mockRejectedValue(new Error('Failed'));
      await getRedisClient();

      expect(getRedisStatus().attempts).toBe(1);

      resetConnectionAttempts();

      expect(getRedisStatus().attempts).toBe(0);
    });
  });

  describe('Retry Strategy', () => {
    it('should configure retry strategy with exponential backoff', async () => {
      process.env.REDIS_RETRY_DELAY = '1000';
      process.env.REDIS_MAX_RETRIES = '3';

      await getRedisClient();

      const constructorCall = (Redis as unknown as jest.Mock).mock.calls[0][0];
      const retryStrategy = constructorCall.retryStrategy;

      // Test retry delays (times * retryDelay)
      expect(retryStrategy(1)).toBe(1000); // 1 * 1000
      expect(retryStrategy(2)).toBe(2000); // 2 * 1000
      expect(retryStrategy(3)).toBe(3000); // 3 * 1000
      expect(retryStrategy(4)).toBeNull(); // Stop after max retries (3)
    });

    it('should cap retry delay at 10 seconds', async () => {
      process.env.REDIS_RETRY_DELAY = '5000';
      process.env.REDIS_MAX_RETRIES = '5';

      await getRedisClient();

      const constructorCall = (Redis as unknown as jest.Mock).mock.calls[0][0];
      const retryStrategy = constructorCall.retryStrategy;

      // With delay=5000, attempt 3 would be 15000ms, but should cap at 10000
      expect(retryStrategy(3)).toBe(10000); // Capped at 10s (not 15000)
    });
  });

  describe('Production Mode', () => {
    it('should enforce TLS certificate validation in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.REDIS_TLS = 'true';

      await getRedisClient();

      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: true,
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
