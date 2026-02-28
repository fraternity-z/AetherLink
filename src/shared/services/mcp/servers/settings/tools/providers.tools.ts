/**
 * 模型供应商工具模块
 * 
 * 提供模型供应商 + 模型的智能管理能力：
 * 
 * 供应商级：
 * - list_providers          (read)    列出所有供应商及其状态
 * - get_provider            (read)    获取供应商详情
 * - toggle_provider         (write)   启用/禁用供应商
 * - update_provider_config  (write)   更新供应商配置（baseUrl、extraHeaders 等）
 * 
 * 模型级：
 * - list_models             (read)    列出供应商下的模型
 * - set_default_model       (write)   设置全局默认模型
 * - toggle_model            (write)   启用/禁用模型
 * - get_current_model       (read)    获取当前使用的模型
 * - add_model_to_provider   (confirm) 添加模型到供应商
 * - delete_model_from_provider (confirm) 从供应商删除模型
 * 
 * 辅助模型设置：
 * - get_assistant_model_settings  (read)  获取辅助模型设置（话题命名/意图分析/上下文压缩）
 * - update_assistant_model_settings (write) 更新辅助模型设置
 */

import type { ToolModule, SettingsTool } from '../types';
import { getSettings, getDispatch, createSuccessResult, createErrorResult } from '../storeAccess';
import {
  toggleProviderEnabled,
  updateProvider,
  setDefaultModel,
  setCurrentModel,
  addModelToProvider,
  deleteModelFromProvider,
  updateSettings,
} from '../../../../../store/settingsSlice';

// ─── 供应商级工具 ───

