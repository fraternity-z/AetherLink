/**
 * PDF 预处理 Provider 工厂
 * 
 * 复刻 Cherry Studio 的 PreprocessProvider 架构：
 * - 根据 providerId 创建对应的 Provider 实例
 * - 统一入口，支持动态扩展
 */

export * from './types';
export { default as BasePreprocessProvider } from './BasePreprocessProvider';

import type { PreprocessProviderConfig, PreprocessResult, PreprocessProgressCallback } from './types';
import { PREPROCESS_PROVIDER_METAS } from './types';

/**
 * 创建预处理 Provider 实例
 * 使用动态导入避免打包不需要的 Provider
 */
export async function createPreprocessProvider(
  config: PreprocessProviderConfig
): Promise<import('./BasePreprocessProvider').default> {
  switch (config.id) {
    case 'doc2x': {
      const { default: Doc2xProvider } = await import('./Doc2xProvider');
      return new Doc2xProvider(config);
    }
    case 'mistral': {
      const { default: MistralOCRProvider } = await import('./MistralOCRProvider');
      return new MistralOCRProvider(config);
    }
    case 'open-mineru': {
      const { default: OpenMineruProvider } = await import('./OpenMineruProvider');
      return new OpenMineruProvider(config);
    }
    default:
      throw new Error(`未知的预处理提供商: ${config.id}`);
  }
}

/**
 * 使用云端 Provider 解析 PDF
 * 一站式调用：创建 Provider → 设置进度 → 解析
 */
export async function preprocessPdfWithCloud(
  fileData: ArrayBuffer,
  fileName: string,
  config: PreprocessProviderConfig,
  onProgress?: PreprocessProgressCallback
): Promise<PreprocessResult> {
  const provider = await createPreprocessProvider(config);
  
  if (onProgress) {
    provider.setProgressCallback(onProgress);
  }

  return provider.parseFile(fileData, fileName);
}

/**
 * 获取所有可用的预处理提供商列表（用于 UI 展示）
 */
export function getAvailableProviders() {
  return Object.values(PREPROCESS_PROVIDER_METAS);
}
