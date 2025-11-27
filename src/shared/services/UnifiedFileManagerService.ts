/**
 * 统一文件管理服务
 * 为 Tauri 和 Capacitor 双架构提供统一的文件管理 API
 * 自动根据运行平台选择对应的后端实现
 */

import { isTauri, isCapacitor } from '../utils/platformDetection';
import type {
  PermissionResult,
  FileInfo,
  ListDirectoryOptions,
  ListDirectoryResult,
  CreateDirectoryOptions,
  FileOperationOptions,
  CreateFileOptions,
  ReadFileOptions,
  ReadFileResult,
  WriteFileOptions,
  MoveFileOptions,
  CopyFileOptions,
  RenameFileOptions,
  SearchFilesOptions,
  SearchFilesResult,
  SystemFilePickerOptions,
  SystemFilePickerResult,
  SelectedFileInfo
} from '../types/fileManager';

// ============================================
// Tauri 实现
// ============================================

class TauriFileManagerImpl {
  private shellModule: typeof import('@tauri-apps/plugin-shell') | null = null;
  private invokeModule: typeof import('@tauri-apps/api/core') | null = null;

  private async loadModules() {
    if (!this.invokeModule) {
      this.invokeModule = await import('@tauri-apps/api/core');
    }
    if (!this.shellModule) {
      this.shellModule = await import('@tauri-apps/plugin-shell');
    }
  }

