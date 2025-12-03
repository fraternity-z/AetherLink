/**
 * 任务完成相关工具定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const ATTEMPT_COMPLETION_TOOL: Tool = {
  name: 'attempt_completion',
  description: `当你认为已经完成了用户的任务时，使用此工具来结束任务并向用户展示结果。
这是 Agentic 模式中唯一能够结束任务循环的方式。

重要规则：
1. 在完成所有必要的文件操作后才调用此工具
2. 提供清晰的完成摘要，说明做了什么
3. 如果有任何遗留问题或建议，在 result 中说明
4. 不要在工具执行失败后立即调用此工具，应该先尝试修复问题`,
  inputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: '任务完成的结果摘要。向用户解释你做了什么，以及任何相关的后续建议。'
      },
      command: {
        type: 'string',
        description: '（可选）建议用户执行的命令，例如运行或测试代码的命令'
      }
    },
    required: ['result']
  }
};
