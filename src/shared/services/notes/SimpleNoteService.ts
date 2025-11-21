import { advancedFileManagerService } from '../AdvancedFileManagerService';
import { dexieStorage } from '../../services/storage/DexieStorageService';
import type { NoteFile } from '../../types/note';
import { v4 as uuidv4 } from 'uuid';

export const NOTE_STORAGE_PATH_KEY = 'NOTE_STORAGE_PATH';
export const ENABLE_NOTE_SIDEBAR_KEY = 'ENABLE_NOTE_SIDEBAR';

class SimpleNoteService {
  private static instance: SimpleNoteService;

  private constructor() {}

  public static getInstance(): SimpleNoteService {
    if (!SimpleNoteService.instance) {
      SimpleNoteService.instance = new SimpleNoteService();
    }
    return SimpleNoteService.instance;
  }

  /**
   * 获取笔记存储根目录
   */
  async getStoragePath(): Promise<string | null> {
    return await dexieStorage.getSetting(NOTE_STORAGE_PATH_KEY);
  }

  /**
   * 设置笔记存储根目录
   */
  async setStoragePath(path: string): Promise<void> {
    await dexieStorage.saveSetting(NOTE_STORAGE_PATH_KEY, path);
  }

  /**
   * 获取是否启用侧边栏
   */
  async isSidebarEnabled(): Promise<boolean> {
    const enabled = await dexieStorage.getSetting(ENABLE_NOTE_SIDEBAR_KEY);
    return enabled === true;
  }

  /**
   * 设置是否启用侧边栏
   */
  async setSidebarEnabled(enabled: boolean): Promise<void> {
    await dexieStorage.saveSetting(ENABLE_NOTE_SIDEBAR_KEY, enabled);
  }

  /**
   * 获取完整的存储路径
   */
  private async getFullPath(subPath: string = ''): Promise<string> {
    const rootPath = await this.getStoragePath();
    if (!rootPath) {
      throw new Error('未设置笔记存储目录');
    }
    // 处理路径分隔符，确保没有双斜杠
    const normalizedRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;
    const normalizedSub = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    return normalizedSub ? `${normalizedRoot}/${normalizedSub}` : normalizedRoot;
  }

  /**
   * 列出笔记文件
   */
  async listNotes(subPath: string = ''): Promise<NoteFile[]> {
    const fullPath = await this.getFullPath(subPath);
    
    try {
      const result = await advancedFileManagerService.listDirectory({
        path: fullPath,
        showHidden: false,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      return result.files.map(file => ({
        id: uuidv4(), // 临时ID，因为文件系统没有固定ID
        name: file.name,
        path: subPath ? `${subPath}/${file.name}` : file.name,
        isDirectory: file.type === 'directory',
        lastModified: new Date(file.mtime || Date.now()).toISOString(),
        size: file.size,
        extension: file.name.split('.').pop()
      })).sort((a, b) => {
        // 文件夹优先
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('获取笔记列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建笔记文件
   */
  async createNote(subPath: string, name: string, content: string = ''): Promise<void> {
    const fullPath = await this.getFullPath(subPath);
    
    // 确保文件名以 .md 结尾（如果没有扩展名）
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    
    await advancedFileManagerService.createTextFile(fullPath, fileName, content);
  }

  /**
   * 创建文件夹
   */
  async createFolder(subPath: string, name: string): Promise<void> {
    const fullPath = await this.getFullPath(subPath);
    const newFolderPath = `${fullPath}/${name}`;
    
    await advancedFileManagerService.createDirectory({
      path: newFolderPath,
      recursive: false
    });
  }

  /**
   * 读取笔记内容
   */
  async readNote(relativePath: string): Promise<string> {
    const fullPath = await this.getFullPath(relativePath);
    
    const result = await advancedFileManagerService.readFile({
      path: fullPath,
      encoding: 'utf8'
    });

    return result.content;
  }

  /**
   * 保存笔记内容
   */
  async saveNote(relativePath: string, content: string): Promise<void> {
    const fullPath = await this.getFullPath(relativePath);
    
    await advancedFileManagerService.writeFile({
      path: fullPath,
      content: content,
      encoding: 'utf8',
      append: false
    });
  }

  /**
   * 删除文件或文件夹
   */
  async deleteItem(relativePath: string, isDirectory: boolean): Promise<void> {
    const fullPath = await this.getFullPath(relativePath);
    
    if (isDirectory) {
      await advancedFileManagerService.deleteDirectory({
        path: fullPath
      });
    } else {
      await advancedFileManagerService.deleteFile({
        path: fullPath
      });
    }
  }

  /**
   * 重命名文件或文件夹
   * 使用复制+删除的方式实现，兼容 Android 平台
   */
  async renameItem(relativePath: string, newName: string): Promise<void> {
    const oldFullPath = await this.getFullPath(relativePath);
    
    // 获取父目录路径
    const pathParts = relativePath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');
    const newRelativePath = parentPath ? `${parentPath}/${newName}` : newName;
    const newFullPath = await this.getFullPath(newRelativePath);
    
    try {
      // 检查是否是文件夹
      await advancedFileManagerService.listDirectory({
        path: oldFullPath,
        showHidden: false,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      // 如果能列出目录，说明是文件夹
      // 对于文件夹，我们需要递归复制
      throw new Error('暂不支持重命名文件夹，请使用文件管理器');
    } catch (listError) {
      // 如果列目录失败，说明是文件，继续处理
      try {
        // 1. 读取原文件内容
        const content = await this.readNote(relativePath);
        
        // 2. 写入新文件
        await advancedFileManagerService.writeFile({
          path: newFullPath,
          content: content,
          encoding: 'utf8',
          append: false
        });
        
        // 3. 删除原文件
        await advancedFileManagerService.deleteFile({
          path: oldFullPath
        });
      } catch (error) {
        // 如果出错，尝试清理新文件
        try {
          await advancedFileManagerService.deleteFile({
            path: newFullPath
          });
        } catch (cleanupError) {
          // 忽略清理错误
        }
        throw error;
      }
    }
  }
  
  /**
   * 检查是否配置了有效路径
   */
  async hasValidConfig(): Promise<boolean> {
    const path = await this.getStoragePath();
    if (!path) return false;
    
    // 学习工作区的做法：对于系统文件选择器返回的路径，直接认为有效
    return true;
  }
}

export const simpleNoteService = SimpleNoteService.getInstance();