/**
 * File Editor MCP Server
 * 提供 AI 编辑工作区和笔记文件的能力
 * 参考 Roo-Code 的工具实现
 * 
 * 增强功能:
 * - 批量读取多文件
 * - Token 预算控制
 * - 代码定义提取
 * - 行数验证防截断
 * - HTML 实体转义
 * - Diff 预览
 * - 可配置 Diff 策略
 * - 部分失败处理
 * - 错误重试计数
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// 导入文件管理服务
import { unifiedFileManager } from '../../UnifiedFileManagerService';
import { workspaceService } from '../../WorkspaceService';

// ==================== 常量定义 ====================

/** 文件大小阈值 (字节)，超过此值触发 Token 验证 */
const FILE_SIZE_THRESHOLD = 100_000; // 100KB

/** 最大可 Token 化的文件大小 (字节) */
const MAX_FILE_SIZE_FOR_TOKENIZATION = 5_000_000; // 5MB

/** 大文件预览大小 (字节) */
const PREVIEW_SIZE_FOR_LARGE_FILES = 100_000; // 100KB

/** 文件读取 Token 预算百分比 */
const FILE_READ_BUDGET_PERCENT = 0.6; // 60%

/** 默认上下文窗口大小 */
const DEFAULT_CONTEXT_WINDOW = 128000;

/** Diff 模糊匹配阈值 */
const FUZZY_THRESHOLD = 0.9;

/** Diff 搜索缓冲行数 */
const BUFFER_LINES = 40;

// ==================== 类型定义 ====================

/** 文件条目 */
interface FileEntry {
  path: string;
  start_line?: number;
  end_line?: number;
}

/** Token 预算验证结果 */
interface TokenBudgetResult {
  shouldTruncate: boolean;
  maxChars?: number;
  reason?: string;
  isPreview?: boolean;
}

/** Diff 统计 */
interface DiffStats {
  added: number;
  removed: number;
}

/** Diff 结果 */
interface DiffResult {
  success: boolean;
  content?: string;
  error?: string;
  failParts?: Array<{
    success: boolean;
    error?: string;
    details?: any;
  }>;
}

/** Diff 策略类型 */
type DiffStrategyType = 'unified' | 'search-replace' | 'auto';

// ==================== 工具定义 ====================

const READ_FILE_TOOL: Tool = {
  name: 'read_file',
  description: `读取文件内容。支持读取完整文件、指定行范围或批量读取多个文件。

功能特性:
- 支持批量读取多个文件 (使用 files 数组)
- 支持指定行范围读取
- 自动 Token 预算控制，防止超出上下文限制
- 支持代码定义提取 (extract_definitions)

对于大文件，建议使用行范围参数只读取需要的部分。`,
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '单个文件的完整路径 (与 files 二选一)'
      },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
            start_line: { type: 'number', description: '起始行号 (1-based)' },
            end_line: { type: 'number', description: '结束行号 (1-based, 包含)' }
          },
          required: ['path']
        },
        description: '批量读取的文件列表 (与 path 二选一)'
      },
      start_line: {
        type: 'number',
        description: '起始行号 (1-based)，可选。不指定则从第一行开始'
      },
      end_line: {
        type: 'number',
        description: '结束行号 (1-based, 包含)，可选。不指定则读取到文件末尾'
      },
      extract_definitions: {
        type: 'boolean',
        description: '是否提取代码定义 (函数、类、接口等)，默认 false'
      },
      context_tokens: {
        type: 'number',
        description: '当前已使用的上下文 Token 数，用于 Token 预算控制'
      }
    }
  }
};

