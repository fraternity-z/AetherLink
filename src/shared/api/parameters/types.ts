/**
 * 统一参数管理器 - 类型定义
 * 为所有 AI 供应商提供统一的参数接口
 */

import type { Model } from '../../types';

/**
 * 供应商类型
 */
export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible';

/**
 * 推理努力程度
 */
export type ReasoningEffort = 'disabled' | 'none' | 'off' | 'low' | 'medium' | 'high' | 'max';

/**
 * 统一基础参数 - 所有供应商通用
 * 基于 AI SDK 标准参数
 * 注意：这些参数都是可选的，未设置时不发送给 API
 */
export interface UnifiedBaseParameters {
  /** 温度 (0-2)，控制随机性 */
  temperature?: number;
  /** 核采样 (0-1) */
  topP?: number;
  /** 最大输出 token 数 */
  maxOutputTokens?: number;
  /** 是否启用流式输出 */
  stream?: boolean;
}

/**
 * 统一扩展参数 - 可选参数
 */
export interface UnifiedExtendedParameters {
  /** Top-K 采样 */
  topK?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 停止序列 */
  stopSequences?: string[];
  /** 随机种子 */
  seed?: number;
  /** 响应格式 */
  responseFormat?: { type: string };
  /** 工具选择 */
  toolChoice?: string;
}

/**
 * 推理/思考参数 - 用于支持推理的模型
 */
export interface UnifiedReasoningParameters {
  /** 是否启用推理 */
  enabled: boolean;
  /** 推理努力程度 */
  effort?: ReasoningEffort;
  /** 推理 token 预算 */
  budgetTokens?: number;
}

/**
 * 完整的统一参数
 */
export interface UnifiedParameters extends UnifiedBaseParameters, UnifiedExtendedParameters {
  /** 推理参数 */
  reasoning?: UnifiedReasoningParameters;
}

/**
 * OpenAI 特定参数
 * @see https://ai-sdk.dev/docs/providers/openai
 */
export interface OpenAISpecificParameters {
  /** 频率惩罚 (-2.0 到 2.0) */
  frequency_penalty?: number;
  /** 存在惩罚 (-2.0 到 2.0) */
  presence_penalty?: number;
  /** Top-K (某些兼容 API 支持) */
  top_k?: number;
  /** 随机种子，用于确定性输出 */
  seed?: number;
  /** 停止序列 */
  stop?: string[];
  /** Logit 偏置，调整特定 token 的概率 */
  logit_bias?: Record<string, number>;
  /** 响应格式 (text, json_object, json_schema) */
  response_format?: { type: string; json_schema?: any };
  /** 工具选择策略 */
  tool_choice?: string | { type: string; function?: { name: string } };
  /** 是否并行调用工具 */
  parallel_tool_calls?: boolean;
  /** 推理努力程度 (o1/o3 系列) */
  reasoning_effort?: 'low' | 'medium' | 'high';
  /** 是否存储对话 (用于模型改进) */
  store?: boolean;
  /** 用户标识符 (用于监控和滥用检测) */
  user?: string;
  /** 是否返回 token 概率信息 */
  logprobs?: boolean | number;
  /** 返回最高概率的 token 数量 */
  top_logprobs?: number;
  /** Completion API: 是否回显提示词 */
  echo?: boolean;
  /** Completion API: 生成文本后缀 */
  suffix?: string;
  /** 最大步骤数 (多轮工具调用) */
  maxSteps?: number;
}

/**
 * Anthropic 特定参数
 * @see https://ai-sdk.dev/docs/providers/anthropic
 */
