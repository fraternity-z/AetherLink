/**
 * 输入框组件统一Props接口定义
 * 
 * 本文件定义了 IntegratedChatInput 组件的Props类型。
 * 通过统一的类型定义，提高代码一致性和可维护性。
 */

import type { SiliconFlowImageFormat, FileContent } from './index';
import type { DebateConfig } from '../services/AIDebateService';
import type { Model } from './index';

/**
 * 发送消息的回调函数类型
 */
export type SendMessageCallback = (
  message: string,
  images?: SiliconFlowImageFormat[],
  toolsEnabled?: boolean,
  files?: FileContent[],
  voiceRecognitionText?: string
) => void;

/**
 * 多模型发送消息的回调函数类型
 */
export type SendMultiModelMessageCallback = (
  message: string,
  models: Model[],
  images?: SiliconFlowImageFormat[],
  toolsEnabled?: boolean,
  files?: FileContent[]
) => void;

/**
 * 开始AI辩论的回调函数类型
 */
export type StartDebateCallback = (question: string, config: DebateConfig) => void;

/**
 * 基础聊天输入Props接口
 * 三个输入框组件共享的Props定义
 */
export interface BaseChatInputProps {
  /** 发送消息的回调 */
  onSendMessage: SendMessageCallback;
  
  /** 多模型发送回调 */
  onSendMultiModelMessage?: SendMultiModelMessageCallback;
  
  /** 开始AI辩论回调 */
  onStartDebate?: StartDebateCallback;
  
  /** 停止AI辩论回调 */
  onStopDebate?: () => void;
  
  /** 是否正在加载 */
  isLoading?: boolean;
  
  /** 允许连续发送消息，即使AI尚未回复 */
  allowConsecutiveMessages?: boolean;
  
  /** 是否处于图像生成模式 */
  imageGenerationMode?: boolean;
  
  /** 发送图像生成提示词的回调 */
  onSendImagePrompt?: (prompt: string) => void;
  
  /** 是否处于网络搜索模式 */
  webSearchActive?: boolean;
  
  /** 停止AI回复的回调 */
  onStopResponse?: () => void;
  
  /** 是否正在流式响应中 */
  isStreaming?: boolean;
  
  /** 是否正在AI辩论中 */
  isDebating?: boolean;
  
  /** 工具开关状态 */
  toolsEnabled?: boolean;
  
  /** 可用模型列表 */
  availableModels?: Model[];
}

/**
 * IntegratedChatInput组件的Props接口
 * 扩展自BaseChatInputProps，添加IntegratedChatInput特有的属性
 */
export interface IntegratedChatInputProps extends BaseChatInputProps {
  /** 是否处于视频生成模式 */
  videoGenerationMode?: boolean;
  
  /** 清除当前话题回调 */
  onClearTopic?: () => void;
  
  /** 切换图像生成模式 */
  toggleImageGenerationMode?: () => void;
  
  /** 切换视频生成模式 */
  toggleVideoGenerationMode?: () => void;
  
  /** 切换网络搜索模式 */
  toggleWebSearch?: () => void;
  
  /** 工具开关变化回调 */
  onToolsEnabledChange?: (enabled: boolean) => void;
}

/**
 * 输入框Props的默认值
 * 可在组件中使用展开运算符应用这些默认值
 */
export const defaultInputProps = {
  isLoading: false,
  allowConsecutiveMessages: true,
  imageGenerationMode: false,
  videoGenerationMode: false,
  webSearchActive: false,
  isStreaming: false,
  isDebating: false,
  toolsEnabled: false,
  availableModels: [] as Model[],
} as const;