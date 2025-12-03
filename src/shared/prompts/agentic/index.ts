/**
 * Agentic Mode 提示词系统
 * 参考 Roo Code 的模块化设计，为 Agentic 模式提供完整的提示词支持
 * 
 * 该系统独立于普通 MCP 提示词，仅在 Agentic 模式下使用
 */

import type { MCPTool } from '../../types/index';
import { getToolUseSection } from './sections/tool-use';
import { getToolUseGuidelinesSection } from './sections/tool-use-guidelines';
import { getCapabilitiesSection } from './sections/capabilities';
import { getRulesSection } from './sections/rules';
import { getObjectiveSection } from './sections/objective';
import { getToolsCatalogSection } from './sections/tools-catalog';

/** 工作区信息 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
}

export interface AgenticPromptConfig {
  /** 用户自定义系统提示词 */
  userSystemPrompt?: string;
  /** MCP 工具列表 */
  tools: MCPTool[];
  /** 工作目录 */
  cwd?: string;
  /** 操作系统类型 */
  osType?: string;
  /** 是否支持浏览器操作 */
  supportsBrowserUse?: boolean;
  /** 最大工具调用次数 */
  maxToolCalls?: number;
  /** 最大连续错误次数 */
  maxConsecutiveErrors?: number;
  /** 工作区列表（直接注入提示词，无需 AI 调用 list_workspaces） */
  workspaces?: WorkspaceInfo[];
}

/**
 * 构建 Agentic 模式的完整系统提示词
 */
export function buildAgenticSystemPrompt(config: AgenticPromptConfig): string {
  const {
    userSystemPrompt = '',
    tools,
    cwd = '.',
    osType = 'Unknown',
    supportsBrowserUse = false,
    maxToolCalls = 25,
    maxConsecutiveErrors = 3,
    workspaces = [],
  } = config;

  // 检查是否有文件编辑工具
  const hasFileEditorTools = checkHasFileEditorTools(tools);
  
  // 构建各个 section
  const sections: string[] = [];

  // 1. 角色定义
  sections.push(getRoleDefinition());

  // 2. 工具使用格式
  sections.push(getToolUseSection());

  // 3. 工具目录
  sections.push(getToolsCatalogSection(tools));

  // 4. 工具使用指南
  sections.push(getToolUseGuidelinesSection());

  // 5. 能力说明
  sections.push(getCapabilitiesSection({
    supportsBrowserUse,
    hasFileEditorTools,
  }));

  // 6. 规则约束（包含工作区信息）
  sections.push(getRulesSection({
    cwd,
    osType,
    hasFileEditorTools,
    supportsBrowserUse,
    workspaces,
  }));

  // 7. 目标说明
  sections.push(getObjectiveSection({
    maxToolCalls,
    maxConsecutiveErrors,
  }));

  // 8. 用户自定义指令
  if (userSystemPrompt.trim()) {
    sections.push(`====

USER INSTRUCTIONS

${userSystemPrompt}`);
  }

  return sections.filter(s => s.trim()).join('\n\n');
}

/**
 * 获取角色定义
 */
function getRoleDefinition(): string {
  return `You are an autonomous AI agent operating in Agentic Mode. You have access to a set of tools that allow you to interact with the user's computer, read and write files, execute commands, and accomplish complex tasks iteratively.

Your primary goal is to accomplish the user's task efficiently and accurately, using the available tools step-by-step until the task is complete.`;
}

/**
 * 文件编辑工具名称列表
 * 与 @aether/file-editor MCP 服务器的工具定义保持同步
 */
export const FILE_EDITOR_TOOL_NAMES = [
  // 工作区工具
  'list_workspaces',
  'get_workspace_files',
  // 文件读写工具
  'read_file',
  'write_to_file',
  'list_files',
  'get_file_info',
  'create_file',
  'rename_file',
  'move_file',
  'copy_file',
  'delete_file',
  // 编辑工具
  'insert_content',
  'replace_in_file',
  'apply_diff',
  // 搜索工具
  'search_files',
  // 完成工具
  'attempt_completion'
];

/**
 * 检查是否包含文件编辑工具
 */
export function checkHasFileEditorTools(tools: MCPTool[]): boolean {
  if (!tools || tools.length === 0) return false;
  
  return tools.some(tool => 
    FILE_EDITOR_TOOL_NAMES.includes(tool.name) || 
    tool.serverName === '@aether/file-editor'
  );
}

/**
 * 检查是否为 Agentic 模式（包含 attempt_completion 工具）
 */
export function isAgenticMode(tools: MCPTool[]): boolean {
  if (!tools || tools.length === 0) return false;
  return tools.some(tool => 
    tool.name === 'attempt_completion' || 
    tool.serverName === '@aether/file-editor'
  );
}
