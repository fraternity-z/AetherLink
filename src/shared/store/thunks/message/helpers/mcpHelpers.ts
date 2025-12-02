/**
 * MCP 工具获取辅助函数
 */
import { mcpService } from '../../../../services/mcp';
import type { MCPTool } from '../../../../types';

/**
 * 获取 MCP 工具
 */
export async function fetchMcpTools(toolsEnabled?: boolean): Promise<MCPTool[]> {
  if (!toolsEnabled) {
    console.log(`[MCP] 工具未启用 (toolsEnabled=${toolsEnabled})`);
    return [];
  }

  try {
    console.log(`[MCP] 开始获取工具，可能需要连接网络服务器...`);
    const mcpTools = await mcpService.getAllAvailableTools();
    console.log(`[MCP] 获取到 ${mcpTools.length} 个可用工具`);
    if (mcpTools.length > 0) {
      console.log(`[MCP] 工具列表:`, mcpTools.map(t => t.name || t.id).join(', '));
    }
    return mcpTools;
  } catch (error) {
    console.error('[MCP] 获取工具失败:', error);
    return [];
  }
}
