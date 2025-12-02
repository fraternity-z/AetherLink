import type { MCPTool } from '../types/index';

export const SYSTEM_PROMPT = `In this environment you have access to a set of tools you can use to answer the user's question. \
You can use one tool per message, and will receive the result of that tool use in the user's response. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

## Tool Use Formatting

Tool use is formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

<tool_use>
  <name>{tool_name}</name>
  <arguments>{json_arguments}</arguments>
</tool_use>

**Important**: Tool tags must be complete and unbroken. Ensure no line breaks or spaces within tag names (e.g., use <tool_use> not <tool _use>).

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
Above examples were using notional tools for demonstration. You only have access to these tools:
{{ AVAILABLE_TOOLS }}

## Tool Use Rules
Here are the rules you should always follow to solve your task:
1. Always use the right arguments for the tools. Never use variable names as the action arguments, use the value instead.
2. Call a tool only when needed: do not call the search agent if you do not need information, try to solve the task yourself.
3. If no tool call is needed, just answer the question directly.
4. Never re-do a tool call that you previously did with the exact same parameters.
5. For tool use, MAKE SURE to use the XML tag format as shown in the examples above. Do not use any other format.

{{ FILE_EDITOR_CAPABILITIES }}

# User Instructions
{{ USER_SYSTEM_PROMPT }}
`

export const ToolUseExamples = `
Here are a few examples using notional tools:
---
User: Generate an image of the oldest person in this document.

Assistant: I can use the document_qa tool to find out who the oldest person is in the document.
<tool_use>
  <name>document_qa</name>
  <arguments>{"document": "document.pdf", "question": "Who is the oldest person mentioned?"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>document_qa</name>
  <result>John Doe, a 55 year old lumberjack living in Newfoundland.</result>
</tool_use_result>

Assistant: I can use the image_generator tool to create a portrait of John Doe.
<tool_use>
  <name>image_generator</name>
  <arguments>{"prompt": "A portrait of John Doe, a 55-year-old man living in Canada."}</arguments>
</tool_use>

User: <tool_use_result>
  <name>image_generator</name>
  <result>image.png</result>
</tool_use_result>

Assistant: the image is generated as image.png

---
User: "What is the result of the following operation: 5 + 3 + 1294.678?"

Assistant: I can use the python_interpreter tool to calculate the result of the operation.
<tool_use>
  <name>python_interpreter</name>
  <arguments>{"code": "5 + 3 + 1294.678"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>python_interpreter</name>
  <result>1302.678</result>
</tool_use_result>

Assistant: The result of the operation is 1302.678.

---
User: "Which city has the highest population , Guangzhou or Shanghai?"

Assistant: I can use the search tool to find the population of Guangzhou.
<tool_use>
  <name>search</name>
  <arguments>{"query": "Population Guangzhou"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>search</name>
  <result>Guangzhou has a population of 15 million inhabitants as of 2021.</result>
</tool_use_result>

Assistant: I can use the search tool to find the population of Shanghai.
<tool_use>
  <name>search</name>
  <arguments>{"query": "Population Shanghai"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>search</name>
  <result>26 million (2019)</result>
</tool_use_result>
Assistant: The population of Shanghai is 26 million, while Guangzhou has a population of 15 million. Therefore, Shanghai has the highest population.
`

// Agentic Mode 能力说明（仅当文件编辑工具可用时注入）
export const FILE_EDITOR_CAPABILITIES = `
## Agentic Mode

You are operating in **Agentic Mode**, which means:
1. You can make multiple tool calls iteratively to complete complex tasks
2. Tool results are automatically sent back to you for the next decision
3. You MUST call attempt_completion when you finish the task

**CRITICAL: Task Completion Protocol**

When you have completed the user's task, you MUST call the attempt_completion tool:

<tool_use>
  <name>attempt_completion</name>
  <arguments>{"result": "Brief summary of what you accomplished", "command": "Optional: suggested command to run"}</arguments>
</tool_use>

**When to call attempt_completion:**
- After successfully completing all requested tasks
- After verifying your changes are correct
- When the task objective has been fully achieved

**When NOT to call attempt_completion:**
- When a tool call just failed (try to fix the error first)
- In the middle of a multi-step task
- When you need more information from the user

**Limits:**
- Maximum iterations: 25 tool calls
- Consecutive error limit: 3 failures in a row
`;

/**
 * 检查工具列表中是否包含文件编辑工具
 */
export const hasFileEditorTools = (tools: MCPTool[]): boolean => {
  if (!tools || tools.length === 0) return false;
  
  const fileEditorToolNames = [
    'list_workspaces',
    'get_workspace_files', 
    'read_file',
    'write_to_file',
    'insert_content',
    'replace_in_file',
    'apply_diff',
    'attempt_completion'  // Agentic 模式完成工具
  ];
  
  return tools.some(tool => 
    fileEditorToolNames.includes(tool.name) || 
    tool.serverName === '@aether/file-editor'
  );
};

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

export const buildSystemPrompt = (userSystemPrompt: string, tools?: MCPTool[]): string => {
  if (tools && tools.length > 0) {
    // 检查是否有文件编辑工具，如果有则注入文件编辑能力说明
    const fileEditorCapabilities = hasFileEditorTools(tools) ? FILE_EDITOR_CAPABILITIES : '';
    
    return SYSTEM_PROMPT.replace('{{ USER_SYSTEM_PROMPT }}', userSystemPrompt)
      .replace('{{ TOOL_USE_EXAMPLES }}', ToolUseExamples)
      .replace('{{ AVAILABLE_TOOLS }}', AvailableTools(tools))
      .replace('{{ FILE_EDITOR_CAPABILITIES }}', fileEditorCapabilities)
  }

  return userSystemPrompt
}
