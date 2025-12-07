/**
 * 火山引擎 TTS 引擎 (字节跳动)
 * 支持 100+ 种音色和多种情感风格
 * 
 * 免费音色包括：
 * - BV700_streaming (灿灿) - 22种情感
 * - BV001_streaming (通用女声)
 * - BV002_streaming (通用男声)
 * - BV701_streaming (擎苍) - 10种情感
 * - BV021_streaming (东北老铁)
 * - BV503_streaming (活力女声-Ariana)
 * 等
 */

import { BaseTTSEngine } from './BaseTTSEngine';
import type { TTSEngineType, TTSSynthesisResult, VolcanoTTSConfig } from '../types';

// 火山引擎音色列表 (完整版 - 基于官方文档 https://www.volcengine.com/docs/6561/97465)
export const VOLCANO_VOICES = {
  // ========== 通用场景 ==========
  '灿灿2.0': 'BV700_V2_streaming',
  '灿灿': 'BV700_streaming',
  '炀炀': 'BV705_streaming',
  '擎苍2.0': 'BV701_V2_streaming',
  '擎苍': 'BV701_streaming',
  '通用女声2.0': 'BV001_V2_streaming',
  '通用女声': 'BV001_streaming',
  '通用男声': 'BV002_streaming',
  '超自然音色-梓梓2.0': 'BV406_V2_streaming',
  '超自然音色-梓梓': 'BV406_streaming',
  '超自然音色-燃燃2.0': 'BV407_V2_streaming',
  '超自然音色-燃燃': 'BV407_streaming',
  
  // ========== 有声阅读 ==========
  '阳光青年': 'BV123_streaming',
  '反卷青年': 'BV120_streaming',
  '通用赘婿': 'BV119_streaming',
  '古风少御': 'BV115_streaming',
  '霸气青叔': 'BV107_streaming',
  '质朴青年': 'BV100_streaming',
  '温柔淑女': 'BV104_streaming',
  '开朗青年': 'BV004_streaming',
  '甜宠少御': 'BV113_streaming',
  '儒雅青年': 'BV102_streaming',
  
  // ========== 智能助手 ==========
  '甜美小源': 'BV405_streaming',
  '亲切女声': 'BV007_streaming',
  '知性女声': 'BV009_streaming',
  '诚诚': 'BV419_streaming',
  '童童': 'BV415_streaming',
  '亲切男声': 'BV008_streaming',
  
  // ========== 视频配音 ==========
  '译制片男声': 'BV408_streaming',
  '懒小羊': 'BV426_streaming',
  '清新文艺女声': 'BV428_streaming',
  '鸡汤女声': 'BV403_streaming',
  '智慧老者': 'BV158_streaming',
  '慈爱姥姥': 'BV157_streaming',
  '说唱小哥': 'BR001_streaming',
  '活力解说男': 'BV410_streaming',
  '影视解说小帅': 'BV411_streaming',
  '解说小帅-多情感': 'BV437_streaming',
  '影视解说小美': 'BV412_streaming',
  '纨绔青年': 'BV159_streaming',
  '直播一姐': 'BV418_streaming',
  '沉稳解说男': 'BV142_streaming',
  '潇洒青年': 'BV143_streaming',
  '阳光男声': 'BV056_streaming',
  '活泼女声': 'BV005_streaming',
  '小萝莉': 'BV064_streaming',
  
  // ========== 特色音色 ==========
  '奶气萌娃': 'BV051_streaming',
  '动漫海绵': 'BV063_streaming',
  '动漫海星': 'BV417_streaming',
  '动漫小新': 'BV050_streaming',
  '天才童声': 'BV061_streaming',
  
  // ========== 广告配音 ==========
  '促销男声': 'BV401_streaming',
  '促销女声': 'BV402_streaming',
  '磁性男声': 'BV006_streaming',
  
  // ========== 新闻播报 ==========
  '新闻女声': 'BV011_streaming',
  '新闻男声': 'BV012_streaming',
  
  // ========== 教育场景 ==========
  '知性姐姐-双语': 'BV034_streaming',
  '温柔小哥': 'BV033_streaming',
  
  // ========== 方言 ==========
  // 东北话
  '东北老铁': 'BV021_streaming',
  '东北丫头': 'BV020_streaming',
  // 西安话
  '西安佟掌柜': 'BV210_streaming',
  // 上海话
  '沪上阿姐': 'BV217_streaming',
  // 广西普通话
  '广西表哥': 'BV213_streaming',
  // 台湾普通话
  '甜美台妹': 'BV025_streaming',
  '台普男声': 'BV227_streaming',
  // 粤语
  '港剧男神': 'BV026_streaming',
  '广东女仔': 'BV424_streaming',
  // 天津话
  '相声演员': 'BV212_streaming',
  // 川渝话
  '重庆小伙': 'BV019_streaming',
  '四川甜妹儿': 'BV221_streaming',
  '重庆幺妹儿': 'BV423_streaming',
  // 郑州话
  '乡村企业家': 'BV214_streaming',
  // 湖南
  '湖南妹坨': 'BV226_streaming',
  '长沙靓女': 'BV216_streaming',
  // 多方言
  '方言灿灿': 'BV704_streaming',
  
  // ========== 美式英语 ==========
  '慵懒女声-Ava': 'BV511_streaming',
  '议论女声-Alicia': 'BV505_streaming',
  '情感女声-Lawrence': 'BV138_streaming',
  '美式女声-Amelia': 'BV027_streaming',
  '讲述女声-Amanda': 'BV502_streaming',
  '活力女声-Ariana': 'BV503_streaming',
  '活力男声-Jackson': 'BV504_streaming',
  '天才少女': 'BV421_streaming',
  'Stefan': 'BV702_streaming',
  '天真萌娃-Lily': 'BV506_streaming',
  
  // ========== 英式英语 ==========
  '亲切女声-Anna': 'BV040_streaming',
  
  // ========== 澳洲英语 ==========
  '澳洲男声-Henry': 'BV516_streaming',
  
  // ========== 日语 ==========
  '元气少女': 'BV520_streaming',
  '萌系少女': 'BV521_streaming',
  '气质女声': 'BV522_streaming',
  '日语男声': 'BV524_streaming',
  
  // ========== 葡萄牙语 ==========
  '活力男声-Carlos': 'BV531_streaming',
  '活力女声-葡语': 'BV530_streaming',
  
  // ========== 西班牙语 ==========
  '气质御姐-西语': 'BV065_streaming',
} as const;

