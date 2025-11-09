import type { Model } from '../types';

// 导出负载均衡策略类型
export type LoadBalanceStrategy = 'round_robin' | 'priority' | 'least_used' | 'random';

// API Key 配置接口
export interface ApiKeyConfig {
  id: string; // 唯一标识符
  key: string; // API Key 值
  name?: string; // 可选的 Key 名称/备注
  isEnabled: boolean; // 是否启用
  priority: number; // 优先级 (1-10, 数字越小优先级越高)
  maxRequestsPerMinute?: number; // 每分钟最大请求数限制
  // 使用统计
  usage: {
    totalRequests: number; // 总请求数
    successfulRequests: number; // 成功请求数
    failedRequests: number; // 失败请求数
    lastUsed?: number; // 最后使用时间戳
    consecutiveFailures: number; // 连续失败次数
  };
  // 状态信息
  status: 'active' | 'disabled' | 'error' | 'rate_limited'; // Key 状态
  lastError?: string; // 最后的错误信息
  createdAt: number; // 创建时间戳
  updatedAt: number; // 更新时间戳
}

export interface ModelProvider {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isEnabled: boolean;
  // 保持向后兼容的单个 API Key
  apiKey?: string;
  // 新增：多 Key 支持
  apiKeys?: ApiKeyConfig[];
  // Key 管理配置
  keyManagement?: {
    strategy: 'round_robin' | 'priority' | 'least_used' | 'random'; // 负载均衡策略
    maxFailuresBeforeDisable: number; // 连续失败多少次后禁用 Key
    failureRecoveryTime: number; // 失败后多久重新尝试 (分钟)
    enableAutoRecovery: boolean; // 是否启用自动恢复
  };
  baseUrl?: string;
  models: Model[];
  providerType?: string;
  isSystem?: boolean; // 标记是否为系统供应商
  extraHeaders?: Record<string, string>; // 额外的请求头
  extraBody?: Record<string, any>; // 额外的请求体参数
  customModelEndpoint?: string; // 自定义模型端点URL
}

