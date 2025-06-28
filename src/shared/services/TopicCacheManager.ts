/**
 * 话题缓存管理器
 * 解决重复查询问题，提供统一的话题数据访问接口
 */

import { dexieStorage } from './storage/DexieStorageService';
import type { ChatTopic } from '../types/Assistant';

interface CacheEntry {
  topic: ChatTopic | null;
  timestamp: number;
  promise?: Promise<ChatTopic | null>;
}

class TopicCacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 30000; // 30秒缓存时间
  private readonly MAX_CACHE_SIZE = 100; // 最大缓存数量

  /**
   * 获取话题，优先从缓存获取，避免重复查询
   */
  async getTopic(topicId: string): Promise<ChatTopic | null> {
    const start = performance.now();
    console.log(`[TopicCacheManager] 获取话题: ${topicId}, 时间: ${start.toFixed(2)}ms`);

    // 检查缓存
    const cached = this.cache.get(topicId);
    const now = Date.now();

    // 如果有有效缓存，直接返回
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      if (cached.promise) {
        // 正在查询中，等待结果
        console.log(`[TopicCacheManager] 等待正在进行的查询: ${topicId}`);
        return cached.promise;
      } else {
        // 有缓存数据，直接返回
        const end = performance.now();
        console.log(`[TopicCacheManager] 从缓存返回话题: ${topicId}, 耗时: ${(end - start).toFixed(2)}ms`);
        return cached.topic;
      }
    }

    // 创建查询Promise
    const queryPromise = this.queryTopicFromDB(topicId);
    
    // 缓存Promise，防止重复查询
    this.cache.set(topicId, {
      topic: null,
      timestamp: now,
      promise: queryPromise
    });

    try {
      const topic = await queryPromise;
      
      // 更新缓存
      this.cache.set(topicId, {
        topic,
        timestamp: now
      });

      // 清理过期缓存
      this.cleanupCache();

      const end = performance.now();
      console.log(`[TopicCacheManager] 从数据库获取话题: ${topicId}, 耗时: ${(end - start).toFixed(2)}ms`);
      return topic;
    } catch (error) {
      // 查询失败，移除缓存
      this.cache.delete(topicId);
      console.error(`[TopicCacheManager] 获取话题失败: ${topicId}`, error);
      throw error;
    }
  }

  /**
   * 从数据库查询话题
   */
  private async queryTopicFromDB(topicId: string): Promise<ChatTopic | null> {
    const dbStart = performance.now();
    console.log(`[TopicCacheManager] 开始数据库查询: ${topicId}, 时间: ${dbStart.toFixed(2)}ms`);
    
    const topic = await dexieStorage.getTopic(topicId);
    
    const dbEnd = performance.now();
    console.log(`[TopicCacheManager] 数据库查询完成: ${topicId}, 耗时: ${(dbEnd - dbStart).toFixed(2)}ms, 找到: ${!!topic}`);
    
    return topic;
  }

  /**
   * 批量获取话题
   */
  async getTopics(topicIds: string[]): Promise<(ChatTopic | null)[]> {
    const start = performance.now();
    console.log(`[TopicCacheManager] 批量获取话题: ${topicIds.length}个, 时间: ${start.toFixed(2)}ms`);

    const results = await Promise.all(
      topicIds.map(id => this.getTopic(id))
    );

    const end = performance.now();
    console.log(`[TopicCacheManager] 批量获取完成, 耗时: ${(end - start).toFixed(2)}ms`);
    return results;
  }

  /**
   * 更新缓存中的话题
   */
  updateTopic(topicId: string, topic: ChatTopic | null): void {
    console.log(`[TopicCacheManager] 更新缓存话题: ${topicId}`);
    this.cache.set(topicId, {
      topic,
      timestamp: Date.now()
    });
  }

  /**
   * 删除缓存中的话题
   */
  removeTopic(topicId: string): void {
    console.log(`[TopicCacheManager] 删除缓存话题: ${topicId}`);
    this.cache.delete(topicId);
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    console.log(`[TopicCacheManager] 清空所有缓存`);
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // 清理过期缓存
    for (const [topicId, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > this.CACHE_TTL) {
        this.cache.delete(topicId);
        cleanedCount++;
      }
    }

    // 如果缓存过多，清理最旧的
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([topicId]) => {
        this.cache.delete(topicId);
        cleanedCount++;
      });
    }

    if (cleanedCount > 0) {
      console.log(`[TopicCacheManager] 清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let pendingCount = 0;

    for (const entry of this.cache.values()) {
      if (entry.promise) {
        pendingCount++;
      } else if ((now - entry.timestamp) < this.CACHE_TTL) {
        validCount++;
      } else {
        expiredCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      pending: pendingCount
    };
  }
}

// 创建单例实例
export const topicCacheManager = new TopicCacheManager();

// 在开发环境下暴露到全局，方便调试
if (import.meta.env.DEV) {
  (window as any).topicCacheManager = topicCacheManager;
  console.log('[Dev Tools] 全局函数已添加: window.topicCacheManager');
}
