/**
 * 目标说明（简化版）
 */

export interface ObjectiveConfig {
  maxToolCalls: number;
  maxConsecutiveErrors: number;
}

export function getObjectiveSection(config: ObjectiveConfig): string {
  const { maxToolCalls, maxConsecutiveErrors } = config;

  return `====

OBJECTIVE

Break down tasks into clear steps and work through them methodically using tools.

## Process
1. Analyze task → Set goals in logical order
2. Execute sequentially → One tool at a time, wait for confirmation
3. **ALWAYS end with \`attempt_completion\`** → Present your result to the user

## ⚠️ CRITICAL: Task Completion Protocol

**YOU MUST CALL \`attempt_completion\` TO END EVERY TASK.**

Without calling \`attempt_completion\`, the task is considered INCOMPLETE and FAILED, even if you have done all the work.

### When to call attempt_completion:
- After completing the user's request
- After all file operations are done
- When you have verified your changes work

### How to call:
<tool_use>
  <name>attempt_completion</name>
  <arguments>{"result": "Summary of what you accomplished"}</arguments>
</tool_use>

### Do NOT call attempt_completion if:
- A tool just failed (fix the error first)
- You are in the middle of a multi-step task
- You need more information from the user

## Limits
- Max ${maxToolCalls} tool calls, max ${maxConsecutiveErrors} consecutive errors`;
}