  // 调用合并插件的命令
  private async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    await this.loadModules();
    return this.invokeModule!.invoke(`plugin:advanced-file-manager|${cmd}`, args);
  }

  async requestPermissions(): Promise<PermissionResult> {
    // Tauri 桌面端不需要权限请求
    return { granted: true, message: '桌面端无需权限' };
  }

  async checkPermissions(): Promise<PermissionResult> {
    return { granted: true, message: '桌面端无需权限' };
  }

  async openSystemFilePicker(options: SystemFilePickerOptions): Promise<SystemFilePickerResult> {
    await this.loadModules();

    try {
      // 使用合并插件的 dialog_open 命令
      const result = await this.invoke<string | string[] | null>('dialog_open', {
        title: options.title || '选择文件或文件夹',
        directory: options.type === 'directory',
        multiple: options.multiple,
        filters: options.accept?.map(ext => ({
          name: ext.replace('.', '').toUpperCase(),
          extensions: [ext.replace('.', '')]
        })),
        defaultPath: options.startDirectory
      });

      if (!result) {
        return { files: [], directories: [], cancelled: true };
      }

      const paths = Array.isArray(result) ? result : [result];

      const items: SelectedFileInfo[] = await Promise.all(
        paths.map(async (path) => {
          try {
            const stat = await this.invoke<{ size: number; isDirectory: boolean; mtime: number | null }>('stat', { path });
            const name = path.split(/[/\\]/).pop() || '';
            return {
              name,
              path,
              uri: path,
              size: stat.size,
              type: stat.isDirectory ? 'directory' : 'file',
              mimeType: stat.isDirectory ? 'inode/directory' : this.getMimeType(name),
              mtime: stat.mtime || Date.now(),
              ctime: stat.mtime || Date.now()
            } as SelectedFileInfo;
          } catch {
            return {
              name: path.split(/[/\\]/).pop() || '',
              path,
              uri: path,
              size: 0,
              type: 'file' as const,
              mimeType: 'application/octet-stream',
              mtime: Date.now(),
              ctime: Date.now()
            };
          }
        })
      );

      const files = items.filter(i => i.type === 'file');
      const directories = items.filter(i => i.type === 'directory');

      return { files, directories, cancelled: false };
    } catch (error) {
      console.error('Tauri 文件选择器错误:', error);
      return { files: [], directories: [], cancelled: true };
    }
  }

  async openSystemFileManager(path?: string): Promise<void> {
    await this.loadModules();
    const shell = this.shellModule!;

    try {
      if (path) {
        await shell.open(path);
      }
    } catch (error) {
      console.error('打开文件管理器失败:', error);
      throw new Error('打开文件管理器失败');
    }
  }

  async openFileWithSystemApp(filePath: string, _mimeType?: string): Promise<void> {
    await this.loadModules();
    const shell = this.shellModule!;

    try {
      await shell.open(filePath);
    } catch (error) {
      console.error('打开文件失败:', error);
      throw new Error('打开文件失败');
    }
  }

  async listDirectory(options: ListDirectoryOptions): Promise<ListDirectoryResult> {
    await this.loadModules();

    try {
      const entries = await this.invoke<Array<{ name: string; isDirectory: boolean }>>('read_dir', { path: options.path });
      const files: FileInfo[] = await Promise.all(
        entries.map(async (entry: { name: string; isDirectory: boolean }) => {
          const fullPath = `${options.path}/${entry.name}`;
          try {
            const stat = await this.invoke<{ size: number; isDirectory: boolean; mtime: number | null; mode: number | null }>('stat', { path: fullPath });
            return {
              name: entry.name,
              path: fullPath,
              size: stat.size,
              type: entry.isDirectory ? 'directory' : 'file',
              mtime: stat.mtime || 0,
              ctime: stat.mtime || 0,
              permissions: stat.mode?.toString(8) || '',
              isHidden: entry.name.startsWith('.')
            } as FileInfo;
          } catch {
            return {
              name: entry.name,
              path: fullPath,
              size: 0,
              type: entry.isDirectory ? 'directory' : 'file',
              mtime: 0,
              ctime: 0,
              permissions: '',
              isHidden: entry.name.startsWith('.')
            };
          }
        })
      );

      // 过滤隐藏文件
      let filteredFiles = options.showHidden ? files : files.filter(f => !f.isHidden);

      // 排序
      filteredFiles.sort((a, b) => {
        let comparison = 0;
        switch (options.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'mtime':
            comparison = a.mtime - b.mtime;
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
        }
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });

      return { files: filteredFiles, totalCount: filteredFiles.length };
    } catch (error) {
      console.error('列出目录失败:', error);
      throw new Error('列出目录失败');
    }
  }

  async createDirectory(options: CreateDirectoryOptions): Promise<void> {
    await this.loadModules();

    try {
      await this.invoke('mkdir', { path: options.path, recursive: options.recursive });
    } catch (error) {
      console.error('创建目录失败:', error);
      throw new Error('创建目录失败');
    }
  }

  async deleteDirectory(options: FileOperationOptions): Promise<void> {
    await this.loadModules();

    try {
      await this.invoke('remove', { path: options.path, recursive: true });
    } catch (error) {
      console.error('删除目录失败:', error);
      throw new Error('删除目录失败');
    }
  }

  async createFile(options: CreateFileOptions): Promise<void> {
    await this.loadModules();

    try {
      if (options.encoding === 'base64') {
        const bytes = Array.from(Uint8Array.from(atob(options.content), c => c.charCodeAt(0)));
        await this.invoke('write_file', { path: options.path, contents: bytes });
      } else {
        await this.invoke('write_text_file', { path: options.path, contents: options.content });
      }
    } catch (error) {
      console.error('创建文件失败:', error);
      throw new Error('创建文件失败');
    }
  }

  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    await this.loadModules();

    try {
      if (options.encoding === 'base64') {
        const bytes = await this.invoke<number[]>('read_file', { path: options.path });
        const base64 = btoa(String.fromCharCode(...bytes));
        return { content: base64, encoding: 'base64' };
      } else {
        const content = await this.invoke<string>('read_text_file', { path: options.path });
        return { content, encoding: 'utf8' };
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      throw new Error('读取文件失败');
    }
  }

  async writeFile(options: WriteFileOptions): Promise<void> {
    await this.loadModules();

    try {
      if (options.encoding === 'base64') {
        const bytes = Array.from(Uint8Array.from(atob(options.content), c => c.charCodeAt(0)));
        await this.invoke('write_file', { path: options.path, contents: bytes, append: options.append });
      } else {
        await this.invoke('write_text_file', { path: options.path, contents: options.content, append: options.append });
      }
    } catch (error) {
      console.error('写入文件失败:', error);
      throw new Error('写入文件失败');
    }
  }

  async deleteFile(options: FileOperationOptions): Promise<void> {
    await this.loadModules();

    try {
      await this.invoke('remove', { path: options.path });
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error('删除文件失败');
    }
  }

  async moveFile(options: MoveFileOptions): Promise<void> {
    await this.loadModules();

    try {
      await this.invoke('rename', { oldPath: options.sourcePath, newPath: options.destinationPath });
    } catch (error) {
      console.error('移动文件失败:', error);
      throw new Error('移动文件失败');
    }
  }

  async copyFile(options: CopyFileOptions): Promise<void> {
    await this.loadModules();

    try {
      await this.invoke('copy_file', { fromPath: options.sourcePath, toPath: options.destinationPath });
    } catch (error) {
      console.error('复制文件失败:', error);
      throw new Error('复制文件失败');
    }
  }

  async renameFile(options: RenameFileOptions): Promise<void> {
    await this.loadModules();

    try {
      const dir = options.path.substring(0, options.path.lastIndexOf('/'));
      const newPath = `${dir}/${options.newName}`;
      await this.invoke('rename', { oldPath: options.path, newPath });
    } catch (error) {
      console.error('重命名文件失败:', error);
      throw new Error('重命名文件失败');
    }
  }

  async getFileInfo(options: FileOperationOptions): Promise<FileInfo> {
    await this.loadModules();

    try {
      const stat = await this.invoke<{ size: number; isDirectory: boolean; mtime: number | null; mode: number | null }>('stat', { path: options.path });
      const name = options.path.split(/[/\\]/).pop() || '';
      return {
        name,
        path: options.path,
        size: stat.size,
        type: stat.isDirectory ? 'directory' : 'file',
        mtime: stat.mtime || 0,
        ctime: stat.mtime || 0,
        permissions: stat.mode?.toString(8) || '',
        isHidden: name.startsWith('.')
      };
    } catch (error) {
      console.error('获取文件信息失败:', error);
      throw new Error('获取文件信息失败');
    }
  }

  async exists(options: FileOperationOptions): Promise<{ exists: boolean }> {
    await this.loadModules();

    try {
      const result = await this.invoke<boolean>('exists', { path: options.path });
      return { exists: Boolean(result) };
    } catch {
      return { exists: false };
    }
  }

  async searchFiles(options: SearchFilesOptions): Promise<SearchFilesResult> {
    await this.loadModules();

    const results: FileInfo[] = [];
    const maxResults = options.maxResults || 100;

    const searchInDir = async (dir: string, depth: number = 0) => {
      if (results.length >= maxResults) return;
      if (!options.recursive && depth > 0) return;

      try {
        const entries = await this.invoke<Array<{ name: string; isDirectory: boolean }>>('read_dir', { path: dir });
        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullPath = `${dir}/${entry.name}`;
          const matchesName = options.searchType !== 'content' &&
            entry.name.toLowerCase().includes(options.query.toLowerCase());

          const matchesType = options.fileTypes.length === 0 ||
            options.fileTypes.some(t => entry.name.endsWith(t));

          if (matchesName && matchesType) {
            try {
              const stat = await this.invoke<{ size: number; isDirectory: boolean; mtime: number | null }>('stat', { path: fullPath });
              results.push({
                name: entry.name,
                path: fullPath,
                size: stat.size,
                type: entry.isDirectory ? 'directory' : 'file',
                mtime: stat.mtime || 0,
                ctime: stat.mtime || 0,
                permissions: '',
                isHidden: entry.name.startsWith('.')
              });
            } catch {
              // 忽略无法访问的文件
            }
          }

          if (entry.isDirectory && options.recursive) {
            await searchInDir(fullPath, depth + 1);
          }
        }
      } catch {
        // 忽略无法访问的目录
      }
    };

    await searchInDir(options.directory);
    return { files: results, totalFound: results.length };
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'md': 'text/markdown'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// ============================================
// Capacitor 实现 (使用现有的 AdvancedFileManagerService)
// ============================================

