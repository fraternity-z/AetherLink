/**
 * OpenAI 系列模型判定
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import type { Model } from '../../shared/types';
import { getLowerBaseModelName } from './utils';

// GPT-5 系列正则
const GPT5_REGEX = /^gpt-5(?:-[\w-]+)?$/i;
const GPT5_PRO_REGEX = /^gpt-5-pro(?:-[\w-]+)?$/i;
const GPT5_CODEX_REGEX = /^gpt-5-codex(?:-[\w-]+)?$/i;
const GPT51_REGEX = /^gpt-5\.1(?:-[\w-]+)?$/i;
const GPT51_CODEX_REGEX = /^gpt-5\.1-codex(?:-[\w-]+)?$/i;
const GPT51_CODEX_MAX_REGEX = /^gpt-5\.1-codex-max(?:-[\w-]+)?$/i;
const GPT52_REGEX = /^gpt-5\.2(?:-[\w-]+)?$/i;
const GPT52_PRO_REGEX = /^gpt-5\.2-pro(?:-[\w-]+)?$/i;

// OpenAI 推理模型正则
const OPENAI_REASONING_REGEX = /^(o1|o3|o4)(?:-[\w-]+)?$/i;

// OpenAI 深度研究模型
const OPENAI_DEEP_RESEARCH_REGEX = /^(o3-deep-research|o4-deep-research)(?:-[\w-]+)?$/i;

// OpenAI 开源权重模型
const OPENAI_OPEN_WEIGHT_REGEX = /^(o1-open|o3-open|o4-open)(?:-[\w-]+)?$/i;

// Chat Completion Only 模型
const CHAT_COMPLETION_ONLY_REGEX = /^(gpt-4o-audio|gpt-4o-realtime)(?:-[\w-]+)?$/i;

/**
 * 检查是否为 GPT-5 系列模型
 */
export function isGPT5SeriesModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT5_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5 Pro 模型
 */
export function isGPT5ProModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT5_PRO_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5 Codex 模型
 */
export function isGPT5CodexModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT5_CODEX_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5.1 系列模型
 */
export function isGPT51SeriesModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT51_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5.1 Codex 模型
 */
export function isGPT51CodexModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT51_CODEX_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5.1 Codex Max 模型
 */
export function isGPT51CodexMaxModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT51_CODEX_MAX_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5.2 系列模型
 */
export function isGPT52SeriesModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT52_REGEX.test(modelId);
}

/**
 * 检查是否为 GPT-5.2 Pro 模型
 */
export function isGPT52ProModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return GPT52_PRO_REGEX.test(modelId);
}

/**
 * 检查是否为 OpenAI 推理模型
 */
export function isOpenAIReasoningModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return OPENAI_REASONING_REGEX.test(modelId) || 
         isGPT5SeriesModel(model) || 
         isGPT51SeriesModel(model) || 
         isGPT52SeriesModel(model);
}

/**
 * 检查是否为 OpenAI 深度研究模型
 */
export function isOpenAIDeepResearchModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return OPENAI_DEEP_RESEARCH_REGEX.test(modelId);
}

/**
 * 检查是否为 OpenAI 开源权重模型
 */
export function isOpenAIOpenWeightModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return OPENAI_OPEN_WEIGHT_REGEX.test(modelId);
}

/**
 * 检查是否为仅支持 Chat Completion 的模型
 */
export function isOpenAIChatCompletionOnlyModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return CHAT_COMPLETION_ONLY_REGEX.test(modelId);
}

/**
 * 检查是否支持 reasoning effort 参数
 */
export function isSupportedReasoningEffortOpenAIModel(model?: Model): boolean {
  if (!model) return false;
  return isOpenAIReasoningModel(model) && !isOpenAIOpenWeightModel(model);
}

/**
 * 检查是否支持 verbosity 参数
 */
export function isSupportVerbosityModel(model?: Model): boolean {
  if (!model) return false;
  return isGPT5SeriesModel(model) || isGPT51SeriesModel(model);
}
