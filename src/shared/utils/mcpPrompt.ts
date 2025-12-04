import type { MCPTool } from '../types/index';
import { buildAgenticSystemPrompt, isAgenticMode } from '../prompts/agentic';
import type { AgenticPromptConfig } from '../prompts/agentic';

export const SYSTEM_PROMPT = `In this environment you have access to a set of tools you can use to answer the user's question. \
You can use one tool per message, and will receive the result of that tool use in the user's response. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

## Tool Use Formatting

Tool use is formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

<tool_use>
  <name>{tool_name}</name>
  <arguments>{json_arguments}</arguments>
</tool_use>

The tool name should be the exact name of the tool you are using, and the arguments should be a JSON object containing the parameters required by that tool. For example:
<tool_use>
  <name>python_interpreter</name>
  <arguments>{"code": "5 + 3 + 1294.678"}</arguments>
</tool_use>

The user will respond with the result of the tool use, which should be formatted as follows:

<tool_use_result>
  <name>{tool_name}</name>
  <result>{result}</result>
</tool_use_result>

The result can be a string, file path, or any other output type that you can use as input for subsequent actions.

## Tool Use Examples
{{ TOOL_USE_EXAMPLES }}

## Tool Use Available Tools
Above example were using notional tools that might not exist for you. You only have access to these tools:
{{ AVAILABLE_TOOLS }}

## Tool Use Rules
Here are the rules you should always follow to solve your task:
1. Always use the right arguments for the tools. Never use variable names as the action arguments, use the value instead.
2. Call a tool only when needed: do not call the search agent if you do not need information, try to solve the task yourself.
3. If no tool call is needed, just answer the question directly.
4. Never re-do a tool call that you previously did with the exact same parameters.
5. For tool use, MAKE SURE use XML tag format as shown in the examples above. Do not use any other format.

# User Instructions
{{ USER_SYSTEM_PROMPT }}

Now Begin! If you solve the task correctly, you will receive a reward of $1,000,000.
`

export const ToolUseExamples = `
Here are a few examples using notional tools:
---
User: Generate an image of the oldest person in this document.

A: I can use the document_qa tool to find out who the oldest person is in the document.
<tool_use>
  <name>document_qa</name>
  <arguments>{"document": "document.pdf", "question": "Who is the oldest person mentioned?"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>document_qa</name>
  <result>John Doe, a 55 year old lumberjack living in Newfoundland.</result>
</tool_use_result>

A: I can use the image_generator tool to create a portrait of John Doe.
<tool_use>
  <name>image_generator</name>
  <arguments>{"prompt": "A portrait of John Doe, a 55-year-old man living in Canada."}</arguments>
</tool_use>

User: <tool_use_result>
  <name>image_generator</name>
  <result>image.png</result>
</tool_use_result>

A: the image is generated as image.png

---
User: "What is the result of the following operation: 5 + 3 + 1294.678?"

A: I can use the python_interpreter tool to calculate the result of the operation.
<tool_use>
  <name>python_interpreter</name>
  <arguments>{"code": "5 + 3 + 1294.678"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>python_interpreter</name>
  <result>1302.678</result>
</tool_use_result>

A: The result of the operation is 1302.678.

---
User: "Which city has the highest population , Guangzhou or Shanghai?"

A: I can use the search tool to find the population of Guangzhou.
<tool_use>
  <name>search</name>
  <arguments>{"query": "Population Guangzhou"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>search</name>
  <result>Guangzhou has a population of 15 million inhabitants as of 2021.</result>
</tool_use_result>

A: I can use the search tool to find the population of Shanghai.
<tool_use>
  <name>search</name>
  <arguments>{"query": "Population Shanghai"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>search</name>
  <result>26 million (2019)</result>
</tool_use_result>
A: The population of Shanghai is 26 million, while Guangzhou has a population of 15 million. Therefore, Shanghai has the highest population.
`

// 注意：Agentic Mode 提示词已移至 src/shared/prompts/agentic/ 目录
// 使用 buildAgenticSystemPrompt() 或 isAgenticMode() 来处理 Agentic 模式

// hasFileEditorTools 和 isAgenticMode 已移至 src/shared/prompts/agentic/index.ts
// 这里保留一个简单的重导出以保持向后兼容
export { checkHasFileEditorTools as hasFileEditorTools } from '../prompts/agentic';

export const AvailableTools = (tools: MCPTool[]) => {
  const availableTools = tools
    .map((tool) => {
      // 使用 tool.id，现在它会是一个合理的工具名称（如 _aether_fetch_html）
      const toolName = tool.id || tool.name;
      return `
<tool>
  <name>${toolName}</name>
  <description>${tool.description}</description>
  <arguments>
    ${tool.inputSchema ? JSON.stringify(tool.inputSchema) : ''}
  </arguments>
</tool>
`
    })
    .join('\n')
  return `<tools>
${availableTools}
</tools>`
}

/** 工作区信息 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
}

export interface BuildSystemPromptOptions {
  /** 是否使用 Agentic 模式的完整提示词 */
  useAgenticPrompt?: boolean;
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

export const buildSystemPrompt = (
  userSystemPrompt: string, 
  tools?: MCPTool[],
  options?: BuildSystemPromptOptions
): string => {
  if (tools && tools.length > 0) {
    // 检查是否为 Agentic 模式（包含 attempt_completion 工具）
    const isAgentic = isAgenticMode(tools);
    
    // 如果是 Agentic 模式且启用了 Agentic 提示词，使用新的提示词系统
    if (isAgentic && options?.useAgenticPrompt !== false) {
      const agenticConfig: AgenticPromptConfig = {
        userSystemPrompt,
        tools,
        cwd: options?.cwd || '.',
        osType: options?.osType || 'Unknown',
        supportsBrowserUse: options?.supportsBrowserUse || false,
        maxToolCalls: options?.maxToolCalls || 25,
        maxConsecutiveErrors: options?.maxConsecutiveErrors || 3,
        workspaces: options?.workspaces || [],
      };
      return buildAgenticSystemPrompt(agenticConfig);
    }
    
    // 非 Agentic 模式，使用简化的提示词系统
    return SYSTEM_PROMPT.replace('{{ USER_SYSTEM_PROMPT }}', userSystemPrompt)
      .replace('{{ TOOL_USE_EXAMPLES }}', ToolUseExamples)
      .replace('{{ AVAILABLE_TOOLS }}', AvailableTools(tools))
  }

  return userSystemPrompt
}

// 重新导出 Agentic 相关函数，方便外部使用
export { buildAgenticSystemPrompt, isAgenticMode, type AgenticPromptConfig } from '../prompts/agentic';
