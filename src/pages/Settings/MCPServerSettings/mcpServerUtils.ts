import React from 'react';
import {
  Server as ServerIcon,
  Wifi as WifiIcon,
  Cpu as StorageIcon,
  Cog as SettingsIcon,
  Terminal as TerminalIcon
} from 'lucide-react';
import type { MCPServerType } from '../../../shared/types';

// ─── 服务器类型视觉映射 ───

export const getServerTypeIcon = (type: MCPServerType) => {
  switch (type) {
    case 'sse':
      return React.createElement(ServerIcon, { size: 20 });
    case 'streamableHttp':
    case 'httpStream':
      return React.createElement(WifiIcon, { size: 20 });
    case 'stdio':
      return React.createElement(TerminalIcon, { size: 20 });
    case 'inMemory':
      return React.createElement(StorageIcon, { size: 20 });
    default:
      return React.createElement(SettingsIcon, { size: 20 });
  }
};

export const getServerTypeLabel = (type: MCPServerType, t: (key: string) => string) => {
  switch (type) {
    case 'sse':
      return t('settings.mcpServer.serverTypes.sse');
    case 'streamableHttp':
      return t('settings.mcpServer.serverTypes.streamableHttp');
    case 'httpStream':
      return t('settings.mcpServer.serverTypes.httpStream');
    case 'stdio':
      return t('settings.mcpServer.serverTypes.stdio');
    case 'inMemory':
      return t('settings.mcpServer.serverTypes.inMemory');
    default:
      return t('settings.mcpServer.serverTypes.unknown');
  }
};

export const getServerTypeColor = (type: MCPServerType) => {
  switch (type) {
    case 'sse':
      return '#2196f3'; // 蓝色
    case 'streamableHttp':
      return '#00bcd4'; // 青色
    case 'httpStream':
      return '#ff5722'; // 橙红色 (废弃标记)
    case 'stdio':
      return '#ff9800'; // 橙色
    case 'inMemory':
      return '#4CAF50'; // 绿色
    default:
      return '#9e9e9e';
  }
};

// ─── 内置服务器翻译辅助 ───

export const getBuiltinServerDescription = (serverName: string, t: (key: string) => string): string => {
  const key = `settings.mcpServer.builtinDialog.servers.${serverName}.description`;
  const translated = t(key);
  return translated === key ? '' : translated;
};

export const getTagTranslation = (tag: string, t: (key: string) => string, serverName?: string): string => {
  if (serverName) {
    const key = `settings.mcpServer.builtinDialog.servers.${serverName}.tags.${tag}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }
  const servers = ['@aether/time', '@aether/fetch', '@aether/calculator'];
  for (const srvName of servers) {
    const key = `settings.mcpServer.builtinDialog.servers.${srvName}.tags.${tag}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }
  return tag;
};

// ─── JSON 导入类型规范化 ───

export const normalizeType = (type: string | undefined, serverConfig?: any): MCPServerType => {
  if (type) {
    const lowerType = type.toLowerCase().replace(/[-_]/g, '');

    if (lowerType === 'streamablehttp' || lowerType === 'streamable') {
      return 'streamableHttp';
    }
    if (lowerType === 'httpstream') {
      return 'httpStream';
    }
    if (lowerType === 'inmemory' || lowerType === 'memory') {
      return 'inMemory';
    }
    if (lowerType === 'sse' || lowerType === 'serversent' || lowerType === 'serversentevents') {
      return 'sse';
    }
    if (lowerType === 'stdio' || lowerType === 'standardio') {
      return 'stdio';
    }
  }

  // 🔧 智能推断：如果有 command 字段，说明是 stdio 类型（Claude Desktop 标准格式）
  if (serverConfig?.command) {
    return 'stdio';
  }

  // 如果有 url 或 baseUrl 字段，说明是 HTTP 类型
  if (serverConfig?.url || serverConfig?.baseUrl) {
    return 'sse';
  }

  // 默认返回 sse
  return 'sse';
};
