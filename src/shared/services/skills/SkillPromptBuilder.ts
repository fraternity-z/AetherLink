/**
 * 技能 Prompt 构建器
 * 负责将技能信息组装到 system prompt 中
 * 
 * Cascade 风格：
 * - 所有 enabled skills 注入纯文本列表（name: description）
 * - 不自动注入全文 — 模型通过 read_skill 工具按需读取
 * - 无“激活”概念 — 绑定即可用，模型自行判断使用哪个
 */

import type { Skill } from '../../types/Skill';

export class SkillPromptBuilder {
  /**
   * 构建技能精简列表（Cascade 风格纯文本）
   * 每个 skill 约 ~50 字符，极低上下文消耗
   */
  static buildSkillsSummary(skills: Skill[]): string {
    if (!skills.length) return '';

    const entries = skills
      .map(s => `- ${s.name}: ${s.description}`)
      .join('\n');

    return [
      'If a skill matches the user request, call read_skill with the skill name before using any other tool.',
      '',
      'Available skills:',
      entries,
    ].join('\n');
  }

  /**
   * 组装完整的 system prompt
   * 合并 assistant prompt + skills list + topic prompt
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

