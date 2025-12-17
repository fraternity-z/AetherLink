/**
 * 文件读写相关工具定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const READ_FILE_TOOL: Tool = {
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

export const WRITE_TO_FILE_TOOL: Tool = {
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

export const LIST_FILES_TOOL: Tool = {
  name: 'list_files',
  description: `列出目录内容，显示文件和文件夹。

功能特性:
- 支持分页，避免返回过多数据
- 支持递归列出子目录
- 可选返回文件大小信息
- 返回总数和分页信息`,
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
      },
      include_size: {
        type: 'boolean',
        description: '是否包含文件大小信息，默认 false'
      },
      limit: {
        type: 'number',
        description: '每页数量，默认 100，-1 表示全部'
      },
      offset: {
        type: 'number',
        description: '偏移量（用于分页），默认 0'
      }
    },
    required: ['path']
  }
};

export const GET_FILE_INFO_TOOL: Tool = {
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

export const CREATE_FILE_TOOL: Tool = {
  name: 'create_file',
  description: `创建新文件。如果文件已存在会报错。

与 write_to_file 的区别:
- create_file: 仅用于创建新文件，文件已存在时报错
- write_to_file: 创建或覆盖文件，需要提供完整内容和行数验证

适用场景:
- 创建空文件
- 创建带初始内容的新文件
- 确保不会意外覆盖现有文件`,
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要创建的文件的完整路径'
      },
      content: {
        type: 'string',
        description: '文件的初始内容，默认为空'
      },
      overwrite: {
        type: 'boolean',
        description: '如果文件已存在是否覆盖，默认 false'
      }
    },
    required: ['path']
  }
};

export const RENAME_FILE_TOOL: Tool = {
  name: 'rename_file',
  description: '重命名文件或目录。只改变名称，不改变位置。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要重命名的文件或目录的完整路径'
      },
      new_name: {
        type: 'string',
        description: '新的文件名或目录名（不包含路径）'
      }
    },
    required: ['path', 'new_name']
  }
};

export const MOVE_FILE_TOOL: Tool = {
  name: 'move_file',
  description: '移动文件或目录到新位置。可以同时重命名。',
  inputSchema: {
    type: 'object',
    properties: {
      source_path: {
        type: 'string',
        description: '源文件或目录的完整路径'
      },
      destination_path: {
        type: 'string',
        description: '目标位置的完整路径（包含新文件名）'
      }
    },
    required: ['source_path', 'destination_path']
  }
};

export const COPY_FILE_TOOL: Tool = {
  name: 'copy_file',
  description: '复制文件或目录到新位置。',
  inputSchema: {
    type: 'object',
    properties: {
      source_path: {
        type: 'string',
        description: '源文件或目录的完整路径'
      },
      destination_path: {
        type: 'string',
        description: '目标位置的完整路径（包含新文件名）'
      },
      overwrite: {
        type: 'boolean',
        description: '如果目标已存在是否覆盖，默认 false'
      }
    },
    required: ['source_path', 'destination_path']
  }
};

export const DELETE_FILE_TOOL: Tool = {
  name: 'delete_file',
  description: '删除文件或目录。删除目录时会递归删除所有内容。',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要删除的文件或目录的完整路径'
      },
      recursive: {
        type: 'boolean',
        description: '删除目录时是否递归删除，默认 true'
      }
    },
    required: ['path']
  }
};
