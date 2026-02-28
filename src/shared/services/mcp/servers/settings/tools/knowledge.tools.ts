/**
 * 知识库工具模块
 * 
 * 提供知识库 + 文档的完整管理能力：
 * 
 * 知识库级：
 * - list_knowledge_bases   (read)    列出所有知识库
 * - get_knowledge_base     (read)    获取知识库详情
 * - create_knowledge_base  (confirm) 创建知识库（AI 需先确认）
 * - update_knowledge_base  (write)   更新知识库设置
 * - delete_knowledge_base  (confirm) 删除知识库（AI 需先确认）
 * - search_knowledge_base  (read)    在知识库中搜索
 * 
 * 文档级：
 * - list_documents         (read)    列出知识库中的所有文档
 * - add_document           (confirm) 添加文本内容到知识库（AI 需先确认）
 * - delete_document        (confirm) 删除单个文档（AI 需先确认）
 */

import type { ToolModule, SettingsTool } from '../types';
import { createSuccessResult, createErrorResult } from '../storeAccess';
import { MobileKnowledgeService } from '../../../../knowledge/MobileKnowledgeService';
import {
  DEFAULT_KNOWLEDGE_DOCUMENT_COUNT,
  DEFAULT_KNOWLEDGE_THRESHOLD,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP
} from '../../../../../constants/knowledge';

/** 获取知识库服务单例 */
function getKBService() {
  return MobileKnowledgeService.getInstance();
}

// ─── 工具定义 ───

