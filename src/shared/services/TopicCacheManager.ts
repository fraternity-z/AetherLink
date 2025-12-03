/**
 * 话题缓存管理器
 * 使用 Promise 缓存解决重复查询和竞态条件
 */

import { dexieStorage } from './storage/DexieStorageService';
import type { ChatTopic } from '../types/Assistant';

const CACHE_TTL = 30000; // 30秒
const MAX_CACHE_SIZE = 100;

class TopicCacheManager {
  private cache = new Map<string, { promise: Promise<ChatTopic | null>; timestamp: number }>();

  /** 获取话题（带 Promise 缓存） */
  async getTopic(topicId: string): Promise<ChatTopic | null> {
    const now = Date.now();
    const cached = this.cache.get(topicId);

    // 有效缓存直接返回
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.promise;
    }

    // 创建并缓存 Promise
    const promise = dexieStorage.getTopic(topicId);
    this.cache.set(topicId, { promise, timestamp: now });
    
    // 清理过期缓存
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.cleanup();
    }

    return promise;
  }

  /** 批量获取话题 */
  getTopics(topicIds: string[]): Promise<(ChatTopic | null)[]> {
    return Promise.all(topicIds.map(id => this.getTopic(id)));
  }

  /** 更新缓存 */
  updateTopic(topicId: string, topic: ChatTopic | null): void {
    this.cache.set(topicId, { 
      promise: Promise.resolve(topic), 
      timestamp: Date.now() 
    });
  }

  /** 删除缓存 */
  removeTopic(topicId: string): void {
    this.cache.delete(topicId);
  }

  /** 清空缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  /** 清理过期和超量缓存 */
  private cleanup(): void {
    const now = Date.now();
    
    // 清理过期
    for (const [id, entry] of this.cache) {
      if ((now - entry.timestamp) > CACHE_TTL) {
        this.cache.delete(id);
      }
    }

    // 超量时清理最旧的
    if (this.cache.size > MAX_CACHE_SIZE) {
      const sorted = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      sorted.slice(0, this.cache.size - MAX_CACHE_SIZE).forEach(([id]) => this.cache.delete(id));
    }
  }
}

export const topicCacheManager = new TopicCacheManager();
