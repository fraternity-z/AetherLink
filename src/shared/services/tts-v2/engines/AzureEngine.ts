/**
 * Azure TTS 引擎
 * 微软认知服务 TTS，支持 SSML
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, AzureTTSConfig } from '../types';

export class AzureEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'azure';
  readonly priority = 3;
  
  protected config: AzureTTSConfig = {
    enabled: false,
    apiKey: '',
    region: 'eastus',
    voiceName: 'zh-CN-XiaoxiaoNeural',
    language: 'zh-CN',
    rate: 'medium',
    pitch: 'medium',
    volume: 'medium',
    style: undefined,
    styleDegree: 1.0,
    role: undefined,
    useSSML: true,
  };
  
  protected async doInitialize(): Promise<void> {
    // Azure 不需要预热
  }
  
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey && !!this.config.region;
  }
  
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.apiKey || !this.config.region) {
      return { success: false, error: 'API Key 或 Region 未设置' };
    }
    
    try {
      // 创建语音配置
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.config.apiKey,
        this.config.region
      );
      speechConfig.speechSynthesisVoiceName = this.config.voiceName;
      
      // 创建合成器 (null 输出，获取音频数据)
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
      
      // 准备文本
      const textToSpeak = this.config.useSSML 
        ? this.buildSSML(text) 
        : text;
      
      // 执行合成
      return new Promise<TTSSynthesisResult>((resolve) => {
        const synthesizeMethod = this.config.useSSML 
          ? synthesizer.speakSsmlAsync.bind(synthesizer)
          : synthesizer.speakTextAsync.bind(synthesizer);
        
        synthesizeMethod(
          textToSpeak,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve({
                success: true,
                audioData: result.audioData,
                mimeType: 'audio/wav',
              });
            } else {
              resolve({
                success: false,
                error: result.errorDetails || 'Azure TTS 合成失败',
              });
            }
            synthesizer.close();
          },
          (error) => {
            resolve({
              success: false,
              error: error,
            });
            synthesizer.close();
          }
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 构建 SSML 文本
   */
  private buildSSML(text: string): string {
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this.config.language}">`;
    ssml += `<voice name="${this.config.voiceName}">`;
    
    // 韵律控制
    const prosodyAttrs: string[] = [];
    if (this.config.rate !== 'medium') prosodyAttrs.push(`rate="${this.config.rate}"`);
    if (this.config.pitch !== 'medium') prosodyAttrs.push(`pitch="${this.config.pitch}"`);
    if (this.config.volume !== 'medium') prosodyAttrs.push(`volume="${this.config.volume}"`);
    
    if (prosodyAttrs.length > 0) {
      ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
    }
    
    // 风格控制
    if (this.config.style && this.config.voiceName.includes('Neural')) {
      const styleAttrs = [`style="${this.config.style}"`];
      if (this.config.styleDegree !== 1.0) {
        styleAttrs.push(`styledegree="${this.config.styleDegree}"`);
      }
      if (this.config.role) {
        styleAttrs.push(`role="${this.config.role}"`);
      }
      ssml += `<mstts:express-as ${styleAttrs.join(' ')}>`;
    }
    
    ssml += escapedText;
    
    // 关闭标签
    if (this.config.style && this.config.voiceName.includes('Neural')) {
      ssml += '</mstts:express-as>';
    }
    if (prosodyAttrs.length > 0) {
      ssml += '</prosody>';
    }
    
    ssml += '</voice></speak>';
    
    return ssml;
  }
  
  stop(): void {
    // Azure 引擎不直接控制播放
  }
  
  updateConfig(config: Partial<AzureTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
