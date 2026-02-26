/**
 * Skills 系统类型定义
 * 技能是轻量级的结构化指令包，为 AI 提供按需加载的专业知识
 */

/** 技能来源 */
export type SkillSource = 'builtin' | 'user' | 'community';

/** 技能接口 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  tags?: string[];

  /** SKILL.md 正文（Markdown 格式的详细指令） */
  content: string;

  /** 触发短语示例，如 ["审查代码", "review PR"] */
  triggerPhrases?: string[];

  /** 关联的 MCP 服务器 ID */
  mcpServerId?: string;
  /** 推荐使用的模型 */
  modelOverride?: string;
  /** 推荐温度参数 */
  temperatureOverride?: number;

  source: SkillSource;
  version?: string;
  author?: string;
  enabled: boolean;

  /** 使用次数统计 */
  usageCount?: number;
  /** 最近使用时间 */
  lastUsedAt?: string;

  createdAt: string;
  updatedAt: string;
}

/** 用于持久化存储的技能类型（与 Skill 相同，无需额外处理） */
export type SerializableSkill = Skill;
