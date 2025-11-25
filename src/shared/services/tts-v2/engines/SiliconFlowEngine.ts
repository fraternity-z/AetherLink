/**
 * 硅基流动 TTS 引擎
 * CosyVoice2 API
 */

import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, SiliconFlowTTSConfig } from '../types';

export class SiliconFlowEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'siliconflow';
  readonly priority = 5;
  
  protected config: SiliconFlowTTSConfig = {
    enabled: false,
    apiKey: '',
    model: 'FunAudioLLM/CosyVoice2-0.5B',
    voice: 'FunAudioLLM/CosyVoice2-0.5B:alex',
    useStream: false,
  };
  
  protected async doInitialize(): Promise<void> {
    // 硅基流动不需要预热
  }
  
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
  
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.apiKey) {
      return { success: false, error: 'API Key 未设置' };
    }
    
    try {
      const url = 'https://api.siliconflow.cn/v1/audio/speech';
      
      // 处理语音参数格式
      let voice = this.config.voice;
      if (!voice.includes(':')) {
        voice = `${this.config.model}:${voice}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          voice: voice,
          response_format: 'mp3',
          stream: this.config.useStream,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `硅基流动 TTS 请求失败: ${response.status} ${JSON.stringify(errorData)}`,
        };
      }
      
      // 处理响应
      if (this.config.useStream && response.body) {
        return await this.handleStreamResponse(response);
      } else {
        const audioData = await response.arrayBuffer();
        return {
          success: true,
          audioData,
          mimeType: 'audio/mpeg',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 处理流式响应
   */
  private async handleStreamResponse(response: Response): Promise<TTSSynthesisResult> {
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      
      // 合并所有块
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }
      
      return {
        success: true,
        audioData: audioData.buffer,
        mimeType: 'audio/mpeg',
      };
    } finally {
      reader.releaseLock();
    }
  }
  
  stop(): void {
    // 硅基流动引擎不直接控制播放
  }
  
  updateConfig(config: Partial<SiliconFlowTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
