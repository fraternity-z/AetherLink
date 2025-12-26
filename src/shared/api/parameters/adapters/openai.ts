/**
 * OpenAI 参数适配器
 * 统一的参数管理，支持 Chat Completions API 和 Responses API
 */

import type { Model } from '../../../types';
import type {
  ParameterAdapter,
  ParameterManagerConfig,
  ResolvedParameters,
  UnifiedParameters,
  OpenAISpecificParameters
} from '../types';
import { UnifiedParameterManager } from '../UnifiedParameterManager';
import {
  isReasoningModel,
  isOpenAIReasoningModel,
  isClaudeReasoningModel,
  isGeminiReasoningModel,
  isQwenReasoningModel,
  isGrokReasoningModel,
  isDeepSeekReasoningModel
} from '../../../../config/models';
import { EFFORT_RATIO, DEFAULT_MAX_TOKENS, findTokenLimit } from '../../../config/constants';
import { getDefaultThinkingEffort, getAppSettings } from '../../../utils/settingsUtils';

/**
 * Chat Completions API 推理参数接口
 */
export interface ReasoningParameters {
  reasoning_effort?: 'low' | 'medium' | 'high' | string;
  enable_thinking?: boolean;
  thinking_budget?: number;
  thinking?: {
    type: string;
    budget_tokens?: number;
  };
}

/**
 * Responses API 推理参数接口
 */
export interface ResponsesAPIReasoningParameters {
  reasoning?: {
    effort?: string;
    summary?: 'auto' | 'concise' | 'detailed';
  };
  reasoning_effort?: string;
  enable_thinking?: boolean;
  thinking_budget?: number;
  thinking?: {
    type: string;
    budget_tokens?: number;
  };
}

/**
 * 基础参数接口（API 格式）
 */
export interface BaseAPIParameters {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * 完整 API 参数接口
 */
export interface CompleteAPIParameters extends BaseAPIParameters, Omit<OpenAISpecificParameters, 'reasoning_effort'>, ReasoningParameters {
  model: string;
  messages: any[];
  tools?: any[];
  signal?: AbortSignal;
}

/**
 * OpenAI 参数适配器
 */
export class OpenAIParameterAdapter implements ParameterAdapter<'openai'> {
  readonly providerType = 'openai' as const;
  private unifiedManager: UnifiedParameterManager;

