import { dexieStorage } from '../services/storage/DexieStorageService';

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

// 模型头像 - 优先使用 iconUrl，备选数据库
export const getModelAvatar = async (modelId: string, iconUrl?: string) => {
  if (iconUrl) return iconUrl;
  const model = await dexieStorage.getModel(modelId);
  return model?.avatar || null;
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