// 默认模型供应商配置
export const getDefaultModelProviders = (): ModelProvider[] => [
  {
    id: 'model-combo',
    name: '模型组合',
    avatar: '🧠',
    color: '#f43f5e',
    isEnabled: true,
    apiKey: '',
    baseUrl: '',
    isSystem: true, // 标记为系统供应商
    models: [] // 动态从模型组合服务加载
  },
  {
    id: 'openai',
    name: 'OpenAI',
    avatar: 'O',
    color: '#10a37f',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    providerType: 'openai',
    models: [
      // GPT-5 系列 (最新旗舰 - 2025年8月发布)
      { id: 'gpt-5', name: 'GPT-5', provider: 'openai', enabled: true, isDefault: false, description: '最佳编程和代理任务模型，2025年8月发布' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-5轻量版，性价比高' },

      // GPT-4.5 系列
      { id: 'gpt-4.5', name: 'GPT-4.5', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-4.5模型，写作和推理能力强' },

      // GPT-4.1 系列
      { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', enabled: true, isDefault: false, description: '最智能的非推理模型' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-4.1轻量版' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-4.1超轻量版' },

      // GPT-4o 系列
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', enabled: true, isDefault: true, description: 'GPT-4优化版，多模态能力强' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-4o轻量版，快速且经济' },

      // GPT-4 系列
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', enabled: true, isDefault: false, description: 'GPT-4加速版' },

      // o系列推理模型
      { id: 'o1', name: 'o1', provider: 'openai', enabled: true, isDefault: false, description: 'OpenAI推理模型第一代' },
      { id: 'o1-mini', name: 'o1-mini', provider: 'openai', enabled: true, isDefault: false, description: 'o1轻量版推理模型' },
      { id: 'o1-pro', name: 'o1-pro', provider: 'openai', enabled: true, isDefault: false, description: 'o1专业版推理模型' },
      { id: 'o3', name: 'o3', provider: 'openai', enabled: true, isDefault: false, description: 'OpenAI推理模型第三代，2025年4月发布' },
      { id: 'o3-mini', name: 'o3-mini', provider: 'openai', enabled: true, isDefault: false, description: 'o3轻量版推理模型' },
      { id: 'o3-pro', name: 'o3-pro', provider: 'openai', enabled: true, isDefault: false, description: 'o3专业版推理模型，2025年6月发布' },
      { id: 'o4-mini', name: 'o4-mini', provider: 'openai', enabled: true, isDefault: false, description: 'o4轻量版推理模型，快速且高性价比' },
    ]
  },
  {
    id: 'openai-aisdk',
    name: 'OpenAI (AI SDK)',
    avatar: '🚀',
    color: '#10a37f',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    providerType: 'openai-aisdk',
    models: [
      // GPT-5 系列 (最新旗舰 - 2025年8月发布)
      { id: 'gpt-5', name: 'GPT-5', provider: 'openai-aisdk', enabled: true, isDefault: false, description: '最佳编程和代理任务模型，2025年8月发布' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-5轻量版，性价比高' },

      // GPT-4.5 系列
      { id: 'gpt-4.5', name: 'GPT-4.5', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4.5模型，写作和推理能力强' },

      // GPT-4.1 系列
      { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai-aisdk', enabled: true, isDefault: false, description: '最智能的非推理模型' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4.1轻量版' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4.1超轻量版' },

      // GPT-4o 系列
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4优化版，多模态能力强' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4o轻量版，快速且经济' },

      // GPT-4 系列
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'GPT-4加速版' },

      // o系列推理模型
      { id: 'o1', name: 'o1', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'OpenAI推理模型第一代' },
      { id: 'o1-mini', name: 'o1-mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'o1轻量版推理模型' },
      { id: 'o1-pro', name: 'o1-pro', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'o1专业版推理模型' },
      { id: 'o3', name: 'o3', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'OpenAI推理模型第三代，2025年4月发布' },
      { id: 'o3-mini', name: 'o3-mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'o3轻量版推理模型' },
      { id: 'o3-pro', name: 'o3-pro', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'o3专业版推理模型，2025年6月发布' },
      { id: 'o4-mini', name: 'o4-mini', provider: 'openai-aisdk', enabled: true, isDefault: false, description: 'o4轻量版推理模型，快速且高性价比' },
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini',
    avatar: 'G',
    color: '#4285f4',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    providerType: 'gemini',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', enabled: true, isDefault: false, description: '最先进的思考模型，能够处理代码、数学和STEM领域的复杂问题' },
      { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Pro文本转语音版本' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', enabled: true, isDefault: false, description: '性价比最佳模型，适合大规模处理、低延迟和高容量任务' },
      { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Flash预览版' },
      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Flash图像生成和理解版本' },
      { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Flash Live', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Flash实时音视频交互版本' },
      { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Flash文本转语音版本' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini', enabled: true, isDefault: false, description: '超快速Flash模型，优化成本效率和高吞吐量' },
      { id: 'gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite Preview', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.5 Flash Lite预览版' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', enabled: true, isDefault: false, description: '第二代主力模型，1M token上下文窗口' },
      { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (稳定版)', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.0 Flash稳定版本' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (实验版)', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.0 Flash实验版本' },
      { id: 'gemini-2.0-flash-preview-image-generation', name: 'Gemini 2.0 Flash Image', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.0 Flash图像生成版本' },
      { id: 'gemini-2.0-flash-live-001', name: 'Gemini 2.0 Flash Live', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.0 Flash实时交互版本' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'gemini', enabled: true, isDefault: false, description: '第二代快速模型，1M token上下文窗口' },
      { id: 'gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite (稳定版)', provider: 'gemini', enabled: true, isDefault: false, description: 'Gemini 2.0 Flash Lite稳定版本' },
      {
        id: 'veo-2.0-generate-001',
        name: 'Veo 2 (视频生成)',
        provider: 'google',
        enabled: true,
        isDefault: false,
        description: 'Google Veo 2高质量视频生成模型，支持文本和图片生成视频',
        capabilities: {
          videoGeneration: true
        },
        modelTypes: ['video_gen' as any]
      },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    avatar: 'A',
    color: '#b83280',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    providerType: 'anthropic',
    models: [
      // Claude 4.5 系列 (最新)
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic', enabled: true, isDefault: false, description: '最智能的模型，适合复杂代理和编程任务，在编程和代理任务上表现卓越' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic', enabled: true, isDefault: false, description: '最快的模型，具有接近前沿的智能水平，适合高并发场景' },

      // Claude 4.1 系列
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'anthropic', enabled: true, isDefault: false, description: '专门用于特殊推理任务的卓越模型' },

      // Claude 4 系列 (传统)
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude Sonnet 3.7的重大升级，在编程和推理方面表现卓越' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', enabled: true, isDefault: false, description: '世界最佳编程模型，在SWE-bench上领先，适合代理和复杂任务' },

      // Claude 3.7 系列
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude 3.7 Sonnet，行业领先的能力' },

      // Claude 3.5 系列
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude 3.5 Sonnet，平衡性能与效率' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude 3.5 Haiku，快速响应' },

      // Claude 3 系列
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude 3 Opus，强大的推理能力' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', enabled: true, isDefault: false, description: 'Claude 3 Haiku，快速且经济的模型' },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    avatar: 'D',
    color: '#754AB4',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    providerType: 'openai',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3.2-Exp)', provider: 'deepseek', enabled: true, isDefault: false, description: 'DeepSeek-V3.2-Exp非思考模式，128K上下文，支持JSON输出、函数调用等功能' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (V3.2-Exp)', provider: 'deepseek', enabled: true, isDefault: false, description: 'DeepSeek-V3.2-Exp思考模式，专门用于推理任务，128K上下文，最大输出64K tokens' },
    ]
  },
  {
    id: 'volcengine',
    name: '火山引擎',
    avatar: 'V',
    color: '#ff3d00',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    providerType: 'volcengine',
    models: [
      { id: 'doubao-1.6', name: '豆包 1.6', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包大模型最新版本，思考模式升级' },
      { id: 'doubao-1.6-thinking', name: '豆包 1.6 Thinking', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包1.6思考模式，强推理能力' },
      { id: 'doubao-1.6-flash', name: '豆包 1.6 Flash', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包1.6快速版本' },
      { id: 'doubao-1.6-vision', name: '豆包 1.6 Vision', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包1.6多模态版本' },
      { id: 'doubao-1.5-pro-256k', name: '豆包 1.5 Pro', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包大模型专业版，综合能力强，支持256k上下文' },
      { id: 'doubao-1.5-lite-32k', name: '豆包 1.5 Lite', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包大模型轻量版，快速响应，支持32k上下文' },
      { id: 'doubao-1.5-vision-pro', name: '豆包 1.5 Vision Pro', provider: 'volcengine', enabled: true, isDefault: false, description: '豆包1.5视觉专业版，支持图像理解' },
      { id: 'doubao-seedance-1.0-pro', name: 'Doubao-Seedance 1.0 Pro', provider: 'volcengine', enabled: true, isDefault: false, description: '视频生成模型，可生成1080p 5s视频' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'volcengine', enabled: true, isDefault: false, description: 'DeepSeek R1推理模型，通过火山引擎提供' }
    ]
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    avatar: '智',
    color: '#4f46e5',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    providerType: 'zhipu',
    models: [
      // GLM-4.6 系列 (最新旗舰)
      { id: 'glm-4.6', name: 'GLM-4.6', provider: 'zhipu', enabled: true, isDefault: false, description: '最新旗舰模型，擅长编程、代理、推理等任务，2025年发布' },

      // GLM-4.5 系列
      { id: 'glm-4.5-plus', name: 'GLM-4.5-Plus', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4.5增强版，高智能旗舰模型，综合性能优异' },
      { id: 'glm-4.5-air', name: 'GLM-4.5-Air', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4.5轻量版，128K上下文，性价比高' },
      { id: 'glm-4.5-airx', name: 'GLM-4.5-AirX', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4.5轻量增强版，优化性能' },
      { id: 'glm-4.5v', name: 'GLM-4.5V', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4.5视觉模型，支持图像理解' },

      // GLM-4 系列
      { id: 'glm-4-0520', name: 'GLM-4-0520', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4稳定版本(2024年5月20日)' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4增强版，更强推理能力' },
      { id: 'glm-4-long', name: 'GLM-4-Long', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4长文本版，支持超长上下文' },
      { id: 'glm-4-air', name: 'GLM-4-Air', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4轻量版，快速响应' },
      { id: 'glm-4-airx', name: 'GLM-4-AirX', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4轻量增强版' },
      { id: 'glm-4-flash', name: 'GLM-4-Flash', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4极速版，免费使用，128K上下文' },
      { id: 'glm-4-flashx', name: 'GLM-4-FlashX', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4极速增强版' },

      // GLM-4V 视觉系列
      { id: 'glm-4v', name: 'GLM-4V', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4视觉版，支持图像理解' },
      { id: 'glm-4v-flash', name: 'GLM-4V-Flash', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4V极速版' },
      { id: 'glm-4v-plus', name: 'GLM-4V-Plus', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4V增强版，视觉推理能力强' },

      // 特殊功能模型
      { id: 'glm-4-alltools', name: 'GLM-4-AllTools', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4全工具版，支持网络搜索、代码执行等工具' },
      { id: 'glm-4-voice', name: 'GLM-4-Voice', provider: 'zhipu', enabled: true, isDefault: false, description: 'GLM-4语音模型，支持语音交互' }
    ]
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    avatar: 'M',
    color: '#ff6b6b',
    isEnabled: false,
    apiKey: '',
    baseUrl: 'https://api.minimaxi.com/v1',
    providerType: 'openai',
    models: [
      { id: 'MiniMax-M2', name: 'MiniMax M2', provider: 'minimax', enabled: true, isDefault: false, description: 'MiniMax最新一代大模型，支持200k上下文，128k输出，具备代理能力和函数调用' },
      { id: 'MiniMax-M2-Stable', name: 'MiniMax M2 Stable', provider: 'minimax', enabled: true, isDefault: false, description: 'MiniMax M2稳定版，适合高并发场景' },
      { id: 'speech-2.6-hd', name: 'Speech 2.6 HD', provider: 'minimax', enabled: true, isDefault: false, description: '语音合成高清版，支持40种语言，7种情绪' },
      { id: 'speech-2.6-turbo', name: 'Speech 2.6 Turbo', provider: 'minimax', enabled: true, isDefault: false, description: '语音合成快速版，低延迟，支持40种语言' },
      { id: 'hailuo-2.3', name: 'Hailuo 2.3', provider: 'minimax', enabled: true, isDefault: false, description: '文本/图片生成视频，支持1080p 6s和768p 10s' },
      { id: 'hailuo-2.3-fast', name: 'Hailuo 2.3 Fast', provider: 'minimax', enabled: true, isDefault: false, description: '图片生成视频快速版，高性价比' },
      { id: 'music-2.0', name: 'Music 2.0', provider: 'minimax', enabled: true, isDefault: false, description: '文本生成音乐，增强音乐性，自然人声和流畅旋律' }
    ]
  }
];

// 获取默认模型ID
export const getDefaultModelId = (providers: ModelProvider[]): string | undefined => {
  for (const provider of providers) {
    if (provider.isEnabled) {
      const defaultModel = provider.models.find(m => m.isDefault && m.enabled);
      if (defaultModel) return defaultModel.id;

      // 如果没有默认模型，取第一个启用的模型
      const firstEnabledModel = provider.models.find(m => m.enabled);
      if (firstEnabledModel) return firstEnabledModel.id;
    }
  }
  return undefined;
};