const listProviders: SettingsTool = {
  definition: {
    name: 'list_providers',
    description: '列出所有模型供应商，返回每个供应商的名称、启用状态、已配置模型数量等信息',
    inputSchema: {
      type: 'object',
      properties: {
        includeDisabled: {
          type: 'boolean',
          description: '是否包含已禁用的供应商，默认 true'
        }
      }
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const includeDisabled = args.includeDisabled !== false;

      const providers = settings.providers
        .filter(p => includeDisabled || p.isEnabled)
        .map(p => ({
          id: p.id,
          name: p.name,
          isEnabled: p.isEnabled,
          isSystem: p.isSystem || false,
          providerType: p.providerType || p.id,
          baseUrl: p.baseUrl || '',
          hasApiKey: !!(p.apiKey || (p.apiKeys && p.apiKeys.length > 0)),
          modelCount: p.models.length,
          enabledModelCount: p.models.filter(m => m.enabled !== false).length,
          useCorsPlugin: p.useCorsPlugin || false,
        }));

      return createSuccessResult({
        count: providers.length,
        defaultModelId: settings.defaultModelId,
        currentModelId: settings.currentModelId,
        providers
      });
    } catch (error) {
      return createErrorResult(`获取供应商列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const getProvider: SettingsTool = {
  definition: {
    name: 'get_provider',
    description: '获取指定供应商的详细信息，包括配置参数和模型列表',
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID（如 "openai"、"anthropic" 等）'
        }
      },
      required: ['providerId']
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const providerId = args.providerId as string;
      const provider = settings.providers.find(p => p.id === providerId);

      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      return createSuccessResult({
        id: provider.id,
        name: provider.name,
        isEnabled: provider.isEnabled,
        isSystem: provider.isSystem || false,
        providerType: provider.providerType || provider.id,
        baseUrl: provider.baseUrl || '',
        hasApiKey: !!(provider.apiKey || (provider.apiKeys && provider.apiKeys.length > 0)),
        apiKeyCount: provider.apiKeys?.length || (provider.apiKey ? 1 : 0),
        useCorsPlugin: provider.useCorsPlugin || false,
        useResponsesAPI: provider.useResponsesAPI || false,
        extraHeaders: provider.extraHeaders ? Object.keys(provider.extraHeaders) : [],
        models: provider.models.map(m => ({
          id: m.id,
          name: m.name,
          enabled: m.enabled !== false,
          isDefault: m.isDefault || false,
          group: m.group,
        }))
      });
    } catch (error) {
      return createErrorResult(`获取供应商详情失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const toggleProvider: SettingsTool = {
  definition: {
    name: 'toggle_provider',
    description: '启用或禁用指定供应商',
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID'
        },
        enabled: {
          type: 'boolean',
          description: '是否启用'
        }
      },
      required: ['providerId', 'enabled']
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const dispatch = getDispatch();
      const providerId = args.providerId as string;
      const enabled = args.enabled as boolean;

      const provider = settings.providers.find(p => p.id === providerId);
      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      dispatch(toggleProviderEnabled({ id: providerId, enabled }));

      return createSuccessResult({
        message: `供应商「${provider.name}」已${enabled ? '启用' : '禁用'}`,
        providerId,
        enabled
      });
    } catch (error) {
      return createErrorResult(`切换供应商状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const updateProviderConfig: SettingsTool = {
  definition: {
    name: 'update_provider_config',
    description: [
      '更新供应商的配置信息（baseUrl、API Key 等）。',
      '注意：不可修改供应商 ID 和名称。API Key 属于敏感信息，修改时请确认用户意图。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID'
        },
        baseUrl: {
          type: 'string',
          description: '新的 API 基础地址'
        },
        apiKey: {
          type: 'string',
          description: '新的 API Key'
        },
        useCorsPlugin: {
          type: 'boolean',
          description: '移动端是否使用 CORS 插件'
        },
        useResponsesAPI: {
          type: 'boolean',
          description: '是否使用 OpenAI Responses API'
        }
      },
      required: ['providerId']
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const dispatch = getDispatch();
      const providerId = args.providerId as string;

      const provider = settings.providers.find(p => p.id === providerId);
      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      const updates: Record<string, unknown> = {};
      const allowedFields = ['baseUrl', 'apiKey', 'useCorsPlugin', 'useResponsesAPI'];
      for (const field of allowedFields) {
        if (args[field] !== undefined) {
          updates[field] = args[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return createErrorResult('未提供任何需要更新的字段');
      }

      dispatch(updateProvider({ id: providerId, updates: updates as any }));

      // 对 apiKey 脱敏显示
      const displayUpdates = { ...updates };
      if (displayUpdates.apiKey) {
        const key = displayUpdates.apiKey as string;
        displayUpdates.apiKey = key.length > 8
          ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
          : '****';
      }

      return createSuccessResult({
        message: `供应商「${provider.name}」配置已更新`,
        updatedFields: Object.keys(updates),
        updates: displayUpdates
      });
    } catch (error) {
      return createErrorResult(`更新供应商配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 模型级工具 ───

const listModels: SettingsTool = {
  definition: {
    name: 'list_models',
    description: '列出指定供应商下的所有模型，或列出所有启用供应商的模型',
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID（可选，不传则列出所有启用供应商的模型）'
        },
        enabledOnly: {
          type: 'boolean',
          description: '是否只显示启用的模型，默认 true'
        }
      }
    }
  },
  permission: 'read',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const providerId = args.providerId as string | undefined;
      const enabledOnly = args.enabledOnly !== false;

      const targetProviders = providerId
        ? settings.providers.filter(p => p.id === providerId)
        : settings.providers.filter(p => p.isEnabled);

      if (providerId && targetProviders.length === 0) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      const models = targetProviders.flatMap(p =>
        p.models
          .filter(m => !enabledOnly || m.enabled !== false)
          .map(m => ({
            id: m.id,
            name: m.name,
            provider: p.id,
            providerName: p.name,
            enabled: m.enabled !== false,
            isDefault: m.isDefault || false,
            group: m.group,
          }))
      );

      return createSuccessResult({
        count: models.length,
        defaultModelId: settings.defaultModelId,
        currentModelId: settings.currentModelId,
        models
      });
    } catch (error) {
      return createErrorResult(`获取模型列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const getCurrentModel: SettingsTool = {
  definition: {
    name: 'get_current_model',
    description: '获取当前正在使用的模型和全局默认模型信息',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  permission: 'read',
  handler: async () => {
    try {
      const settings = getSettings();

      const findModel = (modelId?: string) => {
        if (!modelId) return null;
        for (const p of settings.providers) {
          const m = p.models.find(m => m.id === modelId || `${p.id}:${m.id}` === modelId);
          if (m) return { id: m.id, name: m.name, provider: p.id, providerName: p.name };
        }
        return null;
      };

      return createSuccessResult({
        currentModel: findModel(settings.currentModelId) || { id: settings.currentModelId, note: '未找到匹配模型' },
        defaultModel: findModel(settings.defaultModelId) || { id: settings.defaultModelId, note: '未找到匹配模型' },
      });
    } catch (error) {
      return createErrorResult(`获取当前模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const setDefaultModelTool: SettingsTool = {
  definition: {
    name: 'set_default_model',
    description: [
      '设置全局默认模型。此模型将用于新建对话的默认选择。',
      '【提示】可先用 list_models 获取可用模型列表。',
      '模型 ID 格式为 "供应商ID:模型ID"，如 "openai:gpt-4o"。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: '模型 ID（格式：供应商ID:模型ID）'
        }
      },
      required: ['modelId']
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const dispatch = getDispatch();
      const modelId = args.modelId as string;

      // 验证模型存在
      const settings = getSettings();
      let found = false;
      for (const p of settings.providers) {
        if (p.models.find(m => m.id === modelId || `${p.id}:${m.id}` === modelId)) {
          found = true;
          break;
        }
      }

      if (!found) {
        return createErrorResult(`模型不存在: ${modelId}。请先用 list_models 查看可用模型。`);
      }

      dispatch(setDefaultModel(modelId));
      dispatch(setCurrentModel(modelId));

      return createSuccessResult({
        message: `全局默认模型已设置为「${modelId}」`,
        modelId
      });
    } catch (error) {
      return createErrorResult(`设置默认模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const toggleModel: SettingsTool = {
  definition: {
    name: 'toggle_model',
    description: '启用或禁用供应商下的指定模型',
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID'
        },
        modelId: {
          type: 'string',
          description: '模型 ID'
        },
        enabled: {
          type: 'boolean',
          description: '是否启用'
        }
      },
      required: ['providerId', 'modelId', 'enabled']
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const dispatch = getDispatch();
      const providerId = args.providerId as string;
      const modelId = args.modelId as string;
      const enabled = args.enabled as boolean;

      const provider = settings.providers.find(p => p.id === providerId);
      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      const model = provider.models.find(m => m.id === modelId);
      if (!model) {
        return createErrorResult(`模型不存在: ${modelId}（供应商: ${provider.name}）`);
      }

      // 通过 updateProvider 更新模型的 enabled 字段
      const updatedModels = provider.models.map(m =>
        m.id === modelId ? { ...m, enabled } : m
      );
      dispatch(updateProvider({ id: providerId, updates: { models: updatedModels } as any }));

      return createSuccessResult({
        message: `模型「${model.name || modelId}」已${enabled ? '启用' : '禁用'}`,
        providerId,
        modelId,
        enabled
      });
    } catch (error) {
      return createErrorResult(`切换模型状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 模型增删工具 ───

const addModelToProviderTool: SettingsTool = {
  definition: {
    name: 'add_model_to_provider',
    description: [
      '向指定供应商添加一个新模型。',
      '【重要】调用此工具前，请先向用户确认模型 ID 和供应商。',
      '提示：可先用 list_providers 查看可用供应商。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID'
        },
        modelId: {
          type: 'string',
          description: '模型 ID（如 "gpt-4o"、"claude-3-5-sonnet-20241022"）'
        },
        modelName: {
          type: 'string',
          description: '模型显示名称（可选，默认与 modelId 相同）'
        },
        group: {
          type: 'string',
          description: '模型分组（可选，如 "GPT-4"、"Claude 3.5"）'
        }
      },
      required: ['providerId', 'modelId']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const dispatch = getDispatch();
      const providerId = args.providerId as string;
      const modelId = args.modelId as string;
      const modelName = (args.modelName as string) || modelId;
      const group = args.group as string | undefined;

      const provider = settings.providers.find(p => p.id === providerId);
      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      // 检查模型是否已存在
      if (provider.models.find(m => m.id === modelId)) {
        return createErrorResult(`模型已存在: ${modelId}（供应商: ${provider.name}）`);
      }

      const newModel = {
        id: modelId,
        name: modelName,
        provider: providerId,
        providerType: provider.providerType || providerId,
        enabled: true,
        isDefault: false,
        ...(group ? { group } : {}),
      } as any;

      dispatch(addModelToProvider({ providerId, model: newModel }));

      return createSuccessResult({
        message: `已向供应商「${provider.name}」添加模型「${modelName}」`,
        providerId,
        modelId,
        modelName
      });
    } catch (error) {
      return createErrorResult(`添加模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const deleteModelFromProviderTool: SettingsTool = {
  definition: {
    name: 'delete_model_from_provider',
    description: [
      '从供应商中删除指定模型。此操作不可撤销。',
      '【重要】调用此工具前，必须先向用户确认删除意图。',
      '提示：可先用 list_models 查看模型列表。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        providerId: {
          type: 'string',
          description: '供应商 ID'
        },
        modelId: {
          type: 'string',
          description: '要删除的模型 ID'
        }
      },
      required: ['providerId', 'modelId']
    }
  },
  permission: 'confirm',
  handler: async (args) => {
    try {
      const settings = getSettings();
      const dispatch = getDispatch();
      const providerId = args.providerId as string;
      const modelId = args.modelId as string;

      const provider = settings.providers.find(p => p.id === providerId);
      if (!provider) {
        return createErrorResult(`供应商不存在: ${providerId}`);
      }

      const model = provider.models.find(m => m.id === modelId);
      if (!model) {
        return createErrorResult(`模型不存在: ${modelId}（供应商: ${provider.name}）`);
      }

      dispatch(deleteModelFromProvider({ providerId, modelId }));

      return createSuccessResult({
        message: `已从供应商「${provider.name}」删除模型「${model.name || modelId}」`,
        providerId,
        modelId
      });
    } catch (error) {
      return createErrorResult(`删除模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 辅助模型设置工具 ───

const getAssistantModelSettings: SettingsTool = {
  definition: {
    name: 'get_assistant_model_settings',
    description: '获取辅助模型设置，包括话题命名、AI 意图分析、上下文压缩的配置状态',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  permission: 'read',
  handler: async () => {
    try {
      const settings = getSettings();

      return createSuccessResult({
        topicNaming: {
          enabled: settings.enableTopicNaming,
          modelId: settings.topicNamingModelId || null,
          useCurrentModel: settings.topicNamingUseCurrentModel || false,
          prompt: settings.topicNamingPrompt || ''
        },
        aiIntentAnalysis: {
          enabled: settings.enableAIIntentAnalysis || false,
          modelId: settings.aiIntentAnalysisModelId || null,
          useCurrentModel: settings.aiIntentAnalysisUseCurrentModel || false
        },
        contextCondense: {
          enabled: settings.contextCondense?.enabled || false,
          threshold: settings.contextCondense?.threshold || 80,
          modelId: settings.contextCondense?.modelId || null,
          useCurrentTopicModel: settings.contextCondense?.useCurrentTopicModel || false,
          customPrompt: settings.contextCondense?.customPrompt || ''
        },
        currentDefaultModelId: settings.defaultModelId
      });
    } catch (error) {
      return createErrorResult(`获取辅助模型设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

const updateAssistantModelSettings: SettingsTool = {
  definition: {
    name: 'update_assistant_model_settings',
    description: [
      '更新辅助模型设置（话题命名、AI 意图分析、上下文压缩）。',
      '只需传入要修改的字段，未传入的字段保持不变。'
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        enableTopicNaming: {
          type: 'boolean',
          description: '是否启用自动话题命名'
        },
        topicNamingModelId: {
          type: 'string',
          description: '话题命名使用的模型 ID（格式：供应商ID:模型ID）'
        },
        topicNamingUseCurrentModel: {
          type: 'boolean',
          description: '话题命名是否使用当前话题的模型'
        },
        topicNamingPrompt: {
          type: 'string',
          description: '自定义话题命名提示词'
        },
        enableAIIntentAnalysis: {
          type: 'boolean',
          description: '是否启用 AI 意图分析（用于网络搜索）'
        },
        aiIntentAnalysisModelId: {
          type: 'string',
          description: '意图分析使用的模型 ID'
        },
        aiIntentAnalysisUseCurrentModel: {
          type: 'boolean',
          description: '意图分析是否使用当前话题的模型'
        },
        contextCondenseEnabled: {
          type: 'boolean',
          description: '是否启用上下文自动压缩'
        },
        contextCondenseThreshold: {
          type: 'number',
          description: '压缩触发阈值百分比（5-100）'
        },
        contextCondenseModelId: {
          type: 'string',
          description: '压缩使用的模型 ID'
        },
        contextCondenseUseCurrentTopicModel: {
          type: 'boolean',
          description: '压缩是否使用当前话题的模型'
        },
        contextCondenseCustomPrompt: {
          type: 'string',
          description: '自定义压缩提示词'
        }
      }
    }
  },
  permission: 'write',
  handler: async (args) => {
    try {
      const dispatch = getDispatch();
      const settingsUpdates: Record<string, unknown> = {};
      const updatedFields: string[] = [];

      // 话题命名设置
      if (args.enableTopicNaming !== undefined) {
        settingsUpdates.enableTopicNaming = args.enableTopicNaming;
        updatedFields.push('enableTopicNaming');
      }
      if (args.topicNamingModelId !== undefined) {
        settingsUpdates.topicNamingModelId = args.topicNamingModelId;
        updatedFields.push('topicNamingModelId');
      }
      if (args.topicNamingUseCurrentModel !== undefined) {
        settingsUpdates.topicNamingUseCurrentModel = args.topicNamingUseCurrentModel;
        updatedFields.push('topicNamingUseCurrentModel');
      }
      if (args.topicNamingPrompt !== undefined) {
        settingsUpdates.topicNamingPrompt = args.topicNamingPrompt;
        updatedFields.push('topicNamingPrompt');
      }

      // AI 意图分析设置
      if (args.enableAIIntentAnalysis !== undefined) {
        settingsUpdates.enableAIIntentAnalysis = args.enableAIIntentAnalysis;
        updatedFields.push('enableAIIntentAnalysis');
      }
      if (args.aiIntentAnalysisModelId !== undefined) {
        settingsUpdates.aiIntentAnalysisModelId = args.aiIntentAnalysisModelId;
        updatedFields.push('aiIntentAnalysisModelId');
      }
      if (args.aiIntentAnalysisUseCurrentModel !== undefined) {
        settingsUpdates.aiIntentAnalysisUseCurrentModel = args.aiIntentAnalysisUseCurrentModel;
        updatedFields.push('aiIntentAnalysisUseCurrentModel');
      }

      // 上下文压缩设置
      const condenseUpdates: Record<string, unknown> = {};
      if (args.contextCondenseEnabled !== undefined) {
        condenseUpdates.enabled = args.contextCondenseEnabled;
        updatedFields.push('contextCondenseEnabled');
      }
      if (args.contextCondenseThreshold !== undefined) {
        condenseUpdates.threshold = args.contextCondenseThreshold;
        updatedFields.push('contextCondenseThreshold');
      }
      if (args.contextCondenseModelId !== undefined) {
        condenseUpdates.modelId = args.contextCondenseModelId;
        updatedFields.push('contextCondenseModelId');
      }
      if (args.contextCondenseUseCurrentTopicModel !== undefined) {
        condenseUpdates.useCurrentTopicModel = args.contextCondenseUseCurrentTopicModel;
        updatedFields.push('contextCondenseUseCurrentTopicModel');
      }
      if (args.contextCondenseCustomPrompt !== undefined) {
        condenseUpdates.customPrompt = args.contextCondenseCustomPrompt;
        updatedFields.push('contextCondenseCustomPrompt');
      }

      if (Object.keys(condenseUpdates).length > 0) {
        const settings = getSettings();
        settingsUpdates.contextCondense = {
          ...(settings.contextCondense || { enabled: false, threshold: 80 }),
          ...condenseUpdates
        };
      }

      if (updatedFields.length === 0) {
        return createErrorResult('未提供任何需要更新的字段');
      }

      dispatch(updateSettings(settingsUpdates as any));

      return createSuccessResult({
        message: `辅助模型设置已更新`,
        updatedFields
      });
    } catch (error) {
      return createErrorResult(`更新辅助模型设置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
};

// ─── 模块导出 ───

export const providersModule: ToolModule = {
  domain: 'providers',
  tools: [
    listProviders,
    getProvider,
    toggleProvider,
    updateProviderConfig,
    listModels,
    getCurrentModel,
    setDefaultModelTool,
    toggleModel,
    addModelToProviderTool,
    deleteModelFromProviderTool,
    getAssistantModelSettings,
    updateAssistantModelSettings
  ]
};
