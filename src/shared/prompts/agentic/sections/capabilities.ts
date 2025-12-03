/**
 * 能力说明（简化版）
 */

export interface CapabilitiesConfig {
  supportsBrowserUse: boolean;
  hasFileEditorTools: boolean;
}

export function getCapabilitiesSection(config: CapabilitiesConfig): string {
  const { supportsBrowserUse, hasFileEditorTools } = config;

  const fileEditorSection = hasFileEditorTools
    ? `
## File Editor Workflow

1. **list_workspaces** → Get available workspaces
2. **get_workspace_files** → Explore project structure  
3. **read_file** → Examine files (supports line ranges, batch reading)
4. **apply_diff** / **write_to_file** → Make changes
5. **attempt_completion** → Signal task completion

### Key Tool Notes
- **write_to_file**: Must provide \`line_count\` for validation, include COMPLETE content
- **apply_diff**: Use SEARCH/REPLACE format for precise edits (recommended over write_to_file)
- **create_file**: Safer for new files (fails if exists)`
    : '';

  const browserSection = supportsBrowserUse
    ? `
## Browser Tools
- Interact with websites and local dev servers when needed`
    : '';

  return `====

CAPABILITIES

You have access to file editing tools that let you read, write, search, and manage files to accomplish complex coding tasks iteratively.
${fileEditorSection}${browserSection}`;
}
