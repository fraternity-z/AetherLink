/**
 * Gemini 参数适配器
 * 处理 Google Gemini 模型的参数转换
 */

import type { Model } from '../../../types';
import type {
  ParameterAdapter,
  ParameterManagerConfig,
  ResolvedParameters,
  UnifiedParameters,
  GeminiSpecificParameters
} from '../types';
import { UnifiedParameterManager } from '../UnifiedParameterManager';
import { isGeminiReasoningModel } from '../../../../config/models';
import { getThinkingBudget } from '../../../utils/settingsUtils';

/**
 * Gemini 参数适配器
 */
export class GeminiParameterAdapter implements ParameterAdapter<'gemini'> {
  readonly providerType = 'gemini' as const;
  private unifiedManager: UnifiedParameterManager;

  constructor(config: ParameterManagerConfig) {
    this.unifiedManager = new UnifiedParameterManager({
      ...config,
      providerType: 'gemini'
    });
  }

  /**
   * 更新助手配置
   */
  updateAssistant(assistant?: any): void {
    this.unifiedManager.updateAssistant(assistant);
  }

  /**
   * 更新模型配置
   */
  updateModel(model: Model): void {
    this.unifiedManager.updateModel(model);
  }

  /**
   * 获取默认值
   */
  getDefaults(): Partial<UnifiedParameters> {
    return {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
      stream: true
    };
  }

  /**
   * 解析统一参数
   */
  resolve(config: ParameterManagerConfig): ResolvedParameters<'gemini'> {
    if (config.assistant) {
      this.unifiedManager.updateAssistant(config.assistant);
    }

    const model = config.model || this.unifiedManager.getModel();
    const isReasoning = isGeminiReasoningModel(model);

    const base = this.unifiedManager.getBaseParameters();
    const extended = this.unifiedManager.getExtendedParameters();
    const reasoning = this.unifiedManager.getReasoningParameters(isReasoning);

    return {
      base,
      extended,
      reasoning,
      providerSpecific: this.getGeminiSpecificParameters()
    };
  }

  /**
   * 获取 Gemini 特定参数
   */
  private getGeminiSpecificParameters(): GeminiSpecificParameters {
    const assistant = this.unifiedManager.getAssistant();
    const model = this.unifiedManager.getModel();
    const params: GeminiSpecificParameters = {};

    // Top-K
    if (assistant?.topK !== undefined) {
      params.topK = assistant.topK;
    }

    // Stop Sequences
    if (assistant?.stopSequences && Array.isArray(assistant.stopSequences) && assistant.stopSequences.length > 0) {
      params.stopSequences = assistant.stopSequences;
    }

    // Thinking Config (for reasoning models)
    if (isGeminiReasoningModel(model)) {
      const thinkingBudget = assistant?.thinkingBudget || getThinkingBudget() || 1024;
      params.thinkingConfig = {
        thinkingBudget,
        includeThoughts: assistant?.includeThoughts !== false
      };
    }

    // Google Search Grounding
    if (assistant?.useSearchGrounding) {
      params.useSearchGrounding = true;
    }

    // Google Search Config
    if (assistant?.googleSearchConfig) {
      params.googleSearchConfig = assistant.googleSearchConfig;
    }

    // Safety Settings
    if (assistant?.safetySettings && Array.isArray(assistant.safetySettings)) {
      params.safetySettings = assistant.safetySettings;
    }

    // Person Generation (图像生成)
    if (assistant?.personGeneration) {
      params.personGeneration = assistant.personGeneration;
    }

    // Negative Prompt (图像生成)
    if (assistant?.negativePrompt) {
      params.negativePrompt = assistant.negativePrompt;
    }

    // Candidate Count
    if (assistant?.candidateCount !== undefined && assistant.candidateCount > 1) {
      params.candidateCount = assistant.candidateCount;
    }

    // Response MIME Type
    if (assistant?.responseMimeType) {
      params.responseMimeType = assistant.responseMimeType;
    }

    // Response Schema
    if (assistant?.responseSchema) {
      params.responseSchema = assistant.responseSchema;
    }

    return params;
  }

  /**
   * 获取思考预算
   */
  getThinkingBudget(): number {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();

    if (!isGeminiReasoningModel(model)) {
      return 0;
    }

    return assistant?.thinkingBudget || getThinkingBudget() || 1024;
  }

  /**
   * 转换为 Gemini API 格式
   */
  toAPIFormat(params: ResolvedParameters<'gemini'>): Record<string, any> {
    const apiParams: Record<string, any> = {
      temperature: params.base.temperature,
      topP: params.base.topP
    };

    // 处理 maxOutputTokens
    if (!(params.base as any)._skipMaxOutputTokens) {
      apiParams.maxOutputTokens = params.base.maxOutputTokens;
    }

    // 添加 Gemini 特定参数
    if (params.providerSpecific.topK !== undefined) {
      apiParams.topK = params.providerSpecific.topK;
    }
    if (params.providerSpecific.stopSequences) {
      apiParams.stopSequences = params.providerSpecific.stopSequences;
    }
    if (params.providerSpecific.thinkingConfig) {
      apiParams.thinkingConfig = params.providerSpecific.thinkingConfig;
    }
    if (params.providerSpecific.useSearchGrounding) {
      apiParams.useSearchGrounding = params.providerSpecific.useSearchGrounding;
    }
    if (params.providerSpecific.safetySettings) {
      apiParams.safetySettings = params.providerSpecific.safetySettings;
    }

    return apiParams;
  }
}

/**
 * 创建 Gemini 参数适配器
 */
export function createGeminiAdapter(config: ParameterManagerConfig): GeminiParameterAdapter {
  return new GeminiParameterAdapter(config);
}