  constructor(config: ParameterManagerConfig) {
    this.unifiedManager = new UnifiedParameterManager({
      ...config,
      providerType: 'openai'
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
      topP: 1.0,
      maxOutputTokens: 4096,
      stream: true
    };
  }

  /**
   * 解析统一参数
   */
  resolve(config: ParameterManagerConfig): ResolvedParameters<'openai'> {
    if (config.assistant) {
      this.unifiedManager.updateAssistant(config.assistant);
    }

    const model = config.model || this.unifiedManager.getModel();
    const isReasoning = isReasoningModel(model);

    const base = this.unifiedManager.getBaseParameters();
    const extended = this.unifiedManager.getExtendedParameters();
    const reasoning = this.unifiedManager.getReasoningParameters(isReasoning);

    return {
      base,
      extended,
      reasoning,
      providerSpecific: this.getOpenAISpecificParameters()
    };
  }

  /**
   * 获取 OpenAI 特定参数
   */
  public getOpenAISpecificParameters(): OpenAISpecificParameters {
    const assistant = this.unifiedManager.getAssistant();
    const params: OpenAISpecificParameters = {};

    // Frequency Penalty
    if (assistant?.frequencyPenalty !== undefined && assistant.frequencyPenalty !== 0) {
      params.frequency_penalty = assistant.frequencyPenalty;
    }

    // Presence Penalty
    if (assistant?.presencePenalty !== undefined && assistant.presencePenalty !== 0) {
      params.presence_penalty = assistant.presencePenalty;
    }

    // Top-K
    if (assistant?.topK !== undefined && assistant.topK !== 40) {
      params.top_k = assistant.topK;
    }

    // Seed
    if (assistant?.seed !== undefined && assistant.seed !== null) {
      params.seed = assistant.seed;
    }

    // Stop Sequences
    if (assistant?.stopSequences && Array.isArray(assistant.stopSequences) && assistant.stopSequences.length > 0) {
      params.stop = assistant.stopSequences;
    }

    // Logit Bias
    if (assistant?.logitBias && Object.keys(assistant.logitBias).length > 0) {
      params.logit_bias = assistant.logitBias;
    }

    // Response Format
    if (assistant?.responseFormat && assistant.responseFormat !== 'text') {
      params.response_format = { type: assistant.responseFormat };
    }

    // Tool Choice
    if (assistant?.toolChoice && assistant.toolChoice !== 'auto') {
      params.tool_choice = assistant.toolChoice;
    }

    // Parallel Tool Calls
    if (assistant?.parallelToolCalls !== undefined && assistant.parallelToolCalls !== true) {
      params.parallel_tool_calls = assistant.parallelToolCalls;
    }

    // Store (是否存储对话)
    if (assistant?.store !== undefined) {
      params.store = assistant.store;
    }

    // User (用户标识符)
    if (assistant?.user) {
      params.user = assistant.user;
    }

    // Logprobs (token 概率)
    if (assistant?.logprobs !== undefined) {
      params.logprobs = assistant.logprobs;
    }

    // Top Logprobs
    if (assistant?.topLogprobs !== undefined) {
      params.top_logprobs = assistant.topLogprobs;
    }

    // Max Steps (多轮工具调用)
    if (assistant?.maxSteps !== undefined && assistant.maxSteps > 1) {
      params.maxSteps = assistant.maxSteps;
    }

    return params;
  }

  /**
   * 获取基础 API 参数（API 格式: snake_case）
   */
  getBaseAPIParameters(): BaseAPIParameters {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();
    const appSettings = getAppSettings();
    
    const params: BaseAPIParameters = {
      stream: true // 默认流式
    };

    // 温度参数
    if (appSettings.enableTemperature) {
      params.temperature = appSettings.temperature ?? 0.7;
    } else {
      const temp = assistant?.settings?.temperature ?? 
                   assistant?.temperature ?? 
                   model.temperature;
      if (temp !== undefined) {
        params.temperature = temp;
      }
    }

    // TopP 参数
    if (appSettings.enableTopP) {
      params.top_p = appSettings.topP ?? 1.0;
    } else {
      const topP = assistant?.settings?.topP ?? 
                   assistant?.topP ?? 
                   (model as any).top_p;
      if (topP !== undefined) {
        params.top_p = topP;
      }
    }

    // 最大输出 token
    if (appSettings.enableMaxOutputTokens !== false) {
      const maxTokens = assistant?.settings?.maxTokens ?? 
                        assistant?.maxTokens ?? 
                        model.maxTokens ?? 
                        4096;
      params.max_tokens = Math.max(maxTokens, 1);
    }

    return params;
  }

  /**
   * 获取推理参数 - Chat Completions API 格式
   */
  getReasoningParameters(): ReasoningParameters {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();

    if (!isReasoningModel(model)) {
      return {};
    }

    const reasoningEffort = assistant?.settings?.reasoning_effort || getDefaultThinkingEffort();

    console.log(`[OpenAIParameterAdapter] 模型 ${model.id} 推理努力程度: ${reasoningEffort}`);

    if (reasoningEffort === 'disabled' || reasoningEffort === 'none' || reasoningEffort === 'off') {
      return this.getDisabledReasoningParameters();
    }

    return this.getEnabledReasoningParameters(reasoningEffort);
  }

  /**
   * 获取 Responses API 格式的推理参数
   */
  getResponsesAPIReasoningParameters(): ResponsesAPIReasoningParameters {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();

    if (!isReasoningModel(model)) {
      return {};
    }

    const reasoningEffort = assistant?.settings?.reasoning_effort || getDefaultThinkingEffort();

    console.log(`[OpenAIParameterAdapter] Responses API 模型 ${model.id} 推理努力程度: ${reasoningEffort}`);

    if (reasoningEffort === 'disabled' || reasoningEffort === 'none' || reasoningEffort === 'off') {
      return this.getDisabledResponsesAPIReasoningParameters();
    }

    return this.getEnabledResponsesAPIReasoningParameters(reasoningEffort);
  }

  /**
   * 获取禁用推理的参数 - Chat Completions API 格式
   */
  private getDisabledReasoningParameters(): ReasoningParameters {
    const model = this.unifiedManager.getModel();

    // Qwen 模型
    if (isQwenReasoningModel(model)) {
      return { enable_thinking: false };
    }

    // Claude 模型
    if (isClaudeReasoningModel(model)) {
      return { thinking: { type: 'disabled' } };
    }

    // Gemini 模型
    if (isGeminiReasoningModel(model)) {
      return { reasoning_effort: 'none' };
    }

    // DeepSeek、OpenAI、Grok 模型：不支持禁用推理
    if (isDeepSeekReasoningModel(model) ||
        isOpenAIReasoningModel(model) ||
        isGrokReasoningModel(model)) {
      console.log(`[OpenAIParameterAdapter] ${model.id} 模型不支持禁用推理，跳过推理参数`);
      return {};
    }

    return {};
  }

  /**
   * 获取禁用推理的参数 - Responses API 格式
   */
  private getDisabledResponsesAPIReasoningParameters(): ResponsesAPIReasoningParameters {
    const model = this.unifiedManager.getModel();

    // Qwen 模型
    if (isQwenReasoningModel(model)) {
      return { enable_thinking: false };
    }

    // Claude 模型
    if (isClaudeReasoningModel(model)) {
      return { thinking: { type: 'disabled' } };
    }

    // OpenAI 推理模型：Responses API 不支持禁用推理
    if (isOpenAIReasoningModel(model)) {
      console.log(`[OpenAIParameterAdapter] Responses API ${model.id} 模型不支持禁用推理，跳过推理参数`);
      return {};
    }

    return {};
  }

  /**
   * 获取启用推理的参数 - Chat Completions API 格式
   */
  private getEnabledReasoningParameters(reasoningEffort: string): ReasoningParameters {
    const model = this.unifiedManager.getModel();
    const effortRatio = EFFORT_RATIO[reasoningEffort as keyof typeof EFFORT_RATIO] || 0.3;
    const tokenLimit = findTokenLimit(model.id);

    if (!tokenLimit) {
      return this.getDefaultReasoningParameters(reasoningEffort);
    }

    const budgetTokens = Math.floor(
      (tokenLimit.max - tokenLimit.min) * effortRatio + tokenLimit.min
    );

    return this.getModelSpecificReasoningParameters(reasoningEffort, budgetTokens, effortRatio);
  }

  /**
   * 获取启用推理的参数 - Responses API 格式
   */
  private getEnabledResponsesAPIReasoningParameters(reasoningEffort: string): ResponsesAPIReasoningParameters {
    const model = this.unifiedManager.getModel();
    const effortRatio = EFFORT_RATIO[reasoningEffort as keyof typeof EFFORT_RATIO] || 0.3;
    const tokenLimit = findTokenLimit(model.id);

    if (!tokenLimit) {
      return this.getDefaultResponsesAPIReasoningParameters(reasoningEffort);
    }

    const budgetTokens = Math.floor(
      (tokenLimit.max - tokenLimit.min) * effortRatio + tokenLimit.min
    );

    return this.getModelSpecificResponsesAPIReasoningParameters(reasoningEffort, budgetTokens, effortRatio);
  }

  /**
   * 获取默认推理参数（当找不到 token 限制时）
   */
  private getDefaultReasoningParameters(reasoningEffort: string): ReasoningParameters {
    const model = this.unifiedManager.getModel();

    if (isDeepSeekReasoningModel(model)) {
      const supportedEffort = reasoningEffort === 'medium' ? 'high' : reasoningEffort;
      if (supportedEffort === 'low' || supportedEffort === 'high') {
        return { reasoning_effort: supportedEffort };
      }
      console.log(`[OpenAIParameterAdapter] DeepSeek 模型不支持推理努力程度 ${reasoningEffort}，跳过推理参数`);
      return {};
    }

    return { reasoning_effort: reasoningEffort };
  }

  /**
   * 获取默认 Responses API 推理参数
   */
  private getDefaultResponsesAPIReasoningParameters(reasoningEffort: string): ResponsesAPIReasoningParameters {
    const model = this.unifiedManager.getModel();

    // OpenAI 推理模型使用 Responses API 格式
    if (isOpenAIReasoningModel(model)) {
      return {
        reasoning: {
          effort: reasoningEffort,
          summary: 'auto'
        }
      };
    }

    if (isDeepSeekReasoningModel(model)) {
      const supportedEffort = reasoningEffort === 'medium' ? 'high' : reasoningEffort;
      if (supportedEffort === 'low' || supportedEffort === 'high') {
        return { reasoning_effort: supportedEffort };
      }
      console.log(`[OpenAIParameterAdapter] DeepSeek 模型不支持推理努力程度 ${reasoningEffort}，跳过推理参数`);
      return {};
    }

    return { reasoning_effort: reasoningEffort };
  }

  /**
   * 获取特定模型的推理参数 - Chat Completions API 格式
   */
  private getModelSpecificReasoningParameters(
    reasoningEffort: string,
    budgetTokens: number,
    effortRatio: number
  ): ReasoningParameters {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();

    // OpenAI 模型
    if (isOpenAIReasoningModel(model)) {
      return { reasoning_effort: reasoningEffort };
    }

    // DeepSeek 推理模型
    if (isDeepSeekReasoningModel(model)) {
      const supportedEffort = reasoningEffort === 'medium' ? 'high' : reasoningEffort;
      if (supportedEffort === 'low' || supportedEffort === 'high') {
        return { reasoning_effort: supportedEffort };
      }
      console.log(`[OpenAIParameterAdapter] DeepSeek 模型不支持推理努力程度 ${reasoningEffort}，跳过推理参数`);
      return {};
    }

    // Qwen 模型
    if (isQwenReasoningModel(model)) {
      return {
        enable_thinking: true,
        thinking_budget: budgetTokens
      };
    }

    // Grok 模型
    if (isGrokReasoningModel(model)) {
      const supportedEffort = reasoningEffort === 'medium' ? 'high' : reasoningEffort;
      if (supportedEffort === 'low' || supportedEffort === 'high') {
        return { reasoning_effort: supportedEffort };
      }
      console.log(`[OpenAIParameterAdapter] Grok 模型不支持推理努力程度 ${reasoningEffort}，跳过推理参数`);
      return {};
    }

    // Gemini 模型
    if (isGeminiReasoningModel(model)) {
      return { reasoning_effort: reasoningEffort };
    }

    // Claude 模型
    if (isClaudeReasoningModel(model)) {
      const maxTokens = assistant?.settings?.maxTokens;
      return {
        thinking: {
          type: 'enabled',
          budget_tokens: Math.max(1024, Math.min(budgetTokens, (maxTokens || DEFAULT_MAX_TOKENS) * effortRatio))
        }
      };
    }

    return {};
  }

  /**
   * 获取特定模型的推理参数 - Responses API 格式
   */
  private getModelSpecificResponsesAPIReasoningParameters(
    reasoningEffort: string,
    budgetTokens: number,
    effortRatio: number
  ): ResponsesAPIReasoningParameters {
    const model = this.unifiedManager.getModel();
    const assistant = this.unifiedManager.getAssistant();

    // OpenAI 模型 - 使用 Responses API 格式
    if (isOpenAIReasoningModel(model)) {
      return {
        reasoning: {
          effort: reasoningEffort,
          summary: 'auto'
        }
      };
    }

    // DeepSeek 推理模型
    if (isDeepSeekReasoningModel(model)) {
      const supportedEffort = reasoningEffort === 'medium' ? 'high' : reasoningEffort;
      if (supportedEffort === 'low' || supportedEffort === 'high') {
        return { reasoning_effort: supportedEffort };
      }
      console.log(`[OpenAIParameterAdapter] DeepSeek 模型不支持推理努力程度 ${reasoningEffort}，跳过推理参数`);
      return {};
    }

    // Qwen 模型
    if (isQwenReasoningModel(model)) {
      return {
        enable_thinking: true,
        thinking_budget: budgetTokens
      };
    }

    // Claude 模型
    if (isClaudeReasoningModel(model)) {
      const maxTokens = assistant?.settings?.maxTokens;
      return {
        thinking: {
          type: 'enabled',
          budget_tokens: Math.max(1024, Math.min(budgetTokens, (maxTokens || DEFAULT_MAX_TOKENS) * effortRatio))
        }
      };
    }

    return {};
  }

  /**
   * 获取完整的 API 参数
   */
  getCompleteParameters(messages: any[], options?: {
    enableWebSearch?: boolean;
    enableTools?: boolean;
    tools?: any[];
    abortSignal?: AbortSignal;
  }): CompleteAPIParameters {
    const model = this.unifiedManager.getModel();
    const baseParams = this.getBaseAPIParameters();
    const specificParams = this.getOpenAISpecificParameters();
    const reasoningParams = this.getReasoningParameters();

    const completeParams: CompleteAPIParameters = {
      model: model.id,
      messages,
      ...baseParams,
      ...specificParams,
      ...reasoningParams
    };

    // 添加工具参数
    if (options?.enableTools && options?.tools && options.tools.length > 0) {
      completeParams.tools = options.tools;
      completeParams.tool_choice = completeParams.tool_choice || 'auto';
    }

    // 添加中断信号
    if (options?.abortSignal) {
      completeParams.signal = options.abortSignal;
    }

    // 合并自定义请求体参数
    const extraBody = (model as any).extraBody || (model as any).providerExtraBody;
    if (extraBody && typeof extraBody === 'object') {
      Object.assign(completeParams, extraBody);
      console.log(`[OpenAIParameterAdapter] 合并自定义请求体参数: ${Object.keys(extraBody).join(', ')}`);
    }

    return completeParams;
  }

  /**
   * 验证参数有效性
   */
  validateParameters(params: Partial<CompleteAPIParameters>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }

    if (params.max_tokens !== undefined && params.max_tokens < 1) {
      errors.push('max_tokens must be greater than 0');
    }

    if (params.frequency_penalty !== undefined && (params.frequency_penalty < -2 || params.frequency_penalty > 2)) {
      errors.push('frequency_penalty must be between -2 and 2');
    }

    if (params.presence_penalty !== undefined && (params.presence_penalty < -2 || params.presence_penalty > 2)) {
      errors.push('presence_penalty must be between -2 and 2');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 转换为 OpenAI API 格式
   */
  toAPIFormat(params: ResolvedParameters<'openai'>): Record<string, any> {
    const apiParams: Record<string, any> = {};

    // 只有参数存在时才添加
    if (params.base.temperature !== undefined) {
      apiParams.temperature = params.base.temperature;
    }
    if (params.base.topP !== undefined) {
      apiParams.top_p = params.base.topP;
    }
    if (params.base.stream !== undefined) {
      apiParams.stream = params.base.stream;
    }
    if (params.base.maxOutputTokens !== undefined) {
      apiParams.max_tokens = params.base.maxOutputTokens;
    }

    // 添加 OpenAI 特定参数
    Object.assign(apiParams, params.providerSpecific);

    // 添加推理参数
    if (params.reasoning?.enabled) {
      const reasoningParams = this.getReasoningParameters();
      Object.assign(apiParams, reasoningParams);
    }

    return apiParams;
  }
}

/**
 * 创建 OpenAI 参数适配器
 */
export function createOpenAIAdapter(config: ParameterManagerConfig): OpenAIParameterAdapter {
  return new OpenAIParameterAdapter(config);
}
