/**
 * MiniMax TTS 引擎
 * 支持高质量中文语音合成，包含情感控制和粤语支持
 */

import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, MiniMaxTTSConfig } from '../types';

// MiniMax 预设语音列表
export const MINIMAX_VOICES = [
  // 中文普通话女声
  { id: 'female-tianmei', name: '甜美女声', description: '甜美温柔的女性声音', language: 'zh' },
  { id: 'female-shaonv', name: '少女', description: '年轻活泼的少女声音', language: 'zh' },
  { id: 'female-yujie', name: '御姐', description: '成熟魅力的女性声音', language: 'zh' },
  { id: 'female-chengshu', name: '成熟女声', description: '稳重大气的女性声音', language: 'zh' },
  // 中文普通话男声
  { id: 'male-qn-qingse', name: '青涩青年', description: '年轻清新的男性声音', language: 'zh' },
  { id: 'male-qn-jingying', name: '精英青年', description: '专业自信的男性声音', language: 'zh' },
  { id: 'male-qn-badaozongjie', name: '霸道总裁', description: '低沉有磁性的男性声音', language: 'zh' },
  { id: 'male-qn-daxuesheng', name: '大学生', description: '朝气蓬勃的男性声音', language: 'zh' },
  // 主持人声音
  { id: 'presenter_male', name: '男性主持人', description: '专业播音风格男声', language: 'zh' },
  { id: 'presenter_female', name: '女性主持人', description: '专业播音风格女声', language: 'zh' },
  // 粤语声音
  { id: 'Chinese (Mandarin)_Warm_Bestie', name: '温暖闺蜜（粤语兼容）', description: '支持粤语的温暖女声', language: 'yue' },
  { id: 'Cantonese_Female_1', name: '粤语女声1', description: '标准粤语女声', language: 'yue' },
  // 英语声音
  { id: 'English_Male_1', name: '英语男声', description: '标准英语男声', language: 'en' },
  { id: 'English_Female_1', name: '英语女声', description: '标准英语女声', language: 'en' },
];

// MiniMax 模型列表
export const MINIMAX_MODELS = [
  { id: 'speech-02-hd', name: 'Speech 02 HD', description: '高清语音模型' },
  { id: 'speech-02', name: 'Speech 02', description: '标准语音模型' },
  { id: 'speech-01-hd', name: 'Speech 01 HD', description: '旧版高清模型' },
  { id: 'speech-01', name: 'Speech 01', description: '旧版标准模型' },
];

// 情感选项
export const MINIMAX_EMOTIONS = [
  { id: 'neutral', name: '中性', description: '自然平和' },
  { id: 'happy', name: '开心', description: '愉快积极' },
  { id: 'sad', name: '悲伤', description: '忧郁低沉' },
  { id: 'angry', name: '愤怒', description: '激动强烈' },
  { id: 'fearful', name: '恐惧', description: '紧张害怕' },
  { id: 'disgusted', name: '厌恶', description: '不满反感' },
  { id: 'surprised', name: '惊讶', description: '惊奇意外' },
  { id: 'calm', name: '平静', description: '舒缓安宁' },
];

// 语言增强选项
export const MINIMAX_LANGUAGE_BOOST = [
  { id: '', name: '自动', description: '自动检测语言' },
  { id: 'Chinese', name: '中文普通话', description: '优化普通话发音' },
  { id: 'Chinese,Yue', name: '粤语', description: '优化粤语发音' },
  { id: 'English', name: '英语', description: '优化英语发音' },
  { id: 'Japanese', name: '日语', description: '优化日语发音' },
  { id: 'Korean', name: '韩语', description: '优化韩语发音' },
];

