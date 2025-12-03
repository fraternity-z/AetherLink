/**
 * File Editor MCP Server
 * 提供 AI 编辑工作区和笔记文件的能力
 * 
 * 模块化结构:
 * - tools/       工具定义
 * - handlers/    处理器实现
 * - utils/       工具函数
 * - types.ts     类型定义
 * - constants.ts 常量定义
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// 工具定义
import { LIST_WORKSPACES_TOOL, GET_WORKSPACE_FILES_TOOL } from './tools/workspace-tools';
import { 
  READ_FILE_TOOL, 
  WRITE_TO_FILE_TOOL, 
  LIST_FILES_TOOL, 
  GET_FILE_INFO_TOOL,
  CREATE_FILE_TOOL,
  RENAME_FILE_TOOL,
  MOVE_FILE_TOOL,
  COPY_FILE_TOOL,
  DELETE_FILE_TOOL
} from './tools/file-tools';
import { INSERT_CONTENT_TOOL, APPLY_DIFF_TOOL, REPLACE_IN_FILE_TOOL } from './tools/edit-tools';
import { SEARCH_FILES_TOOL } from './tools/search-tools';
import { ATTEMPT_COMPLETION_TOOL } from './tools/completion-tools';

// 处理器
import { listWorkspaces, getWorkspaceFiles } from './handlers/workspace-handlers';
import { 
  readFile, 
  listFiles, 
  getFileInfo,
  createFile,
  renameFile,
  moveFile,
  copyFile,
  deleteFile
} from './handlers/file-handlers';
import { writeToFile, insertContent, applyDiff, replaceInFile } from './handlers/edit-handlers';
import { searchFiles } from './handlers/search-handlers';

// 工具函数
import { createErrorResponse } from './utils/response';

// 所有工具列表
const ALL_TOOLS: Tool[] = [
  // 工作区工具
  LIST_WORKSPACES_TOOL,
  GET_WORKSPACE_FILES_TOOL,
  // 文件读写工具
  READ_FILE_TOOL,
  WRITE_TO_FILE_TOOL,
  LIST_FILES_TOOL,
  GET_FILE_INFO_TOOL,
  // 文件管理工具 (新增)
  CREATE_FILE_TOOL,
  RENAME_FILE_TOOL,
  MOVE_FILE_TOOL,
  COPY_FILE_TOOL,
  DELETE_FILE_TOOL,
  // 编辑工具
  INSERT_CONTENT_TOOL,
  APPLY_DIFF_TOOL,
  REPLACE_IN_FILE_TOOL,
  // 搜索工具
  SEARCH_FILES_TOOL,
  // 任务完成
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
            return await listWorkspaces();
          case 'get_workspace_files':
            return await getWorkspaceFiles(args as any);
          case 'read_file':
            return await readFile(args as any);
          case 'write_to_file':
            return await writeToFile(args as any);
          case 'insert_content':
            return await insertContent(args as any);
          case 'apply_diff':
            return await applyDiff(args as any);
          case 'list_files':
            return await listFiles(args as any);
          case 'search_files':
            return await searchFiles(args as any);
          case 'replace_in_file':
            return await replaceInFile(args as any);
          case 'get_file_info':
            return await getFileInfo(args as any);
          case 'create_file':
            return await createFile(args as any);
          case 'rename_file':
            return await renameFile(args as any);
          case 'move_file':
            return await moveFile(args as any);
          case 'copy_file':
            return await copyFile(args as any);
          case 'delete_file':
            return await deleteFile(args as any);
          case 'attempt_completion':
            return await this.attemptCompletion(args as any);
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return createErrorResponse(error);
      }
    });
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
}

// 导出类型和常量
export * from './types';
export * from './constants';
