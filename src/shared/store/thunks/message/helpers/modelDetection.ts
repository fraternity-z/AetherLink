/**
 * 模型类型检测工具函数
 */
import type { Model } from '../../../../types';

/**
 * 图像生成模型的 ID 模式
 */
const IMAGE_MODEL_PATTERNS = [
  'flux',
  'black-forest',
  'stable-diffusion',
  'sd',
  'dalle',
  'midjourney',
  'grok-2-image'
] as const;

/**
 * 精确匹配的图像生成模型 ID
 */
const IMAGE_MODEL_EXACT_IDS = [
  'grok-2-image-1212',
  'grok-2-image',
  'grok-2-image-latest',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-preview-image-generation'
] as const;

/**
 * 检测模型是否为图像生成模型
 * 
 * 检测优先级：
 * 1. modelTypes 中包含 'image_gen'（编辑界面的"输出能力"）
 * 2. imageGeneration 标志
 * 3. capabilities.imageGeneration
 * 4. modelTypes 中包含 'image-generation'（兼容旧格式）
 * 5. 基于模型 ID 的模式匹配
 * 6. 精确 ID 匹配
 * 7. 特殊情况：gemini-2.0-flash-exp 且 imageGeneration 为 true
 */
export function isImageGenerationModel(model: Model): boolean {
  // 1. 检查 modelTypes 中的 image_gen
  if (model.modelTypes?.includes('image_gen' as any)) {
    return true;
  }

  // 2. 检查 imageGeneration 标志
  if (model.imageGeneration) {
    return true;
  }

  // 3. 检查 capabilities.imageGeneration
  if (model.capabilities?.imageGeneration) {
    return true;
  }

  // 4. 兼容旧的字符串格式
  if (model.modelTypes?.includes('image-generation' as any)) {
    return true;
  }

  const modelIdLower = model.id.toLowerCase();

  // 5. 基于模型 ID 的模式匹配
  for (const pattern of IMAGE_MODEL_PATTERNS) {
    if (modelIdLower.includes(pattern)) {
      return true;
    }
  }

  // 6. 精确 ID 匹配
  if (IMAGE_MODEL_EXACT_IDS.includes(model.id as any)) {
    return true;
  }

  return false;
}

/**
 * 检测是否使用 Gemini 提供商
 */
export function isGeminiProvider(model: Model): boolean {
  return model.provider === 'google' || model.id.startsWith('gemini-');
}