class CapacitorFileManagerImpl {
  private service: typeof import('./AdvancedFileManagerService').advancedFileManagerService | null = null;

  private async loadService() {
    if (!this.service) {
      const module = await import('./AdvancedFileManagerService');
      this.service = module.advancedFileManagerService;
    }
    return this.service;
  }

  async requestPermissions(): Promise<PermissionResult> {
    const service = await this.loadService();
    return service.requestPermissions();
  }

  async checkPermissions(): Promise<PermissionResult> {
    const service = await this.loadService();
    return service.checkPermissions();
  }

  async openSystemFilePicker(options: SystemFilePickerOptions): Promise<SystemFilePickerResult> {
    const service = await this.loadService();
    return service.openSystemFilePicker(options);
  }

  async openSystemFileManager(path?: string): Promise<void> {
    const service = await this.loadService();
    return service.openSystemFileManager(path);
  }

  async openFileWithSystemApp(filePath: string, mimeType?: string): Promise<void> {
    const service = await this.loadService();
    return service.openFileWithSystemApp(filePath, mimeType);
  }

  async listDirectory(options: ListDirectoryOptions): Promise<ListDirectoryResult> {
    const service = await this.loadService();
    return service.listDirectory(options);
  }

  async createDirectory(options: CreateDirectoryOptions): Promise<void> {
    const service = await this.loadService();
    return service.createDirectory(options);
  }

  async deleteDirectory(options: FileOperationOptions): Promise<void> {
    const service = await this.loadService();
    return service.deleteDirectory(options);
  }

