/**
 * Capacitor TTS 引擎
 * 使用设备原生 TTS，性能最佳
 */

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, CapacitorTTSConfig } from '../types';

export class CapacitorEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'capacitor';
  readonly priority = 1; // 最高优先级
  
  protected config: CapacitorTTSConfig = {
    enabled: false,
    language: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };
  
  /**
   * 预热引擎 - 关键优化
   */
  protected async doInitialize(): Promise<void> {
    try {
      // 查询支持的语言触发引擎绑定 (参考 Kelivo 的 _kickEngine)
      const languages = await TextToSpeech.getSupportedLanguages();
      console.log('Capacitor TTS 预热完成，支持语言数:', languages.languages?.length || 0);
      
      // 尝试获取语音列表
      try {
        const voices = await TextToSpeech.getSupportedVoices();
        console.log('Capacitor TTS 语音数:', voices.voices?.length || 0);
      } catch {
        // 某些平台可能不支持
      }
    } catch (error) {
      console.warn('Capacitor TTS 预热失败 (可能不在原生环境):', error);
      throw error;
    }
  }
  
  /**
   * 合成并播放 (原生 TTS 直接播放)
   */
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    try {
      await TextToSpeech.speak({
        text,
        lang: this.config.language,
        rate: this.config.rate,
        pitch: this.config.pitch,
        volume: this.config.volume,
        category: 'ambient',
        queueStrategy: 0, // 立即播放
      });
      
      return {
        success: true,
        directPlay: true, // 标记为已直接播放
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 直接播放接口
   */
  async speak(text: string): Promise<boolean> {
    const result = await this.synthesize(text);
    return result.success;
  }
  
  /**
   * 停止播放
   */
  stop(): void {
    try {
      TextToSpeech.stop();
    } catch (error) {
      console.warn('停止 Capacitor TTS 失败:', error);
    }
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<CapacitorTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
