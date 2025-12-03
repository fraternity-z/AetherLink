/**
 * 工作区相关工具定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const LIST_WORKSPACES_TOOL: Tool = {
  name: 'list_workspaces',
  description: '获取用户已添加的所有工作区列表。返回带编号的工作区，可以用编号或ID调用其他工具。在操作文件之前，应先调用此工具了解可用的工作区。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export const GET_WORKSPACE_FILES_TOOL: Tool = {
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