  async createFile(options: CreateFileOptions): Promise<void> {
    const service = await this.loadService();
    return service.createFile(options);
  }

  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    const service = await this.loadService();
    return service.readFile(options);
  }

  async writeFile(options: WriteFileOptions): Promise<void> {
    const service = await this.loadService();
    return service.writeFile(options);
  }

  async deleteFile(options: FileOperationOptions): Promise<void> {
    const service = await this.loadService();
    return service.deleteFile(options);
  }

  async moveFile(options: MoveFileOptions): Promise<void> {
    const service = await this.loadService();
    return service.moveFile(options);
  }

  async copyFile(options: CopyFileOptions): Promise<void> {
    const service = await this.loadService();
    return service.copyFile(options);
  }

  async renameFile(options: RenameFileOptions): Promise<void> {
    const service = await this.loadService();
    return service.renameFile(options);
  }

  async getFileInfo(options: FileOperationOptions): Promise<FileInfo> {
    const service = await this.loadService();
    return service.getFileInfo(options);
  }

  async exists(options: FileOperationOptions): Promise<{ exists: boolean }> {
    const service = await this.loadService();
    const result = await service.exists(options);
    return { exists: result };
  }

  async searchFiles(options: SearchFilesOptions): Promise<SearchFilesResult> {
    const service = await this.loadService();
    return service.searchFiles(options);
  }
}

// ============================================
// Web 降级实现
// ============================================

class WebFileManagerImpl {
  async requestPermissions(): Promise<PermissionResult> {
    return { granted: false, message: '文件管理功能仅在原生应用中可用' };
  }

  async checkPermissions(): Promise<PermissionResult> {
    return { granted: false, message: '文件管理功能仅在原生应用中可用' };
  }

  async openSystemFilePicker(_options: SystemFilePickerOptions): Promise<SystemFilePickerResult> {
    throw new Error('文件选择器仅在原生应用中可用');
  }

  async openSystemFileManager(_path?: string): Promise<void> {
    throw new Error('文件管理器仅在原生应用中可用');
  }

  async openFileWithSystemApp(_filePath: string, _mimeType?: string): Promise<void> {
    throw new Error('打开文件功能仅在原生应用中可用');
  }

  async listDirectory(_options: ListDirectoryOptions): Promise<ListDirectoryResult> {
    throw new Error('目录列表功能仅在原生应用中可用');
  }

  async createDirectory(_options: CreateDirectoryOptions): Promise<void> {
    throw new Error('创建目录功能仅在原生应用中可用');
  }

  async deleteDirectory(_options: FileOperationOptions): Promise<void> {
    throw new Error('删除目录功能仅在原生应用中可用');
  }

  async createFile(_options: CreateFileOptions): Promise<void> {
    throw new Error('创建文件功能仅在原生应用中可用');
  }

  async readFile(_options: ReadFileOptions): Promise<ReadFileResult> {
    throw new Error('读取文件功能仅在原生应用中可用');
  }

  async writeFile(_options: WriteFileOptions): Promise<void> {
    throw new Error('写入文件功能仅在原生应用中可用');
  }

  async deleteFile(_options: FileOperationOptions): Promise<void> {
    throw new Error('删除文件功能仅在原生应用中可用');
  }

  async moveFile(_options: MoveFileOptions): Promise<void> {
    throw new Error('移动文件功能仅在原生应用中可用');
  }

  async copyFile(_options: CopyFileOptions): Promise<void> {
    throw new Error('复制文件功能仅在原生应用中可用');
  }

  async renameFile(_options: RenameFileOptions): Promise<void> {
    throw new Error('重命名文件功能仅在原生应用中可用');
  }

  async getFileInfo(_options: FileOperationOptions): Promise<FileInfo> {
    throw new Error('获取文件信息功能仅在原生应用中可用');
  }

  async exists(_options: FileOperationOptions): Promise<{ exists: boolean }> {
    return { exists: false };
  }

  async searchFiles(_options: SearchFilesOptions): Promise<SearchFilesResult> {
    throw new Error('搜索文件功能仅在原生应用中可用');
  }
}

// TauriAndroidFileManagerImpl 已移除 - Tauri 移动端不再维护

// ============================================
// 统一服务类
// ============================================

type FileManagerImpl = TauriFileManagerImpl | CapacitorFileManagerImpl | WebFileManagerImpl;

class UnifiedFileManagerService {
  private impl: FileManagerImpl | null = null;

