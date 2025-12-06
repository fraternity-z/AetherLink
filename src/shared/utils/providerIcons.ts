/**
 * 供应商图标管理工具
 * 用于获取不同主题下的模型供应商图标
 */

// 系统供应商 ID 类型
export type SystemProviderId =
  | 'openai'
  | 'openai-aisdk'
  | 'anthropic'
  | 'google'
  | 'gemini'
  | 'grok'
  | 'deepseek'
  | 'zhipu'
  | 'siliconflow'
  | 'volcengine'
  | 'doubao'
  | 'moonshot'
  | 'jina'
  | 'hunyuan'
  | 'mistral'
  | 'minimax'
  | 'yi'
  | 'baichuan'
  | 'nvidia'
  | 'perplexity'
  | 'cherryin'
  | 'silicon'
  | 'aihubmix'
  | 'ocoolai'
  | 'ppio'
  | 'alayanew'
  | 'qiniu'
  | 'dmxapi'
  | 'burncloud'
  | 'tokenflux'
  | '302ai'
  | 'cephalon'
  | 'lanyun'
  | 'ph8'
  | 'openrouter'
  | 'ollama'
  | 'new-api'
  | 'lmstudio'
  | 'azure-openai'
  | 'github'
  | 'copilot'
  | 'dashscope'
  | 'stepfun'
  | 'infini'
  | 'groq'
  | 'together'
  | 'fireworks'
  | 'hyperbolic'
  | 'modelscope'
  | 'xirang'
  | 'tencent-cloud-ti'
  | 'baidu-cloud'
  | 'gpustack'
  | 'voyageai'
  | 'aws-bedrock'
  | 'poe'
  | 'model-combo'
  | 'custom';

// 深色主题图标映射
const PROVIDER_ICONS_DARK: Record<SystemProviderId, string> = {
  gemini: '/images/providerIcons/dark/google.png',
  grok: '/images/providerIcons/dark/grok.png',
  deepseek: '/images/providerIcons/dark/deepseek.png',
  doubao: '/images/providerIcons/dark/doubao.png',
  moonshot: '/images/providerIcons/dark/moonshot.png',
  jina: '/images/providerIcons/dark/jina.png',
  hunyuan: '/images/providerIcons/dark/hunyuan.png',
  mistral: '/images/providerIcons/dark/mistral.png',
  minimax: '/images/providerIcons/dark/minimax.png',
  yi: '/images/providerIcons/dark/yi.png',
  baichuan: '/images/providerIcons/dark/baichuan.png',
  nvidia: '/images/providerIcons/dark/nvidia.png',
  perplexity: '/images/providerIcons/dark/perplexity.png',
  cherryin: '/images/providerIcons/dark/cherryIn.png',
  silicon: '/images/providerIcons/dark/silicon.png',
  siliconflow: '/images/providerIcons/dark/silicon.png',
  aihubmix: '/images/providerIcons/dark/aihubmix.png',
  ocoolai: '/images/providerIcons/dark/ocoolai.png',
  ppio: '/images/providerIcons/dark/ppio.png',
  alayanew: '/images/providerIcons/dark/alayanew.png',
  qiniu: '/images/providerIcons/dark/qiniu.png',
  dmxapi: '/images/providerIcons/dark/dmxapi.png',
  burncloud: '/images/providerIcons/dark/burncloud.png',
  tokenflux: '/images/providerIcons/dark/tokenflux.png',
  '302ai': '/images/providerIcons/dark/302ai.png',
  cephalon: '/images/providerIcons/dark/cephalon.png',
  lanyun: '/images/providerIcons/dark/lanyun.png',
  ph8: '/images/providerIcons/dark/ph8.png',
  openrouter: '/images/providerIcons/dark/openrouter.png',
  ollama: '/images/providerIcons/dark/ollama.png',
  'new-api': '/images/providerIcons/dark/newapi.png',
  lmstudio: '/images/providerIcons/dark/lmstudio.png',
  anthropic: '/images/providerIcons/dark/anthropic.png',
  openai: '/images/providerIcons/dark/openai.png',
  'openai-aisdk': '/images/providerIcons/dark/openai.png',
  'azure-openai': '/images/providerIcons/dark/azure.png',
  github: '/images/providerIcons/dark/github.png',
  copilot: '/images/providerIcons/dark/githubcopilot.png',
  zhipu: '/images/providerIcons/dark/zhipu.png',
  dashscope: '/images/providerIcons/dark/dashscope.png',
  stepfun: '/images/providerIcons/dark/stepfun.png',
  infini: '/images/providerIcons/dark/infini.png',
  groq: '/images/providerIcons/dark/groq.png',
  together: '/images/providerIcons/dark/together.png',
  fireworks: '/images/providerIcons/dark/fireworks.png',
  hyperbolic: '/images/providerIcons/dark/hyperbolic.png',
  modelscope: '/images/providerIcons/dark/modelscope.png',
  xirang: '/images/providerIcons/dark/xirang.png',
  'tencent-cloud-ti': '/images/providerIcons/dark/hunyuan.png',
  'baidu-cloud': '/images/providerIcons/dark/baidu.png',
  gpustack: '/images/providerIcons/dark/gpustack.png',
  voyageai: '/images/providerIcons/dark/voyage.png',
  'aws-bedrock': '/images/providerIcons/dark/bedrock.png',
  poe: '/images/providerIcons/dark/poe.png',
  google: '/images/providerIcons/dark/google.png',
  volcengine: '/images/providerIcons/dark/doubao.png',
  'model-combo': '/images/providerIcons/dark/openai.png',
  custom: '/images/providerIcons/dark/openai.png',
};

