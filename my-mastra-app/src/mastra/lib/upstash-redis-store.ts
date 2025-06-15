import { Redis } from '@upstash/redis';

/**
 * Custom Upstash Redis Store for Mastra Memory
 * 
 * This replaces @mastra/upstash to avoid ES modules crypto issues.
 * Uses the official @upstash/redis package which is designed for serverless/edge environments.
 */

interface StorageThreadType extends Record<string, unknown> {
  id: string;
  resourceId: string;
  title?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface StorageMessageType extends Record<string, unknown> {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export class UpstashRedisStore {
  private redis: Redis;

  constructor(config?: { url?: string; token?: string }) {
    // Support both underscore and alphanumeric environment variable names
    const url = config?.url || 
                process.env.UPSTASH_REDIS_REST_URL || 
                process.env.UPSTASHREDISRESTURL ||
                process.env.UPSTASHURL;
    
    const token = config?.token || 
                  process.env.UPSTASH_REDIS_REST_TOKEN || 
                  process.env.UPSTASHREDISRESTTOKEN ||
                  process.env.UPSTASHTOKEN;

    if (!url || !token) {
      throw new Error('Upstash Redis URL and TOKEN are required. Set UPSTASHURL and UPSTASHTOKEN environment variables.');
    }

    this.redis = new Redis({
      url,
      token,
    });
  }

  // Thread management
  async createThread(data: {
    resourceId: string;
    title?: string;
    metadata?: Record<string, any>;
  }): Promise<StorageThreadType> {
    const thread: StorageThreadType = {
      id: this.generateId(),
      resourceId: data.resourceId,
      title: data.title,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store thread data
    await this.redis.hset(`thread:${thread.id}`, thread);
    
    // Add to resource index for quick lookup
    await this.redis.sadd(`resource:${data.resourceId}:threads`, thread.id);
    
    return thread;
  }

  async getThreadById(threadId: string): Promise<StorageThreadType | null> {
    const thread = await this.redis.hgetall(`thread:${threadId}`);
    
    if (!thread || Object.keys(thread).length === 0) {
      return null;
    }

    return thread as unknown as StorageThreadType;
  }

  async getThreadsByResourceId(resourceId: string): Promise<StorageThreadType[]> {
    const threadIds = await this.redis.smembers(`resource:${resourceId}:threads`);
    
    if (!threadIds || threadIds.length === 0) {
      return [];
    }

    const threads: StorageThreadType[] = [];
    for (const threadId of threadIds) {
      const thread = await this.getThreadById(threadId);
      if (thread) {
        threads.push(thread);
      }
    }

    return threads.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async updateThread(threadId: string, updates: Partial<StorageThreadType>): Promise<StorageThreadType | null> {
    const existingThread = await this.getThreadById(threadId);
    if (!existingThread) {
      return null;
    }

    const updatedThread = {
      ...existingThread,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.hset(`thread:${threadId}`, updatedThread);
    return updatedThread;
  }

  async deleteThread(threadId: string): Promise<boolean> {
    const thread = await this.getThreadById(threadId);
    if (!thread) {
      return false;
    }

    // Remove from resource index
    await this.redis.srem(`resource:${thread.resourceId}:threads`, threadId);
    
    // Delete all messages in thread
    await this.redis.del(`thread:${threadId}:messages`);
    
    // Delete thread data
    await this.redis.del(`thread:${threadId}`);
    
    return true;
  }

  // Message management
  async addMessage(message: {
    threadId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }): Promise<StorageMessageType> {
    const msg: StorageMessageType = {
      id: this.generateId(),
      threadId: message.threadId,
      role: message.role,
      content: message.content,
      createdAt: new Date().toISOString(),
      metadata: message.metadata,
    };

    // Store message
    await this.redis.hset(`message:${msg.id}`, msg);
    
    // Add to thread's message list
    await this.redis.lpush(`thread:${message.threadId}:messages`, msg.id);
    
    // Update thread's updatedAt
    await this.updateThread(message.threadId, {});
    
    return msg;
  }

  async getMessages(threadId: string, options?: {
    limit?: number;
    offset?: number;
    before?: string;
    after?: string;
  }): Promise<StorageMessageType[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    // Get message IDs from thread (newest first)
    const messageIds = await this.redis.lrange(
      `thread:${threadId}:messages`, 
      offset, 
      offset + limit - 1
    );

    if (!messageIds || messageIds.length === 0) {
      return [];
    }

    const messages: StorageMessageType[] = [];
    for (const messageId of messageIds) {
      const message = await this.redis.hgetall(`message:${messageId}`);
      if (message && Object.keys(message).length > 0) {
        messages.push(message as unknown as StorageMessageType);
      }
    }

    return messages;
  }

  async getLastMessages(threadId: string, count: number): Promise<StorageMessageType[]> {
    return this.getMessages(threadId, { limit: count });
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }

  // Clear all data (for testing)
  async clear(): Promise<void> {
    // This is a dangerous operation - only use for testing
    await this.redis.flushall();
  }
} 