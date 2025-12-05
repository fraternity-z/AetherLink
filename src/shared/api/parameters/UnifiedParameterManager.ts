/**
 * 统一参数管理器
 * 为所有 AI 供应商提供统一的参数解析和管理
 */

import type { Model } from '../../types';
import type {
  ProviderType,
  ParameterAdapter,
  ParameterManagerConfig,
  UnifiedParameters,
  UnifiedBaseParameters,
  UnifiedExtendedParameters,
  UnifiedReasoningParameters
} from './types';
import { getAppSettings, getStreamOutputSetting, getDefaultThinkingEffort } from '../../utils/settingsUtils';

/**
 * 统一参数管理器类
 */
export class UnifiedParameterManager {
  private model: Model;
  private assistant?: any;
  private providerType: ProviderType;
  private adapters: Map<ProviderType, ParameterAdapter> = new Map();

  constructor(config: ParameterManagerConfig) {
    this.model = config.model;
    this.assistant = config.assistant;
    this.providerType = config.providerType || this.detectProviderType();
  }

  /**
   * 检测供应商类型
   */
  private detectProviderType(): ProviderType {
    const provider = this.model.provider?.toLowerCase() || '';
    
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

  /**
   * 注册参数适配器
   */
  public registerAdapter(adapter: ParameterAdapter): void {
    this.adapters.set(adapter.providerType, adapter);
  }

  /**
   * 更新模型
   */
  public updateModel(model: Model): void {
    this.model = model;
    this.providerType = this.detectProviderType();
  }

  /**
   * 更新助手配置
   */
  public updateAssistant(assistant?: any): void {
    this.assistant = assistant;
  }

  /**
   * 解析基础参数
   * 优先级: 全局设置(如已启用) > assistant.settings > assistant > model > 不发送
   */
  public getBaseParameters(overrides?: Partial<UnifiedBaseParameters>): UnifiedBaseParameters {
    const assistantSettings = this.assistant?.settings || {};
    const appSettings = getAppSettings();

    const params: UnifiedBaseParameters = {
      stream: overrides?.stream ?? getStreamOutputSetting()
    };

    // 温度: 只有启用时才发送
    if (appSettings.enableTemperature) {
      params.temperature = appSettings.temperature ?? 0.7;
    } else if (overrides?.temperature !== undefined) {
      params.temperature = overrides.temperature;
    } else if (assistantSettings.temperature !== undefined) {
      params.temperature = assistantSettings.temperature;
    } else if (this.assistant?.temperature !== undefined) {
      params.temperature = this.assistant.temperature;
    } else if (this.model?.temperature !== undefined) {
      params.temperature = this.model.temperature;
    }
    // 如果都没设置，不发送 temperature 参数

    // TopP: 只有启用时才发送
    if (appSettings.enableTopP) {
      params.topP = appSettings.topP ?? 1.0;
    } else if (overrides?.topP !== undefined) {
      params.topP = overrides.topP;
    } else if (assistantSettings.topP !== undefined) {
      params.topP = assistantSettings.topP;
    } else if (this.assistant?.topP !== undefined) {
      params.topP = this.assistant.topP;
    } else if ((this.model as any)?.topP !== undefined) {
      params.topP = (this.model as any).topP;
    } else if ((this.model as any)?.top_p !== undefined) {
      params.topP = (this.model as any).top_p;
    }
    // 如果都没设置，不发送 topP 参数

    // maxOutputTokens: 只有启用时才发送
    if (appSettings.enableMaxOutputTokens !== false) {
      params.maxOutputTokens = overrides?.maxOutputTokens ??
                               assistantSettings.maxTokens ??
                               assistantSettings.maxOutputTokens ??
                               this.assistant?.maxTokens ??
                               this.model?.maxTokens ??
                               appSettings.maxOutputTokens ??
                               4096;
    }

    return params;
  }

  /**
   * 解析扩展参数
   * 优先级: 全局设置(如已启用) > assistant.settings > assistant > model > 不发送
   */
  public getExtendedParameters(overrides?: Partial<UnifiedExtendedParameters>): UnifiedExtendedParameters {
    const assistantSettings = this.assistant?.settings || {};
    const appSettings = getAppSettings();
    const params: UnifiedExtendedParameters = {};

    // Top-K: 只有启用时才发送
    if (appSettings.enableTopK) {
      params.topK = appSettings.topK ?? 40;
    } else if (overrides?.topK !== undefined) {
      params.topK = overrides.topK;
    } else if (assistantSettings.topK !== undefined) {
      params.topK = assistantSettings.topK;
    } else if (this.assistant?.topK !== undefined && this.assistant.topK !== 40) {
      params.topK = this.assistant.topK;
    }

    // Presence Penalty: 只有启用时才发送
    if (appSettings.enablePresencePenalty) {
      params.presencePenalty = appSettings.presencePenalty ?? 0;
    } else if (overrides?.presencePenalty !== undefined) {
      params.presencePenalty = overrides.presencePenalty;
    } else if (assistantSettings.presencePenalty !== undefined) {
      params.presencePenalty = assistantSettings.presencePenalty;
    } else if (this.assistant?.presencePenalty !== undefined && this.assistant.presencePenalty !== 0) {
      params.presencePenalty = this.assistant.presencePenalty;
    }

    // Frequency Penalty: 只有启用时才发送
    if (appSettings.enableFrequencyPenalty) {
      params.frequencyPenalty = appSettings.frequencyPenalty ?? 0;
    } else if (overrides?.frequencyPenalty !== undefined) {
      params.frequencyPenalty = overrides.frequencyPenalty;
    } else if (assistantSettings.frequencyPenalty !== undefined) {
      params.frequencyPenalty = assistantSettings.frequencyPenalty;
    } else if (this.assistant?.frequencyPenalty !== undefined && this.assistant.frequencyPenalty !== 0) {
      params.frequencyPenalty = this.assistant.frequencyPenalty;
    }

    // Stop Sequences
    const stopSequences = overrides?.stopSequences ?? 
                         assistantSettings.stopSequences ?? 
                         this.assistant?.stopSequences;
    if (stopSequences && Array.isArray(stopSequences) && stopSequences.length > 0) {
      params.stopSequences = stopSequences;
    }

    // Seed: 只有启用时才发送
    if (appSettings.enableSeed) {
      params.seed = appSettings.seed;
    } else if (overrides?.seed !== undefined) {
      params.seed = overrides.seed;
    } else if (assistantSettings.seed !== undefined) {
      params.seed = assistantSettings.seed;
    } else if (this.assistant?.seed !== undefined && this.assistant.seed !== null) {
      params.seed = this.assistant.seed;
    }

    // Response Format
    const responseFormat = assistantSettings.responseFormat ?? this.assistant?.responseFormat;
    if (responseFormat && responseFormat !== 'text') {
      params.responseFormat = { type: responseFormat };
    }

    // Tool Choice
    const toolChoice = assistantSettings.toolChoice ?? this.assistant?.toolChoice;
    if (toolChoice && toolChoice !== 'auto') {
      params.toolChoice = toolChoice;
    }

    return params;
  }

  /**
   * 解析推理参数
   */
  public getReasoningParameters(isReasoningModel: boolean): UnifiedReasoningParameters | undefined {
    if (!isReasoningModel) {
      return undefined;
    }

    const settings = this.assistant?.settings || {};
    const effort = settings.reasoning_effort || getDefaultThinkingEffort();

    // 检查是否禁用
    if (effort === 'disabled' || effort === 'none' || effort === 'off') {
      return {
        enabled: false,
        effort: 'disabled'
      };
    }

    return {
      enabled: true,
      effort: effort as any,
      budgetTokens: settings.thinkingBudget || settings.budgetTokens
    };
  }

  /**
   * 获取完整的统一参数
   */
  public getUnifiedParameters(
    isReasoningModel: boolean = false,
    overrides?: Partial<UnifiedParameters>
  ): UnifiedParameters {
    const base = this.getBaseParameters(overrides);
    const extended = this.getExtendedParameters(overrides);
    const reasoning = this.getReasoningParameters(isReasoningModel);

    return {
      ...base,
      ...extended,
      reasoning
    };
  }

  /**
   * 获取当前供应商类型
   */
  public getProviderType(): ProviderType {
    return this.providerType;
  }

  /**
   * 获取模型
   */
  public getModel(): Model {
    return this.model;
  }

  /**
   * 获取助手配置
   */
  public getAssistant(): any {
    return this.assistant;
  }
}

/**
 * 创建统一参数管理器实例
 */
export function createUnifiedParameterManager(config: ParameterManagerConfig): UnifiedParameterManager {
  return new UnifiedParameterManager(config);
}
