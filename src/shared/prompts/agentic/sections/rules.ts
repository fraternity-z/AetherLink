/**
 * 规则约束（简化版）
 */

export interface RulesConfig {
  cwd: string;
  osType: string;
  hasFileEditorTools: boolean;
  supportsBrowserUse: boolean;
}

export function getRulesSection(config: RulesConfig): string {
  const { cwd, hasFileEditorTools } = config;

  const editingRules = hasFileEditorTools
    ? `
## File Editing Rules
- **Workspace First**: Call \`list_workspaces\` before file operations
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
${editingRules}`;
}
