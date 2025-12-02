/**
 * File Editor MCP Server
 * 提供 AI 编辑工作区和笔记文件的能力
 * 参考 Roo-Code 的工具实现
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// 导入文件管理服务
import { unifiedFileManager } from '../../UnifiedFileManagerService';
import { workspaceService } from '../../WorkspaceService';

// ==================== 工具定义 ====================

const READ_FILE_TOOL: Tool = {
  name: 'read_file',
  description: '读取文件内容。支持读取完整文件或指定行范围。对于大文件，建议使用行范围参数只读取需要的部分。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件的完整路径'
      },
      start_line: {
        type: 'number',
        description: '起始行号 (1-based)，可选。不指定则从第一行开始'
      },
      end_line: {
        type: 'number',
        description: '结束行号 (1-based, 包含)，可选。不指定则读取到文件末尾'
      }
    },
    required: ['path']
  }
};

const WRITE_TO_FILE_TOOL: Tool = {
  name: 'write_to_file',
  description: '将内容写入文件。如果文件不存在则创建，如果存在则覆盖。写入前请先读取文件确认内容。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件的完整路径'
      },
      content: {
        type: 'string',
        description: '要写入的完整文件内容'
      }
    },
    required: ['path', 'content']
  }
};

const INSERT_CONTENT_TOOL: Tool = {
  name: 'insert_content',
  description: '在文件的指定行插入内容。内容将插入到指定行之前。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件的完整路径'
      },
      line: {
        type: 'number',
        description: '插入位置的行号 (1-based)。内容将插入到该行之前。使用 1 在文件开头插入。'
      },
      content: {
        type: 'string',
        description: '要插入的内容'
      }
    },
    required: ['path', 'line', 'content']
  }
};

const APPLY_DIFF_TOOL: Tool = {
  name: 'apply_diff',
  description: '应用 unified diff 格式的补丁来修改文件。这是修改现有代码的推荐方式。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要修改的文件的完整路径'
      },
      diff: {
        type: 'string',
        description: 'Unified diff 格式的补丁内容'
      }
    },
    required: ['path', 'diff']
  }
};

const LIST_FILES_TOOL: Tool = {
  name: 'list_files',
  description: '列出目录中的文件和子目录。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '目录的完整路径'
      },
      recursive: {
        type: 'boolean',
        description: '是否递归列出子目录内容，默认 false'
      }
    },
    required: ['path']
  }
};

const SEARCH_FILES_TOOL: Tool = {
  name: 'search_files',
  description: '在目录中搜索文件。支持按文件名或内容搜索。',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: '搜索的目录路径'
      },
      query: {
        type: 'string',
        description: '搜索关键词，支持通配符 * 和 ?'
      },
      search_type: {
        type: 'string',
        enum: ['name', 'content', 'both'],
        description: '搜索类型：name(文件名), content(文件内容), both(两者都搜索)'
      },
      file_types: {
        type: 'array',
        items: { type: 'string' },
        description: '文件类型过滤，如 ["ts", "js", "md"]'
      }
    },
    required: ['directory', 'query']
  }
};

const REPLACE_IN_FILE_TOOL: Tool = {
  name: 'replace_in_file',
  description: '在文件中查找并替换内容。支持正则表达式。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件的完整路径'
      },
      search: {
        type: 'string',
        description: '要查找的字符串或正则表达式'
      },
      replace: {
        type: 'string',
        description: '替换为的内容'
      },
      is_regex: {
        type: 'boolean',
        description: '是否使用正则表达式，默认 false'
      },
      replace_all: {
        type: 'boolean',
        description: '是否替换所有匹配项，默认 true'
      }
    },
    required: ['path', 'search', 'replace']
  }
};

const GET_FILE_INFO_TOOL: Tool = {
  name: 'get_file_info',
  description: '获取文件信息，包括大小、修改时间、行数等。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文件的完整路径'
      }
    },
    required: ['path']
  }
};

const LIST_WORKSPACES_TOOL: Tool = {
  name: 'list_workspaces',
  description: '获取用户已添加的所有工作区列表。返回带编号的工作区，可以用编号或ID调用其他工具。在操作文件之前，应先调用此工具了解可用的工作区。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

const GET_WORKSPACE_FILES_TOOL: Tool = {
  name: 'get_workspace_files',
  description: '获取指定工作区中的文件和目录列表。支持浅层（只看当前目录）或递归（获取所有子目录内容）两种模式。',
  inputSchema: {
    type: 'object',
    properties: {
      workspace: {
        type: 'string',
        description: '工作区编号（如 "1"）或工作区 ID 或工作区名称'
      },
      sub_path: {
        type: 'string',
        description: '子目录路径（可选，默认为根目录）。例如 "src/components"'
      },
      recursive: {
        type: 'boolean',
        description: '是否递归获取所有子目录的文件。false=只看当前目录（默认），true=递归获取全部'
      },
      max_depth: {
        type: 'number',
        description: '递归时的最大深度（可选，默认3层）。仅当 recursive=true 时有效'
      }
    },
    required: ['workspace']
  }
};

// attempt_completion 工具 - 让 AI 决定任务何时完成
const ATTEMPT_COMPLETION_TOOL: Tool = {
  name: 'attempt_completion',
  description: `当你认为已经完成了用户的任务时，使用此工具来结束任务并向用户展示结果。
这是 Agentic 模式中唯一能够结束任务循环的方式。

重要规则：
1. 在完成所有必要的文件操作后才调用此工具
2. 提供清晰的完成摘要，说明做了什么
3. 如果有任何遗留问题或建议，在 result 中说明
4. 不要在工具执行失败后立即调用此工具，应该先尝试修复问题`,
  inputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: '任务完成的结果摘要。向用户解释你做了什么，以及任何相关的后续建议。'
      },
      command: {
        type: 'string',
        description: '（可选）建议用户执行的命令，例如运行或测试代码的命令'
      }
    },
    required: ['result']
  }
};

// 所有工具列表
const ALL_TOOLS: Tool[] = [
  LIST_WORKSPACES_TOOL,
  GET_WORKSPACE_FILES_TOOL,
  READ_FILE_TOOL,
  WRITE_TO_FILE_TOOL,
  INSERT_CONTENT_TOOL,
  APPLY_DIFF_TOOL,
  LIST_FILES_TOOL,
  SEARCH_FILES_TOOL,
  REPLACE_IN_FILE_TOOL,
  GET_FILE_INFO_TOOL,
  ATTEMPT_COMPLETION_TOOL
];

/**
 * File Editor Server 类
 */
