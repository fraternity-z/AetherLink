/**
 * DEX Editor MCP Server
 * 提供 DEX 文件编辑功能，让 AI 可以搜索、查看、修改 Smali 代码
 * 
 * 工作流程：
 * 1. dex_open_apk - 打开 APK，查看有哪些 DEX 文件
 * 2. dex_open - 选择并打开一个或多个 DEX 文件
 * 3. dex_search - 搜索：类名、包名、方法名、字段名、字符串、整数、代码
 * 4. dex_get_class - 获取类的 Smali 代码（支持分页/限制 token）
 * 5. dex_modify_class - 修改类的 Smali 代码
 * 6. dex_save - 编译保存 DEX 到 APK
 * 7. dex_close - 关闭会话
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { DexEditorPlugin } from 'capacitor-dex-editor';

// ==================== 工具定义 ====================

const ATTEMPT_COMPLETION_TOOL: Tool = {
  name: 'attempt_completion',
  description: `当你认为已经完成了用户的 APK/DEX 编辑任务时，使用此工具来结束任务并向用户展示结果。
这是 Agentic 模式中唯一能够结束任务循环的方式。

重要规则：
1. 在完成所有必要的 DEX 操作后才调用此工具
2. 提供清晰的完成摘要，说明做了什么修改
3. 如果有任何遗留问题或建议，在 result 中说明
4. 不要在工具执行失败后立即调用此工具，应该先尝试修复问题
5. 如果修改了 APK，提醒用户需要重新签名`,
  inputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: '任务完成的结果摘要。向用户解释你做了什么，以及任何相关的后续建议。'
      },
      command: {
        type: 'string',
        description: '（可选）建议用户执行的操作，例如重新签名 APK 的步骤'
      }
    },
    required: ['result']
  }
};

const DEX_OPEN_APK_TOOL: Tool = {
  name: 'dex_open_apk',
  description: '打开 APK 文件，查看其中包含的所有 DEX 文件列表。这是第一步操作。',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件的完整路径'
      }
    },
    required: ['apkPath']
  }
};

const DEX_OPEN_TOOL: Tool = {
  name: 'dex_open',
  description: '打开指定的 DEX 文件进行编辑。可以同时打开多个 DEX。返回会话 ID 用于后续操作。',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      dexFiles: {
        type: 'array',
        items: { type: 'string' },
        description: 'DEX 文件名列表，如 ["classes.dex", "classes2.dex"]'
      }
    },
    required: ['apkPath', 'dexFiles']
  }
};

const DEX_SEARCH_TOOL: Tool = {
  name: 'dex_search',
  description: '在已打开的 DEX 中搜索。支持搜索：类名(class)、包名(package)、方法名(method)、字段名(field)、字符串(string)、整数(int)、代码(code)',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID（从 dex_open 获取）'
      },
      query: {
        type: 'string',
        description: '搜索内容'
      },
      searchType: {
        type: 'string',
        enum: ['class', 'package', 'method', 'field', 'string', 'int', 'code'],
        description: '搜索类型'
      },
      caseSensitive: {
        type: 'boolean',
        description: '是否区分大小写',
        default: false
      },
      maxResults: {
        type: 'integer',
        description: '最大返回结果数',
        default: 50
      }
    },
    required: ['sessionId', 'query', 'searchType']
  }
};

const DEX_LIST_CLASSES_TOOL: Tool = {
  name: 'dex_list_classes',
  description: '列出 DEX 中的所有类，支持包名过滤和分页',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      packageFilter: {
        type: 'string',
        description: '包名过滤（如 "com.example"）'
      },
      offset: {
        type: 'integer',
        description: '偏移量',
        default: 0
      },
      limit: {
        type: 'integer',
        description: '返回数量',
        default: 100
      }
    },
    required: ['sessionId']
  }
};

const DEX_GET_CLASS_TOOL: Tool = {
  name: 'dex_get_class',
  description: '获取指定类的 Smali 代码。支持限制返回的字符数（用于控制 token）',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名（如 "com.example.MainActivity" 或 "Lcom/example/MainActivity;"）'
      },
      maxChars: {
        type: 'integer',
        description: '最大返回字符数（用于限制 token），0 表示不限制',
        default: 0
      },
      offset: {
        type: 'integer',
        description: '字符偏移量（用于分页获取大文件）',
        default: 0
      }
    },
    required: ['sessionId', 'className']
  }
};

const DEX_MODIFY_CLASS_TOOL: Tool = {
  name: 'dex_modify_class',
  description: '修改类的 Smali 代码（仅修改内存中的内容，需要调用 dex_save 保存到 APK）',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名'
      },
      smaliContent: {
        type: 'string',
        description: '新的 Smali 代码'
      }
    },
    required: ['sessionId', 'className', 'smaliContent']
  }
};

const DEX_SAVE_TOOL: Tool = {
  name: 'dex_save',
  description: '编译修改后的 Smali 代码并保存 DEX 到 APK。用户需要自行签名 APK。',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      }
    },
    required: ['sessionId']
  }
};

const DEX_CLOSE_TOOL: Tool = {
  name: 'dex_close',
  description: '关闭 DEX 编辑会话，释放资源',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      }
    },
    required: ['sessionId']
  }
};

const DEX_LIST_SESSIONS_TOOL: Tool = {
  name: 'dex_list_sessions',
  description: '列出当前所有打开的 DEX 编辑会话',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

const DEX_ADD_CLASS_TOOL: Tool = {
  name: 'dex_add_class',
  description: '向 DEX 中添加一个新类。提供完整的 Smali 代码',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '新类名（如 "com.example.NewClass"）'
      },
      smaliContent: {
        type: 'string',
        description: '完整的 Smali 代码'
      }
    },
    required: ['sessionId', 'className', 'smaliContent']
  }
};

const DEX_DELETE_CLASS_TOOL: Tool = {
  name: 'dex_delete_class',
  description: '从 DEX 中删除一个类',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '要删除的类名'
      }
    },
    required: ['sessionId', 'className']
  }
};

const DEX_GET_METHOD_TOOL: Tool = {
  name: 'dex_get_method',
  description: '获取类中单个方法的 Smali 代码。适用于大类只看特定方法的场景',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名'
      },
      methodName: {
        type: 'string',
        description: '方法名（如 "onCreate" 或 "<init>"）'
      },
      methodSignature: {
        type: 'string',
        description: '方法签名（可选，用于区分重载方法，如 "(Landroid/os/Bundle;)V"）'
      }
    },
    required: ['sessionId', 'className', 'methodName']
  }
};

const DEX_MODIFY_METHOD_TOOL: Tool = {
  name: 'dex_modify_method',
  description: '修改类中单个方法的 Smali 代码。只需提供方法代码，自动替换原方法',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名'
      },
      methodName: {
        type: 'string',
        description: '方法名'
      },
      methodSignature: {
        type: 'string',
        description: '方法签名（可选，用于区分重载方法）'
      },
      newMethodCode: {
        type: 'string',
        description: '新的方法 Smali 代码（从 .method 到 .end method）'
      }
    },
    required: ['sessionId', 'className', 'methodName', 'newMethodCode']
  }
};

const DEX_LIST_METHODS_TOOL: Tool = {
  name: 'dex_list_methods',
  description: '列出类的所有方法，返回方法名、签名、访问修饰符等信息',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名'
      }
    },
    required: ['sessionId', 'className']
  }
};

const DEX_LIST_FIELDS_TOOL: Tool = {
  name: 'dex_list_fields',
  description: '列出类的所有字段，返回字段名、类型、访问修饰符等信息',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      className: {
        type: 'string',
        description: '类名'
      }
    },
    required: ['sessionId', 'className']
  }
};

const DEX_RENAME_CLASS_TOOL: Tool = {
  name: 'dex_rename_class',
  description: '重命名类（修改类名和所有引用）',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话 ID'
      },
      oldClassName: {
        type: 'string',
        description: '原类名'
      },
      newClassName: {
        type: 'string',
        description: '新类名'
      }
    },
    required: ['sessionId', 'oldClassName', 'newClassName']
  }
};

// ==================== XML 编辑工具 ====================

const APK_GET_MANIFEST_TOOL: Tool = {
  name: 'apk_get_manifest',
  description: '获取 APK 的 AndroidManifest.xml 内容（已解码为可读 XML）。支持分页和限制返回字符数',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      maxChars: {
        type: 'integer',
        description: '最大返回字符数（用于限制 token），0 表示不限制',
        default: 0
      },
      offset: {
        type: 'integer',
        description: '字符偏移量（用于分页获取大文件）',
        default: 0
      }
    },
    required: ['apkPath']
  }
};

const APK_MODIFY_MANIFEST_TOOL: Tool = {
  name: 'apk_modify_manifest',
  description: '修改 AndroidManifest.xml 并保存到 APK。支持修改包名、版本、权限、组件等',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      newManifest: {
        type: 'string',
        description: '新的 AndroidManifest.xml 内容'
      }
    },
    required: ['apkPath', 'newManifest']
  }
};

const APK_PATCH_MANIFEST_TOOL: Tool = {
  name: 'apk_patch_manifest',
  description: '快速修改 AndroidManifest.xml 的特定属性，无需提供完整 XML',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      patches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['package', 'versionCode', 'versionName', 'minSdk', 'targetSdk', 'application', 'permission', 'activity', 'service', 'receiver', 'provider', 'debuggable'],
              description: '修改类型'
            },
            action: {
              type: 'string',
              enum: ['set', 'add', 'remove'],
              description: '操作类型'
            },
            value: {
              type: 'string',
              description: '新值'
            },
            attributes: {
              type: 'object',
              description: '额外属性（用于组件修改）'
            }
          }
        },
        description: '修改列表'
      }
    },
    required: ['apkPath', 'patches']
  }
};

const APK_REPLACE_IN_MANIFEST_TOOL: Tool = {
  name: 'apk_replace_in_manifest',
  description: '在 AndroidManifest.xml 中精准替换字符串（直接修改二进制 AXML）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      replacements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            oldValue: { type: 'string', description: '要替换的原字符串' },
            newValue: { type: 'string', description: '新字符串' }
          },
          required: ['oldValue', 'newValue']
        },
        description: '替换列表'
      }
    },
    required: ['apkPath', 'replacements']
  }
};

const APK_MODIFY_RESOURCE_TOOL: Tool = {
  name: 'apk_modify_resource',
  description: '修改 APK 中的资源 XML 文件（如 layout、values 等）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      resourcePath: {
        type: 'string',
        description: '资源路径（如 "res/layout/activity_main.xml"）'
      },
      newContent: {
        type: 'string',
        description: '新的 XML 内容'
      }
    },
    required: ['apkPath', 'resourcePath', 'newContent']
  }
};

const APK_LIST_RESOURCES_TOOL: Tool = {
  name: 'apk_list_resources',
  description: '列出 APK 中的资源文件（res 目录）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      filter: {
        type: 'string',
        description: '过滤路径（如 "layout", "values", "drawable"）'
      }
    },
    required: ['apkPath']
  }
};

const APK_GET_RESOURCE_TOOL: Tool = {
  name: 'apk_get_resource',
  description: '获取 APK 中的资源文件内容（XML 会解码为可读格式）。支持分页和限制返回字符数',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      resourcePath: {
        type: 'string',
        description: '资源路径（如 "res/layout/activity_main.xml"）'
      },
      maxChars: {
        type: 'integer',
        description: '最大返回字符数（用于限制 token），0 表示不限制',
        default: 0
      },
      offset: {
        type: 'integer',
        description: '字符偏移量（用于分页获取大文件）',
        default: 0
      }
    },
    required: ['apkPath', 'resourcePath']
  }
};

const APK_LIST_FILES_TOOL: Tool = {
  name: 'apk_list_files',
  description: '列出 APK 中的所有文件（支持过滤和分页）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      filter: {
        type: 'string',
        description: '过滤路径（如 "lib/", "assets/", ".dex", ".so"）',
        default: ''
      },
      limit: {
        type: 'integer',
        description: '最大返回数量',
        default: 100
      },
      offset: {
        type: 'integer',
        description: '偏移量（用于分页）',
        default: 0
      }
    },
    required: ['apkPath']
  }
};

const APK_SEARCH_TEXT_TOOL: Tool = {
  name: 'apk_search_text',
  description: `在 APK 内的文件中搜索文本内容（不需要解压）。
支持搜索 XML、JSON、TXT、SMALI 等文本文件。
自动跳过二进制文件（.dex, .so, .png 等）。`,
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      pattern: {
        type: 'string',
        description: '搜索模式（文本或正则表达式）'
      },
      fileExtensions: {
        type: 'array',
        items: { type: 'string' },
        description: '文件扩展名过滤（如 [".xml", ".json"]），不指定则搜索所有文本文件'
      },
      caseSensitive: {
        type: 'boolean',
        description: '是否区分大小写',
        default: false
      },
      isRegex: {
        type: 'boolean',
        description: '是否使用正则表达式',
        default: false
      },
      maxResults: {
        type: 'integer',
        description: '最大结果数',
        default: 50
      },
      contextLines: {
        type: 'integer',
        description: '上下文行数',
        default: 2
      }
    },
    required: ['apkPath', 'pattern']
  }
};

const APK_DELETE_FILE_TOOL: Tool = {
  name: 'apk_delete_file',
  description: '从 APK 中删除指定的文件（如广告资源、无用 so 库等）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      filePath: {
        type: 'string',
        description: '要删除的文件路径（如 "lib/arm64-v8a/libad.so", "assets/config.json"）'
      }
    },
    required: ['apkPath', 'filePath']
  }
};

const APK_ADD_FILE_TOOL: Tool = {
  name: 'apk_add_file',
  description: '向 APK 中添加或替换文件（如注入 assets、so 库等）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      filePath: {
        type: 'string',
        description: '目标路径（如 "assets/config.json"）'
      },
      content: {
        type: 'string',
        description: '文件内容（文本文件直接传内容，二进制文件传 Base64 编码）'
      },
      isBase64: {
        type: 'boolean',
        description: '内容是否为 Base64 编码',
        default: false
      }
    },
    required: ['apkPath', 'filePath', 'content']
  }
};

const APK_READ_FILE_TOOL: Tool = {
  name: 'apk_read_file',
  description: '读取 APK 中的任意文件内容（文本或 Base64 编码）',
  inputSchema: {
    type: 'object',
    properties: {
      apkPath: {
        type: 'string',
        description: 'APK 文件路径'
      },
      filePath: {
        type: 'string',
        description: '文件路径（如 "classes.dex", "lib/arm64-v8a/libnative.so", "assets/config.json"）'
      },
      asBase64: {
        type: 'boolean',
        description: '是否以 Base64 编码返回（用于二进制文件）',
        default: false
      },
      maxBytes: {
        type: 'integer',
        description: '最大读取字节数（0 表示不限制）',
        default: 0
      },
      offset: {
        type: 'integer',
        description: '字节偏移量',
        default: 0
      }
    },
    required: ['apkPath', 'filePath']
  }
};

// 返回类型
type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

/**
 * DEX Editor Server 类
 */
