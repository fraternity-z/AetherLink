/**
 * Time MCP Server
 * 提供获取当前时间和日期的功能
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// 工具定义
const GET_CURRENT_TIME_TOOL: Tool = {
  name: 'get_current_time',
  description: '获取当前时间和日期，支持多种格式输出',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: '时间格式：locale(本地化), iso(ISO 8601), timestamp(Unix 时间戳)',
        enum: ['locale', 'iso', 'timestamp'],
        default: 'locale'
      },
      timezone: {
        type: 'string',
        description: '时区，例如：Asia/Shanghai, America/New_York（可选）'
      }
    }
  }
};

/**
 * Time Server 类
 */
export class TimeServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/time',
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
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [GET_CURRENT_TIME_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'get_current_time') {
        return this.getCurrentTime(args as { format?: string; timezone?: string });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  /**
   * 获取当前时间
   */
  private getCurrentTime(params: { format?: string; timezone?: string }): {
    content: Array<{ type: string; text: string }>;
  } {
    try {
      const { format = 'locale', timezone } = params;
      const now = new Date();

      let timeString: string;
      let additionalInfo: any = {};

      switch (format) {
        case 'iso':
          timeString = now.toISOString();
          break;
        case 'timestamp':
          timeString = now.getTime().toString();
          additionalInfo.milliseconds = now.getTime();
          additionalInfo.seconds = Math.floor(now.getTime() / 1000);
          break;
        case 'locale':
        default:
          if (timezone) {
            timeString = now.toLocaleString('zh-CN', { timeZone: timezone });
            additionalInfo.timezone = timezone;
          } else {
            timeString = now.toLocaleString('zh-CN');
          }
          break;
      }

      // 构建详细的时间信息
      const result = {
        currentTime: timeString,
        format: format,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        weekday: now.toLocaleDateString('zh-CN', { weekday: 'long' }),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        ...additionalInfo
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取时间失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ]
      };
    }
  }
}

