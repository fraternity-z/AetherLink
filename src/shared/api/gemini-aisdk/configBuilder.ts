/**
 * AI SDK Gemini 配置构建器
 * 负责构建 Gemini 特有的 API 参数配置
 * 包括安全设置、思考预算、图像生成等
 */
import type { Model } from '../../types';
import { getThinkingBudget } from '../../utils/settingsUtils';

/**
 * 安全等级阈值
 */
export enum SafetyThreshold {
  BLOCK_NONE = 'BLOCK_NONE',
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_HIGH = 'BLOCK_ONLY_HIGH'
}

/**
 * 危害类别
 */
export enum HarmCategory {
  HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
  CIVIC_INTEGRITY = 'HARM_CATEGORY_CIVIC_INTEGRITY'
}

/**
 * 安全设置接口
 */
export interface SafetySetting {
  category: HarmCategory;
  threshold: SafetyThreshold;
}

/**
 * 思考配置接口
 */
export interface ThinkingConfig {
  thinkingBudget: number;
  includeThoughts: boolean;
}

/**
 * Gemini 配置接口
 */
export interface GeminiConfig {
  safetySettings?: SafetySetting[];
  thinkingConfig?: ThinkingConfig;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseModalities?: string[];
  responseMimeType?: string;
  useSearchGrounding?: boolean;
}

/**
 * 检查是否为 Gemini 推理模型（支持思考）
 */
export function isGeminiReasoningModel(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return (
    modelId.includes('gemini-2.5-pro') ||
    modelId.includes('gemini-2.5-flash') ||
    modelId.includes('thinking') ||
    model.capabilities?.reasoning === true
  );
}

/**
 * 检查是否为图像生成模型
 */
export function isGeminiImageModel(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return (
    modelId.includes('image') ||
    modelId.includes('gemini-2.5-flash-preview-image') ||
    modelId.includes('gemini-2.0-flash-exp-image') ||
    model.capabilities?.imageGeneration === true
  );
}

/**
 * 检查是否为 Gemma 模型
 */
export function isGemmaModel(model: Model): boolean {
  return model.id.toLowerCase().includes('gemma');
}

/**
 * Gemini AI SDK 配置构建器类
 * 负责构建 Gemini 特有配置（安全设置、思考配置、图像生成、Google Search）
 * 
 * 注意：基础参数（温度、TopP、MaxTokens）已迁移到 GeminiParameterAdapter
 * @see src/shared/api/parameters/adapters/gemini.ts
 */
export class GeminiConfigBuilder {
  private assistant: any;
  private model: Model;
  private enableGoogleSearch: boolean;

  constructor(
    assistant: any,
    model: Model,
    enableGoogleSearch: boolean = false
  ) {
    this.assistant = assistant;
    this.model = model;
    this.enableGoogleSearch = enableGoogleSearch;
  }

  /**
   * 构建完整的 Gemini providerOptions 配置
   */
  build(): Record<string, any> {
    const googleOptions: Record<string, any> = {};

    // 添加安全设置
    const safetySettings = this.getSafetySettings();
    if (safetySettings.length > 0) {
      googleOptions.safetySettings = safetySettings;
    }

    // 添加思考配置（如果模型支持）
    const thinkingConfig = this.getThinkingConfig();
    if (thinkingConfig) {
      googleOptions.thinkingConfig = thinkingConfig;
    }

    // 添加图像生成配置
    if (isGeminiImageModel(this.model)) {
      googleOptions.responseModalities = ['TEXT', 'IMAGE'];
      googleOptions.responseMimeType = 'text/plain';
    }

    // 添加 Google Search grounding
    if (this.enableGoogleSearch) {
      googleOptions.useSearchGrounding = true;
    }

    return googleOptions;
  }

  /**
   * 获取安全设置 - 默认全部开放
   */
  getSafetySettings(): SafetySetting[] {
    const threshold = SafetyThreshold.BLOCK_NONE;
    return [
      { category: HarmCategory.HATE_SPEECH, threshold },
      { category: HarmCategory.SEXUALLY_EXPLICIT, threshold },
      { category: HarmCategory.HARASSMENT, threshold },
      { category: HarmCategory.DANGEROUS_CONTENT, threshold },
      { category: HarmCategory.CIVIC_INTEGRITY, threshold }
    ];
  }

  /**
   * 获取思考配置
   */
  getThinkingConfig(): ThinkingConfig | null {
    if (!isGeminiReasoningModel(this.model)) {
      return null;
    }

    // 从应用设置中获取思考预算
    const appThinkingBudget = getThinkingBudget();
    
    // 检查是否启用思维链
    const enableThinking = this.assistant?.enableThinking !== false;
    
    // 优先使用助手设置的思考预算，如果没有则使用应用设置的默认值
    const thinkingBudget = this.assistant?.thinkingBudget || appThinkingBudget || 1024;

    // 对于 Gemini 2.5 Pro 模型，必须设置思考预算
    const modelId = this.model.id.toLowerCase();
    if (modelId.includes('gemini-2.5-pro')) {
      // 确保思考预算在有效范围内 (128-32768)
      const budget = Math.max(128, Math.min(thinkingBudget, 32768));
      
      return {
        thinkingBudget: budget,
        includeThoughts: true
      };
    }

    // 其他推理模型
    if (!enableThinking || thinkingBudget === 0) {
      return {
        thinkingBudget: 0,
        includeThoughts: false
      };
    }

    return {
      thinkingBudget: Math.max(128, Math.min(thinkingBudget, 32768)),
      includeThoughts: true
    };
  }

  /**
   * 启用 Google Search
   */
  setEnableGoogleSearch(enable: boolean): GeminiConfigBuilder {
    this.enableGoogleSearch = enable;
    return this;
  }
}

/**
 * 创建 Gemini 配置构建器
 */
export function createGeminiConfigBuilder(
  assistant: any,
  model: Model,
  enableGoogleSearch: boolean = false
): GeminiConfigBuilder {
  return new GeminiConfigBuilder(assistant, model, enableGoogleSearch);
}