export class MiniMaxEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'minimax';
  readonly priority = 7;

  protected config: MiniMaxTTSConfig = {
    enabled: false,
    apiKey: '',
    groupId: '',
    baseUrl: 'https://api.minimaxi.chat',
    model: 'speech-02-hd',
    voiceId: 'female-tianmei',
    emotion: 'neutral',
    speed: 1.0,
    pitch: 0,
    languageBoost: '',
    useStream: false,
  };

  protected async doInitialize(): Promise<void> {
    // MiniMax 不需要预热
  }

  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey && !!this.config.groupId;
  }

  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.apiKey) {
      return { success: false, error: 'MiniMax API Key 未设置' };
    }

    if (!this.config.groupId) {
      return { success: false, error: 'MiniMax Group ID 未设置' };
    }

    try {
      const baseUrl = this.config.baseUrl?.replace(/\/$/, '') || 'https://api.minimaxi.chat';
      const url = `${baseUrl}/v1/t2a_v2?GroupId=${this.config.groupId}`;

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        text,
        model: this.config.model,
        stream: this.config.useStream ?? false,
        voice_setting: {
          voice_id: this.config.voiceId,
          speed: this.config.speed ?? 1.0,
          pitch: this.config.pitch ?? 0,
          emotion: this.config.emotion ?? 'neutral',
        },
      };

      // 添加语言增强
      if (this.config.languageBoost) {
        requestBody.language_boost = this.config.languageBoost;
      }

      // 如果使用流式传输
      if (this.config.useStream) {
        return this.synthesizeStream(url, requestBody);
      }

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
          error: `MiniMax TTS 请求失败: ${response.status} ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json();

      // 检查响应
      if (data.base_resp?.status_code !== 0) {
        return {
          success: false,
          error: `MiniMax TTS 错误: ${data.base_resp?.status_msg || '未知错误'}`,
        };
      }

      // 解码 hex 音频数据
      const audioHex = data.data?.audio;
      if (!audioHex) {
        return {
          success: false,
          error: 'MiniMax TTS 未返回音频数据',
        };
      }

      const audioData = this.hexToArrayBuffer(audioHex);

      return {
        success: true,
        audioData,
        mimeType: 'audio/mpeg',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 流式合成语音
   */
  private async synthesizeStream(url: string, requestBody: Record<string, unknown>): Promise<TTSSynthesisResult> {
    try {
      // 确保请求流式响应
      requestBody.stream = true;
      requestBody.stream_options = {
        exclude_aggregated_audio: true,
      };
      requestBody.output_format = 'hex';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `MiniMax TTS 流式请求失败: ${response.status} ${errorText}`,
        };
      }

      if (!response.body) {
        return {
          success: false,
          error: 'MiniMax TTS 流式响应体为空',
        };
      }

      // 读取 SSE 流
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const audioChunks: Uint8Array[] = [];
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 解析 SSE 事件
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;

            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const obj = JSON.parse(dataStr);
              const audioHex = obj.data?.audio;
              
              // 跳过状态为 2 的最终汇总块
              if (obj.data?.status === 2) continue;

              if (audioHex) {
                const chunk = this.hexToUint8Array(audioHex);
                audioChunks.push(chunk);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 合并所有音频块
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      return {
        success: true,
        audioData: audioData.buffer.slice(0) as ArrayBuffer,
        mimeType: 'audio/mpeg',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 将 hex 字符串转换为 ArrayBuffer
   */
  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const uint8Array = this.hexToUint8Array(hex);
    return uint8Array.buffer.slice(0) as ArrayBuffer;
  }

  /**
   * 将 hex 字符串转换为 Uint8Array
   */
  private hexToUint8Array(hex: string): Uint8Array {
    const clean = hex.replace(/\s+/g, '');
    if (clean.length % 2 !== 0) {
      throw new Error('Hex 字符串长度必须为偶数');
    }
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return bytes;
  }

  stop(): void {
    // MiniMax 引擎不直接控制播放，由 AudioPlayer 处理
  }

  updateConfig(config: Partial<MiniMaxTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): MiniMaxTTSConfig {
    return { ...this.config };
  }
}
