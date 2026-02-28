/**
 * Settings MCP Server
 * 
 * 内置 MCP 服务器，提供应用设置的智能管理能力。
 * 遵循 CalculatorServer 等现有内置服务器的统一模式。
 * 
 * MVP 阶段聚焦知识库管理，后续可通过添加工具模块扩展到：
 * - 外观设置（主题、字号、语言等）
 * - 模型提供商管理
 * - 导航辅助
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getAllTools } from './tools';
import { ToolConfirmationService } from '../../confirmation/ToolConfirmationService';

export class SettingsServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/settings',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    const tools = getAllTools();

    // 自动注册 confirm 级别的工具到确认服务
    const confirmService = ToolConfirmationService.getInstance();
    for (const tool of tools) {
      if (tool.permission === 'confirm') {
        confirmService.registerConfirmable(
          tool.definition.name,
          'high',
          // 使用工具描述的第一行作为摘要的回退
          undefined
        );
      }
    }

    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools.map(t => t.definition)
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
      const { name, arguments: args } = request.params;

      const tool = tools.find(t => t.definition.name === name);
      if (!tool) {
        throw new Error(`未知的工具: ${name}`);
      }

      try {
        return await tool.handler((args as Record<string, unknown>) || {});
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : '工具执行失败'
            })
          }],
          isError: true
        };
      }
    });
  }
}
