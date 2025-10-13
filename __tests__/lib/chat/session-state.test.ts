/**
 * Session State Tests
 * 100% coverage of session management
 */

import type Redis from 'ioredis';
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  addMessage,
  getUserSessions,
  cleanupStaleSessions,
  getSessionStatistics,
  type ChatSession,
} from '@/lib/chat/session-state';
import * as redisClient from '@/lib/redis/client';

// Mock dependencies
jest.mock('ioredis');
jest.mock('@/lib/redis/client');
jest.mock('@/lib/logger');
jest.mock('@/lib/vision/rack-analyzer', () => ({
  analyzeRackImage: jest.fn(),
  isVisionConfigured: jest.fn(() => true),
  getVisionModelInfo: jest.fn(() => ({ model: 'claude-sonnet-4-5' })),
}));

describe('Session State Management', () => {
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Redis instance
    mockRedis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      ttl: jest.fn().mockResolvedValue(86400),
    } as unknown as jest.Mocked<Redis>;

    // Mock getRedisClient to return mock Redis
    jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(mockRedis);

    // Reset environment
    process.env.REDIS_SESSION_TTL = '86400';
  });

  describe('createSession', () => {
    it('should create authenticated session', async () => {
      const session = await createSession('user-123', false);

      expect(session).toMatchObject({
        userId: 'user-123',
        isDemoMode: false,
        ttl: 86400,
        patchHistory: [],
        messages: [],
      });
      expect(session.sessionId).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);

      // Should save to Redis
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${session.sessionId}`,
        86400,
        expect.any(String)
      );
    });

    it('should create anonymous demo session', async () => {
      const session = await createSession(null, true);

      expect(session).toMatchObject({
        userId: null,
        isDemoMode: true,
      });
    });

    it('should use custom TTL from environment', async () => {
      process.env.REDIS_SESSION_TTL = '3600';

      const session = await createSession('user-123');

      expect(session.ttl).toBe(3600);
      expect(mockRedis.setex).toHaveBeenCalledWith(expect.any(String), 3600, expect.any(String));
    });

    it('should handle Redis unavailable gracefully', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      const session = await createSession('user-123');

      expect(session).toBeDefined();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis save failure gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const session = await createSession('user-123');

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
    });

    it('should generate unique session IDs', async () => {
      const session1 = await createSession('user-123');
      const session2 = await createSession('user-456');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', async () => {
      const originalSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        lastActivity: new Date('2025-01-01T01:00:00Z'),
        ttl: 86400,
        patchHistory: [],
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: new Date('2025-01-01T00:00:00Z'),
          },
        ],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...originalSession,
          createdAt: originalSession.createdAt.toISOString(),
          lastActivity: originalSession.lastActivity.toISOString(),
          messages: originalSession.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })),
        })
      );

      const session = await getSession('test-session');

      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe('test-session');
      expect(session?.userId).toBe('user-123');
      expect(session?.messages).toHaveLength(1);
      expect(session?.messages[0].content).toBe('Hello');
      expect(session?.createdAt).toBeInstanceOf(Date);
      expect(mockRedis.get).toHaveBeenCalledWith('session:test-session');
    });

    it('should return null for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      const session = await getSession('non-existent');

      expect(session).toBeNull();
    });

    it('should return null when Redis unavailable', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      const session = await getSession('test-session');

      expect(session).toBeNull();
    });

    it('should handle Redis get failure', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const session = await getSession('test-session');

      expect(session).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const session = await getSession('test-session');

      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session with partial data', async () => {
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date(),
        lastActivity: new Date(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      // Mock getSession to return existing session
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      await updateSession('test-session', {
        demoRackUrl: 'https://modulargrid.net/e/racks/view/123',
      });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'session:test-session',
        86400,
        expect.stringContaining('modulargrid')
      );
    });

    it('should update lastActivity timestamp', async () => {
      const oldDate = new Date('2025-01-01T00:00:00Z');
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: oldDate,
        lastActivity: oldDate,
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      await updateSession('test-session', { messages: [] });

      // Verify lastActivity was updated (should be recent)
      const saveCall = mockRedis.setex.mock.calls[0][2] as string;
      const saved = JSON.parse(saveCall);
      const lastActivity = new Date(saved.lastActivity);

      expect(lastActivity.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should throw error for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(updateSession('non-existent', {})).rejects.toThrow(
        'Session non-existent not found'
      );
    });

    it('should handle Redis unavailable during update', async () => {
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date(),
        lastActivity: new Date(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      jest
        .spyOn(redisClient, 'getRedisClient')
        .mockResolvedValueOnce(mockRedis)
        .mockResolvedValueOnce(null);

      await updateSession('test-session', {});

      // Should not throw, just log warning
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should propagate Redis errors during update', async () => {
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date(),
        lastActivity: new Date(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(updateSession('test-session', {})).rejects.toThrow('Redis error');
    });
  });

  describe('deleteSession', () => {
    it('should delete session from Redis', async () => {
      await deleteSession('test-session');

      expect(mockRedis.del).toHaveBeenCalledWith('session:test-session');
    });

    it('should handle Redis unavailable gracefully', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      await deleteSession('test-session');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis delete failure gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(deleteSession('test-session')).resolves.not.toThrow();
    });
  });

  describe('addMessage', () => {
    it('should add message to session', async () => {
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date(),
        lastActivity: new Date(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      await addMessage('test-session', {
        role: 'user',
        content: 'Hello, assistant!',
      });

      // Verify message was added
      const saveCall = mockRedis.setex.mock.calls[0][2] as string;
      const saved = JSON.parse(saveCall);

      expect(saved.messages).toHaveLength(1);
      expect(saved.messages[0].content).toBe('Hello, assistant!');
      expect(saved.messages[0].timestamp).toBeDefined();
    });

    it('should add message with image URL', async () => {
      const existingSession: ChatSession = {
        sessionId: 'test-session',
        userId: 'user-123',
        createdAt: new Date(),
        lastActivity: new Date(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          ...existingSession,
          createdAt: existingSession.createdAt.toISOString(),
          lastActivity: existingSession.lastActivity.toISOString(),
        })
      );

      await addMessage('test-session', {
        role: 'user',
        content: 'Check out my rack',
        imageUrl: 'https://example.com/rack.jpg',
      });

      const saveCall = mockRedis.setex.mock.calls[0][2] as string;
      const saved = JSON.parse(saveCall);

      expect(saved.messages[0].imageUrl).toBe('https://example.com/rack.jpg');
    });

    it('should throw error for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(addMessage('non-existent', { role: 'user', content: 'Hello' })).rejects.toThrow(
        'Session non-existent not found'
      );
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      const session1 = {
        sessionId: 'session-1',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      const session2 = {
        sessionId: 'session-2',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      const session3 = {
        sessionId: 'session-3',
        userId: 'user-456',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
        isDemoMode: false,
      };

      mockRedis.keys.mockResolvedValue([
        'session:session-1',
        'session:session-2',
        'session:session-3',
      ]);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(session1))
        .mockResolvedValueOnce(JSON.stringify(session2))
        .mockResolvedValueOnce(JSON.stringify(session3));

      const sessions = await getUserSessions('user-123');

      expect(sessions).toHaveLength(2);
      expect(sessions[0].sessionId).toBe('session-1');
      expect(sessions[1].sessionId).toBe('session-2');
    });

    it('should return empty array when Redis unavailable', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      const sessions = await getUserSessions('user-123');

      expect(sessions).toEqual([]);
    });

    it('should handle Redis error gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const sessions = await getUserSessions('user-123');

      expect(sessions).toEqual([]);
    });
  });

  describe('cleanupStaleSessions', () => {
    it('should delete sessions without TTL', async () => {
      mockRedis.keys.mockResolvedValue(['session:stale-1', 'session:stale-2']);
      mockRedis.ttl.mockResolvedValue(-1); // No TTL

      const deleted = await cleanupStaleSessions();

      expect(deleted).toBe(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });

    it('should not delete sessions with valid TTL', async () => {
      mockRedis.keys.mockResolvedValue(['session:valid-1']);
      mockRedis.ttl.mockResolvedValue(3600); // Has TTL

      const deleted = await cleanupStaleSessions();

      expect(deleted).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return 0 when Redis unavailable', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      const deleted = await cleanupStaleSessions();

      expect(deleted).toBe(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const deleted = await cleanupStaleSessions();

      expect(deleted).toBe(0);
    });
  });

  describe('getSessionStatistics', () => {
    it('should return session counts', async () => {
      const authSession = {
        sessionId: 'auth-session',
        userId: 'user-123',
        isDemoMode: false,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
      };

      const demoSession = {
        sessionId: 'demo-session',
        userId: null,
        isDemoMode: true,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ttl: 86400,
        patchHistory: [],
        messages: [],
      };

      mockRedis.keys.mockResolvedValue(['session:auth-session', 'session:demo-session']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(authSession))
        .mockResolvedValueOnce(JSON.stringify(demoSession));

      const stats = await getSessionStatistics();

      expect(stats).toEqual({
        totalSessions: 2,
        authenticatedSessions: 1,
        demoSessions: 1,
      });
    });

    it('should return zeros when Redis unavailable', async () => {
      jest.spyOn(redisClient, 'getRedisClient').mockResolvedValue(null);

      const stats = await getSessionStatistics();

      expect(stats).toEqual({
        totalSessions: 0,
        authenticatedSessions: 0,
        demoSessions: 0,
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const stats = await getSessionStatistics();

      expect(stats).toEqual({
        totalSessions: 0,
        authenticatedSessions: 0,
        demoSessions: 0,
      });
    });
  });
});
