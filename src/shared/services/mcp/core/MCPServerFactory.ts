import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getBuiltinMCPServers, isBuiltinServer, getBuiltinServerConfig } from '../../../config/builtinMCPServers';
import { TimeServer } from '../servers/TimeServer';
import { FetchServer } from '../servers/FetchServer';
import { CalculatorServer } from '../servers/CalculatorServer';

/**
 * 创建内存 MCP 服务器
 * 工厂函数用于创建内置的 MCP 服务器实例
 */
export function createInMemoryMCPServer(name: string, args: string[] = [], envs: Record<string, string> = {}): Server {
  console.log(`[MCP] 创建内存 MCP 服务器: ${name}，参数: ${args}，环境变量: ${JSON.stringify(envs)}`);

  switch (name) {
    case '@aether/time': {
      return new TimeServer().server;
    }

    case '@aether/fetch': {
      return new FetchServer().server;
    }

    case '@aether/calculator': {
      return new CalculatorServer().server;
    }

    default:
      throw new Error(`未知的内置 MCP 服务器: ${name}`);
  }
}

// 导出配置文件中的函数，保持向后兼容
export { getBuiltinMCPServers, isBuiltinServer, getBuiltinServerConfig };
