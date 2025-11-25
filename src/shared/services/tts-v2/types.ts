/**
 * TTS V2 类型定义
 */

// TTS 引擎类型
export type TTSEngineType = 
  | 'capacitor'    // 原生设备 TTS
  | 'gemini'       // Google Gemini TTS
  | 'azure'        // 微软 Azure TTS
  | 'openai'       // OpenAI TTS
  | 'siliconflow'  // 硅基流动 TTS
  | 'webspeech';   // 浏览器 Web Speech API

// 基础配置接口
export interface TTSBaseConfig {
  enabled: boolean;
}

// Capacitor TTS 配置
export interface CapacitorTTSConfig extends TTSBaseConfig {
  language: string;      // 语言代码 (zh-CN, en-US)
  rate: number;          // 语速 (0.0-1.0)
  pitch: number;         // 音调 (0.0-2.0)
  volume: number;        // 音量 (0.0-1.0)
}

// OpenAI TTS 配置
export interface OpenAITTSConfig extends TTSBaseConfig {
  apiKey: string;
  baseUrl?: string;
  model: 'tts-1' | 'tts-1-hd';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;         // 0.25-4.0
  responseFormat: 'mp3' | 'opus' | 'aac' | 'flac';
}

// Azure TTS 配置
export interface AzureTTSConfig extends TTSBaseConfig {
  apiKey: string;
  region: string;
  voiceName: string;
  language: string;
  rate: string;          // x-slow, slow, medium, fast, x-fast
  pitch: string;         // x-low, low, medium, high, x-high
  volume: string;        // silent, x-soft, soft, medium, loud, x-loud
  style?: string;        // cheerful, sad, angry, etc.
  styleDegree?: number;  // 0.01-2.0
  role?: string;         // Girl, Boy, etc.
  useSSML: boolean;
}

// Gemini TTS 配置
export interface GeminiTTSConfig extends TTSBaseConfig {
  apiKey: string;
  model: 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';
  voice: string;         // 30种预设语音
  stylePrompt?: string;  // 风格提示词
  useMultiSpeaker: boolean;
  speakers?: Array<{ speaker: string; voiceName: string }>;
}

// 硅基流动 TTS 配置
export interface SiliconFlowTTSConfig extends TTSBaseConfig {
  apiKey: string;
  model: string;
  voice: string;
  useStream: boolean;
}

// Web Speech API 配置
export interface WebSpeechTTSConfig extends TTSBaseConfig {
  voice?: string;
  rate: number;
  pitch: number;
  volume: number;
}

// 所有配置联合类型
export type TTSEngineConfig = 
  | { type: 'capacitor'; config: CapacitorTTSConfig }
  | { type: 'openai'; config: OpenAITTSConfig }
  | { type: 'azure'; config: AzureTTSConfig }
  | { type: 'gemini'; config: GeminiTTSConfig }
  | { type: 'siliconflow'; config: SiliconFlowTTSConfig }
  | { type: 'webspeech'; config: WebSpeechTTSConfig };

// TTS 引擎接口
export interface ITTSEngine {
  /** 引擎名称 */
  readonly name: TTSEngineType;
  /** 优先级 (数字越小优先级越高) */
  readonly priority: number;
  
  /** 初始化/预热引擎 */
  initialize(): Promise<void>;
  
  /** 检查引擎是否可用 */
  isAvailable(): boolean;
  
  /** 合成语音，返回音频数据 */
  synthesize(text: string): Promise<TTSSynthesisResult>;
  
  /** 直接播放 (用于原生TTS) */
  speak?(text: string): Promise<boolean>;
  
  /** 停止播放 */
  stop(): void;
  
  /** 更新配置 */
  updateConfig(config: Partial<TTSBaseConfig>): void;
}

// 合成结果
export interface TTSSynthesisResult {
  success: boolean;
  audioData?: ArrayBuffer;
  mimeType?: string;
  error?: string;
  /** 是否已直接播放 (原生TTS) */
  directPlay?: boolean;
}

// 播放状态
export interface TTSPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentMessageId: string | null;
  currentEngine: TTSEngineType | null;
  error: string | null;
}

// 播放事件
export type TTSEventType = 'start' | 'end' | 'pause' | 'resume' | 'error';

export interface TTSEvent {
  type: TTSEventType;
  messageId?: string;
  error?: string;
}

export type TTSEventCallback = (event: TTSEvent) => void;
