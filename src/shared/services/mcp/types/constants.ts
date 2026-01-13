/**
 * MCP 常量定义
 * 消除魔法字符串，集中管理配置常量
 */

/**
 * 内置 MCP 服务器名称常量
 */
export const MCP_SERVER_NAMES = {
  TIME: '@aether/time',
  FETCH: '@aether/fetch',
  CALCULATOR: '@aether/calculator',
  CALENDAR: '@aether/calendar',
  ALARM: '@aether/alarm',
  METASO_SEARCH: '@aether/metaso-search',
  FILE_EDITOR: '@aether/file-editor',
  DEX_EDITOR: '@aether/dex-editor',
} as const;

/**
 * Agentic 模式触发服务器
 * 当此服务器启用时，启用 Agentic 模式
 */
export const AGENTIC_MODE_SERVER = MCP_SERVER_NAMES.FILE_EDITOR;

/**
 * MCP 传输类型常量
 */
export const MCP_TRANSPORT_TYPES = {
  IN_MEMORY: 'inMemory',
  SSE: 'sse',
  STREAMABLE_HTTP: 'streamableHttp',
  STDIO: 'stdio',
  HTTP_STREAM: 'httpStream', // 已废弃，向后兼容
} as const;

/**
 * MCP 协议版本
 */
export const MCP_PROTOCOL_VERSION = '2025-03-26';

/**
 * 默认配置常量
 */
export const MCP_DEFAULTS = {
  /** 默认超时时间（秒） */
  TIMEOUT_SECONDS: 60,
  /** 默认重试次数 */
  MAX_RETRIES: 3,
  /** 重连超时（毫秒） */
  RECONNECT_TIMEOUT_MS: 3000,
  /** 消息端点等待超时（毫秒） */
  MESSAGE_ENDPOINT_TIMEOUT_MS: 5000,
  /** 工具名称最大长度 */
  TOOL_NAME_MAX_LENGTH: 63,
} as const;

/**
 * 客户端标识
 */
export const MCP_CLIENT_INFO = {
  WEB: {
    name: 'AetherLink',
    version: '1.0.0'
  },
  MOBILE: {
    name: 'AetherLink Mobile',
    version: '1.0.0'
  },
  DESKTOP: {
    name: 'AetherLink Desktop',
    version: '1.0.0'
  }
} as const;

/**
 * 存储键常量
 */
export const MCP_STORAGE_KEYS = {
  SERVERS: 'mcp_servers',
  MODE: 'mcp_mode',
  ENABLED: 'mcp-tools-enabled',
} as const;

/**
 * 日志前缀
 */
export const MCP_LOG_PREFIX = '[MCP]';
