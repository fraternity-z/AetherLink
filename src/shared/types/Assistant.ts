import type { ReactNode } from 'react';
import type { Message, QuickPhrase } from '.'; // 从当前目录的 index.ts 导入 Message 和 QuickPhrase
import type { Message as NewMessage } from './newMessage.ts'; // 从 newMessage.ts 导入 NewMessage

// 自定义参数类型定义
export type CustomParameterType = 'string' | 'number' | 'boolean' | 'json';

export interface CustomParameter {
  name: string;
  value: string | number | boolean | object;
  type: CustomParameterType;
}

// 正则替换规则作用范围
export type AssistantRegexScope = 'user' | 'assistant';

// 正则替换规则
export interface AssistantRegex {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  scopes: AssistantRegexScope[];
  visualOnly: boolean; // 仅视觉显示，不影响实际发送内容
  enabled: boolean;
}

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  icon?: ReactNode | null; // 重新添加 icon 字段
  emoji?: string; // 添加emoji字段，与最佳实例保持一致
  tags?: string[];
  engine?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  prompt?: string; // 用户自定义的 prompt
  maxMessagesInContext?: number; // 保留在上下文中的最大消息数量
  isDefault?: boolean; // 是否为默认助手
  isSystem?: boolean; // 是否为系统预设助手，不可删除
  archived?: boolean; // 是否已归档
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
  lastUsedAt?: string; // 最后使用时间
  topicIds: string[];  // 保留 topicIds 用于数据库存储
  topics: ChatTopic[]; // 添加 topics 数组用于运行时
  selectedSystemPromptId?: string | null; // 新增：选中的系统提示词 ID
  mcpConfigId?: string | null;
  tools?: string[];
  tool_choice?: string;
  speechModel?: string;
  speechVoice?: string;
  speechSpeed?: number;
  responseFormat?: string;
  isLocal?: boolean;
  localModelName?: string;
  localModelPath?: string;
  localModelType?: string;
  file_ids?: string[];
  type?: string; // 添加type字段，与最佳实例保持一致
  regularPhrases?: QuickPhrase[]; // 助手专属快捷短语
  
  // 🚀 网络搜索配置 - AI Tool Use 模式
  webSearchProviderId?: string; // 选择的网络搜索提供商ID，如 'bing-free', 'tavily' 等
  enableWebSearch?: boolean; // 是否启用模型内置的网络搜索（如 Gemini/OpenAI 内置搜索）
  
  // 自定义参数
  customParameters?: CustomParameter[];
  
  // 正则替换规则
  regexRules?: AssistantRegex[];
  
  // 助手专属聊天壁纸（优先级高于全局设置）
  chatBackground?: {
    enabled: boolean;
    imageUrl: string;
    opacity?: number;
    size?: string;
    position?: string;
    repeat?: string;
    showOverlay?: boolean;
  };
  
  // 助手级别记忆功能
  memoryEnabled?: boolean;
}

export interface ChatTopic {
  id: string;
  name: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageTime?: string;
  assistantId: string;
  prompt?: string;
  messageIds: string[]; // 消息ID数组，替代原来的messages数组
  messages?: Message[]; // 保留作为兼容字段，但标记为可选
  messageCount?: number;
  tokenCount?: number;
  inputTemplate?: string;
  isDefault?: boolean;
  isNameManuallyEdited: boolean;
  pinned?: boolean; // 新增：是否置顶
  newMessages?: NewMessage[]; // 新增：新的消息类型，用于逐步迁移
}

// 用于持久化存储的助手类型，不包含无法序列化的React元素
export interface SerializableAssistant {
  id: string;
  name: string;
  description?: string; // 改为可选，与 Assistant 接口一致
  icon: null; // 存储时将图标设为null
  emoji?: string; // 保留emoji字段用于持久化
  isSystem?: boolean;
  topicIds?: string[];
  systemPrompt?: string; // 助手系统提示词
}