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
      '## Skills (HIGHEST PRIORITY — execute before any other tool)',
      '',
      '<available_skills>',
      entries,
      '</available_skills>',
      '',
      'CRITICAL: Before replying and before calling ANY other tool (including mcp_bridge), you MUST:',
      '1. Scan every <description> in <available_skills> above.',
      '2. If one or more skills match the user request: call read_skill with the most specific skill name FIRST.',
      '3. Only after reading and following the skill instructions may you use other tools.',
      '4. If no skill applies: skip read_skill and respond normally.',
      'Constraints: read exactly one skill; never guess skill content — always read_skill first.',
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
    let systemPrompt = '';

    // 技能指令放在最前面（优先级最高，确保模型先看到）
    if (params.enabledSkills.length > 0) {
      const summary = this.buildSkillsSummary(params.enabledSkills);
      systemPrompt = summary + '\n\n';
    }

    systemPrompt += params.assistantPrompt;

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
