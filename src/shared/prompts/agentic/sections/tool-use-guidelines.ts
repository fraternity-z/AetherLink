/**
 * 工具使用指南（简化版）
 */

export function getToolUseGuidelinesSection(): string {
  return `# Tool Use Guidelines

1. **One tool per message** - Use tools iteratively, each informed by previous results
2. **Verify parameters** - Ensure all required params are available before calling
3. **Wait for confirmation** - ALWAYS wait for user response after each tool use
4. **Don't assume outcomes** - Each step must be confirmed before proceeding`;
}
