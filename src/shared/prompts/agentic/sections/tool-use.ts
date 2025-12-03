/**
 * 工具使用格式说明
 */

export function getToolUseSection(): string {
  return `====

TOOL USE

You have access to a set of tools that are executed upon the user's approval. You must use exactly one tool per message, and every assistant message must include a tool call. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

# Tool Use Formatting

Tool uses are formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

<tool_use>
  <name>tool_name</name>
  <arguments>{"param1": "value1", "param2": "value2"}</arguments>
</tool_use>

**CRITICAL FORMAT REQUIREMENTS:**
- Tool tags must be complete and unbroken - no line breaks or spaces within tag names
- ❌ Wrong: \`<tool\\n_use>\` or \`<tool _use>\`
- ✅ Correct: \`<tool_use>\`
- The arguments must be valid JSON format
- Tag format errors will cause tool execution to fail!

The user will respond with the result of the tool use:

<tool_use_result>
  <name>tool_name</name>
  <result>result content</result>
</tool_use_result>

The result can be a string, file content, error message, or any other output that informs your next action.`;
}
