/**
 * Chat Session State Management
 * Manages conversational state in Redis with 24-hour TTL
 */

import { getRedisClient } from '@/lib/redis/client';
import logger from '@/lib/logger';
import { type Patch } from '@/types/patch';
import { type ParsedRack, type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { type RackVisionAnalysis } from '@/lib/vision/rack-analyzer';
import { type Module } from '@/types/module';

/**
 * Chat message in conversation history
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // If message contains image
}

/**
 * Complete chat session state
 */
export interface ChatSession {
  sessionId: string;
  userId: string | null; // null = anonymous (demo mode)
  createdAt: Date;
  lastActivity: Date;
  ttl: number; // Time to live in seconds (24 hours = 86400)

  // Vision-detected rack context
  rackImageUrl?: string; // URL to uploaded image
  visionAnalysis?: RackVisionAnalysis; // From Claude Vision
  rackData?: ParsedRack; // Structured rack data
  capabilities?: RackCapabilities; // What the rack can do
  analysis?: RackAnalysis; // Missing components, warnings

  // Patch context
  currentPatch?: Patch; // Latest generated patch
  patchHistory: Patch[]; // Previous patches for variations/undo

  // Conversation
  messages: ChatMessage[];

  // Demo mode (anonymous users)
  isDemoMode: boolean;
  demoRackUrl?: string; // Fallback demo rack URL
}

/**
 * Get session TTL from environment (defaults to 24 hours)
 */
function getSessionTTL(): number {
  return parseInt(process.env.REDIS_SESSION_TTL || '86400', 10);
}

/**
 * Generate Redis key for session
 */
function getSessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Serialize session for Redis storage
 */
function serializeSession(session: ChatSession): string {
  return JSON.stringify({
    ...session,
    createdAt: session.createdAt.toISOString(),
    lastActivity: session.lastActivity.toISOString(),
    messages: session.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    })),
  });
}

/**
 * Deserialize session from Redis
 */
function deserializeSession(data: string): ChatSession {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    lastActivity: new Date(parsed.lastActivity),
    messages: parsed.messages.map(
      (m: {
        timestamp: string;
        role: 'user' | 'assistant';
        content: string;
        imageUrl?: string;
      }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })
    ),
  };
}

/**
 * Create a new chat session
 */
export async function createSession(
  userId: string | null,
  isDemoMode = false
): Promise<ChatSession> {
  const session: ChatSession = {
    sessionId: generateSessionId(),
    userId,
    createdAt: new Date(),
    lastActivity: new Date(),
    ttl: getSessionTTL(),
    patchHistory: [],
    messages: [],
    isDemoMode,
  };

  logger.info('💬 Creating new chat session', {
    sessionId: session.sessionId,
    userId: userId || 'anonymous',
    isDemoMode,
    ttl: `${session.ttl}s (${session.ttl / 3600}h)`,
  });

  // Save to Redis
  const redis = await getRedisClient();
  if (redis) {
    try {
      const key = getSessionKey(session.sessionId);
      await redis.setex(key, session.ttl, serializeSession(session));
      logger.debug('✅ Session saved to Redis', { sessionId: session.sessionId });
    } catch (error) {
      logger.warn('⚠️ Failed to save session to Redis (graceful degradation)', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: session.sessionId,
      });
    }
  } else {
    logger.warn('⚠️ Redis unavailable, session will be in-memory only', {
      sessionId: session.sessionId,
    });
  }

  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<ChatSession | null> {
  logger.debug('🔍 Looking up session', { sessionId });

  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis unavailable, cannot retrieve session', { sessionId });
    return null;
  }

  try {
    const key = getSessionKey(sessionId);
    const data = await redis.get(key);

    if (!data) {
      logger.debug('❌ Session not found', { sessionId });
      return null;
    }

    const session = deserializeSession(data);

    logger.info('✅ Session retrieved', {
      sessionId,
      userId: session.userId || 'anonymous',
      messageCount: session.messages.length,
      hasRack: !!session.rackData,
      hasPatch: !!session.currentPatch,
      age: `${Math.floor((Date.now() - session.createdAt.getTime()) / 1000)}s`,
    });

    return session;
  } catch (error) {
    logger.error('❌ Failed to retrieve session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    return null;
  }
}

