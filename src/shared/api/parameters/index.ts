/**
 * 统一参数管理器模块导出
 * 为所有 AI 供应商提供统一的参数管理接口
 */

// 类型导出
export type {
  ProviderType,
  ReasoningEffort,
  UnifiedBaseParameters,
  UnifiedExtendedParameters,
  UnifiedReasoningParameters,
  UnifiedParameters,
  OpenAISpecificParameters,
  AnthropicSpecificParameters,
  GeminiSpecificParameters,
  ProviderSpecificParametersMap,
  ParameterManagerConfig,
  ResolvedParameters,
  ParameterAdapter
} from './types';

// 核心管理器
export {
  UnifiedParameterManager,
  createUnifiedParameterManager
} from './UnifiedParameterManager';

// OpenAI 适配器
import { OpenAIParameterAdapter, createOpenAIAdapter } from './adapters/openai';
export { OpenAIParameterAdapter, createOpenAIAdapter };

// OpenAI 适配器类型
export type {
  ReasoningParameters,
  ResponsesAPIReasoningParameters,
  BaseAPIParameters,
  CompleteAPIParameters
} from './adapters/openai';

// Anthropic 适配器
import { AnthropicParameterAdapter, createAnthropicAdapter } from './adapters/anthropic';
export { AnthropicParameterAdapter, createAnthropicAdapter };

// Gemini 适配器
import { GeminiParameterAdapter, createGeminiAdapter } from './adapters/gemini';
export { GeminiParameterAdapter, createGeminiAdapter };

// 格式转换器
export {
  OpenAIParameterFormatter,
  AnthropicParameterFormatter,
  GeminiParameterFormatter
} from './formatters';

/**
 * 根据供应商类型创建对应的参数适配器
 */
export function createParameterAdapter(config: import('./types').ParameterManagerConfig) {
  const providerType = config.providerType || detectProviderType(config.model);
  
  switch (providerType) {
    case 'anthropic':
      return new AnthropicParameterAdapter(config);
    case 'gemini':
      return new GeminiParameterAdapter(config);
    case 'openai':
    case 'openai-compatible':
    default:
      return new OpenAIParameterAdapter(config);
  }
}

/**
 * 检测供应商类型
 */
function detectProviderType(model: import('../../types').Model): import('./types').ProviderType {
  const provider = model.provider?.toLowerCase() || '';
  
  if (provider.includes('anthropic') || provider.includes('claude')) {
    return 'anthropic';
  }
  if (provider.includes('gemini') || provider.includes('google')) {
    return 'gemini';
  }
  if (provider.includes('openai') || provider === 'azure') {
    return 'openai';
  }
  
  return 'openai-compatible';
}
