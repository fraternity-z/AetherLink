/**
 * 助手响应处理相关类型定义
 */
import type { Message } from '../../../../types/newMessage';
import type { Model, MCPTool } from '../../../../types';
import type { AppDispatch, RootState } from '../../../index';

/**
 * 文本生成上下文
 */
export interface TextGenerationContext {
  assistantMessage: Message;
  topicId: string;
  model: Model;
  mcpTools: MCPTool[];
  apiMessages: any[];
  filteredOriginalMessages: Message[];
  responseHandler: ResponseHandlerLike;
  abortController: AbortController;
  assistant: any;
  webSearchTool: any;
  webSearchProviderId: string | undefined;
  extractedKeywords: any;
}

/**
 * 图像生成上下文
 */
export interface ImageGenerationContext {
  dispatch: AppDispatch;
  model: Model;
  assistantMessage: Message;
  topicId: string;
  apiMessages: any[];
  responseHandler: ResponseHandlerLike;
}

/**
 * 响应处理器接口
 */
export interface ResponseHandlerLike {
  handleStringContent: (content: string) => void;
  handleChunk: (chunk: any) => Promise<void>;
  complete: (content: string, reasoning?: string) => Promise<any>;
  completeWithInterruption: () => Promise<any>;
  fail: (error: Error) => Promise<any>;
}

/**
 * 处理助手响应的参数
 */
export interface ProcessAssistantResponseParams {
  dispatch: AppDispatch;
  getState: () => RootState;
  assistantMessage: Message;
  topicId: string;
  model: Model;
  toolsEnabled?: boolean;
}
