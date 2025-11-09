import { dexieStorage } from '../services/storage/DexieStorageService';
import { getModelOrProviderIcon } from './providerIcons';

/**
 * 简单的头像工具函数
 */

// 用户头像 - 存储在 localStorage
export const getUserAvatar = () => localStorage.getItem('user_avatar');
export const saveUserAvatar = (avatar: string) => localStorage.setItem('user_avatar', avatar);

// 助手头像 - 存储在数据库
export const getAssistantAvatar = async (assistantId: string) => {
  const assistant = await dexieStorage.getAssistant(assistantId);
  return assistant?.avatar || null;
};

/**
 * 获取模型头像
 * 优先级：自定义 iconUrl > 数据库保存的头像 > 供应商默认图标
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
  // 1. 如果提供了自定义图标，直接使用
  if (iconUrl) return iconUrl;
  
  // 2. 尝试从数据库获取保存的头像
  const model = await dexieStorage.getModel(modelId);
  if (model?.avatar) return model.avatar;
  
  // 3. 如果提供了供应商ID，使用供应商默认图标
  if (provider) {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return getModelOrProviderIcon(modelId, provider, isDark);
  }
  
  // 4. 如果都没有，返回 null
  return null;
};

// 模型头像保存
export const saveModelAvatar = async (modelId: string, avatar: string) => {
  const existing = await dexieStorage.getModel(modelId);
  await dexieStorage.saveModel(modelId, {
    ...existing,
    id: modelId,
    avatar,
    updatedAt: new Date().toISOString()
  });
};


