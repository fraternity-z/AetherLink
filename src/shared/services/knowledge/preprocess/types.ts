/**
 * PDF 预处理提供商类型定义
 * 
 * 复刻 Cherry Studio 的 PreprocessProvider 架构：
 * - 支持多个云端 PDF 解析服务（Doc2x、Mistral OCR、OpenMineru）
 * - 适配浏览器环境（使用 fetch 代替 electron.net，无 fs 依赖）
 * - Provider 模式：可扩展新的解析服务
 */

// ==================== Provider ID ====================

/**
 * 预处理提供商 ID
 * 与 CS 项目保持一致的命名
 */
export const PreprocessProviderIds = {
  doc2x: 'doc2x',
  mistral: 'mistral',
  'open-mineru': 'open-mineru',
} as const;

export type PreprocessProviderId = keyof typeof PreprocessProviderIds;

export function isPreprocessProviderId(id: string): id is PreprocessProviderId {
  return Object.hasOwn(PreprocessProviderIds, id);
}

// ==================== Provider 配置 ====================

/**
 * 预处理提供商配置
 */
export interface PreprocessProviderConfig {
  id: PreprocessProviderId;
  name: string;
  apiKey?: string;
  apiHost?: string;
  model?: string;
  options?: Record<string, any>;
}

/**
 * 预处理提供商元数据（用于 UI 展示）
 */
export interface PreprocessProviderMeta {
  id: PreprocessProviderId;
  name: string;
  description: string;
  website: string;
  defaultApiHost: string;
  defaultModel?: string;
  /** 是否需要 API Key */
  requiresApiKey: boolean;
  /** 最大文件大小（字节） */
  maxFileSize: number;
  /** 最大页数 */
  maxPages: number;
}

// ==================== 预处理结果 ====================

/**
 * 预处理进度回调
 */
export type PreprocessProgressCallback = (progress: number, message?: string) => void;

/**
 * 预处理结果
 */
export interface PreprocessResult {
  /** 解析后的 Markdown 内容 */
  content: string;
  /** 原始文件名 */
  originalFileName: string;
  /** 解析后的文件名（通常为 .md） */
  processedFileName: string;
  /** 页数 */
  pageCount?: number;
  /** 使用的提供商 */
  providerId: PreprocessProviderId;
}

// ==================== Provider 元数据注册 ====================

/**
 * 所有可用的预处理提供商元数据
 */
export const PREPROCESS_PROVIDER_METAS: Record<PreprocessProviderId, PreprocessProviderMeta> = {
  doc2x: {
    id: 'doc2x',
    name: 'Doc2X',
    description: 'AI 文档解析服务，支持 PDF/图片转 Markdown，中文友好',
    website: 'https://doc2x.noedgeai.com',
    defaultApiHost: 'https://v2.doc2x.noedgeai.com',
    requiresApiKey: true,
    maxFileSize: 300 * 1024 * 1024, // 300MB
    maxPages: 1000,
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral OCR',
    description: 'Mistral AI 的 OCR 服务，高质量文档解析',
    website: 'https://mistral.ai',
    defaultApiHost: 'https://api.mistral.ai',
    defaultModel: 'mistral-ocr-latest',
    requiresApiKey: true,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxPages: 1000,
  },
  'open-mineru': {
    id: 'open-mineru',
    name: 'MinerU',
    description: 'MinerU 官方 API，高质量 PDF/Doc/PPT/图片解析',
    website: 'https://mineru.net',
    defaultApiHost: 'https://mineru.net',
    defaultModel: 'vlm',
    requiresApiKey: true,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxPages: 600,
  },
};