// 支持的情感/风格列表 (完整版 - 基于官方文档)
export const VOLCANO_EMOTIONS = {
  // ========== 基础情感 ==========
  'happy': '开心',
  'sad': '悲伤',
  'angry': '愤怒',
  'scare': '害怕',
  'hate': '厌恶',
  'surprise': '惊讶',
  'tear': '哭腔',
  'novel_dialog': '平和',
  
  // ========== 交流情感 ==========
  'pleased': '愉悦',
  'sorry': '抱歉',
  'annoyed': '嗔怪',
  
  // ========== 专业风格 ==========
  'customer_service': '客服',
  'professional': '专业',
  'serious': '严肃',
  'assistant': '助手',
  'advertising': '广告',
  
  // ========== 叙述风格 ==========
  'narrator': '旁白-舒缓',
  'narrator_immersive': '旁白-沉浸',
  'storytelling': '讲故事',
  'radio': '情感电台',
  'chat': '自然对话',
  
  // ========== 特色风格 ==========
  'comfort': '安慰鼓励',
  'lovey-dovey': '撒娇',
  'energetic': '可爱元气',
  'conniving': '绿茶',
  'tsundere': '傲娇',
  'charming': '娇媚',
  'yoga': '瑜伽',
} as const;

export class VolcanoEngine extends BaseTTSEngine {
  readonly name: TTSEngineType = 'volcano';
  readonly priority = 6;
  
  private static readonly HTTP_API_URL = 'https://openspeech.bytedance.com/api/v1/tts';
  
  protected config: VolcanoTTSConfig = {
    enabled: false,
    appId: '',
    accessToken: '',
    cluster: 'volcano_tts',
    voiceType: 'BV001_streaming',
    emotion: '',
    speed: 1.0,
    volume: 1.0,
    pitch: 1.0,
    encoding: 'mp3',
  };
  
  protected async doInitialize(): Promise<void> {
    // 火山引擎不需要预热
  }
  
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.appId && !!this.config.accessToken;
  }
  
  async synthesize(text: string): Promise<TTSSynthesisResult> {
    if (!this.config.appId || !this.config.accessToken) {
      return { success: false, error: 'App ID 或 Access Token 未设置' };
    }
    
    try {
      const requestBody = this.buildRequestBody(text);
      
      const response = await fetch(VolcanoEngine.HTTP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.config.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `火山引擎 TTS 请求失败: ${response.status} ${JSON.stringify(errorData)}`,
        };
      }
      
      const result = await response.json();
      
      // 检查响应状态
      if (result.code !== 3000) {
        return {
          success: false,
          error: `火山引擎 TTS 错误: ${result.message || '未知错误'} (code: ${result.code})`,
        };
      }
      
      // 解码 base64 音频数据
      if (!result.data) {
        return {
          success: false,
          error: '未收到音频数据',
        };
      }
      
      const audioData = this.base64ToArrayBuffer(result.data);
      const mimeType = this.getMimeType();
      
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
  
  stop(): void {
    // HTTP API 不需要停止操作
  }
  
  updateConfig(config: Partial<VolcanoTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 构建请求体
   */
  private buildRequestBody(text: string): Record<string, unknown> {
    const request: Record<string, unknown> = {
      app: {
        appid: this.config.appId,
        token: this.config.accessToken,
        cluster: this.config.cluster || 'volcano_tts',
      },
      user: {
        uid: 'aetherlink_user',
      },
      audio: {
        voice_type: this.config.voiceType,
        encoding: this.config.encoding || 'mp3',
        speed_ratio: this.config.speed ?? 1.0,
        volume_ratio: this.config.volume ?? 1.0,
        pitch_ratio: this.config.pitch ?? 1.0,
      },
      request: {
        reqid: this.generateRequestId(),
        text: text,
        text_type: 'plain',
        operation: 'query',
      },
    };
    
    // 添加情感参数（如果设置）
    if (this.config.emotion) {
      (request.audio as Record<string, unknown>).emotion = this.config.emotion;
    }
    
    return request;
  }
  
  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  /**
   * 获取 MIME 类型
   */
  private getMimeType(): string {
    switch (this.config.encoding) {
      case 'mp3':
        return 'audio/mpeg';
      case 'ogg_opus':
        return 'audio/ogg';
      case 'wav':
        return 'audio/wav';
      case 'pcm':
        return 'audio/pcm';
      default:
        return 'audio/mpeg';
    }
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): VolcanoTTSConfig {
    return { ...this.config };
  }
}
