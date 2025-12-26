/**
 * 嵌入模型和重排序模型判定
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import type { Model } from '../../shared/types';
import { getLowerBaseModelName } from './utils';

// 嵌入模型正则
const EMBEDDING_REGEX = /embedding|text-embedding|embeddings|embed/i;

// 重排序模型正则
const RERANK_REGEX = /rerank|reranker|ranker/i;

/**
 * 检查模型是否为嵌入模型
 */
export function isEmbeddingModel(model?: Model): boolean {
  if (!model) return false;

  // 检查 modelTypes
  if (model.modelTypes?.includes('embedding' as any)) {
    return true;
  }

  // 检查 capabilities
  if (model.capabilities?.embedding) {
    return true;
  }

  const modelId = getLowerBaseModelName(model.id);
  return EMBEDDING_REGEX.test(modelId);
}

/**
 * 检查模型是否为重排序模型
 */
export function isRerankModel(model?: Model): boolean {
  if (!model) return false;

  // 检查 modelTypes
  if (model.modelTypes?.includes('rerank' as any)) {
    return true;
  }

  const modelId = getLowerBaseModelName(model.id);
  return RERANK_REGEX.test(modelId);
}