/**
 * Update session with partial data
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<ChatSession>
): Promise<void> {
  logger.debug('📝 Updating session', {
    sessionId,
    fields: Object.keys(updates),
  });

  const session = await getSession(sessionId);
  if (!session) {
    logger.warn('⚠️ Cannot update non-existent session', { sessionId });
    throw new Error(`Session ${sessionId} not found`);
  }

  // Merge updates
  const updatedSession: ChatSession = {
    ...session,
    ...updates,
    lastActivity: new Date(), // Always update last activity
  };

  // Save back to Redis
  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis unavailable, cannot update session', { sessionId });
    return;
  }

  try {
    const key = getSessionKey(sessionId);
    await redis.setex(key, session.ttl, serializeSession(updatedSession));

    logger.debug('✅ Session updated', {
      sessionId,
      messageCount: updatedSession.messages.length,
    });
  } catch (error) {
    logger.error('❌ Failed to update session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  logger.info('🗑️ Deleting session', { sessionId });

  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis unavailable, cannot delete session', { sessionId });
    return;
  }

  try {
    const key = getSessionKey(sessionId);
    await redis.del(key);
    logger.info('✅ Session deleted', { sessionId });
  } catch (error) {
    logger.error('❌ Failed to delete session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
  }
}

/**
 * Add message to session
 */
export async function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'timestamp'>
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const fullMessage: ChatMessage = {
    ...message,
    timestamp: new Date(),
  };

  session.messages.push(fullMessage);

  await updateSession(sessionId, { messages: session.messages });

  logger.debug('💬 Message added to session', {
    sessionId,
    role: message.role,
    messageCount: session.messages.length,
  });
}

/**
 * Get all sessions for a user (for admin/debugging)
 */
export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  logger.debug('🔍 Looking up sessions for user', { userId });

  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis unavailable', { userId });
    return [];
  }

  try {
    // Scan for all session keys
    const keys = await redis.keys('session:*');
    const sessions: ChatSession[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = deserializeSession(data);
        if (session.userId === userId) {
          sessions.push(session);
        }
      }
    }

    logger.info('✅ Found user sessions', { userId, count: sessions.length });
    return sessions;
  } catch (error) {
    logger.error('❌ Failed to get user sessions', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return [];
  }
}

/**
 * Clean up stale sessions (called periodically by background job)
 */
export async function cleanupStaleSessions(): Promise<number> {
  logger.info('🧹 Starting session cleanup...');

  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis unavailable, skipping cleanup');
    return 0;
  }

  try {
    // Redis TTL handles this automatically, but we can force cleanup for very old sessions
    const keys = await redis.keys('session:*');
    let deletedCount = 0;

    for (const key of keys) {
      const ttl = await redis.ttl(key);

      // If TTL is -1 (no expiration) or key is somehow stuck, delete it
      if (ttl === -1) {
        await redis.del(key);
        deletedCount++;
        logger.debug('🗑️ Deleted session without TTL', { key });
      }
    }

    logger.info('✅ Session cleanup complete', {
      scanned: keys.length,
      deleted: deletedCount,
    });

    return deletedCount;
  } catch (error) {
    logger.error('❌ Session cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get session statistics
 */
export async function getSessionStatistics(): Promise<{
  totalSessions: number;
  authenticatedSessions: number;
  demoSessions: number;
}> {
  const redis = await getRedisClient();
  if (!redis) {
    return { totalSessions: 0, authenticatedSessions: 0, demoSessions: 0 };
  }

  try {
    const keys = await redis.keys('session:*');
    let authenticatedCount = 0;
    let demoCount = 0;

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = deserializeSession(data);
        if (session.isDemoMode) {
          demoCount++;
        } else {
          authenticatedCount++;
        }
      }
    }

    return {
      totalSessions: keys.length,
      authenticatedSessions: authenticatedCount,
      demoSessions: demoCount,
    };
  } catch (error) {
    logger.error('❌ Failed to get session statistics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { totalSessions: 0, authenticatedSessions: 0, demoSessions: 0 };
  }
}