// 浅色主题图标映射
const PROVIDER_ICONS_LIGHT: Record<SystemProviderId, string> = {
  gemini: '/images/providerIcons/light/google.png',
  grok: '/images/providerIcons/light/grok.png',
  deepseek: '/images/providerIcons/light/deepseek.png',
  doubao: '/images/providerIcons/light/doubao.png',
  moonshot: '/images/providerIcons/light/moonshot.png',
  jina: '/images/providerIcons/light/jina.png',
  hunyuan: '/images/providerIcons/light/hunyuan.png',
  mistral: '/images/providerIcons/light/mistral.png',
  minimax: '/images/providerIcons/light/minimax.png',
  yi: '/images/providerIcons/light/yi.png',
  baichuan: '/images/providerIcons/light/baichuan.png',
  nvidia: '/images/providerIcons/light/nvidia.png',
  perplexity: '/images/providerIcons/light/perplexity.png',
  cherryin: '/images/providerIcons/light/cherryIn.png',
  silicon: '/images/providerIcons/light/silicon.png',
  siliconflow: '/images/providerIcons/light/silicon.png',
  aihubmix: '/images/providerIcons/light/aihubmix.png',
  ocoolai: '/images/providerIcons/light/ocoolai.png',
  ppio: '/images/providerIcons/light/ppio.png',
  alayanew: '/images/providerIcons/light/alayanew.png',
  qiniu: '/images/providerIcons/light/qiniu.png',
  dmxapi: '/images/providerIcons/light/dmxapi.png',
  burncloud: '/images/providerIcons/light/burncloud.png',
  tokenflux: '/images/providerIcons/light/tokenflux.png',
  '302ai': '/images/providerIcons/light/302ai.png',
  cephalon: '/images/providerIcons/light/cephalon.png',
  lanyun: '/images/providerIcons/light/lanyun.png',
  ph8: '/images/providerIcons/light/ph8.png',
  openrouter: '/images/providerIcons/light/openrouter.png',
  ollama: '/images/providerIcons/light/ollama.png',
  'new-api': '/images/providerIcons/light/newapi.png',
  lmstudio: '/images/providerIcons/light/lmstudio.png',
  anthropic: '/images/providerIcons/light/anthropic.png',
  openai: '/images/providerIcons/light/openai.png',
  'openai-aisdk': '/images/providerIcons/light/openai.png',
  'azure-openai': '/images/providerIcons/light/azure.png',
  github: '/images/providerIcons/light/github.png',
  copilot: '/images/providerIcons/light/githubcopilot.png',
  zhipu: '/images/providerIcons/light/zhipu.png',
  dashscope: '/images/providerIcons/light/dashscope.png',
  stepfun: '/images/providerIcons/light/stepfun.png',
  infini: '/images/providerIcons/light/infini.png',
  groq: '/images/providerIcons/light/groq.png',
  together: '/images/providerIcons/light/together.png',
  fireworks: '/images/providerIcons/light/fireworks.png',
  hyperbolic: '/images/providerIcons/light/hyperbolic.png',
  modelscope: '/images/providerIcons/light/modelscope.png',
  xirang: '/images/providerIcons/light/xirang.png',
  'tencent-cloud-ti': '/images/providerIcons/light/hunyuan.png',
  'baidu-cloud': '/images/providerIcons/light/baidu.png',
  gpustack: '/images/providerIcons/light/gpustack.png',
  voyageai: '/images/providerIcons/light/voyage.png',
  'aws-bedrock': '/images/providerIcons/light/bedrock.png',
  poe: '/images/providerIcons/light/poe.png',
  google: '/images/providerIcons/light/google.png',
  volcengine: '/images/providerIcons/light/doubao.png',
  'model-combo': '/images/providerIcons/light/openai.png',
  custom: '/images/providerIcons/light/openai.png',
};

