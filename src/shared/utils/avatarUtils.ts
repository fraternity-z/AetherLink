import { dexieStorage } from '../services/storage/DexieStorageService';
import { getModelOrProviderIcon } from './providerIcons';

/**
 * 头像工具函数集
 * 管理用户、助手、模型的头像获取和缓存
 */

// ============ 缓存配置 ============
const MAX_CACHE_SIZE = 200; // 最大缓存数量

// 🔧 缓存：使用 Promise 缓存解决竞态条件
const assistantAvatarCache = new Map<string, Promise<string | null>>();
const modelAvatarCache = new Map<string, Promise<string | null>>();

/**
 * 清理缓存（当超过最大数量时）
 */
const cleanupCache = <T>(cache: Map<string, T>, maxSize: number): void => {
  if (cache.size > maxSize) {
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize);
    keysToDelete.forEach(key => cache.delete(key));
  }
};

// ============ 用户头像 ============

/** 获取用户头像 */
export const getUserAvatar = (): string | null => localStorage.getItem('user_avatar');

/** 保存用户头像 */
export const saveUserAvatar = (avatar: string): void => {
  localStorage.setItem('user_avatar', avatar);
};

// ============ 助手头像 ============

/**
 * 获取助手头像（带 Promise 缓存，解决竞态条件）
 * @param assistantId 助手ID
 * @returns 头像URL或null
 */
export const getAssistantAvatar = async (assistantId: string): Promise<string | null> => {
  // 检查缓存（包括正在进行的 Promise）
  const cached = assistantAvatarCache.get(assistantId);
  if (cached) {
    return cached;
  }
  
  // 创建查询 Promise 并立即缓存，防止竞态条件
  const queryPromise = (async () => {
    const assistant = await dexieStorage.getAssistant(assistantId);
    return assistant?.avatar || null;
  })();
  
  // 存入缓存
  assistantAvatarCache.set(assistantId, queryPromise);
  cleanupCache(assistantAvatarCache, MAX_CACHE_SIZE);
  
  return queryPromise;
};

/**
 * 清除助手头像缓存
 * @param assistantId 可选，指定助手ID则只清除该助手的缓存
 */
export const clearAssistantAvatarCache = (assistantId?: string): void => {
  if (assistantId) {
    assistantAvatarCache.delete(assistantId);
  } else {
    assistantAvatarCache.clear();
  }
};

// ============ 模型头像 ============

/**
 * 获取当前主题模式
 */
const getIsDarkMode = (): boolean => {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

/**
 * 获取模型头像（带 Promise 缓存，解决竞态条件）
 * 优先级：自定义 iconUrl > 数据库保存的头像 > 供应商默认图标
 * 
 * @param modelId 模型ID
 * @param iconUrl 可选的自定义图标URL
 * @param provider 供应商ID（可选，用于获取默认图标）
 * @returns 模型头像URL
 */
export const getModelAvatar = async (
  modelId: string, 
  iconUrl?: string, 
  provider?: string
): Promise<string | null> => {
  // 1. 如果提供了自定义图标，直接使用（不缓存）
  if (iconUrl) return iconUrl;
  
  // 生成缓存 key（包含主题信息，解决主题切换问题）
  const isDark = getIsDarkMode();
  const cacheKey = `${modelId}:${provider || ''}:${isDark ? 'dark' : 'light'}`;
  
  // 检查缓存（包括正在进行的 Promise）
  const cached = modelAvatarCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 创建查询 Promise 并立即缓存，防止竞态条件
  const queryPromise = (async (): Promise<string | null> => {
    // 2. 尝试从数据库获取保存的头像
    const model = await dexieStorage.getModel(modelId);
    if (model?.avatar) {
      return model.avatar;
    }
    
    // 3. 如果提供了供应商ID，使用供应商默认图标
    if (provider) {
      return getModelOrProviderIcon(modelId, provider, isDark);
    }
    
    // 4. 如果都没有，返回 null
    return null;
  })();
  
  // 存入缓存
  modelAvatarCache.set(cacheKey, queryPromise);
  cleanupCache(modelAvatarCache, MAX_CACHE_SIZE);
  
  return queryPromise;
};

/**
 * 清除模型头像缓存
 * @param modelId 可选，指定模型ID则只清除该模型的缓存
 */
export const clearModelAvatarCache = (modelId?: string): void => {
  if (modelId) {
    // 清除所有包含该 modelId 的缓存
    for (const key of modelAvatarCache.keys()) {
      if (key.startsWith(`${modelId}:`)) {
        modelAvatarCache.delete(key);
      }
    }
  } else {
    modelAvatarCache.clear();
  }
};

/**
 * 保存模型头像（保存后清除缓存）
 * @param modelId 模型ID
 * @param avatar 头像URL
 */
export const saveModelAvatar = async (modelId: string, avatar: string): Promise<void> => {
  const existing = await dexieStorage.getModel(modelId);
  await dexieStorage.saveModel(modelId, {
    ...(existing || {}), // 空值保护
    id: modelId,
    avatar,
    updatedAt: new Date().toISOString()
  });
  // 清除缓存，下次获取时会重新从数据库读取
  clearModelAvatarCache(modelId);
};

// ============ 主题切换处理 ============

/**
 * 监听主题变化，自动清除模型头像缓存
 * （因为供应商图标可能有明暗两套）
 */
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    clearModelAvatarCache();
  });
}