export class FileEditorServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/file-editor',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_TOOLS
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_workspaces':
            return await this.listWorkspaces();
          case 'get_workspace_files':
            return await this.getWorkspaceFiles(args as any);
          case 'read_file':
            return await this.readFile(args as any);
          case 'write_to_file':
            return await this.writeToFile(args as any);
          case 'insert_content':
            return await this.insertContent(args as any);
          case 'apply_diff':
            return await this.applyDiff(args as any);
          case 'list_files':
            return await this.listFiles(args as any);
          case 'search_files':
            return await this.searchFiles(args as any);
          case 'replace_in_file':
            return await this.replaceInFile(args as any);
          case 'get_file_info':
            return await this.getFileInfo(args as any);
          case 'attempt_completion':
            return await this.attemptCompletion(args as any);
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return this.createErrorResponse(error);
      }
    });
  }

  // ==================== 工具实现 ====================

  // 缓存工作区列表，用于编号到ID的映射
  private workspaceCache: Array<{ id: string; name: string; path: string }> = [];

  /**
   * 列出所有工作区
   */
  private async listWorkspaces() {
    try {
      const result = await workspaceService.getWorkspaces();
      
      // 缓存工作区列表
      this.workspaceCache = result.workspaces.map(ws => ({
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

      return this.createSuccessResponse({
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
  private async resolveWorkspace(workspaceRef: string): Promise<{ id: string; name: string; path: string } | null> {
    // 如果缓存为空，先加载
    if (this.workspaceCache.length === 0) {
      const result = await workspaceService.getWorkspaces();
      this.workspaceCache = result.workspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        path: ws.path
      }));
    }

    // 尝试作为编号解析（1-based）
    const index = parseInt(workspaceRef, 10);
    if (!isNaN(index) && index >= 1 && index <= this.workspaceCache.length) {
      return this.workspaceCache[index - 1];
    }

    // 尝试作为 ID 解析
    const byId = this.workspaceCache.find(ws => ws.id === workspaceRef);
    if (byId) return byId;

    // 尝试作为名称解析
    const byName = this.workspaceCache.find(ws => ws.name === workspaceRef);
    if (byName) return byName;

    return null;
  }

  /**
   * 获取工作区文件
   */
  private async getWorkspaceFiles(params: { 
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
      const ws = await this.resolveWorkspace(workspace);
      if (!ws) {
        throw new Error(`找不到工作区: ${workspace}。请先调用 list_workspaces 查看可用工作区。`);
      }

      if (recursive) {
        // 递归模式：获取所有子目录的文件
        const allFiles = await this.getFilesRecursive(ws.id, sub_path, 0, max_depth);
        
        return this.createSuccessResponse({
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

        return this.createSuccessResponse({
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
  private async getFilesRecursive(
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
        const subFiles = await this.getFilesRecursive(workspaceId, subPath, currentDepth + 1, maxDepth);
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

  /**
   * 读取文件
   */
  private async readFile(params: { 
    path: string; 
    start_line?: number; 
    end_line?: number 
  }) {
    const { path, start_line, end_line } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }

    try {
      // 检查是否需要读取行范围
      if (start_line !== undefined && end_line !== undefined) {
        const result = await unifiedFileManager.readFileRange({
          path,
          startLine: start_line,
          endLine: end_line
        });

        return this.createSuccessResponse({
          content: result.content,
          totalLines: result.totalLines,
          startLine: result.startLine,
          endLine: result.endLine,
          rangeHash: result.rangeHash
        });
      } else {
        // 读取完整文件
        const result = await unifiedFileManager.readFile({
          path,
          encoding: 'utf8'
        });

        // 获取行数
        const lineCount = await unifiedFileManager.getLineCount({ path });

        return this.createSuccessResponse({
          content: result.content,
          totalLines: lineCount.lines
        });
      }
    } catch (error) {
      throw new Error(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 写入文件
   */
  private async writeToFile(params: { path: string; content: string }) {
    const { path, content } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (content === undefined) {
      throw new Error('缺少必需参数: content');
    }

    try {
      await unifiedFileManager.writeFile({
        path,
        content,
        encoding: 'utf8',
        append: false
      });

      // 获取写入后的行数
      const lineCount = await unifiedFileManager.getLineCount({ path });

      return this.createSuccessResponse({
        message: '文件写入成功',
        path,
        totalLines: lineCount.lines
      });
    } catch (error) {
      throw new Error(`写入文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 插入内容
   */
  private async insertContent(params: { path: string; line: number; content: string }) {
    const { path, line, content } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (line === undefined || line < 1) {
      throw new Error('缺少或无效参数: line (必须是正整数)');
    }
    if (content === undefined) {
      throw new Error('缺少必需参数: content');
    }

    try {
      await unifiedFileManager.insertContent({
        path,
        line,
        content
      });

      // 获取插入后的行数
      const lineCount = await unifiedFileManager.getLineCount({ path });
      const insertedLines = content.split('\n').length;

      return this.createSuccessResponse({
        message: `已在第 ${line} 行插入 ${insertedLines} 行内容`,
        path,
        insertedAt: line,
        linesInserted: insertedLines,
        totalLines: lineCount.lines
      });
    } catch (error) {
      throw new Error(`插入内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 应用 diff
   */
  private async applyDiff(params: { path: string; diff: string }) {
    const { path, diff } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (!diff) {
      throw new Error('缺少必需参数: diff');
    }

    try {
      const result = await unifiedFileManager.applyDiff({
        path,
        diff,
        createBackup: true
      });

      return this.createSuccessResponse({
        message: 'Diff 应用成功',
        path,
        success: result.success,
        linesChanged: result.linesChanged,
        linesAdded: result.linesAdded,
        linesDeleted: result.linesDeleted,
        backupPath: result.backupPath
      });
    } catch (error) {
      throw new Error(`应用 diff 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 列出文件
   */
  private async listFiles(params: { path: string; recursive?: boolean }) {
    const { path } = params;
    // recursive 参数预留给未来实现递归列表功能

    if (!path) {
      throw new Error('缺少必需参数: path');
    }

    try {
      const result = await unifiedFileManager.listDirectory({
        path,
        showHidden: false,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      // 格式化文件列表
      const files = result.files.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size,
        mtime: f.mtime
      }));

      return this.createSuccessResponse({
        path,
        totalCount: result.totalCount,
        files
      });
    } catch (error) {
      throw new Error(`列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 搜索文件
   */
  private async searchFiles(params: {
    directory: string;
    query: string;
    search_type?: string;
    file_types?: string[];
  }) {
    const { directory, query, search_type = 'name', file_types } = params;

    if (!directory) {
      throw new Error('缺少必需参数: directory');
    }
    if (!query) {
      throw new Error('缺少必需参数: query');
    }

    try {
      const result = await unifiedFileManager.searchFiles({
        directory,
        query,
        searchType: search_type as 'name' | 'content' | 'both',
        fileTypes: file_types || [],
        maxResults: 50,
        recursive: true
      });

      const files = result.files.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size
      }));

      return this.createSuccessResponse({
        query,
        totalFound: result.totalFound,
        files
      });
    } catch (error) {
      throw new Error(`搜索文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 查找替换
   */
  private async replaceInFile(params: {
    path: string;
    search: string;
    replace: string;
    is_regex?: boolean;
    replace_all?: boolean;
  }) {
    const { path, search, replace, is_regex = false, replace_all = true } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (!search) {
      throw new Error('缺少必需参数: search');
    }
    if (replace === undefined) {
      throw new Error('缺少必需参数: replace');
    }

    try {
      const result = await unifiedFileManager.replaceInFile({
        path,
        search,
        replace,
        isRegex: is_regex,
        replaceAll: replace_all,
        caseSensitive: true
      });

      return this.createSuccessResponse({
        message: result.modified ? `已替换 ${result.replacements} 处` : '未找到匹配项',
        path,
        replacements: result.replacements,
        modified: result.modified
      });
    } catch (error) {
      throw new Error(`替换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取文件信息
   */
  private async getFileInfo(params: { path: string }) {
    const { path } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }

    try {
      const fileInfo = await unifiedFileManager.getFileInfo({ path });
      const lineCount = await unifiedFileManager.getLineCount({ path });
      const hashResult = await unifiedFileManager.getFileHash({ path, algorithm: 'md5' });

      return this.createSuccessResponse({
        name: fileInfo.name,
        path: fileInfo.path,
        type: fileInfo.type,
        size: fileInfo.size,
        mtime: fileInfo.mtime,
        ctime: fileInfo.ctime,
        lines: lineCount.lines,
        hash: hashResult.hash
      });
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 完成任务 - Agentic 模式的终止信号
   * 当 AI 认为任务已完成时调用此工具
   */
  private async attemptCompletion(params: { result: string; command?: string }) {
    const { result, command } = params;

    if (!result) {
      throw new Error('缺少必需参数: result（任务完成摘要）');
    }

    // 返回特殊格式的响应，包含完成标记
    // AgenticLoopService 会检测这个标记来结束循环
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            __agentic_completion__: true,  // 特殊标记，用于识别任务完成
            result: result,
            command: command || null,
            completedAt: new Date().toISOString()
          }, null, 2)
        }
      ],
      // 添加元数据标记
      _meta: {
        isCompletion: true
      }
    };
  }

  // ==================== 辅助方法 ====================

  private createSuccessResponse(data: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  private createErrorResponse(error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: true, message }, null, 2)
        }
      ],
      isError: true
    };
  }
}