  private getImpl(): FileManagerImpl {
    if (!this.impl) {
      // Tauri 桌面端
      if (isTauri()) {
        console.log('[UnifiedFileManager] 使用 Tauri 桌面实现');
        this.impl = new TauriFileManagerImpl();
      } 
      // Capacitor (包括 Android/iOS)
      else if (isCapacitor()) {
        console.log('[UnifiedFileManager] 使用 Capacitor 实现');
        this.impl = new CapacitorFileManagerImpl();
      } 
      // Web 降级
      else {
        console.log('[UnifiedFileManager] 使用 Web 降级实现');
        this.impl = new WebFileManagerImpl();
      }
    }
    return this.impl!;
  }

  /**
   * 检查当前平台是否支持文件管理功能
   */
  isSupported(): boolean {
    return isTauri() || isCapacitor();
  }

  /**
   * 获取当前使用的平台类型
   */
  getPlatformType(): 'tauri' | 'capacitor' | 'web' {
    if (isTauri()) return 'tauri';
    if (isCapacitor()) return 'capacitor';
    return 'web';
  }

  // ========== 权限相关 ==========

  async requestPermissions(): Promise<PermissionResult> {
    return this.getImpl().requestPermissions();
  }

  async checkPermissions(): Promise<PermissionResult> {
    return this.getImpl().checkPermissions();
  }

  // ========== 文件选择器 ==========

  async openSystemFilePicker(options: SystemFilePickerOptions): Promise<SystemFilePickerResult> {
    return this.getImpl().openSystemFilePicker(options);
  }

  async openSystemFileManager(path?: string): Promise<void> {
    return this.getImpl().openSystemFileManager(path);
  }

  async openFileWithSystemApp(filePath: string, mimeType?: string): Promise<void> {
    return this.getImpl().openFileWithSystemApp(filePath, mimeType);
  }

  // ========== 目录操作 ==========

  async listDirectory(options: ListDirectoryOptions): Promise<ListDirectoryResult> {
    return this.getImpl().listDirectory(options);
  }

  async createDirectory(options: CreateDirectoryOptions): Promise<void> {
    return this.getImpl().createDirectory(options);
  }

  async deleteDirectory(options: FileOperationOptions): Promise<void> {
    return this.getImpl().deleteDirectory(options);
  }

  // ========== 文件操作 ==========

  async createFile(options: CreateFileOptions): Promise<void> {
    return this.getImpl().createFile(options);
  }

  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    return this.getImpl().readFile(options);
  }

  async writeFile(options: WriteFileOptions): Promise<void> {
    return this.getImpl().writeFile(options);
  }

  async deleteFile(options: FileOperationOptions): Promise<void> {
    return this.getImpl().deleteFile(options);
  }

  async moveFile(options: MoveFileOptions): Promise<void> {
    return this.getImpl().moveFile(options);
  }

  async copyFile(options: CopyFileOptions): Promise<void> {
    return this.getImpl().copyFile(options);
  }

  async renameFile(options: RenameFileOptions): Promise<void> {
    return this.getImpl().renameFile(options);
  }

  // ========== 文件信息 ==========

  async getFileInfo(options: FileOperationOptions): Promise<FileInfo> {
    return this.getImpl().getFileInfo(options);
  }

  async exists(options: FileOperationOptions): Promise<{ exists: boolean }> {
    return this.getImpl().exists(options);
  }

  // ========== 搜索 ==========

  async searchFiles(options: SearchFilesOptions): Promise<SearchFilesResult> {
    return this.getImpl().searchFiles(options);
  }

  // ========== 便捷方法 ==========

  /**
   * 创建空文件
   */
  async createEmptyFile(filePath: string, fileName: string): Promise<void> {
    const fullPath = `${filePath}/${fileName}`;
    return this.createFile({
      path: fullPath,
      content: '',
      encoding: 'utf8'
    });
  }

  /**
   * 创建文本文件
   */
  async createTextFile(filePath: string, fileName: string, content: string = ''): Promise<void> {
    const fullPath = `${filePath}/${fileName}`;
    return this.createFile({
      path: fullPath,
      content,
      encoding: 'utf8'
    });
  }

  /**
   * 读取文本文件内容
   */
  async readTextFile(filePath: string): Promise<string> {
    const result = await this.readFile({ path: filePath, encoding: 'utf8' });
    return result.content;
  }

  /**
   * 写入文本文件
   */
  async writeTextFile(filePath: string, content: string, append: boolean = false): Promise<void> {
    return this.writeFile({
      path: filePath,
      content,
      encoding: 'utf8',
      append
    });
  }
}

// 创建单例实例
export const unifiedFileManager = new UnifiedFileManagerService();

// 默认导出
export default unifiedFileManager;
