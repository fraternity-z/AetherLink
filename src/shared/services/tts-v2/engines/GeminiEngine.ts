/**
 * Gemini TTS 引擎
 * Google Gemini 2.5 TTS API
 */

import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, GeminiTTSConfig } from '../types';

export class GeminiEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'gemini';
  readonly priority = 2;
  
  protected config: GeminiTTSConfig = {
    enabled: false,
    apiKey: '',
    model: 'gemini-2.5-flash-preview-tts',
    voice: 'Kore',
    stylePrompt: '',
    useMultiSpeaker: false,
    speakers: [],
  };
  
  protected async doInitialize(): Promise<void> {
    // Gemini 不需要预热
  }
  
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }
  
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.apiKey) {
      return { success: false, error: 'API Key 未设置' };
    }
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`;
      
      // 构建提示词
      let promptText = text;
      if (this.config.stylePrompt) {
        promptText = `${this.config.stylePrompt} ${text}`;
      }
      
      // 构建请求体
      const requestBody: Record<string, unknown> = {
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: this.buildSpeechConfig(),
        },
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Gemini TTS 请求失败: ${response.status} ${JSON.stringify(errorData)}`,
        };
      }
      
      const responseData = await response.json();
      const audioData = responseData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioData) {
        return { success: false, error: '响应中没有音频数据' };
      }
      
      // Base64 解码
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // PCM 转 WAV
      const wavData = this.pcmToWav(bytes, 24000, 1, 16);
      
      return {
        success: true,
        audioData: wavData.buffer as ArrayBuffer,
        mimeType: 'audio/wav',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private buildSpeechConfig(): Record<string, unknown> {
    if (this.config.useMultiSpeaker && this.config.speakers && this.config.speakers.length > 0) {
      return {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: this.config.speakers.slice(0, 2).map(speaker => ({
            speaker: speaker.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: speaker.voiceName }
            }
          }))
        }
      };
    }
    
    return {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: this.config.voice }
      }
    };
  }
  
  /**
   * PCM 转 WAV 格式
   */
  private pcmToWav(pcm: Uint8Array, sampleRate: number, channels: number, bitsPerSample: number): Uint8Array {
    const dataLength = pcm.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    
    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
    view.setUint16(32, channels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    
    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // PCM data
    const dataView = new Uint8Array(buffer, 44);
    dataView.set(pcm);
    
    return new Uint8Array(buffer);
  }
  
  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  stop(): void {
    // Gemini 引擎不直接控制播放
  }
  
  updateConfig(config: Partial<GeminiTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
