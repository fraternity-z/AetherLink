/**
 * read_skill 虚拟工具 — 独立于桥梁模式
 * 
 * OpenClaw 风格：system prompt 只注入技能精简列表，
 * 模型通过此工具按需读取技能完整指令。
 * 
 * 只要助手绑定了技能就自动注入，不依赖桥梁模式。
 */

import type { MCPTool, MCPCallToolResponse } from '../../types';
import type { Skill } from '../../types/Skill';
import { dexieStorage } from '../storage/DexieStorageService';

// ======================== 工具定义 ========================

export const READ_SKILL_TOOL_NAME = 'read_skill';

/** read_skill 工具的 MCPTool 定义 */
export const READ_SKILL_TOOL_DEFINITION: MCPTool = {
  name: READ_SKILL_TOOL_NAME,
  description: '读取指定技能的完整指令内容。当 system prompt 中的 <available_skills> 列表包含匹配用户请求的技能时，使用此工具获取该技能的详细指令。',
  inputSchema: {
    type: 'object',
    properties: {
      skill_name: {
        type: 'string',
        description: '技能名称，对应 <available_skills> 中的 <name> 值',
      },
    },
    required: ['skill_name'],
  },
  serverName: '__skill__',
  serverId: '__skill__',
};

// ======================== 执行器 ========================

/**
 * 执行 read_skill 工具调用
 * 从数据库读取技能全文内容返回给模型
 */
export async function executeReadSkill(
  args: Record<string, any>,
): Promise<MCPCallToolResponse> {
  const { skill_name } = args;

  if (!skill_name) {
    return {
      content: [{ type: 'text', text: 'read_skill 需要提供 skill_name 参数（技能名称）' }],
      isError: true,
    };
  }

  try {
    const allSkills: Skill[] = await dexieStorage.skills.toArray();

    // 按名称查找（精确 → 不区分大小写 → 部分匹配）
    let skill = allSkills.find((s: Skill) => s.name === skill_name);
    if (!skill) {
      skill = allSkills.find((s: Skill) => s.name.toLowerCase() === skill_name.toLowerCase());
    }
    if (!skill) {
      skill = allSkills.find((s: Skill) => s.name.toLowerCase().includes(skill_name.toLowerCase()));
    }

    if (!skill) {
      const available = allSkills.filter((s: Skill) => s.enabled).map((s: Skill) => s.name).join(', ');
      return {
        content: [{ type: 'text', text: `未找到技能: "${skill_name}"。可用的技能: ${available || '无'}` }],
        isError: true,
      };
    }

    if (!skill.content) {
      return {
        content: [{ type: 'text', text: `技能 "${skill.name}" 没有详细指令内容。\n描述: ${skill.description}` }],
        isError: false,
      };
    }

    return {
      content: [{ type: 'text', text: `# ${skill.name}\n\n${skill.content}` }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `读取技能失败: ${msg}` }],
      isError: true,
    };
  }
}
