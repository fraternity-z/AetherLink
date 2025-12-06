/**
 * 统一参数管理器
 * 为所有 AI 供应商提供统一的参数解析和管理
 */

import type { Model } from '../../types';
import type { CustomParameter } from '../../types/Assistant';
import type {
  ProviderType,
  ParameterAdapter,
  ParameterManagerConfig,
  UnifiedParameters,
  UnifiedBaseParameters,
  UnifiedExtendedParameters,
  UnifiedReasoningParameters
} from './types';
import { parameterSyncService } from '../../services/ParameterSyncService';

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
   * 统一规则：只有启用开关打开才发送参数
   */
  public getBaseParameters(overrides?: Partial<UnifiedBaseParameters>): UnifiedBaseParameters {
    const params: UnifiedBaseParameters = {
      stream: overrides?.stream ?? parameterSyncService.getParameter('streamOutput', true)
    };

    // 检查启用开关后才添加参数
    if (parameterSyncService.isParameterEnabled('temperature')) {
      params.temperature = parameterSyncService.getParameter('temperature', 0.7);
    }

    if (parameterSyncService.isParameterEnabled('topP')) {
      params.topP = parameterSyncService.getParameter('topP', 1.0);
    }

    if (parameterSyncService.isParameterEnabled('maxOutputTokens')) {
      params.maxOutputTokens = parameterSyncService.getParameter('maxOutputTokens', 4096);
    }

    return params;
  }

  /**
   * 解析扩展参数
   * 来源：ParameterSyncService（侧边栏设置）
   */
  public getExtendedParameters(_overrides?: Partial<UnifiedExtendedParameters>): UnifiedExtendedParameters {
    const params: UnifiedExtendedParameters = {};

    // 统一处理：只有启用的参数才添加
    const parameterList: Array<{
      key: any;
      targetKey?: string;
      defaultValue: any;
      validator?: (value: any) => boolean;
      transformer?: (value: any) => any;
    }> = [
      { key: 'topK', defaultValue: 40 },
      { key: 'frequencyPenalty', defaultValue: 0 },
      { key: 'presencePenalty', defaultValue: 0 },
      { key: 'seed', defaultValue: null, validator: (v) => v !== null },
      { 
        key: 'stopSequences', 
        defaultValue: [], 
        validator: (v) => Array.isArray(v) && v.length > 0 
      },
      { 
        key: 'responseFormat', 
        defaultValue: 'text',
        validator: (v) => v && v !== 'text',
        transformer: (v) => ({ type: v })
      },
      { key: 'parallelToolCalls', defaultValue: true },
      { 
        key: 'user', 
        defaultValue: '', 
        validator: (v) => typeof v === 'string' && v.trim().length > 0 
      },
      { 
        key: 'reasoningEffort', 
        defaultValue: 'medium',
        validator: (v) => v && v !== 'off' && v !== 'disabled' && v !== 'none'
      },
      { key: 'thinkingBudget', defaultValue: 1024, validator: (v) => !!v }
    ];

    for (const { key, targetKey, defaultValue, validator, transformer } of parameterList) {
      if (parameterSyncService.isParameterEnabled(key)) {
        let value = parameterSyncService.getParameter(key, defaultValue);
        
        // 验证值
        if (!validator || validator(value)) {
          // 转换值
          if (transformer) {
            value = transformer(value);
          }
          // 添加到参数对象
          (params as any)[targetKey || key] = value;
        }
      }
    }

    return params;
  }

  /**
   * 解析推理参数（保留接口兼容性，实际已移到扩展参数中）
   */
  public getReasoningParameters(_isReasoningModel?: boolean): UnifiedReasoningParameters | undefined {
    return undefined;
  }

  /**
   * 获取自定义参数（转换为 API 格式）
   * 参考 Cherry Studio 实现
   */
  public getCustomParameters(): Record<string, any> {
    const customParams: CustomParameter[] = parameterSyncService.getCustomParameters();
    
    return customParams.reduce((acc: Record<string, any>, param: CustomParameter) => {
      if (!param.name?.trim()) {
        return acc;
      }
      
      if (param.type === 'json') {
        const value = param.value as string;
        if (value === 'undefined') {
          return { ...acc, [param.name]: undefined };
        }
        try {
          return { ...acc, [param.name]: JSON.parse(value as string) };
        } catch {
          return { ...acc, [param.name]: value };
        }
      }
      
      return {
        ...acc,
        [param.name]: param.value
      };
    }, {});
  }

  /**
   * 获取完整的统一参数（包含自定义参数）
   */
  public getUnifiedParameters(
    isReasoningModel: boolean = false,
    overrides?: Partial<UnifiedParameters>
  ): UnifiedParameters & { customParameters?: Record<string, any> } {
    const base = this.getBaseParameters(overrides);
    const extended = this.getExtendedParameters(overrides);
    const reasoning = this.getReasoningParameters(isReasoningModel);
    const customParameters = this.getCustomParameters(); // 🆕 添加

    const unified = {
      ...base,
      ...extended,
      reasoning,
      customParameters, // 🆕 添加
    };

    console.log('[UnifiedParameterManager] 参数:', unified);

    return unified;
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
