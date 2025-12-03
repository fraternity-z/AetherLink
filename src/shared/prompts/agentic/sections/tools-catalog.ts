/**
 * 工具目录
 */

import type { MCPTool } from '../../../types/index';

export function getToolsCatalogSection(tools: MCPTool[]): string {
  if (!tools || tools.length === 0) {
    return '';
  }

  const toolsXml = tools
    .map((tool) => {
      const toolName = tool.id || tool.name;
      const description = tool.description || 'No description available';
      const schema = tool.inputSchema ? JSON.stringify(tool.inputSchema, null, 2) : '';
      
      return `<tool>
  <name>${escapeXml(toolName)}</name>
  <description>${escapeXml(description)}</description>
  <server>${escapeXml(tool.serverName)}</server>${schema ? `
  <input_schema>
${indent(schema, 4)}
  </input_schema>` : ''}
</tool>`;
    })
    .join('\n\n');

  return `# Available Tools

The following tools are available for you to use. Each tool has a specific purpose and set of parameters.

<tools>
${toolsXml}
</tools>

## Tool Categories

${categorizeTools(tools)}

Choose the most appropriate tool for each step of your task. Always verify that you have all required parameters before calling a tool.`;
}

/**
 * 对工具进行分类说明
 * 针对 @aether/file-editor MCP 服务器的工具进行优化
 */
function categorizeTools(tools: MCPTool[]): string {
  const categories: Record<string, string[]> = {
    'Workspace': [],
    'File Reading': [],
    'File Writing': [],
    'File Management': [],
    'Code Editing': [],
    'Search': [],
    'Task Completion': [],
    'Other': [],
  };

  // 精确匹配规则，针对 @aether/file-editor 工具
  const exactMatches: Record<string, string> = {
    'list_workspaces': 'Workspace',
    'get_workspace_files': 'Workspace',
    'read_file': 'File Reading',
    'list_files': 'File Reading',
    'get_file_info': 'File Reading',
    'write_to_file': 'File Writing',
    'create_file': 'File Writing',
    'rename_file': 'File Management',
    'move_file': 'File Management',
    'copy_file': 'File Management',
    'delete_file': 'File Management',
    'insert_content': 'Code Editing',
    'replace_in_file': 'Code Editing',
    'apply_diff': 'Code Editing',
    'search_files': 'Search',
    'attempt_completion': 'Task Completion',
  };

  for (const tool of tools) {
    const toolName = tool.id || tool.name;
    
    // 先尝试精确匹配
    if (exactMatches[toolName]) {
      categories[exactMatches[toolName]].push(toolName);
    } else {
      // 模式匹配作为后备
      let categorized = false;
      if (/workspace/i.test(toolName)) {
        categories['Workspace'].push(toolName);
        categorized = true;
      } else if (/read|list|get.*info/i.test(toolName)) {
        categories['File Reading'].push(toolName);
        categorized = true;
      } else if (/write|create/i.test(toolName)) {
        categories['File Writing'].push(toolName);
        categorized = true;
      } else if (/rename|move|copy|delete/i.test(toolName)) {
        categories['File Management'].push(toolName);
        categorized = true;
      } else if (/insert|replace|diff|edit/i.test(toolName)) {
        categories['Code Editing'].push(toolName);
        categorized = true;
      } else if (/search|find|grep/i.test(toolName)) {
        categories['Search'].push(toolName);
        categorized = true;
      } else if (/completion|finish|done/i.test(toolName)) {
        categories['Task Completion'].push(toolName);
        categorized = true;
      }
      
      if (!categorized) {
        categories['Other'].push(toolName);
      }
    }
  }

  const lines: string[] = [];
  for (const [category, toolNames] of Object.entries(categories)) {
    if (toolNames.length > 0) {
      lines.push(`**${category}**: ${toolNames.join(', ')}`);
    }
  }

  return lines.join('\n');
}

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 缩进文本
 */
function indent(str: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return str.split('\n').map(line => prefix + line).join('\n');
}