const listKnowledgeBases: SettingsTool = {
  definition: {
    name: 'list_knowledge_bases',
    description: '列出所有知识库，返回每个知识库的名称、描述、模型、创建时间等信息',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  permission: 'read',
  handler: async () => {
    try {
      const bases = await getKBService().getAllKnowledgeBases();
      const summary = bases.map(kb => ({
        id: kb.id,
        name: kb.name,
        description: kb.description || '',
        model: kb.model,
        dimensions: kb.dimensions,
        chunkStrategy: kb.chunkStrategy || 'fixed',
        chunkSize: kb.chunkSize,
        threshold: kb.threshold,
        created_at: kb.created_at,
        updated_at: kb.updated_at
      }));
      return createSuccessResult({
        count: summary.length,
        knowledgeBases: summary
      });
    } catch (error) {
      return createErrorResult(`获取知识库列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const getKnowledgeBase: SettingsTool = {
  definition: {
    name: 'get_knowledge_base',
    description: '获取指定知识库的详细信息，包括配置参数和文档统计',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '知识库 ID'
        }
      },
      required: ['id']
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const id = args.id as string;
      const kb = await getKBService().getKnowledgeBase(id);
      if (!kb) {
        return createErrorResult(`知识库不存在: ${id}`);
      }
      return createSuccessResult(kb);
    } catch (error) {
      return createErrorResult(`获取知识库详情失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const createKnowledgeBase: SettingsTool = {
  definition: {
    name: 'create_knowledge_base',
    description: [
      '创建一个新的知识库。',
      '【重要】调用此工具前，请先向用户确认以下信息：知识库名称、嵌入模型。',
      '如果用户未指定，使用合理的默认值。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '知识库名称'
        },
        description: {
          type: 'string',
          description: '知识库描述（可选）'
        },
        model: {
          type: 'string',
          description: '嵌入模型名称，如 "text-embedding-3-small"'
        },
        dimensions: {
          type: 'number',
          description: '向量维度，默认 1536'
        },
        chunkSize: {
          type: 'number',
          description: '分块大小（字符数），默认 ' + DEFAULT_CHUNK_SIZE
        },
        chunkOverlap: {
          type: 'number',
          description: '分块重叠（字符数），默认 ' + DEFAULT_CHUNK_OVERLAP
        },
        chunkStrategy: {
          type: 'string',
          description: '分块策略',
          enum: ['fixed', 'paragraph', 'markdown', 'code']
        },
        threshold: {
          type: 'number',
          description: '相似度阈值 (0-1)，默认 ' + DEFAULT_KNOWLEDGE_THRESHOLD
        }
      },
      required: ['name', 'model']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const params = {
        name: args.name as string,
        description: (args.description as string) || '',
        model: args.model as string,
        dimensions: (args.dimensions as number) || 1536,
        documentCount: DEFAULT_KNOWLEDGE_DOCUMENT_COUNT,
        chunkSize: (args.chunkSize as number) || DEFAULT_CHUNK_SIZE,
        chunkOverlap: (args.chunkOverlap as number) || DEFAULT_CHUNK_OVERLAP,
        chunkStrategy: (args.chunkStrategy as 'fixed' | 'paragraph' | 'markdown' | 'code') || 'fixed',
        threshold: (args.threshold as number) || DEFAULT_KNOWLEDGE_THRESHOLD
      };

      const kb = await getKBService().createKnowledgeBase(params);
      return createSuccessResult({
        message: `知识库「${kb.name}」创建成功`,
        knowledgeBase: {
          id: kb.id,
          name: kb.name,
          model: kb.model,
          dimensions: kb.dimensions,
          chunkStrategy: kb.chunkStrategy,
          created_at: kb.created_at
        }
      });
    } catch (error) {
      return createErrorResult(`创建知识库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const updateKnowledgeBase: SettingsTool = {
  definition: {
    name: 'update_knowledge_base',
    description: '更新知识库的设置（名称、描述、阈值等）。不可修改模型和维度。',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '知识库 ID'
        },
        name: {
          type: 'string',
          description: '新的知识库名称'
        },
        description: {
          type: 'string',
          description: '新的描述'
        },
        chunkSize: {
          type: 'number',
          description: '新的分块大小'
        },
        chunkOverlap: {
          type: 'number',
          description: '新的分块重叠'
        },
        chunkStrategy: {
          type: 'string',
          description: '新的分块策略',
          enum: ['fixed', 'paragraph', 'markdown', 'code']
        },
        threshold: {
          type: 'number',
          description: '新的相似度阈值 (0-1)'
        },
        documentCount: {
          type: 'number',
          description: '新的文档数量限制'
        }
      },
      required: ['id']
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const id = args.id as string;
      const updates: Record<string, unknown> = {};

      // 只收集用户明确传入的字段
      const allowedFields = ['name', 'description', 'chunkSize', 'chunkOverlap', 'chunkStrategy', 'threshold', 'documentCount'];
      for (const field of allowedFields) {
        if (args[field] !== undefined) {
          updates[field] = args[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return createErrorResult('未提供任何需要更新的字段');
      }

      const result = await getKBService().updateKnowledgeBase(id, updates);
      if (!result) {
        return createErrorResult(`知识库不存在或更新失败: ${id}`);
      }

      return createSuccessResult({
        message: `知识库「${result.name}」更新成功`,
        updatedFields: Object.keys(updates),
        knowledgeBase: {
          id: result.id,
          name: result.name,
          description: result.description,
          updated_at: result.updated_at
        }
      });
    } catch (error) {
      return createErrorResult(`更新知识库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const deleteKnowledgeBase: SettingsTool = {
  definition: {
    name: 'delete_knowledge_base',
    description: [
      '删除指定的知识库及其所有关联文档。此操作不可撤销。',
      '【重要】调用此工具前，必须先向用户确认删除意图，并告知将同时删除所有关联文档。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '要删除的知识库 ID'
        }
      },
      required: ['id']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const id = args.id as string;

      // 先获取知识库信息用于返回消息
      const kb = await getKBService().getKnowledgeBase(id);
      if (!kb) {
        return createErrorResult(`知识库不存在: ${id}`);
      }

      const name = kb.name;
      const success = await getKBService().deleteKnowledgeBase(id);

      if (!success) {
        return createErrorResult(`删除知识库失败: ${id}`);
      }

      return createSuccessResult({
        message: `知识库「${name}」已删除`
      });
    } catch (error) {
      return createErrorResult(`删除知识库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const searchKnowledgeBase: SettingsTool = {
  definition: {
    name: 'search_knowledge_base',
    description: '在指定知识库中搜索与查询内容相关的文档片段',
    inputSchema: {
      type: 'object',
      properties: {
        knowledgeBaseId: {
          type: 'string',
          description: '知识库 ID'
        },
        query: {
          type: 'string',
          description: '搜索查询文本'
        },
        limit: {
          type: 'number',
          description: '返回结果数量上限，默认 5'
        }
      },
      required: ['knowledgeBaseId', 'query']
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const knowledgeBaseId = args.knowledgeBaseId as string;
      const query = args.query as string;
      const limit = (args.limit as number) || 5;

      const kb = await getKBService().getKnowledgeBase(knowledgeBaseId);
      if (!kb) {
        return createErrorResult(`知识库不存在: ${knowledgeBaseId}`);
      }

      const results = await getKBService().searchKnowledge(knowledgeBaseId, query, limit);

      return createSuccessResult({
        knowledgeBase: kb.name,
        query,
        resultCount: results.length,
        results: results.map(r => ({
          content: r.content,
          similarity: Math.round(r.similarity * 1000) / 1000,
          source: r.metadata?.fileName || r.metadata?.source || '未知来源'
        }))
      });
    } catch (error) {
      return createErrorResult(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 文档级工具 ───

const listDocuments: SettingsTool = {
  definition: {
    name: 'list_documents',
    description: '列出指定知识库中的所有文档片段，包括内容摘要、来源文件名、分块索引等信息',
    inputSchema: {
      type: 'object',
      properties: {
        knowledgeBaseId: {
          type: 'string',
          description: '知识库 ID'
        },
        page: {
          type: 'number',
          description: '页码（从 1 开始），默认 1'
        },
        pageSize: {
          type: 'number',
          description: '每页数量，默认 20，最大 100'
        }
      },
      required: ['knowledgeBaseId']
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const knowledgeBaseId = args.knowledgeBaseId as string;
      const page = Math.max(1, (args.page as number) || 1);
      const pageSize = Math.min(100, Math.max(1, (args.pageSize as number) || 20));

      const kb = await getKBService().getKnowledgeBase(knowledgeBaseId);
      if (!kb) {
        return createErrorResult(`知识库不存在: ${knowledgeBaseId}`);
      }

      const allDocs = await getKBService().getDocumentsByKnowledgeBaseId(knowledgeBaseId);

      // 按文件名分组统计
      const fileGroups: Record<string, { count: number; enabled: number }> = {};
      for (const doc of allDocs) {
        const fileName = doc.metadata?.fileName || doc.metadata?.source || '未知来源';
        if (!fileGroups[fileName]) {
          fileGroups[fileName] = { count: 0, enabled: 0 };
        }
        fileGroups[fileName].count++;
        if (doc.metadata?.enabled !== false) {
          fileGroups[fileName].enabled++;
        }
      }

      // 分页
      const start = (page - 1) * pageSize;
      const pagedDocs = allDocs.slice(start, start + pageSize);

      return createSuccessResult({
        knowledgeBase: kb.name,
        totalDocuments: allDocs.length,
        page,
        pageSize,
        totalPages: Math.ceil(allDocs.length / pageSize),
        fileGroups,
        documents: pagedDocs.map(doc => ({
          id: doc.id,
          contentPreview: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
          contentLength: doc.content.length,
          fileName: doc.metadata?.fileName || doc.metadata?.source || '未知来源',
          chunkIndex: doc.metadata?.chunkIndex,
          enabled: doc.metadata?.enabled !== false
        }))
      });
    } catch (error) {
      return createErrorResult(`获取文档列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const addDocument: SettingsTool = {
  definition: {
    name: 'add_document',
    description: [
      '向知识库添加文本内容。文本会被自动分块并向量化存储。',
      '【重要】调用此工具前，请先向用户确认要添加的内容和目标知识库。',
      '注意：此操作需要调用嵌入模型 API，会消耗 Token。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        knowledgeBaseId: {
          type: 'string',
          description: '目标知识库 ID'
        },
        content: {
          type: 'string',
          description: '要添加的文本内容'
        },
        source: {
          type: 'string',
          description: '内容来源描述，如 "用户笔记"、"API 文档" 等'
        },
        fileName: {
          type: 'string',
          description: '关联的文件名（可选），用于文档分组展示'
        }
      },
      required: ['knowledgeBaseId', 'content', 'source']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const knowledgeBaseId = args.knowledgeBaseId as string;
      const content = args.content as string;
      const source = args.source as string;
      const fileName = args.fileName as string | undefined;

      const kb = await getKBService().getKnowledgeBase(knowledgeBaseId);
      if (!kb) {
        return createErrorResult(`知识库不存在: ${knowledgeBaseId}`);
      }

      if (!content || content.trim().length === 0) {
        return createErrorResult('文本内容不能为空');
      }

      const documents = await getKBService().addDocument({
        knowledgeBaseId,
        content,
        metadata: {
          source,
          fileName: fileName || source
        }
      });

      return createSuccessResult({
        message: `已向知识库「${kb.name}」添加文档`,
        chunksCreated: documents.length,
        knowledgeBaseId,
        source
      });
    } catch (error) {
      return createErrorResult(`添加文档失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const deleteDocument: SettingsTool = {
  definition: {
    name: 'delete_document',
    description: [
      '删除知识库中的单个文档片段。此操作不可撤销。',
      '【重要】调用此工具前，必须先向用户确认删除意图。',
      '提示：可先用 list_documents 查看文档列表获取文档 ID。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: '要删除的文档片段 ID'
        }
      },
      required: ['documentId']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const documentId = args.documentId as string;
      const success = await getKBService().deleteDocument(documentId);

      if (!success) {
        return createErrorResult(`文档不存在或删除失败: ${documentId}`);
      }

      return createSuccessResult({
        message: `文档片段已删除`,
        documentId
      });
    } catch (error) {
      return createErrorResult(`删除文档失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 模块导出 ───

export const knowledgeModule: ToolModule = {
  domain: 'knowledge',
  tools: [
    listKnowledgeBases,
    getKnowledgeBase,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    searchKnowledgeBase,
    listDocuments,
    addDocument,
    deleteDocument
  ]
};
