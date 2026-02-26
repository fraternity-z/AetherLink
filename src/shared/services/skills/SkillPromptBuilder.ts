/**
 * 技能 Prompt 构建器
 * 负责将技能信息组装到 system prompt 中
 * 
 * OpenClaw 风格：
 * - 所有 enabled skills 注入精简 XML 列表（name + description）
 * - 不自动注入全文 — 模型通过 read_skill 工具按需读取
 * - 无"激活"概念 — 绑定即可用，模型自行判断使用哪个
 */

import type { Skill } from '../../types/Skill';

export class SkillPromptBuilder {
  /**
   * 构建技能精简列表（OpenClaw 风格 XML）
   * 每个 skill 约 ~100 字符，极低上下文消耗
   */
  static buildSkillsSummary(skills: Skill[]): string {
    if (!skills.length) return '';

    const entries = skills
      .map(s => `  <skill><name>${escapeXml(s.name)}</name><description>${escapeXml(s.description)}</description></skill>`)
      .join('\n');

    return [
      '<available_skills>',
      entries,
      '</available_skills>',
      '',
      '你拥有以上技能。当用户请求明确匹配某个技能时，调用 read_skill 工具（参数 skill_name）获取完整指令并严格遵循。',
      '如果没有匹配的技能，按你的通用能力回答。不要猜测技能内容，必须先 read_skill。',
    ].join('\n');
  }

  /**
   * 组装完整的 system prompt
   * 合并 assistant prompt + skills XML list + topic prompt
   */
  static assembleSystemPrompt(params: {
    assistantPrompt: string;
    enabledSkills: Skill[];
    topicPrompt?: string;
  }): string {
    let systemPrompt = params.assistantPrompt;

    // 技能精简列表（OpenClaw 风格）
    if (params.enabledSkills.length > 0) {
      const summary = this.buildSkillsSummary(params.enabledSkills);
      systemPrompt += `\n\n${summary}`;
    }

    // 话题追加指令
    if (params.topicPrompt?.trim()) {
      systemPrompt += `\n\n${params.topicPrompt}`;
    }

    return systemPrompt;
  }
}

/** XML 转义 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