// 模型名称到图标的映射（用于根据模型名称推断供应商）
const MODEL_NAME_PATTERNS: Record<string, SystemProviderId> = {
  'gpt': 'openai',
  'o1': 'openai',
  'o3': 'openai',
  'chatgpt': 'openai',
  'claude': 'anthropic',
  'gemini': 'google',
  'grok': 'grok',
  'deepseek': 'deepseek',
  'doubao': 'doubao',
  'qwen': 'dashscope',
  'moonshot': 'moonshot',
  'jina': 'jina',
  'hunyuan': 'hunyuan',
  'llama': 'openai',
  'mistral': 'mistral',
  'minimax': 'minimax',
  'yi': 'yi',
  'baichuan': 'baichuan',
  'chatglm': 'zhipu',
  'glm': 'zhipu',
  'perplexity': 'perplexity',
  'sonar': 'perplexity',
};

/**
 * 获取供应商图标路径
 * @param providerId 供应商ID
 * @param isDark 是否为深色主题
 * @returns 图标路径
 */
export function getProviderIcon(providerId: string, isDark: boolean = false): string {
  const providerIcons = isDark ? PROVIDER_ICONS_DARK : PROVIDER_ICONS_LIGHT;
  const normalizedId = providerId.toLowerCase().replace(/_/g, '-');
  
  // 直接匹配
  if (providerIcons[normalizedId as SystemProviderId]) {
    return providerIcons[normalizedId as SystemProviderId];
  }
  
  // 返回默认图标
  return providerIcons.custom;
}

/**
 * 根据模型ID和供应商ID获取图标
 * 优先尝试从模型名称推断供应商，如果无法推断则使用提供的供应商ID
 * @param modelId 模型ID
 * @param providerId 供应商ID
 * @param isDark 是否为深色主题
 * @returns 图标路径
 */
export function getModelOrProviderIcon(modelId: string, providerId: string, isDark: boolean = false): string {
  const lowerModelId = modelId.toLowerCase();
  
  // 尝试从模型名称推断供应商
  for (const [pattern, inferredProvider] of Object.entries(MODEL_NAME_PATTERNS)) {
    if (lowerModelId.includes(pattern)) {
      return getProviderIcon(inferredProvider, isDark);
    }
  }
  
  // 如果无法推断，使用提供的供应商ID
  return getProviderIcon(providerId, isDark);
}

/**
 * 获取所有支持的供应商ID列表
 * @returns 供应商ID数组
 */
export function getSupportedProviderIds(): SystemProviderId[] {
  return Object.keys(PROVIDER_ICONS_DARK) as SystemProviderId[];
}

/**
 * 检查是否支持指定的供应商
 * @param providerId 供应商ID
 * @returns 是否支持
 */
export function isProviderSupported(providerId: string): boolean {
  const normalizedId = providerId.toLowerCase().replace(/_/g, '-');
  return normalizedId in PROVIDER_ICONS_DARK;
}

