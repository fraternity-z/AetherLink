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
3. Complete → Call \`attempt_completion\` to present result

## CRITICAL: Task Completion
- **MUST call \`attempt_completion\`** to end task - without it, task is FAILED
- Call it ONLY after all steps succeed and changes are verified
- Do NOT call if: tool just failed, mid-task, or need more info

## Limits
- Max ${maxToolCalls} tool calls, max ${maxConsecutiveErrors} consecutive errors`;
}
