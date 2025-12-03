/**
 * Agentic 模式响应消息
 * 参考 Roo Code 的 responses.ts
 */

/**
 * 当 AI 没有使用任何工具时的提醒消息
 */
export function getNoToolsUsedReminder(): string {
  return `[ERROR] You did not use a tool in your previous response!

⚠️ IMPORTANT: Every response in Agentic mode MUST include a tool call.

# What you need to do NOW:

1. **If the task is COMPLETE** → You MUST call attempt_completion:
<tool_use>
  <name>attempt_completion</name>
  <arguments>{"result": "Describe what you accomplished"}</arguments>
</tool_use>

2. **If the task is NOT complete** → Use the appropriate tool to continue working.

3. **If you need more information** → Ask the user using ask_followup_question (if available).

# Reminder: Tool Use Format

<tool_use>
  <name>tool_name</name>
  <arguments>{"param1": "value1"}</arguments>
</tool_use>

DO NOT respond with just text. You MUST use a tool.
(This is an automated message, so do not respond to it conversationally.)`;
}

/**
 * 当连续错误过多时的提醒消息
 */
export function getTooManyMistakesMessage(feedback?: string): string {
  const feedbackSection = feedback 
    ? `\n\nThe user has provided the following feedback to help guide you:\n<feedback>\n${feedback}\n</feedback>`
    : '';
  
  return `You seem to be having trouble proceeding.${feedbackSection}

Please take a step back and:
1. Review what you've accomplished so far
2. Identify what's blocking progress
3. Try a different approach or ask for clarification

If you believe the task is complete, use the attempt_completion tool.`;
}

/**
 * 工具执行失败时的消息
 */
export function getToolErrorMessage(toolName: string, error?: string): string {
  const errorSection = error ? `\n\nError details:\n<error>\n${error}\n</error>` : '';
  
  return `The tool "${toolName}" execution failed.${errorSection}

Please:
1. Check the error message and fix any issues
2. Retry with corrected parameters
3. Or try an alternative approach`;
}

/**
 * 达到最大迭代次数时的消息
 */
export function getMaxIterationsReachedMessage(iterations: number): string {
  return `[NOTICE] Maximum iterations (${iterations}) reached.

Please use the attempt_completion tool to:
1. Summarize what has been accomplished
2. List any remaining tasks that couldn't be completed
3. Provide any relevant suggestions for the user`;
}
