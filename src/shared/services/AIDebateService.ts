/**
 * AI 辩论类型定义
 * 注意：实际的辩论功能已在 useAIDebate.ts hook 中实现
 * 此文件仅保留类型定义供其他模块使用
 */

/** AI辩论角色接口 */
export interface DebateRole {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelId?: string;
  color: string;
  stance: 'pro' | 'con' | 'neutral' | 'moderator' | 'summary';
}

/** AI辩论配置接口 */
export interface DebateConfig {
  enabled: boolean;
  maxRounds: number;
  autoEndConditions: {
    consensusReached: boolean;
    maxTokensPerRound: number;
    timeoutMinutes: number;
  };
  roles: DebateRole[];
  moderatorEnabled: boolean;
  summaryEnabled: boolean;
}

/** 辩论消息接口 */
export interface DebateMessage {
  id: string;
  roleId: string;
  roleName: string;
  content: string;
  round: number;
  timestamp: number;
  color: string;
  stance: string;
}

/** 辩论状态接口 */
export interface DebateState {
  isActive: boolean;
  currentRound: number;
  currentSpeaker: number;
  question: string;
  config: DebateConfig;
  messages: DebateMessage[];
  startTime: number;
  shouldEnd: boolean;
  endReason?: string;
}
