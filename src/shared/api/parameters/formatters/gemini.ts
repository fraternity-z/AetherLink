import type { Model } from '../../../types';
import type { UnifiedParameters } from '../types';

/**
 * Gemini 参数格式转换器
 * 用于 Gemini 供应商
 */
export class GeminiParameterFormatter {
  static toAPIFormat(unified: UnifiedParameters, _model: Model): Record<string, any> {
    const params: Record<string, any> = {};

    // 基础参数（Gemini 使用 camelCase）
    if (unified.temperature !== undefined) params.temperature = unified.temperature;
    if (unified.topP !== undefined) params.topP = unified.topP;
    if (unified.maxOutputTokens !== undefined) params.maxOutputTokens = unified.maxOutputTokens;

    // Gemini 特有参数
    if (unified.topK !== undefined) params.topK = unified.topK;
    if (unified.stopSequences?.length) params.stopSequences = unified.stopSequences;

    // Thinking Config：从扩展参数读取
    const thinkingBudget = (unified as any).thinkingBudget;
    if (thinkingBudget) {
      params.thinkingConfig = {
        thinkingBudget,
        includeThoughts: true
      };
    }

    return params;
  }
}
