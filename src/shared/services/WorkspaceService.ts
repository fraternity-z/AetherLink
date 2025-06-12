/**
 * 工作区管理服务
 * 提供工作区的创建、管理和文件访问功能
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { dexieStorage } from './DexieStorageService';
import type { 
  Workspace, 
  WorkspaceFile, 
  WorkspaceCreateRequest, 
  WorkspaceListResponse, 
  WorkspaceFilesResponse,
  WorkspaceActionResult,
  PresetFolder
} from '../types/workspace';

const WORKSPACE_STORAGE_KEY = 'workspaces';

class WorkspaceService {
  /**
   * 获取预设的常用文件夹选项
   */
  getPresetFolders(): PresetFolder[] {
    return [
      {
        label: '下载文件夹',
        path: 'Download',
        description: '系统下载目录',
        icon: 'download'
      },
      {
        label: '文档文件夹',
        path: 'Documents',
        description: '文档存储目录',
        icon: 'description'
      },
      {
        label: '图片文件夹',
        path: 'Pictures',
        description: '图片存储目录',
        icon: 'image'
      },
      {
        label: 'DCIM相机',
        path: 'DCIM',
        description: '相机拍摄的照片和视频',
        icon: 'camera_alt'
      },
      {
        label: '音乐文件夹',
        path: 'Music',
        description: '音乐文件存储目录',
        icon: 'music_note'
      },
      {
        label: '自定义路径',
        path: '',
        description: '手动输入文件夹路径',
        icon: 'folder_open'
      }
    ];
  }

  /**
   * 验证文件夹路径是否有效
   */
  async validateFolderPath(path: string): Promise<WorkspaceActionResult> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, error: '此功能仅在移动设备上可用' };
      }

      if (!path.trim()) {
        return { success: false, error: '路径不能为空' };
      }

      // 尝试读取目录内容
      const result = await Filesystem.readdir({
        path: path,
        directory: Directory.External
      });

      return { 
        success: true, 
        data: { 
          exists: true, 
          fileCount: result.files?.length || 0 
        } 
      };
    } catch (error) {
      console.error('验证文件夹路径失败:', error);
      return { 
        success: false, 
        error: `无法访问路径 "${path}"，请检查路径是否正确或权限是否足够` 
      };
    }
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(request: WorkspaceCreateRequest): Promise<WorkspaceActionResult> {
    try {
      // 验证路径
      const validation = await this.validateFolderPath(request.path);
      if (!validation.success) {
        return validation;
      }

      // 检查工作区名称是否已存在
      const existingWorkspaces = await this.getWorkspaces();
      const nameExists = existingWorkspaces.workspaces.some(
        ws => ws.name.toLowerCase() === request.name.toLowerCase()
      );

      if (nameExists) {
        return { success: false, error: '工作区名称已存在' };
      }

      // 创建工作区对象
      const workspace: Workspace = {
        id: uuidv4(),
        name: request.name,
        path: request.path,
        description: request.description,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };

      // 保存到存储
      const workspaces = await this.getWorkspaces();
      workspaces.workspaces.push(workspace);
      
      await dexieStorage.saveSetting(WORKSPACE_STORAGE_KEY, workspaces.workspaces);

      return { success: true, data: workspace };
    } catch (error) {
      console.error('创建工作区失败:', error);
      return { success: false, error: '创建工作区失败，请重试' };
    }
  }

  /**
   * 获取所有工作区
   */
  async getWorkspaces(): Promise<WorkspaceListResponse> {
    try {
      const workspaces = await dexieStorage.getSetting(WORKSPACE_STORAGE_KEY) || [];
      return {
        workspaces: workspaces.sort((a: Workspace, b: Workspace) =>
          new Date(b.lastAccessedAt || b.createdAt).getTime() -
          new Date(a.lastAccessedAt || a.createdAt).getTime()
        ),
        total: workspaces.length
      };
    } catch (error) {
      console.error('获取工作区列表失败:', error);
      return { workspaces: [], total: 0 };
    }
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    try {
      const workspaces = await this.getWorkspaces();
      return workspaces.workspaces.find(ws => ws.id === id) || null;
    } catch (error) {
      console.error('获取工作区详情失败:', error);
      return null;
    }
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(id: string): Promise<WorkspaceActionResult> {
    try {
      const workspaces = await this.getWorkspaces();
      const filteredWorkspaces = workspaces.workspaces.filter(ws => ws.id !== id);
      
      if (filteredWorkspaces.length === workspaces.workspaces.length) {
        return { success: false, error: '工作区不存在' };
      }

      await dexieStorage.saveSetting(WORKSPACE_STORAGE_KEY, filteredWorkspaces);
      return { success: true };
    } catch (error) {
      console.error('删除工作区失败:', error);
      return { success: false, error: '删除工作区失败，请重试' };
    }
  }

  /**
   * 更新工作区最后访问时间
   */
  async updateLastAccessed(id: string): Promise<void> {
    try {
      const workspaces = await this.getWorkspaces();
      const workspace = workspaces.workspaces.find(ws => ws.id === id);
      
      if (workspace) {
        workspace.lastAccessedAt = new Date().toISOString();
        await dexieStorage.saveSetting(WORKSPACE_STORAGE_KEY, workspaces.workspaces);
      }
    } catch (error) {
      console.error('更新访问时间失败:', error);
    }
  }

  /**
   * 获取工作区文件列表
   */
  async getWorkspaceFiles(workspaceId: string, subPath: string = ''): Promise<WorkspaceFilesResponse> {
    try {
      const workspace = await this.getWorkspace(workspaceId);
      if (!workspace) {
        throw new Error('工作区不存在');
      }

      // 更新最后访问时间
      await this.updateLastAccessed(workspaceId);

      // 构建完整路径
      const fullPath = subPath ? `${workspace.path}/${subPath}` : workspace.path;

      // 读取目录内容
      const result = await Filesystem.readdir({
        path: fullPath,
        directory: Directory.External
      });

      if (!result.files) {
        return {
          files: [],
          currentPath: fullPath,
          parentPath: subPath ? workspace.path : undefined
        };
      }

      // 转换文件信息
      const files: WorkspaceFile[] = result.files.map(file => ({
        name: file.name,
        path: file.uri,
        size: file.size || 0,
        isDirectory: file.type === 'directory',
        type: file.type || 'file',
        modifiedTime: file.mtime || Date.now(),
        extension: file.name.includes('.') ? file.name.split('.').pop() : undefined
      }));

      // 排序：目录在前，然后按名称排序
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        files,
        currentPath: fullPath,
        parentPath: subPath ? (subPath.includes('/') ? subPath.split('/').slice(0, -1).join('/') : '') : undefined
      };
    } catch (error) {
      console.error('获取工作区文件失败:', error);
      throw new Error('无法读取工作区文件，请检查路径是否存在或权限是否足够');
    }
  }
}

export const workspaceService = new WorkspaceService();
