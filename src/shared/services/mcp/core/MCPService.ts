import type { MCPServer, MCPTool, MCPPrompt, MCPResource, MCPCallToolResponse } from '../../../types';
import { getStorageItem, setStorageItem } from '../../../utils/storage';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createInMemoryMCPServer } from './MCPServerFactory';
import { getBuiltinMCPServers, isBuiltinServer } from '../../../config/builtinMCPServers';
import { MCPClientAdapter } from '../clients/MCPClientAdapter';
import { AiSdkMCPClient } from '../clients/AiSdkMCPClient';
import { StdioMCPClient } from '../clients/StdioMCPClient';
import { isMemoryTool } from '../../memory/memoryTools';
import { handleMemoryToolCall } from '../../memory/memoryToolHandler';
import { ToolConfirmationService } from '../confirmation/ToolConfirmationService';
import { Capacitor } from '@capacitor/core';
import { 
  MCPCorsError, 
  createMCPError,
  isCorsError 
} from '../types/MCPError';
import { AGENTIC_MODE_SERVER } from '../types/constants';

/**
 * 根据 URL 推断 MCP 服务器类型
 * @param url - 服务器 URL
 * @returns 服务器类型
 */
function getMcpServerType(url: string): 'streamableHttp' | 'sse' {
  // 如果 URL 以 /mcp 结尾，使用 streamableHttp，否则使用 sse
  return url.endsWith('/mcp') ? 'streamableHttp' : 'sse';
}

/**
 * 规范化服务器类型（处理向后兼容）
 * @param server - MCP 服务器配置
 * @returns 规范化后的类型
 */
function normalizeServerType(server: MCPServer): MCPServer['type'] {
  // httpStream 已废弃，自动转换为 sse
  if (server.type === 'httpStream') {
    console.log(`[MCP] 检测到废弃的 httpStream 类型，自动转换为 sse: ${server.name}`);
    return 'sse';
  }
  
  // 如果没有指定类型但有 baseUrl，根据 URL 推断
  if (!server.type && server.baseUrl) {
    const inferredType = getMcpServerType(server.baseUrl);
    console.log(`[MCP] 根据 URL 推断类型: ${server.name} -> ${inferredType}`);
    return inferredType;
  }
  
  return server.type;
}

/**
 * 构建函数调用工具名称 - 参考最佳实例逻辑
 */
function buildFunctionCallToolName(serverName: string, toolName: string): string {
  const sanitizedServer = serverName.trim().replace(/-/g, '_');
  const sanitizedTool = toolName.trim().replace(/-/g, '_');

  // Combine server name and tool name
  let name = sanitizedTool;
  if (!sanitizedTool.includes(sanitizedServer.slice(0, 7))) {
    name = `${sanitizedServer.slice(0, 7) || ''}-${sanitizedTool || ''}`;
  }

  // Replace invalid characters with underscores or dashes
  // Keep a-z, A-Z, 0-9, underscores and dashes
  name = name.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Ensure name starts with a letter or underscore (for valid JavaScript identifier)
  if (!/^[a-zA-Z]/.test(name)) {
    name = `tool-${name}`;
  }

  // Remove consecutive underscores/dashes (optional improvement)
  name = name.replace(/[_-]{2,}/g, '_');

  // Truncate to 63 characters maximum
  if (name.length > 63) {
    name = name.slice(0, 63);
  }

  // Handle edge case: ensure we still have a valid name if truncation left invalid chars at edges
  if (name.endsWith('_') || name.endsWith('-')) {
    name = name.slice(0, -1);
  }

  return name;
}

/**
 * MCP 服务管理类
 * 负责管理 MCP 服务器的配置、连接和工具调用
 */
export class MCPService {
  private static instance: MCPService;
  private servers: MCPServer[] = [];
  private clients: Map<string, Client> = new Map();
  private pendingClients: Map<string, Promise<Client>> = new Map();

  // MCP 客户端适配器缓存（用于 HTTP/SSE 传输）
  // 移动端使用 AiSdkMCPClient（AI SDK 5.0），Web 端使用 MCPClientAdapter（代理服务器）
  private mcpClientAdapters: Map<string, MCPClientAdapter | AiSdkMCPClient> = new Map();
  private pendingMcpClientAdapters: Map<string, Promise<MCPClientAdapter | AiSdkMCPClient>> = new Map();

  // 添加服务器状态保存字段
  private savedActiveServerIds: Set<string> = new Set();

