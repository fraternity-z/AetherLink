/**
 * 硅基流动 TTS 引擎
 * 支持模型：
 * - FunAudioLLM/CosyVoice2-0.5B: 多语言语音合成（中、英、日、韩、方言）
 * - fnlp/MOSS-TTSD-v0.5: 高表现力双人对话语音合成
 * - IndexTeam/IndexTTS-2: B站开源情感语音合成，精确时长控制
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
    // MOSS-TTSD 默认值
    speed: 1,
    gain: 0,
    maxTokens: 1600,
    references: [],
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
      
      // 根据模型类型构建请求体
      const requestBody = this.buildRequestBody(text);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
  
  /**
   * 根据模型类型构建请求体
   */
  private buildRequestBody(text: string): Record<string, unknown> {
    const isMossTTSD = this.config.model === 'fnlp/MOSS-TTSD-v0.5';
    const isIndexTTS2 = this.config.model === 'IndexTeam/IndexTTS-2';
    
    if (isMossTTSD) {
      // MOSS-TTSD 模型请求体
      // 支持预置音色和参考音频两种模式
      let voice = this.config.voice;
      if (voice && !voice.includes(':')) {
        voice = `${this.config.model}:${voice}`;
      }
      
      const requestBody: Record<string, unknown> = {
        model: this.config.model,
        input: text,
        voice: voice || undefined,
        stream: this.config.useStream,
        response_format: 'mp3',
        speed: this.config.speed ?? 1,
        gain: this.config.gain ?? 0,
        max_tokens: this.config.maxTokens ?? 1600,
      };
      
      // 如果提供了自定义参考音频，也添加进去
      if (this.config.references && this.config.references.length > 0) {
        requestBody.references = this.config.references;
      }
      
      return requestBody;
    } else if (isIndexTTS2) {
      // IndexTTS-2 模型请求体
      // 支持情感控制、精确时长控制、零样本语音克隆
      let voice = this.config.voice;
      if (!voice.includes(':')) {
        voice = `${this.config.model}:${voice}`;
      }
      
      const requestBody: Record<string, unknown> = {
        model: this.config.model,
        input: text,
        voice: voice,
        stream: this.config.useStream,
        response_format: 'mp3',
        speed: this.config.speed ?? 1,
        gain: this.config.gain ?? 0,
      };
      
      // 如果有自定义参考音频，添加到请求中
      if (this.config.references && this.config.references.length > 0) {
        requestBody.references = this.config.references;
      }
      
      return requestBody;
    } else {
      // CosyVoice2 模型请求体
      let voice = this.config.voice;
      if (!voice.includes(':')) {
        voice = `${this.config.model}:${voice}`;
      }
      
      return {
        model: this.config.model,
        input: text,
        voice: voice,
        response_format: 'mp3',
        stream: this.config.useStream,
      };
    }
  }
}
