/**
 * Settings MCP Server — 工具注册中心
 * 
 * 自动收集所有工具模块，提供扁平化的工具列表。
 * 新增工具领域只需：
 *   1. 创建 xxx.tools.ts 并导出 ToolModule
 *   2. 在此文件 import 并加入 MODULES 数组
 */

import type { SettingsTool, ToolModule } from '../types';

// ─── 导入工具模块 ───
import { knowledgeModule } from './knowledge.tools';
// 后续扩展示例：
// import { appearanceModule } from './appearance.tools';
// import { providersModule } from './providers.tools';
// import { navigationModule } from './navigation.tools';

/** 所有已注册的工具模块 */
const MODULES: ToolModule[] = [
  knowledgeModule,
  // appearanceModule,
  // providersModule,
  // navigationModule,
];

/** 获取所有工具（扁平化） */
export function getAllTools(): SettingsTool[] {
  return MODULES.flatMap(m => m.tools);
}

/** 获取所有已注册的模块 */
export function getAllModules(): ToolModule[] {
  return [...MODULES];
}

/** 按领域名查找工具 */
export function getToolsByDomain(domain: string): SettingsTool[] {
  const mod = MODULES.find(m => m.domain === domain);
  return mod ? mod.tools : [];
}