export class DexEditorServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/dex-editor',
        version: '2.0.0'
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
        tools: [
          // DEX 工具
          DEX_OPEN_APK_TOOL,
          DEX_OPEN_TOOL,
          DEX_LIST_CLASSES_TOOL,
          DEX_SEARCH_TOOL,
          DEX_GET_CLASS_TOOL,
          DEX_GET_METHOD_TOOL,
          DEX_MODIFY_CLASS_TOOL,
          DEX_MODIFY_METHOD_TOOL,
          DEX_ADD_CLASS_TOOL,
          DEX_DELETE_CLASS_TOOL,
          DEX_LIST_METHODS_TOOL,
          DEX_LIST_FIELDS_TOOL,
          DEX_RENAME_CLASS_TOOL,
          DEX_SAVE_TOOL,
          DEX_CLOSE_TOOL,
          DEX_LIST_SESSIONS_TOOL,
          // XML/资源工具
          APK_GET_MANIFEST_TOOL,
          APK_MODIFY_MANIFEST_TOOL,
          APK_PATCH_MANIFEST_TOOL,
          APK_REPLACE_IN_MANIFEST_TOOL,
          APK_LIST_RESOURCES_TOOL,
          APK_GET_RESOURCE_TOOL,
          APK_MODIFY_RESOURCE_TOOL,
          APK_LIST_FILES_TOOL,
          APK_SEARCH_TEXT_TOOL,
          APK_READ_FILE_TOOL,
          APK_DELETE_FILE_TOOL,
          APK_ADD_FILE_TOOL,
          // Agentic 完成工具
          ATTEMPT_COMPLETION_TOOL
        ]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'dex_open_apk':
          return this.openApk(args as { apkPath: string });

        case 'dex_open':
          return this.openDex(args as { apkPath: string; dexFiles: string[] });

        case 'dex_list_classes':
          return this.listClasses(args as {
            sessionId: string;
            packageFilter?: string;
            offset?: number;
            limit?: number;
          });

        case 'dex_search':
          return this.search(args as {
            sessionId: string;
            query: string;
            searchType: string;
            caseSensitive?: boolean;
            maxResults?: number;
          });

        case 'dex_get_class':
          return this.getClass(args as {
            sessionId: string;
            className: string;
            maxChars?: number;
            offset?: number;
          });

        case 'dex_modify_class':
          return this.modifyClass(args as {
            sessionId: string;
            className: string;
            smaliContent: string;
          });

        case 'dex_save':
          return this.save(args as { sessionId: string });

        case 'dex_close':
          return this.close(args as { sessionId: string });

        case 'dex_list_sessions':
          return this.listSessions();

        case 'dex_add_class':
          return this.addClass(args as {
            sessionId: string;
            className: string;
            smaliContent: string;
          });

        case 'dex_delete_class':
          return this.deleteClass(args as {
            sessionId: string;
            className: string;
          });

        case 'dex_get_method':
          return this.getMethod(args as {
            sessionId: string;
            className: string;
            methodName: string;
            methodSignature?: string;
          });

        case 'dex_modify_method':
          return this.modifyMethod(args as {
            sessionId: string;
            className: string;
            methodName: string;
            methodSignature?: string;
            newMethodCode: string;
          });

        case 'dex_list_methods':
          return this.listMethods(args as {
            sessionId: string;
            className: string;
          });

        case 'dex_list_fields':
          return this.listFields(args as {
            sessionId: string;
            className: string;
          });

        case 'dex_rename_class':
          return this.renameClass(args as {
            sessionId: string;
            oldClassName: string;
            newClassName: string;
          });

        // XML/资源工具
        case 'apk_get_manifest':
          return this.getManifest(args as { apkPath: string; maxChars?: number; offset?: number });

        case 'apk_modify_manifest':
          return this.modifyManifest(args as { apkPath: string; newManifest: string });

        case 'apk_patch_manifest':
          return this.patchManifest(args as { 
            apkPath: string; 
            patches: Array<{ type: string; action: string; value?: string; attributes?: Record<string, string> }> 
          });

        case 'apk_replace_in_manifest':
          return this.replaceInManifest(args as { 
            apkPath: string; 
            replacements: Array<{ oldValue: string; newValue: string }> 
          });

        case 'apk_list_resources':
          return this.listResources(args as { apkPath: string; filter?: string });

        case 'apk_get_resource':
          return this.getResource(args as { apkPath: string; resourcePath: string; maxChars?: number; offset?: number });

        case 'apk_modify_resource':
          return this.modifyResource(args as { apkPath: string; resourcePath: string; newContent: string });

        case 'apk_list_files':
          return this.listApkFiles(args as { apkPath: string; filter?: string; limit?: number; offset?: number });

        case 'apk_search_text':
          return this.searchTextInApk(args as { 
            apkPath: string; 
            pattern: string; 
            fileExtensions?: string[];
            caseSensitive?: boolean;
            isRegex?: boolean;
            maxResults?: number;
            contextLines?: number;
          });

        case 'apk_read_file':
          return this.readApkFile(args as { apkPath: string; filePath: string; asBase64?: boolean; maxBytes?: number; offset?: number });

        case 'apk_delete_file':
          return this.deleteApkFile(args as { apkPath: string; filePath: string });

        case 'apk_add_file':
          return this.addApkFile(args as { apkPath: string; filePath: string; content: string; isBase64?: boolean });

        case 'attempt_completion':
          return this.attemptCompletion(args as { result: string; command?: string });

        default:
          throw new Error(`未知的工具: ${name}`);
      }
    });
  }

  /**
   * 打开 APK，查看 DEX 文件列表
   */
  private async openApk(params: { apkPath: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listDexFiles',
        params: { apkPath: params.apkPath }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      const dexFiles = result.data?.dexFiles || [];
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            apkPath: params.apkPath,
            dexFiles: dexFiles,
            hint: '请使用 dex_open 打开你想编辑的 DEX 文件'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 打开 DEX 文件
   */
  private async openDex(params: { apkPath: string; dexFiles: string[] }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'openDex',
        params: {
          apkPath: params.apkPath,
          dexFiles: params.dexFiles
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sessionId: result.data?.sessionId,
            apkPath: params.apkPath,
            dexFiles: params.dexFiles,
            classCount: result.data?.classCount || 0,
            hint: '会话已创建，可以使用 dex_search 或 dex_list_classes 浏览类'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出类
   */
  private async listClasses(params: {
    sessionId: string;
    packageFilter?: string;
    offset?: number;
    limit?: number;
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listClasses',
        params: {
          sessionId: params.sessionId,
          packageFilter: params.packageFilter || '',
          offset: params.offset || 0,
          limit: params.limit || 100
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: result.data?.total || 0,
            offset: params.offset || 0,
            limit: params.limit || 100,
            classes: result.data?.classes || [],
            hasMore: result.data?.hasMore || false
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 搜索
   */
  private async search(params: {
    sessionId: string;
    query: string;
    searchType: string;
    caseSensitive?: boolean;
    maxResults?: number;
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'searchInDexSession',
        params: {
          sessionId: params.sessionId,
          query: params.query,
          searchType: params.searchType,
          caseSensitive: params.caseSensitive || false,
          maxResults: params.maxResults || 50
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: params.query,
            searchType: params.searchType,
            total: result.data?.total || 0,
            results: result.data?.results || []
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 获取类的 Smali 代码
   */
  private async getClass(params: {
    sessionId: string;
    className: string;
    maxChars?: number;
    offset?: number;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'getClassSmaliFromSession',
        params: {
          sessionId: params.sessionId,
          className
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      let smaliContent = result.data?.smaliContent || '';
      const totalLength = smaliContent.length;
      
      // 支持分页和字符限制
      const offset = params.offset || 0;
      const maxChars = params.maxChars || 0;
      
      if (offset > 0) {
        smaliContent = smaliContent.slice(offset);
      }
      
      if (maxChars > 0 && smaliContent.length > maxChars) {
        smaliContent = smaliContent.slice(0, maxChars);
      }

      return {
        content: [{
          type: 'text',
          text: maxChars > 0 || offset > 0 
            ? JSON.stringify({
                className,
                totalLength,
                offset,
                returnedLength: smaliContent.length,
                hasMore: offset + smaliContent.length < totalLength,
                content: smaliContent
              }, null, 2)
            : smaliContent
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 修改类的 Smali 代码
   */
  private async modifyClass(params: {
    sessionId: string;
    className: string;
    smaliContent: string;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'modifyClass',
        params: {
          sessionId: params.sessionId,
          className,
          smaliContent: params.smaliContent
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `修改失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 类 ${className} 已修改（内存中）。请使用 dex_save 保存到 APK。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 添加新类
   */
  private async addClass(params: {
    sessionId: string;
    className: string;
    smaliContent: string;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'addClassToSession',
        params: {
          sessionId: params.sessionId,
          className,
          smaliContent: params.smaliContent
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `添加类失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 类 ${className} 已添加（内存中）。请使用 dex_save 保存到 APK。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 删除类
   */
  private async deleteClass(params: {
    sessionId: string;
    className: string;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'deleteClassFromSession',
        params: {
          sessionId: params.sessionId,
          className
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `删除类失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 类 ${className} 已删除（内存中）。请使用 dex_save 保存到 APK。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 获取单个方法
   */
  private async getMethod(params: {
    sessionId: string;
    className: string;
    methodName: string;
    methodSignature?: string;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'getMethodFromSession',
        params: {
          sessionId: params.sessionId,
          className,
          methodName: params.methodName,
          methodSignature: params.methodSignature || ''
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `获取方法失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: result.data?.methodCode || '# 方法未找到'
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 修改单个方法
   */
  private async modifyMethod(params: {
    sessionId: string;
    className: string;
    methodName: string;
    methodSignature?: string;
    newMethodCode: string;
  }): Promise<ToolResult> {
    try {
      // 规范化类名
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'modifyMethodInSession',
        params: {
          sessionId: params.sessionId,
          className,
          methodName: params.methodName,
          methodSignature: params.methodSignature || '',
          newMethodCode: params.newMethodCode
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `修改方法失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 方法 ${params.methodName} 已修改（内存中）。请使用 dex_save 保存到 APK。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出类的所有方法
   */
  private async listMethods(params: {
    sessionId: string;
    className: string;
  }): Promise<ToolResult> {
    try {
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listMethodsFromSession',
        params: { sessionId: params.sessionId, className }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `获取方法列表失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出类的所有字段
   */
  private async listFields(params: {
    sessionId: string;
    className: string;
  }): Promise<ToolResult> {
    try {
      let className = params.className;
      if (className.startsWith('L') && className.endsWith(';')) {
        className = className.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listFieldsFromSession',
        params: { sessionId: params.sessionId, className }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `获取字段列表失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 重命名类
   */
  private async renameClass(params: {
    sessionId: string;
    oldClassName: string;
    newClassName: string;
  }): Promise<ToolResult> {
    try {
      let oldClassName = params.oldClassName;
      let newClassName = params.newClassName;
      if (oldClassName.startsWith('L') && oldClassName.endsWith(';')) {
        oldClassName = oldClassName.slice(1, -1).replace(/\//g, '.');
      }
      if (newClassName.startsWith('L') && newClassName.endsWith(';')) {
        newClassName = newClassName.slice(1, -1).replace(/\//g, '.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'renameClassInSession',
        params: { sessionId: params.sessionId, oldClassName, newClassName }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `重命名类失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 类已重命名: ${oldClassName} → ${newClassName}。请使用 dex_save 保存到 APK。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 修改资源文件
   */
  private async modifyResource(params: {
    apkPath: string;
    resourcePath: string;
    newContent: string;
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'modifyResource',
        params: {
          apkPath: params.apkPath,
          resourcePath: params.resourcePath,
          newContent: params.newContent
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `修改资源失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 资源文件 ${params.resourcePath} 已修改。APK 需要重新签名。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 保存到 APK
   */
  private async save(params: { sessionId: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'saveDexToApk',
        params: { sessionId: params.sessionId }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `保存失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ DEX 已编译并保存到 APK。\n\n⚠️ APK 需要重新签名才能安装。请用户自行签名。`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 关闭会话
   */
  private async close(params: { sessionId: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'closeMultiDexSession',
        params: { sessionId: params.sessionId }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `关闭失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 会话 ${params.sessionId} 已关闭`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出所有会话
   */
  private async listSessions(): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listSessions',
        params: {}
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      const sessions = result.data?.sessions || [];
      if (sessions.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '当前没有打开的 DEX 编辑会话。请使用 dex_open_apk 开始。'
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: sessions.length,
            sessions
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  // ==================== XML/资源工具实现 ====================

  /**
   * 获取 AndroidManifest.xml
   */
  private async getManifest(params: { apkPath: string; maxChars?: number; offset?: number }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'getManifest',
        params: { apkPath: params.apkPath }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      let content = result.data?.manifest || '';
      const totalLength = content.length;
      
      // 支持分页和字符限制
      const offset = params.offset || 0;
      const maxChars = params.maxChars || 0;
      
      if (offset > 0) {
        content = content.slice(offset);
      }
      
      if (maxChars > 0 && content.length > maxChars) {
        content = content.slice(0, maxChars);
      }

      // 如果有分页参数，返回详细信息
      if (maxChars > 0 || offset > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              totalLength,
              offset,
              returnedLength: content.length,
              hasMore: offset + content.length < totalLength,
              content
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: content || '无法读取 Manifest'
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 修改 AndroidManifest.xml
   */
  private async modifyManifest(params: { apkPath: string; newManifest: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'modifyManifest',
        params: {
          apkPath: params.apkPath,
          newManifest: params.newManifest
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `修改失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ AndroidManifest.xml 已修改并保存到 APK\n⚠️ APK 需要重新签名`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 快速修改 Manifest 属性
   */
  private async patchManifest(params: { 
    apkPath: string; 
    patches: Array<{ type: string; action: string; value?: string; attributes?: Record<string, string> }> 
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'patchManifest',
        params: {
          apkPath: params.apkPath,
          patches: params.patches
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `修改失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            appliedPatches: result.data?.appliedPatches || params.patches.length,
            message: 'AndroidManifest.xml 已修改，APK 需要重新签名'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 精准替换 Manifest 中的字符串
   */
  private async replaceInManifest(params: { 
    apkPath: string; 
    replacements: Array<{ oldValue: string; newValue: string }> 
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'replaceInManifest',
        params: {
          apkPath: params.apkPath,
          replacements: params.replacements
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `替换失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            replacedCount: result.data?.replacedCount || 0,
            details: result.data?.details || [],
            message: 'AndroidManifest.xml 已修改，APK 需要重新签名'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出资源文件
   */
  private async listResources(params: { apkPath: string; filter?: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listResources',
        params: {
          apkPath: params.apkPath,
          filter: params.filter || ''
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: result.data?.total || 0,
            resources: result.data?.resources || []
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 列出 APK 中的所有文件
   */
  private async listApkFiles(params: { apkPath: string; filter?: string; limit?: number; offset?: number }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'listApkFiles',
        params: {
          apkPath: params.apkPath,
          filter: params.filter || '',
          limit: params.limit || 100,
          offset: params.offset || 0
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 在 APK 中搜索文本内容
   */
  private async searchTextInApk(params: { 
    apkPath: string; 
    pattern: string; 
    fileExtensions?: string[];
    caseSensitive?: boolean;
    isRegex?: boolean;
    maxResults?: number;
    contextLines?: number;
  }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'searchTextInApk',
        params: {
          apkPath: params.apkPath,
          pattern: params.pattern,
          fileExtensions: params.fileExtensions || [],
          caseSensitive: params.caseSensitive || false,
          isRegex: params.isRegex || false,
          maxResults: params.maxResults || 50,
          contextLines: params.contextLines || 2
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            pattern: params.pattern,
            totalFound: result.data?.totalFound || 0,
            filesSearched: result.data?.filesSearched || 0,
            truncated: result.data?.truncated || false,
            results: result.data?.results || []
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 读取 APK 中的任意文件
   */
  private async readApkFile(params: { apkPath: string; filePath: string; asBase64?: boolean; maxBytes?: number; offset?: number }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'readApkFile',
        params: {
          apkPath: params.apkPath,
          filePath: params.filePath,
          asBase64: params.asBase64 || false,
          maxBytes: params.maxBytes || 0,
          offset: params.offset || 0
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 获取资源文件内容
   */
  private async getResource(params: { apkPath: string; resourcePath: string; maxChars?: number; offset?: number }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'getResource',
        params: {
          apkPath: params.apkPath,
          resourcePath: params.resourcePath
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `错误: ${result.error}` }],
          isError: true
        };
      }

      let content = result.data?.content || '';
      const totalLength = content.length;
      const resourceType = result.data?.type || 'unknown';
      
      // 支持分页和字符限制
      const offset = params.offset || 0;
      const maxChars = params.maxChars || 0;
      
      if (offset > 0) {
        content = content.slice(offset);
      }
      
      if (maxChars > 0 && content.length > maxChars) {
        content = content.slice(0, maxChars);
      }

      // 如果有分页参数，返回详细信息
      if (maxChars > 0 || offset > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              path: params.resourcePath,
              type: resourceType,
              totalLength,
              offset,
              returnedLength: content.length,
              hasMore: offset + content.length < totalLength,
              content
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: content || '无法读取资源'
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 删除 APK 中的文件
   */
  private async deleteApkFile(params: { apkPath: string; filePath: string }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'deleteFileFromApk',
        params: {
          apkPath: params.apkPath,
          filePath: params.filePath
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `删除文件失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 已删除文件: ${params.filePath}\n⚠️ APK 需要重新签名`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 向 APK 添加或替换文件
   */
  private async addApkFile(params: { apkPath: string; filePath: string; content: string; isBase64?: boolean }): Promise<ToolResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DexEditorPlugin as any).execute({
        action: 'addFileToApk',
        params: {
          apkPath: params.apkPath,
          filePath: params.filePath,
          content: params.content,
          isBase64: params.isBase64 || false
        }
      });

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `添加文件失败: ${result.error}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ 已添加/替换文件: ${params.filePath}\n⚠️ APK 需要重新签名`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : '未知错误'}` }],
        isError: true
      };
    }
  }

  /**
   * 完成任务 - Agentic 模式的终止信号
   * 当 AI 认为任务已完成时调用此工具
   */
  private async attemptCompletion(params: { result: string; command?: string }): Promise<ToolResult> {
    const { result, command } = params;

    if (!result) {
      return {
        content: [{ type: 'text', text: '错误: 缺少必需参数 result（任务完成摘要）' }],
        isError: true
      };
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
    } as ToolResult;
  }
}