export interface AnthropicSpecificParameters {
  /** Top-K 采样 */
  top_k?: number;
  /** 停止序列 */
  stop_sequences?: string[];
  /** Extended Thinking 配置 (Claude 3.5+ 推理模型) */
  thinking?: {
    type: 'enabled' | 'disabled';
    budgetTokens?: number;
  };
  /** 提示缓存控制 */
  cacheControl?: {
    type: 'ephemeral';
    /** 缓存 TTL，如 '1h' */
    ttl?: string;
  };
  /** 结构化输出模式 */
  structuredOutputMode?: 'outputFormat' | 'jsonTool' | 'auto';
  /** 用户标识符 */
  user?: string;
  /** 是否启用 Web Search 工具 */
  webSearchEnabled?: boolean;
  /** Web Search 工具配置 */
  webSearchConfig?: {
    maxUses?: number;
    allowedDomains?: string[];
    blockedDomains?: string[];
    userLocation?: {
      type: 'approximate';
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };
  /** 是否启用代码执行工具 */
  codeExecutionEnabled?: boolean;
  /** Computer Use 配置 */
  computerUseConfig?: {
    displayWidth?: number;
    displayHeight?: number;
    displayNumber?: number;
  };
}

/**
 * Gemini 特定参数
 * @see https://ai-sdk.dev/docs/providers/google-generative-ai
 */
export interface GeminiSpecificParameters {
  /** Top-K 采样 */
  topK?: number;
  /** 停止序列 */
  stopSequences?: string[];
  /** 思考配置 (Gemini 2.0+ 推理模型) */
  thinkingConfig?: {
    /** 思考 token 预算 */
    thinkingBudget?: number;
    /** 是否在响应中包含思考过程 */
    includeThoughts?: boolean;
  };
  /** 是否启用 Google Search Grounding */
  useSearchGrounding?: boolean;
  /** Google Search 工具配置 */
  googleSearchConfig?: {
    /** 动态检索配置 */
    dynamicRetrievalConfig?: {
      mode?: 'MODE_DYNAMIC' | 'MODE_UNSPECIFIED';
      dynamicThreshold?: number;
    };
  };
  /** 安全设置 */
  safetySettings?: Array<{
    category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 
              'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
    threshold: 'BLOCK_NONE' | 'BLOCK_LOW_AND_ABOVE' | 
               'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
  }>;
  /** 图像生成 - 人物生成策略 */
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
  /** 图像生成 - 负面提示词 */
  negativePrompt?: string;
  /** 候选数量 */
  candidateCount?: number;
  /** 响应 MIME 类型 */
  responseMimeType?: string;
  /** JSON 响应 Schema */
  responseSchema?: any;
}

/**
 * 供应商特定参数映射
 */
export interface ProviderSpecificParametersMap {
  openai: OpenAISpecificParameters;
  anthropic: AnthropicSpecificParameters;
  gemini: GeminiSpecificParameters;
  'openai-compatible': OpenAISpecificParameters;
}

/**
 * 参数管理器配置
 */
export interface ParameterManagerConfig {
  /** 模型配置 */
  model: Model;
  /** 助手配置 */
  assistant?: any;
  /** 供应商类型 */
  providerType?: ProviderType;
}

/**
 * 参数解析结果
 */
export interface ResolvedParameters<T extends ProviderType = ProviderType> {
  /** 基础参数 */
  base: UnifiedBaseParameters;
  /** 扩展参数 */
  extended: UnifiedExtendedParameters;
  /** 推理参数 */
  reasoning?: UnifiedReasoningParameters;
  /** 供应商特定参数 */
  providerSpecific: ProviderSpecificParametersMap[T];
}

/**
 * 参数适配器接口
 */
export interface ParameterAdapter<T extends ProviderType = ProviderType> {
  /** 供应商类型 */
  readonly providerType: T;
  
  /** 解析统一参数 */
  resolve(config: ParameterManagerConfig): ResolvedParameters<T>;
  
  /** 转换为供应商 API 格式 */
  toAPIFormat(params: ResolvedParameters<T>): Record<string, any>;
  
  /** 获取默认值 */
  getDefaults(): Partial<UnifiedParameters>;
}
