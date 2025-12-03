/**
 * 规则约束（简化版）
 */

/** 工作区信息 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
}

export interface RulesConfig {
  cwd: string;
  osType: string;
  hasFileEditorTools: boolean;
  supportsBrowserUse: boolean;
  /** 工作区列表（直接注入提示词） */
  workspaces?: WorkspaceInfo[];
}

export function getRulesSection(config: RulesConfig): string {
  const { cwd, hasFileEditorTools, workspaces = [] } = config;

  // 构建工作区信息部分
  let workspaceSection = '';
  if (hasFileEditorTools && workspaces.length > 0) {
    const workspaceList = workspaces.map((ws, index) => 
      `  ${index + 1}. "${ws.name}" - ${ws.path}`
    ).join('\n');
    workspaceSection = `
## Available Workspaces
The following workspaces are available for file operations (use index number or name with get_workspace_files):
${workspaceList}
`;
  } else if (hasFileEditorTools) {
    workspaceSection = `
## Workspaces
No workspaces configured. Use \`list_workspaces\` to check available workspaces.
`;
  }

  const editingRules = hasFileEditorTools
    ? `
## File Editing Rules
- **Tool Priority**: \`apply_diff\` > \`replace_in_file\` > \`insert_content\` > \`write_to_file\`
- **write_to_file**: MUST provide \`line_count\`, include COMPLETE content (no placeholders)
- **apply_diff**: Read file first, use SEARCH/REPLACE format with enough context
- **New Files**: Prefer \`create_file\` (safer) over \`write_to_file\``
    : '';

  return `====

RULES

## General
- Working directory: ${cwd} (all paths relative to this)
- Wait for tool confirmation before proceeding
- Use tools instead of asking questions when possible
- Goal-oriented: accomplish task, avoid back-and-forth

## Communication
- Be direct and technical, no conversational phrases
- FORBIDDEN openers: "Great", "Certainly", "Okay", "Sure"
- attempt_completion result must be final (no questions)
${workspaceSection}${editingRules}`;
}
