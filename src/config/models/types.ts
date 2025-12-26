/**
 * 模型类型定义
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import type { Model } from '../../shared/types';

// 模型类型常量
export const ModelType = {
  Chat: 'chat',
  Vision: 'vision',
  Audio: 'audio',
  Embedding: 'embedding',
  Tool: 'tool',
  Reasoning: 'reasoning',
  ImageGen: 'image_gen',
  VideoGen: 'video_gen',
  FunctionCalling: 'function_calling',
  WebSearch: 'web_search',
  Rerank: 'rerank',
  CodeGen: 'code_gen',
  Translation: 'translation',
  Transcription: 'transcription'
} as const;

export type ModelTypeValue = typeof ModelType[keyof typeof ModelType];

// 思考模型类型
export type ThinkingModelType =
  | 'default'
  | 'o'
  | 'openai_deep_research'
  | 'gpt5'
  | 'gpt5pro'
  | 'gpt5_codex'
  | 'gpt5_1'
  | 'gpt5_1_codex'
  | 'gpt5_1_codex_max'
  | 'gpt5_2'
  | 'gpt52pro'
  | 'grok'
  | 'grok4_fast'
  | 'gemini2_flash'
  | 'gemini2_pro'
  | 'gemini3_flash'
  | 'gemini3_pro'
  | 'qwen'
  | 'qwen_thinking'
  | 'doubao'
  | 'doubao_no_auto'
  | 'doubao_after_251015'
  | 'mimo'
  | 'hunyuan'
  | 'zhipu'
  | 'perplexity'
  | 'deepseek_hybrid';

// 推理努力程度选项
export type ReasoningEffortOption =
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'auto'
  | 'default';

// 推理努力程度配置
export type ReasoningEffortConfig = {
  [K in ThinkingModelType]: readonly ReasoningEffortOption[];
};

// 思考选项配置
export type ThinkingOptionConfig = {
  [K in ThinkingModelType]: readonly ReasoningEffortOption[];
};

// 用户自定义模型类型检查
export function isUserSelectedModelType(model: Model, type: string): boolean | undefined {
  if (!model.modelTypes) return undefined;
  const typeMap: Record<string, ModelTypeValue> = {
    'vision': ModelType.Vision,
    'reasoning': ModelType.Reasoning,
    'embedding': ModelType.Embedding,
    'function_calling': ModelType.FunctionCalling,
    'web_search': ModelType.WebSearch,
    'image_gen': ModelType.ImageGen,
    'rerank': ModelType.Rerank
  };
  const modelType = typeMap[type];
  if (!modelType) return undefined;
  return model.modelTypes.includes(modelType as any);
}