const WRITE_TO_FILE_TOOL: Tool = {
  name: 'write_to_file',
  description: `将内容写入文件。如果文件不存在则创建，如果存在则覆盖。

重要提示:
- 必须提供 line_count 参数，用于验证内容完整性
- 写入前请先读取文件确认内容
- 系统会自动检测代码截断 (如 "// rest of code unchanged")
- 支持 Diff 预览，返回变更统计

如果内容被截断，请使用 apply_diff 工具进行增量修改。`,
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
      },
      line_count: {
        type: 'number',
        description: '(必需) 预期的内容行数，用于验证内容是否被截断'
      },
      create_backup: {
        type: 'boolean',
        description: '是否创建备份文件，默认 true'
      }
    },
    required: ['path', 'content', 'line_count']
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
  description: `应用精确、有针对性的修改到现有文件。支持 unified diff 和 SEARCH/REPLACE 两种格式。

支持的格式:
1. Unified Diff 格式 (传统)
2. SEARCH/REPLACE 格式 (推荐，更精确):
   <<<<<<< SEARCH
   :start_line:行号
   -------
   [要查找的精确内容]
   =======
   [替换后的内容]
   >>>>>>> REPLACE

特性:
- 支持多个 SEARCH/REPLACE 块在一次调用中
- 模糊匹配 (相似度阈值 90%)
- 部分失败处理，返回详细报告
- 自动重试计数

提示: 如果不确定要搜索的精确内容，请先使用 read_file 工具获取最新内容。`,
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要修改的文件的完整路径'
      },
      diff: {
        type: 'string',
        description: 'Diff 内容 (unified diff 或 SEARCH/REPLACE 格式)'
      },
      strategy: {
        type: 'string',
        enum: ['unified', 'search-replace', 'auto'],
        description: 'Diff 策略: unified(传统), search-replace(推荐), auto(自动检测)。默认 auto'
      },
      fuzzy_threshold: {
        type: 'number',
        description: '模糊匹配阈值 (0-1)，默认 0.9。值越高要求越精确'
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

  // ==================== 状态追踪 ====================
  
  /** 缓存工作区列表，用于编号到ID的映射 */
  private workspaceCache: Array<{ id: string; name: string; path: string }> = [];
  
  /** 连续错误计数 */
  private consecutiveMistakeCount: number = 0;
  
  /** Diff 重试计数 (按文件路径) */
  private diffRetryCount: Map<string, number> = new Map();

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
   * 读取文件 - 增强版
   * 支持批量读取、Token 预算控制、代码定义提取
   */
  private async readFile(params: { 
    path?: string;
    files?: FileEntry[];
    start_line?: number; 
    end_line?: number;
    extract_definitions?: boolean;
    context_tokens?: number;
  }) {
    const { path, files, start_line, end_line, extract_definitions = false, context_tokens = 0 } = params;

    // 支持批量读取
    if (files && files.length > 0) {
      return await this.readMultipleFiles(files, context_tokens, extract_definitions);
    }

    if (!path) {
      throw new Error('缺少必需参数: path 或 files');
    }

    try {
      // 获取文件信息用于 Token 预算
      const fileInfo = await unifiedFileManager.getFileInfo({ path });
      
      // Token 预算控制
      const budgetResult = await this.validateFileTokenBudget(
        fileInfo.size,
        context_tokens
      );

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
        
        let content = result.content;
        let notice: string | undefined;
        
        // Token 预算截断
        if (budgetResult.shouldTruncate && budgetResult.maxChars) {
          const truncateResult = this.truncateFileContent(
            content,
            budgetResult.maxChars,
            content.length,
            budgetResult.isPreview
          );
          content = truncateResult.content;
          notice = truncateResult.notice;
        }
        
        // 代码定义提取
        let definitions: string[] | undefined;
        if (extract_definitions) {
          definitions = this.extractCodeDefinitions(content, path);
        }

        return this.createSuccessResponse({
          content,
          totalLines: lineCount.lines,
          ...(notice && { notice }),
          ...(definitions && { definitions }),
          ...(budgetResult.shouldTruncate && { 
            truncated: true,
            reason: budgetResult.reason 
          })
        });
      }
    } catch (error) {
      throw new Error(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量读取多个文件
   */
  private async readMultipleFiles(
    files: FileEntry[],
    contextTokens: number,
    extractDefinitions: boolean
  ) {
    const results: Array<{
      path: string;
      status: 'success' | 'error';
      content?: string;
      totalLines?: number;
      error?: string;
      definitions?: string[];
      truncated?: boolean;
    }> = [];

    let currentTokens = contextTokens;

    for (const file of files) {
      try {
        const fileInfo = await unifiedFileManager.getFileInfo({ path: file.path });
        const budgetResult = await this.validateFileTokenBudget(fileInfo.size, currentTokens);

        let content: string;
        let totalLines: number;

        if (file.start_line !== undefined && file.end_line !== undefined) {
          const result = await unifiedFileManager.readFileRange({
            path: file.path,
            startLine: file.start_line,
            endLine: file.end_line
          });
          content = result.content;
          totalLines = result.totalLines;
        } else {
          const result = await unifiedFileManager.readFile({
            path: file.path,
            encoding: 'utf8'
          });
          content = result.content;
          const lineCount = await unifiedFileManager.getLineCount({ path: file.path });
          totalLines = lineCount.lines;
        }

        // Token 预算截断
        let truncated = false;
        if (budgetResult.shouldTruncate && budgetResult.maxChars) {
          const truncateResult = this.truncateFileContent(
            content,
            budgetResult.maxChars,
            content.length,
            budgetResult.isPreview
          );
          content = truncateResult.content;
          truncated = true;
        }

        // 代码定义提取
        let definitions: string[] | undefined;
        if (extractDefinitions) {
          definitions = this.extractCodeDefinitions(content, file.path);
        }

        // 更新已使用 Token 估算
        currentTokens += Math.ceil(content.length / 4);

        results.push({
          path: file.path,
          status: 'success',
          content,
          totalLines,
          ...(definitions && { definitions }),
          ...(truncated && { truncated })
        });
      } catch (error) {
        results.push({
          path: file.path,
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return this.createSuccessResponse({
      files: results,
      summary: {
        total: files.length,
        success: successCount,
        error: errorCount
      }
    });
  }

  /**
   * Token 预算验证
   */
  private async validateFileTokenBudget(
    fileSizeBytes: number,
    currentTokens: number
  ): Promise<TokenBudgetResult> {
    // 小文件快速路径
    if (fileSizeBytes < FILE_SIZE_THRESHOLD) {
      return { shouldTruncate: false };
    }

    // 计算可用 Token 预算
    const remainingTokens = DEFAULT_CONTEXT_WINDOW - currentTokens;
    const safeReadBudget = Math.floor(remainingTokens * FILE_READ_BUDGET_PERCENT);

    if (safeReadBudget <= 0) {
      return {
        shouldTruncate: true,
        maxChars: 0,
        reason: '没有可用的上下文预算用于文件读取'
      };
    }

    // 大文件预览模式
    const isPreviewMode = fileSizeBytes > MAX_FILE_SIZE_FOR_TOKENIZATION;

    if (isPreviewMode) {
      return {
        shouldTruncate: true,
        maxChars: PREVIEW_SIZE_FOR_LARGE_FILES,
        isPreview: true,
        reason: `文件过大 (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB)，显示前 ${(PREVIEW_SIZE_FOR_LARGE_FILES / 1024).toFixed(0)}KB 预览。使用 start_line/end_line 读取特定部分。`
      };
    }

    // 估算 Token 数 (粗略估算: 4 字符 = 1 Token)
    const estimatedTokens = Math.ceil(fileSizeBytes / 4);

    if (estimatedTokens > safeReadBudget) {
      const maxChars = Math.floor(safeReadBudget * 4);
      return {
        shouldTruncate: true,
        maxChars,
        reason: `文件需要约 ${estimatedTokens} tokens，但只有 ${safeReadBudget} tokens 可用`
      };
    }

    return { shouldTruncate: false };
  }

  /**
   * 截断文件内容
   */
  private truncateFileContent(
    content: string,
    maxChars: number,
    totalChars: number,
    isPreview: boolean = false
  ): { content: string; notice: string } {
    const truncatedContent = content.slice(0, maxChars);

    const notice = isPreview
      ? `预览: 显示前 ${(maxChars / 1024).toFixed(1)}KB / 共 ${(totalChars / 1024).toFixed(1)}KB。使用 start_line/end_line 读取特定部分。`
      : `文件已截断至 ${maxChars} / ${totalChars} 字符，以适应上下文限制。使用 start_line/end_line 读取特定部分。`;

    return {
      content: truncatedContent,
      notice
    };
  }

  /**
   * 提取代码定义 (函数、类、接口等)
   */
  private extractCodeDefinitions(content: string, filePath: string): string[] {
    const definitions: string[] = [];
    const ext = filePath.split('.').pop()?.toLowerCase();

    // 根据文件类型使用不同的正则
    const patterns: Record<string, RegExp[]> = {
      ts: [
        /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
        /^\s*(?:export\s+)?class\s+(\w+)/gm,
        /^\s*(?:export\s+)?interface\s+(\w+)/gm,
        /^\s*(?:export\s+)?type\s+(\w+)/gm,
        /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
      ],
      tsx: [
        /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
        /^\s*(?:export\s+)?class\s+(\w+)/gm,
        /^\s*(?:export\s+)?interface\s+(\w+)/gm,
        /^\s*(?:export\s+)?type\s+(\w+)/gm,
        /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
      ],
      js: [
        /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
        /^\s*(?:export\s+)?class\s+(\w+)/gm,
        /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
      ],
      py: [
        /^\s*def\s+(\w+)/gm,
        /^\s*class\s+(\w+)/gm,
        /^\s*async\s+def\s+(\w+)/gm,
      ],
      java: [
        /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*(?:class|interface|enum)\s+(\w+)/gm,
        /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:\w+)\s+(\w+)\s*\(/gm,
      ],
    };

    const filePatterns = patterns[ext || ''] || patterns['ts'];

    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !definitions.includes(match[1])) {
          definitions.push(match[1]);
        }
      }
    }

    return definitions;
  }

  /**
   * 写入文件 - 增强版
   * 支持行数验证、代码截断检测、HTML 实体转义、Diff 预览
   */
  private async writeToFile(params: { 
    path: string; 
    content: string;
    line_count?: number;
    create_backup?: boolean;
  }) {
    const { path, content, line_count, create_backup = true } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (content === undefined) {
      throw new Error('缺少必需参数: content');
    }

    // 行数验证 - 防止内容截断
    const actualLineCount = content.split('\n').length;
    if (line_count !== undefined && line_count > 0) {
      if (actualLineCount < line_count * 0.8) {
        // 实际行数小于预期的 80%，可能被截断
        this.consecutiveMistakeCount++;
        
        // 检测代码省略标记
        const omissionDetected = this.detectCodeOmission(content);
        
        if (omissionDetected) {
          return this.createErrorResponse(new Error(
            `内容可能被截断 (实际 ${actualLineCount} 行，预期 ${line_count} 行)，` +
            `并检测到代码省略标记 (如 "// rest of code unchanged")。` +
            `请提供完整内容，或使用 apply_diff 工具进行增量修改。`
          ));
        }
      }
    }

    try {
      // HTML 实体转义
      let processedContent = this.unescapeHtmlEntities(content);
      
      // 移除可能的代码块标记
      processedContent = this.removeCodeBlockMarkers(processedContent);

      // 获取原始文件内容用于 Diff 预览
      let originalContent = '';
      let fileExists = false;
      try {
        const existing = await unifiedFileManager.readFile({ path, encoding: 'utf8' });
        originalContent = existing.content;
        fileExists = true;
      } catch {
        // 文件不存在，这是新文件
      }

      // 创建备份
      let backupPath: string | undefined;
      if (create_backup && fileExists) {
        backupPath = `${path}.backup.${Date.now()}`;
        await unifiedFileManager.writeFile({
          path: backupPath,
          content: originalContent,
          encoding: 'utf8',
          append: false
        });
      }

      // 写入文件
      await unifiedFileManager.writeFile({
        path,
        content: processedContent,
        encoding: 'utf8',
        append: false
      });

      // 获取写入后的行数
      const lineCount = await unifiedFileManager.getLineCount({ path });

      // 计算 Diff 统计
      const diffStats = this.computeDiffStats(originalContent, processedContent);

      // 重置连续错误计数
      this.consecutiveMistakeCount = 0;

      return this.createSuccessResponse({
        message: fileExists ? '文件更新成功' : '文件创建成功',
        path,
        totalLines: lineCount.lines,
        isNewFile: !fileExists,
        ...(backupPath && { backupPath }),
        diffStats: {
          added: diffStats.added,
          removed: diffStats.removed
        },
        // Diff 预览 (简化版)
        diffPreview: fileExists ? this.generateDiffPreview(originalContent, processedContent) : undefined
      });
    } catch (error) {
      throw new Error(`写入文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * HTML 实体转义
   */
  private unescapeHtmlEntities(text: string): string {
    if (!text) return text;

    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#91;/g, '[')
      .replace(/&#93;/g, ']')
      .replace(/&lsqb;/g, '[')
      .replace(/&rsqb;/g, ']')
      .replace(/&amp;/g, '&');
  }

  /**
   * 移除代码块标记
   */
  private removeCodeBlockMarkers(content: string): string {
    let result = content;
    
    // 移除开头的 ```
    if (result.startsWith('```')) {
      result = result.split('\n').slice(1).join('\n');
    }
    
    // 移除结尾的 ```
    if (result.endsWith('```')) {
      result = result.split('\n').slice(0, -1).join('\n');
    }
    
    return result;
  }

  /**
   * 检测代码省略标记
   */
  private detectCodeOmission(content: string): boolean {
    const omissionPatterns = [
      /\/\/\s*rest\s+of\s+code/i,
      /\/\/\s*\.{3}/,
      /\/\*\s*previous\s+code/i,
      /\/\*\s*rest\s+of/i,
      /\/\/\s*unchanged/i,
      /\/\/\s*same\s+as\s+before/i,
      /\/\/\s*\.{3}\s*remaining/i,
      /#\s*rest\s+of\s+code/i,
      /#\s*\.{3}/,
    ];

    return omissionPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 计算 Diff 统计
   */
  private computeDiffStats(oldContent: string, newContent: string): DiffStats {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    // 简化的 Diff 统计
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    
    let added = 0;
    let removed = 0;
    
    for (const line of newLines) {
      if (!oldSet.has(line)) added++;
    }
    
    for (const line of oldLines) {
      if (!newSet.has(line)) removed++;
    }
    
    return { added, removed };
  }

  /**
   * 生成 Diff 预览 (简化版)
   */
  private generateDiffPreview(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const preview: string[] = [];
    const maxPreviewLines = 20;
    let previewCount = 0;
    
    // 简化的行对比
    const maxLen = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLen && previewCount < maxPreviewLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine !== newLine) {
        if (oldLine !== undefined && newLine === undefined) {
          preview.push(`- ${i + 1}: ${oldLine.substring(0, 60)}...`);
        } else if (oldLine === undefined && newLine !== undefined) {
          preview.push(`+ ${i + 1}: ${newLine.substring(0, 60)}...`);
        } else if (oldLine !== newLine) {
          preview.push(`~ ${i + 1}: ${newLine?.substring(0, 60)}...`);
        }
        previewCount++;
      }
    }
    
    if (previewCount >= maxPreviewLines) {
      preview.push(`... 还有更多变更`);
    }
    
    return preview.join('\n');
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
   * 应用 Diff - 增强版
   * 支持多种 Diff 策略、部分失败处理、错误重试计数
   */
  private async applyDiff(params: { 
    path: string; 
    diff: string;
    strategy?: DiffStrategyType;
    fuzzy_threshold?: number;
  }) {
    const { path, diff, strategy = 'auto', fuzzy_threshold = FUZZY_THRESHOLD } = params;

    if (!path) {
      throw new Error('缺少必需参数: path');
    }
    if (!diff) {
      throw new Error('缺少必需参数: diff');
    }

    // 获取或初始化该文件的重试计数
    const currentRetryCount = this.diffRetryCount.get(path) || 0;

    try {
      // 检测 Diff 策略
      const detectedStrategy = strategy === 'auto' 
        ? this.detectDiffStrategy(diff) 
        : strategy;

      let result: DiffResult;

      if (detectedStrategy === 'search-replace') {
        // 使用 SEARCH/REPLACE 策略
        result = await this.applySearchReplaceDiff(path, diff, fuzzy_threshold);
      } else {
        // 使用传统 unified diff
        const unifiedResult = await unifiedFileManager.applyDiff({
          path,
          diff,
          createBackup: true
        });
        
        result = {
          success: unifiedResult.success,
          content: undefined,
          error: unifiedResult.success ? undefined : '应用 unified diff 失败'
        };
      }

      if (!result.success) {
        // 增加重试计数
        this.diffRetryCount.set(path, currentRetryCount + 1);
        this.consecutiveMistakeCount++;

        // 构建详细错误报告
        let errorMessage = result.error || 'Diff 应用失败';
        
        if (result.failParts && result.failParts.length > 0) {
          const failedCount = result.failParts.filter(p => !p.success).length;
          errorMessage += `\n\n部分失败报告: ${failedCount} 个块失败`;
          
          for (const part of result.failParts) {
            if (!part.success) {
              errorMessage += `\n- ${part.error}`;
            }
          }
        }

        // 如果重试次数过多，给出建议
        if (currentRetryCount >= 2) {
          errorMessage += `\n\n建议: 该文件已失败 ${currentRetryCount + 1} 次。请使用 read_file 工具获取最新内容后重试。`;
        }

        return this.createSuccessResponse({
          success: false,
          error: errorMessage,
          retryCount: currentRetryCount + 1,
          failParts: result.failParts
        });
      }

      // 成功 - 重置重试计数
      this.diffRetryCount.delete(path);
      this.consecutiveMistakeCount = 0;

      // 计算 Diff 统计
      const diffStats = this.computeSearchReplaceDiffStats(diff);

      return this.createSuccessResponse({
        message: 'Diff 应用成功',
        path,
        success: true,
        strategy: detectedStrategy,
        diffStats,
        ...(result.failParts && result.failParts.length > 0 && {
          partialSuccess: true,
          failParts: result.failParts.filter(p => !p.success)
        })
      });
    } catch (error) {
      // 增加重试计数
      this.diffRetryCount.set(path, currentRetryCount + 1);
      this.consecutiveMistakeCount++;
      
      throw new Error(`应用 diff 失败 (第 ${currentRetryCount + 1} 次尝试): ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检测 Diff 策略
   */
  private detectDiffStrategy(diff: string): DiffStrategyType {
    // 检测 SEARCH/REPLACE 格式
    if (diff.includes('<<<<<<< SEARCH') && diff.includes('>>>>>>> REPLACE')) {
      return 'search-replace';
    }
    
    // 检测 unified diff 格式
    if (diff.includes('@@') && (diff.includes('---') || diff.includes('+++'))) {
      return 'unified';
    }
    
    // 默认使用 search-replace
    return 'search-replace';
  }

  /**
   * 应用 SEARCH/REPLACE 格式的 Diff
   */
  private async applySearchReplaceDiff(
    filePath: string,
    diffContent: string,
    fuzzyThreshold: number
  ): Promise<DiffResult> {
    // 解析 SEARCH/REPLACE 块
    const blocks = this.parseSearchReplaceBlocks(diffContent);
    
    if (blocks.length === 0) {
      return {
        success: false,
        error: '无效的 Diff 格式 - 未找到 SEARCH/REPLACE 块'
      };
    }

    // 读取原始文件
    const originalFile = await unifiedFileManager.readFile({ path: filePath, encoding: 'utf8' });
    let content = originalFile.content;
    const failParts: DiffResult['failParts'] = [];
    let appliedCount = 0;

    // 按行号排序，从后往前应用以避免行号偏移
    const sortedBlocks = [...blocks].sort((a, b) => (b.startLine || 0) - (a.startLine || 0));

    for (const block of sortedBlocks) {
      const result = this.applySingleSearchReplace(
        content,
        block.search,
        block.replace,
        block.startLine,
        fuzzyThreshold
      );

      if (result.success && result.content) {
        content = result.content;
        appliedCount++;
      } else {
        failParts.push({
          success: false,
          error: result.error,
          details: {
            search: block.search.substring(0, 100) + '...',
            startLine: block.startLine
          }
        });
      }
    }

    if (appliedCount === 0) {
      return {
        success: false,
        error: '所有 SEARCH/REPLACE 块都失败',
        failParts
      };
    }

    // 写入文件
    await unifiedFileManager.writeFile({
      path: filePath,
      content,
      encoding: 'utf8',
      append: false
    });

    return {
      success: true,
      content,
      failParts: failParts.length > 0 ? failParts : undefined
    };
  }

  /**
   * 解析 SEARCH/REPLACE 块
   */
  private parseSearchReplaceBlocks(diff: string): Array<{
    search: string;
    replace: string;
    startLine?: number;
  }> {
    const blocks: Array<{ search: string; replace: string; startLine?: number }> = [];
    
    // 匹配 SEARCH/REPLACE 块
    const regex = /<<<<<<< SEARCH>?\s*\n(?::start_line:\s*(\d+)\s*\n)?(?:-------\s*\n)?([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
    
    let match;
    while ((match = regex.exec(diff)) !== null) {
      blocks.push({
        startLine: match[1] ? parseInt(match[1], 10) : undefined,
        search: match[2] || '',
        replace: match[3] || ''
      });
    }
    
    return blocks;
  }

  /**
   * 应用单个 SEARCH/REPLACE
   */
  private applySingleSearchReplace(
    content: string,
    search: string,
    replace: string,
    startLine: number | undefined,
    fuzzyThreshold: number
  ): { success: boolean; content?: string; error?: string } {
    const lines = content.split('\n');
    const searchLines = search.split('\n');
    
    // 确定搜索范围
    let searchStart = 0;
    let searchEnd = lines.length;
    
    if (startLine !== undefined) {
      searchStart = Math.max(0, startLine - 1 - BUFFER_LINES);
      searchEnd = Math.min(lines.length, startLine - 1 + searchLines.length + BUFFER_LINES);
    }

    // 查找最佳匹配
    let bestMatchIndex = -1;
    let bestMatchScore = 0;

    for (let i = searchStart; i <= searchEnd - searchLines.length; i++) {
      const chunk = lines.slice(i, i + searchLines.length).join('\n');
      const similarity = this.calculateSimilarity(chunk, search);
      
      if (similarity > bestMatchScore) {
        bestMatchScore = similarity;
        bestMatchIndex = i;
      }
      
      // 精确匹配，立即返回
      if (similarity === 1) break;
    }

    if (bestMatchIndex === -1 || bestMatchScore < fuzzyThreshold) {
      return {
        success: false,
        error: `未找到匹配内容 (相似度 ${Math.floor(bestMatchScore * 100)}%，需要 ${Math.floor(fuzzyThreshold * 100)}%)`
      };
    }

    // 应用替换
    const replaceLines = replace.split('\n');
    const newLines = [
      ...lines.slice(0, bestMatchIndex),
      ...replaceLines,
      ...lines.slice(bestMatchIndex + searchLines.length)
    ];

    return {
      success: true,
      content: newLines.join('\n')
    };
  }

  /**
   * 计算字符串相似度 (Levenshtein 简化版)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    // 简化的相似度计算
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    // 使用简化的编辑距离估算
    let matches = 0;
    const shorterLines = shorter.split('\n');
    const longerLines = longer.split('\n');
    
    for (const line of shorterLines) {
      if (longerLines.includes(line)) matches++;
    }
    
    return matches / Math.max(shorterLines.length, longerLines.length);
  }

  /**
   * 计算 SEARCH/REPLACE Diff 统计
   */
  private computeSearchReplaceDiffStats(diff: string): DiffStats {
    const blocks = this.parseSearchReplaceBlocks(diff);
    let added = 0;
    let removed = 0;

    for (const block of blocks) {
      const searchLines = block.search.split('\n').length;
      const replaceLines = block.replace.split('\n').length;
      
      if (replaceLines > searchLines) {
        added += replaceLines - searchLines;
      } else if (searchLines > replaceLines) {
        removed += searchLines - replaceLines;
      }
    }

    return { added, removed };
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