  // 🔧 修复：跟踪加载状态，避免竞态条件
  private loadingPromise: Promise<void> | null = null;
  private isLoaded: boolean = false;

  private constructor() {
    this.loadingPromise = this.loadServers();
  }

  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * 确保服务器配置已加载完成
   * 在执行任何操作前调用此方法
   */
  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) {
      await this.loadingPromise;
    }
  }

  /**
   * 从存储加载 MCP 服务器配置
   */
  private async loadServers(): Promise<void> {
    try {
      const savedServers = await getStorageItem<MCPServer[]>('mcp_servers');
      if (savedServers) {
        this.servers = savedServers;
        console.log(`[MCP] 成功加载 ${savedServers.length} 个服务器配置`);
      }
    } catch (error) {
      console.error('[MCP] 加载服务器配置失败:', error);
    } finally {
      this.isLoaded = true;
      this.loadingPromise = null;
    }
  }

  /**
   * 保存 MCP 服务器配置到存储
   */
  private async saveServers(): Promise<void> {
    try {
      await setStorageItem('mcp_servers', this.servers);
    } catch (error) {
      console.error('[MCP] 保存服务器配置失败:', error);
    }
  }

  /**
   * 获取所有 MCP 服务器
   * 注意：由于同步返回，如果在初始化完成前调用可能返回空数组
   * 如需确保数据完整，请先调用 ensureLoaded() 或使用 getServersAsync()
   */
  public getServers(): MCPServer[] {
    return [...this.servers];
  }

  /**
   * 异步获取所有 MCP 服务器（确保数据已加载）
   */
  public async getServersAsync(): Promise<MCPServer[]> {
    await this.ensureLoaded();
    return [...this.servers];
  }

  /**
   * 获取活跃的 MCP 服务器
   */
  public getActiveServers(): MCPServer[] {
    return this.servers.filter(server => server.isActive);
  }

  /**
   * 根据 ID 获取服务器
   */
  public getServerById(id: string): MCPServer | undefined {
    return this.servers.find(server => server.id === id);
  }

  /**
   * 异步根据 ID 获取服务器（确保数据已加载）
   */
  public async getServerByIdAsync(id: string): Promise<MCPServer | undefined> {
    await this.ensureLoaded();
    return this.servers.find(server => server.id === id);
  }

  /**
   * 添加新的 MCP 服务器
   */
  public async addServer(server: MCPServer): Promise<void> {
    // 🔧 修复：确保先加载完成，避免覆盖已有数据
    await this.ensureLoaded();
    this.servers.push(server);
    console.log(`[MCP] 添加服务器: ${server.name}, type=${server.type}, command=${server.command || 'N/A'}`);
    await this.saveServers();
  }

  /**
   * 更新 MCP 服务器
   */
  public async updateServer(updatedServer: MCPServer): Promise<void> {
    // 🔧 修复：确保先加载完成，避免覆盖已有数据
    await this.ensureLoaded();
    const index = this.servers.findIndex(server => server.id === updatedServer.id);
    if (index !== -1) {
      console.log(`[MCP] 更新服务器: ${updatedServer.name}, type=${updatedServer.type}, command=${updatedServer.command || 'N/A'}`);
      this.servers[index] = updatedServer;
      await this.saveServers();
    } else {
      console.warn(`[MCP] 未找到要更新的服务器: ${updatedServer.id}`);
    }
  }

  /**
   * 删除 MCP 服务器
   */
  public async removeServer(serverId: string): Promise<void> {
    // 🔧 修复：确保先加载完成，避免覆盖已有数据
    await this.ensureLoaded();
    this.servers = this.servers.filter(server => server.id !== serverId);
    // 清理客户端连接
    this.clients.delete(serverId);
    await this.saveServers();
  }

  /**
   * 启动/停止服务器
   */
  public async toggleServer(serverId: string, isActive: boolean): Promise<void> {
    const server = this.getServerById(serverId);
    if (server) {
      const serverKey = this.getServerKey(server);

      if (!isActive) {
        // 停止时清理客户端连接
        await this.closeClient(serverKey);
      }

      server.isActive = isActive;
      await this.saveServers();

      // 如果启动服务器，尝试初始化连接
      if (isActive) {
        try {
          await this.initClient(server);
          console.log(`[MCP] 服务器已启动: ${server.name}`);
        } catch (error) {
          console.error(`[MCP] 启动服务器失败: ${server.name}`, error);
          // 启动失败时回滚状态
          server.isActive = false;
          await this.saveServers();
          throw error;
        }
      }
    }
  }

  /**
   * 获取服务器的唯一键
   */
  private getServerKey(server: MCPServer): string {
    return JSON.stringify({
      baseUrl: server.baseUrl,
      args: server.args,
      env: server.env,
      type: server.type,
      name: server.name,
      id: server.id
    });
  }

  /**
   * 初始化 MCP 客户端
   */
  private async initClient(server: MCPServer): Promise<Client> {
    const serverKey = this.getServerKey(server);

    // 如果有正在初始化的客户端，等待它完成
    const pendingClient = this.pendingClients.get(serverKey);
    if (pendingClient) {
      console.log(`[MCP] 等待正在初始化的连接: ${server.name}`);
      return pendingClient;
    }

    // 检查是否已有客户端连接
    const existingClient = this.clients.get(serverKey);
    if (existingClient) {
      try {
        // 检查现有客户端是否还活着
        console.log(`[MCP] 检查现有连接健康状态: ${server.name}`);
        await existingClient.ping();
        console.log(`[MCP] 复用现有连接: ${server.name}`);
        return existingClient;
      } catch (error) {
        console.warn(`[MCP] 现有连接已失效，重新创建: ${server.name}`, error);
        // 清理失效的连接
        this.clients.delete(serverKey);
      }
    }

    // 创建初始化 Promise 并缓存
    const initPromise = (async (): Promise<Client> => {
      // 创建新的客户端
      const client = new Client(
        { name: 'AetherLink Mobile', version: '1.0.0' },
        { capabilities: {} }
      );

      try {
      let transport;

      // 根据服务器类型创建传输层
      if (server.type === 'inMemory') {
        console.log(`[MCP] 创建内存传输: ${server.name}`);
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        // 创建内存服务器
        const inMemoryServer = createInMemoryMCPServer(server.name, server.args || [], server.env || {});
        await inMemoryServer.connect(serverTransport);

        transport = clientTransport;

      } else if (server.type === 'stdio') {
        // stdio 传输（仅 Tauri 桌面端可用）
        if (!StdioMCPClient.isAvailable()) {
          throw new Error('stdio 传输仅在 Tauri 桌面端可用');
        }

        if (!server.command) {
          throw new Error('stdio 服务器需要提供 command（要执行的命令）');
        }

        console.log(`[MCP] 创建 stdio 传输: ${server.command} ${(server.args || []).join(' ')}`);

        const stdioClient = await this.initStdioClient(server);

        // 创建一个兼容的 Client 对象
        // 注意：使用类型断言是因为 SDK 的 Client 类型有 60+ 个私有属性，
        // 但我们只需要实现其公共方法接口
        const compatClient = {
          connect: async () => {},
          close: async () => { await stdioClient.close(); },
          ping: async () => { /* stdio 不支持 ping */ },
          listTools: async () => {
            const tools = await stdioClient.listTools();
            return { tools };
          },
          callTool: async (params: { name: string; arguments: Record<string, unknown> }) => {
            return await stdioClient.callTool(params.name, params.arguments);
          },
          listPrompts: async () => {
            const prompts = await stdioClient.listPrompts();
            return { prompts };
          },
          listResources: async () => {
            const resources = await stdioClient.listResources();
            return { resources };
          }
        } as unknown as Client;

        // 缓存客户端
        this.clients.set(serverKey, compatClient);
        console.log(`[MCP] 成功连接到 stdio 服务器: ${server.name}`);
        return compatClient;

      } else if (server.type === 'sse' || server.type === 'streamableHttp' || server.type === 'httpStream') {
        // 规范化类型（处理向后兼容）
        const normalizedType = normalizeServerType(server);
        
        // 使用官方 SDK 的传输层
        if (!server.baseUrl) {
          throw new Error(`${normalizedType} 服务器需要提供 baseUrl`);
        }

        console.log(`[MCP] 创建 ${normalizedType} 传输: ${server.baseUrl}`);

        // Web 端和移动端都使用 MCPClientAdapter（官方 SDK）
        // universalFetch 会自动处理平台差异：Web 端用代理，移动端用 CORS 插件
        const httpStreamClient = await this.initMcpClientAdapter({ ...server, type: normalizedType });

        // 创建一个兼容的 Client 对象
        // 注意：使用类型断言是因为 SDK 的 Client 类型有 60+ 个私有属性，
        // 但我们只需要实现其公共方法接口
        const compatClient = {
          connect: async () => {},
          close: async () => { await httpStreamClient.close(); },
          ping: async () => { /* HTTP Stream 不支持 ping */ },
          listTools: async () => {
            const tools = await httpStreamClient.listTools();
            return { tools };
          },
          callTool: async (params: { name: string; arguments: Record<string, unknown> }) => {
            return await httpStreamClient.callTool(params.name, params.arguments);
          },
          listPrompts: async () => ({ prompts: [] }),
          listResources: async () => ({ resources: [] })
        } as unknown as Client;

        // 缓存客户端
        this.clients.set(serverKey, compatClient);
        console.log(`[MCP] 成功连接到 HTTP Stream 服务器: ${server.name}`);
        return compatClient;
      } else {
        throw new Error(`不支持的服务器类型: ${server.type}`);
      }

      // 对于inMemory类型，连接客户端
      if (server.type === 'inMemory') {
        // 连接客户端
        await client.connect(transport);

        // 缓存客户端
        this.clients.set(serverKey, client);

        console.log(`[MCP] 成功连接到服务器: ${server.name}`);
        return client;
      }

      // 这里不应该到达，因为所有类型都已处理
      throw new Error(`未处理的服务器类型: ${server.type}`);
      } catch (error) {
        console.error(`[MCP] 连接服务器失败: ${server.name}`, error);

        // 使用统一的错误处理
        if (error instanceof Error) {
          // 在移动端，为CORS错误提供更友好的错误信息
          if (Capacitor.isNativePlatform() && isCorsError(error)) {
            console.log(`[MCP] 移动端CORS错误，这通常表示服务器配置问题或网络问题`);
            throw new MCPCorsError(
              `连接MCP服务器失败: ${server.name} - 网络连接问题或服务器不可用`,
              { serverName: server.name, cause: error }
            );
          }
          // 其他错误转换为 MCP 错误
          throw createMCPError(error, server.name);
        }

        throw error;
      } finally {
        // 清理 pending 状态
        this.pendingClients.delete(serverKey);
      }
    })();

    // 缓存初始化 Promise
    this.pendingClients.set(serverKey, initPromise);

    return initPromise;
  }

  /**
   * 初始化 MCP 客户端适配器（基于官方 SDK）
   */
  private async initMcpClientAdapter(server: MCPServer): Promise<MCPClientAdapter | AiSdkMCPClient> {
    const serverKey = this.getServerKey(server);

    // 检查是否已有客户端连接
    const existingClient = this.mcpClientAdapters.get(serverKey);
    if (existingClient) {
      console.log(`[MCP] 复用现有 MCP 客户端: ${server.name}`);
      return existingClient;
    }

    // 检查是否有正在初始化的客户端
    const pendingClient = this.pendingMcpClientAdapters.get(serverKey);
    if (pendingClient) {
      console.log(`[MCP] 等待正在初始化的 MCP 客户端: ${server.name}`);
      return pendingClient;
    }

    // 创建初始化 Promise
    const initPromise = (async (): Promise<MCPClientAdapter | AiSdkMCPClient> => {
      try {
        // 规范化类型
        const normalizedType = normalizeServerType(server);
        const transportType = normalizedType === 'streamableHttp' ? 'streamableHttp' : 'sse';
        
        const isMobile = Capacitor.isNativePlatform();
        console.log(`[MCP] 创建 MCP 客户端，传输类型: ${transportType}，平台: ${isMobile ? '移动端' : 'Web端'}`);
        
        let client: MCPClientAdapter | AiSdkMCPClient;
        
        console.log(`[MCP] ${isMobile ? '移动端' : 'Web端'} 使用 MCPClientAdapter`);
        
        // 移动端：确保 headers 中没有 origin 和 referer（模仿代理服务器的行为）
        let finalHeaders = server.headers || {};
        if (isMobile && finalHeaders) {
          const filteredHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(finalHeaders)) {
            const lowerKey = key.toLowerCase();
            // 过滤掉 origin 和 referer（代理服务器会移除这些）
            if (lowerKey !== 'origin' && lowerKey !== 'referer') {
              filteredHeaders[key] = value;
            }
          }
          finalHeaders = filteredHeaders;
          console.log(`[MCP] 移动端过滤 headers，移除 origin/referer`);
        }
        
        client = new MCPClientAdapter({
          baseUrl: server.baseUrl!,
          headers: finalHeaders,
          timeout: (server.timeout || 60) * 1000,
          type: transportType
        });

        await client.initialize();

        // 缓存客户端
        this.mcpClientAdapters.set(serverKey, client as any);
        console.log(`[MCP] MCP 客户端初始化成功: ${server.name}`);

        return client;
      } catch (error) {
        console.error(`[MCP] MCP 客户端初始化失败: ${server.name}`, error);
        throw error;
      } finally {
        // 清理 pending 状态
        this.pendingMcpClientAdapters.delete(serverKey);
      }
    })();

    // 缓存初始化 Promise
    this.pendingMcpClientAdapters.set(serverKey, initPromise as any);

    return initPromise;
  }

  // Stdio 客户端缓存
  private stdioClients: Map<string, StdioMCPClient> = new Map();
  private pendingStdioClients: Map<string, Promise<StdioMCPClient>> = new Map();

  /**
   * 初始化 Stdio MCP 客户端（Tauri 桌面端专用）
   */
  private async initStdioClient(server: MCPServer): Promise<StdioMCPClient> {
    const serverKey = this.getServerKey(server);

    // 检查是否已有客户端连接
    const existingClient = this.stdioClients.get(serverKey);
    if (existingClient) {
      console.log(`[MCP] 复用现有 Stdio 客户端: ${server.name}`);
      return existingClient;
    }

    // 检查是否有正在初始化的客户端
    const pendingClient = this.pendingStdioClients.get(serverKey);
    if (pendingClient) {
      console.log(`[MCP] 等待正在初始化的 Stdio 客户端: ${server.name}`);
      return pendingClient;
    }

    // 创建初始化 Promise
    const initPromise = (async (): Promise<StdioMCPClient> => {
      try {
        console.log(`[MCP] 创建 Stdio 客户端: ${server.command} ${(server.args || []).join(' ')}`);

        const client = new StdioMCPClient({
          command: server.command!,
          args: server.args || [],
          env: server.env || {},
          timeout: (server.timeout || 60) * 1000
        });

        await client.initialize();

        // 缓存客户端
        this.stdioClients.set(serverKey, client);
        console.log(`[MCP] Stdio 客户端初始化成功: ${server.name}`);

        return client;
      } catch (error) {
        console.error(`[MCP] Stdio 客户端初始化失败: ${server.name}`, error);
        throw error;
      } finally {
        // 清理 pending 状态
        this.pendingStdioClients.delete(serverKey);
      }
    })();

    // 缓存初始化 Promise
    this.pendingStdioClients.set(serverKey, initPromise);

    return initPromise;
  }

  /**
   * 关闭客户端连接
   */
  private async closeClient(serverKey: string): Promise<void> {
    const client = this.clients.get(serverKey);
    if (client) {
      try {
        await client.close();
        console.log(`[MCP] 已关闭连接: ${serverKey}`);
      } catch (error) {
        console.error(`[MCP] 关闭客户端连接失败:`, error);
      }
      this.clients.delete(serverKey);
    }

    // 关闭 MCP 客户端适配器
    const mcpClientAdapter = this.mcpClientAdapters.get(serverKey);
    if (mcpClientAdapter) {
      try {
        await mcpClientAdapter.close();
        console.log(`[MCP] 已关闭 MCP 客户端: ${serverKey}`);
      } catch (error) {
        console.error(`[MCP] 关闭 MCP 客户端连接失败:`, error);
      }
      this.mcpClientAdapters.delete(serverKey);
    }

    // 关闭 Stdio 客户端
    const stdioClient = this.stdioClients.get(serverKey);
    if (stdioClient) {
      try {
        await stdioClient.close();
        console.log(`[MCP] 已关闭 Stdio 客户端: ${serverKey}`);
      } catch (error) {
        console.error(`[MCP] 关闭 Stdio 客户端连接失败:`, error);
      }
      this.stdioClients.delete(serverKey);
    }

    // 同时清理 pending 状态
    this.pendingClients.delete(serverKey);
    this.pendingMcpClientAdapters.delete(serverKey);
    this.pendingStdioClients.delete(serverKey);
  }

  /**
   * 测试服务器连接
   */
  public async testConnection(server: MCPServer): Promise<boolean> {
    try {
      console.log(`[MCP] 测试连接到服务器: ${server.name}`);

      const client = await this.initClient(server);

      // 尝试列出工具来测试连接
      await client.listTools();

      console.log(`[MCP] 连接测试成功: ${server.name}`);
      return true;
    } catch (error) {
      console.error(`[MCP] 连接测试失败: ${server.name}`, error);

      // 清理失败的连接
      const serverKey = this.getServerKey(server);
      await this.closeClient(serverKey);

      return false;
    }
  }

  /**
   * 获取服务器工具列表
   */
  public async listTools(server: MCPServer): Promise<MCPTool[]> {
    try {
      console.log(`[MCP] 获取服务器工具: ${server.name}`);

      const client = await this.initClient(server);
      console.log(`[MCP] 客户端已连接，正在调用 listTools...`);

      const result = await client.listTools();
      console.log(`[MCP] listTools 响应:`, result);

      const allTools = result.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        serverName: server.name,
        serverId: server.id,
        id: buildFunctionCallToolName(server.name, tool.name)
      }));

      // 过滤掉用户禁用的工具，使其对 AI 不可见
      const disabledTools = server.disabledTools || [];
      const tools = disabledTools.length > 0
        ? allTools.filter(tool => !disabledTools.includes(tool.name))
        : allTools;

      if (disabledTools.length > 0) {
        console.log(`[MCP] 服务器 ${server.name} 过滤了 ${allTools.length - tools.length} 个禁用工具`);
      }
      console.log(`[MCP] 服务器 ${server.name} 返回 ${tools.length} 个工具:`, tools.map(t => t.name));
      return tools;
    } catch (error) {
      console.error(`[MCP] 获取工具列表失败:`, error);
      return [];
    }
  }

  /**
   * 调用 MCP 工具
   */
  public async callTool(
    server: MCPServer,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPCallToolResponse> {
    // 检查是否为记忆工具，使用内置处理器
    if (isMemoryTool(toolName)) {
      console.log(`[Memory] 调用记忆工具: ${toolName}`, args);
      const result = await handleMemoryToolCall(toolName, args);
      return {
        content: [{ type: 'text', text: result.message }],
        isError: !result.success
      };
    }

    // 禁用工具拦截 — 即使 AI 硬编码工具名也无法调用
    const disabledTools = server.disabledTools || [];
    if (disabledTools.includes(toolName)) {
      console.warn(`[MCP] 工具 ${toolName} 已被用户禁用，拒绝调用`);
      return {
        content: [{ type: 'text', text: `工具 ${toolName} 已被用户禁用。` }],
        isError: true
      };
    }

    // 敏感操作确认拦截（支持用户权限覆写）
    const confirmService = ToolConfirmationService.getInstance();
    const permOverrides = server.toolPermissionOverrides || {};
    const overriddenPerm = permOverrides[toolName];

    // 判断是否需要确认：覆写权限优先，否则回退到默认注册表
    const needsConfirm = overriddenPerm
      ? overriddenPerm === 'confirm'
      : confirmService.needsConfirmation(toolName);

    if (needsConfirm) {
      const approved = await confirmService.requestConfirmation(
        server.name,
        toolName,
        args
      );
      if (!approved) {
        return {
          content: [{ type: 'text', text: '用户已拒绝此操作。' }],
          isError: true
        };
      }
    }

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[MCP] 调用工具: ${server.name}.${toolName} (尝试 ${attempt + 1}/${maxRetries})`, args);

        const client = await this.initClient(server);
        const result = await client.callTool(
          { name: toolName, arguments: args },
          undefined,
          { timeout: (server.timeout || 60) * 1000 }
        );

        return {
          content: result.content as Array<{
            type: 'text' | 'image' | 'resource';
            text?: string;
            data?: string;
            mimeType?: string;
          }>,
          isError: Boolean(result.isError)
        };
      } catch (error) {
        lastError = error;
        console.warn(`[MCP] 工具调用失败 (尝试 ${attempt + 1}/${maxRetries}):`, error);

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[MCP] 工具调用最终失败:`, lastError);
    return {
      content: [
        {
          type: 'text',
          text: `工具调用失败: ${lastError instanceof Error ? lastError.message : '未知错误'}`
        }
      ],
      isError: true
    };
  }

  /**
   * 获取服务器提示词列表
   */
  public async listPrompts(server: MCPServer): Promise<MCPPrompt[]> {
    try {
      console.log(`[MCP] 获取服务器提示词: ${server.name}`);

      const client = await this.initClient(server);
      const result = await client.listPrompts();

      return result.prompts.map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
        serverName: server.name,
        serverId: server.id
      }));
    } catch (error) {
      // 如果是 Method not found 错误，说明服务器不支持此功能，静默处理
      if (error instanceof Error && error.message.includes('-32601')) {
        console.log(`[MCP] 服务器 ${server.name} 不支持提示词功能`);
        return [];
      }
      console.error(`[MCP] 获取提示词列表失败:`, error);
      return [];
    }
  }

  /**
   * 获取服务器资源列表
   */
  public async listResources(server: MCPServer): Promise<MCPResource[]> {
    try {
      console.log(`[MCP] 获取服务器资源: ${server.name}`);

      const client = await this.initClient(server);
      const result = await client.listResources();

      return result.resources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
        serverName: server.name,
        serverId: server.id
      }));
    } catch (error) {
      // 如果是 Method not found 错误，说明服务器不支持此功能，静默处理
      if (error instanceof Error && error.message.includes('-32601')) {
        console.log(`[MCP] 服务器 ${server.name} 不支持资源功能`);
        return [];
      }
      console.error(`[MCP] 获取资源列表失败:`, error);
      return [];
    }
  }

  /**
   * 停止服务器
   */
  public async stopServer(serverId: string): Promise<void> {
    const server = this.getServerById(serverId);
    if (server) {
      const serverKey = this.getServerKey(server);
      await this.closeClient(serverKey);
      console.log(`[MCP] 服务器已停止: ${server.name}`);
    }
  }

  /**
   * 重启服务器
   */
  public async restartServer(serverId: string): Promise<void> {
    const server = this.getServerById(serverId);
    if (server) {
      console.log(`[MCP] 重启服务器: ${server.name}`);
      const serverKey = this.getServerKey(server);
      await this.closeClient(serverKey);

      if (server.isActive) {
        // 重新初始化连接
        await this.initClient(server);
      }
    }
  }

  /**
   * 获取内置服务器列表
   */
  public getBuiltinServers(): MCPServer[] {
    return getBuiltinMCPServers();
  }

  /**
   * 添加内置服务器
   */
  public async addBuiltinServer(serverName: string, config?: Partial<MCPServer>): Promise<void> {
    try {
      // 从内置服务器列表中查找配置
      const builtinServers = this.getBuiltinServers();
      const defaultConfig = builtinServers.find(server => server.name === serverName);

      if (!defaultConfig) {
        throw new Error(`未找到内置服务器: ${serverName}`);
      }

      // 合并配置
      const serverConfig: MCPServer = {
        ...defaultConfig,
        ...config,
        id: config?.id || `builtin-${Date.now()}`,
        name: serverName,
        isActive: config?.isActive !== undefined ? config.isActive : true
      };

      // 添加到服务器列表
      await this.addServer(serverConfig);
      console.log(`[MCP] 成功添加内置服务器: ${serverName}`);
    } catch (error) {
      console.error(`[MCP] 添加内置服务器失败: ${serverName}`, error);
      throw error;
    }
  }

  /**
   * 检查服务器是否为内置服务器
   */
  public isBuiltinServer(serverName: string): boolean {
    return isBuiltinServer(serverName);
  }

  /**
   * 获取所有可用的 MCP 工具
   */
  public async getAllAvailableTools(): Promise<MCPTool[]> {
    const allServers = this.getServers();
    const activeServers = this.getActiveServers();
    const allTools: MCPTool[] = [];

    console.log(`[MCP] 总服务器数量: ${allServers.length}, 活跃服务器数量: ${activeServers.length}`);

    if (allServers.length > 0) {
      console.log(`[MCP] 所有服务器:`, allServers.map(s => `${s.name}(${s.isActive ? '活跃' : '非活跃'})`).join(', '));
    }

    if (activeServers.length === 0) {
      console.log(`[MCP] 没有活跃的 MCP 服务器`);
      return allTools;
    }

    for (const server of activeServers) {
      try {
        console.log(`[MCP] 正在获取服务器 ${server.name} 的工具...`);
        const tools = await this.listTools(server);
        console.log(`[MCP] 服务器 ${server.name} 提供 ${tools.length} 个工具`);
        allTools.push(...tools);
      } catch (error) {
        console.error(`[MCP] 获取服务器 ${server.name} 的工具失败:`, error);
      }
    }

    return allTools;
  }

  /**
   * 获取已启用的服务器名称列表
   * 用于 Agentic 模式检测
   */
  public getActiveServerNames(): string[] {
    const activeServers = this.getActiveServers();
    return activeServers.map(server => server.name);
  }

  /**
   * 检查是否启用了特定的 MCP 服务器
   */
  public hasActiveServer(serverName: string): boolean {
    const activeNames = this.getActiveServerNames();
    return activeNames.includes(serverName);
  }

  /**
   * 检查是否应该启用 Agentic 模式
   * 基于已启用的 MCP 服务器判断
   */
  public shouldEnableAgenticMode(): boolean {
    // 检查是否启用了 Agentic 模式触发服务器
    return this.hasActiveServer(AGENTIC_MODE_SERVER);
  }

  /**
   * 检查连接健康状态
   */
  public async checkConnectionHealth(server: MCPServer): Promise<boolean> {
    const serverKey = this.getServerKey(server);
    const client = this.clients.get(serverKey);

    if (!client) {
      return false;
    }

    try {
      await client.ping();
      return true;
    } catch (error) {
      console.warn(`[MCP] 连接健康检查失败: ${server.name}`, error);
      // 清理失效的连接
      this.clients.delete(serverKey);
      return false;
    }
  }

  /**
   * 获取连接状态信息
   */
  public getConnectionStatus(): {
    activeConnections: number;
    pendingConnections: number;
    connections: Array<{ serverKey: string; status: 'active' | 'pending' }>;
  } {
    const connections: Array<{ serverKey: string; status: 'active' | 'pending' }> = [];

    // 活跃连接
    for (const serverKey of this.clients.keys()) {
      connections.push({ serverKey, status: 'active' });
    }

    // 待连接
    for (const serverKey of this.pendingClients.keys()) {
      if (!this.clients.has(serverKey)) {
        connections.push({ serverKey, status: 'pending' });
      }
    }

    return {
      activeConnections: this.clients.size,
      pendingConnections: this.pendingClients.size,
      connections
    };
  }

  /**
   * 关闭所有活跃的服务器
   */
  public async stopAllActiveServers(): Promise<void> {
    const activeServers = this.getActiveServers();
    console.log(`[MCP] 正在关闭 ${activeServers.length} 个活跃服务器`);

    // 保存当前活跃服务器的ID，以便后续恢复
    this.savedActiveServerIds.clear();
    activeServers.forEach(server => {
      this.savedActiveServerIds.add(server.id);
    });
    console.log(`[MCP] 已保存 ${this.savedActiveServerIds.size} 个活跃服务器的状态`);

    const promises = activeServers.map(async (server) => {
      try {
        await this.toggleServer(server.id, false);
        console.log(`[MCP] 已关闭服务器: ${server.name}`);
      } catch (error) {
        console.error(`[MCP] 关闭服务器失败: ${server.name}`, error);
      }
    });

    await Promise.all(promises);
    console.log('[MCP] 所有活跃服务器已关闭');
  }

  /**
   * 恢复之前保存的活跃服务器状态
   */
  public async restoreSavedActiveServers(): Promise<void> {
    if (this.savedActiveServerIds.size === 0) {
      console.log('[MCP] 没有保存的活跃服务器状态需要恢复');
      return;
    }

    console.log(`[MCP] 正在恢复 ${this.savedActiveServerIds.size} 个服务器的活跃状态`);

    const promises = Array.from(this.savedActiveServerIds).map(async (serverId) => {
      try {
        const server = this.getServerById(serverId);
        if (server) {
          await this.toggleServer(serverId, true);
          console.log(`[MCP] 已恢复服务器: ${server.name}`);
        }
      } catch (error) {
        console.error(`[MCP] 恢复服务器失败: ${serverId}`, error);
      }
    });

    await Promise.all(promises);
    console.log('[MCP] 所有保存的活跃服务器状态已恢复');

    // 清空保存的状态
    this.savedActiveServerIds.clear();
  }

  /**
   * 检查是否有保存的活跃服务器状态
   */
  public hasSavedActiveServers(): boolean {
    return this.savedActiveServerIds.size > 0;
  }

  /**
   * 清理所有连接
   */
  public async cleanup(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map(key => this.closeClient(key));
    await Promise.all(promises);
    this.pendingClients.clear();
    console.log('[MCP] 所有连接已清理');
  }
}

// 导出单例实例
export const mcpService = MCPService.getInstance();
