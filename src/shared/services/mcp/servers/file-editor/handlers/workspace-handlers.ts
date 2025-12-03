/**
 * 工作区相关处理器
 */

import { workspaceService } from '../../../../WorkspaceService';
import { createSuccessResponse } from '../utils/response';

/** 工作区缓存 */
let workspaceCache: Array<{ id: string; name: string; path: string }> = [];

/**
 * 列出所有工作区
 */
export async function listWorkspaces() {
  try {
    const result = await workspaceService.getWorkspaces();
    
    // 缓存工作区列表
    workspaceCache = result.workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      path: ws.path
    }));
    
    // 返回带编号的工作区列表
    const workspaces = result.workspaces.map((ws, index) => ({
      index: index + 1,  // 1-based 编号，更友好
      id: ws.id,
      name: ws.name,
      path: ws.path,
      description: ws.description || ''
    }));

    return createSuccessResponse({
      workspaces,
      total: result.total,
      message: `找到 ${result.total} 个工作区。使用编号（如 "1"）或 ID 调用 get_workspace_files 浏览文件。`,
      usage: 'get_workspace_files({ workspace: "1" }) 或 get_workspace_files({ workspace: "uuid-xxx" })'
    });
  } catch (error) {
    throw new Error(`获取工作区列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 根据编号或ID获取工作区
 */
export async function resolveWorkspace(workspaceRef: string): Promise<{ id: string; name: string; path: string } | null> {
  // 如果缓存为空，先加载
  if (workspaceCache.length === 0) {
    const result = await workspaceService.getWorkspaces();
    workspaceCache = result.workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      path: ws.path
    }));
  }

  // 尝试作为编号解析（1-based）
  const index = parseInt(workspaceRef, 10);
  if (!isNaN(index) && index >= 1 && index <= workspaceCache.length) {
    return workspaceCache[index - 1];
  }

  // 尝试作为 ID 解析
  const byId = workspaceCache.find(ws => ws.id === workspaceRef);
  if (byId) return byId;

  // 尝试作为名称解析
  const byName = workspaceCache.find(ws => ws.name === workspaceRef);
  if (byName) return byName;

  return null;
}

/**
 * 获取工作区文件
 */
export async function getWorkspaceFiles(params: { 
  workspace: string; 
  sub_path?: string; 
  recursive?: boolean;
  max_depth?: number;
}) {
  const { workspace, sub_path = '', recursive = false, max_depth = 3 } = params;

  if (!workspace) {
    throw new Error('缺少必需参数: workspace（可以是编号如 "1" 或工作区ID）');
  }

  try {
    // 解析工作区引用
    const ws = await resolveWorkspace(workspace);
    if (!ws) {
      throw new Error(`找不到工作区: ${workspace}。请先调用 list_workspaces 查看可用工作区。`);
    }

    if (recursive) {
      // 递归模式：获取所有子目录的文件
      const allFiles = await getFilesRecursive(ws.id, sub_path, 0, max_depth);
      
      return createSuccessResponse({
        workspace: ws.name,
        workspacePath: ws.path,
        currentPath: sub_path || '/',
        mode: 'recursive',
        maxDepth: max_depth,
        files: allFiles,
        totalFiles: allFiles.length,
        hint: `递归获取了 ${allFiles.length} 个文件（最大深度: ${max_depth} 层）`
      });
    } else {
      // 浅层模式：只获取当前目录
      const result = await workspaceService.getWorkspaceFilesAdvanced(ws.id, sub_path);
      
      // 分离目录和文件，目录在前
      const directories = result.files.filter(f => f.isDirectory).map(f => ({
        name: f.name + '/',
        path: f.path,
        type: 'directory'
      }));
      
      const files = result.files.filter(f => !f.isDirectory).map(f => ({
        name: f.name,
        path: f.path,
        size: f.size,
        type: f.type || 'file'
      }));

      return createSuccessResponse({
        workspace: ws.name,
        workspacePath: ws.path,
        currentPath: sub_path || '/',
        mode: 'shallow',
        directories,
        files,
        totalDirectories: directories.length,
        totalFiles: files.length,
        hint: directories.length > 0 
          ? `有 ${directories.length} 个子目录。用 sub_path 深入浏览，或设置 recursive=true 获取全部文件` 
          : undefined
      });
    }
  } catch (error) {
    throw new Error(`获取工作区文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 递归获取文件列表
 */
async function getFilesRecursive(
  workspaceId: string, 
  currentPath: string, 
  currentDepth: number, 
  maxDepth: number
): Promise<Array<{ name: string; path: string; size: number; type: string; depth: number }>> {
  if (currentDepth > maxDepth) {
    return [];
  }

  const result = await workspaceService.getWorkspaceFilesAdvanced(workspaceId, currentPath);
  const files: Array<{ name: string; path: string; size: number; type: string; depth: number }> = [];

  for (const item of result.files) {
    if (item.isDirectory) {
      // 递归获取子目录的文件
      const subPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      const subFiles = await getFilesRecursive(workspaceId, subPath, currentDepth + 1, maxDepth);
      files.push(...subFiles);
    } else {
      // 添加文件
      files.push({
        name: item.name,
        path: item.path,
        size: item.size,
        type: item.type || 'file',
        depth: currentDepth
      });
    }
  }

  return files;
}
