/**
 * OpenAI TTS 引擎
 */

import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, OpenAITTSConfig } from '../types';

export class OpenAIEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'openai';
  readonly priority = 4;
  
  protected config: OpenAITTSConfig = {
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
    responseFormat: 'mp3',
  };
  
  protected async doInitialize(): Promise<void> {
    // OpenAI 不需要预热
  }
  
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
  
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.apiKey) {
      return { success: false, error: 'API Key 未设置' };
    }
    
    try {
      const baseUrl = this.config.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
      const url = `${baseUrl}/audio/speech`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          voice: this.config.voice,
          speed: this.config.speed,
          response_format: this.config.responseFormat,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `OpenAI TTS 请求失败: ${response.status} ${JSON.stringify(errorData)}`,
        };
      }
      
      const audioData = await response.arrayBuffer();
      const mimeType = this.getMimeType(this.config.responseFormat);
      
      return {
        success: true,
        audioData,
        mimeType,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'opus': 'audio/opus',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
    };
    return mimeTypes[format] || 'audio/mpeg';
  }
  
  stop(): void {
    // OpenAI 引擎不直接控制播放，由 AudioPlayer 处理
  }
  
  updateConfig(config: Partial<OpenAITTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
