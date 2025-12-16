/**
 * 日志记录服务
 * 提供统一的日志记录功能
 */
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';

// 日志级别
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOGS_KEY = 'app_logs';
const MAX_LOGS = 100;

// 内存缓存，避免频繁异步操作
let logsCache: any[] = [];
let cacheInitialized = false;

// 异步初始化日志缓存
async function initLogsCache(): Promise<void> {
  if (cacheInitialized) return;
  try {
    const stored = await getStorageItem<any[]>(LOGS_KEY);
    logsCache = stored || [];
    cacheInitialized = true;
  } catch {
    logsCache = [];
    cacheInitialized = true;
  }
}

// 异步保存日志（防抖）
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSaveLogs(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setStorageItem(LOGS_KEY, logsCache);
    } catch (error) {
      console.error('无法写入日志到存储:', error);
    }
  }, 1000);
}

// 日志记录函数
export function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  // 根据不同级别使用不同的控制台方法
  // 序列化数据对象，避免[object Object]
  const serializedData = data ? JSON.stringify(data, null, 2) : '';

  switch (level) {
    case 'DEBUG':
      console.log(`[${timestamp}] [DEBUG] ${message}`, serializedData);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [INFO] ${message}`, serializedData);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [WARN] ${message}`, serializedData);
      break;
    case 'ERROR':
      console.error(`[${timestamp}] [ERROR] ${message}`, serializedData);
      break;
  }

  // 将日志存储到内存缓存，并异步持久化
  if (!cacheInitialized) {
    initLogsCache();
  }
  
  logsCache.push(logEntry);
  
  // 保留最近的日志
  if (logsCache.length > MAX_LOGS) {
    logsCache.splice(0, logsCache.length - MAX_LOGS);
  }
  
  // 防抖保存到Dexie
  debouncedSaveLogs();
}

// 记录API请求
export function logApiRequest(endpoint: string, level: LogLevel, data: any): void {
  // 确保请求数据被完整记录
  console.log(`API请求详情 [${endpoint}]:`, JSON.stringify(data, null, 2));
  log(level, `API请求 [${endpoint}]`, data);
}

// 记录API响应
export function logApiResponse(endpoint: string, statusCode: number, data: any): void {
  const level = statusCode >= 400 ? 'ERROR' : 'INFO';
  // 确保响应数据被完整记录
  console.log(`API响应详情 [${endpoint}] 状态码: ${statusCode}:`, JSON.stringify(data, null, 2));
  log(level, `API响应 [${endpoint}] 状态码: ${statusCode}`, data);
}

// 获取最近的日志（同步，使用缓存）
export function getRecentLogs(count: number = 50): any[] {
  return logsCache.slice(-count);
}

// 获取最近的日志（异步，从存储读取）
export async function getRecentLogsAsync(count: number = 50): Promise<any[]> {
  try {
    const logs = await getStorageItem<any[]>(LOGS_KEY);
    if (logs) {
      logsCache = logs;
      return logs.slice(-count);
    }
    return logsCache.slice(-count);
  } catch (error) {
    console.error('无法从存储获取日志:', error);
    return logsCache.slice(-count);
  }
}

// 清除所有日志
export async function clearLogs(): Promise<void> {
  try {
    logsCache = [];
    await removeStorageItem(LOGS_KEY);
  } catch (error) {
    console.error('无法清除日志:', error);
  }
}

export default {
  log,
  logApiRequest,
  logApiResponse,
  getRecentLogs,
  clearLogs
};
