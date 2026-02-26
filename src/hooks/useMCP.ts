import { useState, useEffect, useCallback } from 'react';
import type { MCPServer, MCPTool, MCPPrompt, MCPResource } from '../shared/types';
import { mcpService } from '../shared/services/mcp';
import { getStorageItem, setStorageItem } from '../shared/utils/storage';

export type MCPMode = 'prompt' | 'function';

interface MCPState {
  servers: MCPServer[];
  activeServers: MCPServer[];
  tools: MCPTool[];
  prompts: MCPPrompt[];
  resources: MCPResource[];
  mode: MCPMode;
  enabled: boolean;
  bridgeMode: boolean;
  loading: boolean;
}

interface MCPActions {
  refreshServers: () => void;
  toggleServer: (serverId: string, isActive: boolean) => Promise<void>;
  setMode: (mode: MCPMode) => void;
  setEnabled: (enabled: boolean) => void;
  setBridgeMode: (enabled: boolean) => void;
  loadServerData: (server: MCPServer) => Promise<void>;
  callTool: (server: MCPServer, toolName: string, args: Record<string, any>) => Promise<any>;
}

/**
 * MCP 功能的 React Hook
 * 提供 MCP 服务器管理、工具调用等功能的状态管理
 */
export const useMCP = (): MCPState & MCPActions => {
  const [state, setState] = useState<MCPState>({
    servers: [],
    activeServers: [],
    tools: [],
    prompts: [],
    resources: [],
    mode: 'function',
    enabled: false,
    bridgeMode: false,
    loading: false
  });

  // 从 Dexie 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await getStorageItem<MCPMode>('mcp_mode');
        const savedEnabled = await getStorageItem<boolean>('mcp-tools-enabled');
        const savedBridgeMode = await getStorageItem<boolean>('mcp-bridge-mode');

        setState(prev => ({
          ...prev,
          mode: savedMode || 'function',
          enabled: savedEnabled ?? false,
          bridgeMode: savedBridgeMode ?? false
        }));
      } catch (error) {
        console.error('[MCP Hook] 加载设置失败:', error);
      }
    };

    loadSettings();
    refreshServers();
  }, []);

  // 刷新服务器列表
  const refreshServers = useCallback(async () => {
    // 🔧 修复：使用异步方法确保数据完整加载，避免竞态条件
    const allServers = await mcpService.getServersAsync();
    const active = allServers.filter(server => server.isActive);

    setState(prev => ({
      ...prev,
      servers: allServers,
      activeServers: active
    }));
  }, []);

  // 切换服务器状态
  const toggleServer = useCallback(async (serverId: string, isActive: boolean) => {
    try {
      await mcpService.toggleServer(serverId, isActive);
      await refreshServers();

      // 如果服务器被激活，加载其数据
      if (isActive) {
        // 🔧 修复：使用异步方法确保数据完整加载
        const server = await mcpService.getServerByIdAsync(serverId);
        if (server) {
          await loadServerData(server);
        }
      }
    } catch (error) {
      console.error('[MCP Hook] 切换服务器状态失败:', error);
      throw error;
    }
  }, [refreshServers]);

  // 设置 MCP 模式
  const setMode = useCallback((mode: MCPMode) => {
    setState(prev => ({ ...prev, mode }));
    setStorageItem('mcp_mode', mode);
  }, []);

  // 设置 MCP 启用状态
  const setEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, enabled }));
    setStorageItem('mcp-tools-enabled', enabled);
  }, []);

  // 设置桥梁模式
  const setBridgeMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, bridgeMode: enabled }));
    setStorageItem('mcp-bridge-mode', enabled);
  }, []);

  // 加载服务器数据（工具、提示词、资源）
  const loadServerData = useCallback(async (server: MCPServer) => {
    if (!server.isActive) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const [tools, prompts, resources] = await Promise.all([
        mcpService.listTools(server),
        mcpService.listPrompts(server),
        mcpService.listResources(server)
      ]);

      setState(prev => ({
        ...prev,
        tools: [...prev.tools.filter(t => t.serverId !== server.id), ...tools],
        prompts: [...prev.prompts.filter(p => p.serverId !== server.id), ...prompts],
        resources: [...prev.resources.filter(r => r.serverId !== server.id), ...resources],
        loading: false
      }));
    } catch (error) {
      console.error('[MCP Hook] 加载服务器数据失败:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // 调用 MCP 工具
  const callTool = useCallback(async (server: MCPServer, toolName: string, args: Record<string, any>) => {
    try {
      const result = await mcpService.callTool(server, toolName, args);
      return result;
    } catch (error) {
      console.error('[MCP Hook] 工具调用失败:', error);
      throw error;
    }
  }, []);

  // 当活跃服务器变化时，重新加载所有数据
  useEffect(() => {
    const loadAllActiveServerData = async () => {
      if (state.activeServers.length === 0) {
        setState(prev => ({
          ...prev,
          tools: [],
          prompts: [],
          resources: []
        }));
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        const allTools: MCPTool[] = [];
        const allPrompts: MCPPrompt[] = [];
        const allResources: MCPResource[] = [];

        for (const server of state.activeServers) {
          const [tools, prompts, resources] = await Promise.all([
            mcpService.listTools(server),
            mcpService.listPrompts(server),
            mcpService.listResources(server)
          ]);

          allTools.push(...tools);
          allPrompts.push(...prompts);
          allResources.push(...resources);
        }

        setState(prev => ({
          ...prev,
          tools: allTools,
          prompts: allPrompts,
          resources: allResources,
          loading: false
        }));
      } catch (error) {
        console.error('[MCP Hook] 加载活跃服务器数据失败:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadAllActiveServerData();
  }, [state.activeServers.length]); // 只在活跃服务器数量变化时触发

  return {
    ...state,
    refreshServers,
    toggleServer,
    setMode,
    setEnabled,
    setBridgeMode,
    loadServerData,
    callTool
  };
};

/**
 * 获取 MCP 工具的系统提示词
 * 用于提示词注入模式
 */
export const getMCPSystemPrompt = (tools: MCPTool[], prompts: MCPPrompt[], resources: MCPResource[]): string => {
  if (tools.length === 0 && prompts.length === 0 && resources.length === 0) {
    return '';
  }

  let systemPrompt = '\n\n# MCP 工具和资源\n\n';
  systemPrompt += '你可以使用以下工具和资源来帮助用户：\n\n';

  // 添加工具说明
  if (tools.length > 0) {
    systemPrompt += '## 可用工具\n\n';
    tools.forEach(tool => {
      systemPrompt += `### ${tool.name}\n`;
      if (tool.description) {
        systemPrompt += `${tool.description}\n`;
      }
      if (tool.inputSchema) {
        systemPrompt += `参数格式: ${JSON.stringify(tool.inputSchema, null, 2)}\n`;
      }
      systemPrompt += `服务器: ${tool.serverName}\n\n`;
    });
  }

  // 添加提示词说明
  if (prompts.length > 0) {
    systemPrompt += '## 可用提示词\n\n';
    prompts.forEach(prompt => {
      systemPrompt += `### ${prompt.name}\n`;
      if (prompt.description) {
        systemPrompt += `${prompt.description}\n`;
      }
      systemPrompt += `服务器: ${prompt.serverName}\n\n`;
    });
  }

  // 添加资源说明
  if (resources.length > 0) {
    systemPrompt += '## 可用资源\n\n';
    resources.forEach(resource => {
      systemPrompt += `### ${resource.name}\n`;
      if (resource.description) {
        systemPrompt += `${resource.description}\n`;
      }
      systemPrompt += `URI: ${resource.uri}\n`;
      systemPrompt += `服务器: ${resource.serverName}\n\n`;
    });
  }

  systemPrompt += '请根据用户的需求选择合适的工具或资源来协助完成任务。\n';

  return systemPrompt;
};

export default useMCP;
