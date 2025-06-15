import { Memory } from '@mastra/memory';
import { UpstashRedisStore } from './upstash-redis-store';

/**
 * Memory Adapter for Custom Upstash Redis Store
 * 
 * This adapts our custom Redis store to work with Mastra's Memory interface.
 * Provides a drop-in replacement for the problematic @mastra/upstash package.
 */

interface MemoryConfig {
  storage: UpstashRedisStore;
  options?: {
    lastMessages?: number;
    semanticRecall?: boolean;
  };
}

export class UpstashMemory {
  private store: UpstashRedisStore;
  private options: Required<MemoryConfig['options']>;

  constructor(config: MemoryConfig) {
    this.store = config.storage;
    this.options = {
      lastMessages: config.options?.lastMessages || 15,
      semanticRecall: config.options?.semanticRecall || false,
    };
  }

  // Thread management methods
  async createThread(data: {
    resourceId: string;
    title?: string;
    metadata?: Record<string, any>;
  }) {
    return await this.store.createThread(data);
  }

  async getThreadById(params: { threadId: string }) {
    return await this.store.getThreadById(params.threadId);
  }

  async getThreadsByResourceId(params: { resourceId: string }) {
    return await this.store.getThreadsByResourceId(params.resourceId);
  }

  async updateThread(threadId: string, updates: any) {
    const result = await this.store.updateThread(threadId, updates);
    return result || null;
  }

  async deleteThread(threadId: string) {
    return await this.store.deleteThread(threadId);
  }

  // Message management methods
  async addMessage(message: {
    threadId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }) {
    return await this.store.addMessage(message);
  }

  async query(params: {
    threadId: string;
    selectBy: { last: number } | { first: number } | { all: boolean };
  }) {
    const { threadId, selectBy } = params;
    
    let limit = this.options.lastMessages;
    
    if ('last' in selectBy) {
      limit = selectBy.last;
    } else if ('first' in selectBy) {
      limit = selectBy.first;
    } else if ('all' in selectBy && selectBy.all) {
      limit = 1000; // Large number for "all"
    }

    const messages = await this.store.getMessages(threadId, { limit });
    
    // Return in format expected by Mastra Memory
    return {
      messages: messages,
      uiMessages: messages, // Same format for now
    };
  }

  async getLastMessages(threadId: string, count?: number) {
    const messageCount = count ?? this.options.lastMessages;
    return await this.store.getLastMessages(threadId, messageCount);
  }

  // Utility methods
  async ping() {
    return await this.store.ping();
  }

  async clear() {
    return await this.store.clear();
  }
}

/**
 * Factory function to create Memory with custom Upstash Redis store
 */
export function createUpstashMemory(config: {
  url: string;
  token: string;
  options?: {
    lastMessages?: number;
    semanticRecall?: boolean;
  };
}) {
  const store = new UpstashRedisStore({
    url: config.url,
    token: config.token,
  });

  return new UpstashMemory({
    storage: store,
    options: config.options,
  });
} 