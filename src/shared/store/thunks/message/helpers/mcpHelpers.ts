/**
 * MCP 工具获取辅助函数
 */
import { mcpService } from '../../../../services/mcp';
import { getMemoryToolDefinitions } from '../../../../services/memory/memoryTools';
import { isMemoryToolEnabled } from '../memoryIntegration';
import { MCP_BRIDGE_TOOL_DEFINITION } from '../../../../services/mcp/McpBridgeTool';
import { READ_SKILL_TOOL_DEFINITION } from '../../../../services/skills/SkillReadTool';
import { getStorageItem } from '../../../../utils/storage';
import type { MCPTool } from '../../../../types';

/**
 * 获取 MCP 工具
 * @param toolsEnabled 是否启用工具
 * @param hasSkills 助手是否绑定了技能（用于注入 read_skill 工具）
 */
export async function fetchMcpTools(toolsEnabled?: boolean, hasSkills?: boolean): Promise<MCPTool[]> {
  if (!toolsEnabled) {
    console.log(`[MCP] 工具未启用 (toolsEnabled=${toolsEnabled})`);
    return [];
  }

  // 🔌 桥梁模式（全局设置）：只注入 1 个 mcp_bridge 工具，替代所有工具定义
  const bridgeMode = await getStorageItem<boolean>('mcp-bridge-mode');
  if (bridgeMode) {
    console.log(`[MCP] 桥梁模式激活 — 仅注入 mcp_bridge 工具（替代 ${mcpService.getServers().length} 个服务器的所有工具）`);
    const tools: MCPTool[] = [MCP_BRIDGE_TOOL_DEFINITION];

    // 记忆工具仍然正常注入（它不是 MCP server 工具）
    if (isMemoryToolEnabled()) {
      const memoryTools = getMemoryToolDefinitions();
      tools.push(...memoryTools);
      console.log(`[Memory] 添加 ${memoryTools.length} 个记忆工具`);
    }

    // read_skill 独立注入（OpenClaw 风格：只要有技能就可用）
    if (hasSkills) {
      tools.push(READ_SKILL_TOOL_DEFINITION);
      console.log(`[Skill] 添加 read_skill 工具`);
    }

    return tools;
  }

  try {
    console.log(`[MCP] 开始获取工具，可能需要连接网络服务器...`);
    const mcpTools = await mcpService.getAllAvailableTools();
    
    // 如果记忆工具开关开启，添加记忆工具
    if (isMemoryToolEnabled()) {
      const memoryTools = getMemoryToolDefinitions();
      mcpTools.push(...memoryTools);
      console.log(`[Memory] 添加 ${memoryTools.length} 个记忆工具`);
    }

    // read_skill 独立注入（OpenClaw 风格：只要有技能就可用，不依赖桥梁模式）
    if (hasSkills) {
      mcpTools.push(READ_SKILL_TOOL_DEFINITION);
      console.log(`[Skill] 添加 read_skill 工具`);
    }
    
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
