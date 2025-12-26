/**
 * 网页搜索模型判定
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import type { Model } from '../../shared/types';
import { getLowerBaseModelName } from './utils';
import { isEmbeddingModel, isRerankModel } from './embedding';

// Claude 支持网页搜索的模型
const CLAUDE_WEBSEARCH_REGEX = /\b(?:claude-3(-|\.)(7|5)-sonnet(?:-[\w-]+)|claude-3(-|\.)5-haiku(?:-[\w-]+))\b/i;

// Gemini 搜索模型列表
export const GEMINI_SEARCH_MODELS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro-exp-02-05',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-search',
  'gemini-2.0-flash-exp-search',
  'gemini-2.0-pro-exp-02-05-search',
  'gemini-2.5-pro-preview-06-05',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.5-flash-preview-04-17',
  'gemini-3-flash',
  'gemini-3-pro'
];

// Perplexity 搜索模型列表
export const PERPLEXITY_SEARCH_MODELS = [
  'pplx-7b-online',
  'pplx-70b-online',
  'pplx-7b-chat',
  'pplx-70b-chat',
  'sonar-small-online',
  'sonar-medium-online',
  'sonar-small-chat',
  'sonar-medium-chat',
  'sonar-pro',
  'sonar'
];

// OpenAI 搜索模型
const OPENAI_WEBSEARCH_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4.1',
  'gpt-5',
  'o3',
  'o4'
];

// Grok 搜索模型
const GROK_WEBSEARCH_MODELS = [
  'grok-3',
  'grok-4'
];

/**
 * 检查是否为支持网页搜索的 Claude 模型
 */
export function isClaudeWebSearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return CLAUDE_WEBSEARCH_REGEX.test(modelId);
}

/**
 * 检查是否为支持网页搜索的 Gemini 模型
 */
export function isGeminiWebSearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GEMINI_SEARCH_MODELS.some(m => modelId.includes(m.toLowerCase()));
}

/**
 * 检查是否为支持网页搜索的 Perplexity 模型
 */
export function isPerplexityWebSearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return PERPLEXITY_SEARCH_MODELS.some(m => modelId.includes(m.toLowerCase())) ||
         model.provider === 'perplexity';
}

/**
 * 检查是否为支持网页搜索的 OpenAI 模型
 */
export function isOpenAIWebSearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return OPENAI_WEBSEARCH_MODELS.some(m => modelId.includes(m.toLowerCase()));
}

/**
 * 检查是否为支持网页搜索的 Grok 模型
 */
export function isGrokWebSearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GROK_WEBSEARCH_MODELS.some(m => modelId.includes(m.toLowerCase()));
}

/**
 * 检查模型是否支持网页搜索
 */
export function isWebSearchModel(model?: Model): boolean {
  if (!model || isEmbeddingModel(model) || isRerankModel(model)) {
    return false;
  }

  // 检查 capabilities
  if (model.capabilities?.webSearch) {
    return true;
  }

  // 检查 modelTypes
  if (model.modelTypes?.includes('web_search' as any)) {
    return true;
  }

  return (
    isClaudeWebSearchModel(model) ||
    isGeminiWebSearchModel(model) ||
    isPerplexityWebSearchModel(model) ||
    isOpenAIWebSearchModel(model) ||
    isGrokWebSearchModel(model)
  );
}
