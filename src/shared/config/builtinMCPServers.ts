/**
 * 内置 MCP 服务器配置
 * 集中管理所有内置 MCP 工具的配置信息
 */

import type { MCPServer } from '../types';

/**
 * 内置 MCP 服务器配置列表
 * 添加新的内置 MCP 工具时，只需要在这里添加配置即可
 */
export const BUILTIN_MCP_SERVERS: MCPServer[] = [
  {
    id: 'builtin-time',
    name: '@aether/time',
    type: 'inMemory',
    description: '获取当前时间和日期，支持多种格式（本地化、ISO 8601、时间戳）和时区设置',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['时间', '日期', '工具']
  },
  {
    id: 'builtin-fetch',
    name: '@aether/fetch',
    type: 'inMemory',
    description: '获取网页内容，支持 HTML、JSON 和纯文本格式，可自定义请求头',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['网页', '抓取', 'HTTP', 'API']
  },
  {
    id: 'builtin-calculator',
    name: '@aether/calculator',
    type: 'inMemory',
    description: '高级计算器，支持基本运算、科学计算、进制转换、单位转换和统计计算',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['计算', '数学', '转换', '统计', '工具']
  },
  {
    id: 'builtin-calendar',
    name: '@aether/calendar',
    type: 'inMemory',
    description: '日历管理工具，支持创建、查询、修改和删除日历事件，查看日历列表',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['日历', '事件', '提醒', '时间管理', '工具']
  },
  {
    id: 'builtin-alarm',
    name: '@aether/alarm',
    type: 'inMemory',
    description: '闹钟和提醒工具，支持设置单次或重复闹钟，管理所有提醒',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['闹钟', '提醒', '通知', '时间管理', '工具']
  },
  {
    id: 'builtin-metaso-search',
    name: '@aether/metaso-search',
    type: 'inMemory',
    description: '秘塔AI官方API，提供网页搜索、内容阅读器和AI智能对话。支持5种知识范围、3种模型、引用来源和关键要点提取',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['搜索', 'AI', '对话', '阅读器', '工具'],
    env: {
      METASO_API_KEY: ''
    }
  },
  {
    id: 'builtin-file-editor',
    name: '@aether/file-editor',
    type: 'inMemory',
    description: 'AI 文件编辑工具，支持读取、写入、插入、替换、应用 diff 等操作。可用于工作区和笔记文件的编辑。',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['文件', '编辑', 'AI', '工作区', '笔记', '工具']
  },
  {
    id: 'builtin-dex-editor',
    name: '@aether/dex-editor',
    type: 'inMemory',
    description: 'DEX 文件编辑工具，让 AI 可以浏览、搜索、查看和修改 APK 中的 Smali 代码。支持列出类、获取方法、搜索代码、编辑保存和签名。',
    isActive: false,
    provider: 'AetherAI',
    logoUrl: '',
    tags: ['DEX', 'Smali', 'APK', '逆向', '编辑', 'Android', '工具']
  }
];

/**
 * 获取内置 MCP 服务器列表
 */
export function getBuiltinMCPServers(): MCPServer[] {
  return [...BUILTIN_MCP_SERVERS];
}

/**
 * 检查服务器是否为内置服务器
 */
export function isBuiltinServer(serverName: string): boolean {
  return BUILTIN_MCP_SERVERS.some(server => server.name === serverName);
}

/**
 * 获取内置服务器的默认配置
 */
export function getBuiltinServerConfig(serverName: string): MCPServer | undefined {
  return BUILTIN_MCP_SERVERS.find(server => server.name === serverName);
}

/**
 * 获取所有内置服务器的名称列表
 */
export function getBuiltinServerNames(): string[] {
  return BUILTIN_MCP_SERVERS.map(server => server.name);
}

/**
 * 根据 ID 获取内置服务器配置
 */
export function getBuiltinServerById(id: string): MCPServer | undefined {
  return BUILTIN_MCP_SERVERS.find(server => server.id === id);
}

/**
 * 根据标签筛选内置服务器
 */
export function getBuiltinServersByTag(tag: string): MCPServer[] {
  return BUILTIN_MCP_SERVERS.filter(server => 
    server.tags && server.tags.includes(tag)
  );
}

/**
 * 获取所有内置服务器的标签
 */
export function getAllBuiltinServerTags(): string[] {
  const tags = new Set<string>();
  BUILTIN_MCP_SERVERS.forEach(server => {
    if (server.tags) {
      server.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags);
}
