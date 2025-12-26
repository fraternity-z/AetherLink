/**
 * 模型工具函数
 * 从 Cherry Studio 移植并适配 AetherLink
 */

import type { Model } from '../../shared/types';

// 不支持的模型正则表达式
export const NOT_SUPPORTED_REGEX = /(?:^tts|whisper|speech)/i;

// Gemini Flash 模型正则
export const GEMINI_FLASH_MODEL_REGEX = new RegExp('gemini.*-flash.*$', 'i');

/**
 * 从模型 ID 中提取基础名称并转换为小写
 */
export function getLowerBaseModelName(id: string, delimiter: string = '/'): string {
  const parts = id.split(delimiter);
  let baseModelName = parts[parts.length - 1].toLowerCase();

  // for openrouter
  if (baseModelName.endsWith(':free')) {
    return baseModelName.replace(':free', '');
  }

  return baseModelName;
}

/**
 * 检查模型是否是 Anthropic 模型
 */
export function isAnthropicModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.startsWith('claude');
}

/**
 * 检查模型是否是 Gemini 模型
 */
export function isGeminiModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('gemini');
}

/**
 * 检查模型是否是 Grok 模型
 */
export function isGrokModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('grok');
}

/**
 * 检查模型是否是 Gemma 模型
 */
export function isGemmaModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('gemma-') || model.group === 'Gemma';
}

/**
 * 检查模型是否是智谱模型
 */
export function isZhipuModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('glm') || model.provider === 'zhipu';
}

/**
 * 检查模型是否是 Moonshot 模型
 */
export function isMoonshotModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return ['moonshot', 'kimi'].some((m) => modelId.includes(m));
}

/**
 * 检查模型是否是 Qwen 模型
 */
export function isQwenModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('qwen');
}

/**
 * 检查模型是否是 DeepSeek 模型
 */
export function isDeepSeekModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('deepseek');
}

/**
 * 检查模型是否是 Claude 模型
 */
export function isClaudeModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('claude');
}

/**
 * 检查模型是否是 Llama 模型
 */
export function isLlamaModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('llama');
}

/**
 * 检查模型是否是 Mistral 模型
 */
export function isMistralModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('mistral');
}

/**
 * 检查模型是否是 Gemini 3 模型
 */
export function isGemini3Model(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  return modelId.includes('gemini-3');
}

/**
 * 检查模型是否是 Gemini 3 Flash 模型
 */
export function isGemini3FlashModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  if (modelId === 'gemini-flash-latest') return true;
  return /gemini-3-flash(?!-image)(?:-[\w-]+)*$/i.test(modelId);
}

/**
 * 检查模型是否是 Gemini 3 Pro 模型
 */
export function isGemini3ProModel(model?: Model): boolean {
  if (!model) return false;
  const modelId = getLowerBaseModelName(model.id);
  if (modelId === 'gemini-pro-latest') return true;
  return /gemini-3-pro(?!-image)(?:-[\w-]+)*$/i.test(modelId);
}

/**
 * 检查模型温度最大值是否为1
 */
export function isMaxTemperatureOneModel(model?: Model): boolean {
  if (!model) return false;
  return isZhipuModel(model) || isAnthropicModel(model) || isMoonshotModel(model);
}

/**
 * 检查模型是否支持的模型（过滤TTS等）
 */
export function isSupportedModel(modelId: string): boolean {
  if (!modelId) return false;
  const lowerModelId = getLowerBaseModelName(modelId);
  return !NOT_SUPPORTED_REGEX.test(lowerModelId);
}
