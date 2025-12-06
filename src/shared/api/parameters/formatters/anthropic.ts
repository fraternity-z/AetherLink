import type { Model } from '../../../types';
import type { UnifiedParameters } from '../types';

/**
 * Anthropic 参数格式转换器
 * 用于 Anthropic 供应商
 */
export class AnthropicParameterFormatter {
  static toAPIFormat(unified: UnifiedParameters, _model: Model): Record<string, any> {
    const params: Record<string, any> = {};

    // 基础参数
    if (unified.temperature !== undefined) params.temperature = unified.temperature;
    if (unified.topP !== undefined) params.top_p = unified.topP;
    if (unified.maxOutputTokens !== undefined) params.max_tokens = unified.maxOutputTokens;

    // Anthropic 特有参数
    if (unified.topK !== undefined) params.top_k = unified.topK;
    if (unified.stopSequences?.length) params.stop_sequences = unified.stopSequences;

    // User 标识符
    const user = (unified as any).user;
    if (user) {
      (params as any).user = user;
    }

    // Extended Thinking：从扩展参数读取
    const thinkingBudget = (unified as any).thinkingBudget;
    if (thinkingBudget) {
      params.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget
      };
    }

    return params;
  }
}
