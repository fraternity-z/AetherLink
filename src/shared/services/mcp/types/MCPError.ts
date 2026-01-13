/**
 * MCP 统一错误类型层次结构
 * 提供结构化的错误处理机制
 */

/**
 * MCP 错误代码枚举
 */
export enum MCPErrorCode {
  UNKNOWN = 'MCP_UNKNOWN',
  CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'MCP_CONNECTION_TIMEOUT',
  CONNECTION_CLOSED = 'MCP_CONNECTION_CLOSED',
  TOOL_CALL_FAILED = 'MCP_TOOL_CALL_FAILED',
  TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',
  INVALID_PARAMS = 'MCP_INVALID_PARAMS',
  SERVER_NOT_FOUND = 'MCP_SERVER_NOT_FOUND',
  TRANSPORT_ERROR = 'MCP_TRANSPORT_ERROR',
  CORS_ERROR = 'MCP_CORS_ERROR',
  INITIALIZATION_FAILED = 'MCP_INITIALIZATION_FAILED',
}

/**
 * MCP 基础错误类
 */
export class MCPError extends Error {
  public readonly code: MCPErrorCode;
  public readonly serverName?: string;
  public readonly cause?: Error;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: MCPErrorCode = MCPErrorCode.UNKNOWN,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.serverName = options?.serverName;
    this.cause = options?.cause;
    this.timestamp = new Date();

    // 保持原型链
    Object.setPrototypeOf(this, MCPError.prototype);
  }

  /**
   * 格式化错误信息
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      serverName: this.serverName,
      timestamp: this.timestamp.toISOString(),
      cause: this.cause?.message
    };
  }
}

/**
 * MCP 连接错误
 */
export class MCPConnectionError extends MCPError {
  constructor(
    message: string,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message, MCPErrorCode.CONNECTION_FAILED, options);
    this.name = 'MCPConnectionError';
    Object.setPrototypeOf(this, MCPConnectionError.prototype);
  }
}

/**
 * MCP 超时错误
 */
export class MCPTimeoutError extends MCPError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    timeoutMs: number,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message, MCPErrorCode.CONNECTION_TIMEOUT, options);
    this.name = 'MCPTimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, MCPTimeoutError.prototype);
  }
}

/**
 * MCP 工具调用错误
 */
export class MCPToolCallError extends MCPError {
  public readonly toolName: string;

  constructor(
    message: string,
    toolName: string,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message, MCPErrorCode.TOOL_CALL_FAILED, options);
    this.name = 'MCPToolCallError';
    this.toolName = toolName;
    Object.setPrototypeOf(this, MCPToolCallError.prototype);
  }
}

/**
 * MCP 传输层错误
 */
export class MCPTransportError extends MCPError {
  public readonly transportType: string;

  constructor(
    message: string,
    transportType: string,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message, MCPErrorCode.TRANSPORT_ERROR, options);
    this.name = 'MCPTransportError';
    this.transportType = transportType;
    Object.setPrototypeOf(this, MCPTransportError.prototype);
  }
}

/**
 * MCP CORS 错误（移动端特有）
 */
export class MCPCorsError extends MCPError {
  constructor(
    message: string,
    options?: {
      serverName?: string;
      cause?: Error;
    }
  ) {
    super(message, MCPErrorCode.CORS_ERROR, options);
    this.name = 'MCPCorsError';
    Object.setPrototypeOf(this, MCPCorsError.prototype);
  }
}

/**
 * 判断错误是否为 CORS 相关错误
 */
export function isCorsError(error: Error): boolean {
  return error.message.includes('CORS') || 
         error.message.includes('Access to fetch') ||
         error.message.includes('blocked by CORS');
}

/**
 * 从普通错误创建 MCP 错误
 */
export function createMCPError(
  error: Error,
  serverName?: string
): MCPError {
  if (error instanceof MCPError) {
    return error;
  }

  if (isCorsError(error)) {
    return new MCPCorsError(
      `CORS 错误: ${error.message}`,
      { serverName, cause: error }
    );
  }

  if (error.message.includes('timeout') || error.message.includes('超时')) {
    return new MCPTimeoutError(
      error.message,
      0,
      { serverName, cause: error }
    );
  }

  if (error.message.includes('connect') || error.message.includes('连接')) {
    return new MCPConnectionError(
      error.message,
      { serverName, cause: error }
    );
  }

  return new MCPError(
    error.message,
    MCPErrorCode.UNKNOWN,
    { serverName, cause: error }
  );
}
